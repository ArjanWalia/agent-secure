/**
 * Workspace tools available to the Worker Agent.
 * Every call is intercepted by the orchestrator and scanned by
 * Flow-Scan + Importance-Scan before it is allowed to execute.
 * All paths are confined to ./workspace — escapes are rejected.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { WORKSPACE } = require("./memory");

const MAX_READ = 50_000;
const MAX_CMD_OUT = 20_000;

const TOOL_DEFS = [
  {
    name: "list_files",
    description:
      "List files in the workspace as a tree with sizes. Use before reading or writing to discover what exists.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory relative to the workspace root. Defaults to '.'" },
      },
    },
  },
  {
    name: "read_file",
    description: "Read a file from the workspace and return its contents.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to the workspace root." },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Create or overwrite a file in the workspace. Parent directories are created automatically.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to the workspace root." },
        content: { type: "string", description: "Full new file contents." },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a file from the workspace.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to the workspace root." },
      },
      required: ["path"],
    },
  },
  {
    name: "run_command",
    description:
      "Run a shell command inside the workspace sandbox (cwd is the workspace root, 15s timeout). " +
      "Use for builds, scripts, git, grep, etc.",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command to execute." },
      },
      required: ["command"],
    },
  },
];

/** Resolve a workspace-relative path; throw on sandbox escape. */
function safePath(p) {
  const resolved = path.resolve(WORKSPACE, p || ".");
  if (resolved !== WORKSPACE && !resolved.startsWith(WORKSPACE + path.sep)) {
    throw new Error(`Path escapes the workspace sandbox: ${p}`);
  }
  return resolved;
}

function rel(abs) {
  return path.relative(WORKSPACE, abs).split(path.sep).join("/") || ".";
}

/** Paths a request will touch — context for Importance-Scan. */
function affectedPaths(tool, input) {
  switch (tool) {
    case "read_file":
    case "write_file":
    case "delete_file":
      return input?.path ? [String(input.path).replace(/^\.\//, "")] : [];
    case "list_files":
      return [String(input?.path || ".").replace(/^\.\//, "")];
    case "run_command":
      return []; // IS judges the command text itself
    default:
      return [];
  }
}

/** One-line human summary of a request, for the ledger and the UI. */
function summarizeInput(tool, input) {
  switch (tool) {
    case "run_command":
      return String(input?.command || "").slice(0, 300);
    case "write_file":
      return `${input?.path} (${(input?.content || "").length} bytes)`;
    default:
      return String(input?.path || JSON.stringify(input || {})).slice(0, 300);
  }
}

function listTree(dir, prefix = "", depth = 0) {
  if (depth > 6) return `${prefix}…\n`;
  let out = "";
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.name !== "node_modules" && e.name !== ".git")
      .sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));
  } catch (err) {
    return `${prefix}[unreadable: ${err.message}]\n`;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out += `${prefix}${e.name}/\n`;
      out += listTree(full, prefix + "  ", depth + 1);
    } else {
      const size = fs.statSync(full).size;
      out += `${prefix}${e.name}  (${size} B)\n`;
    }
  }
  return out;
}

/** Execute an approved request. Returns {ok, output}. */
function execute(tool, input) {
  try {
    switch (tool) {
      case "list_files": {
        const dir = safePath(input?.path || ".");
        if (!fs.existsSync(dir)) return { ok: false, output: `No such directory: ${input?.path}` };
        const tree = listTree(dir) || "(empty)";
        return { ok: true, output: `${rel(dir)}/\n${tree}` };
      }
      case "read_file": {
        const file = safePath(input.path);
        if (!fs.existsSync(file)) return { ok: false, output: `No such file: ${input.path}` };
        let body = fs.readFileSync(file, "utf8");
        if (body.length > MAX_READ) body = body.slice(0, MAX_READ) + `\n…[truncated at ${MAX_READ} chars]`;
        return { ok: true, output: body };
      }
      case "write_file": {
        const file = safePath(input.path);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, input.content ?? "");
        return { ok: true, output: `Wrote ${(input.content ?? "").length} bytes to ${rel(file)}` };
      }
      case "delete_file": {
        const file = safePath(input.path);
        if (!fs.existsSync(file)) return { ok: false, output: `No such file: ${input.path}` };
        fs.unlinkSync(file);
        return { ok: true, output: `Deleted ${rel(file)}` };
      }
      case "run_command": {
        const r = spawnSync(input.command, {
          shell: true,
          cwd: WORKSPACE,
          timeout: 15_000,
          encoding: "utf8",
          maxBuffer: 1 << 20,
        });
        let out = (r.stdout || "") + (r.stderr ? `\n[stderr]\n${r.stderr}` : "");
        if (out.length > MAX_CMD_OUT) out = out.slice(0, MAX_CMD_OUT) + `\n…[truncated]`;
        if (r.error) return { ok: false, output: `Command failed: ${r.error.message}` };
        return { ok: r.status === 0, output: `[exit ${r.status}]\n${out.trim() || "(no output)"}` };
      }
      default:
        return { ok: false, output: `Unknown tool: ${tool}` };
    }
  } catch (err) {
    return { ok: false, output: `Tool error: ${err.message}` };
  }
}

/** Read an excerpt of a workspace file for Importance-Scan profiling. */
function fileExcerpt(relPath, limit = 2500) {
  try {
    const file = safePath(relPath);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
    return fs.readFileSync(file, "utf8").slice(0, limit);
  } catch {
    return null;
  }
}

module.exports = { TOOL_DEFS, execute, affectedPaths, summarizeInput, fileExcerpt, safePath };

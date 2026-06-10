/**
 * State Management Layer — the orchestrator's memory.
 *
 * LLM APIs are stateless, so all continuity lives here on the host OS:
 *   - conversation_log.json  → Worker Agent memory (full chat history)
 *   - flow_ledger.json       → Flow-Scan memory (approved prompt→request pairs)
 *   - file_registry.json     → Importance-Scan memory (per-file importance/privacy profiles)
 *   - .env                   → ANTHROPIC_API_KEY + MAX_TOKEN_OUTPUT (cooperative token budget)
 *   - config.json            → per-agent model selection
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const WORKSPACE = path.join(ROOT, "workspace");
const ENV_PATH = path.join(ROOT, ".env");

const FILES = {
  conversation: path.join(DATA_DIR, "conversation_log.json"),
  ledger: path.join(DATA_DIR, "flow_ledger.json"),
  registry: path.join(DATA_DIR, "file_registry.json"),
  config: path.join(DATA_DIR, "config.json"),
};

const DEFAULT_MAX_TOKEN_OUTPUT = 4096;
const TOKEN_FLOOR = 256;
const TOKEN_CEIL = 16000;

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(WORKSPACE, { recursive: true });
}

function loadJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* ---------------- .env ---------------- */

function readEnv() {
  const map = {};
  try {
    for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) map[m[1]] = m[2];
    }
  } catch { /* no .env yet */ }
  return map;
}

function writeEnv(updates) {
  const merged = { ...readEnv(), ...updates };
  const body =
    "# AGENT:SECURE — managed by the orchestrator.\n" +
    "# MAX_TOKEN_OUTPUT is set cooperatively by Flow-Scan + Importance-Scan\n" +
    "# before each approved worker execution.\n" +
    Object.entries(merged).map(([k, v]) => `${k}=${v}`).join("\n") +
    "\n";
  fs.writeFileSync(ENV_PATH, body);
  return merged;
}

function getApiKey() {
  return readEnv().ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || null;
}

function setApiKey(key) {
  writeEnv({ ANTHROPIC_API_KEY: key });
}

function getMaxTokenOutput() {
  const n = parseInt(readEnv().MAX_TOKEN_OUTPUT, 10);
  return Number.isFinite(n) ? clampTokens(n) : DEFAULT_MAX_TOKEN_OUTPUT;
}

function setMaxTokenOutput(n) {
  const v = clampTokens(n);
  writeEnv({ MAX_TOKEN_OUTPUT: String(v) });
  return v;
}

function clampTokens(n) {
  return Math.max(TOKEN_FLOOR, Math.min(TOKEN_CEIL, Math.round(n)));
}

/* ---------------- config (model selection) ---------------- */

const DEFAULT_MODELS = {
  worker: "claude-opus-4-8",
  flowscan: "claude-opus-4-8",
  importancescan: "claude-opus-4-8",
};

function getConfig() {
  const cfg = loadJSON(FILES.config, {});
  return { models: { ...DEFAULT_MODELS, ...(cfg.models || {}) } };
}

function setModels(models) {
  const cfg = getConfig();
  cfg.models = { ...cfg.models, ...models };
  saveJSON(FILES.config, cfg);
  return cfg;
}

/* ---------------- worker memory: conversation log ---------------- */

function getConversation() {
  return loadJSON(FILES.conversation, []);
}

function appendConversation(message) {
  const log = getConversation();
  log.push(message);
  saveJSON(FILES.conversation, log);
  return log;
}

function clearConversation() {
  saveJSON(FILES.conversation, []);
}

/**
 * Self-heal the conversation log. The API requires every `tool_use` block to be
 * answered by a `tool_result` in the immediately following user message. A crash,
 * server restart mid-run, or an approval pending at shutdown can persist a dangling
 * `tool_use` — which would poison every subsequent request with a 400. Walk the log
 * and patch any unmatched ids with synthetic error results.
 */
function repairConversation() {
  const log = getConversation();
  const fixed = [];
  let changed = false;

  for (let i = 0; i < log.length; i++) {
    const msg = log[i];
    fixed.push(msg);

    const toolUseIds =
      msg.role === "assistant" && Array.isArray(msg.content)
        ? msg.content.filter((b) => b.type === "tool_use").map((b) => b.id)
        : [];
    if (!toolUseIds.length) continue;

    const next = log[i + 1];
    const nextResultIds =
      next && next.role === "user" && Array.isArray(next.content)
        ? next.content.filter((b) => b.type === "tool_result").map((b) => b.tool_use_id)
        : [];

    const missing = toolUseIds.filter((id) => !nextResultIds.includes(id));
    if (!missing.length) continue;

    changed = true;
    const synthetic = missing.map((id) => ({
      type: "tool_result",
      tool_use_id: id,
      is_error: true,
      content:
        "No result recorded — the orchestrator was interrupted before this request completed. Treat it as not executed.",
    }));

    if (nextResultIds.length) {
      // partial batch: prepend the missing results into the existing result message
      next.content = [...synthetic, ...next.content];
    } else {
      fixed.push({ role: "user", content: synthetic });
    }
  }

  if (changed) saveJSON(FILES.conversation, fixed);
  return changed;
}

/** Flatten the structured log into displayable {role, text} turns for the UI. */
function transcript() {
  const out = [];
  for (const m of getConversation()) {
    if (typeof m.content === "string") {
      out.push({ role: m.role, text: m.content });
    } else if (Array.isArray(m.content)) {
      const text = m.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (text) out.push({ role: m.role, text });
    }
  }
  return out;
}

/* ---------------- flow-scan memory: contextual ledger ---------------- */

function getLedger() {
  return loadJSON(FILES.ledger, []);
}

function appendLedger(entry) {
  const ledger = getLedger();
  ledger.push({ ts: new Date().toISOString(), ...entry });
  saveJSON(FILES.ledger, ledger);
  return ledger;
}

/* ---------------- importance-scan memory: file registry ---------------- */

function getRegistry() {
  return loadJSON(FILES.registry, {});
}

function saveRegistry(reg) {
  saveJSON(FILES.registry, reg);
}

/** Walk the workspace and make sure every file has at least an unprofiled entry. */
function indexWorkspace() {
  const reg = getRegistry();
  const seen = new Set();

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".git") continue;
        walk(full);
      } else {
        const rel = path.relative(WORKSPACE, full).split(path.sep).join("/");
        seen.add(rel);
        const stat = fs.statSync(full);
        reg[rel] = {
          profiled: false,
          importance: null,
          privacy: null,
          summary: null,
          ...reg[rel],
          size: stat.size,
          ext: path.extname(e.name) || "(none)",
          first_seen: reg[rel]?.first_seen || new Date().toISOString(),
        };
      }
    }
  }

  walk(WORKSPACE);
  for (const key of Object.keys(reg)) {
    if (!seen.has(key)) delete reg[key]; // file no longer exists
  }
  saveRegistry(reg);
  return reg;
}

/** Merge Importance-Scan's fresh profiles back into the registry. */
function applyProfiles(profiles) {
  if (!Array.isArray(profiles) || !profiles.length) return getRegistry();
  const reg = getRegistry();
  for (const p of profiles) {
    if (!p || !p.path) continue;
    const key = String(p.path).replace(/^\.\//, "");
    reg[key] = {
      size: null,
      ext: path.extname(key) || "(none)",
      first_seen: new Date().toISOString(),
      ...reg[key],
      profiled: true,
      importance: clampScore(p.importance),
      privacy: clampScore(p.privacy),
      summary: String(p.summary || "").slice(0, 240),
      last_accessed: new Date().toISOString(),
    };
  }
  saveRegistry(reg);
  return reg;
}

function clampScore(n) {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
}

module.exports = {
  ROOT, WORKSPACE, ENV_PATH,
  DEFAULT_MAX_TOKEN_OUTPUT, TOKEN_FLOOR, TOKEN_CEIL,
  ensureDirs,
  getApiKey, setApiKey,
  getMaxTokenOutput, setMaxTokenOutput, clampTokens,
  getConfig, setModels,
  getConversation, appendConversation, clearConversation, repairConversation, transcript,
  getLedger, appendLedger,
  getRegistry, indexWorkspace, applyProfiles, clampScore,
};

/**
 * The orchestrator — the "brain" that owns all memory and drives the
 * three stateless models. Every worker tool request flows through:
 *
 *   worker request ──▶ FLOW-SCAN (FS) ──▶ IMPORTANCE-SCAN (IS) ──▶ decision matrix
 *
 *   Decision matrix:
 *     FS 51-100                → FREEZE agent + report to user
 *     FS 21-50                 → REPORT to user (approve/deny)
 *     FS 0-20  AND  IS 81-100  → REPORT to user (approve/deny)
 *     everything else          → APPROVE
 *
 *   On approval the two scanners' token recommendations are combined
 *   cooperatively into MAX_TOKEN_OUTPUT (written to .env) — the worker is
 *   provisioned only the tokens needed for that step.
 */
const { EventEmitter } = require("events");
const memory = require("./memory");
const tools = require("./tools");
const agents = require("./agents");

const MAX_ITERATIONS = 12;
const MAX_RESULT_CHARS = 20_000;

class Orchestrator extends EventEmitter {
  constructor() {
    super();
    this.status = "idle"; // idle | working | pending | frozen | halted
    this.busy = false;
    this.reqCounter = 0;
    this.pending = null; // { id, payload, resolve }
    this.unlimitedTokens = false; // user-granted, lasts for the current run only
  }

  emitEvent(type, data = {}) {
    this.emit("event", { type, ts: Date.now(), ...data });
  }

  setStatus(status) {
    this.status = status;
    this.emitEvent("agent_state", { status });
  }

  decide(fsScore, isScore) {
    if (fsScore >= 51) return "freeze";
    if (fsScore >= 21) return "report";
    if (fsScore <= 20 && isScore >= 81) return "report";
    return "approve";
  }

  /**
   * The two scan models cooperatively set the worker's token provision.
   * While a user-granted unlimited run is active, the cooperative value is
   * still persisted to .env (it applies from the next run) but the live
   * grant stays uncapped.
   */
  provisionTokens(fsRec, isRec, requestId) {
    const budget = memory.setMaxTokenOutput(Math.round((fsRec + isRec) / 2));
    if (this.unlimitedTokens) {
      this.emitEvent("env_updated", { maxTokenOutput: "unlimited", id: requestId });
      return "unlimited";
    }
    this.emitEvent("env_updated", { maxTokenOutput: budget, id: requestId });
    return budget;
  }

  /** Resolves when the user clicks approve/deny in the UI. */
  awaitUserDecision(payload) {
    return new Promise((resolve) => {
      this.pending = { id: payload.id, payload, resolve };
      this.setStatus("pending");
      this.emitEvent("approval_required", payload);
    });
  }

  /** Worker exhausted its provisioned budget — ask the user to lift the cap. */
  awaitTokenDecision(budget, prompt) {
    return new Promise((resolve) => {
      const id = `tok_${++this.reqCounter}_${Date.now()}`;
      const payload = { id, kind: "tokens", budget, prompt };
      this.pending = { id, payload, resolve };
      this.setStatus("pending");
      this.emitEvent("token_approval_required", payload);
    });
  }

  resolveDecision(id, approve) {
    if (!this.pending || this.pending.id !== id) {
      throw new Error("No matching pending request");
    }
    const { resolve, payload } = this.pending;
    this.pending = null;
    this.emitEvent("user_decision", { id, seq: payload.seq, kind: payload.kind || "security", approve });
    resolve(approve);
  }

  reactivate() {
    if (this.status !== "frozen" && this.status !== "halted") {
      throw new Error(`Agent is not frozen or halted (status: ${this.status})`);
    }
    this.setStatus("idle");
  }

  /**
   * Scan one intercepted tool request. Returns:
   *   { action: "execute" | "reject", verdict, fs, is }
   */
  async scanRequest(client, models, { prompt, toolName, input, requestId, seq }) {
    const inputSummary = tools.summarizeInput(toolName, input);
    const paths = tools.affectedPaths(toolName, input);

    this.emitEvent("tool_request", {
      id: requestId, seq, tool: toolName,
      target: inputSummary, paths, input_summary: inputSummary,
    });

    // ---- FLOW-SCAN ----
    let fs_;
    try {
      fs_ = await agents.callFlowScan(client, models.flowscan, {
        ledger: memory.getLedger(), prompt, tool: toolName, inputSummary,
      });
    } catch (err) {
      fs_ = { score: 35, reasoning: `Flow-Scan failed (${err.message}) — failing closed to user review.`, recommended_max_tokens: 4096 };
    }
    this.emitEvent("fs_result", { id: requestId, score: fs_.score, reasoning: fs_.reasoning });

    // ---- IMPORTANCE-SCAN ----
    const registry = memory.getRegistry();
    const excerpts = {};
    for (const p of paths) {
      if (!registry[p]?.profiled) {
        const ex = tools.fileExcerpt(p);
        if (ex != null) excerpts[p] = ex;
      }
    }
    let is_;
    try {
      is_ = await agents.callImportanceScan(client, models.importancescan, {
        registry, paths, tool: toolName, input, inputSummary, excerpts,
      });
      memory.applyProfiles(is_.profiles);
      this.emitEvent("registry_updated", {});
    } catch (err) {
      is_ = { score: 85, reasoning: `Importance-Scan failed (${err.message}) — failing closed to user review.`, recommended_max_tokens: 4096, profiles: [] };
    }
    this.emitEvent("is_result", { id: requestId, score: is_.score, reasoning: is_.reasoning });

    // ---- DECISION MATRIX ----
    const verdict = this.decide(fs_.score, is_.score);
    this.emitEvent("decision", {
      id: requestId, seq, verdict,
      fs_score: fs_.score, is_score: is_.score,
      fs_reasoning: fs_.reasoning, is_reasoning: is_.reasoning,
    });

    if (verdict === "freeze") {
      return { action: "reject", verdict: "freeze", fs: fs_, is: is_ };
    }

    if (verdict === "report") {
      const reason =
        fs_.score >= 21
          ? `Flow-Scan rated this request ${fs_.score}/100 out-of-line with your prompt flow.`
          : `Importance-Scan rated the affected material ${is_.score}/100 — this touches important or private files.`;
      const approved = await this.awaitUserDecision({
        id: requestId, seq, kind: "security", tool: toolName,
        input_summary: inputSummary, reason,
        fs: { score: fs_.score, reasoning: fs_.reasoning },
        is: { score: is_.score, reasoning: is_.reasoning },
      });
      if (!approved) {
        return { action: "reject", verdict: "denied", fs: fs_, is: is_ };
      }
      this.setStatus("working");
      return { action: "execute", verdict: "user_approved", fs: fs_, is: is_ };
    }

    return { action: "execute", verdict: "approve", fs: fs_, is: is_ };
  }

  /**
   * Scan + execute one batch of tool_use blocks, pushing one tool_result into
   * `results` for every block. Returns the terminal state ("frozen" | "halted")
   * if the batch tripped the security system, else null.
   */
  async processToolBatch(client, models, userMessage, toolUses, results) {
    let terminalState = null;

    for (const tu of toolUses) {
      // A prior block in this batch froze/halted the agent — skip the rest.
      if (terminalState) {
        results.push({
          type: "tool_result", tool_use_id: tu.id, is_error: true,
          content: `Request not executed: agent ${terminalState} by the security system.`,
        });
        continue;
      }

      const requestId = `req_${++this.reqCounter}_${Date.now()}`;
      const scan = await this.scanRequest(client, models, {
        prompt: userMessage, toolName: tu.name, input: tu.input,
        requestId, seq: this.reqCounter,
      });

      if (scan.action === "reject") {
        terminalState = scan.verdict === "freeze" ? "frozen" : "halted";
        results.push({
          type: "tool_result", tool_use_id: tu.id, is_error: true,
          content: scan.verdict === "freeze"
            ? `BLOCKED: Flow-Scan froze the agent (anomaly score ${scan.fs.score}/100). Reason: ${scan.fs.reasoning}`
            : `DENIED by the user after security review. Do not retry this request.`,
        });
        continue;
      }

      // Approved — cooperative token provisioning, then execute.
      const granted = this.provisionTokens(
        scan.fs.recommended_max_tokens, scan.is.recommended_max_tokens, requestId
      );

      const result = tools.execute(tu.name, tu.input);
      memory.indexWorkspace();
      this.emitEvent("registry_updated", {});
      this.emitEvent("tool_executed", {
        id: requestId, ok: result.ok, tokens: granted,
        output_preview: result.output.slice(0, 400),
      });

      memory.appendLedger({
        prompt: userMessage, tool: tu.name,
        input_summary: tools.summarizeInput(tu.name, tu.input),
        fs_score: scan.fs.score, is_score: scan.is.score, verdict: scan.verdict,
      });
      this.emitEvent("ledger_updated", {});

      results.push({
        type: "tool_result", tool_use_id: tu.id,
        is_error: !result.ok,
        content: result.output.slice(0, MAX_RESULT_CHARS),
      });
    }

    return terminalState;
  }

  /** Full pipeline for one user message. Runs async; progress flows over SSE. */
  async runChat(userMessage) {
    if (this.busy) throw new Error("A run is already in progress");
    if (this.status === "frozen" || this.status === "halted") {
      throw new Error(`Agent is ${this.status} — investigate and reactivate first`);
    }
    const apiKey = memory.getApiKey();
    if (!apiKey) throw new Error("System not configured — add an API key first");

    this.busy = true;
    this.setStatus("working");
    this.emitEvent("run_started", { prompt: userMessage });

    const client = agents.makeClient(apiKey);
    const { models } = memory.getConfig();

    // heal any tool_use left dangling by a crash/restart before extending the log
    if (memory.repairConversation()) {
      this.emitEvent("error", { message: "recovered an interrupted session — unfinished requests were marked as not executed" });
    }

    memory.appendConversation({ role: "user", content: userMessage });

    let terminalState = null; // "frozen" | "halted" | null

    try {
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const budget = this.unlimitedTokens
          ? agents.maxOutputFor(models.worker)
          : memory.getMaxTokenOutput();
        const response = await agents.callWorker(client, models.worker, memory.getConversation(), budget);

        // Budget exhausted mid-task: offer the user an unlimited grant BEFORE
        // anything is persisted. Approval discards the truncated attempt and
        // re-runs the turn with the model's full output ceiling.
        if (response.stop_reason === "max_tokens" && !this.unlimitedTokens) {
          const granted = await this.awaitTokenDecision(budget, userMessage);
          this.setStatus("working");
          if (granted) {
            this.unlimitedTokens = true;
            this.emitEvent("env_updated", { maxTokenOutput: "unlimited" });
            continue;
          }
        }

        memory.appendConversation({ role: "assistant", content: response.content });

        const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
        if (text) this.emitEvent("worker_message", { text });

        if (response.stop_reason === "max_tokens") {
          // user kept the truncation, or the model's own ceiling was reached
          this.emitEvent("error", { message: `output truncated at ${budget} tokens` });
          const dangling = response.content.filter((b) => b.type === "tool_use");
          if (dangling.length) {
            memory.appendConversation({
              role: "user",
              content: dangling.map((tu) => ({
                type: "tool_result", tool_use_id: tu.id, is_error: true,
                content: "Not executed — the response was truncated at the token budget.",
              })),
            });
          }
          break;
        }

        if (response.stop_reason !== "tool_use") break;

        const toolUses = response.content.filter((b) => b.type === "tool_use");
        const results = [];

        try {
          terminalState = await this.processToolBatch(client, models, userMessage, toolUses, results);
        } catch (err) {
          // never persist a dangling tool_use: answer unresolved ids before surfacing the error
          const resolved = new Set(results.map((r) => r.tool_use_id));
          for (const tu of toolUses) {
            if (!resolved.has(tu.id)) {
              results.push({
                type: "tool_result", tool_use_id: tu.id, is_error: true,
                content: `Not executed — orchestrator error: ${err.message}`,
              });
            }
          }
          memory.appendConversation({ role: "user", content: results });
          throw err;
        }

        memory.appendConversation({ role: "user", content: results });

        if (terminalState) break;

        if (iteration === MAX_ITERATIONS - 1) {
          this.emitEvent("error", { message: "iteration cap reached — run stopped" });
        }
      }
    } catch (err) {
      this.emitEvent("error", { message: err.message });
    } finally {
      this.busy = false;
      this.pending = null;
      if (this.unlimitedTokens) {
        // the grant covers one task — the cooperative budget resumes next run
        this.unlimitedTokens = false;
        this.emitEvent("env_updated", { maxTokenOutput: memory.getMaxTokenOutput() });
      }
      this.setStatus(terminalState || "idle");
      this.emitEvent("run_finished", {});
    }
  }

  statePayload() {
    return {
      status: this.status,
      maxTokenOutput: memory.getMaxTokenOutput(),
      pendingApproval: this.pending ? this.pending.payload : null,
      transcript: memory.transcript(),
    };
  }
}

module.exports = { Orchestrator };

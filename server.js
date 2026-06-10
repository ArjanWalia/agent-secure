/**
 * AGENT:SECURE — local orchestrator server.
 * Serves the console UI, exposes the pipeline API, and streams
 * security events to the browser over SSE.
 */
const express = require("express");
const path = require("path");
const memory = require("./src/memory");
const { makeClient } = require("./src/agents");
const { Orchestrator } = require("./src/orchestrator");

const PORT = process.env.PORT || 3000;

memory.ensureDirs();
memory.indexWorkspace();
memory.setMaxTokenOutput(memory.getMaxTokenOutput()); // ensure .env exists with a starting budget

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const orchestrator = new Orchestrator();

/* ---------------- SSE ---------------- */

const sseClients = new Set();

app.get("/api/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: "agent_state", status: orchestrator.status })}\n\n`);
  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
});

orchestrator.on("event", (ev) => {
  const frame = `data: ${JSON.stringify(ev)}\n\n`;
  for (const res of sseClients) res.write(frame);
});

setInterval(() => {
  for (const res of sseClients) res.write(": keep-alive\n\n");
}, 25_000);

/* ---------------- config / setup ---------------- */

const VALID_MODELS = new Set([
  "claude-opus-4-8", "claude-opus-4-7", "claude-opus-4-6",
  "claude-sonnet-4-6", "claude-haiku-4-5",
]);

app.get("/api/config", (req, res) => {
  const { models } = memory.getConfig();
  res.json({
    configured: Boolean(memory.getApiKey()),
    hasKey: Boolean(memory.getApiKey()),
    models,
    maxTokenOutput: memory.getMaxTokenOutput(),
  });
});

app.post("/api/setup", async (req, res) => {
  try {
    const { apiKey, models } = req.body || {};

    if (models) {
      for (const m of Object.values(models)) {
        if (!VALID_MODELS.has(m)) return res.status(400).json({ error: `Unknown model: ${m}` });
      }
    }

    const keyToUse = (apiKey && apiKey.trim()) || memory.getApiKey();
    if (!keyToUse) return res.status(400).json({ error: "An Anthropic API key is required" });

    // validate the key (and the worker model id) with a lightweight call
    try {
      const client = makeClient(keyToUse);
      await client.models.retrieve(models?.worker || memory.getConfig().models.worker);
    } catch (err) {
      if (err && err.status === 401) {
        return res.status(401).json({ error: "Invalid Anthropic API key (authentication failed)" });
      }
      if (err && err.status === 404) {
        return res.status(400).json({ error: "Model not available on this API key" });
      }
      // network or transient errors: accept the config, the first run will surface issues
    }

    if (apiKey && apiKey.trim()) memory.setApiKey(apiKey.trim());
    if (models) memory.setModels(models);
    if (orchestrator.status === "offline") orchestrator.setStatus("idle");

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- state & memory views ---------------- */

app.get("/api/state", (req, res) => res.json(orchestrator.statePayload()));
app.get("/api/registry", (req, res) => res.json({ registry: memory.getRegistry() }));
app.get("/api/ledger", (req, res) => res.json({ ledger: memory.getLedger() }));

/* ---------------- chat pipeline ---------------- */

app.post("/api/chat", (req, res) => {
  const message = String(req.body?.message || "").trim();
  if (!message) return res.status(400).json({ error: "Empty message" });
  if (orchestrator.busy) return res.status(409).json({ error: "A run is already in progress" });
  if (orchestrator.status === "frozen" || orchestrator.status === "halted") {
    return res.status(409).json({ error: `Agent is ${orchestrator.status} — reactivate first` });
  }
  if (!memory.getApiKey()) return res.status(400).json({ error: "System not configured" });

  orchestrator.runChat(message); // async; progress streams over SSE
  res.status(202).json({ ok: true });
});

app.post("/api/decision", (req, res) => {
  try {
    const { id, approve } = req.body || {};
    orchestrator.resolveDecision(id, Boolean(approve));
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/agent/reactivate", (req, res) => {
  try {
    orchestrator.reactivate();
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/session/clear", (req, res) => {
  if (orchestrator.busy) return res.status(409).json({ error: "A run is in progress" });
  memory.clearConversation();
  res.json({ ok: true });
});

/* ---------------- boot ---------------- */

app.listen(PORT, () => {
  const configured = Boolean(memory.getApiKey());
  orchestrator.status = configured ? "idle" : "offline";
  console.log(`
  ┌─────────────────────────────────────────────┐
  │  AGENT:SECURE — tri-model orchestrator      │
  │  console:    http://localhost:${PORT}          │
  │  workspace:  ./workspace                    │
  │  memory:     ./data  ·  budget: .env        │
  │  configured: ${configured ? "yes" : "no — open the console to set up"}
  └─────────────────────────────────────────────┘`);
});

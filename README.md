# AGENT:SECURE

A **tri-model security orchestrator** that runs locally on your machine. You converse
with one AI worker agent — and every file access, write, delete, or shell command it
attempts is intercepted and scored by two independent security models **before** it
executes.

> **The problem.** As agents get smarter and more independent, a worker model can be
> persuaded — by a malicious MCP server, poisoned file contents, or plain prompt
> injection — into requests the user never intended. Agentic requests (files,
> information, commands) need to be monitored and scanned for malicious intent,
> continuously.

## The three models

| Agent | Role | Memory (held by the orchestrator, not the model) |
|---|---|---|
| **Worker** | Talks to the user, requests tools. Susceptible to persuasion. | `data/conversation_log.json` — full chat history replayed on every call |
| **Flow-Scan (FS)** | Scores how *out of line* each request is with the flow of user prompts + prior requests | `data/flow_ledger.json` — every approved `prompt → request` pair |
| **Importance-Scan (IS)** | Knows every file's **importance** to the project and how **private** its contents are | `data/file_registry.json` — per-file profiles, built up as files are touched |

The Anthropic API is stateless — the models hold no memory. This app is the
**state management layer**: it owns the three stores above and feeds the right
context into each model on every call.

```
            [ Your machine — AGENT:SECURE orchestrator ]
   ┌──────────────────────────────────────────────────────────┐
   │  LOCAL STORAGE (the memory)                              │
   │   ├── data/conversation_log.json   (Worker memory)       │
   │   ├── data/flow_ledger.json        (Flow-Scan memory)    │
   │   ├── data/file_registry.json      (Importance memory)   │
   │   └── .env                         (MAX_TOKEN_OUTPUT)    │
   └──────────────────────┬───────────────────────────────────┘
                          │  history + current task, per call
                          ▼
                [ Stateless Anthropic API ]
   ┌──────────────────────────────────────────────────────────┐
   │   Worker model   │   Flow-Scan   │   Importance-Scan     │
   └──────────────────────────────────────────────────────────┘
```

## The pipeline

Every worker tool request flows through, in order:

1. **Intercept** — the orchestrator pauses the worker's tool call before execution.
2. **Flow-Scan** — receives the flow ledger plus the current `prompt → request`
   pair and returns an anomaly score **0–100**.
3. **Importance-Scan** — receives the registry profiles for the affected files
   (reading + profiling any file it hasn't seen before) and returns a sensitivity
   score **0–100**. Profiles are written back to the registry.
4. **Decision matrix:**

   | Condition | Outcome |
   |---|---|
   | FS 51–100 | **Freeze** the agent + report to the user |
   | FS 21–50 | **Report** to the user (approve / deny) |
   | FS 0–20 **and** IS 81–100 | **Report** to the user (approve / deny) |
   | everything else | **Approve** |

   The IS gate exists to notify you whenever the agent touches an important or
   private file — even when the request fits the flow perfectly.
5. **Token provisioning** — on approval, the two scanners' per-step token
   recommendations are combined cooperatively and written to `.env` as
   `MAX_TOKEN_OUTPUT`. The worker's next execution step is provisioned **only the
   tokens it needs for that task**. If the worker exhausts that budget mid-task,
   you're asked to either keep the truncated output or **grant unlimited tokens**:
   approving discards the truncated attempt and re-runs the turn at the model's
   full output ceiling for the rest of that task (the cooperative budget resumes
   on your next message).
6. **Execute** — the tool runs inside the sandboxed `./workspace` directory
   (path escapes are rejected) and the approved pair is appended to the flow ledger.

If you **deny** a reported request, the worker is **halted** for you to investigate.
If Flow-Scan **freezes** the agent, it stays frozen until you explicitly unfreeze it.

## Quick start

```bash
npm install
npm start          # → http://localhost:3000
```

On first launch the console asks for:

1. Your **Anthropic API key** (stored locally in `.env`, sent only to api.anthropic.com).
2. A **model for each agent** — Opus 4.8 (default), Opus 4.7, Opus 4.6, Sonnet 4.6,
   or Haiku 4.5, chosen independently for Worker / Flow-Scan / Importance-Scan.

You converse **only with the worker agent**. The right-hand panel shows the live
security pipeline, the file registry, and the flow ledger.

### Things to try

- `summarize the files in this workspace` — routine requests auto-approve; watch
  the FS/IS gauges fill on each card.
- `read secrets/credentials.env` — in-line with your prompt (low FS) but critical
  privacy (IS ≥ 81) → escalated to you for approval.
- `delete src/app.js` *without any reason* — scope-dependent: expect a report or
  freeze depending on how out-of-flow it is.

The `workspace/` folder ships with a small fictional project whose files span the
sensitivity range (code, config, fake credentials, fake customer data) so the
pipeline has something real to judge. All secrets/PII in it are fabricated.

## API surface (local)

| Endpoint | Purpose |
|---|---|
| `GET /api/events` | SSE stream of pipeline events |
| `POST /api/chat` | Send a prompt to the worker agent |
| `POST /api/decision` | Approve / deny an escalated request |
| `POST /api/agent/reactivate` | Unfreeze / resume the agent |
| `GET /api/state` · `/api/registry` · `/api/ledger` | Memory views |
| `GET /api/config` · `POST /api/setup` | Key + per-agent model selection |

## Layout

```
server.js              Express server + SSE
src/orchestrator.js    Pipeline, decision matrix, token provisioning
src/agents.js          Worker / Flow-Scan / Importance-Scan API calls
src/memory.js          State management layer (the three stores + .env)
src/tools.js           Sandboxed workspace tools
public/                Console UI (no build step)
workspace/             The directory the worker operates on
data/                  Memory stores (created at runtime, gitignored)
```

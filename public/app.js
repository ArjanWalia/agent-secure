/* AGENT:SECURE — console frontend */
(() => {
  const $ = (id) => document.getElementById(id);

  const MODELS = [
    { id: "claude-opus-4-8", label: "Claude Opus 4.8 — most capable (recommended)" },
    { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
    { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — speed / intelligence balance" },
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 — fastest, most cost-effective" },
  ];

  const state = {
    configured: false,
    status: "offline",
    pendingApproval: null,
    cards: new Map(), // requestId -> card element
    typingEl: null,
  };

  /* ---------------- helpers ---------------- */

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // minimal markdown: fenced code, inline code, bold
  function fmt(text) {
    let out = esc(text);
    out = out.replace(/```([\s\S]*?)```/g, (_, code) => `<pre>${code.replace(/^\w+\n/, "")}</pre>`);
    out = out.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    return out;
  }

  function shortModel(id) {
    return (id || "").replace("claude-", "").replace(/-(\d)-(\d)/, " $1.$2");
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  function scoreBadge(n) {
    if (n == null) return `<span class="badge-num none">—</span>`;
    const cls = n >= 81 ? "high" : n >= 50 ? "mid" : "low";
    return `<span class="badge-num ${cls}">${n}</span>`;
  }

  /* ---------------- status / banner ---------------- */

  const STATUS_LABEL = {
    offline: "OFFLINE", idle: "SECURE · IDLE", working: "WORKER ACTIVE",
    pending: "AWAITING USER REVIEW", frozen: "AGENT FROZEN", halted: "AGENT HALTED",
  };

  function setStatus(status) {
    state.status = status;
    $("statusPill").dataset.state = status;
    $("statusText").textContent = STATUS_LABEL[status] || status.toUpperCase();

    const banner = $("stateBanner");
    if (status === "frozen") {
      banner.classList.remove("hidden");
      banner.dataset.kind = "frozen";
      $("bannerTitle").textContent = "AGENT FROZEN";
      $("bannerText").textContent =
        "Flow-Scan classified a request as severely out-of-line (FS ≥ 51). The worker is frozen pending your investigation.";
      $("bannerAction").textContent = "INVESTIGATE COMPLETE — UNFREEZE";
    } else if (status === "halted") {
      banner.classList.remove("hidden");
      banner.dataset.kind = "halted";
      $("bannerTitle").textContent = "AGENT HALTED";
      $("bannerText").textContent =
        "You denied a request. The worker is halted so you can investigate before resuming.";
      $("bannerAction").textContent = "RESUME AGENT";
    } else {
      banner.classList.add("hidden");
    }

    const canChat = status === "idle";
    $("chatInput").disabled = !canChat;
    $("sendBtn").disabled = !canChat;
    if (canChat) $("chatInput").focus();
  }

  /* ---------------- chat rendering ---------------- */

  function hideEmpty() {
    const e = $("chatEmpty");
    if (e) e.remove();
  }

  function scrollChat() {
    const log = $("chatLog");
    log.scrollTop = log.scrollHeight;
  }

  function addMsg(role, text) {
    hideEmpty();
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    const who = role === "user" ? "YOU" : "WORKER";
    div.innerHTML = `<span class="msg-meta">${who}</span><div class="msg-body">${fmt(text)}</div>`;
    $("chatLog").appendChild(div);
    scrollChat();
  }

  function addSysLine(text, kind = "") {
    hideEmpty();
    const div = document.createElement("div");
    div.className = `sys-line ${kind}`;
    div.textContent = text;
    $("chatLog").appendChild(div);
    scrollChat();
  }

  function addToolChip(req) {
    hideEmpty();
    const div = document.createElement("div");
    div.className = "tool-chip";
    div.dataset.verdict = "scanning";
    div.dataset.req = req.id;
    div.innerHTML =
      `<span class="t-name">${esc(req.tool)}</span>` +
      `<span class="t-target">${esc(req.target || "")}</span>` +
      `<span class="t-status">SCANNING…</span>`;
    $("chatLog").appendChild(div);
    scrollChat();
    return div;
  }

  function updateToolChip(id, verdict, label) {
    const chip = document.querySelector(`.tool-chip[data-req="${id}"]`);
    if (!chip) return;
    chip.dataset.verdict = verdict;
    chip.querySelector(".t-status").textContent = label;
  }

  function showTyping(on) {
    if (on && !state.typingEl) {
      hideEmpty();
      const div = document.createElement("div");
      div.className = "typing";
      div.innerHTML = `<span class="bars"><i></i><i></i><i></i></span> worker reasoning…`;
      $("chatLog").appendChild(div);
      state.typingEl = div;
      scrollChat();
    } else if (!on && state.typingEl) {
      state.typingEl.remove();
      state.typingEl = null;
    }
  }

  /* ---------------- pipeline cards ---------------- */

  function newCard(req) {
    $("feedEmpty")?.remove();
    const card = document.createElement("div");
    card.className = "req-card";
    card.dataset.verdict = "scanning";
    card.innerHTML = `
      <div class="req-head">
        <span class="req-seq">#${req.seq}</span>
        <span class="req-tool">${esc(req.tool)}</span>
        <span class="req-target" title="${esc(req.target || "")}">${esc(req.target || "")}</span>
        <span class="req-verdict">SCANNING</span>
      </div>
      <div class="req-scores">
        <div class="score-line">
          <span class="lbl fs">FS</span>
          <div class="gauge"><div class="gauge-fill fs-fill"></div><i class="tick" style="left:20%"></i><i class="tick" style="left:50%"></i></div>
          <span class="val pending fs-val">…</span>
        </div>
        <div class="score-line">
          <span class="lbl is">IS</span>
          <div class="gauge"><div class="gauge-fill is-fill"></div><i class="tick" style="left:81%"></i></div>
          <span class="val pending is-val">…</span>
        </div>
      </div>
      <p class="req-reason hidden"></p>
      <div class="req-tokens hidden">▸ token grant <b class="tok-val"></b></div>`;
    const feed = $("pipelineFeed");
    feed.prepend(card);
    state.cards.set(req.id, card);
    return card;
  }

  function cardScore(id, which, score) {
    const card = state.cards.get(id);
    if (!card) return;
    card.querySelector(`.${which}-fill`).style.width = `${Math.min(100, score)}%`;
    const val = card.querySelector(`.${which}-val`);
    val.textContent = `${score}`;
    val.classList.remove("pending");
  }

  const VERDICT_LABEL = {
    approve: "APPROVED", report: "USER REVIEW", freeze: "FROZEN",
    denied: "DENIED", user_approved: "USER APPROVED",
  };

  function cardVerdict(id, verdict, reason) {
    const card = state.cards.get(id);
    if (!card) return;
    const v = verdict === "user_approved" ? "approve" : verdict;
    card.dataset.verdict = v;
    card.querySelector(".req-verdict").textContent = VERDICT_LABEL[verdict] || verdict.toUpperCase();
    if (reason) {
      const p = card.querySelector(".req-reason");
      p.classList.remove("hidden");
      p.innerHTML = reason;
    }
  }

  function cardTokens(id, tokens) {
    const card = state.cards.get(id);
    if (!card) return;
    const box = card.querySelector(".req-tokens");
    box.classList.remove("hidden");
    box.querySelector(".tok-val").textContent = `${tokens} tokens`;
  }

  /* ---------------- registry & ledger ---------------- */

  async function refreshRegistry() {
    try {
      const { registry } = await api("/api/registry");
      const body = $("registryBody");
      const entries = Object.entries(registry || {}).sort((a, b) => a[0].localeCompare(b[0]));
      body.innerHTML = entries.length
        ? entries.map(([path, p]) => `
            <tr>
              <td class="path">${esc(path)}</td>
              <td class="num">${scoreBadge(p.profiled ? p.importance : null)}</td>
              <td class="num">${scoreBadge(p.profiled ? p.privacy : null)}</td>
              <td class="profile">${p.profiled ? esc(p.summary || "") : "<i>not yet profiled</i>"}</td>
            </tr>`).join("")
        : `<tr><td colspan="4" class="profile">workspace empty</td></tr>`;
    } catch { /* panel refresh is best-effort */ }
  }

  async function refreshLedger() {
    try {
      const { ledger } = await api("/api/ledger");
      const list = $("ledgerList");
      list.innerHTML = (ledger || []).length
        ? [...ledger].reverse().map((e) => `
            <div class="ledger-item">
              <div class="ledger-top">
                <span>${new Date(e.ts).toLocaleTimeString()}</span>
                <span>${e.verdict === "user_approved" ? "✓ user approved" : "✓ auto approved"}</span>
              </div>
              <div class="ledger-prompt">${esc(e.prompt)}</div>
              <div class="ledger-req">→ ${esc(e.tool)} ${esc(e.input_summary)}</div>
              <div class="ledger-scores"><span class="fs-ink">FS ${e.fs_score}</span> · <span class="is-ink">IS ${e.is_score}</span></div>
            </div>`).join("")
        : `<div class="feed-empty mono">— ledger empty —</div>`;
    } catch { /* best-effort */ }
  }

  /* ---------------- approval modal ---------------- */

  function openApproval(p) {
    state.pendingApproval = p;
    $("apTool").textContent = p.tool;
    $("apInput").textContent = p.input_summary;
    $("apFsScore").textContent = `${p.fs.score} / 100`;
    $("apFsScore").style.color = p.fs.score >= 51 ? "var(--red)" : p.fs.score >= 21 ? "var(--amber)" : "var(--green)";
    $("apFsBar").style.width = `${p.fs.score}%`;
    $("apFsReason").textContent = p.fs.reasoning;
    $("apIsScore").textContent = `${p.is.score} / 100`;
    $("apIsScore").style.color = p.is.score >= 81 ? "var(--red)" : p.is.score >= 50 ? "var(--amber)" : "var(--green)";
    $("apIsBar").style.width = `${p.is.score}%`;
    $("apIsReason").textContent = p.is.reasoning;
    $("apSubtitle").textContent = p.reason;
    $("approvalModal").classList.remove("hidden");
  }

  async function sendDecision(approve) {
    const p = state.pendingApproval;
    if (!p) return;
    $("approvalModal").classList.add("hidden");
    state.pendingApproval = null;
    try {
      await api("/api/decision", { method: "POST", body: { id: p.id, approve } });
    } catch (err) {
      addSysLine(`decision failed: ${err.message}`, "bad");
    }
  }

  $("apApprove").addEventListener("click", () => sendDecision(true));
  $("apDeny").addEventListener("click", () => sendDecision(false));

  /* ---------------- setup modal ---------------- */

  function fillModelSelects(models = {}) {
    const opts = MODELS.map((m) => `<option value="${m.id}">${m.label}</option>`).join("");
    for (const [sel, key] of [["setupWorker", "worker"], ["setupFS", "flowscan"], ["setupIS", "importancescan"]]) {
      $(sel).innerHTML = opts;
      $(sel).value = models[key] || "claude-opus-4-8";
    }
  }

  function openSetup(cfg) {
    fillModelSelects(cfg?.models);
    $("keyHint").innerHTML = cfg?.hasKey
      ? `A key is already configured — leave blank to keep it.`
      : `Stored locally in <span class="mono">.env</span> on this machine. Never leaves your host except to api.anthropic.com.`;
    $("setupError").classList.add("hidden");
    $("setupModal").classList.remove("hidden");
  }

  $("setupSave").addEventListener("click", async () => {
    const btn = $("setupSave");
    btn.disabled = true;
    btn.textContent = "VALIDATING KEY…";
    try {
      const body = {
        apiKey: $("setupKey").value.trim() || undefined,
        models: {
          worker: $("setupWorker").value,
          flowscan: $("setupFS").value,
          importancescan: $("setupIS").value,
        },
      };
      await api("/api/setup", { method: "POST", body });
      $("setupModal").classList.add("hidden");
      $("setupKey").value = "";
      await loadConfig();
      addSysLine("system configured — three models armed", "ok");
    } catch (err) {
      const box = $("setupError");
      box.textContent = err.message;
      box.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "INITIALIZE SYSTEM";
    }
  });

  $("settingsBtn").addEventListener("click", async () => {
    const cfg = await api("/api/config").catch(() => null);
    openSetup(cfg);
  });

  /* ---------------- tabs ---------------- */

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-body").forEach((b) => b.classList.add("hidden"));
      tab.classList.add("active");
      $(`tab-${tab.dataset.tab}`).classList.remove("hidden");
      if (tab.dataset.tab === "registry") refreshRegistry();
      if (tab.dataset.tab === "ledger") refreshLedger();
    });
  });

  /* ---------------- composer ---------------- */

  const input = $("chatInput");
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 140) + "px";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $("chatForm").requestSubmit();
    }
  });

  $("chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || state.status !== "idle") return;
    input.value = "";
    input.style.height = "auto";
    addMsg("user", text);
    try {
      await api("/api/chat", { method: "POST", body: { message: text } });
    } catch (err) {
      addSysLine(`send failed: ${err.message}`, "bad");
    }
  });

  $("clearBtn").addEventListener("click", async () => {
    if (!confirm("Clear the worker conversation log? (flow ledger & file registry are kept)")) return;
    await api("/api/session/clear", { method: "POST" }).catch(() => {});
    $("chatLog").innerHTML = "";
    addSysLine("conversation log cleared", "ok");
  });

  $("bannerAction").addEventListener("click", async () => {
    try {
      await api("/api/agent/reactivate", { method: "POST" });
    } catch (err) {
      addSysLine(err.message, "bad");
    }
  });

  /* ---------------- SSE event stream ---------------- */

  function connectEvents() {
    const es = new EventSource("/api/events");
    es.onmessage = (e) => {
      let ev;
      try { ev = JSON.parse(e.data); } catch { return; }
      handleEvent(ev);
    };
    es.onerror = () => { /* EventSource auto-reconnects */ };
  }

  function handleEvent(ev) {
    switch (ev.type) {
      case "agent_state":
        setStatus(ev.status);
        break;

      case "run_started":
        showTyping(true);
        break;

      case "worker_message":
        showTyping(false);
        if (ev.text?.trim()) addMsg("worker", ev.text);
        break;

      case "tool_request":
        showTyping(false);
        newCard(ev);
        addToolChip(ev);
        break;

      case "fs_result":
        cardScore(ev.id, "fs", ev.score);
        break;

      case "is_result":
        cardScore(ev.id, "is", ev.score);
        break;

      case "decision": {
        const reasonHtml =
          `<b class="fs-ink">FS</b> ${esc(ev.fs_reasoning || "")}` +
          (ev.is_reasoning ? `<br/><b class="is-ink">IS</b> ${esc(ev.is_reasoning)}` : "");
        cardVerdict(ev.id, ev.verdict, reasonHtml);
        const chipLabel = {
          approve: "✓ APPROVED", report: "⚠ USER REVIEW", freeze: "✖ FROZEN",
          denied: "✖ DENIED", user_approved: "✓ USER APPROVED",
        }[ev.verdict] || ev.verdict;
        updateToolChip(ev.id, ev.verdict === "user_approved" ? "approve" : ev.verdict, chipLabel);
        if (ev.verdict === "freeze") addSysLine(`FLOW-SCAN FREEZE — request #${ev.seq} blocked (FS ${ev.fs_score})`, "bad");
        if (ev.verdict === "report") addSysLine(`request #${ev.seq} escalated for your review`, "warn");
        break;
      }

      case "approval_required":
        openApproval(ev);
        break;

      case "user_decision":
        if (!ev.approve) addSysLine(`request #${ev.seq} denied — worker halted`, "bad");
        else addSysLine(`request #${ev.seq} approved by user`, "ok");
        cardVerdict(ev.id, ev.approve ? "user_approved" : "denied");
        updateToolChip(ev.id, ev.approve ? "approve" : "denied", ev.approve ? "✓ USER APPROVED" : "✖ DENIED");
        break;

      case "tool_executed":
        showTyping(true);
        break;

      case "env_updated": {
        $("tokenValue").textContent = ev.maxTokenOutput;
        const chip = $("tokenValue");
        chip.classList.remove("flash");
        void chip.offsetWidth;
        chip.classList.add("flash");
        if (ev.id) cardTokens(ev.id, ev.maxTokenOutput);
        break;
      }

      case "registry_updated":
        if (!$("tab-registry").classList.contains("hidden")) refreshRegistry();
        break;

      case "ledger_updated":
        if (!$("tab-ledger").classList.contains("hidden")) refreshLedger();
        break;

      case "run_finished":
        showTyping(false);
        break;

      case "error":
        showTyping(false);
        addSysLine(`error: ${ev.message}`, "bad");
        break;
    }
  }

  /* ---------------- bootstrap ---------------- */

  async function loadConfig() {
    const cfg = await api("/api/config").catch(() => null);
    if (!cfg) {
      setStatus("offline");
      return;
    }
    state.configured = cfg.configured;
    $("workerModelTag").textContent = shortModel(cfg.models?.worker) || "—";
    $("fsModelTag").textContent = shortModel(cfg.models?.flowscan) || "—";
    $("isModelTag").textContent = shortModel(cfg.models?.importancescan) || "—";
    $("tokenValue").textContent = cfg.maxTokenOutput ?? "—";

    if (!cfg.configured) {
      setStatus("offline");
      openSetup(cfg);
    } else {
      const st = await api("/api/state").catch(() => null);
      setStatus(st?.status || "idle");
      if (st?.pendingApproval) openApproval(st.pendingApproval);
      // replay persisted conversation so a reload doesn't lose the thread
      if (st?.transcript?.length) {
        $("chatLog").innerHTML = "";
        for (const m of st.transcript) {
          if (m.role === "user") addMsg("user", m.text);
          else if (m.role === "assistant") addMsg("worker", m.text);
        }
      }
    }
    refreshRegistry();
    refreshLedger();
  }

  fillModelSelects();
  connectEvents();
  loadConfig();
})();

/* Tensor Puzzle Gym — runs Python/NumPy in the browser (Pyodide) and trains iteration stamina. */
(() => {
  const LS = "aio-puzzle-gym-v1";
  const BREAK_GAP = 10 * 60 * 1000;          // gaps longer than this count as breaks, not iterations
  const NUDGE_AFTER = 90 * 1000;              // edited but not run for this long → nudge

  const store = Object.assign({ sol: {}, draft: {}, stats: {}, days: {}, sprints: [] },
    safeJSON(LS, {}));
  const persist = () => { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (_) { /* quota/private-mode: progress stays in-memory */ } };
  const session = { runs: [], log: [], lastRunAt: 0, editedAt: 0, edited: false, openedAt: Date.now(),
                    cur: 0, last: null, sprint: null, drill: null };
  let running = false;

  const g = id => document.getElementById(id);
  const e = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const today = () => new Date().toLocaleDateString("en-CA");
  const day = () => (store.days[today()] ||= { runs: 0, solves: 0 });
  const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const template = p => `${p.sig}\n    return `;
  const isSolved = name => !!store.sol[name];

  /* ---------- Python runtime (worker — a hung loop can't freeze the tab) ---------- */
  const setStatus = t => { const el = g("pgStatus"); el.textContent = t; el.hidden = !t; };
  const RUN_TIMEOUT_MS = 30000;
  const runner = PyRunner.create({
    harness: PUZZLE_HARNESS,
    register: JSON.stringify(PUZZLES.map(({ name, spec }) => ({ name, spec }))),
    onStatus: setStatus,
    callTimeoutMs: RUN_TIMEOUT_MS,
  });
  const loadPython = () => runner.init().then(renderExamples).catch(() => {});

  /* ---------- tensor drawing (orange = positive, blue = negative, light = 0) ---------- */
  function cell(v) {
    if (typeof v === "boolean") v = v ? 1 : 0;
    const a = Math.min(1, Math.abs(v) / 5);
    const bg = v > 0 ? `rgba(249,115,22,${0.25 + 0.6 * a})` : v < 0 ? `rgba(59,130,246,${0.25 + 0.6 * a})` : "#e5e7eb";
    const txt = Number.isInteger(v) ? v : (+v).toFixed(2);
    return `<td style="background:${bg};color:${v === 0 ? "#475569" : "#0b1120"}">${txt}</td>`;
  }
  function tensor(x) {
    if (x === null || x === undefined) return `<span class="pg-na">—</span>`;
    if (!Array.isArray(x)) return typeof x === "number" ? `<span class="pg-int">${x}</span>` : `<table class="pg-t"><tr>${cell(x)}</tr></table>`;
    if (!x.length) return `<span class="pg-na">${e(t("pz.emptyArr"))}</span>`;
    const rows = Array.isArray(x[0]) ? x : [x];
    if (rows.length && Array.isArray(rows[0]) && !rows[0].length) return `<span class="pg-na">${e(tf("pz.shapeOf", `(${rows.length}, 0)`))}</span>`;
    return `<table class="pg-t">${rows.map(r => `<tr>${r.map(cell).join("")}</tr>`).join("")}</table>`;
  }
  const shapeOf = x => !Array.isArray(x) ? t("pz.scalar") : Array.isArray(x[0]) ? `(${x.length}, ${x[0].length})` : `(${x.length},)`;
  function caseHTML(inputs, extra) {
    return `<div class="pg-case">${Object.entries(inputs).map(([k, v]) =>
      `<div class="pg-arg"><div class="pg-lbl">${e(k)} <span>${Array.isArray(v) ? shapeOf(v) : t("pz.int")}</span></div>${tensor(v)}</div>`).join("")}
      ${extra || ""}</div>`;
  }

  /* ---------- rendering ---------- */
  function renderList() {
    g("pgList").innerHTML = PUZZLES.map((p, i) => {
      const st = store.stats[p.name] || {};
      return `<button type="button" class="pg-item ${i === session.cur ? "cur" : ""} ${isSolved(p.name) ? "ok" : ""}" data-pz="${i}">
        <span class="pg-dot">${i + 1}</span>
        <span class="pg-name">${p.name}</span>
        <span class="pg-meta" title="${e(t("pz.shortTitle"))}">${st.bestLen ? st.bestLen + t("pz.char") : ""}${st.bestTime ? " · " + fmt(st.bestTime) : ""}</span>
      </button>`;
    }).join("");
    const solved = PUZZLES.filter(p => isSolved(p.name)).length;
    const chars = PUZZLES.reduce((s, p) => s + ((store.stats[p.name] || {}).bestLen || 0), 0);
    g("pgSolved").textContent = tf("pz.solvedOf", solved, PUZZLES.length) + (solved ? tf("pz.speedrun", chars) : "");
    g("pgDrill").disabled = !solved;
  }

  function openPuzzle(i, { blank = false } = {}) {
    session.cur = i;
    session.openedAt = Date.now();
    session.last = null;
    const p = PUZZLES[i];
    g("pgTitle").innerHTML = tf("pz.puzzleN", i + 1, e(p.name));
    g("pgDesc").innerHTML = `${e(loc(p.desc))} ${p.doc ? `<a class="link" href="${safeUrl(p.doc)}" target="_blank" rel="noopener">${e(t("pz.docs"))}</a>` : ""}`;
    g("pgSpec").textContent = p.spec;
    g("pgEditor").value = blank ? template(p) : (store.draft[p.name] || store.sol[p.name] || template(p));
    g("pgResult").innerHTML = isSolved(p.name) && !blank
      ? `<div class="pg-res pass">${e(t("pz.solvedBefore"))}</div>` : "";
    session.edited = false;
    renderList(); renderExamples(); updateCols();
    const ed = g("pgEditor"); ed.focus(); ed.setSelectionRange(ed.value.length, ed.value.length);
  }

  async function renderExamples() {
    const host = g("pgExamples");
    if (!runner.ready) { host.innerHTML = `<p class="pg-muted">${e(t("pz.exWait"))}</p>`; return; }
    const name = PUZZLES[session.cur].name;
    let ex;
    try { ex = JSON.parse(await runner.call("examples", [name])); }
    catch (_) { return; }
    if (PUZZLES[session.cur].name !== name) return;  // puzzle switched mid-call
    host.innerHTML = ex.map(x => caseHTML(x.inputs,
      `<div class="pg-arg"><div class="pg-lbl">out <span>${shapeOf(x.out)}</span></div>${tensor(x.out)}</div>`)).join("");
  }

  function updateCols() {
    const lines = g("pgEditor").value.split("\n");
    const ret = lines.find(l => l.trim().startsWith("return")) || "";
    const n = ret.trimEnd().length;
    const el = g("pgCols");
    el.textContent = tf("pz.cols", n);
    el.className = "pg-cols " + (n >= 80 ? "bad" : n > 70 ? "warn" : "");
  }

  /* ---------- running ---------- */
  async function runCurrent() {
    if (running) return;
    running = true;
    try {
    try { await runner.init(); } catch (err) { setStatus(err.message); return; }
    const p = PUZZLES[session.cur];
    const code = g("pgEditor").value.replace(/\t/g, "    ");
    // flow: pressing run again on an unchanged passing solution jumps to the next puzzle
    if (session.last && session.last.status === "pass" && session.last.code === code && !session.drill) return nextPuzzle();
    const prev = PUZZLES.slice(0, session.cur).filter(q => isSolved(q.name)).map(q => store.sol[q.name]);
    const t0 = performance.now();
    let r;
    try { r = JSON.parse(await runner.call("run", [p.name, code, JSON.stringify(prev), 60, null], RUN_TIMEOUT_MS)); }
    catch (err) { r = { status: "error", msg: String(err && err.message || err) }; }
    const ms = performance.now() - t0;
    const now = Date.now();
    const gap = session.lastRunAt ? now - session.lastRunAt : null;
    session.lastRunAt = now; session.edited = false;
    session.runs.push(now);
    session.last = { ...r, code };
    const st = (store.stats[p.name] ||= { runs: 0 });
    st.runs++;
    day().runs++;
    if (session.sprint) session.sprint.runs++;

    let solvedNow = false;
    if (r.status === "pass") {
      const first = !isSolved(p.name);
      store.sol[p.name] = code;
      delete store.draft[p.name];
      st.bestLen = Math.min(st.bestLen || Infinity, r.length);
      if (first) { st.solvedAt = now; st.firstSolveMs = now - session.openedAt; day().solves++; solvedNow = true; if (session.sprint) session.sprint.solves++; }
      if (session.drill && session.drill.name === p.name) {
        const t = now - session.drill.start;
        st.lastDrill = now; st.drills = (st.drills || 0) + 1;
        const pb = !st.bestTime || t < st.bestTime;
        if (pb) st.bestTime = t;
        r.drillMsg = tf("pz.drillDone", fmt(t), pb, fmt(st.bestTime));
        session.drill = null;
        if (session.sprint) session.sprint.solves++;
      } else if (first) {
        st.bestTime = Math.min(st.bestTime || Infinity, st.firstSolveMs);
      }
    }
    persist();
    session.log.unshift({ n: session.runs.length, name: p.name, status: r.status, gap, test: r.test });
    renderResult(r, ms, solvedNow);
    renderList(); renderLog(); renderStamina();
    } finally { running = false; }
  }

  function renderResult(r, ms, solvedNow) {
    const p = PUZZLES[session.cur];
    const head = t("pz.head." + r.status) || r.status;
    let body = "";
    if (r.status === "rule") body = `<ul>${r.errors.map(x => `<li>${e(x)}</li>`).join("")}</ul>`;
    else if (r.status === "pass") {
      const next = PUZZLES.findIndex((q, i) => i > session.cur && !isSolved(q.name));
      body = `<p>${e(tf("pz.passLine", r.tests, r.length, solvedNow))}</p>
        ${r.drillMsg ? `<p class="pg-pb">${e(r.drillMsg)}</p>` : ""}
        <p class="pg-muted">${tf("pz.nextHint", next >= 0 ? PUZZLES[next].name : "")}</p>`;
    } else {
      body = `${r.msg ? `<p>${e(r.msg)}</p>` : ""}
        ${r.case ? `<p class="pg-muted">${e(tf("pz.failing", r.test))}</p>${caseHTML(r.case,
          (r.expected !== undefined ? `<div class="pg-arg"><div class="pg-lbl">${e(t("pz.expected"))} <span>${shapeOf(r.expected)}</span></div>${tensor(r.expected)}</div>` : "") +
          (r.got !== undefined ? `<div class="pg-arg"><div class="pg-lbl">${e(t("pz.yours"))} <span>${r.got === null ? e(t("pz.tooLarge")) : shapeOf(r.got)}</span></div>${tensor(r.got)}</div>` : ""))}` : ""}`;
    }
    g("pgResult").innerHTML = `<div class="pg-res ${r.status === "pass" ? "pass" : "fail"}">
      <div class="pg-res-head"><b>${e(head)}</b><span>${e(tf("pz.runN", session.runs.length, ms.toFixed(0)))}</span></div>${body}</div>`;
    if (r.status === "pass" && (store.stats[p.name] || {}).runs) g("pgEditor").focus();
  }

  function renderLog() {
    const label = { pass: "pass", rule: "rule", error: "error", shape: "shape", wrong: "wrong" };
    g("pgLog").innerHTML = session.log.slice(0, 14).map(x =>
      `<div class="pg-logrow"><span>#${x.n}</span><span>${x.name}</span>
       <span class="pg-tag ${x.status}">${label[x.status]}${x.test ? " · t" + x.test : ""}</span>
       <span class="pg-muted">${x.gap === null ? e(t("pz.gap.start")) : x.gap > BREAK_GAP ? e(t("pz.gap.break")) : "+" + Math.round(x.gap / 1000) + "s"}</span></div>`).join("")
      || `<p class="pg-muted">${e(t("pz.logEmpty"))}</p>`;
  }

  /* ---------- stamina ---------- */
  function gaps(from = 0) {
    const r = session.runs.filter(t => t >= from), out = [];
    for (let i = 1; i < r.length; i++) if (r[i] - r[i - 1] <= BREAK_GAP) out.push(r[i] - r[i - 1]);
    return out;
  }
  function streak() {
    const active = d => { const x = store.days[d]; return x && (x.solves > 0 || x.runs >= 10); };
    let n = 0; const dt = new Date();
    if (!active(dt.toLocaleDateString("en-CA"))) dt.setDate(dt.getDate() - 1);
    while (active(dt.toLocaleDateString("en-CA"))) { n++; dt.setDate(dt.getDate() - 1); }
    return n;
  }
  function renderStamina() {
    const m = median(gaps());
    const pace = m === null ? "—" : Math.round(m / 1000) + " s";
    const cls = m === null ? "" : m <= 60000 ? "good" : m <= 180000 ? "warn" : "bad";
    const word = m === null ? t("pz.pace.none") : m <= 60000 ? t("pz.pace.fast") : m <= 180000 ? t("pz.pace.mid") : t("pz.pace.slow");
    g("pgPace").innerHTML = `<b class="${cls}">${pace}</b><span>${e(word)}</span>`;
    const d = day();
    g("pgToday").innerHTML = `<b>${d.runs}</b><span>${e(tf("pz.today", d.runs, d.solves))}</span>`;
    const s = streak();
    g("pgStreak").innerHTML = `<b>${s}</b><span>${e(tf("pz.streak", s))}</span>`;
    const strip = [];
    for (let k = 13; k >= 0; k--) {
      const dt = new Date(); dt.setDate(dt.getDate() - k);
      const x = store.days[dt.toLocaleDateString("en-CA")] || { runs: 0, solves: 0 };
      const lvl = x.solves >= 3 || x.runs >= 60 ? 4 : x.solves >= 1 || x.runs >= 25 ? 3 : x.runs >= 10 ? 2 : x.runs > 0 ? 1 : 0;
      strip.push(`<i class="l${lvl}" title="${dt.toLocaleDateString("en-CA")}: ${e(pl(x.runs, "u.run"))}, ${x.solves} ${e(t("pz.solved"))}"></i>`);
    }
    g("pgStrip").innerHTML = strip.join("");
  }

  function tick() {
    /* puzzles pane is a sub-pane (#sub-puzzles) inside Practice now; #tab-puzzles is the old id */
    const pane = document.getElementById("sub-puzzles") || document.getElementById("tab-puzzles");
    if (!pane || !pane.classList.contains("active")) return;
    const now = Date.now();
    const since = session.lastRunAt ? now - session.lastRunAt : null;
    const nudge = session.edited && now - session.editedAt < BREAK_GAP && session.lastRunAt && since > NUDGE_AFTER;
    const el = g("pgSince");
    el.innerHTML = since === null ? `<b>—</b><span>${e(t("pz.since"))}</span>` : `<b class="${nudge ? "warn" : ""}">${fmt(since)}</b><span>${e(nudge ? t("pz.nudge") : t("pz.since"))}</span>`;
    if (session.sprint) {
      const left = session.sprint.end - now;
      if (left <= 0) return endSprint();
      g("pgSprintTime").textContent = fmt(left);
      g("pgSprintStats").textContent = tf("pz.sprintStats", session.sprint.runs, session.sprint.solves);
    }
    g("pgDrillTime").textContent = session.drill ? tf("pz.drillLine", session.drill.name, fmt(now - session.drill.start)) : "";
  }

  function startSprint(min) {
    session.sprint = { start: Date.now(), end: Date.now() + min * 60000, min, runs: 0, solves: 0 };
    g("pgSprintIdle").hidden = true; g("pgSprintOn").hidden = false;
    tick(); g("pgEditor").focus();
  }
  function endSprint() {
    const s = session.sprint; if (!s) return;
    session.sprint = null;
    const m = median(gaps(s.start));
    const rec = { date: today(), min: s.min, runs: s.runs, solves: s.solves, medianGap: m };
    const prevBest = store.sprints.filter(x => x.min === s.min).reduce((b, x) => Math.max(b, x.runs), 0);
    store.sprints.push(rec); persist();
    g("pgSprintIdle").hidden = false; g("pgSprintOn").hidden = true;
    g("pgResult").innerHTML = `<div class="pg-res pass"><div class="pg-res-head"><b>${e(tf("pz.sprintEnd", s.min))}</b></div>
      <p>${tf("pz.sprintSum", s.runs, s.solves, m === null ? "—" : Math.round(m / 1000) + " s")}</p>
      <p class="pg-muted">${e(s.runs > prevBest ? tf("pz.newBest", s.min) : tf("pz.yourRec", pl(prevBest, "u.run")))}${e(t("pz.restGo"))}</p></div>`;
    renderSprints();
  }
  function renderSprints() {
    const last = store.sprints.slice(-5).reverse();
    g("pgSprintHist").innerHTML = last.length ? last.map(x =>
      `<div class="pg-logrow"><span>${x.date}</span><span>${e(tf("pz.min", x.min))}</span><span>${e(pl(x.runs, "u.run"))}</span><span>${x.solves} ${e(t("pz.solved"))}</span></div>`).join("")
      : `<p class="pg-muted">${e(t("pz.noSprints"))}</p>`;
  }

  function startDrill() {
    const solved = PUZZLES.map((p, i) => ({ p, i })).filter(x => isSolved(x.p.name));
    if (!solved.length) return;
    solved.sort((a, b) => ((store.stats[a.p.name] || {}).lastDrill || 0) - ((store.stats[b.p.name] || {}).lastDrill || 0));
    const pick = solved[0];
    openPuzzle(pick.i, { blank: true });
    session.drill = { name: pick.p.name, start: Date.now() };
    const best = (store.stats[pick.p.name] || {}).bestTime;
    g("pgResult").innerHTML = `<div class="pg-res">${tf("pz.drillB", e(pick.p.name), best ? fmt(best) : "—")}</div>`;
  }

  function nextPuzzle() {
    const next = PUZZLES.findIndex((q, i) => i > session.cur && !isSolved(q.name));
    openPuzzle(next >= 0 ? next : Math.min(session.cur + 1, PUZZLES.length - 1));
  }

  /* ---------- events ---------- */
  function init() {
    g("pgList").addEventListener("click", ev => { const it = ev.target.closest("[data-pz]"); if (it) { session.drill = null; openPuzzle(+it.dataset.pz); } });
    g("pgRun").addEventListener("click", runCurrent);
    g("pgReset").addEventListener("click", () => { const p = PUZZLES[session.cur]; delete store.draft[p.name]; persist(); g("pgEditor").value = template(p); updateCols(); g("pgEditor").focus(); });
    g("pgDrill").addEventListener("click", startDrill);
    g("pgSprintStop").addEventListener("click", endSprint);
    document.querySelectorAll("[data-sprint]").forEach(b => b.addEventListener("click", () => startSprint(+b.dataset.sprint)));
    const ed = g("pgEditor");
    ed.addEventListener("keydown", ev => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); runCurrent(); return; }
      if (ev.key === "Escape") { g("pgRun").focus(); return; }
      if (ev.key === "Tab") {
        ev.preventDefault();
        const s = ed.selectionStart;
        if (ev.shiftKey) {
          const lineStart = ed.value.lastIndexOf("\n", s - 1) + 1;
          if (ed.value.startsWith("    ", lineStart)) {
            ed.setRangeText("", lineStart, lineStart + 4, "start");
            ed.dispatchEvent(new Event("input"));
          }
          return;
        }
        ed.setRangeText("    ", s, ed.selectionEnd, "end");
        ed.dispatchEvent(new Event("input"));
      }
    });
    ed.addEventListener("input", () => {
      session.edited = true; session.editedAt = Date.now();
      store.draft[PUZZLES[session.cur].name] = ed.value; persist();
      updateCols();
    });
    /* warm the Python runtime + refocus the editor when the Puzzles sub-tab
       opens — window.pgWake lets dashboard "next up" (data-dpz → goTab) do
       the same without a click */
    window.pgWake = () => { loadPython(); setTimeout(() => ed.focus(), 50); };
    const pzTab = document.querySelector('.subtab[data-sub="puzzles"]') || document.querySelector('.tab[data-tab="puzzles"]');
    if (pzTab) pzTab.addEventListener("click", () => pgWake());
    const firstOpen = PUZZLES.findIndex(p => !isSolved(p.name));
    openPuzzle(firstOpen >= 0 ? firstOpen : 0);
    renderLog(); renderStamina(); renderSprints();
    setInterval(tick, 1000);
  }
  init();
})();

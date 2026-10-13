/* Trainer — Practicum-style auto-graded exercises.
   Layout (Yandex Practicum trainer): Task (left) · Code + Result/Theory (right)
   · action bar (Hint / Reset / Check → Next) · "Topics" navigation drawer.
   Python/NumPy runs in the browser via Pyodide (same engine as Tensor Puzzles).
   Deep link: /showcase/#ex=<exerciseId> opens the Trainer tab on that exercise. */
(() => {
  const LS = "aio-trainer-v1";

  const store = Object.assign({ solved: {}, draft: {}, att: {}, gaveUp: {}, checks: {} },
    safeJSON(LS, {}));
  const persist = () => { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (_) { /* quota/private-mode: progress stays in-memory */ } };

  const session = { mod: null, cur: -1, passed: false, openMods: {}, pane: "result", opened: false, version: 0, result: null };

  const g = id => document.getElementById(id);
  const e = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Safe mini-markdown: everything is escaped first; only ```blocks```, `code`, **bold**
     and newlines become markup. Code contents are never re-processed. */
  const inline = s => s.split(/(`[^`\n]+`)/g).map((p, i) =>
    i % 2 ? `<code>${e(p.slice(1, -1))}</code>`
          : e(p).replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")).join("");
  const md = s => {
    const parts = String(s || "").split(/```/g);
    if (parts.length % 2 === 0) parts[parts.length - 2] += "```" + parts.pop(); // unclosed fence → text
    return parts.map((p, i) => {
      if (i % 2) return `<pre class="tr-pre">${e(p.replace(/^(?:python|py|text)?\n/, "").replace(/\n$/, ""))}</pre>`;
      if (i > 0) p = p.replace(/^\n/, "");
      if (i < parts.length - 1) p = p.replace(/\n$/, "");
      return inline(p);
    }).join("");
  };

  const exOf = mod => EXERCISES.filter(x => x.module === mod).slice().sort((a, b) => a.diff - b.diff);
  const modWithEx = () => MODULES.filter(m => exOf(m.id).length);
  const isSolved = id => !!store.solved[id];
  const curEx = () => exOf(session.mod)[session.cur];
  const stars = n => `<span class="lvl" title="${e(tf("tr.lvlTitle", n))}">${[1, 2, 3].map(i => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span>`;
  const modTitle = id => loc((MODULES.find(m => m.id === id) || {}).title) || id;

  /* ---------- Python runtime (worker — a hung loop can't freeze the tab) ---------- */
  const trStatus = t => { const el = g("trStatus"); if (el) { el.textContent = t; el.hidden = !t; } };
  const RUN_TIMEOUT_MS = 30000;
  const runner = PyRunner.create({ harness: TRAINER_HARNESS, onStatus: trStatus, callTimeoutMs: RUN_TIMEOUT_MS });
  const loadPython = () => runner.init();

  /* ---------- layout helpers ---------- */
  function fitHeight() {
    const root = g("prTrainer"), hd = document.querySelector("header");
    if (root) root.style.setProperty("--pr-top", (hd ? hd.offsetHeight : 0) + "px");
  }
  window.addEventListener("resize", fitHeight);

  /* ---------- navigation drawer (modules → exercises) ---------- */
  function exState(x) { return isSolved(x.id) ? "done" : store.att[x.id] ? "tried" : "new"; }
  function renderNav() {
    const host = g("trMods");
    if (!host) return;
    host.innerHTML = modWithEx().map(m => {
      const xs = exOf(m.id);
      const d = xs.filter(x => isSolved(x.id)).length;
      const open = session.openMods[m.id] ?? session.mod === m.id;
      const items = xs.map((x, i) => {
        const st = exState(x);
        const cur = m.id === session.mod && i === session.cur;
        return `<div class="tr-item ${cur ? "cur" : ""} ${st === "done" ? "ok" : ""}" data-mod="${e(m.id)}" data-ex="${i}" role="button" tabindex="0">
          <span class="pr-sdot ${st}" title="${e(st === "done" ? t("tr.stDone") : st === "tried" ? t("tr.stTried") : t("tr.stNew"))}"></span>
          <span class="tr-name">${e(loc(x.title))}</span>
          <span class="tr-meta">L${x.diff}${+store.att[x.id] > 0 ? " · " + (+store.att[x.id]) : ""}</span>
        </div>`;
      }).join("");
      return `<div class="pr-navmod ${open ? "open" : ""}">
        <div class="tr-mod ${session.mod === m.id ? "cur" : ""}" data-mod="${e(m.id)}" role="button" tabindex="0" aria-expanded="${m.id in session.openMods ? session.openMods[m.id] : session.mod === m.id}">
          <span class="pr-caret"></span>
          <span class="tr-mid">${e(m.id)}</span>
          <span class="tr-mname">${e(loc(m.title))}</span>
          <span class="tr-mcnt ${d === xs.length ? "full" : ""}">${d}/${xs.length}</span>
        </div>
        <div class="pr-navex">${items}</div>
      </div>`;
    }).join("") || `<p class="tr-empty">${e(t("tr.noEx"))}</p>`;
  }
  function setDrawer(open) {
    const d = g("trDrawer"), b = g("trDrawerBack");
    if (!d) return;
    d.classList.toggle("open", open); d.setAttribute("aria-hidden", String(!open));
    const nb = g("trNavBtn"); if (nb) nb.setAttribute("aria-expanded", String(open));
    b.hidden = !open;
    if (open) {
      renderNav();
      const c = d.querySelector(".tr-item.cur");
      if (c) c.scrollIntoView({ block: "center" });
      const first = d.querySelector(".tr-item.cur, .tr-item, #trDrawerClose"); if (first) first.focus();
    } else {
      const nb = g("trNavBtn"); if (nb) nb.focus();
    }
  }

  /* ---------- editor gutter + highlight overlay ---------- */
  function syncGutter() {
    const ed = g("trEditor"), gu = g("trGutter"), hl = g("trHlCode"), hp = g("trHl");
    if (!ed || !gu) return;
    const n = ed.value.split("\n").length;
    if (+gu.dataset.n !== n) {
      gu.dataset.n = n;
      gu.textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n");
    }
    gu.scrollTop = ed.scrollTop;
    if (hl && hp && typeof msHl === "function") {
      const src = ed.value;
      if (hp.dataset.src !== src) {
        hp.dataset.src = src;
        hl.innerHTML = msHl(src + "\n", "python");   // trailing \n keeps height in sync with the textarea
      }
      hp.scrollTop = ed.scrollTop;
      hp.scrollLeft = ed.scrollLeft;
    }
  }

  /* ---------- right-bottom pane: Результат / Теория ---------- */
  function setPane(p) {
    session.pane = p;
    const th = p === "theory";
    g("trResult").hidden = th;
    g("trTheory").hidden = !th;
    g("trPaneTitle").textContent = th ? t("tr.theory") : t("tr.result");
    const b = g("trTheoryToggle");
    b.textContent = th ? t("tr.result") : t("tr.theory");
    b.setAttribute("aria-pressed", String(th));
  }

  /* ---------- primary button state ---------- */
  function nextTarget() {
    const xs = exOf(session.mod);
    if (session.cur < xs.length - 1) return [session.mod, session.cur + 1];
    const mods = modWithEx(), k = mods.findIndex(m => m.id === session.mod);
    return mods[k + 1] ? [mods[k + 1].id, 0] : null;
  }
  function setPrimary() {
    const b = g("trCheck"), re = g("trRecheck");
    const next = session.passed && nextTarget();
    b.dataset.mode = next ? "next" : "check";
    b.textContent = next ? t("tr.next") : t("tr.check");
    b.title = next ? t("tr.next") : t("tr.checkTitle");
    re.hidden = !next;
  }

  /* ---------- exercise view ---------- */
  function setTaskErr(msg) {
    const el = g("trTaskErr");
    el.textContent = msg || ""; el.hidden = !msg;
  }
  /* remember the latest result per exercise so leaving and re-opening the tab
     doesn't wipe the pane (session-only — a reload shows the state summary) */
  function setResult(id, html) {
    session.result = { id, html };
    g("trResult").innerHTML = html;
  }
  function openEx(mod, i) {
    const x = exOf(mod)[i];
    if (!x) return;
    session.mod = mod; session.cur = i; session.passed = false; session.opened = true; session.version++;
    store.pos = { id: x.id, mod, cur: i }; persist();
    const n = exOf(mod).length;
    g("trEmpty").style.display = "none";
    g("trWork").style.display = "";
    g("trBar").hidden = false;
    // provenance: which lesson teaches this exercise (first LESSON_EX match)
    let prov = "";
    if (typeof LESSON_EX !== "undefined") {
      for (const [k, ids] of Object.entries(LESSON_EX)) {
        if (ids.includes(x.id)) { const [lm, li] = k.split("|"); const lt = loc((lessonsOf(lm)[+li] || {}).title) || tf("tr.lessonN", +li + 1); prov = ` · <a href="#" data-dl="${lm}|${li}" class="pr-provlink">${e(tf("tr.taughtIn", lt))}</a>`; break; }
      }
    }
    g("trCrumb").innerHTML = `<b>${e(mod)}</b> · ${e(modTitle(mod))}${prov}`;
    g("trCounter").textContent = tf("tr.exN", i + 1, n, mod);
    g("trTitle").textContent = loc(x.title);
    g("trMeta").innerHTML = `${stars(x.diff)}<span class="pr-min">~${e(x.minutes)} ${t("u.min")}</span>` +
      (isSolved(x.id) ? `<span class="pr-badge ok">${store.gaveUp[x.id] ? e(t("tr.doneSaw")) : e(t("tr.stDone"))}</span>`
        : store.gaveUp[x.id] ? `<span class="pr-badge gaveup">${e(t("tr.sawSol"))}</span>`
        : +store.att[x.id] > 0 ? `<span class="pr-badge">${e(pl(+store.att[x.id], "u.attempt"))}</span>` : "");
    g("trPrompt").innerHTML = imd(loc(x.prompt));
    g("trTheoryBody").innerHTML = imd(loc(x.theory) || t("tr.noTheory"));
    g("trHintBox").innerHTML = "";  // rendered lazily on open, after the attempt gate
    setTaskErr("");
    const ed = g("trEditor");
    ed.value = store.draft[x.id] !== undefined ? store.draft[x.id] : x.starter;
    ed.scrollTop = 0; syncGutter();
    if (window.matchMedia && !matchMedia("(pointer: coarse)").matches) ed.focus();
    const solAge = isSolved(x.id) && store.solved[x.id].at ? Math.floor((Date.now() - store.solved[x.id].at) / 864e5) : null;
    const lastRes = session.result && session.result.id === x.id ? session.result.html : null;
    g("trResult").innerHTML = lastRes || (isSolved(x.id)
      ? `<div class="tr-pass pr-soft">${e(tf("tr.already", +store.solved[x.id].att > 0 ? pl(+store.solved[x.id].att, "u.attempt") : "", solAge !== null && solAge > 0 ? solAge : null))}</div>`
      : `<p class="tr-muted">${tf("tr.writeAndCheck", x.tests || 40)}</p>`);
    setPane("result");
    setPrimary();
    renderNav();
    if (!runner.ready) loadPython().catch(err => trStatus(err.message || t("tr.loadRetry")));  // warm the runtime while the student reads the prompt
  }

  function showCase(res) {
    if (!res.case) return "";
    const inp = Object.entries(res.case).map(([k, v]) =>
      `<div class="tr-arg"><span class="tr-lbl">${e(k)}</span><pre class="tr-pre">${e(JSON.stringify(v))}</pre></div>`).join("");
    let out = "";
    if (res.expected !== undefined && res.got !== undefined)
      out += `<div class="tr-cmp"><div><span class="tr-lbl">${e(t("tr.expected"))}</span><pre class="tr-pre">${e(JSON.stringify(res.expected))}</pre></div>
              <div><span class="tr-lbl">${e(t("tr.yours"))}</span><pre class="tr-pre">${e(JSON.stringify(res.got))}</pre></div></div>`;
    else if (res.expected !== undefined)
      out += `<div class="tr-cmp"><div><span class="tr-lbl">${e(t("tr.expected"))}</span><pre class="tr-pre">${e(JSON.stringify(res.expected))}</pre></div></div>`;
    return `<div class="tr-case"><div class="tr-lbl">${e(tf("tr.inputCase", res.test))}</div>${inp}${out}</div>`;
  }

  function showOut(res) {
    if (!res.out || !String(res.out).trim()) return "";
    return `<div class="tr-case"><div class="tr-lbl">${e(t("tr.stdout"))}</div><pre class="tr-pre">${e(res.out)}</pre></div>`;
  }

  /* Per-press seed: press N of an exercise runs one deterministic-but-fresh test
     set — the main run plus the two verification runs all derive from the press
     number, so re-checking the same code gets new tests instead of a lucky
     re-roll of an identical set. */
  function seedFor(x, n) {
    let h = 2166136261 >>> 0;
    for (const c of x.id) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return (h + Math.imul(n, 0x9e3779b9)) >>> 0;
  }

  let running = false;
  async function check() {
    const x = curEx();
    if (!x || running) return;
    running = true;
    const version = session.version;
    const btn = g("trCheck");
    btn.disabled = true;
    try {
      if (!runner.ready) {
        g("trResult").innerHTML = `<p class="tr-muted pr-loading">${e(t("tr.loading"))}</p>`;
        setPane("result");
        try { await loadPython(); }
        catch (err) { g("trResult").innerHTML = `<div class="tr-fail">${e(err.message || t("tr.loadFail"))}</div>`; return; }
      }
      if (curEx() !== x || session.version !== version) return;
      const code = g("trEditor").value;
      if (!code.trim()) { trStatus(t("tr.writeFirst")); setTimeout(() => trStatus(""), 1800); return; }
      store.draft[x.id] = code;
      // every press gets a fresh test set; lastCode marks the code that last
      // consumed a counted attempt (unchanged re-checks don't inflate attempts)
      const press = (store.checks[x.id] = (store.checks[x.id] || 0) + 1);
      const unjudged = !store.lastCode || store.lastCode[x.id] !== code;
      persist();
      if (window.ACT) ACT.log("check");
      trStatus(t("tr.running"));
      await new Promise(r => setTimeout(r, 20)); // let the status paint
      const j = JSON.stringify({ gen: x.gen, solve: x.solve, entry: x.entry, tests: x.tests || 40 });
      const callRun = seed => runner.call("run_exercise", [j, code, 0, seed], RUN_TIMEOUT_MS)
        .then(JSON.parse)
        .catch(err => ({ status: "error", stage: "run", msg: String(err && err.message || err) }));
      let res = await callRun(seedFor(x, press));
      if (res.status === "pass") {
        // lucky-pass guard: a pass must survive two more independent test seeds
        trStatus(t("tr.verifying"));
        for (let v = 1; v <= 2 && res.status === "pass"; v++) {
          const r2 = await callRun(seedFor(x, 1000 * v + press));
          if (r2.status !== "pass") res = r2;
        }
      }
      trStatus("");
      if (curEx() !== x || session.version !== version) return;  // exercise switched mid-check — discard the stale result
      // course-side failures (broken generator/reference) don't spend an attempt
      const courseBug = res.status === "badgen" || res.status === "badref";
      if (!courseBug) {
        if (unjudged) store.att[x.id] = (store.att[x.id] || 0) + 1;
        (store.lastCode ||= {})[x.id] = code;
        persist();
      }
      setPane("result");
      const att = store.att[x.id] || 0;
      if (res.status === "pass") {
        store.solved[x.id] = { at: Date.now(), att, code }; persist();
        setResult(x.id, `<div class="pr-success"><div class="pr-success-t">${e(t("tr.passed"))}</div>
          <div class="pr-success-s">${e(tf("tr.passSub", res.tests, att))}</div>
          ${showOut(res)}
          <div class="pr-success-s" style="opacity:.75;margin-top:4px">${e(t("tr.wantMore"))}</div>${projectCTA(x)}</div>`);
        setTaskErr("");
        session.passed = true;
        g("trMeta").querySelectorAll(".pr-badge").forEach(b => b.remove());
        g("trMeta").insertAdjacentHTML("beforeend", `<span class="pr-badge ok">${e(store.gaveUp[x.id] ? t("tr.doneSaw") : t("tr.stDone"))}</span>`);
        setPrimary(); renderNav();
        if (typeof refreshProgress === "function") refreshProgress();
        setTimeout(() => g("trCheck").focus(), 100);
        return;
      }
      let summary, html;
      if (res.status === "wrong") {
        summary = tf("tr.wrongSum", res.test, res.diff || "");
        html = `<div class="tr-fail">${e(tf("tr.wrong", res.test, x.tests || 40))}</div>
          ${res.diff ? `<p class="tr-diff">${e(res.diff)}</p>` : ""}${showCase(res)}${showOut(res)}
          <p class="tr-muted">${e(tf("tr.fixAndRetry", att))}</p>`;
      } else if (courseBug) {
        summary = t("tr.courseBug");
        html = `<div class="tr-fail">${e(tf("tr.courseBugMsg", res.msg || res.status))}</div>
          <p class="tr-muted">${e(t("tr.courseBugSub"))}</p>`;
      } else {
        summary = String(res.msg || res.status).split("\n")[0];
        html = `<div class="tr-fail">${e(res.msg || res.status)}</div>${showCase(res)}${showOut(res)}
          <p class="tr-muted">${e(tf("tr.fixErr", att))}</p>`;
      }
      if (att === 1) html += `<p class="tr-muted">${t("tr.hintOpen")}</p>`;
      // escalation after repeated fails: point at concrete next steps instead of a bare retry
      if (att >= 3) {
        let dl = "";
        if (typeof LESSON_EX !== "undefined") {
          for (const [k, ids] of Object.entries(LESSON_EX)) {
            if (ids.includes(x.id)) { dl = k; break; }
          }
        }
        html += `<p class="tr-stuck">${tf("tr.stuck", dl)}</p>`;
      }
      setResult(x.id, html);
      setTaskErr(summary);
      renderNav();
    } finally {
      running = false; btn.disabled = false;
    }
  }

  /* When a pass completes every exercise in the sprint that contains this
     module, point at the sprint project — it's the sprint's last step. */
  function projectCTA(x) {
    if (typeof SPRINTS === "undefined" || typeof SPRINT_PROJECTS === "undefined") return "";
    const sp = SPRINTS.find(s => s.mods.includes(x.module));
    const pb = sp && SPRINT_PROJECTS[sp.id];
    if (!pb) return "";
    if (!sp.mods.every(mid => exOf(mid).every(y => isSolved(y.id)))) return "";
    const pst = safeJSON("aio-projects-v1", {})[sp.id] || {};
    const rDone = pb.rubric.filter((_, i) => pst["r" + i]).length;
    if (rDone >= pb.rubric.length) return "";
    return `<div class="tr-projcta">${tf("tr.projCta", sp.id)}
      <button type="button" class="link" data-project-link="${e(sp.id)}">${e(loc(sp.name))}: ${e(loc(sp.project))}</button></div>`;
  }

  /* ---------- reference solution reveal ---------- */
  function showSolution() {
    const x = curEx();
    if (!x || !x.solve) return;
    const solved = isSolved(x.id), att = +store.att[x.id] || 0;
    if (!solved && !store.gaveUp[x.id]) {
      if (att < 2) { setTaskErr(tf("tr.solGate", att)); return; }
      if (!confirm(t("tr.solConfirm"))) return;
      store.gaveUp[x.id] = true; persist(); renderNav();
      if (!g("trMeta").querySelector(".pr-badge.ok")) {
        g("trMeta").querySelectorAll(".pr-badge.gaveup, .pr-badge:not(.ok)").forEach(b => b.remove());
        g("trMeta").insertAdjacentHTML("beforeend", `<span class="pr-badge gaveup">${e(t("tr.sawSol"))}</span>`);
      }
    }
    setPane("result");
    const mine = solved && store.solved[x.id] && store.solved[x.id].code;
    setResult(x.id, `<div class="tr-case"><div class="tr-lbl">${e(solved ? t("tr.refYours") : t("tr.ref"))}</div>
      <pre class="tr-pre">${e(x.solve)}</pre>
      ${mine ? `<div class="tr-lbl" style="margin-top:10px">${e(t("tr.yourPass"))}</div><pre class="tr-pre">${e(mine)}</pre>` : ""}
      ${solved ? "" : `<p class="tr-muted">${e(t("tr.gaveUp"))}</p>`}</div>`);
  }

  /* ---------- hint modal ---------- */
  function setHint(open) {
    const x = curEx();
    if (open && x && !isSolved(x.id) && !store.gaveUp[x.id] && !(+store.att[x.id] > 0)) {
      setTaskErr(t("tr.hintGate"));
      return;
    }
    const m = g("trHintModal");
    m.hidden = !open;
    if (open) {
      if (x) g("trHintBox").innerHTML = imd(loc(x.hint) || t("tr.noHint"));
      if (x && !store.hintUsed) store.hintUsed = {};
      if (x && !store.hintUsed[x.id]) { store.hintUsed[x.id] = { at: Date.now(), att: +store.att[x.id] || 0 }; persist(); if (window.ACT) ACT.log("hint"); }
      g("trHintClose").focus();
    } else if (g("trWork").style.display !== "none") { const h = g("trHint"); if (h) h.focus(); }
  }

  /* ---------- public hooks (used by app.js / dashboard.js) ---------- */
  /* trainer pane is a sub-pane (#sub-trainer) inside the Practice tab now;
     #tab-trainer fallback keeps old markup working */
  const trainerTabActive = () => { const p = g("sub-trainer") || g("tab-trainer"); return !!(p && p.classList.contains("active")); };
  window.openTrainer = (mod, i = 0) => {
    if (!trainerTabActive()) goTab("trainer");
    openEx(mod, i);
  };
  window.openTrainerEx = id => {
    const x = EXERCISES.find(v => v.id === id);
    if (x) openTrainer(x.module, exOf(x.module).indexOf(x));
    return !!x;
  };

  /* ---------- deep link: #ex=<exerciseId> ---------- */
  function handleHash() {
    const m = /(?:^#|&)ex=([^&]+)/.exec(location.hash || "");
    if (!m) return;
    let id;
    try { id = decodeURIComponent(m[1]); } catch { return; }
    const x = EXERCISES.find(v => v.id === id);
    if (!x) return; // unknown id → ignore
    if (!trainerTabActive()) goTab("trainer");
    openEx(x.module, exOf(x.module).indexOf(x));
    window.scrollTo({ top: 0 });
  }
  window.addEventListener("hashchange", handleHash);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", handleHash);
  else setTimeout(handleHash, 0);

  /* ---------- events ---------- */
  document.addEventListener("click", ev => {
    const el = ev.target;
    if (!el.closest || !el.closest("#prTrainer")) return;
    if (el.closest("#trNavBtn")) { setDrawer(!g("trDrawer").classList.contains("open")); return; }
    if (el.closest("#trDrawerClose") || el.closest("#trDrawerBack")) { setDrawer(false); return; }
    const it = el.closest(".tr-item");
    if (it) { openEx(it.dataset.mod, +it.dataset.ex); setDrawer(false); return; }
    const m = el.closest(".tr-mod");
    if (m) {
      const id = m.dataset.mod, wrap = m.parentElement;
      const open = !wrap.classList.contains("open");
      wrap.classList.toggle("open", open);
      m.setAttribute("aria-expanded", String(open));
      session.openMods[id] = open;
      return;
    }
    if (el.closest("#trCheck")) {
      if (g("trCheck").dataset.mode === "next") { const n = nextTarget(); if (n) openEx(n[0], n[1]); }
      else check();
      return;
    }
    if (el.closest("#trRecheck")) { check(); return; }
    if (el.closest("#trReset")) {
      const x = curEx();
      if (x && confirm(t("tr.resetConfirm"))) {
        g("trEditor").value = x.starter; delete store.draft[x.id]; persist(); syncGutter();
        session.passed = false; session.result = null; setPrimary(); setTaskErr("");
        setResult(x.id, `<p class="tr-muted">${t("tr.restored")}</p>`);
      }
      return;
    }
    if (el.closest("#trHint")) { setHint(true); return; }
    if (el.closest("#trSolution")) { showSolution(); return; }
    if (el.closest("#trHintClose") || el === g("trHintModal")) { setHint(false); return; }
    if (el.closest("#trTheoryToggle")) { setPane(session.pane === "theory" ? "result" : "theory"); return; }
  });
  document.addEventListener("keydown", ev => {
    if (ev.key === "Escape") {
      if (g("trHintModal") && !g("trHintModal").hidden) { setHint(false); return; }
      if (g("trDrawer") && g("trDrawer").classList.contains("open")) { setDrawer(false); return; }
    }
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.closest && ev.target.closest("#trDrawer [role=button]")) {
      ev.preventDefault(); ev.target.click(); return;
    }
    const ed = g("trEditor");
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
      const pane = g("sub-trainer") || g("tab-trainer");
      if (pane && pane.classList.contains("active") && session.cur >= 0) { ev.preventDefault(); check(); }
      return;
    }
    if (document.activeElement !== ed) return;
    if (ev.key === "Escape") { g("trCheck").focus(); return; }
    if (ev.key === "Tab" && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      ev.preventDefault();
      const v = ed.value, s = ed.selectionStart, en = ed.selectionEnd;
      const ls = v.lastIndexOf("\n", s - 1) + 1;
      if (s !== en && v.slice(s, en).includes("\n")) {   // multi-line selection → (de)indent every touched line
        let le = v.lastIndexOf("\n", en - 1) + 1;        // a selection ending at a line start doesn't touch that line
        if (en === le) en = le - 1;
        const block = v.slice(ls, en);
        const out = ev.shiftKey
          ? block.split("\n").map(l => l.replace(/^(?:    |\t| {1,3})/, "")).join("\n")
          : block.split("\n").map(l => l ? "    " + l : l).join("\n");
        ed.setRangeText(out, ls, en, "select");
      } else if (ev.shiftKey) { // dedent one level at the caret
        if (v.startsWith("    ", ls)) ed.setRangeText("", ls, ls + 4, "start");
      } else {
        ed.setRangeText("    ", s, en, "end");
      }
      ed.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    if (ev.key === "Enter" && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      ev.preventDefault();                              // IDE auto-indent: keep indent, +1 level after ":"
      const v = ed.value, s = ed.selectionStart;
      const line = v.slice(v.lastIndexOf("\n", s - 1) + 1, s);
      const ind = (line.match(/^[ \t]*/) || [""])[0];
      const extra = /:\s*(?:#.*)?$/.test(line) ? "    " : "";
      ed.setRangeText("\n" + ind + extra, s, ed.selectionEnd, "end");
      ed.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  document.addEventListener("input", ev => {
    if (ev.target === g("trEditor") && session.cur >= 0) {
      syncGutter();
      const x = curEx();
      if (x) { store.draft[x.id] = ev.target.value; persist(); }
      if (session.passed) { session.passed = false; setPrimary(); }  // edited after a pass → the button is "Check" again, not "Next"
    }
  });
  document.addEventListener("scroll", ev => { if (ev.target === g("trEditor")) syncGutter(); }, true);

  /* ---------- init ---------- */
  window.initTrainer = () => {
    fitHeight();
    if (session.opened && session.mod && curEx()) { renderNav(); return; }  // still open — keep the result pane intact across tab switches
    // resume by the stored exercise id — sorted indexes shift when exercises are added
    const px = store.pos && EXERCISES.find(v => v.id === store.pos.id);
    if (px) { openEx(px.module, exOf(px.module).indexOf(px)); return; }
    const first = modWithEx().find(m => exOf(m.id).some(x => !isSolved(x.id))) || modWithEx()[0];
    if (first) {
      const xs2 = exOf(first.id);
      openEx(first.id, Math.max(0, xs2.findIndex(x => !isSolved(x.id))));
    } else renderNav();
  };
})();

/* Entry test — Practicum "входной тест": diagnostic → recommended starting point. */
(() => {
  const LS = "aio-entrytest-v1";
  let store = safeJSON(LS, null);
  const g = id => document.getElementById(id);
  const e = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = s => e(s).replace(/```([\s\S]*?)```/g, (_, c) => `<pre class="tr-pre">${c.replace(/^\n/, "")}</pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");

  let run = null; // {i, answers:[]}

  const AREAS = { python: "et.area.python", numpy: "et.area.numpy", ml: "et.area.ml", math: "et.area.math" };
  const areaName = a => t(AREAS[a] || a);

  function recommend(r) {
    // score by level: heavy misses on level-1 → start at S1; strong → suggest later sprint
    const byLv = { 1: [0, 0], 2: [0, 0], 3: [0, 0] };
    ENTRY_TEST.forEach((q, i) => { const lv = byLv[q.level]; if (!lv) return; lv[1]++; if (r.answers[i] === q.answer) lv[0]++; });
    if (byLv[1][0] / byLv[1][1] < 0.7) return { sprint: "S1", txt: t("et.rec.S1") };
    if (byLv[2][0] / byLv[2][1] < 0.7) return { sprint: "S2", txt: t("et.rec.S2") };
    if (byLv[3][0] / byLv[3][1] >= 0.6) return { sprint: "S3", txt: t("et.rec.S3") };
    return { sprint: "S2", txt: t("et.rec.S2b") };
  }

  function renderIntro() {
    const done = store;
    g("etBody").innerHTML = `
      <div class="et-card">
        <h2>${e(t("et.h"))}</h2>
        <p class="et-p">${e(tf("et.sub", ENTRY_TEST.length))}</p>
        ${done ? `<div class="et-prev">${tf("et.best", done.bestScore ?? done.score, done.n, done.rec && done.rec.sprint)} <button type="button" class="link" data-et="result">${e(t("et.view"))}</button></div>` : ""}
        <button class="btn btn--primary" data-et="start">${e(t("et.start"))}</button>
      </div>`;
  }

  function renderQ() {
    const wasIn = g("etBody") && g("etBody").contains(document.activeElement);
    const q = ENTRY_TEST[run.i];
    const answered = run.answers[run.i] !== undefined;
    g("etBody").innerHTML = `
      <div class="et-card">
        <div class="et-top"><span class="db-muted">${e(tf("et.qN", run.i + 1, ENTRY_TEST.length, areaName(q.area)))}</span>
          <div class="progress"><i style="width:${run.i / ENTRY_TEST.length * 100}%"></i></div></div>
        <h3 class="qt">${imd(loc(q.q))}</h3>
        <div class="opts">${q.options.map((o, oi) =>
          `<button class="opt ${answered ? (oi === q.answer ? "ok" : oi === run.answers[run.i] ? "bad" : "") : ""}" data-opt="${oi}" ${answered ? "disabled" : ""}>${imd(loc(o))}</button>`).join("")}</div>
        <div class="reveal" ${answered ? "" : "hidden"}><b>${e(t("et.why"))}</b> ${imd(loc(q.explain))}</div>
        ${answered ? `<button class="btn btn--primary" data-et="next" style="margin-top:14px">${e(run.i < ENTRY_TEST.length - 1 ? t("et.next") : t("et.results"))}</button>` : ""}
      </div>`;
    if (wasIn) {
      const nxt = g("etBody").querySelector('[data-et="next"]') || g("etBody").querySelector(".opt");
      if (nxt) nxt.focus();
    }
  }

  function renderResult(fresh) {
    if (!Array.isArray(run.answers)) { renderIntro(); return; }
    const byArea = {}, byLv = { 1: [0, 0], 2: [0, 0], 3: [0, 0] };
    ENTRY_TEST.forEach((q, i) => {
      (byArea[q.area] ||= [0, 0])[1]++; (byLv[q.level] ||= [0, 0])[1]++;
      if (run.answers[i] === q.answer) { byArea[q.area][0]++; byLv[q.level][0]++; }
    });
    const score = ENTRY_TEST.reduce((s, q, i) => s + (run.answers[i] === q.answer ? 1 : 0), 0);
    const rec = recommend(run);
    const prev = store && typeof store.score === "number" ? store.score : null;
    const SORD = { S1: 1, S2: 2, S3: 3 };
    let best = rec, keptHigher = false, attempts = store && store.attempts || [];
    if (fresh) {
      const better = store && store.rec && SORD[store.rec.sprint] > SORD[rec.sprint];
      best = better ? store.rec : rec;
      keptHigher = best.sprint !== rec.sprint;
      // keep the score paired with whichever attempt earned the stored placement
      const bestScore = better ? (store.bestScore ?? store.score) : score;
      attempts = attempts.concat({ at: Date.now(), score, sprint: rec.sprint }).slice(-10);
      store = { score, n: ENTRY_TEST.length, rec: best, bestScore, attempts, answers: run.answers };
      localStorage.setItem(LS, JSON.stringify(store));
    } else if (store && store.rec) {
      best = store.rec;
      keptHigher = best.sprint !== rec.sprint;
    }
    const delta = !fresh || prev === null ? "" : ` <span class="db-muted">${e(tf("et.vsLast", score - prev))}</span>`;
    g("etBody").innerHTML = `
      <div class="et-card">
        <h2>${e(tf("et.result", score, ENTRY_TEST.length))}${delta}</h2>
        ${attempts.length > 1 ? `<p class="db-muted">${e(tf("et.attempts", attempts.length))}</p>` : ""}
        <div class="et-areas">${Object.entries(byArea).map(([a, [c, n]]) =>
          `<div class="et-area"><span>${e(areaName(a))}</span><div class="progress"><i style="width:${c / n * 100}%"></i></div><b>${c}/${n}</b></div>`).join("")}</div>
        <div class="et-areas">${Object.entries(byLv).map(([l, [c, n]]) =>
          `<div class="et-area"><span>${e(tf("et.level", l))}</span><div class="progress"><i style="width:${c / n * 100}%"></i></div><b>${c}/${n}</b></div>`).join("")}</div>
        <div class="tr-pass" style="margin:14px 0">${e(rec.txt)}</div>
        ${keptHigher ? `<p class="db-muted">${tf("et.kept", rec.sprint, best.sprint)}</p>` : ""}
        <button class="btn btn--primary" data-et="path">${e(t("et.goPath"))}</button>
        <button class="btn btn--ghost" data-et="retake">${e(t("et.retake"))}</button>
      </div>`;
  }

  document.addEventListener("click", ev => {
    const et = ev.target.closest("[data-et]");
    if (et) {
      const a = et.dataset.et;
      if (a === "start" || a === "retake") { run = { i: 0, answers: [] }; renderQ(); }
      else if (a === "next") { run.i++; run.i < ENTRY_TEST.length ? renderQ() : renderResult(true); }
      else if (a === "result") { run = { i: ENTRY_TEST.length, answers: store.answers }; renderResult(false); }
      else if (a === "path") {
        goTab("path");
        const sp = store && store.rec && store.rec.sprint;
        if (sp) setTimeout(() => {
          const el = document.querySelector(`[data-sp="${sp}"]`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
      }
      return;
    }
    const opt = ev.target.closest("#etBody [data-opt]");
    if (opt && run && run.answers[run.i] === undefined) {
      run.answers[run.i] = +opt.dataset.opt;
      window.ACT && ACT.log("check");
      renderQ();
    }
  });

  window.initEntryTest = () => { if (!run) renderIntro(); };
})();

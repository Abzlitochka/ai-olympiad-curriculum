/* Dashboard — progress overview, sprint deadlines & pacing, onboarding.
   Practicum-style: fixed sprint deadlines, weekly load, "how the course works". */
(() => {
  const LS_START = "aio-course-v1";
  const LS_ACT = "aio-activity-v1";
  const LS_OB = "aio-onboarded-v1";

  const cfg = Object.assign({ start: null, hpw: 12 }, safeJSON(LS_START, {}));
  const saveCfg = () => { try { localStorage.setItem(LS_START, JSON.stringify(cfg)); } catch (_) {} };
  const act = safeJSON(LS_ACT, {});
  const saveAct = () => { try { localStorage.setItem(LS_ACT, JSON.stringify(act)); } catch (_) {} };

  const g = id => document.getElementById(id);
  const e = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const today = () => new Date().toLocaleDateString("en-CA");

  /* shared activity counter — lessons, trainer and gym all call ACT.log() */
  window.ACT = { log(kind = "step") { const d = (act[today()] ||= { steps: 0, checks: 0 }); d[kind === "check" ? "checks" : "steps"]++; saveAct(); } };

  /* ---------- pacing model ---------- */
  const totalWeeks = () => MODULES.reduce((s, m) => s + m.weeks, 0);
  function sprintSpan(s) { // cumulative week range of a sprint
    let w0 = 0;
    for (const sp of SPRINTS) {
      const len = sp.mods.reduce((a, id) => a + (MODULES.find(m => m.id === id) || { weeks: 0 }).weeks, 0);
      if (sp.id === s.id) return [w0, w0 + len];
      w0 += len;
    }
    return [0, 0];
  }
  const weeksElapsed = () => cfg.start ? Math.max(0, (Date.now() - new Date(cfg.start + "T00:00:00")) / 6048e5) : 0;

  /* overall done fraction: lesson steps + trainer exercises */
  function overall() {
    let d = 0, n = 0;
    const sol = exSolved();
    MODULES.forEach(m => { const s = modSteps(m); d += s.d; n += s.n; });
    EXERCISES.forEach(x => { n++; if (sol[x.id]) d++; });
    return { d, n };
  }
  function sprintProgress(s) {
    const sol = exSolved();
    let d = 0, n = 0;
    s.mods.forEach(id => {
      const m = MODULES.find(x => x.id === id); if (!m) return;
      const st = modSteps(m); d += st.d; n += st.n;
      exOfMod(id).forEach(x => { n++; if (sol[x.id]) d++; });
    });
    return n ? d / n : 0;
  }

  function fmtDate(dt) { return dt.toLocaleDateString(LANG === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "short" }); }
  function sprintStatus(s, i) {
    const p = sprintProgress(s);
    if (p >= 1) {
      const pb = (typeof SPRINT_PROJECTS !== "undefined") && SPRINT_PROJECTS[s.id];
      const pstate = pb ? (safeJSON("aio-projects-v1", {})[s.id] || {}) : {};
      const rDone = pb ? pb.rubric.filter((_, j) => pstate["r" + j]).length : 0;
      if (!pb || rDone === pb.rubric.length) return { cls: "done", lbl: t("db.stDone") };
      return { cls: "now", lbl: tf("db.stProj", rDone, pb.rubric.length) };
    }
    if (!cfg.start) return { cls: "open", lbl: t("db.stOpen") };
    const [, wEnd] = sprintSpan(s);
    const we = weeksElapsed();
    if (we > wEnd + 0.5) return { cls: "late", lbl: t("db.stLate") };
    if (we >= sprintSpan(s)[0] - 0.01) return { cls: "now", lbl: t("db.stNow") };
    return { cls: "next", lbl: t("db.stNext") };
  }

  /* ---------- render ---------- */
  function renderDash() {
    const host = g("dashBody");
    if (!host) return;
    const { d, n } = overall();
    const we = weeksElapsed();
    const tw = totalWeeks();
    const sol = exSolved();
    const exDone = EXERCISES.filter(x => sol[x.id]).length;
    const stepD = MODULES.reduce((a, m) => a + modSteps(m).d, 0);
    const stepN = MODULES.reduce((a, m) => a + modSteps(m).n, 0);
    const pz = (safeJSON("aio-puzzle-gym-v1", {}).sol || {});
    const pzDays = safeJSON("aio-puzzle-gym-v1", {}).days || {};
    const pzDone = typeof PUZZLES !== "undefined"
      ? PUZZLES.filter(p => pz[p.name]).length           // ignore stale keys from older store versions
      : Object.keys(pz).length;
    const pace = tw ? Math.min(100, Math.round(we / tw * 100)) : 0;
    const done = n ? Math.round(d / n * 100) : 0;

    /* streak + last-14-days strip — merged across lesson/trainer actions and
       puzzle-gym runs (a gym solve also counts a run, so solves aren't added) */
    const dayActions = dt => {
      const a = act[dt] || {}, p = pzDays[dt] || {};
      return (a.steps || 0) + (a.checks || 0) + (p.runs || 0);
    };
    let streak = 0;
    for (let i = 0; ; i++) {
      const dt = new Date(Date.now() - i * 864e5).toLocaleDateString("en-CA");
      if (!dayActions(dt)) { if (i === 0) continue; break; }
      streak++;
    }
    const strip = [...Array(14)].map((_, i) => {
      const dt = new Date(Date.now() - (13 - i) * 864e5).toLocaleDateString("en-CA");
      const n = dayActions(dt);
      const c = Math.min(1, n / 20);
      return `<i style="opacity:${c ? 0.35 + 0.65 * c : 0.15}" title="${dt}: ${tf("db.actionT", n)}"></i>`;
    }).join("");

    /* next actions: first unfinished lesson step, exercise, puzzle */
    const nexts = [];
    outer: for (const m of MODULES) {
      const ls = lessonsOf(m.id);
      for (let li = 0; li < ls.length; li++)
        for (let si = 0; si < ls[li].steps.length; si++)
          if (!state.steps[stepKey(m.id, li, si)]) { nexts.push({ t: tf("db.nextLesson", m.id, loc(ls[li].title)), fn: `data-dl="${m.id}|${li}"` }); break outer; }
    }
    const nex = EXERCISES.find(x => !sol[x.id]);
    if (nex) nexts.push({ t: tf("db.nextEx", loc(nex.title)), fn: `data-dex="${nex.id}"` });
    if (typeof PUZZLES !== "undefined") {
      const np = PUZZLES.find(p => !pz[p.name]);
      if (np) nexts.push({ t: tf("db.nextPz", np.name), fn: `data-dpz="1"` });
    }
    /* sprints whose content is done but whose project checklist isn't —
       "everything done" must not claim victory while projects are open */
    if (typeof SPRINT_PROJECTS !== "undefined") {
      const pstate = safeJSON("aio-projects-v1", {});
      SPRINTS.forEach(s => {
        const pb = SPRINT_PROJECTS[s.id];
        if (!pb || sprintProgress(s) < 1) return;
        const rDone = pb.rubric.filter((_, i) => (pstate[s.id] || {})["r" + i]).length;
        if (rDone < pb.rubric.length)
          nexts.push({ t: tf("db.nextProj", s.id, loc(s.name), rDone, pb.rubric.length), fn: `data-project-link="${s.id}"` });
      });
    }
    /* review nudge: the oldest solved exercise, if it's going stale */
    let stalest = null;
    for (const x of EXERCISES) { const s = sol[x.id]; if (s && s.at && (!stalest || s.at < stalest.at)) stalest = { x, at: s.at }; }
    if (stalest && (Date.now() - stalest.at) > 14 * 864e5)
      nexts.push({ t: tf("db.review", loc(stalest.x.title), Math.floor((Date.now() - stalest.at) / 864e5)), fn: `data-dex="${stalest.x.id}"` });

    host.innerHTML = `
    <div class="db-row">
      <div class="db-card"><h4>${e(t("db.nextUp"))}</h4>
        ${nexts.map(x => `<div class="db-next" role="button" tabindex="0" ${x.fn}>${e(x.t)}</div>`).join("") || `<div class="db-muted">${e(t("db.allDone"))}</div>`}
      </div>
      <div class="db-card">
        <h4>${e(t("db.pacing"))}</h4>
        <div class="db-kv"><span>${e(t("db.start"))}</span><input type="date" id="dbStart" value="${/^\d{4}-\d{2}-\d{2}$/.test(cfg.start || "") ? cfg.start : ""}"></div>
        <div class="db-kv"><span>${e(t("db.hpw"))}</span><input type="number" id="dbHpw" min="1" max="60" value="${Math.max(1, parseInt(cfg.hpw, 10) || 12)}" style="width:64px"></div>
        <div class="db-kv"><span>${cfg.start ? tf("db.weekOf", Math.floor(we) + 1, tw) : e(t("db.noStart"))}</span><b>${cfg.start ? e(tf("db.doneVs", done, pace)) : e(tf("db.donePct", done))}</b></div>
        <div class="db-pace ${done + 5 >= pace ? "ok" : "warn"}">${!cfg.start ? e(t("db.setStart")) : done + 5 >= pace ? e(t("db.onTrack")) : e(t("db.behind"))}</div>
        <div class="db-muted" style="font-size:11px">${e(t("db.pctNote"))}</div>
        <button type="button" class="pr-btn pr-ghost" id="dbHowBtn" style="margin-top:8px;font-size:12px">${e(t("db.how"))}</button>
      </div>
      <div class="db-card"><h4>${e(t("db.volume"))}</h4>
        <div class="db-num">${stepD}<small>${e(tf("db.stepsMarked", stepN))}</small></div>
        <div class="db-num">${exDone}<small>${e(tf("db.exPassed", EXERCISES.length))}</small></div>
        <div class="db-num">${pzDone}<small>${e(tf("db.pzSolved", typeof PUZZLES !== "undefined" ? PUZZLES.length : 21))}</small></div>
        <div class="db-muted" style="margin-top:6px">${e(t("db.volumeNote"))}</div>
      </div>
      <div class="db-card"><h4>${e(t("db.consistency"))}</h4>
        <div class="db-num">${streak}<small> ${e(tf("db.streak", streak))}</small></div>
        <div class="db-strip">${strip}</div>
        <div class="db-muted">${e(tf("db.target", Math.max(1, parseInt(cfg.hpw, 10) || 12)))}</div>
      </div>
    </div>
    <h3 class="db-ht">${e(t("db.sprintDl"))}</h3>
    <div class="table-wrap"><table class="db-t">
      <thead><tr><th>${e(t("db.sprint"))}</th><th>${e(t("db.modules"))}</th><th>${e(t("db.deadline"))}</th><th>${e(t("db.progress"))}</th><th>${e(t("db.status"))}</th></tr></thead>
      <tbody>${SPRINTS.map((s, i) => {
        const [w0, w1] = sprintSpan(s);
        const dl = cfg.start ? fmtDate(new Date(new Date(cfg.start + "T00:00:00").getTime() + w1 * 6048e5)) : tf("db.wk", w1);
        const st = sprintStatus(s, i);
        const p = Math.round(sprintProgress(s) * 100);
        return `<tr class="${st.cls === "now" ? "db-cur" : ""}">
          <td><b>${s.id}</b> ${e(loc(s.name))}</td>
          <td>${s.mods.map(id => `<button type="button" class="link" data-gotomod="${id}">${id}</button>`).join(" ")}</td>
          <td>${dl}</td>
          <td><div class="progress db-pbar"><i style="width:${p}%"></i></div><span class="db-muted">${p}%</span></td>
          <td><span class="db-chip ${st.cls}">${st.lbl}</span></td></tr>`;
      }).join("")}</tbody></table></div>
    <p class="db-muted" style="margin-top:14px">${e(t("db.foot"))}</p>`;
    const ds = g("dbStart");
    if (ds) ds.addEventListener("change", () => {
      const v = ds.value;
      cfg.start = (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + "T00:00:00"))) ? v : null;
      saveCfg(); renderDash();
    });
    const hw = g("dbHpw");
    if (hw) hw.addEventListener("change", () => {
      cfg.hpw = Math.min(60, Math.max(1, parseInt(hw.value, 10) || 12));
      saveCfg(); renderDash();
    });
    const hb = g("dbHowBtn");
    if (hb) hb.addEventListener("click", () => showOnboarding(true));
  }
  window.renderDash = renderDash;

  /* ---------- onboarding overlay ---------- */
  window.showOnboarding = force => {
    if (!force && localStorage.getItem(LS_OB)) return;
    if (document.getElementById("obOverlay")) return;
    const ov = document.createElement("div");
    ov.id = "obOverlay";
    const prevFocus = document.activeElement;
    ov.innerHTML = `<div class="ob-card" role="dialog" aria-modal="true" aria-labelledby="obTitle">
      <h2 id="obTitle">${e(t("ob.title"))}</h2>
      <p class="ob-sub">${e(t("ob.sub"))}</p>
      <ol class="ob-steps">
        <li>${t("ob.1")}</li>
        <li>${t("ob.2")}</li>
        <li>${t("ob.3")}</li>
        <li>${t("ob.4")}</li>
      </ol>
      <div class="ob-btns">
        <button class="btn btn--primary" id="obSkip">${e(t("ob.start"))}</button>
        ${typeof ENTRY_TEST !== "undefined" ? `<button class="btn btn--secondary" id="obTest">${e(t("ob.test"))}</button>` : ""}
      </div>
      <p class="db-muted" style="margin-top:10px">${t("ob.foot")}</p>
    </div>`;
    document.body.appendChild(ov);
    const close = () => {
      localStorage.setItem(LS_OB, "1");
      ov.remove();
      document.removeEventListener("keydown", onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    };
    const onKey = ev => { if (ev.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const firstBtn = ov.querySelector("#obSkip"); if (firstBtn) firstBtn.focus();
    ov.addEventListener("click", ev => {
      if (ev.target.closest("#obTest")) {
        close();
        goTab("entrytest");
      } else if (ev.target.closest("#obSkip")) {
        close();
        if (typeof continueLearning === "function") continueLearning();
      } else if (ev.target === ov) {
        close();
      }
    });
  };

  /* ---------- init ---------- */
  document.addEventListener("click", ev => {
    const dl = ev.target.closest("[data-dl]");
    if (dl) { ev.preventDefault(); const [m, li] = dl.dataset.dl.split("|"); goTab("path"); openLesson(m, +li); return; }
    const dx = ev.target.closest("[data-dex]");
    if (dx && window.openTrainerEx) { openTrainerEx(dx.dataset.dex); return; }
    if (ev.target.closest("[data-dpz]")) { goTab("puzzles"); if (window.pgWake) pgWake(); return; }
    const pl2 = ev.target.closest("[data-project-link]");
    if (pl2) {
      ev.preventDefault();
      if (state.view) { state.view = null; renderLesson(); }
      goTab("path");
      const sp = document.querySelector(`.sprint[data-sp="${pl2.dataset.projectLink}"]`);
      if (sp) {
        const v = sp.querySelector(".sp-projview"), pj = sp.querySelector("[data-proj]");
        if (v && v.hidden) { v.hidden = false; if (pj) pj.setAttribute("aria-expanded", "true"); }
        sp.scrollIntoView({ block: "center" });
      }
      return;
    }
  });
  document.addEventListener("keydown", ev => {
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.classList && ev.target.classList.contains("db-next")) {
      ev.preventDefault(); ev.target.click();
    }
  });
  window.initDashboard = () => { renderDash(); };
  setTimeout(showOnboarding, 600);
})();

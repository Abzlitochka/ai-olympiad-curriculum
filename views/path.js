/* Path tab: filters, sprint plan, module list — uses globals from app.js (state, $, $$, esc, md, lessonsOf, stepKey, ...). Loaded before app.js; only declarations at top level. */
/* ---------- PATH tab ---------- */
function moduleMatches(m) {
  const q = $("#pathSearch").value.toLowerCase();
  const o = $("#pathOly").value, d = $("#pathDomain").value, df = $("#pathDiff").value;
  const lessonText = lessonsOf(m.id).map(l => loc(l.title)).join(" ");
  if (q && !(m.id + " " + loc(m.title) + " " + loc(m.anchors) + " " + loc(m.learn) + " " + lessonText).toLowerCase().includes(q)) return false;
  if (o && !m.olympiads.some(x => x.startsWith(o))) return false;
  if (d && !m.domains.includes(d)) return false;
  if (df && m.stars !== +df) return false;
  if ($("#hideDone").checked && modDone(m)) return false;
  return true;
}

const exOfMod = id => (typeof EXERCISES === "undefined" ? [] : EXERCISES.filter(x => x.module === id));
const exSolved = () => (safeJSON("aio-trainer-v1", {}).solved || {});
const levelHTML = n => `<span class="lvl" title="${esc(tf("mod.lvlTitle", n))}">${[1, 2, 3, 4, 5].map(i => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span>`;

/* attr = the click-hook attribute ("data-lesson" in-module rows,
   "data-dl" for cross-tab links); prefix = shown before the title. */
function lessonRow(m, li, attr = "data-lesson", prefix = "") {
  const l = lessonsOf(m.id)[li];
  const s = lessonStat(m.id, li);
  const done = s.n > 0 && s.d === s.n;
  return `
  <button type="button" class="lrow" ${attr}="${m.id}|${li}">
    <span class="lnum ${done ? "full" : ""}">${li + 1}</span>
    <span class="lname">${prefix}${esc(loc(l.title))}</span>
    <span class="lmeta">~${l.minutes} ${t("u.min")}</span>
    <span class="lsteps ${done ? "full" : ""}">${s.d}/${s.n}</span>
  </button>`;
}

function moduleCard(m) {
  const done = modDone(m);
  const s = modSteps(m);
  const ls = lessonsOf(m.id);
  const xs = exOfMod(m.id);
  const sol = exSolved();
  const xd = xs.filter(x => sol[x.id]).length;
  const pct = s.n ? Math.round(s.d / s.n * 100) : 0;
  /* cross-discipline edges: "needs" = modules powering this one,
     "used" = modules this one powers (MODULE_LINKS: a powers b) */
  const links = (typeof MODULE_LINKS !== "undefined") ? MODULE_LINKS : [];
  const lnk = e => { const o = MODULES.find(x => x.id === (e.a === m.id ? e.b : e.a)); return o ? `<button type="button" class="lnk" data-godisc="${o.id}" title="${esc(loc(e.why))}"><b>${o.id}</b> ${esc(loc(o.title))}</button>` : null; };
  const lnkRow = (key, edges) => edges.length ? `<div class="lnk-row"><span class="lnk-lab">${esc(t(key))}</span>${edges.join("")}</div>` : "";
  const linkRows = lnkRow("conn.needs", links.filter(e => e.b === m.id).map(lnk).filter(Boolean))
                 + lnkRow("conn.used", links.filter(e => e.a === m.id).map(lnk).filter(Boolean));
  return `
  <div class="card ${done ? "done" : ""}" data-mod="${m.id}">
    <button type="button" class="card-head" aria-expanded="false">
      <b class="card-id">${m.id}</b>
      <span class="card-main">
        <span class="card-title">${esc(loc(m.title))}</span>
        <span class="card-sub">${tf("mod.weeks", m.weeks)} · ${pl(ls.length, "u.lesson")}${xs.length ? ` · ${pl(xs.length, "u.exercise")}` : ""}${done ? ` · ${t("u.done")}` : pct ? ` · ${pct}%` : ""}</span>
        <span class="progress card-prog" aria-hidden="true"><i style="width:${done ? 100 : pct}%"></i></span>
      </span>
      <span class="card-plus" aria-hidden="true"></span>
    </button>
    <div class="card-body">
      <div class="card-cols">
        <div>
          <p class="card-learn">${esc(loc(m.learn))}</p>
          ${ls.length ? `<div class="blk"><h4>${esc(t("mod.lessons"))}</h4><div class="lrows">${ls.map((_, li) => lessonRow(m, li)).join("")}</div></div>` : ""}
          ${linkRows}
        </div>
        <aside class="card-side">
          <div class="blk"><h4>${esc(t("mod.real"))}</h4><p>${esc(loc(m.anchors))}</p></div>
          ${m.study ? `<div class="blk"><h4>${esc(t("mod.study"))}</h4><p>${esc(loc(m.study))}</p></div>` : ""}
          <div class="blk"><h4>${esc(t("mod.project"))}</h4><p>${esc(loc(m.deliverable))}</p></div>
          <div class="blk"><h4>${esc(t("mod.level"))}</h4>${levelHTML(m.stars)}</div>
          <div class="tagrow">
            ${m.olympiads.map(o => `<span class="chip">${o}</span>`).join("")}
          </div>
          <div class="card-actions">
            ${ls.length ? `<button class="btn btn--primary btn--sm" data-lesson="${m.id}|0">${esc(t("mod.start"))}</button>` : ""}
            ${xs.length ? `<button class="btn btn--secondary btn--sm" data-trainer="${m.id}">${esc(t("mod.trainer"))} · ${xd}/${xs.length}</button>` : ""}
            <label class="card-done"><input type="checkbox" data-check="${m.id}" ${done ? "checked" : ""}> ${esc(t("mod.markDone"))}</label>
          </div>
        </aside>
      </div>
    </div>
  </div>`;
}

function renderHeroFacts() {
  const host = $("#heroFacts");
  if (!host) return;
  const weeks = MODULES.reduce((a, m) => a + m.weeks, 0);
  const lessons = MODULES.reduce((a, m) => a + lessonsOf(m.id).length, 0);
  const ex = typeof EXERCISES === "undefined" ? 0 : EXERCISES.length;
  const facts = [[weeks, t("fact.weeks")], [MODULES.length, t("fact.modules")], [lessons, t("fact.lessons")], [ex, t("fact.exercises")]];
  host.innerHTML = facts.map(([n, l]) => `<div class="fact"><b>${n}</b><span>${l}</span></div>`).join("");
}

function renderSprints() {
  const host = $("#sprints");
  if (!host || typeof SPRINTS === "undefined") return;
  const sol = exSolved();
  const recSprint = ((safeJSON("aio-entrytest-v1", null) || {}).rec || {}).sprint;
  host.innerHTML = `<div class="sp-wrap"><div class="sp-title"><h2>${esc(t("sprints.h"))}</h2><p class="muted">${esc(t("sprints.sub"))}</p></div>` +
    SPRINTS.map((s, i) => {
      const mods = s.mods.map(id => MODULES.find(m => m.id === id)).filter(Boolean);
      let d = 0, n = 0;
      mods.forEach(m => {
        const st = modSteps(m); d += st.d; n += st.n;
        const xs = exOfMod(m.id); n += xs.length; d += xs.filter(x => sol[x.id]).length;
      });
      const pct = n ? Math.round(d / n * 100) : 0;
      const pb = (typeof SPRINT_PROJECTS !== "undefined") && SPRINT_PROJECTS[s.id];
      const pk = "aio-projects-v1";
      const pstate = pb ? (safeJSON(pk, {})[s.id] || {}) : {};
      const rDone = pb ? pb.rubric.filter((_, i) => pstate["r" + i]).length : 0;
      const projDone = !pb || rDone === pb.rubric.length;
      const allDone = pct === 100 && projDone;
      const projLeft = pct === 100 && !projDone;
      return `<div class="sprint tile ${allDone ? "done" : ""}${s.id === recSprint ? " sp-rec" : ""}" data-sp="${s.id}">
        <div class="sp-num">${i + 1}</div>
        <div class="sp-head"><b>${esc(loc(s.name))}</b><span class="sp-weeks">${esc(tf("sprint.weeks", s.weeks))}</span></div>
        ${s.id === recSprint ? `<div class="sp-recbadge">${esc(t("sprint.rec"))}</div>` : ""}
        <div class="sp-mods">${mods.map(m =>
          `<button type="button" class="link" data-gotomod="${m.id}">${m.id}</button>`).join(" ")}</div>
        <button type="button" class="sp-proj" data-proj="${s.id}" aria-expanded="false" title="${esc(t("sprint.projTip"))}">
          ${esc(loc(s.project))}${pb ? ` <span class="sp-rub">${rDone}/${pb.rubric.length}</span>` : ""}</button>
        ${pb ? `<div class="sp-projview" hidden>
          <p class="sp-brief">${esc(pb.brief)}</p>
          <ol class="sp-steps">${pb.steps.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
          <div class="sp-rubric">${pb.rubric.map((r, i) =>
            `<label class="sp-ritem"><input type="checkbox" data-rubric="${s.id}|${i}" ${pstate["r" + i] ? "checked" : ""}> ${esc(r)}</label>`).join("")}
          </div>
          <p class="sp-stretch">${esc(t("sprint.stretch"))} ${esc(pb.stretch)}</p>
          <p class="faint small">${esc(pb.hours)}${pb.needs ? ` · ${t("sprint.needs")} ${esc(pb.needs)}` : ""} · ${esc(t("sprint.selfcheck"))}</p>
        </div>` : ""}
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="faint small" style="margin-top:4px">${pct}%</div>
        ${projLeft ? `<div class="sp-projleft">${esc(tf("sprint.left", rDone, pb.rubric.length))}</div>` : ""}
      </div>`;
    }).join("") + `</div>`;
}

/* discipline switcher above the catalog — the visible Math / Programming /
   ML division. "" = all sections; a group id pins the list to it */
let grpFilter = "";
function renderDiscNav() {
  const host = $("#discNav");
  if (!host) return;
  host.innerHTML = `<span class="disc-nav-lab">${esc(t("disc.lab"))}</span>` +
    `<button type="button" class="chip lsm-chip${grpFilter ? "" : " on"}" data-grp="" aria-pressed="${!grpFilter}">${esc(t("disc.all"))}</button>` +
    GROUPS.map(g => `<button type="button" class="chip lsm-chip${grpFilter === g.id ? " on" : ""}" data-grp="${g.id}" aria-pressed="${grpFilter === g.id}">${esc(loc(g.name))}</button>`).join("");
  if (!host.dataset.wired) {
    host.dataset.wired = "1";
    host.addEventListener("click", e => {
      const c = e.target.closest("[data-grp]");
      if (!c) return;
      grpFilter = c.dataset.grp;
      renderPath();
    });
  }
}

function renderPath() {
  renderHeroFacts();
  renderSprints();
  renderDiscNav();
  const host = $("#subjects");
  const pt = $("#progTitle");
  if (pt) pt.innerHTML = `<h2>${esc(t("prog.h"))}</h2><p class="muted">${esc(tf("prog.sub", MODULES.length, MODULES.reduce((a, m) => a + m.weeks, 0)))}</p>`;
  host.innerHTML = "";
  let anyShown = false;
  const cardList = mods => `<div class="prog-list">${mods.map(m => moduleCard(m)).join("")}</div>`;
  GROUPS.filter(g => !grpFilter || g.id === grpFilter).forEach(g => {
    const subs = SUBJECTS.filter(s => s.group === g.id);
    const subjIds = new Set(subs.map(s => s.id));
    const all = MODULES.filter(m => subjIds.has(m.subject));
    if (!all.filter(moduleMatches).length) return;
    anyShown = true;
    const done = all.filter(modDone).length;
    let html = `<section class="grp" data-grp="${g.id}">
        <div class="grp-head">
          <h3>${esc(loc(g.name))}</h3>
          <span class="grp-meta">${pl(all.length, "u.module")} · ${done}/${all.length} ${esc(t("u.done"))}</span>
        </div>
        <p class="grp-blurb">${esc(loc(g.blurb))}</p>
        <div class="progress grp-bar" id="grpbar-${g.id}"><i></i></div>`;
    if (subs.length === 1) {
      html += cardList(all.filter(moduleMatches));
    } else {
      subs.forEach(s => {
        const sall = MODULES.filter(m => m.subject === s.id);
        const smods = sall.filter(moduleMatches);
        if (!smods.length) return;
        const sdone = sall.filter(modDone).length;
        html += `<div class="subj" data-subj="${s.id}">
          <div class="subj-head">
            <h4>${esc(loc(s.name))}</h4>
            <span class="subj-meta">${pl(sall.length, "u.module")} · ${sdone}/${sall.length} ${esc(t("u.done"))}</span>
          </div>
          <p class="subj-blurb">${esc(loc(s.blurb))}</p>
          <div class="progress subj-bar" id="subjbar-${s.id}"><i></i></div>
          ${cardList(smods)}
        </div>`;
      });
    }
    host.insertAdjacentHTML("beforeend", html + `</section>`);
  });
  if (!anyShown) host.insertAdjacentHTML("beforeend", `<p class="empty">${esc(t("mod.empty"))}</p>`);
  refreshProgress();
}

/* "Continue learning": first unfinished lesson step, else the trainer.
   On a fresh account with an entry-test placement, start at the recommended sprint instead of M0. */
function continueLearning() {
  // placement honor: if nothing is done yet and a test recommended a later sprint, start there
  let anyDone = MODULES.some(m => lessonsOf(m.id).some((_, li) => lessonStat(m.id, li).d > 0));
  if (!anyDone) {
    try {
      const et = JSON.parse(localStorage.getItem("aio-entrytest-v1") || "null");
      const sp = et && et.rec && SPRINTS.find(s => s.id === et.rec.sprint);
      if (sp && sp.mods && sp.mods[0] && sp.mods[0] !== MODULES[0].id) {
        $$(".tab").forEach(t => { const on = t.dataset.tab === "path"; t.classList.toggle("active", on); t.setAttribute("aria-selected", String(on)); });
        $$(".tabpane").forEach(p => p.classList.toggle("active", p.id === "tab-path"));
        openLesson(sp.mods[0], 0); return;
      }
    } catch (_) {}
  }
  for (const m of MODULES) {
    const ls = lessonsOf(m.id);
    for (let li = 0; li < ls.length; li++) {
      const s = lessonStat(m.id, li);
      if (s.d < s.n) { $$(".tab").forEach(t => { const on = t.dataset.tab === "path"; t.classList.toggle("active", on); t.setAttribute("aria-selected", String(on)); }); $$(".tabpane").forEach(p => p.classList.toggle("active", p.id === "tab-path")); openLesson(m.id, li); return; }
    }
  }
  goTab("trainer");   // everything done — drop into the exercise trainer
}

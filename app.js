/* AI Olympiad Curriculum — app logic (plain JS, works from file://) */

const LS_KEY = "aio-curriculum-progress-v1";
const LS_STEPS = LS_KEY + "-lessons-v2";
const state = {
  done: safeJSON(LS_KEY, {}),
  steps: safeJSON(LS_STEPS, {}),
  view: null, // { mod, li } when inside a lesson
};
const saveSteps = () => { try { localStorage.setItem(LS_STEPS, JSON.stringify(state.steps)); } catch (_) {} };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(state.done)); } catch (_) {} };
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const imd = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
  // [text](https://…) — https only, opens in a new tab; esc() already ran, so the URL is attribute-safe
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
// only allow web-safe URLs into href — blocks javascript:/data: injection
const safeUrl = u => (/^(https?:|\.|\/|#)/i.test(String(u || "")) ? String(u) : "#");

/* ---------- populate filter dropdowns ---------- */
/* split domain tags on / + , but not inside parens — "(image+video)"
   must stay one fragment, not two broken halves */
const splitDom = s => s.replace(/\([^)]*\)/g, m => m.replace(/[+,\/]/g, "\x01"))
                       .split(/[\/+,]/).map(d => d.replace(/\x01/g, "+").trim());

function fillFilters() {
  const olySet = new Set(), modDomSet = new Set(), grpSet = new Set();
  const taskDomMap = new Map(); // lowercase -> display casing (first wins)
  MODULES.forEach(m => { m.olympiads.forEach(o => olySet.add(o)); m.domains.forEach(d => modDomSet.add(d)); });
  TASKS.forEach(t => {
    olySet.add(t.oly.split(" ")[0]);
    splitDom(t.domain).forEach(d => {
      const v = d.trim(); if (!v) return;
      const k = v.toLowerCase(); if (!taskDomMap.has(k)) taskDomMap.set(k, v);
    });
  });
  RESOURCES.forEach(r => grpSet.add(r.g));
  const opt = (v, label) => `<option value="${esc(v)}">${esc(label)}</option>`;
  for (const o of [...olySet].sort()) {
    $("#pathOly").insertAdjacentHTML("beforeend", opt(o, olyTr(o)));
    $("#taskOly").insertAdjacentHTML("beforeend", opt(o, olyTr(o)));
  }
  for (const d of [...modDomSet].sort()) $("#pathDomain").insertAdjacentHTML("beforeend", opt(d, domt(d)));
  for (const d of [...taskDomMap.values()].sort()) $("#taskDomain").insertAdjacentHTML("beforeend", opt(d, domt(d)));
  for (const g of [...grpSet]) $("#resGroup").insertAdjacentHTML("beforeend", opt(g, resgt(g)));
}

/* ---------- lesson progress ---------- */
const lessonsOf = id => COURSE[id] || [];
const stepKey = (mod, li, si) => `${mod}|${li}|${si}`;
function lessonStat(mod, li) {
  const steps = lessonsOf(mod)[li].steps;
  return { d: steps.filter((_, si) => state.steps[stepKey(mod, li, si)]).length, n: steps.length };
}
function modSteps(m) {
  return lessonsOf(m.id).reduce((a, _, li) => { const s = lessonStat(m.id, li); a.d += s.d; a.n += s.n; return a; }, { d: 0, n: 0 });
}
function modDone(m) {
  const s = modSteps(m);
  return !!state.done[m.id] || (s.n > 0 && s.d === s.n);
}

function refreshProgress() {
  const done = MODULES.filter(modDone).length;
  const pct = Math.round((done / MODULES.length) * 100);
  SUBJECTS.forEach(s => {
    const mods = MODULES.filter(m => m.subject === s.id);
    const bar = $(`#subjbar-${s.id} i`);
    if (bar) bar.style.width = mods.length ? (mods.filter(modDone).length / mods.length) * 100 + "%" : 0;
  });
  GROUPS.forEach(g => {
    const sids = new Set(SUBJECTS.filter(s => s.group === g.id).map(s => s.id));
    const mods = MODULES.filter(m => sids.has(m.subject));
    const bar = $(`#grpbar-${g.id} i`);
    if (bar) bar.style.width = mods.length ? (mods.filter(modDone).length / mods.length) * 100 + "%" : 0;
  });
  syncContinueLabel();
}

/* "Start learning" vs "Continue learning": fresh profile → start, any
   progress anywhere (lesson steps, trainer solves, puzzle solves) → continue. */
function syncContinueLabel() {
  const tr = safeJSON("aio-trainer-v1", {});
  const pz = safeJSON("aio-puzzle-gym-v1", {});
  const started = Object.keys(state.steps).length > 0
    || Object.keys(tr).length > 0
    || Object.keys(pz).length > 0;
  const key = started ? "cta.continue" : "cta.start";
  $$("[data-continue]").forEach(b => { b.dataset.i18n = key; b.textContent = t(key); });
}

/* ---------- navigation (5 top tabs + in-pane sub-tabs) ----------
   TAB_MAP translates every historical tab id to [parentTab, subTab] so old
   callsites (data-tab="trainer" buttons, #ex= deep links, dashboard "next up"
   shortcuts, entry-test "go to path") keep working unchanged via goTab(). */
const TAB_MAP = { path:["path",null], learn:["path",null], lessons:["path",null],
  "disc-prog":["path",null], "disc-math":["path",null], "disc-ml":["path",null],
  practice:["practice",null], trainer:["practice","trainer"], puzzles:["practice","puzzles"],
  dashboard:["dashboard","dash"], entrytest:["practice","entrytest"],
  catalog:["catalog",null], tasks:["catalog","tasks"], olympiads:["catalog","olympiads"], syllabus:["catalog","syllabus"],
  resources:["resources",null] };
/* lazy inits that used to fire on nav click now fire on sub activation */
const SUB_INIT = { trainer:()=>window.initTrainer&&initTrainer(), jlab:()=>window.labInit&&labInit(), puzzles:null,
  dash:()=>window.initDashboard&&initDashboard(), entrytest:()=>window.initEntryTest&&initEntryTest(),
  tasks:null, olympiads:null, syllabus:null };
function activateSub(name) {
  const pane = document.getElementById("sub-" + name);
  if (!pane) return;
  const wrap = pane.closest(".tabpane");
  if (!wrap) return;
  wrap.querySelectorAll(".subtab").forEach(s => s.classList.toggle("on", s.dataset.sub === name));
  wrap.querySelectorAll(".subpane").forEach(p => p.classList.toggle("active", p === pane));
  const f = SUB_INIT[name]; if (f) f();
}
function goTab(name) {
  const [parent, sub] = TAB_MAP[name] || TAB_MAP.path;
  $$(".tab").forEach(b => { const on = b.dataset.tab === parent; b.classList.toggle("active", on); b.setAttribute("aria-selected", String(on)); });
  $$(".tabpane").forEach(p => p.classList.toggle("active", p.id === "tab-" + parent));
  if (sub) activateSub(sub); else {
    const def = document.querySelector("#tab-" + parent + " .subtab.on");
    if (def) activateSub(def.dataset.sub);
  }
  if (typeof prSyncChrome === "function") prSyncChrome();
}
window.goTab = goTab;

/* ---------- events ---------- */
document.addEventListener("click", e => {
  if (e.target.closest("[data-continue]")) { e.preventDefault(); continueLearning(); return; }
  const chk = e.target.closest("[data-check]");
  if (chk) {
    const id = chk.dataset.check;
    const now = !modDone(MODULES.find(m => m.id === id));
    if (now) {
      state.done[id] = true;
      const added = [];
      lessonsOf(id).forEach((l, li) => l.steps.forEach((_, si) => {
        const k = stepKey(id, li, si);
        if (!state.steps[k]) { state.steps[k] = true; added.push(k); }
      }));
      // remember which steps this checkbox fabricated so unchecking can
      // undo exactly those (earned step progress is never touched)
      (state.done.__bulk ||= {})[id] = added;
    } else {
      delete state.done[id];
      (state.done.__bulk && state.done.__bulk[id] || []).forEach(k => delete state.steps[k]);
      if (state.done.__bulk) delete state.done.__bulk[id];
    }
    save(); saveSteps(); renderPath();
    const card = $(`.card[data-mod="${id}"]`); if (card) openCard(card);
    e.stopPropagation();
    return;
  }
  if (e.target.closest(".card-done")) return;
  const lrow = e.target.closest("[data-lesson]");
  if (lrow) { const [mod, li] = lrow.dataset.lesson.split("|"); openLesson(mod, li); return; }
  if (e.target.closest("[data-back]")) {
    const mod = state.view && state.view.mod;
    state.view = null; renderLesson(); renderPath(); goTab("path");
    const card = mod && $(`.card[data-mod="${mod}"]`);
    if (card) { openCard(card); card.scrollIntoView({ block: "center" }); }
    return;
  }

  if (state.view) {
    if (prLessonClick(e)) return;
    const nxt = e.target.closest("[data-goto-lesson]");
    if (nxt) { openLesson(state.view.mod, nxt.dataset.gotoLesson); return; }
    if (e.target.closest("[data-reset-lesson]")) {
      const { mod, li } = state.view;
      lessonsOf(mod)[li].steps.forEach((_, si) => delete state.steps[stepKey(mod, li, si)]);
      delete state.done[mod];
      save(); saveSteps(); renderLesson(); refreshProgress();
      window.scrollTo({ top: 0 });
      return;
    }
  }
  const head = e.target.closest(".card-head");
  if (head) {
    const card = head.closest(".card");
    card.classList.toggle("open");
    head.setAttribute("aria-expanded", card.classList.contains("open"));
    return;
  }
  const sub = e.target.closest(".subtab");
  if (sub) { activateSub(sub.dataset.sub); return; }
  const tab = e.target.closest(".nav [data-tab]") || e.target.closest("[data-tab]");
  if (tab) {
    e.preventDefault();
    goTab(tab.dataset.tab);
    /* leaving to Learn (nav or brand) exits lesson mode — otherwise the
       open lesson keeps covering the pane and the click looks dead */
    if ((TAB_MAP[tab.dataset.tab] || TAB_MAP.path)[0] === "path" && state.view) {
      state.view = null; renderLesson(); renderPath();
    }
    return;
  }
  const tr = e.target.closest("[data-trainer]");
  if (tr && window.openTrainer) { openTrainer(tr.dataset.trainer, 0); return; }

  const pj = e.target.closest("[data-proj]");
  if (pj) {
    const v = pj.parentElement.querySelector(".sp-projview");
    if (v) { v.hidden = !v.hidden; pj.setAttribute("aria-expanded", String(!v.hidden)); }
    return;
  }
  const rub = e.target.closest("[data-rubric]");
  if (rub) {
    const [sid, ri] = rub.dataset.rubric.split("|");
    const pk = "aio-projects-v1";
    const all = safeJSON(pk, {});
    ((all[sid] ||= {})["r" + ri]) = rub.checked;
    localStorage.setItem(pk, JSON.stringify(all));
    const cnt = rub.closest(".sprint").querySelector(".sp-rub");
    const pb = (typeof SPRINT_PROJECTS !== "undefined") && SPRINT_PROJECTS[sid];
    if (cnt && pb) cnt.textContent = `${pb.rubric.filter((_, i) => all[sid]["r" + i]).length}/${pb.rubric.length}`;
    return;
  }
  /* module jumps — data-gotomod (path/catalog tables) and data-godisc
     (module-card "needs/used in" chips; used to live in views/lessons.js) */
  const go = e.target.closest("[data-gotomod],[data-godisc]");
  if (go) {
    const id = go.dataset.gotomod || go.dataset.godisc;
    state.view = null; renderLesson();
    goTab("path");
    const card = $(`.card[data-mod="${id}"]`);
    if (card) {
      openCard(card);
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("flash");
      setTimeout(() => card.classList.remove("flash"), 1600);
    }
  }
});

function openCard(card) {
  card.classList.add("open");
  const h = card.querySelector(".card-head");
  if (h) h.setAttribute("aria-expanded", "true");
}

["pathSearch","pathOly","pathDomain","pathDiff","hideDone"].forEach(id =>
  $("#" + id).addEventListener("input", renderPath));
["taskSearch","taskOly","taskDomain","taskDiff"].forEach(id =>
  $("#" + id).addEventListener("input", renderTasks));
["resSearch","resLang","resGroup"].forEach(id =>
  $("#" + id).addEventListener("input", renderResources));

$("#resetProgress").addEventListener("click", () => {
  if (!confirm(t("fl.resetConfirm"))) return;
  Object.keys(localStorage).filter(k => k.startsWith("aio-")).forEach(k => localStorage.removeItem(k));
  location.reload();
});

/* ---------- language toggle ---------- */
{
  const sync = () => {
    $$(".lang-sw button").forEach(b => b.classList.toggle("on", b.dataset.lang === LANG));
    document.title = t("doc.title");
  };
  $$(".lang-sw button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
  sync();
}
applyI18n();

/* ---------- init ---------- */
fillFilters();
renderPath();
syncContinueLabel();
renderTasks();
renderSyllabus();
renderOlympiads();
renderResources();
if (typeof prOpenFromHash === "function") prOpenFromHash();

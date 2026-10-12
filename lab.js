/* Local JupyterLab — the only place lesson code runs besides the exercise trainer.

   The helper (lab-helper/, served from this site as a wheel) runs a real
   Jupyter on 127.0.0.1 with a token. `olympiadai-lab up` opens
   <site>#lab=<port>:<token>; this file asks before storing the pairing in
   localStorage, then talks to Jupyter's own REST API: probes /api/status,
   pushes the lesson's notebook through the Contents API and embeds the lab.
   No backend is involved, so it works from the static site as-is.
   Step-by-step guide for students: guide/jupyterlab.html */

const LAB_KEY = "olympiadai.lab";
const LAB_LESSON_KEY = "olympiadai.lab.lesson";   // last lesson opened in the lab (survives reloads)
const LAB_WHEEL = "olympiadai_lab-0.2.0-py3-none-any.whl";   // rewritten by lab-helper/release-to-showcase.sh
const LAB_POLL_MS = 3000;
const LAB_PROBE_TIMEOUT_MS = 1500;

const lab = {
  status: "unpaired",    // unpaired | checking | ok | down | stale
  cfg: null,             // { port, token, pairedAt }
  lesson: null,          // { mod, li } — last notebook the student asked for
  src: "",               // iframe URL of the local lab
  files: "",             // "<dir>/<file>" shown in the footer
  loads: 0,              // document loads inside the frame (2 = login bounce)
  fallback: false,       // browser refused third-party cookies → new-tab card
  setupOpen: null,       // null = auto (open until a computer is connected)
  pending: null,         // { port, token } from #lab=… awaiting confirmation
  os: null,
  timer: null,
  booted: false,
};

/* ---------- pairing storage ---------- */
function labRead() {
  try { const c = JSON.parse(localStorage.getItem(LAB_KEY)); return c && c.port && c.token ? c : null; } catch (_) { return null; }
}
function labSave(port, token) {
  lab.cfg = { port: Number(port), token, pairedAt: Date.now() };
  try { localStorage.setItem(LAB_KEY, JSON.stringify(lab.cfg)); } catch (_) {}
}
function labClear() {
  lab.cfg = null;
  try { localStorage.removeItem(LAB_KEY); } catch (_) {}
}
function labReadLesson() {
  try {
    const l = JSON.parse(localStorage.getItem(LAB_LESSON_KEY));
    return l && l.mod && typeof lessonsOf === "function" && lessonsOf(l.mod)[l.li] ? { mod: l.mod, li: +l.li } : null;
  } catch (_) { return null; }
}
function labSaveLesson() {
  try {
    if (lab.lesson) localStorage.setItem(LAB_LESSON_KEY, JSON.stringify(lab.lesson));
    else localStorage.removeItem(LAB_LESSON_KEY);
  } catch (_) {}
}

/* ---------- addresses ---------- */
/* the helper binds 127.0.0.1 only; cookies are issued SameSite=None when the
   site is on another host, so the frame works cross-site (see lab-helper) */
const labBase = cfg => `http://127.0.0.1:${cfg.port}`;
/* this page's URL without the file name — /showcase/ or / — the helper takes
   it as --lms-origin (CORS pins the origin, the pairing link opens the page) */
const labSiteUrl = () => location.origin + location.pathname.replace(/[^/]*$/, "");

function labDetectOs() {
  const p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.userAgent || "").toLowerCase();
  if (p.includes("win")) return "windows";
  if (p.includes("mac")) return "macos";
  return "linux";
}
const LAB_OS = { macos: "macOS", windows: "Windows", linux: "Linux" };

function labInstallCommand(os) {
  const site = labSiteUrl();
  const wheel = site + "lab-helper/" + LAB_WHEEL;
  // up: venv + server + pairing link; autostart on: the same server comes back
  // by itself after every reboot, so the command really is a one-time step.
  if (os === "windows") {
    const exe = `& "$env:USERPROFILE\\.local\\bin\\olympiadai-lab.exe"`;
    return `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"; `
      + `& "$env:USERPROFILE\\.local\\bin\\uv.exe" tool install --force ${wheel}; `
      + `${exe} up --lms-origin ${site}; ${exe} autostart on`;
  }
  return `curl -LsSf https://astral.sh/uv/install.sh | sh && ~/.local/bin/uv tool install --force ${wheel} && ~/.local/bin/olympiadai-lab up --lms-origin ${site} && ~/.local/bin/olympiadai-lab autostart on`;
}

/* ---------- talking to the local Jupyter ---------- */
function labAuth(extra) { return Object.assign({ Authorization: `token ${lab.cfg.token}` }, extra || {}); }

async function labProbe() {
  const cfg = lab.cfg;
  if (!cfg) return "unpaired";
  if (typeof fetch !== "function") return "down";
  const ctl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), LAB_PROBE_TIMEOUT_MS) : null;
  try {
    const r = await fetch(`${labBase(cfg)}/api/status`, { headers: labAuth(), signal: ctl ? ctl.signal : undefined });
    if (r.ok) return "ok";
    return (r.status === 401 || r.status === 403) ? "stale" : "down";   // Jupyter: wrong/expired token
  } catch (_) {
    return "down";
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function labPut(path, body) {
  const r = await fetch(`${labBase(lab.cfg)}/api/contents/${path}`, {
    method: "PUT", headers: labAuth({ "Content-Type": "application/json" }), body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(t(r.status === 401 || r.status === 403 ? "lab.stale" : "lab.down"));
}

/* push the lesson's notebook into Documents/OlympiadAI/<module>/ — an
   existing file is kept: the student's edits win */
async function labPush(mod, li) {
  const dir = mod;
  const file = nbFileName(mod, li);
  let have = 0;
  try { have = (await fetch(`${labBase(lab.cfg)}/api/contents/${dir}/${file}?content=0`, { headers: labAuth() })).status; } catch (_) { have = 0; }
  if (have === 401 || have === 403) throw new Error(t("lab.stale"));
  if (have !== 200) {
    await labPut(dir, { type: "directory" });
    await labPut(`${dir}/${file}`, { type: "notebook", format: "json", content: lessonToNotebook(mod, li) });
  }
  lab.loads = 0; lab.fallback = false;
  lab.files = dir;
  lab.src = `${labBase(lab.cfg)}/lab/tree/${dir}/${file}?token=${lab.cfg.token}`;
}

/* ---------- state machine ---------- */
async function labCheck() {
  const status = await labProbe();
  const cameUp = status === "ok" && lab.status !== "ok";
  if (status !== "ok") lab.src = "";   // dead frame → offline card
  lab.status = status;
  if (cameUp) { labConnect(); return status; }   // a paired computer (re)appeared
  labRender();
  return status;
}

function labStartPolling() {
  if (lab.timer || typeof setInterval !== "function") return;
  lab.timer = setInterval(() => { if (lab.cfg) labCheck(); else labStopPolling(); }, LAB_POLL_MS);
}
function labStopPolling() { if (lab.timer) { clearInterval(lab.timer); lab.timer = null; } }

/* load the lesson's notebook (or the bare lab) into the frame */
async function labConnect() {
  lab.setupOpen = false;
  labRender();
  if (lab.status !== "ok") return;
  try {
    if (lab.lesson) await labPush(lab.lesson.mod, lab.lesson.li);
    else { lab.loads = 0; lab.fallback = false; lab.files = ""; lab.src = `${labBase(lab.cfg)}/lab?token=${lab.cfg.token}`; }
  } catch (err) {
    lab.src = "";
    labSetStatusText(err && err.message || t("lab.pushErr"), true);
  }
  labRender();
}

/* entry from the lesson's practice card */
function labOpenLesson(mod, li) {
  lab.lesson = { mod, li: +li };
  labSaveLesson();
  if (lab.status === "ok") labConnect(); else labRender();
}
window.labOpenLesson = labOpenLesson;

function labGoLesson(mod, li) {
  state.view = null; renderLesson(); renderPath();
  goTab("practice"); activateSub("jlab");
  labOpenLesson(mod, li);
}
window.labGoLesson = labGoLesson;

/* called by app.js whenever the sub-pane is activated */
function labInit() {
  if (!lab.booted) {
    lab.booted = true;
    lab.cfg = labRead();
    lab.os = labDetectOs();
    if (!lab.lesson) lab.lesson = labReadLesson();   // reload mid-work: reopen the same notebook+tasks
    if (lab.cfg) {
      lab.status = "checking";
      labRender();
      labCheck();
      labStartPolling();
      return;
    }
  }
  labRender();
}
window.labInit = labInit;

/* ---------- pairing link: #lab=<port>:<token> ---------- */
function labHandleHash() {
  const m = /(?:^#|&)lab=(\d{4,5}):([A-Za-z0-9_-]{8,})(?:&|$)/.exec(location.hash || "");
  if (!m) return false;
  history.replaceState(null, "", location.pathname + location.search);   // token never stays in the address bar
  lab.pending = { port: +m[1], token: m[2] };
  if (window.state && state.view) { state.view = null; if (window.renderLesson) renderLesson(); if (window.renderPath) renderPath(); }
  goTab("practice"); activateSub("jlab");
  labRender();
  return true;
}

function labPairConfirm(yes) {
  const p = lab.pending; lab.pending = null;
  if (!yes || !p) { labRender(); return; }
  labSave(p.port, p.token);
  lab.status = "checking"; lab.src = "";
  labRender();
  labStartPolling();
  labCheck().then(status => { if (status === "ok") labSetStatusText(t("lab.paired")); });
}

/* ---------- view ---------- */
function labSetStatusText(text, warn) {
  const el = $("#labStatus");
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("warn", !!warn);
}

function labStatusLine() {
  switch (lab.status) {
    case "checking": return [t("lab.checking"), false];
    case "ok": return [tf("lab.connected", lab.cfg.port), false];
    case "down": return [t("lab.down"), true];
    case "stale": return [t("lab.stale"), true];
    default: return [t("lab.notConnected"), false];
  }
}

function labSetupHTML() {
  return `
    <h3>${esc(t("lab.introH"))}</h3>
    <p>${esc(t("lab.introP"))}</p>
    <div class="lab-os" role="tablist" aria-label="OS">${Object.keys(LAB_OS).map(id =>
      `<button type="button" role="tab" aria-selected="${lab.os === id}" class="${lab.os === id ? "on" : ""}" data-lab-os="${id}">${LAB_OS[id]}</button>`).join("")}</div>
    <div class="lab-cmd"><code id="labCmd">${esc(labInstallCommand(lab.os))}</code>
      <button type="button" class="pr-btn pr-secondary pr-sm" data-lab-copy>${esc(t("ls.copy"))}</button></div>
    <p class="lab-note">${esc(t("lab.cmdNote"))}</p>
    <div class="lab-actions">
      <button type="button" class="pr-btn pr-ghost pr-sm" data-lab-retry>${esc(t("lab.retry"))}</button>
      <a class="pr-btn pr-secondary pr-sm" href="guide/jupyterlab.html" target="_blank" rel="noopener">${esc(t("lab.guide"))}</a>
    </div>
    <details class="lab-details"><summary>${esc(t("lab.whatQ"))}</summary><p>${esc(t("lab.whatA"))}</p></details>`;
}

function labRender() {
  const pane = $("#sub-jlab");
  if (!pane) return;
  const ok = lab.status === "ok";

  const dot = $("#labDot"); if (dot) dot.classList.toggle("ok", ok);
  const [line, warn] = labStatusLine();
  labSetStatusText(line, warn);

  const open = lab.setupOpen === null ? !ok : lab.setupOpen;
  const setupBtn = $("[data-lab-setup]", pane);
  if (setupBtn) { setupBtn.hidden = false; setupBtn.setAttribute("aria-expanded", String(open)); }
  const setup = $("#labSetup");
  if (setup) {
    setup.hidden = !open;
    if (open && !setup.dataset.built) { setup.innerHTML = labSetupHTML(); setup.dataset.built = "1"; }
  }

  const pair = $("#labPair");
  if (pair) {
    pair.hidden = !lab.pending;
    if (lab.pending) pair.innerHTML = `<div class="lab-card">
      <h3>${esc(tf("lab.pairQ", lab.pending.port))}</h3><p>${esc(t("lab.pairNote"))}</p>
      <div class="lab-actions"><button type="button" class="pr-btn pr-primary" data-lab-pair-ok>${esc(t("lab.pairOk"))}</button>
      <button type="button" class="pr-btn pr-ghost" data-lab-pair-no>${esc(t("lab.pairNo"))}</button></div></div>`;
    else pair.innerHTML = "";
  }

  const offline = $("#labOffline"), fb = $("#labFallback"), frame = $("#labLocalFrame"), foot = $("#labFoot");
  const showOffline = !ok && (lab.cfg || lab.status === "checking");
  if (offline) {
    offline.hidden = !showOffline;
    if (showOffline) offline.innerHTML = `<h3>${esc(lab.status === "checking" ? t("lab.checking") : t("lab.offlineH"))}</h3>
      <p>${esc(lab.status === "stale" ? t("lab.stale") : lab.status === "checking" ? "" : t("lab.down"))}</p>
      <div class="lab-actions"><button type="button" class="pr-btn pr-secondary pr-sm" data-lab-retry>${esc(t("lab.retry"))}</button></div>`;
  }
  if (fb) {
    fb.hidden = !ok || !lab.fallback;
    if (!fb.hidden) fb.innerHTML = `<h3>${esc(t("lab.fallbackH"))}</h3><p>${esc(t("lab.fallbackP"))}</p>
      <div class="lab-actions"><button type="button" class="pr-btn pr-primary" data-lab-newtab>${esc(t("lab.newTab"))}</button></div>`;
  }
  if (frame) {
    const show = ok && !!lab.src && !lab.fallback;
    frame.hidden = !show;
    if (show && frame.getAttribute("src") !== lab.src) frame.setAttribute("src", lab.src);
    if (!lab.src && frame.getAttribute("src")) frame.removeAttribute("src");
  }
  if (foot) foot.hidden = !ok || !lab.src;
  const files = $("#labFiles");
  if (files) files.textContent = lab.files ? tf("lab.files", lab.files) : "";

  /* lesson task checklist beside the frame — same exercises that are graded
     in the notebook's Задания cells; ticks come from the trainer store */
  const taskPane = $("#labTasks"), grid = $("#labLocal");
  const tasks = ok && lab.lesson ? labLessonTasks() : null;
  if (taskPane) {
    taskPane.hidden = !tasks;
    if (grid) grid.classList.toggle("with-tasks", !!tasks);
    if (tasks) {
      const done = tasks.filter(x => x.solved).length;
      const sig = `${lab.lesson.mod}|${lab.lesson.li}|${done}/${tasks.length}|${t("lab.tasksH")}`;
      if (sig !== lab._taskSig) { lab._taskSig = sig; taskPane.innerHTML = labTasksHTML(tasks, done); }
    } else lab._taskSig = "";
  }
}

/* exercises mapped to the lesson currently loaded in the lab, solved-flagged */
function labLessonTasks() {
  if (!lab.lesson || typeof prLessonExercises !== "function" || typeof EXERCISES === "undefined") return null;
  const { ids } = prLessonExercises(lab.lesson.mod, lab.lesson.li);
  const sol = typeof exSolved === "function" ? exSolved() : {};
  const tasks = ids.map(id => EXERCISES.find(x => x.id === id)).filter(Boolean)
    .map(x => ({ ...x, solved: !!sol[x.id] }));
  return tasks.length ? tasks : null;
}

function labTasksHTML(tasks, done) {
  const allDone = done === tasks.length;
  return `<h3 class="lab-tasks-h">${esc(t("lab.tasksH"))} <span class="lab-tasks-prog ${allDone ? "is-done" : ""}">${done}/${tasks.length}</span></h3>
    <p class="lab-tasks-hint">${esc(t("lab.tasksHint"))}</p>
    <ol class="lab-tasklist">${tasks.map((x, i) => `
      <li><button type="button" class="lab-task ${x.solved ? "is-done" : ""}" data-task-ex="${esc(x.id)}" title="${esc(t("lab.taskOpen"))}">
        <span class="lab-task-check" aria-hidden="true">${x.solved ? "✓" : ""}</span>
        <span class="lab-task-body"><b>${i + 1}. ${esc(loc(x.title))}</b>
          <span class="lab-task-meta">${"●".repeat(x.diff || 1)}${"○".repeat(3 - (x.diff || 1))} · ~${x.minutes} ${esc(t("u.min"))}</span></span>
      </button></li>`).join("")}</ol>`;
}

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const pane = e.target.closest("#sub-jlab");
  if (!pane) return;
  if (e.target.closest("[data-lab-setup]")) { labToggleSetup(); return; }
  const os = e.target.closest("[data-lab-os]");
  if (os) { lab.os = os.dataset.labOs; const s = $("#labSetup"); if (s) s.innerHTML = labSetupHTML(); return; }
  if (e.target.closest("[data-lab-copy]")) {
    const btn = e.target.closest("[data-lab-copy]");
    const text = labInstallCommand(lab.os);
    const done = () => { btn.textContent = t("ls.copied"); setTimeout(() => { btn.textContent = t("ls.copy"); }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => {});
    return;
  }
  const taskEx = e.target.closest("[data-task-ex]");
  if (taskEx) { if (typeof prOpenExercise === "function") prOpenExercise(taskEx.dataset.taskEx); return; }
  if (e.target.closest("[data-lab-retry]")) { if (lab.cfg) { lab.status = "checking"; labRender(); labCheck(); } return; }
  if (e.target.closest("[data-lab-pair-ok]")) { labPairConfirm(true); return; }
  if (e.target.closest("[data-lab-pair-no]")) { labPairConfirm(false); return; }
  if (e.target.closest("[data-lab-newtab]")) { if (lab.src) window.open(lab.src, "_blank", "noopener"); return; }
  if (e.target.closest("[data-lab-disconnect]")) {
    labClear(); labStopPolling();
    lab.status = "unpaired"; lab.src = ""; lab.files = ""; lab.fallback = false; lab.setupOpen = true;
    const s = $("#labSetup"); if (s) delete s.dataset.built;
    labRender();
  }
});

function labToggleSetup() {
  const open = lab.setupOpen === null ? lab.status !== "ok" : lab.setupOpen;
  lab.setupOpen = !open;
  const s = $("#labSetup"); if (s) delete s.dataset.built;
  labRender();
  if (lab.setupOpen && lab.cfg) labCheck();
}

/* a second document load inside the frame is Jupyter bouncing to /login:
   the auth cookie did not survive the third-party context */
{
  const frame = $("#labLocalFrame");
  if (frame) frame.addEventListener("load", () => {
    if (!lab.src) return;
    lab.loads += 1;
    if (lab.loads > 1 && !lab.fallback) { lab.fallback = true; labRender(); }
  });
}

window.addEventListener("hashchange", labHandleHash);
labHandleHash();

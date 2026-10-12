/* Lesson view — uses globals from app.js (state, $, $$, esc, md, stars, lessonsOf, stepKey, ...). Loaded before app.js; only declarations at top level. */
/* ---------- LESSON VIEW (Practicum-style interactive textbook) ---------- */
/* Progress keys are unchanged: state.steps[`${mod}|${li}|${si}`] = true (LS_STEPS),
   module completion stays derived via modDone(). */
let prObserver = null;
let prActive = 0;

const prStripMd = s => String(s).replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
const prClip = (s, n = 40) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/* sidebar label for a step: text → title / first paragraph / "Theory N"; quiz → "Question N" */
function prStepLabels(steps) {
  let t = 0, q = 0;
  return steps.map(s => {
    if (s.k === "quiz") return tf("ls.question", ++q);
    t++;
    if (s.title) return prClip(prStripMd(loc(s.title)));
    const para = (s.blocks || []).find(b => b[0] === "p");
    return para ? prClip(prStripMd(loc(para[1]))) : tf("ls.theoryN", t);
  });
}

/* first not-yet-completed step = "current" */
function prCurrentStep(mod, li) {
  const n = loc(lessonsOf(mod)[li].steps).length;
  for (let si = 0; si < n; si++) if (!state.steps[stepKey(mod, li, si)]) return si;
  return -1;
}

/* exercises to practise after this lesson: LESSON_EX first, else first exercise
   of the module — unsolved ones lead so the card points at what's left to do */
function prLessonExercises(mod, li) {
  const all = typeof EXERCISES === "undefined" ? [] : EXERCISES;
  const sol = typeof exSolved === "function" ? exSolved() : {};
  const todo = ids => [...ids.filter(id => !sol[id]), ...ids.filter(id => sol[id])];
  const mapped = (typeof LESSON_EX !== "undefined" && LESSON_EX[`${mod}|${li}`]) || [];
  const ids = todo(mapped.filter(id => all.some(x => x.id === id)));
  if (ids.length) return { ids, mapped: true };
  /* a module with a lesson map: unmapped lessons show nothing rather than an arbitrary exercise */
  if (typeof LESSON_EX !== "undefined" && Object.keys(LESSON_EX).some(k => k.startsWith(mod + "|"))) return { ids: [], total: 0, mapped: false };
  const xs = exOfMod(mod);
  const first = xs.find(x => !sol[x.id]) || xs[0];
  return { ids: first ? [first.id] : [], total: xs.length, mapped: false };
}

function prOpenExercise(id) {
  const target = "#ex=" + id;
  if (location.hash === target) {
    // same hash will not fire hashchange — open directly
    if (window.openTrainerEx) openTrainerEx(id);
  } else {
    location.hash = target;
  }
}

function blockHTML([type, v]) {
  switch (type) {
    case "p": return `<p class="prl-p">${imd(loc(v))}</p>`;
    case "f": return `<div class="prl-formula">${esc(loc(v)).replace(/\n/g, "<br>")}</div>`;
    case "ul": return `<ul class="prl-ul">${v.map(x => `<li>${imd(loc(x))}</li>`).join("")}</ul>`;
    case "code": return `<div class="prl-code"><button type="button" class="prl-copy" data-copy aria-label="${esc(t("ls.copy"))}">${esc(t("ls.copy"))}</button><pre><code>${msHl(loc(v) || v, "python")}</code></pre></div>`;
    case "note": return `<aside class="prl-note"><div class="prl-note-label">${esc(t("ls.note"))}</div><div>${imd(loc(v))}</div></aside>`;
    case "md": return `<div class="prl-md">${msmd(loc(v))}</div>`;
    case "fig": return figHTML(v);
    case "img": {
      // site-relative files under img/ or an https URL — never javascript:/data:
      const src = /^img\/[\w./-]+\.(webp|png|jpg|jpeg|svg|gif)$/i.test(v.src) ? v.src : safeUrl(v.src);
      return `<figure class="prl-fig prl-img"><img src="${esc(src)}" alt="${esc(loc(v.alt) || "")}" loading="lazy"><figcaption>${imd(loc(v.cap) || "")}</figcaption></figure>`;
    }
  }
  return "";
}

function stepHTML(mod, li, s, si, n) {
  const done = !!state.steps[stepKey(mod, li, si)];
  const kind = s.k === "quiz" ? t("ls.quiz") : (s.blocks || []).some(b => b[0] === "code") ? t("ls.code") : t("ls.theory");
  const kicker = `<div class="prl-kicker">${esc(tf("ls.step", si + 1, n, kind))}</div>`;
  if (s.k === "text") return `
    <section class="prl-step prl-text ${done ? "is-done" : ""}" data-scene="${si}" id="prl-step-${si}">
      ${kicker}
      <h2 class="prl-h2">${imd(loc(s.title) || t("ls.theory"))}</h2>
      ${s.blocks.map(blockHTML).join("")}
      <div class="prl-actions">
        <button type="button" class="prl-btn prl-secondary ${done ? "is-on" : ""}" data-read="${si}" ${done ? "disabled" : ""}>${done ? esc(t("ls.done")) : esc(t("ls.gotit"))}</button>
      </div>
    </section>`;
  return `
    <section class="prl-step prl-quiz ${done ? "is-done" : ""}" data-scene="${si}" id="prl-step-${si}">
      <div class="prl-quiz-card">
        <div class="prl-quiz-label">${esc(t("ls.quiz"))}</div>
        <h3 class="prl-quiz-q">${imd(loc(s.q))}</h3>
        <div class="prl-opts" role="radiogroup" data-quiz="${si}">${s.options.map((o, oi) => `
          <button type="button" role="radio" aria-checked="${done && oi === s.answer}" class="prl-opt ${done && oi === s.answer ? "is-ok" : ""}" data-propt="${oi}" ${done ? "disabled" : ""}><span class="prl-radio" aria-hidden="true"></span><span class="prl-opt-text">${imd(loc(o))}</span></button>`).join("")}
        </div>
        <div class="prl-actions">
          ${done
            ? `<button type="button" class="prl-btn prl-ghost" data-retake-quiz="${si}">${esc(t("ls.tryagain"))}</button>`
            : `<button type="button" class="prl-btn prl-primary" data-check-quiz="${si}" disabled>${esc(t("ls.check"))}</button>`}
        </div>
        <div class="prl-result ${done ? "is-ok" : ""}" aria-live="polite">${done ? `<b>${esc(t("ls.correct"))}</b> ${imd(loc(s.explain))}` : ""}</div>
      </div>
    </section>`;
}

/* contents drawer: lessons of one module (switchable), current lesson expanded into its steps */
function prDrawerList(modId, curMod, li) {
  const ls = lessonsOf(modId);
  const here = modId === curMod;
  const cur = here ? prCurrentStep(modId, li) : -1;
  const labels = here ? prStepLabels(loc(ls[li].steps)) : [];
  return `<ol class="prl-lessons">${ls.map((l, i) => {
    const s = lessonStat(modId, i);
    const full = s.n > 0 && s.d === s.n;
    const isCur = here && i === li;
    return `
    <li class="prl-lesson-item ${isCur ? "is-current" : ""} ${full ? "is-done" : ""}">
      <button type="button" class="prl-lesson-link" data-lesson="${modId}|${i}" ${isCur ? 'aria-current="page"' : ""}>
        <span class="prl-lnum" aria-hidden="true">${i + 1}</span>
        <span class="prl-lname">${esc(loc(l.title))}</span>
        <span class="prl-lscore">${s.d}/${s.n}</span>
      </button>
      ${isCur ? `<ol class="prl-steps">${loc(ls[li].steps).map((st, si) => {
        const d = !!state.steps[stepKey(modId, li, si)];
        return `<li><button type="button" class="prl-step-link ${d ? "is-done" : si === cur ? "is-current" : "is-todo"}" data-goto-step="${si}">
          <span class="prl-dot" aria-hidden="true"></span><span>${esc(labels[si])}</span></button></li>`;
      }).join("")}</ol>` : ""}
    </li>`;
  }).join("")}</ol>`;
}

function prDrawerHTML(m, li) {
  const mods = MODULES.filter(x => lessonsOf(x.id).length);
  return `
  <div class="prl-scrim" data-pr-toggle hidden></div>
  <aside class="prl-drawer" id="prDrawer" aria-hidden="true" aria-label="${esc(t("ls.contents"))}">
    <div class="prl-drawer-head">
      <b>${esc(t("ls.contents"))}</b>
      <button type="button" class="prl-x" data-pr-toggle aria-label="${esc(t("tr.close"))}"></button>
    </div>
    <label class="prl-modsel"><span>${esc(t("ls.module"))}</span>
      <select data-pr-mod aria-label="${esc(t("ls.module"))}">${mods.map(x =>
        `<option value="${x.id}" ${x.id === m.id ? "selected" : ""}>${esc(x.id)} · ${esc(loc(x.title))}</option>`).join("")}</select>
    </label>
    <div class="prl-drawer-body" id="prDrawerBody">${prDrawerList(m.id, m.id, li)}</div>
  </aside>`;
}

function prSetDrawer(open) {
  const dr = $("#prDrawer"), sc = $("#lessonView .prl-scrim");
  if (!dr) return;
  dr.classList.toggle("is-open", open);
  dr.setAttribute("aria-hidden", String(!open));
  if (sc) sc.hidden = !open;
  $$("#lessonView [data-pr-toggle][aria-controls]").forEach(b => b.setAttribute("aria-expanded", String(open)));
  if (open) { const sel = dr.querySelector(".prl-lesson-item.is-current .prl-lesson-link, .prl-x"); if (sel) sel.focus({ preventScroll: true }); }
}

/* lesson mode hides the site header/footer (full-screen reading); only on the Learn tab */
function prSyncChrome() {
  const pane = $("#tab-path");
  document.body.classList.toggle("in-lesson", !!(state.view && pane && pane.classList.contains("active")));
}

function prEndHTML(mod, li, ls, l) {
  const ex = prLessonExercises(mod, li);
  const n = ex.mapped ? ex.ids.length : ex.total || 0;
  return `
    <div class="prl-end">
      ${ex.ids.length ? `
      <div class="prl-end-card">
        <div class="prl-quiz-label">${esc(t("ls.endOf"))}</div>
        <h2 class="prl-h2">${esc(t("ls.practise"))}</h2>
        <p class="prl-muted">${esc(tf("ls.trainerN", n, ex.mapped ? t("ls.thisTopic") : t("ls.thisModule")))}</p>
        <div class="prl-actions">
          <button type="button" class="prl-btn prl-primary" data-pr-ex="${esc(ex.ids[0])}">${esc(t("ls.goEx"))}</button>
          <button type="button" class="prl-btn prl-ghost" data-jlab>${esc(t("ls.jlab"))}</button>
        </div>
        ${ex.mapped && ex.ids.length > 1 ? `<div class="prl-exlist">${ex.ids.map(id => {
          const xt = (EXERCISES.find(x => x.id === id) || {}).title || id;
          return `<button type="button" class="prl-link" data-pr-ex="${esc(id)}">${esc(loc(xt))}</button>`;
        }).join("")}</div>` : ""}
      </div>` : ""}
      ${loc(l.refs).length ? `<div class="prl-refs"><h4>${esc(t("ls.deeper"))}</h4>${loc(l.refs).map(([nm, u]) =>
        `<a href="${safeUrl(loc(u))}" target="_blank" rel="noopener">${esc(loc(nm))}</a>`).join("")}</div>` : ""}
      <div class="prl-endnav">
        <button type="button" class="prl-btn prl-ghost" data-reset-lesson>${esc(t("ls.reset"))}</button>
        ${li < ls.length - 1
          ? `<button type="button" class="prl-btn prl-primary" data-goto-lesson="${li + 1}">${esc(tf("ls.next", loc(ls[li + 1].title)))}</button>`
          : `<button type="button" class="prl-btn prl-primary" data-back>${esc(t("ls.backProg"))}</button>`}
      </div>
    </div>`;
}

function renderLesson() {
  const host = $("#lessonView");
  if (prObserver) { prObserver.disconnect(); prObserver = null; }
  if (!state.view) {
    prSyncChrome();
    host.innerHTML = "";
    host.style.display = "none"; $("#subjects").style.display = ""; $("#sprints").style.display = "";
    ["#tab-path .filters", "#hero", "#progTitle"].forEach(s => { const el = $(s); if (el) el.style.display = ""; });
    if (/^#lesson=/.test(location.hash)) history.replaceState(null, "", location.pathname);
    return;
  }
  const { mod, li } = state.view;
  const m = MODULES.find(x => x.id === mod);
  const ls = lessonsOf(mod);
  const l = ls[li];
  const st = lessonStat(mod, li);
  prActive = Math.max(0, prCurrentStep(mod, li));
  const nSteps = loc(l.steps).length;
  host.innerHTML = `
  <div class="pr-lesson">
    <header class="prl-bar">
      <button type="button" class="prl-bar-btn" data-pr-toggle aria-controls="prDrawer" aria-expanded="false">
        <span class="prl-burger" aria-hidden="true"></span><span class="prl-bar-label">${esc(t("ls.contents"))}</span>
      </button>
      <div class="prl-bar-title"><span class="prl-bar-mod">${esc(m.id)}</span><span class="prl-bar-name">${esc(loc(l.title))}</span></div>
      <span class="prl-bar-step" id="prBarStep">${esc(tf("ls.stepOf", Math.min(prActive + 1, nSteps), nSteps))}</span>
      <button type="button" class="prl-bar-btn prl-bar-icon" data-goto-lesson="${li - 1}" aria-label="${esc(t("ls.prev"))}" ${li === 0 ? "disabled" : ""}><span class="prl-chev prl-chev-l" aria-hidden="true"></span></button>
      <button type="button" class="prl-bar-btn prl-bar-icon" data-goto-lesson="${li + 1}" aria-label="${esc(t("ls.nextShort"))}" ${li >= ls.length - 1 ? "disabled" : ""}><span class="prl-chev prl-chev-r" aria-hidden="true"></span></button>
      <button type="button" class="theme-sw" data-theme-sw aria-label="${esc(t("theme.toggle"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg></button>
      <button type="button" class="prl-bar-btn prl-bar-exit" data-back><span class="prl-bar-label">${esc(t("nav.program"))}</span><span class="prl-x prl-x-sm" aria-hidden="true"></span></button>
      <div class="prl-progress" role="progressbar" aria-label="${esc(t("ls.progress"))}" aria-valuemin="0" aria-valuemax="${st.n}" aria-valuenow="${st.d}"><i style="width:${st.n ? (st.d / st.n) * 100 : 0}%"></i></div>
    </header>
    ${prDrawerHTML(m, li)}
    <article class="prl-main">
      <h1 class="prl-title">${esc(loc(l.title))}</h1>
      <div class="prl-meta">${esc(tf("ls.meta", li + 1, ls.length, l.minutes, st.d, st.n)).replace(`${st.d}/${st.n}`, `<span class="ldone-count">${st.d}/${st.n}</span>`)}</div>
      <div class="prl-tools">
        <button type="button" class="prl-btn prl-ghost" data-jlab>${esc(t("ls.jlab"))}</button>
      </div>
      ${loc(l.steps).map((s, si) => stepHTML(mod, li, s, si, nSteps)).join("")}
      ${prEndHTML(mod, li, ls, l)}
    </article>
  </div>`;
  host.style.display = "";
  $("#subjects").style.display = "none";
  $("#sprints").style.display = "none";
  ["#tab-path .filters", "#hero", "#progTitle"].forEach(s => { const el = $(s); if (el) el.style.display = "none"; });
  history.replaceState(null, "", `#lesson=${mod}|${li}`);
  prSyncChrome();
  prObserveSteps();
}

/* highlight the step currently being read in the sidebar */
function prObserveSteps() {
  if (typeof IntersectionObserver === "undefined") return;
  prObserver = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) prSetActive(+en.target.dataset.scene); });
  }, { rootMargin: "-140px 0px -55% 0px" });
  $$("#lessonView .prl-step").forEach(el => prObserver.observe(el));
}
function prSetActive(si) {
  prActive = si;
  if (state.view) {
    const bs = $("#prBarStep");
    if (bs) bs.textContent = tf("ls.stepOf", si + 1, loc(lessonsOf(state.view.mod)[state.view.li].steps).length);
  }
  $$("#lessonView .prl-step-link").forEach(b => b.classList.toggle("is-active", +b.dataset.gotoStep === si));
}
function prScrollToStep(si) {
  const el = $(`#lessonView .prl-step[data-scene="${si}"]`);
  if (!el) return;
  prSetActive(si);
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openLesson(mod, li) {
  state.view = { mod, li: +li };
  if (window.goTab) goTab("path");   // the lesson view lives inside #tab-path
  renderLesson();
  window.scrollTo({ top: 0 });
}

/* deep link: #lesson=<mod>|<li> */
function prOpenFromHash() {
  const m = /^#lesson=([^|]+)\|(\d+)$/.exec(location.hash || "");
  if (!m) return;
  const ls = lessonsOf(m[1]);
  if (ls[+m[2]]) { if (window.goTab) goTab("path"); openLesson(m[1], +m[2]); }
}

function prRefreshSidebar() {
  const { mod, li } = state.view;
  const cur = prCurrentStep(mod, li);
  $$("#lessonView .prl-step-link").forEach(b => {
    const si = +b.dataset.gotoStep;
    const d = !!state.steps[stepKey(mod, li, si)];
    b.classList.toggle("is-done", d);
    b.classList.toggle("is-current", !d && si === cur);
    b.classList.toggle("is-todo", !d && si !== cur);
  });
  const st = lessonStat(mod, li);
  const item = $("#lessonView .prl-lesson-item.is-current");
  if (item) {
    item.querySelector(".prl-lscore").textContent = `${st.d}/${st.n}`;
    const full = st.n > 0 && st.d === st.n;
    item.classList.toggle("is-done", full);
    item.querySelector(".prl-lnum").textContent = li + 1;
  }
}

function markStep(si, scroll) {
  const { mod, li } = state.view;
  state.steps[stepKey(mod, li, si)] = true;
  if (window.ACT) ACT.log("step");
  saveSteps();
  const scene = $(`#lessonView .prl-step[data-scene="${si}"]`);
  if (scene) scene.classList.add("is-done");
  const st = lessonStat(mod, li);
  $("#lessonView .ldone-count").textContent = `${st.d}/${st.n}`;
  const bar = $("#lessonView .prl-progress");
  bar.setAttribute("aria-valuenow", st.d);
  bar.querySelector("i").style.width = (st.d / st.n) * 100 + "%";
  prRefreshSidebar();
  refreshProgress();
  const next = $(`#lessonView .prl-step[data-scene="${si + 1}"]`) || $("#lessonView .prl-end");
  if (next && scroll !== false) setTimeout(() => {
    next.scrollIntoView({ behavior: "smooth", block: "start" });
    if (document.activeElement === document.body || !document.contains(document.activeElement)) {
      const tgt = next.querySelector("[data-read], [data-propt], [data-pr-ex], button, a[href]") || next;
      if (tgt.tabIndex < 0) tgt.tabIndex = -1;
      tgt.focus({ preventScroll: true });
    }
  }, 250);
}

function prCopy(btn) {
  const text = btn.parentElement.querySelector("code").textContent;
  const ok = () => { btn.textContent = t("ls.copied"); setTimeout(() => { btn.textContent = t("ls.copy"); }, 1500); };
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); ok(); } catch (_) { /* ignore */ }
    ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
  else fallback();
}

/* lesson-view click handling; returns true if the click was consumed */
function prLessonClick(e) {
  const el = e.target;
  if (!el.closest("#lessonView")) return false;
  const tog = el.closest("[data-pr-toggle]");
  if (tog) {
    const dr = $("#prDrawer");
    prSetDrawer(!(dr && dr.classList.contains("is-open")));
    return true;
  }
  const gs = el.closest("[data-goto-step]");
  if (gs) { prSetDrawer(false); prScrollToStep(+gs.dataset.gotoStep); return true; }
  const cp = el.closest("[data-copy]");
  if (cp) { prCopy(cp); return true; }
  const read = el.closest("[data-read]");
  if (read) {
    if (read.disabled) return true;
    markStep(+read.dataset.read);
    read.classList.add("is-on"); read.textContent = t("ls.done"); read.disabled = true;
    return true;
  }
  const opt = el.closest("[data-propt]");
  if (opt) {
    if (opt.disabled) return true;
    const grp = opt.closest("[data-quiz]");
    grp.querySelectorAll("[data-propt]").forEach(o => {
      o.classList.toggle("is-sel", o === opt);
      o.setAttribute("aria-checked", o === opt);
    });
    grp.closest(".prl-quiz-card").querySelector("[data-check-quiz]").disabled = false;
    return true;
  }
  const retake = el.closest("[data-retake-quiz]");
  if (retake) {
    // practice retake: re-enable options, clear the spoiled answer — does NOT
    // unset the step's done state (retrieval practice, not a reset)
    const card = retake.closest(".prl-quiz-card");
    card.dataset.retaken = "1";   // a correct re-answer restores "Try again" and skips markStep
    card.querySelectorAll("[data-propt]").forEach(o => {
      o.disabled = false; o.classList.remove("is-ok", "is-bad", "is-sel");
      o.setAttribute("aria-checked", "false");
    });
    const res = card.querySelector(".prl-result"); res.className = "prl-result"; res.innerHTML = "";
    retake.outerHTML = `<button type="button" class="prl-btn prl-primary" data-check-quiz="${retake.dataset.retakeQuiz}" disabled>${esc(t("ls.check"))}</button>`;
    return true;
  }
  const chk = el.closest("[data-check-quiz]");
  if (chk) {
    if (chk.disabled) return true;
    const si = +chk.dataset.checkQuiz;
    const step = loc(lessonsOf(state.view.mod)[state.view.li].steps)[si];
    const card = chk.closest(".prl-quiz-card");
    const sel = card.querySelector(".prl-opt.is-sel");
    const res = card.querySelector(".prl-result");
    if (!sel) return true;
    sel.classList.remove("is-sel");
    if (+sel.dataset.propt === step.answer) {
      sel.classList.add("is-ok");
      card.querySelectorAll("[data-propt]").forEach(o => o.disabled = true);
      res.className = "prl-result is-ok";
      res.innerHTML = `<b>${esc(t("ls.correct"))}</b> ${imd(loc(step.explain))}`;
      if (card.dataset.retaken === "1") {
        delete card.dataset.retaken;
        chk.outerHTML = `<button type="button" class="prl-btn prl-ghost" data-retake-quiz="${si}">${esc(t("ls.tryagain"))}</button>`;
      } else {
        chk.textContent = t("ls.done"); chk.disabled = true;
        const nSteps = loc(lessonsOf(state.view.mod)[state.view.li].steps).length;
        markStep(si, si === nSteps - 1);   // keep explanation on screen mid-lesson; on the last step scroll to the practise card
      }
    } else {
      // wrong answer: does not complete the step, learner retries with another option
      sel.classList.add("is-bad");
      sel.disabled = true;
      sel.setAttribute("aria-checked", "false");
      res.className = "prl-result is-bad";
      // explain on wrong too (Brilliant-style): the "why" IS the teaching — the
      // student still has to pick the right option to complete the step
      res.innerHTML = `<b>${esc(t("ls.notquite"))}</b> ${imd(loc(step.explain))}`;
      chk.disabled = true;
    }
    return true;
  }
  const jl = el.closest("[data-jlab]");
  if (jl) { labGoLesson(state.view.mod, state.view.li); return true; }
  const px = el.closest("[data-pr-ex]");
  if (px) { prOpenExercise(px.dataset.prEx); return true; }
  return false;
}

/* switching the module in the contents drawer re-lists its lessons without leaving the lesson */
document.addEventListener("change", e => {
  const sel = e.target.closest && e.target.closest("[data-pr-mod]");
  if (!sel || !state.view) return;
  const body = $("#prDrawerBody");
  if (body) body.innerHTML = prDrawerList(sel.value, state.view.mod, state.view.li);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && state.view) { const dr = $("#prDrawer"); if (dr && dr.classList.contains("is-open")) prSetDrawer(false); }
});

/* ←/→ jump between lesson steps */
document.addEventListener("keydown", e => {
  if (!state.view || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const pane = $("#tab-path");
  if (!pane || !pane.classList.contains("active")) return;
  const a = document.activeElement;
  if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
  if (a && a.getAttribute && a.getAttribute("role") === "radio") return;
  const n = loc(lessonsOf(state.view.mod)[state.view.li].steps).length;
  const si = Math.min(n - 1, Math.max(0, prActive + (e.key === "ArrowRight" ? 1 : -1)));
  if (si !== prActive) { e.preventDefault(); prScrollToStep(si); }
});

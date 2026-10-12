/* Catalog tabs: task bank, olympiads, resources, syllabus — uses globals from app.js ($, $$, esc, md, lessonsOf, stepKey, ...) and i18n.js (t, tf, loc, domt, olyTr, syTr, resgt). Loaded before app.js; only declarations at top level. */
/* ---------- TASK BANK tab ---------- */
function taskMatches(t) {
  const q = $("#taskSearch").value.toLowerCase();
  const o = $("#taskOly").value, d = $("#taskDomain").value, df = $("#taskDiff").value;
  if (q && !(loc(t.task) + t.domain + loc(t.desc) + t.oly + domt(t.domain)).toLowerCase().includes(q)) return false;
  if (o && !t.oly.startsWith(o)) return false;
  if (d && !t.domain.toLowerCase().includes(d.toLowerCase())) return false;
  if (df && t.stars !== +df) return false;
  return true;
}

function renderTasks() {
  const rows = TASKS.map(t => taskMatches(t) ? `
    <tr>
      <td class="tname"><a class="link" href="${safeUrl(t.link)}" target="_blank" rel="noopener">${esc(loc(t.task))}</a>
        <div class="tdesc">${esc(loc(t.desc))}</div></td>
      <td>${esc(olyTr(t.oly))}</td>
      <td>${esc(domt(t.domain))}</td>
      <td class="faint">${esc(loc(t.scoring))}</td>
      <td><button type="button" class="link" data-gotomod="${t.mod}">${t.mod}</button></td>
      <td>${levelHTML(t.stars)}</td>
    </tr>` : "").join("");
  $("#taskTable tbody").innerHTML = rows || `<tr><td colspan="6" class="empty">${esc(t("tasks.empty"))}</td></tr>`;
}

/* ---------- OLYMPIADS tab ---------- */
function renderOlympiads() {
  $("#olyGrid").innerHTML = OLYMPIADS.map(o => `
    <div class="oly">
      <h3>${esc(loc(o.name))} <span class="oly-abbr">${esc(o.abbr)}</span></h3>
      <div class="oly-scope">${esc(loc(o.scope))}</div>
      ${o.kg ? `<div class="oly-kg">${esc(t("oly.kg"))}</div>` : ""}
      <div class="oly-row"><span class="oly-lbl">${esc(t("oly.next"))}</span><span>${esc(loc(o.next))}</span></div>
      <div class="oly-row"><span class="oly-lbl">${esc(t("oly.format"))}</span><span>${esc(loc(o.format))}</span></div>
      <div class="oly-row"><span class="oly-lbl">${esc(t("oly.notes"))}</span><span>${esc(loc(o.notes))}</span></div>
      <a class="link" href="${safeUrl(o.link)}" target="_blank" rel="noopener">${esc(loc(o.linkLabel) || t("oly.site"))}</a>
    </div>`).join("");
}

/* ---------- RESOURCES tab ---------- */
function resMatches(r) {
  const q = $("#resSearch").value.toLowerCase();
  const l = $("#resLang").value, g = $("#resGroup").value;
  if (q && !r.n.toLowerCase().includes(q)) return false;
  if (l && !r.lang.includes(l)) return false;
  if (g && r.g !== g) return false;
  return true;
}

function renderResources() {
  const groups = [...new Set(RESOURCES.map(r => r.g))];
  $("#resList").innerHTML = groups.map(g => {
    const items = RESOURCES.filter(r => r.g === g && resMatches(r));
    if (!items.length) return "";
    return `<div class="resgroup"><h3>${esc(resgt(g))}</h3>${items.map(r => `
      <div class="resitem"><a class="link" href="${safeUrl(r.link)}" target="_blank" rel="noopener">${esc(r.n)}</a>
      <span class="resmeta">${r.lang} · ${r.lvl}</span></div>`).join("")}</div>`;
  }).join("") || `<p class="empty">${esc(t("res.empty"))}</p>`;
}

/* ---------- SYLLABUS tab ---------- */
function renderSyllabus() {
  const secs = [...new Set(SYLLABUS.map(s => s.sec))];
  const covered = new Set(SYLLABUS.map(s => s.mod));
  const extra = MODULES.filter(m => !covered.has(m.id)).map(m => m.id).join(", ");
  $("#sylBody").innerHTML = `
    <p class="syl-sum">${esc(tf("syl.sum", SYLLABUS.length, extra))}</p>` +
    secs.map(sec => `
      <h3 class="sylsec">${esc(syTr(sec))}</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>${esc(t("syl.topic"))}</th><th>${esc(t("syl.subtopic"))}</th><th>${esc(t("syl.type"))}</th><th>${esc(t("syl.module"))}</th></tr></thead>
        <tbody>${SYLLABUS.filter(s => s.sec === sec).map(s => `
          <tr><td>${esc(syTr(s.topic))}</td><td>${esc(syTr(s.sub))}</td>
          <td class="faint">${esc(t("syl." + s.cat))}</td>
          <td><button type="button" class="link" data-gotomod="${s.mod}">${s.mod}</button></td></tr>`).join("")}
        </tbody></table></div>`).join("");
}

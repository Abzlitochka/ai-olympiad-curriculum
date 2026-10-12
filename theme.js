/* Light / dark theme. Loaded in <head> so data-theme is set before first paint.
   Order: saved choice → system preference → light. The header button toggles and saves.
   The click handler is delegated, so it works whenever the button is parsed. */
(function () {
  var KEY = "aio-theme-v1", root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (_) {}
  var mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
  var systemDark = function () { return !!(mq && mq.matches); };
  var apply = function (t) {
    root.setAttribute("data-theme", t);
    var bs = document.querySelectorAll("[data-theme-sw]");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", String(t === "dark"));
  };
  apply(saved === "dark" || saved === "light" ? saved : (systemDark() ? "dark" : "light"));
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (!saved) apply(systemDark() ? "dark" : "light"); });
  document.addEventListener("DOMContentLoaded", function () { apply(root.getAttribute("data-theme")); });
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-theme-sw]");
    if (!b) return;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    saved = next;
    try { localStorage.setItem(KEY, next); } catch (_) {}
    apply(next);
  });
})();

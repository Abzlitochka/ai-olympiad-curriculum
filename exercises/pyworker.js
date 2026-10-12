/* Pyodide worker — runs Python off the main thread so student code (incl.
   infinite loops) can't freeze the UI. Protocol:
     {cmd:"init", harness, register}  -> loads Pyodide+numpy, execs harness
     {cmd:"call", fn, args}           -> py.globals.get(fn)(...args)
   Replies {id, ok, out} or {id, ok:false, err}. The main thread may
   terminate() us at any time — a timeout just means respawn + re-init. */
const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
let py = null;

onmessage = async ev => {
  const m = ev.data;
  try {
    if (m.cmd === "init") {
      if (!py) {
        importScripts(PYODIDE_BASE + "pyodide.js");
        py = await loadPyodide({ indexURL: PYODIDE_BASE });
        await py.loadPackage("numpy");
      }
      py.runPython(m.harness);
      if (m.register) py.globals.get("register")(m.register);
      postMessage({ id: m.id, ok: true });
      return;
    }
    if (m.cmd === "call") {
      const out = py.globals.get(m.fn)(...m.args);
      postMessage({ id: m.id, ok: true, out: out === undefined ? "" : String(out) });
      return;
    }
    /* like "call" but scans m.code for imports and installs the needed
       pyodide packages first — lets notebook cells `import pandas` etc. */
    if (m.cmd === "callpkg") {
      try { await py.loadPackagesFromImports(m.code || ""); } catch (_) {}
      const out = py.globals.get(m.fn)(...m.args);
      postMessage({ id: m.id, ok: true, out: out === undefined ? "" : String(out) });
      return;
    }
    postMessage({ id: m.id, ok: false, err: "unknown command" });
  } catch (err) {
    postMessage({ id: m.id, ok: false, err: String(err && err.message || err) });
  }
};

/* PyRunner — main-thread side of exercises/pyworker.js.
   One worker per page; calls serialize through postMessage; a per-call
   timeout terminates + respawns the worker so an infinite loop in student
   code costs a reload, not the whole tab.
   If Workers are unavailable (file://), falls back to in-page Pyodide.

   const runner = PyRunner.create({
     harness: TRAINER_HARNESS,          // Python source exec'd once on init
     register: "json string or null",   // optional post-init call register(json)
     onStatus: t => trStatus(t),        // loading/restart status text
     callTimeoutMs: 30000,
   });
   await runner.init();                            // idempotent
   const out = await runner.call("run_exercise", [j, code, 0, seed]); // -> string
   runner.ready;                                   // bool
*/
const PyRunner = (() => {
  const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

  function create(opts) {
    const harness = opts.harness || "";
    const register = opts.register || null;
    const onStatus = opts.onStatus || (() => {});
    const CALL_TIMEOUT = opts.callTimeoutMs || 30000;
    const INIT_TIMEOUT = opts.initTimeoutMs || 90000;

    let worker = null, ready = null, seq = 0, killed = false;
    const pending = new Map();
    let mainPy = null, mainLoading = null;   // file:// fallback state

    function rejectAll(msg) {
      for (const [, p] of pending) { clearTimeout(p.timer); p.rej(new Error(msg)); }
      pending.clear();
    }

    function spawn() {
      worker = new Worker("exercises/pyworker.js");
      worker.onmessage = ev => {
        const m = ev.data, p = pending.get(m.id);
        if (!p) return;
        pending.delete(m.id); clearTimeout(p.timer);
        m.ok ? p.res(m.out) : p.rej(new Error(m.err || "Python error"));
      };
      worker.onerror = () => {
        rejectAll("Python crashed — restarting.");
        try { worker.terminate(); } catch (_) {}
        worker = null; ready = null;
      };
    }

    function restart() {
      if (worker) { try { worker.terminate(); } catch (_) {} }
      worker = null; ready = null; killed = true;
      onStatus("Restarting Python…");
    }

    function timeout(ms, msg) {
      return new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms));
    }

    /* file:// pages can't spawn workers — degrade to the old main-thread path */
    function fallback() {
      if (mainPy) return Promise.resolve();
      if (mainLoading) return mainLoading;
      onStatus("Loading Python + NumPy in the browser (~25 MB, first time only)…");
      const chain = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = PYODIDE_BASE + "pyodide.js"; s.onload = res;
        s.onerror = () => rej(new Error("Could not download Pyodide — check the internet connection."));
        document.head.appendChild(s);
      }).then(() => loadPyodide()).then(async p => {
        await p.loadPackage("numpy");
        p.runPython(harness);
        if (register) p.globals.get("register")(register);
        mainPy = p; onStatus("");
      });
      mainLoading = Promise.race([chain, timeout(INIT_TIMEOUT,
        "Python took too long to load — check the connection and try again.")])
        .catch(err => { onStatus(err.message); mainLoading = null; throw err; });
      return mainLoading;
    }

    function init() {
      if (mainPy || mainLoading) return fallback();
      if (worker && ready) return ready;
      if (!worker) {
        try { spawn(); }
        catch (e) { return fallback(); }   // Workers blocked (file://) — degrade
      }
      const id = ++seq;
      const send = new Promise((res, rej) => {
        const timer = setTimeout(() => {
          pending.delete(id); restart();
          rej(new Error("Python took too long to load — check the connection and try again."));
        }, INIT_TIMEOUT);
        pending.set(id, { res, rej, timer });
        worker.postMessage({ cmd: "init", id, harness, register });
      });
      ready = send.then(() => { killed = false; onStatus(""); })
        .catch(err => { ready = null; throw err; });
      onStatus(killed ? "Restarting Python…"
                     : "Loading Python + NumPy in the browser (~25 MB, first time only)…");
      return ready;
    }

    async function call(fn, args, ms) {
      await init();
      if (!worker) {           // file:// fallback — synchronous, main thread
        try { const out = mainPy.globals.get(fn)(...args); return out === undefined ? "" : String(out); }
        catch (err) { throw new Error(String(err && err.message || err)); }
      }
      const id = ++seq;
      return new Promise((res, rej) => {
        const timer = setTimeout(() => {
          pending.delete(id); restart();
          rej(new Error("Timed out — your code may have an infinite loop. Python is restarting; press Check again."));
        }, ms || CALL_TIMEOUT);
        pending.set(id, { res, rej, timer });
        worker.postMessage({ cmd: "call", fn, args, id });
      });
    }

    /* call() that first installs pyodide packages imported by `codeForImports`
       (notebook cells: `import pandas` just works, ~once per package) */
    async function callPkg(fn, args, codeForImports, ms) {
      await init();
      if (!worker) {
        try { await mainPy.loadPackagesFromImports(codeForImports || ""); } catch (_) {}
        try { const out = mainPy.globals.get(fn)(...args); return out === undefined ? "" : String(out); }
        catch (err) { throw new Error(String(err && err.message || err)); }
      }
      const id = ++seq;
      return new Promise((res, rej) => {
        const timer = setTimeout(() => {
          pending.delete(id); restart();
          rej(new Error("Timed out — your code may have an infinite loop. Python is restarting; press Run again."));
        }, ms || CALL_TIMEOUT);
        pending.set(id, { res, rej, timer });
        worker.postMessage({ cmd: "callpkg", fn, args, code: codeForImports, id });
      });
    }

    return { init, call, callPkg, get ready() { return !!(mainPy || (worker && ready)); } };
  }
  return { create };
})();

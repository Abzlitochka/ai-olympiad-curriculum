/* Exercise engine — auto-graded Python tasks executed in the browser by Pyodide.
   Format (see exercises/ex_m00.js for a worked example):

   EXERCISES.push({
     id: "m01-zscore",          // unique, prefixed by module
     module: "M1",              // module id from data.js
     title: "Z-score standardization",
     diff: 1,                   // 1 easy, 2 medium, 3 hard
     minutes: 10,               // rough estimate
     theory: "markdown recap shown in the theory pane",
     prompt: "Implement `standardize(X)` …",
     hint: "…",                 // shown on demand (Подсказка)
     starter: "def standardize(X):\n    return X",   // editor starting code
     entry: "standardize",      // function the checker calls
     gen: "def gen(rng):\n    return {'X': rng.normal(0,1,(5,3))}",  // -> kwargs
     solve: "def standardize(X):\n    …",            // reference (hidden from student)
     tests: 40,                 // random tests per run
   });

   Rules for exercise authors:
   - gen receives numpy Generator (np.random.default_rng(seed)); rng.integers/rng.normal
     return numpy scalars — wrap in int()/float() when the signature needs scalars.
   - Every test calls entry(**gen(rng)) for BOTH the reference and the student code.
     gen must be deterministic given rng and must produce arguments valid for the
     reference solution (the checker fails loudly if solve() itself crashes).
   - Allowed imports in starter/solve: numpy as np (preloaded), math, statistics,
     itertools, collections, functools, heapq, random. No sklearn/pandas — implement
     from first principles (that is the point of olympiad training).
   - Inputs may be mutated by solutions — always copy before comparing is handled
     by the engine (kwargs are deep-copied per call).
   - Comparison is recursive: numbers ≈ allclose(atol=1e-6, rtol=1e-5), arrays compare
     shape+dtype-agnostic values, lists/tuples element-wise, dicts key-wise, else ==.
   - Keep generated inputs small (≤ ~30 elements per dim) so 40 tests run in ms.
*/

const EXERCISES = [];

const TRAINER_HARNESS = String.raw`
import ast, json, copy, math, statistics, itertools, collections, functools, heapq, random, warnings
import io, contextlib
import numpy as np
warnings.filterwarnings("ignore")

SAFE_NS = {"np": np, "math": math, "statistics": statistics, "itertools": itertools,
           "collections": collections, "functools": functools, "heapq": heapq, "random": random}

def jsafe(x, depth=0):
    if depth > 8: return "…"
    if isinstance(x, np.ndarray):
        return jsafe(x.tolist(), depth + 1)
    if isinstance(x, (np.integer,)): return int(x)
    if isinstance(x, (np.floating,)): return float(x)
    if isinstance(x, (np.bool_,)): return bool(x)
    if isinstance(x, float):
        return round(x, 6) if math.isfinite(x) else str(x)
    if isinstance(x, (list, tuple)):
        return [jsafe(v, depth + 1) for v in x]
    if isinstance(x, dict):
        return {str(k): jsafe(v, depth + 1) for k, v in x.items()}
    if isinstance(x, (int, str, bool)) or x is None: return x
    return repr(x)

def copy_kw(kw):
    return {k: (v.copy() if isinstance(v, np.ndarray) else copy.deepcopy(v)) for k, v in kw.items()}

def _cmp(exp, got, path=""):
    if isinstance(exp, np.ndarray) or isinstance(got, np.ndarray):
        e, g = np.asarray(exp), np.asarray(got)
        if e.shape != g.shape:
            return f"{path}shape {tuple(g.shape)} != expected {tuple(e.shape)}"
        try:
            if np.issubdtype(e.dtype, np.number) or np.issubdtype(g.dtype, np.number):
                ef, gf = e.astype(float), g.astype(float)
                close = np.isclose(gf, ef, atol=1e-6, rtol=1e-5, equal_nan=True)
                if not bool(close.all()):
                    i = tuple(int(v) for v in np.argwhere(~close)[0])
                    d = np.abs(gf - ef)
                    with np.errstate(invalid="ignore"):
                        mx = float(np.nanmax(d))
                    return (f"{path}first mismatch at index {i}: got {gf[i]:.6g} "
                            f"vs expected {ef[i]:.6g} (max |diff| {mx:.3g}, "
                            f"{int((~close).sum())} of {close.size} differ)")
            elif not np.array_equal(g, e):
                fe, fg = e.ravel(), g.ravel()
                for j in range(len(fe)):
                    try:
                        same = bool(fg[j] == fe[j])
                    except Exception:
                        same = False
                    if not same:
                        return f"{path}first mismatch at flat index {j}: got {fg[j]!r} vs expected {fe[j]!r}"
                return f"{path}values differ"
        except Exception as ex:
            return f"{path}cannot compare: {ex}"
        return None
    if isinstance(exp, (int, float)) and not isinstance(exp, bool) and isinstance(got, (int, float)) and not isinstance(got, bool):
        if not np.isclose(float(exp), float(got), atol=1e-6, rtol=1e-5):
            return f"{path}{got} != expected {exp}"
        return None
    if isinstance(exp, (list, tuple)) and isinstance(got, (list, tuple)):
        if len(exp) != len(got):
            return f"{path}length {len(got)} != expected {len(exp)}"
        for i, (a, b) in enumerate(zip(exp, got)):
            r = _cmp(a, b, path + f"[{i}].")
            if r: return r
        return None
    if isinstance(exp, dict) and isinstance(got, dict):
        if set(exp) != set(got):
            miss = sorted(set(exp) - set(got), key=str)
            extra = sorted(set(got) - set(exp), key=str)
            parts = []
            if miss: parts.append("missing " + ", ".join(repr(k) for k in miss[:5]))
            if extra: parts.append("extra " + ", ".join(repr(k) for k in extra[:5]))
            return f"{path}keys differ ({'; '.join(parts)})"
        for k in exp:
            r = _cmp(exp[k], got[k], path + f"[{k!r}].")
            if r: return r
        return None
    if exp != got:
        return f"{path}{got!r} != expected {exp!r}"
    return None

def _err(e):
    tb = e.__traceback__
    line = None
    while tb:
        if tb.tb_frame.f_code.co_name != "<module>" or tb.tb_next is None:
            line = tb.tb_lineno
        tb = tb.tb_next
    return f"{type(e).__name__}: {e}" + (f" (line {line})" if line else "")

# frame-inspection / import vectors a one-liner could use to read ref/exp
CHEAT_NAMES = {"sys", "inspect", "traceback", "ctypes", "builtins", "gc",
               "_getframe", "currentframe", "tb_frame", "f_back", "f_locals",
               "f_globals", "gi_frame", "cr_frame", "ag_frame", "__subclasses__",
               "__globals__", "__builtins__", "__import__", "builtins",
               "globals", "vars", "locals"}

# modules whose attributes student code must not overwrite — a patch persists in
# the shared worker and corrupts every later check
PATCH_ROOTS = {"np", "numpy", "math"}

def _cheat(tree):
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for a in node.names:
                if a.name.split(".")[0] in CHEAT_NAMES:
                    return "import " + a.name
        elif isinstance(node, ast.ImportFrom):
            if (node.module or "").split(".")[0] in CHEAT_NAMES:
                return "from " + node.module
        elif isinstance(node, ast.Attribute):
            if node.attr in CHEAT_NAMES:
                return node.attr
            if isinstance(node.ctx, (ast.Store, ast.Del)):
                v = node
                while isinstance(v, ast.Attribute):
                    v = v.value
                if isinstance(v, ast.Name) and v.id in PATCH_ROOTS:
                    return v.id + "." + node.attr
        elif isinstance(node, ast.Call):
            f = node.func
            if isinstance(f, ast.Name) and f.id == "setattr" and node.args \
               and isinstance(node.args[0], ast.Name) and node.args[0].id in PATCH_ROOTS:
                return "setattr(" + node.args[0].id + ", …)"
        elif isinstance(node, ast.Name) and node.id in CHEAT_NAMES:
            return node.id
    return None

def run_exercise(ex_json, code, n_tests=0, seed=None):
    ex = json.loads(ex_json)
    n_tests = n_tests or ex.get("tests", 40)
    gns = dict(SAFE_NS)
    try:
        exec(ex["gen"], gns)
        gen = gns["gen"]
    except Exception as e:
        return json.dumps({"status": "badgen", "msg": _err(e)})
    rns = dict(SAFE_NS)
    try:
        exec(ex["solve"], rns)
        ref = rns[ex["entry"]]
    except Exception as e:
        return json.dumps({"status": "badref", "msg": _err(e)})
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return json.dumps({"status": "error", "stage": "compile",
                           "msg": f"SyntaxError (line {e.lineno}): {e.msg}"})
    hit = _cheat(tree)
    if hit:
        return json.dumps({"status": "error", "stage": "compile",
                           "msg": f"'{hit}' reaches outside the sandbox — the checker only grades the function itself. Solve it honestly: reading the expected answer won't help you learn."})
    sns = dict(SAFE_NS)
    outbuf = io.StringIO()
    try:
        with contextlib.redirect_stdout(outbuf):
            exec(code, sns)
    except Exception as e:
        return json.dumps({"status": "error", "stage": "compile", "msg": _err(e),
                           "out": outbuf.getvalue()[-4000:]})
    fn = sns.get(ex["entry"])
    if not callable(fn):
        return json.dumps({"status": "error", "stage": "compile",
                           "msg": f"Define a function named {ex['entry']}."})
    rng = np.random.default_rng(seed)
    for t in range(n_tests):
        try:
            kw = gen(rng)
        except Exception as e:
            return json.dumps({"status": "badgen", "msg": _err(e), "test": t + 1})
        case = {k: jsafe(v) for k, v in kw.items()}
        try:
            with contextlib.redirect_stdout(outbuf):
                got = fn(**copy_kw(kw))
        except Exception as e:
            try:
                exp_err = ref(**copy_kw(kw))
            except Exception:
                exp_err = None
            return json.dumps({"status": "error", "stage": "run", "msg": _err(e),
                               "case": case, "test": t + 1, "expected": jsafe(exp_err),
                               "out": outbuf.getvalue()[-4000:]})
        try:
            exp = ref(**copy_kw(kw))
        except Exception as e:
            return json.dumps({"status": "badref", "msg": _err(e), "case": case, "test": t + 1})
        r = _cmp(exp, got)
        if r:
            return json.dumps({"status": "wrong", "case": case, "test": t + 1,
                               "expected": jsafe(exp), "got": jsafe(got), "diff": r,
                               "out": outbuf.getvalue()[-4000:]})
    return json.dumps({"status": "pass", "tests": n_tests,
                       "out": outbuf.getvalue()[-4000:]})
`;

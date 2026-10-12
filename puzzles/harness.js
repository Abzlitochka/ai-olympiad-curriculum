/* Python harness for Tensor Puzzles, executed in the browser by Pyodide (NumPy backend). */
const PUZZLE_HARNESS = String.raw`
import ast, json, warnings
import numpy as np
warnings.filterwarnings("ignore")

def arange(i):
    "Use this function to replace a for-loop."
    return np.arange(i)

def where(q, a, b):
    "Use this function to replace an if-statement."
    return np.where(q, a, b)

class TT:
    def __class_getitem__(cls, item):
        return None

SPECS = {}
ORDER = []

def register(puzzles_json):
    global ORDER
    ORDER = []
    for p in json.loads(puzzles_json):
        ns = {"np": np}
        exec(p["spec"], ns)
        SPECS[p["name"]] = ns[p["name"] + "_spec"]
        ORDER.append(p["name"])

FORBIDDEN = {
    ast.For: "for-loops", ast.AsyncFor: "for-loops", ast.While: "while-loops",
    ast.ListComp: "comprehensions", ast.SetComp: "comprehensions",
    ast.DictComp: "comprehensions", ast.GeneratorExp: "generator expressions",
    ast.Lambda: "lambda", ast.IfExp: "x if c else y (use where)",
    ast.BoolOp: "and / or (use * and |)", ast.List: "list literals",
    ast.Dict: "dict literals", ast.Set: "set literals", ast.JoinedStr: "f-strings",
    ast.NamedExpr: "walrus :=", ast.Await: "await",
}

def check(code, name):
    """Return (errors, length_of_return_line)."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return [f"SyntaxError (line {e.lineno}): {e.msg}"], 0
    fns = [n for n in tree.body if isinstance(n, ast.FunctionDef)]
    if len(tree.body) != 1 or len(fns) != 1 or fns[0].name != name:
        return [f"Define exactly one function, named {name}, and nothing else."], 0
    f = fns[0]
    # signature parts (decorators, defaults, annotations) are evaluated by exec
    # with builtins live — scan them too, or exec()/eval() in a default arg
    # would bypass every rule below
    errs = []
    if f.decorator_list:
        errs.append("Decorators are not allowed.")
    SIG_NAMES = {"TT", "int", "bool", "float", "str"}
    sig_parts = list(f.args.defaults) + [d for d in f.args.kw_defaults if d is not None]
    if f.returns is not None:
        sig_parts.append(f.returns)
    for a in f.args.posonlyargs + f.args.args + f.args.kwonlyargs + [x for x in (f.args.vararg, f.args.kwarg) if x]:
        if a.annotation is not None:
            sig_parts.append(a.annotation)
    for part in sig_parts:
        for node in ast.walk(part):
            for t, why in FORBIDDEN.items():
                if isinstance(node, t):
                    errs.append(f"Not allowed: {why}.")
            if isinstance(node, ast.Call):
                errs.append("Calls are not allowed in the signature.")
            if isinstance(node, ast.Attribute):
                errs.append("Attribute access is not allowed in the signature.")
            if isinstance(node, ast.Name) and node.id not in SIG_NAMES:
                errs.append(f"Unknown or forbidden name in signature: {node.id}")
    body = [s for s in f.body
            if not (isinstance(s, ast.Expr) and isinstance(s.value, ast.Constant)
                    and isinstance(s.value.value, str))]
    if len(body) != 1 or not isinstance(body[0], ast.Return) or body[0].value is None:
        return ["The body must be a single line: return <expression>"], 0
    ret = body[0]
    line = code.splitlines()[ret.lineno - 1]
    length = len(line.rstrip())
    if ret.end_lineno != ret.lineno:
        errs.append("The return expression must fit on one line.")
    if length >= 80:
        errs.append(f"Line is {length} columns; the limit is 79.")
    idx = ORDER.index(name)
    prev = set(ORDER[:idx])
    params = {a.arg for a in f.args.args}
    callable_names = {"arange", "where"} | prev
    in_func = {id(sub) for c in ast.walk(ret) if isinstance(c, ast.Call) for sub in ast.walk(c.func)}
    for node in ast.walk(ret):
        if id(node) in in_func:
            continue
        for t, why in FORBIDDEN.items():
            if isinstance(node, t):
                errs.append(f"Not allowed: {why}.")
        if isinstance(node, ast.Call):
            if not (isinstance(node.func, ast.Name) and node.func.id in callable_names):
                fn = ast.unparse(node.func)
                later = fn in ORDER and fn not in prev
                errs.append(f"Not allowed to call {fn}()" +
                            (" — it is a later puzzle." if later else
                             ". Only arange, where and earlier puzzle functions."))
            if node.keywords:
                errs.append("Keyword arguments are not allowed.")
        if isinstance(node, ast.Attribute) and node.attr != "shape":
            errs.append(f"Not allowed: .{node.attr} (only .shape).")
        if isinstance(node, ast.Name) and node.id not in params | callable_names:
            if node.id in ORDER:
                errs.append(f"{node.id} is a later puzzle — solve it in order.")
            else:
                errs.append(f"Unknown or forbidden name: {node.id}")
    return sorted(set(errs), key=errs.index), length

def gen(name, rng):
    n = lambda lo=1, hi=5: int(rng.integers(lo, hi + 1))
    r = lambda *s: rng.integers(-5, 6, size=s)
    if name == "ones":
        i = n(); return dict(i=i), [], np.zeros(i, int)
    if name == "sum":
        a = r(n()); return dict(a=a), [a], np.zeros(1, int)
    if name == "outer":
        a, b = r(n()), r(n()); return dict(a=a, b=b), [a, b], np.zeros((len(a), len(b)), int)
    if name == "diag":
        i = n(); a = r(i, i); return dict(a=a), [a], np.zeros(i, int)
    if name in ("eye", "triu"):
        j = n(); return dict(j=j), [], np.zeros((j, j), int)
    if name == "cumsum":
        a = r(n()); return dict(a=a), [a], np.zeros(len(a), int)
    if name in ("diff", "roll", "flip"):
        i = n(); a = r(i); return dict(a=a, i=i), [a], np.zeros(i, int)
    if name == "vstack":
        i = n(); a, b = r(i), r(i); return dict(a=a, b=b), [a, b], np.zeros((2, i), int)
    if name == "compress":
        i = n(); g = rng.random(i) < 0.5; v = r(i)
        return dict(g=g, v=v, i=i), [g, v], np.zeros(i, int)
    if name == "pad_to":
        i, j = n(), n(); a = r(i); return dict(a=a, i=i, j=j), [a], np.zeros(j, int)
    if name == "sequence_mask":
        i, j = n(), n(); values = r(i, j); length = rng.integers(0, 6, size=i) % j
        return dict(values=values, length=length), [values, length], np.zeros((i, j), int)
    if name == "bincount":
        i, j = n(), n(); a = rng.integers(0, 6, size=i) % j
        return dict(a=a, j=j), [a], np.zeros(j, int)
    if name == "scatter_add":
        i, j = n(), n(); values = r(i); link = rng.integers(0, 6, size=i) % j
        return dict(values=values, link=link, j=j), [values, link], np.zeros(j, int)
    if name == "flatten":
        i, j = n(), n(); a = r(i, j); return dict(a=a, i=i, j=j), [a], np.zeros(i * j, int)
    if name == "linspace":
        i, j, k = r(1), r(1), n()
        return dict(i=i, j=j, n=k), [i[0], j[0]], np.zeros(k, float)
    if name == "heaviside":
        i = n(); a, b = r(i), r(i); return dict(a=a, b=b), [a, b], np.zeros(i, int)
    if name == "repeat":
        i, rows = n(), n(); a = r(i); d = np.array([rows])
        return dict(a=a, d=d), [a, d], np.zeros((rows, i), int)
    if name == "bucketize":
        v = r(n()); boundaries = np.abs(r(n())).cumsum()
        return dict(v=v, boundaries=boundaries), [v, boundaries], np.zeros(len(v), int)
    raise ValueError(name)

def tolist(x):
    return x.tolist() if isinstance(x, np.ndarray) else x

def expected_for(name, spec_args, out):
    out = out.copy()
    SPECS[name](*[a.copy() if isinstance(a, np.ndarray) else a for a in spec_args], out)
    return out

def examples(name, k=3, seed=7):
    rng = np.random.default_rng(seed)
    res = []
    for _ in range(k):
        kw, spec_args, out = gen(name, rng)
        res.append({"inputs": {key: tolist(v) for key, v in kw.items()},
                    "out": tolist(expected_for(name, spec_args, out))})
    return json.dumps(res)

def run(name, code, prev_json, n_tests=60, seed=None):
    errs, length = check(code, name)
    if errs:
        return json.dumps({"status": "rule", "errors": errs, "length": length})
    ns = {"arange": arange, "where": where, "TT": TT}
    for c in json.loads(prev_json):
        try:
            exec(c, ns)
        except Exception:
            pass
    try:
        exec(code, ns)
    except Exception as e:
        return json.dumps({"status": "error", "msg": f"{type(e).__name__}: {e}", "length": length})
    fn = ns[name]
    rng = np.random.default_rng(seed)
    for t in range(n_tests):
        kw, spec_args, out = gen(name, rng)
        exp = expected_for(name, spec_args, out)
        case = {key: tolist(v) for key, v in kw.items()}
        try:
            got = fn(**{key: (v.copy() if isinstance(v, np.ndarray) else v) for key, v in kw.items()})
        except NameError as e:
            return json.dumps({"status": "error", "length": length, "case": case, "test": t + 1,
                               "msg": f"NameError: {e} — earlier puzzle not solved yet?"})
        except Exception as e:
            return json.dumps({"status": "error", "msg": f"{type(e).__name__}: {e}",
                               "case": case, "test": t + 1, "length": length})
        g = np.asarray(got)
        if g.shape != exp.shape:
            return json.dumps({"status": "shape", "case": case, "test": t + 1, "length": length,
                               "expected": tolist(exp), "got": tolist(g) if g.size <= 64 else None,
                               "msg": f"Shape {g.shape} but expected {exp.shape}."})
        try:
            ok = np.allclose(g.astype(float), exp.astype(float))
        except Exception:
            ok = False
        if not ok:
            return json.dumps({"status": "wrong", "case": case, "test": t + 1, "length": length,
                               "expected": tolist(exp), "got": tolist(g)})
    return json.dumps({"status": "pass", "tests": n_tests, "length": length})
`;

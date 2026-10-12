/* M0 Toolbox — Python, NumPy, pandas, PyTorch, contest workflow (kept: the
   Microsoft courses assume Python; exercises below need this home). */

COURSE.M0 = [
  L("Python basics: values, types, control flow", 45, [REF.py, REF.cs231npy], [
    T("Numbers, strings, and variables", [
      p("A variable is a name attached to a value; Python infers the **type**. `42` is an `int`, `3.14` a `float`, `\"cat\"` a `str`, `True` a `bool`. Check with `type(x)`; convert with `int()`, `float()`, `str()`."),
      code(`acc = 0.875              # float — model scores live here
n = 3                  # int — counts and indices
label = "cat"          # str — labels, filenames, column names
ok = acc > 0.8         # bool — every comparison produces one

int("42")              # 42          (int("cat") would raise ValueError)
type(acc)              # <class 'float'>`),
      p("Two operators to memorize: `//` divides and rounds **down** to a whole number, `%` gives the remainder. Together they answer \"how many full groups of 32 fit in 1000 samples, and how many are left over\":"),
      code(`1000 // 32     # 31 full groups
1000 % 32      # 8 samples left over
2 ** 10        # 1024 — ** is exponentiation, not ^
9 / 2          # 4.5  — / always returns a float
-7 // 2        # -4   — floor division rounds DOWN, not toward 0`),
      ul([
        "`==` compares values, `is` compares identity — for numbers and strings always use `==`.",
        "`0.1 + 0.2 == 0.3` is `False`: floats are binary fractions, not exact decimals. Compare with `abs(a - b) < 1e-9`.",
        "`True` counts as `1`, so `sum(mask)` — where `mask` is a list of True/False flags — counts the Trues; that one trick computes accuracies, filtered lengths, and selection coverage all over this course.",
      ]),
    ]),
    T("Strings and f-strings", [
      p("Strings are immutable sequences of characters — you never change `\"cat\"` into `\"car\"`, you build a new string. The daily tools: `split` (text → list), `join` (list → text), `strip` (removes whitespace and newlines at both ends), `replace`, and `in` for substring tests."),
      code(`line = "cat,dog,bird"
parts = line.split(",")          # ['cat', 'dog', 'bird']
";".join(parts)                  # 'cat;dog;bird' — glue first, then .join
"  padded\\n".strip()             # 'padded'
"cat" in "concatenate"           # True — substring test`),
      p("**f-strings** evaluate whatever sits in `{}` and insert it into the text. `:.3f` formats a float with 3 decimals — the standard way to print a score:"),
      code(`loss = 0.45678
f"epoch {3}, loss={loss:.4f}"    # 'epoch 3, loss=0.4568'
f"{0.8765:.1%}"                  # '87.6%' — percent formatting
f"{'cat':>8}"                    # '     cat' — right-align for neat logs`),
      p("Indexing follows the list rules coming next: `s[0]` is the first character, `s[-1]` the last, `s[1:4]` the slice from index 1 up to (not including) 4, `len(s)` the length."),
    ]),
    T("Lists: indexing, slicing, mutating", [
      p("A **list** is an ordered, mutable sequence — the default container. Indexing is 0-based: `xs[0]` first, `xs[-1]` last. Slices `xs[a:b]` take indices a through b−1 — the end is **exclusive**, so `len(xs[a:b])` is `b - a`."),
      code(`xs = [10, 20, 30, 40, 50]
xs[0], xs[-1]            # (10, 50)
xs[1:3]                  # [20, 30] — indices 1 and 2 only
xs[-2:]                  # [40, 50] — the last two
# full slice form is xs[start:stop:step] — step −1 walks backwards:
xs[::-1]                 # [50, 40, 30, 20, 10] — reversed

xs.append(60)            # grow by one: [10, 20, 30, 40, 50, 60]
xs.pop()                 # remove and return the last item
len(xs), 20 in xs        # (5, True)`),
      p("`sorted(xs)` returns a **new** sorted list; `xs.sort()` sorts in place and returns `None`. `xs = xs.sort()` throws the list away — a classic silent bug. Same story for `xs.reverse()`."),
      note("Strings and tuples follow the same indexing and slicing rules but are immutable: `\"abc\"[0]` is `\"a\"`, while `\"abc\"[0] = \"x\"` is a TypeError."),
    ]),
    T("Conditions and truthiness", [
      p("`if` / `elif` / `else` picks a branch; `and`, `or`, `not` combine tests; chained comparisons read like math: `0 <= p <= 1`."),
      code(`acc = 0.85
if acc >= 0.9:
    grade = "gold"
elif acc >= 0.7:
    grade = "silver"
else:
    grade = "keep training"      # acc is 0.85 → grade is 'silver'`),
      p("Every value has a truth value. **Falsy**: `False`, `0`, `0.0`, `\"\"`, `[]`, `{}`, `None`. Everything else is truthy, so `if scores:` reads as \"if scores is non-empty\"."),
      code(`scores = []
if scores:                       # empty list → falsy → skips
    print(max(scores))
else:
    print("nothing yet")         # this prints

x = None
if x is None:                    # None is compared with "is", never ==
    print("missing")`),
      ul([
        "Indentation **is** the syntax: the block under `if` must be indented (4 spaces) — there are no braces.",
        "`if x:` treats a real `0` the same as \"no value\". When zero is legal, write `if x is not None:`.",
      ]),
    ]),
    T("Loops: for, while, enumerate, zip", [
      p("`for` iterates over items directly — no index bookkeeping. `range(n)` yields 0, 1, …, n−1; `enumerate(seq)` hands back (index, item) pairs; `zip(a, b)` walks two lists in lockstep and stops at the shorter one."),
      code(`scores = [0.71, 0.85, 0.64]
total = 0
for s in scores:                 # the items themselves, one by one
    total += s                   # shorthand for total = total + s
total / len(scores)              # 0.7333...

best, best_i = -1.0, -1
for i, s in enumerate(scores):
    if s > best:
        best, best_i = s, i      # two assignments at once — tuple unpacking
best_i                           # 1 — the argmax index, found by hand`),
      code(`for name, i in zip(["cat", "dog"], [0, 1]):
    print(name, i)               # cat 0, then dog 1

n = 100
while n > 1:                     # repeats until the condition fails
    n //= 2                      # 50, 25, 12, 6, 3, 1
n                                # 1`),
      ul([
        "`break` exits the loop early (stop at the first corrupt row); `continue` skips to the next item.",
        "`for i in range(len(xs))` works but is un-Pythonic — `enumerate` gives index and value without indexing back in.",
        "Never append to or delete from a list while looping over it — collect into a new list instead.",
      ]),
    ]),
    T("When it breaks: reading a traceback", [
      note("Notebook words: a **cell** is one runnable block of a notebook; the **kernel** is the Python engine that runs the cells."),
      p("Errors print a **traceback** — a stack of calls ending with the actual error. Read it bottom-up: the last line names the error type and message, the lines above show your code. The four you will meet daily:"),
      ul([
        "`NameError`: a name that doesn't exist — a typo, or a cell you never ran.",
        "`TypeError`: wrong type for the operation — `\"3\" + 2`, or calling something that isn't a function.",
        "`IndexError` / `KeyError`: a list index past the end, or a lookup key that isn't stored.",
        "`SyntaxError` / `IndentationError`: Python can't parse the code — check missing colons and mixed indentation.",
      ]),
      code(`xs = [1, 2, 3]
# xs[5]                  # IndexError: list index out of range
# xs + 5                 # TypeError: can only concatenate list to list
# pritn(xs)              # NameError: name 'pritn' is not defined
x = xs[2] + int("4")     # 7 — int() parses the string first`),
      note("In a notebook the sneakiest trap is stale state: a cell can keep working on a variable you deleted or renamed an hour ago. When results look impossible, **restart the kernel and run all cells top to bottom**."),
    ]),
    Q("What does `7 // 2 + 7 % 2` equal?",
      ["4", "3.5", "5", "3"], 0,
      "7 // 2 is 3 and 7 % 2 is 1, so the sum is 4. In general a // b * b + a % b == a."),
    Q("xs = [10, 20, 30]. What is xs[1:]?",
      ["[20, 30]", "[10, 20, 30]", "[20]", "[10]"], 0,
      "The slice starts at index 1 and runs to the end; omitting the end means \"everything\"."),
    Q("When does `if scores:` enter the branch?",
      ["When scores contains at least one item", "When every score is non-zero", "When scores is not None", "When scores is a list of floats"], 0,
      "A non-empty list is truthy, an empty one falsy — so this tests \"has at least one item\"."),
  ]),
  L("Functions, comprehensions, generators", 35, [REF.py, REF.cs231npy], [
    T("def, return, arguments", [
      p("A function names a computation so you can reuse and test it. `def` creates it; `return` hands back the result and exits immediately — code after `return` never runs. Arguments can have defaults; callers may pass them by name (`f(x, scale=2)`)."),
      code(`def accuracy(y_true, y_pred):
    \"\"\"Fraction of correct predictions.\"\"\"   # docstring: the function's one-line manual
    correct = sum(t == p for t, p in zip(y_true, y_pred))  # True counts as 1
    return correct / len(y_true)

accuracy([1, 0, 1], [1, 1, 1])     # 2/3 ≈ 0.667

def clip(x, lo=0.0, hi=1.0):       # defaults make arguments optional
    return max(lo, min(x, hi))
clip(1.7), clip(-0.2), clip(0.4)   # (1.0, 0.0, 0.4)`),
      p("A function that reaches the end without `return` hands back `None` — the source of \"TypeError: unsupported operand\" surprises two cells later. Variables created inside are **local**: they vanish when the function ends, and a same-named variable outside is untouched."),
      note("One famous trap: a default value is created **once**, when `def` runs — `def f(x=[])` shares that single list across every call, so `f(); f()` returns `[1, 1]`, not `[1]`. Default to `x=None` and build the list inside the function."),
    ]),
    T("Comprehensions", [
      p("A comprehension builds a container in one expression: `[expr for x in xs]` maps every item, adding `if cond` at the end filters first. It replaces the append-in-a-loop pattern — shorter to write, faster to run. For dicts, looping yields the **keys** (`for k in d`), `.items()` yields `(key, value)` pairs, and `{k: v for ...}` builds a dict the same way."),
      code(`scores = [0.71, 0.85, 0.64, 0.92]
squares = [s * s for s in scores]                    # map: every item transformed
high    = [s for s in scores if s > 0.8]             # filter: keep some items
rounded = [round(s, 1) if s > 0.7 else 0 for s in scores]  # if-else in the VALUE slot
label2id = {"cat": 0, "dog": 1}
id2label = {v: k for k, v in label2id.items()}       # dict comprehension — swap pairs
uniq_len = {len(name) for name in label2id}          # set comprehension → {3}`),
      p("Two different `if`s: `if cond` at the **end** decides which items appear; `a if cond else b` in the **value slot** picks between two values per item. Comprehensions nest (`[(i, j) for i in a for j in b]`), but once one needs a comment to explain it, write the loop — readers parse loops faster."),
    ]),
    T("Generators: lazy sequences", [
      p("A **generator expression** is a comprehension in round brackets: it produces items **on demand** instead of building a list in memory. For a billion items that is the difference between running and crashing."),
      code(`xs = range(10)
list_comp = [x * x for x in xs]   # a real list — 10 slots in memory
gen       = (x * x for x in xs)   # a generator — nothing computed yet
sum(gen)                          # 285 — pulls items one at a time
sum(gen)                          # 0 — generators are single-use, consumed forever`),
      p("`def` + `yield` makes a custom generator: the function pauses at each `yield` and resumes where it left off on the next pull. `for` pulls items one by one:"),
      code(`def batches(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]      # hand out one chunk, pause here

for chunk in batches(range(10), 4):
    print(chunk)                   # [0,1,2,3] then [4,5,6,7] then [8,9]`),
      note("That is exactly what a DataLoader does — yield one batch at a time instead of materializing all batches. When a contest file is too big for memory, loop over its lines or read it with pandas `chunksize`: same lazy idea."),
    ]),
    T("The iterator toolbox", [
      p("A few built-ins replace most handwritten loops. `sorted`, `min`, `max` all take `key=` — a function extracting the value to compare by; `lambda x: expr` is a one-expression anonymous function, handy as that key. `any`/`all` ask \"does at least one / do all\" over lazily produced conditions."),
      code(`words = ["pear", "fig", "banana"]
sorted(words, key=len)              # ['fig', 'pear', 'banana'] — sorted by length
max(scores), min(scores)            # (0.92, 0.64)
pairs = [("cat", 0.9), ("dog", 0.7), ("bird", 0.8)]
max(pairs, key=lambda p: p[1])      # ('cat', 0.9) — argmax over pairs

any(s > 0.9 for s in scores)        # True — at least one qualifies
all(s > 0.5 for s in scores)        # True — every one qualifies
sum(s for s in scores if s > 0.8)   # generator inside: no list is ever built`),
      p("`lambda` is fine for `key=` and a smell anywhere bigger — give real logic a `def` and a name. `reversed(xs)` walks backwards; `itertools` (chain, product, combinations) covers the rest."),
    ]),
    Q("g = (x*x for x in range(3)); what does list(g) return after sum(g) already ran?",
      ["[]", "[0, 1, 4]", "[0, 1, 4, 0, 1, 4]", "TypeError"], 0,
      "Generators are consumed once — sum(g) pulled every item, so nothing is left."),
    Q("def f(x=[]): x.append(1); return x. What does the second call f() return?",
      ["[1, 1]", "[1]", "[]", "An error"], 0,
      "Default arguments are created once at def time and shared by every call. Use x=None as the default."),
    Q("Which builds a dict mapping each word to its length?",
      ["{w: len(w) for w in words}", "[len(w) for w in words]", "{len(w): w for w in words}", "dict(words, key=len)"], 0,
      "Key first, colon, value — a dict comprehension. The swapped version maps lengths to words and loses duplicates."),
  ]),
  L("Dicts, sets, tuples: data structure patterns", 45, [REF.py], [
    T("The four containers, honestly", [
      p("`list` — ordered, mutable, allows duplicates: the default sequence. `tuple` — the same but immutable: safe dict keys, multi-value returns. `dict` — key → value lookup: index anything by anything. `set` — unique items with instant membership tests: dedupe and \"have I seen this?\"."),
      p("Rule of thumb: **list** for data you walk through in order, **dict** for lookup by name, **set** for membership and dedupe, **tuple** when the contents must not change — or must serve as a dict key."),
      code(`label2id = {"cat": 0, "dog": 1}      # dict
label2id["bird"] = 2                # add a key
label2id.get("fox", -1)             # -1 — .get returns a default instead of KeyError
"cat" in label2id                   # True — "in" on a dict checks KEYS
pair = (0.91, "cat")                # tuple — e.g. a (score, label) returned together`),
    ]),
    T("Dict patterns: counting and grouping", [
      p("Two dict idioms appear in every dataset pipeline. **Counting**: `d[k] = d.get(k, 0) + 1` — `.get(key, default)` avoids the KeyError on first sighting; called with no default, `d.get(k)` returns `None`. **Grouping**: collect items into per-key lists with `setdefault` — `d.setdefault(k, v)` returns `d[k]`, inserting `v` first if `k` is missing."),
      code(`labels = ["cat", "dog", "cat", "bird", "dog", "cat"]

counts = {}
for lab in labels:
    counts[lab] = counts.get(lab, 0) + 1
counts                          # {'cat': 3, 'dog': 2, 'bird': 1}

by_first = {}                   # group words by first letter
for w in ["cat", "dog", "crow"]:
    by_first.setdefault(w[0], []).append(w)
by_first                        # {'c': ['cat', 'crow'], 'd': ['dog']}`),
      p("`collections.Counter` does the counting for you (`Counter(labels).most_common(3)`) and `defaultdict(list)` removes the setdefault — both appear in the next lesson. Write the plain version by hand first so you know what they hide."),
      p("Looping over a dict yields its **keys**; `.items()` yields (key, value) pairs; `.values()` yields values. Invert a dict — swap keys and values — with a comprehension: `{v: k for k, v in d.items()}`."),
    ]),
    T("Tuples and unpacking", [
      p("Unpacking splits a sequence into names — in assignments, in `for` targets, in `return`. It is why `a, b = b, a` swaps with no temporary variable: the right side is fully built before assignment happens."),
      code(`def top_two(scores):
    return max(scores), min(scores)      # returns ONE tuple

hi, lo = top_two([0.4, 0.9, 0.7])        # unpacked at the call site
a, b = 1, 2
a, b = b, a                              # swap

for i, (name, sc) in enumerate([("cat", 0.9), ("dog", 0.7)]):
    print(i, name, sc)                   # nested unpacking in the for-target`),
      p("Use `_` for values you don't need (`name, _ = pair`), and `first, *rest = xs` to grab the head plus everything else — `*rest` collects the remainder into a list."),
    ]),
    T("Sets: membership and dedupe", [
      p("`set` stores each item once and answers `x in s` in ~O(1) — a hash lookup, ~instant regardless of the set's size — where a list scans all n items. Deduplicating 10⁶ items against a set is instant; against a list it is roughly 10¹² comparisons: seconds versus hours."),
      code(`seen = {"cat", "dog"}
"cat" in seen                        # True — constant time
seen.add("bird"); seen.add("cat")    # 'cat' was already there — sets keep one copy

a, b = {1, 2, 3}, {2, 3, 4}
a | b                                # {1, 2, 3, 4}  union
a & b                                # {2, 3}        intersection
a - b                                # {1}           difference
list({3, 1, 2, 1})                   # dedupe — but order is not guaranteed`),
      ul([
        "Set items and dict keys must be hashable: numbers, strings, tuples work — lists and dicts don't.",
        "`{1}` is a set but `{}` is an empty **dict** — write `set()` for an empty set.",
        "Sets are unordered: `sorted(s)` when order matters, never rely on iteration order.",
      ]),
    ]),
    T("Sorting with keys", [
      p("`sorted(xs, key=f)` orders by `f(x)` — the value each item maps to. A lambda picks out a field; `reverse=True` flips the order. A tuple key sorts lexicographically: first element decides, ties fall to the second."),
      code(`pairs = [("cat", 0.9), ("dog", 0.7), ("bird", 0.9)]
sorted(pairs, key=lambda p: p[1])            # by score, ascending
sorted(pairs, key=lambda p: -p[1])           # descending, via negation
sorted(pairs, key=lambda p: (-p[1], p[0]))   # score desc, name asc on ties

counts = {"cat": 3, "dog": 2}
sorted(counts, key=counts.get)               # ['dog', 'cat'] — dict keys by value`),
      note("`sorted` returns a new list and leaves the original alone; `xs.sort()` mutates `xs` and returns `None`. Both accept `key=` and `reverse=`."),
    ]),
    T("Aliasing: the bug that bites everyone", [
      p("`b = a` never copies a container — both names point to **the same object**, so `b.append(3)` shows up in `a` too. Copy with `a.copy()` (one level) or `copy.deepcopy(a)` (nested containers)."),
      code(`a = [1, 2]
b = a          # b is the SAME list
b.append(3)
a              # [1, 2, 3] — surprise

c = a.copy()   # a real copy
c.append(4)    # a is untouched

d = [[0] * 3] * 2        # looks like two rows...
d[0][1] = 9              # ...but d[1][1] is also 9 — both rows are the same list
d = [[0] * 3 for _ in range(2)]   # fix: build each row separately`),
      ul([
        "`def f(xs=[])` shares one default list across all calls — mutate it once and it leaks into every later call. Default to `xs=None`.",
        "Slices copy shallowly: `a[:]` copies a flat list, but a list of lists still shares the inner lists — `copy.deepcopy` fixes that.",
        "Functions receive the same object too: a helper that mutates its argument changes the caller's data. Copy at the boundary, or document the mutation.",
      ]),
    ]),
    Q("What does `{k: v for k, v in zip(['a', 'b'], [1, 2])}` produce?",
      ["{'a': 1, 'b': 2}", "[('a', 1), ('b', 2)]", "{'a', 'b', 1, 2}", "An error"], 0,
      "zip pairs the items; the dict comprehension turns each pair into key: value."),
    Q("d = {'a': 1}. What does d.get('b') return?",
      ["None", "KeyError", "0", "'b'"], 0,
      ".get() returns None (or a default you pass) instead of raising; d['b'] would raise KeyError."),
    Q("`a = [1, 2]; b = a; b.append(3)`. What is `a` now?",
      ["[1, 2, 3]", "[1, 2]", "[3]", "An error"], 0,
      "b and a refer to the same list object, so changing b changes a."),
  ]),
  L("Classes, files, and the traps that bite", 35, [REF.py, REF.pt], [
    T("Classes: state plus behaviour", [
      p("A **class** bundles data (the **attributes**, `self.x`) with the functions that act on it (**methods**). `__init__` runs when you write `Averager()` and sets the attributes up. `self` is just \"this object\" — Python passes it to every method automatically."),
      code(`class Averager:
    def __init__(self):              # runs at Averager()
        self.total, self.n = 0.0, 0
    def update(self, value):         # self = the object it was called on
        self.total += value
        self.n += 1
    @property                        # lets us write avg.mean — no ()
    def mean(self):
        return self.total / max(self.n, 1)   # max(): avoid ÷0 before any update

avg = Averager()
avg.update(0.8); avg.update(0.6)
avg.mean                       # 0.7`),
      p("This is not decoration: a PyTorch `nn.Module` model, a `Dataset`, a sklearn estimator — all are classes where `__init__` does setup and methods (`forward`, `fit`, `predict`) do the work. Subclassing `nn.Module` in AI1 is exactly this pattern."),
    ]),
    T("Reading and writing files", [
      p("`with open(path) as fh` opens a file and **closes it automatically** when the block ends — even if an error occurs. Iterating the file object yields lines one at a time, lazily: a 10 GB log doesn't load into RAM. `\"w\"` writes (and truncates first!), `\"a\"` appends."),
      code(`with open("scores.txt", "w", encoding="utf-8") as fh:
    fh.write("0.91\\n")            # write() needs the \\n added yourself
    fh.write("0.87\\n")

with open("scores.txt", encoding="utf-8") as fh:
    vals = [float(line) for line in fh]  # iterate lines; float() strips the \\n
vals                               # [0.91, 0.87]`),
      p("`encoding=\"utf-8\"` is cheap insurance against mangled characters on other machines. For paths, `pathlib.Path` beats string surgery: `Path(\"data\") / \"train.csv\"` — the `/` joins path parts (an overloaded operator, not division) — builds a path that works on Windows and Linux alike."),
    ]),
    T("JSON and CSV: the two contest formats", [
      p("Tables live in CSV (pandas reads them — next lesson); configs, annotations and label maps live in **JSON**. `json.dumps` serializes a dict to a string, `json.loads` parses it back; `dump`/`load` do the same with a file object."),
      code(`import json
meta = {"seed": 42, "classes": ["cat", "dog"]}
json.dumps(meta)                 # '{"seed": 42, "classes": ["cat", "dog"]}'
json.loads('{"seed": 42}')       # {'seed': 42}

with open("run.json", "w") as fh:
    json.dump(meta, fh, indent=2)     # pretty-printed into the file`),
      ul([
        "JSON knows only dict/list/str/int/float/bool/None — tuples come back as lists, sets don't serialize at all, NumPy types need `.item()` first.",
        "Pickle/joblib can store arbitrary Python objects (fitted models), but never `pickle.load` a file you didn't create — unpickling executes embedded code.",
      ]),
    ]),
    T("Stdlib helpers worth knowing", [
      code(`from collections import Counter, defaultdict
Counter("mississippi")           # Counter({'i': 4, 's': 4, 'p': 2, 'm': 1})
labels = ["cat", "dog", "cat", "bird", "dog", "cat"]
Counter(labels).most_common(2)   # [('cat', 3), ('dog', 2)] — the top-k answer

groups = defaultdict(list)       # a missing key creates an empty list, no setdefault
groups["a"].append(1)`),
      code(`import math, random, time, itertools
math.log2(8)                     # 3.0 — cross-entropy lives on logs
xs = [3, 1, 2]
random.seed(0); random.shuffle(xs)
itertools.chain([1, 2], [3])     # lazily yields 1, 2, 3 — flatten nested lists
t0 = time.time()                 # time.time() - t0 = a cell's wall-clock seconds`),
      p("`try/except` catches an expected failure and continues — useful when 3 rows in 100 000 are corrupt:"),
      code(`lines = ["0.9", "0.8", "oops", "0.7"]
good, bad = [], 0
for line in lines:
    try:
        good.append(float(line))
    except ValueError:               # catch the SPECIFIC error you expect
        bad += 1
good, bad                        # ([0.9, 0.8, 0.7], 1)`),
      note("A bare `except:` swallows everything, including Ctrl-C and real bugs. Name the exception type and count what you skipped — silent data loss fails submissions quietly."),
    ]),
    T("Defensive habits that save contests", [
      ul([
        "**Assert the contract**: `assert len(pred) == len(test)`, `assert set(pred) <= {0, 1}` (on sets `<=` means 'is a subset of') — fail loudly at the bug, not at the grader.",
        "Print shapes and a `head()` after every transform — 30 seconds of printing catches axis slips and bad merges before they corrupt the model.",
        "Check the trivial case by hand: if your pipeline can't handle 5 samples, it won't handle the dataset.",
        "Restart-and-run-all before trusting a notebook number — stale state is the most common fake result.",
      ]),
    ]),
    Q("Why wrap file access in `with open(...) as fh:`?",
      ["It closes the file automatically, even on error", "It reads the file in parallel threads for speed", "It encrypts the contents as UTF-8", "It is only needed for JSON files"], 0,
      "The with-block guarantees close() on exit — no leaked handles, no half-written files."),
    Q("int(s) fails on one bad line in a loop. Which handler is right?",
      ["except ValueError:", "except:", "except Everything:", "finally:"], 0,
      "Catch the specific error you expect; a bare except also hides KeyboardInterrupt and real bugs."),
  ]),
  L("NumPy: arrays, axes, broadcasting", 50, [REF.np, REF.cs231npy], [
    T("Creating and reshaping arrays", [
      p("Everything in NumPy is an `ndarray`: one block of memory holding same-typed numbers. Build one from a list with `np.array`, or let NumPy fill it: `np.zeros`, `np.ones`, `np.arange` (like `range`), `np.linspace` (n evenly spaced points, ends included), `np.random.randn` (standard normal). `.dtype` says what each cell holds; `.shape` says how the cells are arranged."),
      code(`import numpy as np

np.array([1, 2, 3])               # dtype int64 — from a Python list
np.zeros((2, 3))                  # 2×3 of float64 zeros
np.arange(0, 10, 2)               # [0 2 4 6 8] — like range, but an array
np.linspace(0, 1, 5)              # [0. 0.25 0.5 0.75 1.] — 5 points, ends INCLUDED
np.random.randn(3)                # 3 standard-normal samples`),
      p("`.reshape(r, c)` rewraps the same numbers into a new shape — it copies nothing and reorders nothing. `-1` means \"work this dimension out yourself\". `.T` transposes (swaps axes); `.ravel()` flattens to 1-D:"),
      code(`a = np.arange(12)              # [0..11], shape (12,)
a.reshape(3, 4)                  # 3 rows × 4 columns
a.reshape(3, -1)                 # same thing — -1 infers the 4
a.reshape(3, 4).T.shape          # (4, 3)
a.reshape(2, 2, 3).ravel()       # back to (12,)`),
      ul([
        "`np.array([[1, 2], [3]])` fails or makes an object array: rows must have equal length — an ndarray is a box, not a list of lists.",
        "`np.arange(0, 1, 0.1)` can surprise you (0.1 isn't exact in binary); when you know the point count, `linspace` is safer.",
        "float64 is the default and costs 8 bytes per number; images and neural nets usually want float32 — pass `dtype=\"float32\"` at creation.",
      ]),
    ]),
    T("Axes and shape algebra", [
      p("`ndarray.shape` is a tuple of dimension sizes: a table with 3 rows and 4 columns has shape `(3, 4)`; axis 0 runs **down** the rows, axis 1 runs **across** the columns. `arr.mean(axis=k)` collapses dimension k — \"average along that direction\" — and removes it from the shape. `axis=0` on the table gives 4 column means, `axis=1` gives 3 row means. `keepdims=True` leaves a size-1 axis in its place instead of deleting it."),
      f("(32, 64, 64, 3).mean(axis=0)  →  (64, 64, 3)   (batch of images → per-pixel mean)"),
      f("(3, 4).mean(axis=1, keepdims=True)  →  (3, 1)   (reusable in broadcasting)"),
      p("IOAI (the International Olympiad in Artificial Intelligence) relevance: metrics, normalization and aggregation are all axis reductions — per-sample losses reduce over the feature axis, per-class statistics over the sample axis, per-channel means over the batch axis. A wrong axis is the most common silent bug in contest notebooks: the code runs, the numbers are wrong."),
    ]),
    T("Vectorized reductions", [
      code(`import numpy as np

X = np.random.randn(1000, 5)              # 1000 random samples, 5 features (randn draws standard-normals)

mu = X.mean(axis=0)                       # (5,) — per-feature mean
sd = X.std(axis=0) + 1e-8                 # (5,) — epsilon guards zero variance
X_std = (X - mu) / sd                     # (1000, 5) — "z-score": (value − mean) / std per column

row_sums = X.sum(axis=1, keepdims=True)   # (1000, 1)
X_norm = X / row_sums                     # each row sums to 1`),
      p("**Execution pitfalls**"),
      ul([
        "`X.sum(axis=1)` has shape `(1000,)`, and `X / X.sum(axis=1)` raises `ValueError` — NumPy cannot line a length-1000 vector up with the 5 columns (the rule is explained in the next step). `keepdims=True` keeps the shape `(1000, 1)`, one number per row, which divides cleanly.",
        "`X[mask]` picks the rows where a boolean mask is True; `.mean()` on an empty selection returns `nan` (not-a-number) with a RuntimeWarning — check `mask.any()` first, or the NaN contaminates every downstream feature.",
        "`sd == 0` on a constant column → `inf`/`nan`. Add epsilon before dividing, never after.",
      ]),
    ]),
    Q("X has shape (100, 3): 100 samples, 3 features. What does X.mean(axis=1) return?",
      ["The mean of each sample — shape (100,)", "The mean of each feature — shape (3,)", "The global mean — a scalar", "An error: axis out of bounds"], 0,
      "axis=1 reduces across the 3 features, leaving one value per sample. Per-feature mean is axis=0."),
    T("Broadcasting rules", [
      p("Binary ops align shapes **from the right**. For each dimension pair: the sizes must be equal, or one must be 1 (it stretches), or one must be missing (it becomes 1, then stretches). Anything else is a `ValueError`."),
      p("Try it on the figure's example, `(3,1) + (1,4)`: right-align the shapes and check each pair — 3 vs 1, the 1 stretches to 3; 1 vs 4, the 1 stretches to 4 — result `(3,4)`. The failure mode: `(6,) + (7,8)` right-aligns the 6 under the 8, and 6 ≠ 8 with no 1 to stretch → `ValueError`. A missing dim counts as 1: `(3,4) + (4,)` reads the vector as `(1,4)` and stretches it over all 3 rows."),
      fig("broadcast"),
      code(`import numpy as np      # shapes, not values — check .shape of each result
(np.zeros((8, 1, 6)) + np.zeros((7, 1))).shape   # (8, 7, 6)
(np.zeros((3, 4)) - np.zeros((4,))).shape        # (3, 4)  row vector applied to every row
(np.zeros((3, 4)) - np.zeros((3, 1))).shape      # (3, 4)  column applied to every column
(np.zeros((3,)) + np.zeros((3, 1))).shape        # (3, 3)  every element meets every element — a common accident`),
      p("You insert a size-1 axis with `None` (an alias for `np.newaxis`) inside the brackets. For `v = np.array([1, 2, 3])`: `v[:, None]` is a column of shape `(3, 1)`, `v[None, :]` is a row of shape `(1, 3)`. Subtracting them gives every pair of differences at once:"),
      code(`v = np.array([1, 2, 3])
v[:, None] - v[None, :]
# [[ 0, -1, -2],
#  [ 1,  0, -1],
#  [ 2,  1,  0]]        shape (3, 3): row i, column j holds v[i] − v[j]`),
      p("That one idea — add an axis, let broadcasting pair everything with everything — replaces most double loops in contest code."),
      p("IOAI relevance: feature standardization, distance matrices for k-NN and embedding matching, one-hot masks, scoring every sample against class prototypes — all broadcasting, zero Python loops."),
    ]),
    T("Broadcast patterns that replace loops", [
      p("Pairwise distances between all rows of `A` (n points, d coordinates each) — the same trick as above, one axis up:"),
      code(`A = np.random.randn(100, 3)             # 100 points in 3-D
diff = A[:, None, :] - A[None, :, :]     # (100, 1, 3) − (1, 100, 3) → (100, 100, 3): every pair
D = np.sqrt((diff ** 2).sum(axis=-1))    # axis=-1 = the last axis (the 3 coordinates) → (100, 100)`),
      p("**Softmax** turns a row of raw scores (called **logits**) into probabilities: `exp(z) / exp(z).sum()`. Subtracting the row maximum first does not change the result (it cancels in the ratio) but keeps `exp` from overflowing:"),
      code(`logits = np.random.randn(1000, 10)                   # 1000 samples, 10 class scores
z = logits - logits.max(axis=1, keepdims=True)       # (1000, 10) − (1000, 1): largest score becomes 0
e = np.exp(z)
p = e / e.sum(axis=1, keepdims=True)                 # each row sums to 1`),
      p("**Execution pitfalls**"),
      ul([
        "`(n,)` vs `(n, 1)`: subtracting two `(n,)` vectors gives `(n,)`; make one `(n, 1)` and you silently get an `(n, n)` outer result. Print `.shape` before trusting the result.",
        "`A[:, None, :] - A[None, :, :]` allocates `n² · d` numbers — at n = 10 000 points with d = 128 that is 12.8 billion float64s, over 100 GB. Process the rows in chunks of ≈ 1000, or use `scipy.spatial.distance.cdist(A, A)`, which does the chunking for you.",
        "`np.exp(x)` is infinite for x above about 709 — beyond that, exp itself overflows the float64 range. Without the max-subtraction one large logit gives `inf / inf = nan` for the whole row.",
      ]),
    ]),
    Q("A has shape (8, 1, 6) and B has shape (7, 1). What is the shape of A + B?",
      ["(8, 7, 6)", "(8, 1, 6)", "(8, 7, 1)", "ValueError: operands could not be broadcast"], 0,
      "Right-align: 6 vs 1 → 6, 1 vs 7 → 7 (the 1 stretches), 8 vs missing → 8. Result (8, 7, 6)."),
    T("Boolean and fancy indexing", [
      p("`a[mask]` with a boolean array selects elements where the mask is True. `a[idx]` with an integer array gathers elements — the output shape follows `idx`, not `a`. Both return **copies**: the result is a new array, so changing it does not change `a` (plain slices like `a[2:5]` are **views** that share memory)."),
      p("`np.argsort(scores)` returns the indices that would sort `scores` ascending — `argsort([0.2, 0.9, 0.5])` is `[0, 2, 1]`. Sort `-scores` to get descending order, then take the first k indices for the top-k."),
      p("IOAI relevance: thresholding probabilities into predictions, masking corrupt pixels or frames, top-k selection for retrieval metrics, dropping outliers before fitting."),
    ]),
    T("Masks and top-k", [
      code(`prob = np.random.rand(len(X))              # one score per row of X
scores = np.random.rand(len(X), 4)       # 4 candidate scores per row

pred = prob > 0.5                        # boolean mask — one flag per row
X_clean = X[~np.isnan(X).any(axis=1)]    # drop rows containing NaN
X[pred] = 0                              # write through the mask (pred has one flag per row)

top3 = np.argsort(-scores, axis=1)[:, :3]  # top-3 column indices per row
label = np.where(prob > 0.5, 1, 0)         # element-wise select`),
      p("**Execution pitfalls**"),
      ul([
        "Combine masks with `&`, `|`, `~` — never `and`/`or`/`not` (they raise `ValueError: truth value of an array is ambiguous`). Parenthesize each condition: `(a > 0) & (b < 1)`.",
        "`a[idx] = v` mutates `a`, but `b = a[idx]; b[0] = 9` mutates a copy — `a` is unchanged. Chained `a[mask][:, 2] = v` silently does nothing.",
        "`argsort` returns indices that would sort the array; negate the scores for descending order. `[:, :k]` off-by-one is the classic top-k bug.",
      ]),
      note("Train this in the **Tensor Puzzles** tab: 21 puzzles where you rebuild NumPy ops (sum, cumsum, bincount…) in one line using only broadcasting, indexing and `where`."),
    ]),
    Q("p = np.array([0.7, 0.2, 0.9]); p[p > 0.5] = 1. What is p now?",
      ["[1.0, 0.2, 1.0]", "[1.0, 0.0, 1.0]", "[1, 0, 1]", "ValueError: cannot assign"], 0,
      "The mask selects positions 0 and 2; assignment writes through it. The masked-out element keeps its value."),
  ]),
  L("pandas: loading, cleaning, grouping", 35, [REF.pd], [
    T("First look at a dataset", [
      p("A DataFrame is a table with named, typed columns — think of a sheet where every column has a name and a dtype. These calls fit on one screen and should run before anything else:"),
      code(`import pandas as pd
df = pd.read_csv("train.csv")
df.shape                       # (rows, columns)
df.dtypes                      # dtype per column — watch for "object" that should be numbers
df.head()                      # first 5 rows
df.describe()                  # min/mean/max/quantiles of numeric columns
df.isna().mean()               # share of missing values per column
df["target"].value_counts()    # class balance — is one class 90% of the data?`),
      p("Two more for the toolbox: `df.info()` (memory use and non-null counts per column) and `df.sample(5)` (random rows — `head()` can hide weirdness that sorted to the bottom of the file)."),
    ]),
    T("Selecting rows and columns", [
      p("`df[col]` picks one column, `df[[c1, c2]]` several. `df[mask]` filters rows by a boolean Series. `.loc[rows, cols]` does both by **label** (column names are labels); `.iloc[i, j]` does both by **position**."),
      code(`df[df.age > 18]                                  # rows where age > 18
df[(df.age > 18) & (df.city == "Almaty")]        # & not and; each condition in ()
df.loc[df.city == "Almaty", ["age", "income"]]   # those rows, only those columns
df.iloc[:5, :3]                                  # first 5 rows, first 3 columns, by position
df[df.city.isin(["A", "B"])]                     # membership test
df.nlargest(10, "income")                        # top-10 rows by a column`),
      ul([
        "A filtered result is a copy: `df[df.x > 0][\"y\"] = 1` may warn (SettingWithCopy) and silently write nothing back. Use `df.loc[df.x > 0, \"y\"] = 1`.",
        "`df[\"a\"]` on a missing column raises KeyError; `df.a` fails silently when `a` collides with a method name — brackets are safer.",
      ]),
    ]),
    T("Cleaning: NaNs, dtypes, duplicates", [
      p("Real contest data is dirty. `isna()`/`notna()` find holes, `fillna` patches them, `dropna` deletes rows (`axis=1` deletes columns), `astype` converts dtypes, `drop_duplicates` removes repeats, and the `.str` accessor vectorizes string methods over a whole column."),
      code(`df["age"] = df["age"].fillna(df["age"].median())   # median, not mean — robust to outliers
df = df.dropna(subset=["target"])                   # rows missing the label are useless
df["price"] = df["price"].astype("float32")
df = df.drop_duplicates(subset=["user_id"], keep="last")
df["city"] = df["city"].str.strip().str.lower()     # " Almaty " → "almaty" for every row`),
      p("**Why median for NaNs**: a feature with a fat right tail drags the mean toward its outliers; the median sits at the 50th percentile regardless. Even better in contests: add an `age_missing` indicator column — \"was missing\" is often itself a signal."),
      ul([
        "`isna()` won't catch `\"N/A\"` or `\"?\"` strings — scan `.unique()` (or `value_counts`) before trusting the NaN count.",
        "`dropna()` with no arguments drops any row containing any NaN — on wide tables that can delete most of the data.",
        "Duplicate rows across the train/validation boundary are **leakage** (information from the answer — or from future data — sneaking into the features) — dedupe **before** splitting.",
      ]),
    ]),
    T("Grouping and joining", [
      code(`df.groupby("city")["income"].agg(["mean", "count"])   # summary table: one row per city
df = df.merge(users, on="user_id", how="left")   # users: a second table keyed by user_id
X = pd.get_dummies(df, columns=["city"])         # one-hot: one 0/1 column per city`),
      p("Two ways to use a group statistic. `groupby(...).mean()` returns **one row per group** (a summary table). `groupby(...).transform(\"mean\")` returns **one value per original row** — each row gets its own group's mean — so the result lands straight back as a new column:"),
      code(`df.groupby("user_id")["amount"].mean()               # one row per user
df["user_avg"] = df.groupby("user_id")["amount"].transform("mean")   # same length as df
df.pivot_table(index="city", columns="target", values="income", aggfunc="mean")`),
      note("groupby + agg/transform is the main engine of feature engineering: per-user averages, per-category counts and per-window statistics become columns with no loops."),
      ul([
        "After `merge`, always re-check `len(df)` — a duplicated key on the right side silently multiplies rows.",
        "`how=\"inner\"` drops unmatched rows; `\"left\"` keeps them with NaNs. Choose deliberately, then re-check `.isna().mean()`.",
      ]),
    ]),
    Q("Which call shows the share of missing values in each column?",
      ["df.isna().mean()", "df.dropna()", "df.describe()", "df.count()"], 0,
      "isna() returns True/False per cell; the mean of booleans is the fraction of True."),
    Q("You want every transaction row to get that user's average purchase amount. Which call?",
      ["df.groupby('user_id')['amount'].transform('mean')", "df.groupby('user_id').agg({'amount': 'mean'})", "df.sort_values('amount').groupby('user_id').head(1)", "df.pivot_table(index='user_id', values='amount')"], 0,
      "transform returns a result aligned with the original rows; .mean() returns one row per user."),
    Q("df.merge(users, on='uid') doubled the row count. Most likely cause?",
      ["users contains duplicate uid values", "merge always appends new rows", "df's uid column has NaNs", "left join is the default"], 0,
      "A key matching k rows on the right yields k output rows — dedupe or aggregate the right table first."),
  ]),
  L("Visualization: Matplotlib and Seaborn", 35, [REF.mpl, REF.sns], [
    T("Matplotlib: figures and axes", [
      p("Matplotlib is the base plotting library. Use the object-oriented style: create a **figure** with one or more **axes**, and draw on each axes — here *Axes* means one subplot panel, unrelated to NumPy's 'axis' from Lesson 5."),
      code(`import matplotlib.pyplot as plt
fig, axes = plt.subplots(1, 2, figsize=(10, 4))

axes[0].plot(history["train_loss"], label="train")
axes[0].plot(history["val_loss"], label="val")
axes[0].set(xlabel="epoch", ylabel="loss", title="Learning curves")
axes[0].legend()

axes[1].hist(df["age"], bins=30)
axes[1].set_title("Age distribution")
plt.tight_layout(); plt.show()`),
      p("The main plot types: `plot` (lines, learning curves), `scatter` (two variables, embedding vectors — defined properly in M2), `hist` (distribution of one variable), `bar` (counts per category), `imshow` (images, matrices, spectrograms)."),
    ]),
    T("Seaborn: statistical plots from DataFrames", [
      p("Seaborn is built on Matplotlib and works directly with pandas columns. One line gives plots that would take ten in Matplotlib."),
      code(`import seaborn as sns
sns.histplot(data=df, x="income", hue="target", kde=True)   # distribution per class
sns.boxplot(data=df, x="city", y="income")                  # spread + outliers per group
sns.scatterplot(data=df, x="age", y="income", hue="target")
sns.countplot(data=df, x="target")                          # class balance
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap="coolwarm")   # corr: how two columns move together (−1 opposite, +1 same direction)
sns.pairplot(df[["age", "income", "target"]], hue="target")`),
    ]),
    T("Plots every ML project needs", [
      ul([
        "**Target distribution** (countplot / histplot): is the data imbalanced or skewed?",
        "**Feature vs target** (boxplot, histplot with hue): which features separate the classes?",
        "**Correlation heatmap**: redundant features and possible **leakage** — a feature that secretly contains the answer, e.g. an id that encodes the label.",
        "**Learning curves** (train vs validation loss): over- or underfitting?",
        "**Confusion matrix** (heatmap): which classes get confused?",
        "**2-D embedding scatter** (PCA / t-SNE / UMAP coloured by label): do classes form clusters?",
      ]),
      code(`from sklearn.metrics import confusion_matrix
cm = confusion_matrix(y_val, y_pred)
sns.heatmap(cm, annot=True, fmt="d", xticklabels=classes, yticklabels=classes)
plt.xlabel("predicted"); plt.ylabel("true")`),
      note("Look at the data before modelling. A few plots often reveal leakage, outliers or label errors that no model will fix."),
    ]),
    T("Readable figures and saving", [
      p("A figure bound for a report needs axis labels, a title, a legend, and enough resolution. `figsize` is in inches, `dpi` is dots per inch — `figsize=(8, 4), dpi=150` is a good default. `plt.tight_layout()` stops labels from overlapping."),
      code(`fig, ax = plt.subplots(figsize=(8, 4), dpi=150)
ax.plot(history["val_loss"], marker="o", label="val")
ax.set(xlabel="epoch", ylabel="loss", title="Validation loss")
ax.grid(alpha=0.3); ax.legend()
ax.set_yscale("log")             # for losses spanning orders of magnitude
fig.savefig("curve.png", bbox_inches="tight")   # save BEFORE plt.show()`),
      ul([
        "`plt.show()` clears the current figure — `savefig` after `show()` writes an empty PNG.",
        "Log scale hides nothing honestly: if a curve only looks good in log, say so and show the raw curve too.",
        "One message per figure. Two unrelated y-axes on one plot (`twinx`) confuse more than they reveal.",
      ]),
    ]),
    Q("You want to see whether `income` is distributed differently for each class of `target`. Best plot?",
      ["sns.histplot(data=df, x='income', hue='target')", "sns.lineplot(data=df, x='income', y='target')", "sns.heatmap(df[['income', 'target']].corr())", "plt.hist(df['income'], bins=30)"], 0,
      "A histogram per class (hue) compares the distributions directly."),
    Q("Training loss keeps falling while validation loss rises after epoch 10. Which plot shows this?",
      ["Learning curves: train and validation loss vs epoch", "Confusion matrix on the validation set at epoch 10", "Residual plot of predicted vs true values", "Histogram of per-sample validation losses"], 0,
      "Learning curves are the standard way to spot overfitting."),
    Q("In `fig, axes = plt.subplots(2, 3)`, what is `axes`?",
      ["A 2×3 array of Axes objects, one per subplot", "The Figure object containing six panels", "A list of 6 separate Figure objects", "A single Axes that holds all six panels"], 0,
      "subplots returns the figure and a grid of axes; you draw on each one, e.g. axes[0, 1].plot(...)."),
  ]),
  L("PyTorch: tensors, autograd, GPU", 35, [REF.pt, REF.d2l], [
    T("Tensors and gradients", [
      p("A **tensor** is a NumPy array that can also live on a **GPU** (the graphics card — thousands of small cores that multiply matrices far faster than the CPU; PyTorch calls it `\"cuda\"`). Why PyTorch and not NumPy? Because training a network means adjusting millions of numbers to make a **loss** — a number measuring how wrong the model's output is — smaller, and for that you need the **gradient**: for each number, how much the loss changes if you nudge that number up a little. PyTorch computes gradients for you."),
      code(`import torch
x = torch.tensor([2.0, 3.0], requires_grad=True)   # "track x: I will ask for gradients later"
y = (x ** 2).sum()      # y = x1² + x2²  = 4 + 9 = 13
y.backward()            # fill in dy/dx for every tracked tensor
x.grad                  # tensor([4., 6.])`),
      p("Check it by hand: nudge x1 from 2.0 to 2.01 and y goes from 13 to 13.0401 — about 0.04 for a 0.01 nudge, a slope of 4. That slope is `x.grad[0]`. For y = x² the slope is 2x, so x.grad is `2 * x` = `[4, 6]`. For y = 3·x the slope is 3 everywhere."),
      p("`requires_grad=True` tells PyTorch to **record** every operation applied to `x`. `backward()` walks that record backwards, multiplying the slopes of each step (that is all the **chain rule** is), and stores the result in `.grad`. Every neural network is trained this way: compute loss, `backward()`, nudge each weight against its gradient."),
    ]),
    T("Tensor ops: dtype, shape, NumPy bridge", [
      p("Torch mirrors the NumPy API: `torch.zeros`, `torch.randn`, `torch.arange`, boolean masks, broadcasting — nearly the whole NumPy lesson applies. The differences that matter: dtype defaults to `float32`, devices must match (`cpu` vs `cuda`), and a tensor may carry a gradient."),
      code(`import torch
t = torch.tensor([1, 2, 3], dtype=torch.float32)
torch.randn(4, 4)                      # standard normal, float32
t.reshape(3, 1); t.unsqueeze(0)        # (3,1) and (1,3) — like [:, None] / [None, :]
t.reshape(3, 1).squeeze()              # (3,) — drop all size-1 axes`),
      p("The bridge back to NumPy: `t.numpy()` shares memory with a CPU tensor, `t.cpu().numpy()` copies off the GPU first. `t.item()` extracts a Python scalar from a size-1 tensor — that is how you print a loss. `t.detach()` cuts a tensor out of the gradient graph without touching its values."),
      code(`loss_t = torch.tensor(0.42)
loss_t.item()                    # 0.4199999... — a plain Python float
g = torch.randn(2, requires_grad=True)
g.detach().numpy()               # OK — no grad tracking on the NumPy side
# g.numpy()                      # RuntimeError: requires_grad → detach first`),
      ul([
        "`view` shares memory and needs a compatible layout; `reshape` copies when it has to — use `reshape` unless microseconds matter.",
        "`torch.tensor(existing_tensor)` copies but drops the gradient link — `t.clone().detach()` says what you mean.",
        "`(64,)` and `(64, 1)` broadcast to `(64, 64)` exactly like NumPy — squeeze labels before comparing with argmax output.",
      ]),
    ]),
    T("Devices, Dataset, DataLoader", [
      p("Training rarely feeds the whole dataset at once. A **DataLoader** hands out the data in **batches** — here 64 samples at a time — in a shuffled order each **epoch** (one pass over the data), so every step of training sees a different small slice. `TensorDataset` just pairs the inputs `X` with the labels `y` so the loader can yield them together."),
      code(`import torch
import torch.nn as nn   # "import torch.nn as nn" alone does NOT bind the name torch
device = "cuda" if torch.cuda.is_available() else "cpu"
model = nn.Linear(2, 2).to(device)         # Linear(in, out): a weighted sum per output —
                                           # inputs × learned weights + bias; weights are
                                           # what training adjusts. .to(device) → GPU

import numpy as np
from torch.utils.data import TensorDataset, DataLoader
y = df["target"].to_numpy()                        # df comes from the pandas lesson
X = df[["age", "income"]]                          # the numeric feature columns — the answer stays out
X_t = torch.tensor(np.asarray(X, dtype="float32"))  # np.asarray unwraps a DataFrame/list to ndarray; float32 is PyTorch's default
y_t = torch.tensor(np.asarray(y))
ds = TensorDataset(X_t, y_t)                # pairs row i of X with label i
dl = DataLoader(ds, batch_size=64, shuffle=True)
for xb, yb in dl:                           # xb: (64, 2), yb: (64,)
    xb, yb = xb.to(device), yb.to(device)   # move each batch to where the model is`),
      p("Why `float32`? NumPy makes float64 by default, PyTorch models use float32, and mixing them raises a dtype error — convert once, at the boundary."),
      note("The model and the data must be on the same device. \"Expected all tensors to be on the same device\" is the most common runtime error."),
    ]),
    T("Saving and loading", [
      p("Save the **state_dict** — an ordered dict of the parameter tensors — not the whole model object. To load, rebuild the architecture first, then `load_state_dict` fills the weights in. `map_location` lets a GPU-trained checkpoint load on a CPU-only machine."),
      code(`torch.save(model.state_dict(), "model.pt")           # save
model2 = nn.Linear(2, 2)                              # rebuild the architecture
model2.load_state_dict(torch.load("model.pt", map_location="cpu"))
model2.eval()                                         # weights restored — inference mode`),
      note("For mid-training checkpoints also save the optimizer state and epoch: `torch.save({\"model\": model.state_dict(), \"opt\": opt.state_dict(), \"epoch\": e}, \"ckpt.pt\")`. Resuming without the optimizer state starts Adam's momentum buffers empty — a slightly different run."),
    ]),
    T("Training mode vs inference mode", [
      p("Two separate switches are flipped when you stop training and start predicting."),
      ul([
        "`model.eval()` changes how some **layers behave**: dropout stops dropping, BatchNorm uses its running averages instead of batch statistics (both defined in AI1). `model.train()` switches back.",
        "`torch.no_grad()` tells **autograd** to stop recording operations. No graph is built, so memory drops and the forward pass is faster. It does not change what the layers compute.",
      ]),
      code(`import torch
model.eval()
with torch.no_grad():
    scores = model(xb)          # (64, n_classes): one score per class per sample
    preds = scores.argmax(1)    # index of the largest score in each row = predicted class`),
      p("Forgetting `eval()` gives noisy predictions (dropout still active); forgetting `no_grad()` wastes memory and can run out of GPU memory on large test sets."),
    ]),
    Q("x has shape (5,). After y = (3 * x).sum() and y.backward(), what is x.grad?",
      ["Five 3s", "Five 1s", "The number 15", "None"], 0,
      "dy/dxᵢ = 3 for every element."),
    Q("Why use model.eval() and torch.no_grad() at inference?",
      ["eval() puts dropout/BatchNorm in inference mode; no_grad() turns off gradient tracking",
       "eval() freezes the weights so they cannot change; no_grad() makes the forward pass deterministic", "eval() moves the model to the GPU for faster inference; no_grad() frees the optimizer state", "eval() reloads the saved checkpoint; no_grad() pins the model to the CPU"], 0,
      "Two separate things: how layers behave (eval) and whether autograd records operations (no_grad)."),
  ]),
  L("Contest workflow and reproducibility", 30, [REF.ioai], [
    T("Read the task like a lawyer", [
      ul([
        "**Metric first**: F1 vs accuracy vs log-loss change which model wins. Optimize the leaderboard metric, not a convenient one.",
        "**Submission format**: column names, row order, id field, probability vs hard class. One wrong header and a perfect model scores zero.",
        "**Limits**: wall-clock time, RAM, no internet, allowed libraries, whether the jury re-runs your notebook.",
        "**Forbidden**: external data, pretrained weights, hand-labelling test rows, multiple accounts.",
      ]),
      note("Print the sample submission and make yours `diff`-clean against it: same columns, same order, same index. Check `submission.shape` and `submission.columns` before uploading."),
    ]),
    T("Baseline first, then one change at a time", [
      ul([
        "Make a trivial valid submission first (constant prediction or the given baseline). It exercises the whole pipeline — if the plumbing is broken, you find out in 10 minutes, not on the last day.",
        "Build a **validation** set — a held-out slice of train that stands in for the hidden test — and mirror its split logic (by user, by time). Trust it more than the public leaderboard.",
        "Change one thing at a time and log the score of every experiment — the next step makes that a habit.",
      ]),
    ]),
    T("Keep an experiment log", [
      p("After run 10 you will not remember what run 3 did. A log is one row per experiment: what changed, validation score, seed, runtime. A list of dicts is enough — the discipline matters more than the tool."),
      code(`import pandas as pd
log = []
def record(name, val_score, **cfg):       # **cfg collects extra keyword arguments into a dict
    log.append({"name": name, "val": val_score, **cfg})   # **cfg spreads them into the new dict

record("baseline",   0.812, model="logreg")
record("more trees", 0.851, model="rf", n=500)
pd.DataFrame(log).sort_values("val", ascending=False)`),
      p("The log turns \"I think deeper trees helped\" into a lookup — and it stops you re-tuning a knob you already swept."),
    ]),
    T("Reproducibility", [
      code(`import random, numpy as np, torch
def seed_all(s=42):
    # Python, NumPy and PyTorch each keep a separate random generator —
    # seeding one does not seed the others, so all three calls are needed
    random.seed(s); np.random.seed(s)
    torch.manual_seed(s); torch.cuda.manual_seed_all(s)
seed_all()`),
      p("Juries re-run notebooks. Fix seeds, note your `sklearn`/`torch` versions, and replace hard-coded local paths with relative ones (`Path(\"data\") / \"train.csv\"`, not `C:\\Users\\you\\...`). Time one full top-to-bottom run against the limit."),
      p("GPUs are not bit-deterministic — expect small numerical drift across hardware and leave margin in your score. If two runs with the same seed disagree wildly, you have hidden randomness: an unseeded shuffle, `set` iteration order, or `drop_last`-style nondeterminism in a loader."),
    ]),
    Q("Your validation score improves but the leaderboard score drops. Most likely cause?",
      ["Validation doesn't match the test distribution, or it leaks", "The GPU gives slightly different numerical results on the test set", "The leaderboard metric weights errors differently than the local one", "The submission file was uploaded with rows in the wrong order"], 0,
      "Validation must be built the way the test was built (grouped by user, split by time, etc.)."),
    Q("A notebook gives a great score but fails when re-run fresh top-to-bottom. Cause?",
      ["Stale state from cells run out of order earlier", "The GPU produced luckier randomness the first time", "The metric used a different random seed by default", "Restarting cleared the model's weight cache"], 0,
      "Notebooks keep variables from deleted or edited cells; only a fresh-kernel run proves the result is real."),
  ]),
];

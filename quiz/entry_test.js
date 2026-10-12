/* Entry test — Yandex-Practicum-style "входной тест" (diagnostic).
   Consumed by entrytest.js as global ENTRY_TEST.
   Each item: { area: "python"|"numpy"|"ml"|"math", level: 1..3,
                q, options[4], answer (correct index), explain }
   24 items: 8 python · 6 numpy · 6 ml · 4 math
   levels: 10 × L1 (basic) · 9 × L2 (solid) · 5 × L3 (olympiad-ready) */

const ENTRY_TEST = [
  /* ------------------------------ Python (8) ------------------------------ */
  { area: "python", level: 1, answer: 0,
    q: "What does this print?\n```\nx = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))\n```",
    options: ["4", "3", "2", "raises TypeError"],
    explain: "`y = x` binds a second name to the **same** list object — it does not copy — so appending through `y` grows `x` too." },

  { area: "python", level: 1, answer: 1,
    q: "What does `print(7 // 2, 7 % 2)` output?",
    options: ["4 1", "3 1", "3.5 1", "3 0"],
    explain: "`//` is floor division (7 // 2 = 3) and `%` is the remainder (7 % 2 = 1); both stay `int`." },

  { area: "python", level: 1, answer: 2,
    q: "What is `\"python\"[::-1]`?",
    options: ["'python'", "SyntaxError", "'nohtyp'", "'pytho'"],
    explain: "A slice step of −1 walks the string backwards, producing the reversed string." },

  { area: "python", level: 1, answer: 3,
    q: "`d = {'a': 1}` — what does `d.get('b', 0)` return?",
    options: ["None", "raises KeyError", "'b'", "0"],
    explain: "`.get` returns the supplied default when the key is missing; `d['b']` would raise `KeyError`." },

  { area: "python", level: 2, answer: 1,
    q: "What does this print?\n```\na = [1, 2, 3]\nb = a[:]\nb.append(9)\nprint(len(a))\n```",
    options: ["4", "3", "2", "raises TypeError"],
    explain: "`a[:]` makes a shallow copy, so `b` is a different object — appending to it leaves `a` at length 3." },

  { area: "python", level: 2, answer: 2,
    q: "What is `[i*i for i in range(5) if i % 2]`?",
    options: ["[0, 1, 4, 9, 16]", "[0, 4, 16]", "[1, 9]", "[1, 4, 9]"],
    explain: "`i % 2` is truthy only for odd `i` (1 and 3), so the squares kept are 1 and 9." },

  { area: "python", level: 3, answer: 3,
    q: "What does this print?\n```\ndef add(x, lst=[]):\n    lst.append(x)\n    return lst\n\nprint(len(add(1)), len(add(2)))\n```",
    options: ["1 1", "2 2", "raises TypeError", "1 2"],
    explain: "The default `[]` is created **once** at `def` time and shared across calls — the classic mutable-default-argument gotcha." },

  { area: "python", level: 3, answer: 0,
    q: "What does this print?\n```\nfs = [lambda: i for i in range(3)]\nprint([f() for f in fs])\n```",
    options: ["[2, 2, 2]", "[0, 1, 2]", "[0, 0, 0]", "raises NameError"],
    explain: "All three lambdas close over the **same** loop variable `i`, which is 2 when they run. Fix: `lambda i=i: i`." },

  /* ------------------------------ NumPy (6) ------------------------------- */
  { area: "numpy", level: 1, answer: 2,
    q: "What is `np.array([1, 2, 3]) + np.array([10, 20, 30])`?",
    options: ["array([1, 2, 3, 10, 20, 30])", "60", "array([11, 22, 33])", "ValueError"],
    explain: "`+` on arrays is elementwise: [1+10, 2+20, 3+30]. Concatenation would need `np.concatenate`." },

  { area: "numpy", level: 1, answer: 3,
    q: "What does this print?\n```\na = np.arange(6).reshape(2, 3)\nprint(a[1, 2])\n```",
    options: ["4", "2", "[3 4 5]", "5"],
    explain: "`arange(6)` is [0…5]; row 1 is [3, 4, 5], so column 2 gives 5." },

  { area: "numpy", level: 2, answer: 0,
    q: "What does this print?\n```\na = np.zeros((3, 4))\nb = np.arange(4)\nprint((a + b).shape)\n```",
    options: ["(3, 4)", "(4,)", "(3,)", "ValueError: operands could not be broadcast"],
    explain: "`b` of shape (4,) broadcasts across the 3 rows because the trailing dimension matches — result keeps (3, 4)." },

  { area: "numpy", level: 2, answer: 1,
    q: "What does this print?\n```\na = np.arange(5)\nb = a[1:4]\nb[0] = 99\nprint(a)\n```",
    options: ["[0 1 2 3 4]", "[ 0 99  2  3  4]", "[99  1  2  3  4]", "raises IndexError"],
    explain: "Basic slicing returns a **view** sharing memory with `a`, so writing through `b` mutates `a`. Use `a[1:4].copy()` to detach." },

  { area: "numpy", level: 2, answer: 2,
    q: "What does this print?\n```\na = np.arange(6)\nprint(a[a % 2 == 0])\n```",
    options: ["[1 3 5]", "[True False True False True False]", "[0 2 4]", "[0 0 0]"],
    explain: "The boolean mask keeps elements at positions where `a % 2 == 0` — the even values 0, 2, 4." },

  { area: "numpy", level: 3, answer: 3,
    q: "What does this print?\n```\na = np.array([[1, 2],\n              [3, 4],\n              [5, 6]])\nprint(a[[0, 1], [1, 0]])\n```",
    options: ["[[2 1]\\n [4 3]]", "[[1 2]\\n [3 4]]", "[1 4]", "[2 3]"],
    explain: "Parallel fancy index arrays select element **pairs** (0,1) and (1,0) → a[0,1]=2 and a[1,0]=3. A submatrix would need `np.ix_`." },

  /* ------------------------------- ML (6) --------------------------------- */
  { area: "ml", level: 1, answer: 0,
    q: "A model scores 99% accuracy on its training set and 55% on held-out data. This is called:",
    options: ["overfitting", "underfitting", "data leakage", "good generalization"],
    explain: "A large train–test gap means the model memorized the training data instead of learning patterns that transfer." },

  { area: "ml", level: 2, answer: 2,
    q: "A spam filter flags 100 emails as spam; 80 truly are spam and 20 are legitimate. Its precision is:",
    options: ["0.20", "1.00", "0.80", "cannot be computed from this alone"],
    explain: "Precision = TP/(TP+FP) = 80/100 = 0.80 — the share of flagged items that are correct. (Recall would need the total spam count.)" },

  { area: "ml", level: 1, answer: 1,
    q: "Why keep a held-out test set at all?",
    options: ["to make training faster on large data", "to estimate performance on unseen data", "to tune the hyperparameters on it", "to enlarge the training set later on"],
    explain: "The test set simulates unseen data for an unbiased final estimate; hyperparameter tuning belongs on a separate validation split." },

  { area: "ml", level: 2, answer: 3,
    q: "What is wrong with this pipeline?\n```\nscaler = StandardScaler().fit(X_all)\nX_tr, X_te = train_test_split(scaler.transform(X_all))\n```",
    options: ["nothing — scaling never changes the score anyway", "the split only matters for deep learning pipelines", "StandardScaler throws when it is applied before a split", "the scaler saw the test data when it was fit"],
    explain: "Fitting on `X_all` leaks test-set mean/variance into training. Correct order: split first, then `fit` the scaler on the train part only." },

  { area: "ml", level: 2, answer: 1,
    q: "A classifier gives TP = 80, FP = 20, FN = 40. Its recall is:",
    options: ["0.80", "0.67", "0.60", "0.40"],
    explain: "Recall = TP/(TP+FN) = 80/120 ≈ 0.67 — the fraction of actual positives the model caught." },

  { area: "ml", level: 3, answer: 0,
    q: "Your model badly overfits: huge train–test gap. Which change will **NOT** help?",
    options: ["adding a second hidden layer", "adding dropout to every layer", "collecting a larger and more diverse training set", "increasing the weight-decay penalty"],
    explain: "More capacity makes memorization easier. Dropout, weight decay and extra data all shrink the variance gap." },

  /* ------------------------------- Math (4) ------------------------------- */
  { area: "math", level: 1, answer: 0,
    q: "Expected value of one roll of a fair six-sided die:",
    options: ["3.5", "3", "6", "1/6"],
    explain: "E[X] = (1+2+3+4+5+6)/6 = 21/6 = 3.5 — the expectation need not be an achievable outcome." },

  { area: "math", level: 1, answer: 1,
    q: "For u = [1, 2, 3] and v = [4, 5, 6], the dot product u·v equals:",
    options: ["[4, 10, 18]", "32", "[4, 5, 6]", "21"],
    explain: "u·v = 1·4 + 2·5 + 3·6 = 4 + 10 + 18 = 32 — a scalar, not a vector." },

  { area: "math", level: 2, answer: 2,
    q: "With A = [[1, 2], [3, 4]] and b = [1, 1], the product A·b is:",
    options: ["[1, 2]", "[4, 6]", "[3, 7]", "[5, 5]"],
    explain: "Each output row is a dot product: 1·1+2·1 = 3 and 3·1+4·1 = 7." },

  { area: "math", level: 3, answer: 3,
    q: "A disease has 1% prevalence. A test detects 99% of true cases and gives false positives to 5% of healthy people. A random person tests positive — what is P(disease | positive)?",
    options: ["0.99", "0.95", "0.50", "0.17"],
    explain: "Bayes: 0.01·0.99 / (0.01·0.99 + 0.99·0.05) = 0.0099 / 0.0594 ≈ 0.167 — the low base rate dominates." },
];

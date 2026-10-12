/* Exercises for M0 — Toolbox & Submission Craft.
   This file is the worked example of the exercise format (see exercises/engine.js). */

EXERCISES.push(
{
  id: "m00-clip-outliers",
  module: "M0",
  title: "Clip outliers to quantiles",
  diff: 1, minutes: 8,
  theory: "Outlier clipping is a common first step for numeric columns: extreme values distort scaling and can dominate the loss. `np.quantile(x, q)` returns the q-quantile; `np.clip(x, lo, hi)` bounds values.",
  prompt: "Implement `clip_outliers(x, q)`: clip the array to its `q`- and `(1-q)`-quantiles.\n\n```\nx = [0, 1, 2, 100], q = 0.25  →  clip to [0.75, 26.5]\n```",
  hint: "lo, hi = np.quantile(x, q), np.quantile(x, 1 - q); then np.clip(x, lo, hi).",
  starter:
`def clip_outliers(x, q):
    x = np.asarray(x, dtype=float)
    # your code
    return x`,
  entry: "clip_outliers",
  gen:
`def gen(rng):
    n = int(rng.integers(10, 60))
    x = rng.normal(0, 1, n)
    x[rng.integers(0, n)] = 100          # inject an outlier
    return {"x": x, "q": float(rng.choice([0.01, 0.05, 0.1, 0.25]))}`,
  solve:
`def clip_outliers(x, q):
    x = np.asarray(x, dtype=float)
    lo, hi = np.quantile(x, q), np.quantile(x, 1 - q)
    return np.clip(x, lo, hi)`
},
{
  id: "m00-minmax",
  module: "M0",
  title: "Min-max scale columns",
  diff: 1, minutes: 8,
  theory: "Min-max scaling maps every column to [0, 1]: (x − min) / (max − min). Constant columns need a guard: max − min is 0, so the division produces NaN. The convention here is to map them to 0.",
  prompt: "Implement `minmax(X)` for a 2-D matrix: scale each **column** to [0, 1]. If a column is constant, return zeros for it.",
  hint: "Use axis=0 reductions with keepdims=True for broadcasting. Guard with np.where on (max − min) == 0 — or better, compute the denom with np.where(denom == 0, 1, denom) so you never divide by zero.",
  starter:
`def minmax(X):
    X = np.asarray(X, dtype=float)
    # your code
    return X`,
  entry: "minmax",
  gen:
`def gen(rng):
    X = rng.integers(-10, 11, size=(int(rng.integers(4, 9)), int(rng.integers(2, 6)))).astype(float)
    if rng.random() < 0.4:
        X[:, int(rng.integers(0, X.shape[1]))] = 3.0   # constant column
    return {"X": X}`,
  solve:
`def minmax(X):
    X = np.asarray(X, dtype=float)
    lo, hi = X.min(0, keepdims=True), X.max(0, keepdims=True)
    d = hi - lo
    return np.where(d == 0, 0.0, (X - lo) / np.where(d == 0, 1.0, d))`
},
{
  id: "m00-accuracy",
  module: "M0",
  title: "Accuracy from labels",
  diff: 1, minutes: 6,
  theory: "Scoring functions in olympiads are usually one line of NumPy. Accuracy = fraction of equal predictions. Writing it yourself — without sklearn — is a 30-second task you must be able to do under time pressure.",
  prompt: "Implement `accuracy(y_true, y_pred)` → fraction of positions where they are equal.",
  hint: "(np.asarray(y_true) == np.asarray(y_pred)).mean()",
  starter:
`def accuracy(y_true, y_pred):
    # your code
    return 0.0`,
  entry: "accuracy",
  gen:
`def gen(rng):
    n = int(rng.integers(5, 40)); k = int(rng.integers(2, 6))
    return {"y_true": rng.integers(0, k, n), "y_pred": rng.integers(0, k, n)}`,
  solve:
`def accuracy(y_true, y_pred):
    return float((np.asarray(y_true) == np.asarray(y_pred)).mean())`
},
{
  id: "m00-onehot",
  module: "M0",
  title: "One-hot encode labels",
  diff: 1, minutes: 8,
  theory: "One-hot encoding turns a label vector into an (n, k) matrix of 0/1. One-line version: `np.eye(k)[y]` indexes the identity matrix by the labels. You will reuse this constantly.",
  prompt: "Implement `one_hot(y, k)` → (n, k) float array, 1 at the label index.",
  hint: "np.eye(k)[y] does it in one line.",
  starter:
`def one_hot(y, k):
    # your code
    return np.zeros((len(y), k))`,
  entry: "one_hot",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 30)); k = int(rng.integers(2, 7))
    hi = k - 1 if rng.random() < 0.35 else k   # sometimes class k-1 absent -> k must come from the arg
    return {"y": rng.integers(0, hi, n), "k": k}`,
  solve:
`def one_hot(y, k):
    return np.eye(k)[np.asarray(y)]`
},
{
  id: "m00-chunks",
  module: "M0",
  title: "Split into batches",
  diff: 2, minutes: 10,
  theory: "Mini-batching is how every olympiad notebook iterates data. `np.array_split` handles the ragged last batch for you — implement it once by hand so you understand the indexing.",
  prompt: "Implement `batches(n, bs)` → list of `(start, end)` index pairs covering `0..n` in chunks of at most `bs`. Example: `batches(10, 4)` → `[(0,4),(4,8),(8,10)]`.",
  hint: "list(range(0, n, bs)) gives the starts; each end is min(start + bs, n).",
  starter:
`def batches(n, bs):
    # your code
    return []`,
  entry: "batches",
  gen:
`def gen(rng):
    return {"n": int(rng.integers(1, 60)), "bs": int(rng.integers(1, 12))}`,
  solve:
`def batches(n, bs):
    return [(s, min(s + bs, n)) for s in range(0, n, bs)]`
},
{
  id: "m00-topk",
  module: "M0",
  title: "Top-k indices by score",
  diff: 2, minutes: 10,
  theory: "Retrieval and ranking tasks (semantic search, KNN, RAG) all end with 'take the k highest scores'. `np.argsort(-s)[:k]` is the idiom — know it cold, including the sign flip for descending order.",
  prompt: "Implement `topk(scores, k)` → indices of the `k` largest scores, in decreasing order. Ties may be returned in any order.",
  hint: "np.argsort sorts ascending; negate the scores, or sort then [::-1].",
  starter:
`def topk(scores, k):
    # your code
    return []`,
  entry: "topk",
  gen:
`def gen(rng):
    n = int(rng.integers(5, 30))
    return {"scores": rng.normal(0, 1, n), "k": int(rng.integers(1, n))}`,
  solve:
`def topk(scores, k):
    return np.argsort(-np.asarray(scores))[:k]`
},
{
  id: "m00-readsubmission",
  module: "M0",
  title: "Build a submission dict",
  diff: 1, minutes: 8,
  theory: "Most olympiad submissions are 'id → prediction' mappings saved as CSV/JSON. Zipping two arrays into a dict sounds trivial — doing it fast and correctly (right order, right types, no off-by-one) under contest pressure is a real skill.",
  prompt: "Implement `to_submission(ids, preds)` → dict mapping each id to its prediction, in the given order (values are compared numerically).",
  hint: "dict(zip(ids, preds)) — then convert numpy floats with float(v).",
  starter:
`def to_submission(ids, preds):
    # your code
    return {}`,
  entry: "to_submission",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 20))
    # random non-sequential ids — fabricating "id_0..id_n" or ignoring ids must fail
    ids = ["smp_%06d" % v for v in rng.permutation(rng.integers(0, 10**6, n))]
    return {"ids": ids, "preds": rng.normal(0, 1, n)}`,
  solve:
`def to_submission(ids, preds):
    return {i: float(p) for i, p in zip(ids, preds)}`
}
);

EXERCISES.push(
{
  id: "m00-confusion-matrix",
  module: "M0",
  title: "Confusion matrix from labels",
  diff: 1, minutes: 8,
  theory: "A confusion matrix C counts, for every pair (true class i, predicted class j), how many samples landed there: row i is the distribution of what truly-class-i items were called. The diagonal holds the correct predictions, and the largest off-diagonal cell tells you exactly which two classes the model mixes up — that is where you go hunting for better features. `np.add.at(C, (y_true, y_pred), 1)` builds it in a single vectorized pass.",
  prompt: "Implement `confusion_matrix(y_true, y_pred, k)` → a (k, k) integer array where `C[i, j]` is the number of samples with true label `i` and predicted label `j`.\n\n```\ny_true=[0,0,1], y_pred=[0,1,1], k=2 → [[1,1],[0,1]]\n```",
  hint: "C = np.zeros((k, k), int); np.add.at(C, (y_true, y_pred), 1) — np.add.at handles repeated index pairs correctly, unlike C[a, b] += 1.",
  starter:
`def confusion_matrix(y_true, y_pred, k):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    C = np.zeros((k, k), dtype=int)
    # your code
    return C`,
  entry: "confusion_matrix",
  gen:
`def gen(rng):
    n, k = int(rng.integers(10, 60)), int(rng.integers(2, 7))
    # correlated preds — pairs (i,j) repeat heavily, so C[a,b] += 1
    # without np.add.at (which drops duplicate counts) must fail
    hi = k - 1 if rng.random() < 0.35 else k   # sometimes class k-1 absent -> k must come from the arg
    y_true = rng.integers(0, hi, n)
    same = rng.random(n) < 0.7
    y_pred = np.where(same, y_true, rng.integers(0, hi, n))
    return {"y_true": y_true, "y_pred": y_pred, "k": k}`,
  solve:
`def confusion_matrix(y_true, y_pred, k):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    C = np.zeros((k, k), dtype=int)
    np.add.at(C, (y_true, y_pred), 1)
    return C`
},
{
  id: "m00-label-smoothing",
  module: "M0",
  title: "Label smoothing of one-hot targets",
  diff: 1, minutes: 8,
  theory: "Label smoothing replaces a hard one-hot target (1 on the true class, 0 elsewhere) with a soft target: the true class gets 1 − eps + eps/k and every other class gets eps/k. It stops a classifier from driving its logits to infinity to satisfy an overconfident target, which makes it a simple and effective regularizer for cross-entropy training. With eps = 0 the formula collapses back to ordinary one-hot — a good sanity check.",
  prompt: "Implement `label_smooth(y, k, eps)` → an (n, k) float matrix where row i has `1 - eps + eps/k` at position `y[i]` and `eps/k` everywhere else.\n\n```\ny=[1], k=3, eps=0.3 → [[0.1, 0.8, 0.1]]\n```",
  hint: "Start from np.eye(k)[y] for the hard part, then blend: (1 - eps) * onehot + eps / k.",
  starter:
`def label_smooth(y, k, eps):
    y = np.asarray(y)
    # your code
    return np.zeros((len(y), k))`,
  entry: "label_smooth",
  gen:
`def gen(rng):
    n, k = int(rng.integers(3, 30)), int(rng.integers(2, 7))
    return {"y": rng.integers(0, k - 1, n) if rng.random() < 0.35 else rng.integers(0, k, n),
            "k": k,
            "eps": float(rng.choice([0.0, 0.05, 0.1, 0.2, 0.3]))}`,
  solve:
`def label_smooth(y, k, eps):
    y = np.asarray(y)
    return (1.0 - eps) * np.eye(k)[y] + eps / k`
});

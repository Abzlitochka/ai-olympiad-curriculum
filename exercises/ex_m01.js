/* Exercises for M1 — EDA → Features → Simple Models.
   Train/val splits, standardization, imputation, from-scratch linear/logistic
   regression, kNN, classification metrics and ROC-AUC — all in pure NumPy. */

EXERCISES.push(
{
  id: "m01-train-val-split",
  module: "ML2",
  title: "Shuffled train/validation split",
  diff: 1, minutes: 8,
  theory: "Hold out a validation set before modelling: fit on train, check on validation, and keep the test set for the final estimate only. The standard recipe: permute the row indices with a seeded RNG, take the first `n_val` as validation, the rest as train. Seeding (`np.random.default_rng(seed)`) makes the split reproducible — with an unseeded split the score changes from run to run.",
  prompt: "Implement `train_val_split(n, val_frac, seed)` → `(train_idx, val_idx)`.\n\nShuffle `0..n-1` with `np.random.default_rng(seed).permutation(n)`, let `n_val = int(round(n * val_frac))`, and return the last `n - n_val` indices as train, the first `n_val` as validation.\n\n```\nn=5, val_frac=0.4 → n_val=2, e.g. perm=[3,0,4,1,2] → val=[3,0], train=[4,1,2]\n```",
  hint: "perm = rng.permutation(n); return perm[n_val:], perm[:n_val].",
  starter:
`def train_val_split(n, val_frac, seed):
    rng = np.random.default_rng(seed)
    # your code
    return np.array([]), np.array([])`,
  entry: "train_val_split",
  gen:
`def gen(rng):
    n = int(rng.integers(10, 60))
    return {"n": n,
            "val_frac": float(rng.choice([0.2, 0.25, 0.3, 0.4])),
            "seed": int(rng.integers(0, 10000))}`,
  solve:
`def train_val_split(n, val_frac, seed):
    rng = np.random.default_rng(seed)
    perm = rng.permutation(n)
    n_val = int(round(n * val_frac))
    return perm[n_val:], perm[:n_val]`
},
{
  id: "m01-zscore-apply",
  module: "ML2",
  title: "Z-score using train statistics",
  diff: 1, minutes: 10,
  theory: "Standardization subtracts the column mean and divides by the column standard deviation. The subtle rule that separates good pipelines from leaky ones: compute `mu` and `sigma` on the TRAIN set only, then apply those same numbers to validation/test. Using `X.std(axis=0)` gives the population std (ddof=0). A constant train column has sigma=0 — the convention is to divide by 1 instead, which maps it to 0.",
  prompt: "Implement `zscore_apply(X_train, X_test)`: compute per-column mean and population std (`ddof=0`) **on `X_train`**, and return `X_test` standardized with them. If a train column has std exactly 0, divide by 1 — the train column then maps to 0, and test values keep their raw offset from the train mean.",
  hint: "mu = X_train.mean(0); sd = np.where(X_train.std(0) == 0, 1.0, X_train.std(0)); then (X_test - mu) / sd broadcasts.",
  starter:
`def zscore_apply(X_train, X_test):
    X_train = np.asarray(X_train, dtype=float)
    X_test = np.asarray(X_test, dtype=float)
    # your code — stats from X_train only!
    return X_test`,
  entry: "zscore_apply",
  gen:
`def gen(rng):
    n1, n2, d = int(rng.integers(8, 30)), int(rng.integers(3, 15)), int(rng.integers(2, 6))
    X_train = rng.normal(0, 1, (n1, d)) * rng.integers(1, 5, d)
    X_test = rng.normal(0, 1, (n2, d)) * rng.integers(1, 5, d)
    if rng.random() < 0.4:
        X_train[:, int(rng.integers(0, d))] = 2.5   # constant column
    return {"X_train": X_train, "X_test": X_test}`,
  solve:
`def zscore_apply(X_train, X_test):
    X_train = np.asarray(X_train, dtype=float)
    X_test = np.asarray(X_test, dtype=float)
    mu = X_train.mean(axis=0)
    sd = X_train.std(axis=0)
    sd = np.where(sd == 0, 1.0, sd)
    return (X_test - mu) / sd`
},
{
  id: "m01-median-impute",
  module: "ML2",
  title: "Median imputation of NaNs",
  diff: 1, minutes: 10,
  theory: "Real olympiad tables are full of missing values, and `np.nan` poisons every reduction it touches (`np.mean` of a column with one NaN is NaN). Median imputation is the robust default: the median ignores outliers, unlike the mean. `np.nanmedian(X, axis=0)` computes per-column medians skipping NaNs; then you fill the missing cells column by column — e.g. via `np.where(np.isnan(X))` indices.",
  prompt: "Implement `impute_median(X)` → a copy of `X` (float 2-D array) where every `NaN` is replaced by the median of its column. Do not modify the input in place. Every column is guaranteed to have at least one non-NaN value.\n\n```\n[[1, nan], [3, 2], [5, 4]] → [[1, 3], [3, 2], [5, 4]]   (col medians: 3, 3)\n```",
  hint: "med = np.nanmedian(X, axis=0); rows, cols = np.where(np.isnan(X)); out[rows, cols] = med[cols].",
  starter:
`def impute_median(X):
    X = np.asarray(X, dtype=float)
    out = X.copy()
    # your code
    return out`,
  entry: "impute_median",
  gen:
`def gen(rng):
    n, d = int(rng.integers(6, 20)), int(rng.integers(2, 6))
    X = rng.normal(0, 3, (n, d))
    mask = rng.random((n, d)) < 0.25
    for j in range(d):
        if mask[:, j].all():
            mask[int(rng.integers(0, n)), j] = False   # keep >=1 observed per column
    X[mask] = np.nan
    return {"X": X}`,
  solve:
`def impute_median(X):
    X = np.asarray(X, dtype=float)
    out = X.copy()
    med = np.nanmedian(out, axis=0)
    rows, cols = np.where(np.isnan(out))
    out[rows, cols] = med[cols]
    return out`
},
{
  id: "m01-linreg-ols",
  module: "ML2",
  title: "Linear regression, closed form",
  diff: 2, minutes: 12,
  theory: "Ordinary least squares has a closed-form solution: minimize ||Xw − y||² to get w = (XᵀX)⁻¹Xᵀy. In practice you never invert the matrix — `np.linalg.lstsq(A, y)` solves it via a numerically stable decomposition. To learn an intercept, append a column of ones to the design matrix; its weight is the bias.",
  prompt: "Implement `fit_ols(X, y)` → weight vector of length `n_features + 1`, where the **last** entry is the intercept. Build `A = [X | 1]` and solve `A w ≈ y` in the least-squares sense (`np.linalg.lstsq`).\n\n```\nX = [[1],[2],[3]], y = [3,5,7] → w ≈ [2.0, 1.0]  (slope 2, intercept 1)\n```",
  hint: "np.hstack([X, np.ones((n, 1))]) gives A; np.linalg.lstsq(A, y, rcond=None)[0] gives w.",
  starter:
`def fit_ols(X, y):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    # your code — remember the ones column for the intercept
    return np.zeros(X.shape[1] + 1)`,
  entry: "fit_ols",
  gen:
`def gen(rng):
    d = int(rng.integers(1, 5)); n = int(rng.integers(d + 4, 30))
    X = rng.normal(0, 1, (n, d))
    w_true = rng.normal(0, 2, d + 1)
    A = np.hstack([X, np.ones((n, 1))])
    y = A @ w_true + rng.normal(0, 0.3, n)
    return {"X": X, "y": y}`,
  solve:
`def fit_ols(X, y):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    A = np.hstack([X, np.ones((X.shape[0], 1))])
    w, *_ = np.linalg.lstsq(A, y, rcond=None)
    return w`
},
{
  id: "m01-logreg-proba",
  module: "ML2",
  title: "Logistic-regression log-probabilities",
  diff: 2, minutes: 10,
  theory: "Logistic regression squashes a linear score `z = x·w + b` through the sigmoid σ(z) = 1/(1+e^{−z}). Scoring models actually works on **log**-probabilities: log σ(z) = −softplus(−z). The naive log(1/(1+e^{−z})) gives −inf for very negative z — the correct answer is ≈ z — so use the stable form log σ(z) = min(0, z) − log(1 + e^{−|z|}), where every exp argument stays ≤ 0.",
  prompt: "Implement `predict_log_proba(X, w, b)` → array of `log P(y=1 | x)` for each row: the log-sigmoid of `X @ w + b`, computed in the numerically stable form (scores get very large). Returning −inf where the true answer is finite counts as wrong.\n\n```\nz = 0 → log 0.5 ≈ −0.693;  z = −800 → −800 (naive gives −inf)\n```",
  hint: "log_sigmoid(z) = np.minimum(0, z) - np.log1p(np.exp(-np.abs(z))).",
  starter:
`def predict_log_proba(X, w, b):
    z = np.asarray(X, dtype=float) @ np.asarray(w, dtype=float) + b
    p = np.zeros_like(z, dtype=float)
    # your code — stable log-sigmoid
    return p`,
  entry: "predict_log_proba",
  gen:
`def gen(rng):
    n, d = int(rng.integers(5, 25)), int(rng.integers(2, 6))
    X = rng.normal(0, 2, (n, d)); w = rng.normal(0, 2, d); b = float(rng.normal(0, 2))
    if rng.random() < 0.5:
        # force an extreme score: naive log(sigmoid) -> -inf, stable form is finite
        i = int(rng.integers(0, n))
        X[i] = 0.0
        X[i, 0] = 1.0
        w = np.zeros(d)
        w[0] = float(rng.choice([-900.0, -750.0, 900.0]))
        b = 0.0
    return {"X": X, "w": w, "b": b}`,
  solve:
`def predict_log_proba(X, w, b):
    z = np.asarray(X, dtype=float) @ np.asarray(w, dtype=float) + b
    return np.minimum(0.0, z) - np.log1p(np.exp(-np.abs(z)))`
},
{
  id: "m01-knn-predict",
  module: "ML4",
  title: "k-nearest-neighbors classifier",
  diff: 2, minutes: 15,
  theory: "kNN is the simplest non-parametric classifier: find the k training points closest to the query (Euclidean distance) and take a majority vote of their labels. Two tie rules make it deterministic: equal distances are resolved by smaller training index (use a stable sort), and equal vote counts are resolved by the smallest class label (`np.bincount(...).argmax()` does exactly that).",
  prompt: "Implement `knn_predict(X_train, y_train, X_test, k)` → array of predicted labels for each row of `X_test`.\n\n- distance = Euclidean, `((X_train - x) ** 2).sum(1)` is enough (no need to sqrt);\n- pick the `k` smallest distances — on ties prefer the smaller training index (`np.argsort(d, kind='stable')`);\n- majority vote — on ties prefer the smallest label (`np.bincount(votes).argmax()`).",
  hint: "Per test row: idx = np.argsort(d, kind='stable')[:k]; pred = np.bincount(y_train[idx], minlength=n_classes).argmax().",
  starter:
`def knn_predict(X_train, y_train, X_test, k):
    X_train = np.asarray(X_train, dtype=float)
    y_train = np.asarray(y_train, dtype=int)
    X_test = np.asarray(X_test, dtype=float)
    preds = []
    # your code — loop over test rows
    return np.array(preds)`,
  entry: "knn_predict",
  gen:
`def gen(rng):
    n, m, d = int(rng.integers(8, 25)), int(rng.integers(2, 8)), int(rng.integers(2, 5))
    c = int(rng.integers(2, 5))
    X_train = rng.normal(0, 2, (n, d))
    y_train = rng.integers(0, c, n)
    X_test = rng.normal(0, 2, (m, d))
    k = int(rng.integers(1, 8))
    if rng.random() < 0.35 and m >= 1:
        # guaranteed distance tie: duplicate a row under a different label,
        # drop a test point exactly on it — the smaller train index must win
        i, j = sorted(int(x) for x in rng.choice(n, 2, replace=False))
        X_train[j] = X_train[i]
        y_train[j] = (int(y_train[i]) + 1) % c
        X_test[0] = X_train[i]
        k = 1
    return {"X_train": X_train, "y_train": y_train, "X_test": X_test, "k": k}`,
  solve:
`def knn_predict(X_train, y_train, X_test, k):
    X_train = np.asarray(X_train, dtype=float)
    y_train = np.asarray(y_train, dtype=int)
    X_test = np.asarray(X_test, dtype=float)
    n_classes = int(y_train.max()) + 1
    preds = []
    for x in X_test:
        dist = ((X_train - x) ** 2).sum(axis=1)
        idx = np.argsort(dist, kind="stable")[:k]
        preds.append(int(np.bincount(y_train[idx], minlength=n_classes).argmax()))
    return np.array(preds)`
},
{
  id: "m01-macro-f1",
  module: "ML2",
  title: "Macro F1 from a confusion view",
  diff: 3, minutes: 30,
  theory: "For class c: precision = TP/(TP+FP) — of everything you called c, how much really was; recall = TP/(TP+FN) — of everything that really was c, how much you caught; F1 = 2PR/(P+R), the harmonic mean that punishes lopsided predictors. Macro-F1 averages the per-class F1 over ALL classes 0..k−1, including ones absent from the data — a division by zero in either P or R means that class contributes 0.",
  prompt: "Implement `macro_f1(y_true, y_pred, k)` → the mean of per-class F1 over classes `0..k-1`.\n\nPer class `c`: `tp` = both are c, `fp` = predicted c but true isn't, `fn` = true is c but predicted isn't. If `tp + fp == 0` precision is 0; if `tp + fn == 0` recall is 0; if `p + r == 0` that class's F1 is 0.\n\n```\ny_true=[0,0,1,1], y_pred=[0,1,1,1], k=2 → F1_0=2/3, F1_1=0.8 → macro ≈ 0.7333\n```",
  hint: "Loop c in range(k); compute tp/fp/fn with boolean masks like (y_true == c) & (y_pred == c); guard every division.",
  starter:
`def macro_f1(y_true, y_pred, k):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    # your code — average the per-class F1 over all k classes
    return 0.0`,
  entry: "macro_f1",
  gen:
`def gen(rng):
    n, k = int(rng.integers(10, 50)), int(rng.integers(3, 7))
    # always leave one class absent — averaging only over present classes must fail
    absent = int(rng.integers(0, k))
    keep = [c for c in range(k) if c != absent]
    y_true = rng.choice(keep, n)
    flip = rng.random(n) < 0.35
    y_pred = np.where(flip, rng.choice(keep, n), y_true)
    return {"y_true": y_true, "y_pred": y_pred, "k": k}`,
  solve:
`def macro_f1(y_true, y_pred, k):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    f1s = []
    for c in range(k):
        tp = int(((y_true == c) & (y_pred == c)).sum())
        fp = int(((y_true != c) & (y_pred == c)).sum())
        fn = int(((y_true == c) & (y_pred != c)).sum())
        p = tp / (tp + fp) if tp + fp > 0 else 0.0
        r = tp / (tp + fn) if tp + fn > 0 else 0.0
        f1s.append(2 * p * r / (p + r) if p + r > 0 else 0.0)
    return float(np.mean(f1s))`
},
{
  id: "m01-roc-auc",
  module: "ML2",
  title: "ROC-AUC via rank statistic",
  diff: 3, minutes: 45,
  theory: "ROC-AUC equals the probability that a random positive outranks a random negative — the Mann–Whitney U statistic: AUC = (Σ ranks of positives − P(P+1)/2) / (P·N), where ranks go 1..n and TIED scores share the average of the ranks they span. No sklearn: sort the scores, walk the sorted array in runs of equal values, and assign each run its mean rank.",
  prompt: "Implement `roc_auc(y_true, scores)` → AUC for binary labels (both classes always present).\n\n1. Rank the scores ascending (rank 1 = smallest); equal scores get the average rank of the positions they occupy — e.g. three tied values at positions 3,4,5 each get rank 4.\n2. `AUC = (sum of ranks where y==1 − P(P+1)/2) / (P*N)` with P positives, N negatives.\n\n```\ny=[0,0,1,1], s=[0.1,0.4,0.35,0.8] → ranks [1,3,2,4] → AUC = (2+4−3)/4 = 0.75\n```",
  hint: "order = np.argsort(s); then scan sorted scores in runs of equal values and write the mean rank back via ranks[order[i:j+1]] = (i+j)/2 + 1.",
  starter:
`def roc_auc(y_true, scores):
    y = np.asarray(y_true)
    s = np.asarray(scores, dtype=float)
    # your code — average ranks for ties, then the Mann–Whitney formula
    return -1.0  # wrong — replace`,
  entry: "roc_auc",
  gen:
`def gen(rng):
    n = int(rng.integers(8, 40))
    y = rng.integers(0, 2, n)
    y[0], y[1] = 0, 1                              # both classes present
    if rng.random() < 0.5:
        s = rng.integers(0, 5, n).astype(float)    # discrete scores: ties
    else:
        s = rng.normal(0, 1, n) + y
    return {"y_true": y, "scores": s}`,
  solve:
`def roc_auc(y_true, scores):
    y = np.asarray(y_true)
    s = np.asarray(scores, dtype=float)
    n = len(s)
    order = np.argsort(s, kind="stable")
    ss = s[order]
    ranks = np.empty(n, dtype=float)
    i = 0
    while i < n:
        j = i
        while j + 1 < n and ss[j + 1] == ss[i]:
            j += 1
        ranks[order[i:j + 1]] = (i + j) / 2.0 + 1.0
        i = j + 1
    P = float((y == 1).sum())
    N = float((y == 0).sum())
    return float((ranks[y == 1].sum() - P * (P + 1) / 2.0) / (P * N))`
}
);

EXERCISES.push(
{
  id: "m01-stratified-kfold",
  module: "ML2",
  title: "Stratified k-fold split",
  diff: 2, minutes: 15,
  theory: "A plain k-fold can give one fold far more positives than another when the data is imbalanced, which makes validation scores noisy and hard to trust. Stratified k-fold fixes this by splitting EACH class separately into k chunks and pooling chunk i of every class into fold i — so every fold keeps the overall class proportions. The deterministic recipe: shuffle the indices within each class with one seeded RNG, `np.array_split` them into k parts, and concatenate part i across classes.",
  prompt: "Implement `stratified_kfold(y, k, seed)` → a list of `k` arrays, the test indices of each fold.\n\nFor each class `c` in increasing label order (`np.unique`), take `idx = np.where(y == c)[0]`, permute it with the shared `rng = np.random.default_rng(seed)` (`idx[rng.permutation(len(idx))]`), split it with `np.array_split(idx, k)`, and append part `i` to fold `i`. Return each fold's indices sorted ascending.\n\n```\ny=[0,0,0,0,1,1], k=2 → each fold holds 2 zeros + 1 one\n```",
  hint: "Loop c over np.unique(y); shuffle that class's indices; for i, chunk in enumerate(np.array_split(...)) collect folds[i]; np.sort(np.concatenate(...)) at the end.",
  starter:
`def stratified_kfold(y, k, seed):
    y = np.asarray(y)
    rng = np.random.default_rng(seed)
    folds = [[] for _ in range(k)]
    # your code — shuffle within each class, then deal chunks to folds
    return [np.array([], dtype=int) for _ in range(k)]`,
  entry: "stratified_kfold",
  gen:
`def gen(rng):
    n, c = int(rng.integers(12, 50)), int(rng.integers(2, 5))
    k = int(rng.integers(2, 5))
    y = rng.integers(0, c, n)
    y[:c] = np.arange(c)                     # every class present
    return {"y": y, "k": k, "seed": int(rng.integers(0, 10000))}`,
  solve:
`def stratified_kfold(y, k, seed):
    y = np.asarray(y)
    rng = np.random.default_rng(seed)
    folds = [[] for _ in range(k)]
    for c in np.unique(y):
        idx = np.where(y == c)[0]
        idx = idx[rng.permutation(len(idx))]
        for i, chunk in enumerate(np.array_split(idx, k)):
            folds[i].append(chunk)
    return [np.sort(np.concatenate(f)) for f in folds]`
},
{
  id: "m01-poly2",
  module: "ML2",
  title: "Degree-2 polynomial expansion",
  diff: 2, minutes: 12,
  theory: "Hand a linear model non-linear features and it fits curves. The standard first step is degree-2 monomials — squares and pairwise products. x² captures curvature; x_i·x_j captures interactions like 'feature i matters only when j is large', which a plain linear model cannot express. The column layout must be an exact convention, or downstream weights are meaningless. Here it is: [1, x_1…x_d, then x_i·x_j for all i ≤ j in lexicographic order] — 1 + d + d(d+1)/2 columns. Note the blow-up: d features become ~d²/2 columns, so people rarely go past degree 2–3.",
  prompt: "Implement `poly_features2(X)` → an (n, 1 + d + d(d+1)/2) float matrix:\n\n1. a column of ones,\n2. the `d` original columns in order,\n3. products `X[:, i] * X[:, j]` for every pair `0 <= i <= j < d`, iterated with `i` outer and `j` inner (lexicographic `(i, j)` order).\n\n```\nX=[[a,b]] → [1, a, b, a², a·b, b²]   (6 columns for d=2)\n```",
  hint: "cols = [np.ones(n)] + [X[:, i] for i in range(d)]; then nested loops for i in range(d): for j in range(i, d): append X[:, i] * X[:, j]; np.stack(cols, axis=1).",
  starter:
`def poly_features2(X):
    X = np.asarray(X, dtype=float)
    # your code — ones column, originals, then i<=j products
    return X`,
  entry: "poly_features2",
  gen:
`def gen(rng):
    n, d = int(rng.integers(3, 15)), int(rng.integers(1, 6))
    return {"X": rng.integers(-4, 5, (n, d)).astype(float)}`,
  solve:
`def poly_features2(X):
    X = np.asarray(X, dtype=float)
    n, d = X.shape
    cols = [np.ones(n)] + [X[:, i] for i in range(d)]
    for i in range(d):
        for j in range(i, d):
            cols.append(X[:, i] * X[:, j])
    return np.stack(cols, axis=1)`
});

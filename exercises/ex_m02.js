/* Exercises for M2 — Embeddings & Zero-Param Reasoning.
   Cosine geometry, centroid/kNN classification, retrieval and analogy solving —
   pure inference, no training. Think IOAI 'Help BOBAI': everything ends in a
   nearest-neighbour lookup. */

EXERCISES.push(
{
  id: "m02-l2-normalize",
  module: "AI3",
  title: "L2-normalize embedding rows",
  diff: 1, minutes: 8,
  theory: "Cosine similarity, retrieval and clustering on embeddings usually start by L2-normalizing rows, so that the dot product equals the cosine. Edge case: a zero vector has norm 0, so dividing by it gives NaN; leave such rows as zeros.",
  prompt: "Implement `l2_normalize(X)`: return a float array where every row has unit L2 norm. Rows that are all zeros must stay all zeros.",
  hint: "n = np.linalg.norm(X, axis=1, keepdims=True); divide by np.where(n == 0, 1.0, n) and mask the zero rows back to 0.",
  starter:
`def l2_normalize(X):
    X = np.asarray(X, dtype=float)
    # your code
    return X`,
  entry: "l2_normalize",
  gen:
`def gen(rng):
    X = rng.normal(0, 1, (int(rng.integers(3, 12)), int(rng.integers(2, 8))))
    if rng.random() < 0.4:
        X[int(rng.integers(0, X.shape[0]))] = 0.0   # a dead embedding
    return {"X": X}`,
  solve:
`def l2_normalize(X):
    X = np.asarray(X, dtype=float)
    n = np.linalg.norm(X, axis=1, keepdims=True)
    return np.where(n == 0, 0.0, X / np.where(n == 0, 1.0, n))`
},
{
  id: "m02-cosine-sim",
  module: "AI3",
  title: "Pairwise cosine similarity matrix",
  diff: 1, minutes: 10,
  theory: "Given normalized embeddings, cosine similarity is a single matrix multiply: `An @ Bn.T` gives all pairwise scores in one shot. This is the core of retrieval, deduplication and clustering baselines. Guard zero vectors so you never emit NaN.",
  prompt: "Implement `cosine_sim(A, B)` → a (len(A), len(B)) float matrix of cosine similarities between every row of `A` and every row of `B`. If either vector is all zeros, the similarity is 0.",
  hint: "Normalize the rows of both matrices with the guarded-division trick, then multiply An @ Bn.T.",
  starter:
`def cosine_sim(A, B):
    A = np.asarray(A, dtype=float)
    B = np.asarray(B, dtype=float)
    # your code — normalise each row first
    return A @ B.T  # wrong — dot products, not cosine`,
  entry: "cosine_sim",
  gen:
`def gen(rng):
    n, m, d = int(rng.integers(2, 9)), int(rng.integers(2, 9)), int(rng.integers(2, 7))
    A = rng.normal(0, 1, (n, d)); B = rng.normal(0, 1, (m, d))
    if rng.random() < 0.3:
        A[int(rng.integers(0, n))] = 0.0
    if rng.random() < 0.3:
        B[int(rng.integers(0, m))] = 0.0   # zero-norm rows on BOTH sides
    return {"A": A, "B": B}`,
  solve:
`def cosine_sim(A, B):
    A = np.asarray(A, dtype=float); B = np.asarray(B, dtype=float)
    an = np.linalg.norm(A, axis=1, keepdims=True)
    bn = np.linalg.norm(B, axis=1, keepdims=True)
    An = np.where(an == 0, 0.0, A / np.where(an == 0, 1.0, an))
    Bn = np.where(bn == 0, 0.0, B / np.where(bn == 0, 1.0, bn))
    return An @ Bn.T`
},
{
  id: "m02-retrieve-topk",
  module: "AI3",
  title: "Top-k retrieval by cosine",
  diff: 2, minutes: 10,
  theory: "Semantic search in one line: score every document against the query with cosine similarity and take the top-k indices. `np.argsort(-s, kind='stable')` sorts descending while keeping smaller indices first on ties — deterministic ranking matters for grading and for leaderboard reproducibility.",
  prompt: "Implement `retrieve(D, q, k)` → array of the `k` row indices of `D` most similar to the query vector `q` by cosine similarity, best first. Break similarity ties by the smaller row index. `1 <= k <= len(D)`.",
  hint: "sims = (D / ||D||_rows) @ (q / ||q||) with a guard for zero norms; then np.argsort(-sims, kind='stable')[:k].",
  starter:
`def retrieve(D, q, k):
    D = np.asarray(D, dtype=float)
    q = np.asarray(q, dtype=float)
    # your code — cosine similarities, then a stable descending argsort
    return np.zeros(k, dtype=int)`,
  entry: "retrieve",
  gen:
`def gen(rng):
    n, d = int(rng.integers(4, 15)), int(rng.integers(2, 7))
    D = rng.normal(0, 1, (n, d)); q = rng.normal(0, 1, d)
    arm = rng.random()
    if arm < 0.2:
        D[int(rng.integers(0, n))] = 0.0        # zero row: cosine degenerates to 0
    elif arm < 0.35:
        q = np.zeros(d)                          # zero query: every similarity is 0
    elif arm < 0.6:
        i, j = [int(x) for x in rng.choice(n, 2, replace=False)]
        D[j] = D[i]                              # duplicate rows -> exact similarity tie
    return {"D": D, "q": q, "k": int(rng.integers(1, n + 1))}`,
  solve:
`def retrieve(D, q, k):
    D = np.asarray(D, dtype=float); q = np.asarray(q, dtype=float)
    dn = np.linalg.norm(D, axis=1); qn = np.linalg.norm(q)
    den = np.where(dn * qn == 0, 1.0, dn * qn)
    sims = (D @ q) / den
    return np.argsort(-sims, kind="stable")[:k]`
},
{
  id: "m02-nearest-centroid",
  module: "AI3",
  title: "Nearest-centroid classifier",
  diff: 2, minutes: 12,
  theory: "Nearest-centroid classification needs no training: average the training embeddings of each class into a centroid, then assign each new point to its nearest centroid. One matrix operation gives a decent first baseline; IOAI 2024 'Help BOBAI' is built around this idea.",
  prompt: "Implement `nearest_centroid(X, y, T)` → array of predicted labels, one per row of `T`. The centroid of label `c` is the mean of the rows of `X` with `y == c` (only over labels present in `y`); each test row gets the label of the closest centroid by Euclidean distance.",
  hint: "labels = np.unique(y); C = np.stack([X[y == c].mean(0) for c in labels]); squared distances broadcast as (T[:,None,:] − C[None,:,:])**2 summed on the last axis; finish with labels[np.argmin(dist, axis=1)].",
  starter:
`def nearest_centroid(X, y, T):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y)
    T = np.asarray(T, dtype=float)
    # your code
    return np.zeros(len(T), dtype=int)`,
  entry: "nearest_centroid",
  gen:
`def gen(rng):
    k, d = int(rng.integers(2, 5)), int(rng.integers(2, 6))
    n, m = int(rng.integers(4, 20)), int(rng.integers(2, 10))
    centers = rng.normal(0, 4, (k, d))
    y = rng.integers(0, k, n)
    X = centers[y] + rng.normal(0, 1, (n, d))
    T = centers[rng.integers(0, k, m)] + rng.normal(0, 1, (m, d))
    return {"X": X, "y": y, "T": T}`,
  solve:
`def nearest_centroid(X, y, T):
    X = np.asarray(X, dtype=float); y = np.asarray(y); T = np.asarray(T, dtype=float)
    labels = np.unique(y)
    C = np.stack([X[y == c].mean(0) for c in labels])
    dist = ((T[:, None, :] - C[None, :, :]) ** 2).sum(-1)
    return labels[np.argmin(dist, axis=1)]`
},
{
  id: "m02-knn-predict",
  module: "AI3",
  title: "kNN vote on embeddings",
  diff: 2, minutes: 15,
  theory: "kNN needs no training at all: for each test point find the k nearest train rows by Euclidean distance and let their labels vote. Two deterministic rules keep the result reproducible: distance ties go to the smaller train index, vote ties go to the smaller label.",
  prompt: "Implement `knn_predict(Xtr, ytr, Xte, k)` → array of predicted labels, one per row of `Xte`. Each test row takes the majority label among its `k` nearest rows of `Xtr` by Euclidean distance. Distance ties: the smaller train index is nearer. Vote ties: the smallest label wins.",
  hint: "Per test row: d = ((Xtr - t)**2).sum(1); idx = np.argsort(d, kind='stable')[:k]; then np.unique(ytr[idx], return_counts=True) — unique sorts labels and np.argmax takes the first (smallest) label on count ties.",
  starter:
`def knn_predict(Xtr, ytr, Xte, k):
    Xtr = np.asarray(Xtr, dtype=float)
    ytr = np.asarray(ytr)
    Xte = np.asarray(Xte, dtype=float)
    # your code
    return np.zeros(len(Xte), dtype=int)`,
  entry: "knn_predict",
  gen:
`def gen(rng):
    kc, d = int(rng.integers(2, 5)), int(rng.integers(2, 6))
    n, m = int(rng.integers(4, 20)), int(rng.integers(2, 10))
    centers = rng.normal(0, 3, (kc, d))
    ytr = rng.integers(0, kc, n)
    Xtr = centers[ytr] + rng.normal(0, 1, (n, d))
    Xte = centers[rng.integers(0, kc, m)] + rng.normal(0, 1, (m, d))
    k = int(rng.integers(1, min(n, 8)))
    if rng.random() < 0.35:
        # guaranteed distance tie: duplicate a row under a different label,
        # drop a test point exactly on it — the smaller train index must win
        i, j = sorted(int(x) for x in rng.choice(n, 2, replace=False))
        Xtr[j] = Xtr[i]
        ytr[j] = (int(ytr[i]) + 1) % kc
        Xte[0] = Xtr[i]
        k = 1
    return {"Xtr": Xtr, "ytr": ytr, "Xte": Xte, "k": k}`,
  solve:
`def knn_predict(Xtr, ytr, Xte, k):
    Xtr = np.asarray(Xtr, dtype=float); ytr = np.asarray(ytr); Xte = np.asarray(Xte, dtype=float)
    out = []
    for t in Xte:
        d = ((Xtr - t) ** 2).sum(1)
        idx = np.argsort(d, kind="stable")[:k]
        labs, cnt = np.unique(ytr[idx], return_counts=True)
        out.append(labs[np.argmax(cnt)])
    return np.asarray(out)`
},
{
  id: "m02-analogy",
  module: "AI3",
  title: "Word-analogy by vector arithmetic",
  diff: 3, minutes: 15,
  theory: "Word analogies ('king − man + woman ≈ queen') are vector arithmetic in embedding space followed by a nearest-neighbour lookup with cosine similarity. Always mask the query words themselves — the strongest neighbour of `a − b + c` is usually `a`; forgetting this returns the wrong answer without any error.",
  prompt: "Implement `analogy(V, a, b, c)` → index of the row of embedding matrix `V` most similar (cosine) to the target `V[a] − V[b] + V[c]`, excluding rows `a`, `b` and `c` themselves. Break ties by smaller index.",
  hint: "sims = V @ t / (||V||_rows · ||t||) with a zero-norm guard; then sims[[a, b, c]] = -np.inf and int(np.argmax(sims)).",
  starter:
`def analogy(V, a, b, c):
    V = np.asarray(V, dtype=float)
    t = V[a] - V[b] + V[c]
    # your code
    return 0`,
  entry: "analogy",
  gen:
`def gen(rng):
    n, d = int(rng.integers(6, 15)), int(rng.integers(3, 8))
    V = np.round(rng.normal(0, 1, (n, d)), 1)   # quantized → similarity ties occur
    a, b, c = rng.choice(n, 3, replace=False)
    if rng.random() < 0.4:
        # duplicate two non-query rows → guaranteed cosine tie, index rule tested
        rest = [i for i in range(n) if i not in (int(a), int(b), int(c))]
        if len(rest) >= 2:
            p, q = rng.choice(rest, 2, replace=False)
            V[int(q)] = V[int(p)]
    return {"V": V, "a": int(a), "b": int(b), "c": int(c)}`,
  solve:
`def analogy(V, a, b, c):
    V = np.asarray(V, dtype=float)
    t = V[a] - V[b] + V[c]
    den = np.linalg.norm(V, axis=1) * np.linalg.norm(t)
    sims = (V @ t) / np.where(den == 0, 1.0, den)
    sims[[a, b, c]] = -np.inf
    return int(np.argmax(sims))`
}
);

EXERCISES.push(
{
  id: "m02-debias-centroid",
  module: "AI3",
  title: "Centroid-subtraction debiasing",
  diff: 1, minutes: 8,
  theory: "Embedding collections often share a common 'background' direction — the average embedding — that drowns out the differences you actually care about. Subtracting the centroid of a reference set from every vector is a simple debiasing step: one mean and one broadcast subtraction, which often removes a shared direction that inflates all similarities.",
  prompt: "Implement `debias(X, R)` → float array where the mean row of the reference matrix `R` has been subtracted from every row of `X`. The result must have the same shape as `X`.",
  hint: "X - R.mean(axis=0, keepdims=True) broadcasts the (1, d) centroid over all rows of X.",
  starter:
`def debias(X, R):
    X = np.asarray(X, dtype=float)
    R = np.asarray(R, dtype=float)
    # your code
    return X`,
  entry: "debias",
  gen:
`def gen(rng):
    n, m, d = int(rng.integers(2, 12)), int(rng.integers(2, 8)), int(rng.integers(2, 7))
    X = rng.normal(0, 1, (n, d)) + rng.normal(0, 3, d)   # shared offset
    R = rng.normal(0, 1, (m, d)) + X.mean(0)
    return {"X": X, "R": R}`,
  solve:
`def debias(X, R):
    X = np.asarray(X, dtype=float); R = np.asarray(R, dtype=float)
    return X - R.mean(axis=0, keepdims=True)`
},
{
  id: "m02-triplet-margin",
  module: "AI3",
  title: "Triplet margin violations",
  diff: 2, minutes: 12,
  theory: "Triplet objectives want an anchor closer to a positive than to a negative by a margin: d(a, p) + margin <= d(a, n). Checking which triples violate the rule is how you audit embedding quality — and how you mine hard triples for the next training round.",
  prompt: "Implement `triplet_violations(A, P, N, margin)` → array of row indices `i` (ascending) where the triple violates the margin rule `||A[i] - P[i]|| + margin <= ||A[i] - N[i]||` using Euclidean norms.",
  hint: "dp = np.linalg.norm(A - P, axis=1); dn = np.linalg.norm(A - N, axis=1); np.where(dp + margin > dn)[0].",
  starter:
`def triplet_violations(A, P, N, margin):
    A = np.asarray(A, dtype=float)
    P = np.asarray(P, dtype=float)
    N = np.asarray(N, dtype=float)
    # your code
    return np.zeros(len(A), dtype=int)`,
  entry: "triplet_violations",
  gen:
`def gen(rng):
    n, d = int(rng.integers(3, 12)), int(rng.integers(2, 7))
    A = rng.normal(0, 1, (n, d))
    P = A + rng.normal(0, 0.5, (n, d))       # positives near anchors
    N = rng.normal(0, 1.5, (n, d))
    margin = float(rng.choice([0.0, 0.1, 0.5, 1.0]))
    if rng.random() < 0.7:                   # a hard negative → violation
        i = int(rng.integers(0, n))
        N[i] = A[i] + rng.normal(0, 0.05, d)
    if rng.random() < 0.35:
        # exact boundary: ||A-P|| + margin == ||A-N|| — the rule HOLDS,
        # so a solution flagging >= must fail (spec is strict >)
        i = int(rng.integers(0, n))
        v = rng.normal(0, 1, d); v /= np.linalg.norm(v)
        N[i] = A[i] + v * (np.linalg.norm(P[i] - A[i]) + margin)
    return {"A": A, "P": P, "N": N, "margin": margin}`,
  solve:
`def triplet_violations(A, P, N, margin):
    A = np.asarray(A, dtype=float); P = np.asarray(P, dtype=float); N = np.asarray(N, dtype=float)
    dp = np.linalg.norm(A - P, axis=1)
    dn = np.linalg.norm(A - N, axis=1)
    return np.where(dp + margin > dn)[0]`
},
{
  id: "m02-norm-outliers",
  module: "AI3",
  title: "Embedding-norm outlier flag",
  diff: 2, minutes: 10,
  theory: "Degenerate embeddings often reveal themselves through their norms: a row produced by a broken tokenizer or an OOV fallback gets an unusually large or small length. The standard flag: mark rows whose L2 norm sits more than k standard deviations away from the mean norm.",
  prompt: "Implement `norm_outliers(X, k)` → array of row indices (ascending) whose L2 norm deviates from the mean row norm by **strictly more** than `k` times the standard deviation of the norms: `|n_i - mean(n)| > k * std(n)` where `n` holds the per-row L2 norms of `X`.",
  hint: "n = np.linalg.norm(X, axis=1); np.where(np.abs(n - n.mean()) > k * n.std())[0].",
  starter:
`def norm_outliers(X, k):
    X = np.asarray(X, dtype=float)
    # your code
    return np.zeros(len(X), dtype=int)`,
  entry: "norm_outliers",
  gen:
`def gen(rng):
    n, d = int(rng.integers(6, 15)), int(rng.integers(2, 7))
    X = rng.normal(0, 1, (n, d))
    arm = rng.random()
    if arm < 0.25:
        X = np.tile(rng.normal(0, 1, d), (n, 1))  # all norms equal: std=0 -> strict ">" flags nothing
    elif arm < 0.55:
        X[int(rng.integers(0, n))] *= 15.0   # one bloated norm
    elif arm < 0.8:
        # a norm only ddof=0 stats flag — search a norm t so that, against
        # all-row stats (which is what the reference uses), |t-mean| > k*std0
        # but <= k*std1, so a np.std(ddof=1) answer must fail
        k = float(rng.choice([1.0, 1.5, 2.0]))
        rest = np.linalg.norm(X[:-1], axis=1)
        t = None
        hi = float(rest.mean() + 6 * rest.std(ddof=1) + 3.0)
        for cand in np.linspace(float(rest.mean()), hi, 400):
            ns = np.append(rest, cand)
            m_all = float(ns.mean())
            if abs(cand - m_all) > k * float(ns.std()) and abs(cand - m_all) <= k * float(ns.std(ddof=1)):
                t = cand; break
        if t is not None:
            v = rng.normal(0, 1, d)
            X[-1] = v / np.linalg.norm(v) * t
        return {"X": X, "k": k}
    return {"X": X, "k": float(rng.choice([1.0, 1.5, 2.0]))}`,
  solve:
`def norm_outliers(X, k):
    X = np.asarray(X, dtype=float)
    n = np.linalg.norm(X, axis=1)
    return np.where(np.abs(n - n.mean()) > k * n.std())[0]`
}
);

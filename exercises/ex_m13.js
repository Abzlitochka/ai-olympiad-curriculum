/* Exercises for M13 — Recsys, Ranking & Preference Modeling. */

EXERCISES.push(
{
  id: "m13-popularity",
  module: "ML9",
  title: "Popularity baseline ranking",
  diff: 1, minutes: 8,
  theory: "The popularity baseline is the first recommender you should always beat: rank items by how many users interacted with them, ignoring who the user is. Deterministic tie-breaking matters for auto-grading — specify it (here: more interactions first, then higher total rating, then lower item index) or two correct-looking solutions diverge.",
  prompt: "Implement `popularity_rank(R)` → item indices sorted by popularity: descending count of nonzero entries in the item's column, ties broken by descending column sum, then ascending index. `R` is a users×items matrix.",
  hint: "count = (R != 0).sum(axis=0), total = R.sum(axis=0); sort range(n_items) by (-count, -total, index).",
  starter:
`def popularity_rank(R):
    R = np.asarray(R)
    # your code
    return list(range(R.shape[1]))`,
  entry: "popularity_rank",
  gen:
`def gen(rng):
    u = int(rng.integers(4, 9)); it = int(rng.integers(4, 10))
    R = rng.integers(0, 6, (u, it)).astype(float)
    R[rng.random(R.shape) < 0.3] = 0.0
    return {"R": R}`,
  solve:
`def popularity_rank(R):
    R = np.asarray(R, dtype=float)
    count = (R != 0).sum(axis=0)
    total = R.sum(axis=0)
    return sorted(range(R.shape[1]), key=lambda j: (-int(count[j]), -float(total[j]), j))`
},
{
  id: "m13-pr-at-k",
  module: "ML9",
  title: "Precision@k and recall@k",
  diff: 1, minutes: 10,
  theory: "Two standard retrieval metrics: precision@k = (relevant items in the top-k) / k measures how clean the head of your ranking is; recall@k = (relevant items in top-k) / (total relevant) measures coverage. Both are set intersections — the ranking order inside the top-k does not matter for them.",
  prompt: "Implement `pr_at_k(recommended, relevant, k)` → `[precision, recall]` as a list of two floats. `recommended` is a ranked list of item ids (k <= len), `relevant` a nonempty list of the truly relevant ids.",
  hint: "hits = len(set(recommended[:k]) & set(relevant)); precision = hits / k; recall = hits / len(relevant).",
  starter:
`def pr_at_k(recommended, relevant, k):
    # your code
    return [0.0, 0.0]`,
  entry: "pr_at_k",
  gen:
`def gen(rng):
    n = int(rng.integers(6, 16))
    rec = [int(x) for x in rng.permutation(n)]
    m = int(rng.integers(1, n))
    rel = [int(x) for x in rng.choice(n, m, replace=False)]
    if rng.random() < 0.4:
        rel.append(n)   # id outside the recommended pool -> recall < 1 must hold
    return {"recommended": rec, "relevant": rel, "k": int(rng.integers(1, n + 1))}`,
  solve:
`def pr_at_k(recommended, relevant, k):
    hits = len(set(recommended[:k]) & set(relevant))
    return [hits / k, hits / len(relevant)]`
},
{
  id: "m13-mrr",
  module: "ML9",
  title: "Mean reciprocal rank",
  diff: 1, minutes: 8,
  theory: "MRR measures how far down the first correct answer sits: per user it is 1/rank of the first relevant item (ranks are 1-based), or 0 if the list contains none — then average over users. It is the metric for tasks where only the first hit matters (QA retrieval, next-item recommendation) and it is literally one early-exit loop.",
  prompt: "Implement `mrr(recs, rels)` → mean reciprocal rank over users. `recs[i]` is user i's ranked item list, `rels[i]` their relevant ids (may be empty). Per user: `1/r` where r is the 1-based position of the first relevant item; 0 if there is none. Return the mean.",
  hint: "Per user loop enumerate(rec, 1); the first item in set(rel) contributes 1/r — then break.",
  starter:
`def mrr(recs, rels):
    # your code
    return 0.0`,
  entry: "mrr",
  gen:
`def gen(rng):
    u = int(rng.integers(3, 8)); n = int(rng.integers(6, 15))
    recs = [[int(v) for v in rng.permutation(n)] for _ in range(u)]
    rels = []
    for _ in range(u):
        m = int(rng.integers(0, n // 2 + 1))
        rels.append([int(v) for v in rng.choice(n, m, replace=False)])
    return {"recs": recs, "rels": rels}`,
  solve:
`def mrr(recs, rels):
    tot = 0.0
    for rec, rel in zip(recs, rels):
        relset = set(rel)
        for r, item in enumerate(rec, 1):
            if item in relset:
                tot += 1.0 / r
                break
    return tot / len(recs)`
},
{
  id: "m13-ndcg",
  module: "ML9",
  title: "NDCG@k with graded relevance",
  diff: 2, minutes: 15,
  theory: "Graded relevance needs a metric that rewards putting the best items first: DCG@k = sum over positions r of rel_r / log2(r + 2), and NDCG divides by the ideal DCG — the same sum over relevances sorted descending. Missing items count as relevance 0; if the ideal is 0, NDCG is defined as 0.",
  prompt: "Implement `ndcg_at_k(ranked_ids, relevances, k)` → NDCG in [0, 1]. `ranked_ids` is the ranking, `relevances` maps item id → grade (absent = 0). Use DCG = Σ rel/log2(r+2) with 0-based r; return 0.0 if the ideal DCG is 0.\n\n```\nranked=[0,1], rel={0:3, 1:1, 2:2}, k=2 → DCG = 3/1 + 1/log2(3) = 3.631; ideal [3,2] → 3/1 + 2/log2(3) = 4.262; NDCG ≈ 0.852\n```",
  hint: "dcg over ranked_ids[:k] with relevances.get(id, 0); ideal = sorted(relevances.values(), reverse=True)[:k].",
  starter:
`def ndcg_at_k(ranked_ids, relevances, k):
    # your code
    return 0.0`,
  entry: "ndcg_at_k",
  gen:
`def gen(rng):
    n = int(rng.integers(6, 16))
    grades = rng.integers(0, 4, n).tolist()
    if rng.random() < 0.2:
        grades = [0] * n              # nothing relevant -> ideal DCG = 0 -> return 0.0
    elif max(grades) == 0:
        grades[0] = 2
    rel = {i: int(g) for i, g in enumerate(grades)}
    for i in [int(x) for x in rng.choice(n, int(rng.integers(0, max(1, n // 3))), replace=False)]:
        del rel[i]                    # absent keys must count as relevance 0
    ranked = [int(x) for x in rng.permutation(n)]
    return {"ranked_ids": ranked, "relevances": rel, "k": int(rng.integers(1, n + 1))}`,
  solve:
`def ndcg_at_k(ranked_ids, relevances, k):
    dcg = sum(relevances.get(i, 0) / math.log2(r + 2) for r, i in enumerate(ranked_ids[:k]))
    ideal = sorted(relevances.values(), reverse=True)[:k]
    idcg = sum(v / math.log2(r + 2) for r, v in enumerate(ideal))
    return dcg / idcg if idcg > 0 else 0.0`
},
{
  id: "m13-item-cosine",
  module: "ML9",
  title: "Item-item cosine neighbours",
  diff: 2, minutes: 30,
  theory: "Item-item collaborative filtering treats each item's column of the user×item matrix as its taste profile; two items are similar when their columns point the same way — cosine = (a·b)/(|a||b|). A column of all zeros has undefined cosine; the convention is similarity 0. Always exclude the query item itself from its own neighbour list.",
  prompt: "Implement `similar_items(R, item, k)` → the k item indices most similar to column `item` of matrix `R` by cosine similarity, most similar first. Exclude `item`; zero-norm columns get similarity 0; break ties by lower index.",
  hint: "Loop j != item; s = v·w/(|v||w|) if both norms > 0 else 0; sort by (-s, j).",
  starter:
`def similar_items(R, item, k):
    R = np.asarray(R, dtype=float)
    # your code
    return []`,
  entry: "similar_items",
  gen:
`def gen(rng):
    u = int(rng.integers(4, 9)); it = int(rng.integers(4, 10))
    R = rng.integers(0, 6, (u, it)).astype(float)
    if rng.random() < 0.3:
        R[:, int(rng.integers(0, it))] = 0.0          # cold column
    return {"R": R, "item": int(rng.integers(0, it)), "k": int(rng.integers(1, it))}`,
  solve:
`def similar_items(R, item, k):
    R = np.asarray(R, dtype=float)
    v = R[:, item]
    nv = float(np.sqrt((v ** 2).sum()))
    sims = []
    for j in range(R.shape[1]):
        if j == item:
            continue
        w = R[:, j]
        nw = float(np.sqrt((w ** 2).sum()))
        s = float(v @ w) / (nv * nw) if nv > 0 and nw > 0 else 0.0
        sims.append((j, s))
    sims.sort(key=lambda t: (-t[1], t[0]))
    return [j for j, _ in sims[:k]]`
}
);

EXERCISES.push(
{
  id: "m13-mapk",
  module: "ML9",
  title: "Mean average precision at k",
  diff: 2, minutes: 30,
  theory: "AP@k rewards relevant items that land early: walk the top-k, and each time position r is a hit add the running precision hits/r. Normalizing by min(#relevant, k) — the best achievable sum — makes a perfect ranking score 1. MAP@k is then the plain mean of AP over users; a user with an empty relevant set contributes 0 by convention.",
  prompt: "Implement `map_at_k(recs, rels, k)` → MAP@k. `recs[i]` is user i's ranked list of unique item ids, `rels[i]` their relevant items (possibly empty). Per user: AP = (sum over positions r <= k where `recs[i][r-1]` is relevant of hits/r) / min(len(rels[i]), k), or 0 if rels[i] is empty. Return the mean over users.",
  hint: "Per user keep a hit counter; on a hit add hits / r. Denominator is min(len(rel), k) — guard the empty-rel case.",
  starter:
`def map_at_k(recs, rels, k):
    # your code
    return 0.0`,
  entry: "map_at_k",
  gen:
`def gen(rng):
    u = int(rng.integers(3, 8)); n = int(rng.integers(8, 16))
    recs = [[int(v) for v in rng.permutation(n)] for _ in range(u)]
    rels = []
    for _ in range(u):
        m = int(rng.integers(0, max(2, n // 2)))
        rels.append([int(v) for v in rng.choice(n, m, replace=False)])
    return {"recs": recs, "rels": rels, "k": int(rng.integers(1, n + 1))}`,
  solve:
`def map_at_k(recs, rels, k):
    aps = []
    for rec, rel in zip(recs, rels):
        relset = set(rel)
        hits = 0
        s = 0.0
        for r, item in enumerate(rec[:k], 1):
            if item in relset:
                hits += 1
                s += hits / r
        aps.append(s / min(len(rel), k) if rel else 0.0)
    return sum(aps) / len(aps)`
},
{
  id: "m13-auc-ranks",
  module: "ML9",
  title: "AUC via rank statistic",
  diff: 3, minutes: 45,
  theory: "AUC equals P(score_pos > score_neg) over random pairs, which the Mann–Whitney U statistic computes from ranks: AUC = (sum of positive ranks − P(P+1)/2) / (P·N), with 1-based ranks averaged across ties. Ties need averaged ranks: plain argsort ranks are wrong whenever two scores are equal.",
  prompt: "Implement `auc_score(y, scores)` → ROC AUC in [0, 1]. `y` has both classes (0/1). Tied scores share the average of the ranks they would occupy (1-based).",
  hint: "Sort indices by score; walk equal-score runs, assign each the mean of ranks i..j + 1; then plug the positive-rank sum into the U formula.",
  starter:
`def auc_score(y, scores):
    # your code — rank-sum U statistic with tie averaging
    return -1.0  # wrong — replace`,
  entry: "auc_score",
  gen:
`def gen(rng):
    n = int(rng.integers(8, 30))
    p = int(rng.integers(1, n))
    y = rng.permutation([1] * p + [0] * (n - p)).tolist()
    scores = rng.integers(0, 5, n).tolist()          # small range -> plenty of ties
    return {"y": y, "scores": scores}`,
  solve:
`def auc_score(y, scores):
    s = list(scores)
    order = sorted(range(len(s)), key=lambda i: s[i])
    ranks = [0.0] * len(s)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and s[order[j + 1]] == s[order[i]]:
            j += 1
        r = (i + j) / 2 + 1.0
        for t in range(i, j + 1):
            ranks[order[t]] = r
        i = j + 1
    P = sum(y); N = len(y) - P
    rs = sum(ranks[i] for i in range(len(y)) if y[i] == 1)
    return (rs - P * (P + 1) / 2) / (P * N)`
},
{
  id: "m13-usercf",
  module: "ML9",
  title: "User-based CF prediction",
  diff: 3, minutes: 45,
  theory: "User-based collaborative filtering predicts a rating from lookalike users: cosine-similarity between the target user's row and every other row, take the k most similar, and average their ratings of the item weighted by similarity. Zeros mean 'missing', so only neighbours who actually rated the item enter the weighted sum; if none did, the prediction is 0 by convention.",
  prompt: "Implement `cf_predict(R, u, i, k)` → the predicted rating for cell (u, i). Similarity between row u and row j (j != u) is cosine; a zero-norm row gives similarity 0. Take the k neighbours with highest similarity (ties by lower index), keep those with R[j][i] != 0, and return sum(sim_j * R[j][i]) / sum(|sim_j|). If the denominator is 0 return 0.0. R[u][i] is the unobserved cell — never read it.",
  hint: "Same cosine pattern as item-item but over rows: collect (j, sim) for j != u, sort by (-sim, j), then accumulate the weighted sum over neighbours that rated i.",
  starter:
`def cf_predict(R, u, i, k):
    R = np.asarray(R, dtype=float)
    # your code
    return 0.0`,
  entry: "cf_predict",
  gen:
`def gen(rng):
    u = int(rng.integers(5, 10)); it = int(rng.integers(5, 11))
    R = rng.integers(0, 6, (u, it)).astype(float)
    R[rng.random(R.shape) < 0.25] = 0.0
    tu = int(rng.integers(0, u)); ti = int(rng.integers(0, it))
    R[tu, ti] = 0.0
    if rng.random() < 0.25:
        R[tu, :] = 0.0   # cold target user — zero-norm row, denominator-0 path
    elif rng.random() < 0.45:
        # center nonzero ratings at 3: negative entries -> negative cosine sims,
        # so dropping |·| in the denominator must fail
        R = np.where(R == 0, 0.0, R - 3.0)
        R[tu, ti] = 0.0
    return {"R": R, "u": tu, "i": ti, "k": int(rng.integers(1, u))}`,
  solve:
`def cf_predict(R, u, i, k):
    R = np.asarray(R, dtype=float)
    v = R[u]
    nv = float(np.sqrt((v ** 2).sum()))
    sims = []
    for j in range(R.shape[0]):
        if j == u:
            continue
        w = R[j]
        nw = float(np.sqrt((w ** 2).sum()))
        s = float(v @ w) / (nv * nw) if nv > 0 and nw > 0 else 0.0
        sims.append((j, s))
    sims.sort(key=lambda t: (-t[1], t[0]))
    num = 0.0
    den = 0.0
    for j, s in sims[:k]:
        if R[j, i] != 0.0:
            num += s * R[j, i]
            den += abs(s)
    return num / den if den > 0 else 0.0`
},
{
  id: "m13-svd-reconstruct",
  module: "ML9",
  title: "Rank-k SVD reconstruction",
  diff: 3, minutes: 20,
  theory: "Collaborative filtering by matrix factorization approximates the rating matrix R ≈ U Σ Vᵀ and keeps only the top-k singular values — the 'latent factors'. To predict, mean-center each user's observed ratings (over their nonzero entries), fill the unobserved entries with 0, take the SVD, truncate to rank k, reconstruct, and add the means back. `np.linalg.svd` returns `U, s, Vt` with `s` the singular values.",
  prompt: "Implement `svd_reconstruct(R, k)` → the rank-k approximation of the user×item matrix `R` after per-user mean-centering. For each user compute the mean over their **nonzero** ratings (0 if none), subtract it from their observed entries (missing entries stay 0), run `np.linalg.svd`, zero out singular values past index `k`, reconstruct with `U @ diag(s) @ Vt`, then add the per-user mean back to every column. Return the float matrix.\n\n```\nR=[[5,0,3],[0,1,0]], k=1 → center rows (means 4,1) → top-1 SVD → rebuild → add means back\n```",
  hint: "means = R.sum(1) / (R != 0).sum(1).clip(1); C = np.where(R != 0, R - means[:,None], 0); U, s, Vt = np.linalg.svd(C, full_matrices=False); s[k:] = 0; return U @ np.diag(s) @ Vt + means[:,None].",
  starter:
`def svd_reconstruct(R, k):
    # your code
    return np.asarray(R, dtype=float)`,
  entry: "svd_reconstruct",
  gen:
`def gen(rng):
    u = int(rng.integers(3, 9)); it = int(rng.integers(3, 9))
    R = rng.integers(0, 6, (u, it)).astype(float)
    R[rng.random(R.shape) < 0.35] = 0.0
    if rng.random() < 0.25:
        R[int(rng.integers(0, u)), :] = 0.0   # cold row -> mean 0
    k = int(rng.integers(1, min(u, it)))
    return {"R": R, "k": k}`,
  solve:
`def svd_reconstruct(R, k):
    R = np.asarray(R, dtype=float)
    cnt = np.clip((R != 0).sum(axis=1), 1, None)
    means = R.sum(axis=1) / cnt
    C = np.where(R != 0, R - means[:, None], 0.0)
    U, s, Vt = np.linalg.svd(C, full_matrices=False)
    s[k:] = 0.0
    return U @ np.diag(s) @ Vt + means[:, None]`
}
);

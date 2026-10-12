/* Exercises for M15 — Multimodal Fusion.
   Image / text / tabular embeddings are small NumPy vectors; fusion is built
   from first principles — concatenation, weighting, dropout, projection, CLIP. */

EXERCISES.push(
{
  id: "m15-concat-fuse",
  module: "AI4",
  title: "Early fusion by concatenation",
  diff: 1, minutes: 8,
  theory: "**Early fusion** feeds a model the raw concatenation of all modality embeddings. It's the simplest baseline: fix the order (image, text, tabular), flatten each input, and glue them into one feature vector with `np.concatenate`.",
  prompt: "Implement `concat_fuse(img, txt, tab)` → single 1-D vector = [img ‖ txt ‖ tab]. Inputs may be lists or arrays of any compatible shape — ravel them first.",
  hint: "np.concatenate([np.asarray(v, float).ravel() for v in (img, txt, tab)])",
  starter:
`def concat_fuse(img, txt, tab):
    # your code — this drops the text and tabular modalities
    return np.asarray(img, dtype=float).ravel()`,
  entry: "concat_fuse",
  gen:
`def gen(rng):
    def v(k):
        if rng.random() < 0.4:
            return rng.normal(0, 1, (int(rng.integers(1, 3)), k))   # 2-D per the "any shape" spec
        return rng.normal(0, 1, k)
    return {"img": v(int(rng.integers(2, 8))),
            "txt": v(int(rng.integers(2, 8))),
            "tab": v(int(rng.integers(1, 5)))}`,
  solve:
`def concat_fuse(img, txt, tab):
    return np.concatenate([np.asarray(v, dtype=float).ravel() for v in (img, txt, tab)])`
},
{
  id: "m15-late-fusion",
  module: "AI4",
  title: "Late fusion of probabilities",
  diff: 1, minutes: 8,
  theory: "**Late fusion** trains one model per modality and merges their *predictions*, not features. The standard merge is a weighted average of the per-modality probability vectors, normalized by the total weight so the result stays a distribution.",
  prompt: "Implement `late_fusion(probs_list, weights)` → weighted mean of the per-modality probability vectors: Σ wᵢ·pᵢ / Σ wᵢ. `probs_list` is a list of equal-length vectors.",
  hint: "Stack with np.asarray(probs_list), scale rows by weights[:, None], sum over axis 0, divide by weights.sum().",
  starter:
`def late_fusion(probs_list, weights):
    P = np.asarray(probs_list, dtype=float)
    # your code — plain mean ignores the per-model weights
    return P.mean(axis=0)`,
  entry: "late_fusion",
  gen:
`def gen(rng):
    m = int(rng.integers(2, 5)); k = int(rng.integers(2, 6))
    probs = []
    for _ in range(m):
        z = rng.normal(0, 1, k)
        e = np.exp(z - z.max())
        probs.append(e / e.sum())
    return {"probs_list": probs, "weights": rng.uniform(0.2, 1.5, m)}`,
  solve:
`def late_fusion(probs_list, weights):
    P = np.asarray(probs_list, dtype=float)
    w = np.asarray(weights, dtype=float)
    return (P * w[:, None]).sum(axis=0) / w.sum()`
},
{
  id: "m15-modality-dropout",
  module: "AI4",
  title: "Modality dropout",
  diff: 2, minutes: 10,
  theory: "**Modality dropout** zeroes a whole modality during training so the fused model can't over-rely on one source and still works when a modality is missing at inference. The deterministic version: build the fused vector with the chosen modality replaced by zeros — same length, same positions.",
  prompt: "Implement `fuse_drop(img, txt, tab, drop)`: return the concatenation [img ‖ txt ‖ tab] with modality `drop` (0=img, 1=txt, 2=tab) replaced by zeros of the same shape.",
  hint: "Put the three raveled arrays in a list, set parts[drop] = np.zeros_like(parts[drop]), concatenate.",
  starter:
`def fuse_drop(img, txt, tab, drop):
    # your code — this ignores drop; the dropped modality must be zeroed
    return np.concatenate([np.asarray(img, float), np.asarray(txt, float), np.asarray(tab, float)])`,
  entry: "fuse_drop",
  gen:
`def gen(rng):
    return {"img": rng.normal(0, 1, int(rng.integers(2, 8))),
            "txt": rng.normal(0, 1, int(rng.integers(2, 8))),
            "tab": rng.normal(0, 1, int(rng.integers(1, 5))),
            "drop": int(rng.integers(0, 3))}`,
  solve:
`def fuse_drop(img, txt, tab, drop):
    parts = [np.asarray(v, dtype=float).ravel() for v in (img, txt, tab)]
    parts[drop] = np.zeros_like(parts[drop])
    return np.concatenate(parts)`
},
{
  id: "m15-project-align",
  module: "AI4",
  title: "Project into a shared space",
  diff: 2, minutes: 10,
  theory: "Modalities have different embedding sizes — a vision model gives 512-d, a text model 768-d. Fusion first **projects** each into a common dimension with a learned matrix W, then L2-normalizes so no modality dominates by scale: e' = eW / ‖eW‖.",
  prompt: "Implement `project(emb, W)` → (n, d_out): multiply embeddings by the projection matrix, then L2-normalize **each row** to unit norm (a zero row stays zero).",
  hint: "E = emb @ W; norms = np.linalg.norm(E, axis=1, keepdims=True); divide with np.where(norms == 0, 1, norms).",
  starter:
`def project(emb, W):
    emb = np.asarray(emb, dtype=float)
    # your code — missing the row normalization
    return emb @ np.asarray(W, dtype=float)`,
  entry: "project",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 8)); din = int(rng.integers(2, 7)); dout = int(rng.integers(2, 7))
    emb = rng.normal(0, 1, (n, din))
    if rng.random() < 0.25:
        emb[int(rng.integers(0, n))] = 0.0   # zero row must project to zero, not NaN
    return {"emb": emb, "W": rng.normal(0, 1, (din, dout))}`,
  solve:
`def project(emb, W):
    E = np.asarray(emb, dtype=float) @ np.asarray(W, dtype=float)
    nrm = np.linalg.norm(E, axis=1, keepdims=True)
    return E / np.where(nrm == 0, 1.0, nrm)`
},
{
  id: "m15-clip-logits",
  module: "AI4",
  title: "CLIP contrastive logits",
  diff: 2, minutes: 12,
  theory: "CLIP aligns images and texts in one embedding space: L2-normalize every embedding, then the pairwise similarity matrix is `logits = (I @ Tᵀ) / τ`. Temperature τ (learned, ~0.07) rescales cosine similarities into logits sharp enough for softmax training.",
  prompt: "Implement `clip_logits(img_emb, txt_emb, tau)` → (n_img, n_txt) matrix: L2-normalize rows of both inputs, then return (I @ Tᵀ) / tau.",
  hint: "Normalize each row (keepdims=True), matmul the two arrays, divide by tau.",
  starter:
`def clip_logits(img_emb, txt_emb, tau):
    I = np.asarray(img_emb, dtype=float)
    T = np.asarray(txt_emb, dtype=float)
    # your code — missing normalization and the tau scaling
    return I @ T.T`,
  entry: "clip_logits",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 7)); m = int(rng.integers(2, 7)); d = int(rng.integers(2, 7))
    return {"img_emb": rng.normal(0, 1, (n, d)),
            "txt_emb": rng.normal(0, 1, (m, d)),
            "tau": float(rng.choice([0.05, 0.07, 0.1, 0.5, 1.0]))}`,
  solve:
`def clip_logits(img_emb, txt_emb, tau):
    I = np.asarray(img_emb, dtype=float)
    T = np.asarray(txt_emb, dtype=float)
    I = I / np.linalg.norm(I, axis=1, keepdims=True)
    T = T / np.linalg.norm(T, axis=1, keepdims=True)
    return (I @ T.T) / tau`
},
{
  id: "m15-retrieval-probs",
  module: "AI4",
  title: "Image→text retrieval probs",
  diff: 3, minutes: 30,
  theory: "Retrieval asks: *for this image, which text matches?* Turn the similarity matrix into a distribution with a row-wise softmax — each row gives the probability that text j is the match for image i. This is exactly the softmax target of the CLIP contrastive loss.",
  prompt: "Implement `retrieval_probs(img_emb, txt_emb, tau)` → (n_img, n_txt): L2-normalize embeddings, compute logits = (I @ Tᵀ) / tau, then softmax **over each row** so every row sums to 1. Subtract the row max before exp.",
  hint: "Reuse the CLIP pipeline, then per row: z -= z.max(1, keepdims=True); exp; divide by row sum.",
  starter:
`def retrieval_probs(img_emb, txt_emb, tau):
    I = np.asarray(img_emb, dtype=float)
    T = np.asarray(txt_emb, dtype=float)
    # your code — missing normalization and the softmax over texts
    return (I @ T.T) / tau`,
  entry: "retrieval_probs",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 7)); m = int(rng.integers(2, 7)); d = int(rng.integers(2, 7))
    I = rng.normal(0, 1, (n, d)); T = rng.normal(0, 1, (m, d))
    tau = float(rng.choice([0.05, 0.1, 0.5, 1.0]))
    if rng.random() < 0.4:
        tau = 0.001
        T[0] = I[0]  # dot=1 -> logit 1000: naive exp -> inf -> NaN
    return {"img_emb": I, "txt_emb": T, "tau": tau}`,
  solve:
`def retrieval_probs(img_emb, txt_emb, tau):
    I = np.asarray(img_emb, dtype=float)
    T = np.asarray(txt_emb, dtype=float)
    I = I / np.linalg.norm(I, axis=1, keepdims=True)
    T = T / np.linalg.norm(T, axis=1, keepdims=True)
    L = (I @ T.T) / tau
    L = L - L.max(axis=1, keepdims=True)
    E = np.exp(L)
    return E / E.sum(axis=1, keepdims=True)`
}
);

EXERCISES.push(
{
  id: "m15-gated-fusion",
  module: "AI4",
  title: "Gated fusion of two embeddings",
  diff: 2, minutes: 10,
  theory: "**Gated fusion** lets the model decide per-dimension how much of each modality to keep: a sigmoid gate g ∈ (0,1)^d computed from the concatenated embedding mixes the two sources element-wise — out = g·a + (1−g)·b. Where the gate saturates toward 1 the first modality wins; toward 0 the second does.",
  prompt: "Implement `gated_fuse(a, b, Wg, bg)` for equal-length embeddings `a`, `b` of shape (d,): compute the gate `g = sigmoid(Wg @ concat(a, b) + bg)` where `Wg` is (d, 2d) and `bg` is (d,), then return `g * a + (1 - g) * b`.",
  hint: "h = np.concatenate([a, b]); g = 1 / (1 + np.exp(-(Wg @ h + bg))); return g * a + (1 - g) * b.",
  starter:
`def gated_fuse(a, b, Wg, bg):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    # your code — plain averaging below ignores the learned gate
    return 0.5 * a + 0.5 * b`,
  entry: "gated_fuse",
  gen:
`def gen(rng):
    d = int(rng.integers(2, 8))
    return {"a": rng.normal(0, 1, d), "b": rng.normal(0, 1, d),
            "Wg": rng.normal(0, 1, (d, 2 * d)),
            "bg": rng.normal(0, 0.5, d)}`,
  solve:
`def gated_fuse(a, b, Wg, bg):
    a = np.asarray(a, dtype=float); b = np.asarray(b, dtype=float)
    Wg = np.asarray(Wg, dtype=float); bg = np.asarray(bg, dtype=float)
    g = 1.0 / (1.0 + np.exp(-(Wg @ np.concatenate([a, b]) + bg)))
    return g * a + (1.0 - g) * b`
},
{
  id: "m15-infonce",
  module: "AI4",
  title: "InfoNCE contrastive loss",
  diff: 3, minutes: 12,
  theory: "InfoNCE is the loss behind CLIP-style training: for each anchor i the positive pair sits on the diagonal of the similarity matrix. L = −(1/n)·Σᵢ log( e^{S_ii} / Σ_j e^{S_ij} ). Computed stably that is `logsumexp(row i) − S[i,i]`, averaged over the batch — never exponentiate unshifted logits.",
  prompt: "Implement `infonce(S)` for an (n, n) similarity matrix where pair (i, i) is the positive: return the mean over rows of `logsumexp(S[i, :]) − S[i, i]` as a float, computed in a numerically stable way (subtract the row max before exp/log).",
  hint: "m = S.max(axis=1); lse = m + np.log(np.exp(S - m[:, None]).sum(axis=1)); return mean of (lse − np.diag(S)).",
  starter:
`def infonce(S):
    S = np.asarray(S, dtype=float)
    # your code — plain mean of the diagonal ignores the negatives
    return float(-np.mean(np.diag(S)))`,
  entry: "infonce",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 9))
    S = rng.normal(0, 3, (n, n))
    if rng.random() < 0.5:
        # huge logit: naive exp(S).sum -> inf -> loss inf, stable form is finite
        S[int(rng.integers(0, n)), int(rng.integers(0, n))] = float(rng.choice([800.0, 950.0]))
    return {"S": S}`,
  solve:
`def infonce(S):
    S = np.asarray(S, dtype=float)
    m = S.max(axis=1)
    lse = m + np.log(np.exp(S - m[:, None]).sum(axis=1))
    return float(np.mean(lse - np.diag(S)))`
},
{
  id: "m15-impute-missing",
  module: "AI4",
  title: "Impute missing modalities",
  diff: 2, minutes: 10,
  theory: "Multimodal datasets routinely have missing entries — a patient without an audio sample, a listing without an image. The simplest robust baseline keeps a boolean mask of which cells are absent and imputes them with the per-column mean over the rows where the value IS present; a column with no observed values falls back to 0.",
  prompt: "Implement `impute_missing(X, missing)` for an (n, d) float matrix `X` and a boolean matrix `missing` of the same shape (True = absent; the stored value there is a 0.0 placeholder). Fill each missing cell with the mean of the **observed** entries in its column; if a column has no observed entries, fill it with 0.0. Return a new array — do not mutate the input.",
  hint: "obs = np.where(missing, 0, X); cnt = (~missing).sum(0); colmean = obs.sum(0) / np.where(cnt == 0, 1, cnt); then write colmean into the masked cells of a copy.",
  starter:
`def impute_missing(X, missing):
    X = np.asarray(X, dtype=float).copy()
    # your code — leaving the 0.0 placeholders in place is wrong
    return X`,
  entry: "impute_missing",
  gen:
`def gen(rng):
    n = int(rng.integers(4, 12)); d = int(rng.integers(2, 6))
    missing = rng.random((n, d)) < float(rng.uniform(0.1, 0.5))
    X = rng.normal(0, 1, (n, d))
    X[missing] = 0.0
    return {"X": X, "missing": missing}`,
  solve:
`def impute_missing(X, missing):
    X = np.asarray(X, dtype=float).copy()
    M = np.asarray(missing, dtype=bool)
    obs = np.where(M, 0.0, X)
    cnt = (~M).sum(axis=0)
    colmean = obs.sum(axis=0) / np.where(cnt == 0, 1, cnt)
    colmean = np.where(cnt == 0, 0.0, colmean)
    X[M] = np.broadcast_to(colmean, X.shape)[M]
    return X`
}
);

/* Exercises for M4 — LLMs, Ciphers & Instruction Following.
   All NumPy / pure-Python; no real LLM calls — we simulate logits, probs and text. */

EXERCISES.push(
{
  id: "m04-temperature-softmax",
  module: "AI3",
  title: "Softmax with temperature",
  diff: 1, minutes: 8,
  theory: "LLM decoding starts from logits and turns them into probabilities with softmax. **Temperature** T divides the logits first: softmax(z / T). T < 1 sharpens the distribution (more confident), T > 1 flattens it (more random). Always subtract the max before exp() for numerical stability.",
  prompt: "Implement `softmax_temp(logits, T)` → the probability vector softmax(logits / T). It must sum to 1.",
  hint: "z = logits / T; subtract z.max(); exponentiate; divide by the sum.",
  starter:
`def softmax_temp(logits, T):
    logits = np.asarray(logits, dtype=float)
    # your code — divide by T, then a numerically-stable softmax
    return logits / T  # wrong — no softmax`,
  entry: "softmax_temp",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 15))
    logits = rng.normal(0, 3, n)
    if rng.random() < 0.4:
        # logits far beyond exp(709): a naive softmax without max-subtraction overflows
        logits = logits + float(rng.uniform(4000, 5000))
    return {"logits": logits,
            "T": float(rng.choice([0.3, 0.5, 0.7, 1.0, 2.0, 5.0]))}`,
  solve:
`def softmax_temp(logits, T):
    z = np.asarray(logits, dtype=float) / T
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()`
},
{
  id: "m04-perplexity",
  module: "AI3",
  title: "Perplexity from log-probs",
  diff: 1, minutes: 6,
  theory: "Perplexity is the standard language-model metric: the exponential of the average **negative** log-likelihood, PPL = exp(−mean(log p(token))). A perfect model assigns log p = 0 → PPL = 1; worse models get higher values.",
  prompt: "Implement `perplexity(logprobs)`: given the natural log-probabilities the model assigned to the true tokens, return exp(−mean(logprobs)).",
  hint: "One line: math.exp(-np.mean(logprobs)). Mind the minus sign.",
  starter:
`def perplexity(logprobs):
    # your code
    return float(np.exp(np.mean(logprobs)))  # wrong — sign`,
  entry: "perplexity",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 30))
    return {"logprobs": -rng.uniform(0.05, 4.0, n)}`,
  solve:
`def perplexity(logprobs):
    return float(math.exp(-float(np.mean(logprobs))))`
},
{
  id: "m04-token-counts",
  module: "AI3",
  title: "Token frequency counter",
  diff: 1, minutes: 8,
  theory: "The simplest tokenizer splits text on whitespace. Counting token frequencies is the basis of Bag-of-Words, TF-IDF and vocab building. Case matters — 'The' and 'the' are the same word, so lowercase first.",
  prompt: "Implement `token_counts(text)` → dict mapping each **lowercased** whitespace-separated token to its count.",
  hint: "Loop over text.lower().split() and use counts.get(w, 0) + 1 — or collections.Counter.",
  starter:
`def token_counts(text):
    # your code
    return {}`,
  entry: "token_counts",
  gen:
`def gen(rng):
    vocab = ["the", "a", "cat", "dog", "sits", "runs", "llm", "ai", "is", "on"]
    n = int(rng.integers(4, 20))
    words = [str(w) for w in rng.choice(vocab, n)]
    words = [w.upper() if rng.random() < 0.3 else w for w in words]
    return {"text": " ".join(words)}`,
  solve:
`def token_counts(text):
    counts = {}
    for w in text.lower().split():
        counts[w] = counts.get(w, 0) + 1
    return counts`
},
{
  id: "m04-topk-tokens",
  module: "AI3",
  title: "Top-k sampling filter",
  diff: 2, minutes: 10,
  theory: "Top-k sampling keeps only the k highest-probability tokens, renormalizes, and samples — preventing the model from picking very unlikely tokens. The random part needs an RNG, but the *candidate set* is deterministic: it's just the k largest probabilities.",
  prompt: "Implement `topk_ids(probs, k)` → the list of token indices allowed by top-k sampling, ordered by **decreasing** probability (all probabilities are distinct).",
  hint: "np.argsort sorts ascending — negate the probabilities, then take the first k and .tolist().",
  starter:
`def topk_ids(probs, k):
    # your code
    return list(range(k))`,
  entry: "topk_ids",
  gen:
`def gen(rng):
    n = int(rng.integers(5, 25))
    p = rng.random(n) + 0.01
    return {"probs": p / p.sum(), "k": int(rng.integers(1, n + 1))}   # k == n is legal — exercises the full-sort path`,
  solve:
`def topk_ids(probs, k):
    p = np.asarray(probs, dtype=float)
    return np.argsort(-p)[:k].tolist()`
},
{
  id: "m04-cipher-decode",
  module: "AI3",
  title: "Substitution cipher decode",
  diff: 1, minutes: 10,
  theory: "A substitution cipher replaces each letter with another according to a fixed mapping. Decoding is a per-character table lookup: `dict.get(ch, ch)` returns the mapped character, and the default keeps unknown characters (spaces, punctuation) unchanged.",
  prompt: "Implement `decipher(text, mapping)`: `mapping` maps cipher characters to plain characters. Decode `text`; characters not in the mapping pass through unchanged.",
  hint: "Build the result with ''.join(mapping.get(ch, ch) for ch in text).",
  starter:
`def decipher(text, mapping):
    # your code
    return text`,
  entry: "decipher",
  gen:
`def gen(rng):
    letters = "abcdefgh"
    k = int(rng.integers(4, len(letters) + 1))
    alpha = letters[:k]
    # random substitution, not a Caesar shift — forces a real dict lookup
    perm = rng.permutation(k).tolist()
    mapping = {alpha[i]: alpha[perm[i]] for i in range(k)}
    n = int(rng.integers(5, 20))
    text = "".join(str(c) for c in rng.choice(list(alpha) + [" "], n))
    return {"text": text, "mapping": mapping}`,
  solve:
`def decipher(text, mapping):
    return "".join(mapping.get(ch, ch) for ch in text)`
},
{
  id: "m04-format-check",
  module: "AI3",
  title: "Instruction-following checker",
  diff: 2, minutes: 12,
  theory: "Benchmarks for instruction following (IFEval-style) grade outputs with *verifiable* constraints: must start with a prefix, must contain required phrases, must not contain forbidden ones, must respect a word limit. Each check is one boolean — combine them with AND.",
  prompt: "Implement `follows_spec(text, prefix, required, forbidden, max_words)` → True if and only if **all** hold:\n- `text` starts with `prefix`\n- every string in `required` is a substring of `text`\n- no string in `forbidden` is a substring of `text`\n- `len(text.split())` ≤ `max_words`",
  hint: "Four conditions ANDed. `s in text` tests substring; str.startswith for the prefix; text.split() for words.",
  starter:
`def follows_spec(text, prefix, required, forbidden, max_words):
    # your code
    return True`,
  entry: "follows_spec",
  gen:
`def gen(rng):
    pool = ["model", "answer", "value", "result", "is", "the", "42", "ok"]
    prefix = str(rng.choice(["ANSWER:", "RESULT:", "DONE:"]))
    n = int(rng.integers(3, 9))
    text = " ".join(str(w) for w in rng.choice(pool, n))
    if rng.random() < 0.6:
        text = prefix + " " + text
    required = [str(w) for w in rng.choice(pool, int(rng.integers(1, 3)))]
    forbidden = [str(w) for w in rng.choice(["sorry", "cannot", "maybe"], int(rng.integers(1, 3)))]
    if rng.random() < 0.3:
        text = text + " " + str(rng.choice(forbidden))
    # substring-vs-whole-word traps: required phrases with spaces (present in
    # text) and forbidden substrings hidden inside longer words — a
    # word-in-text.split() implementation must fail both ways
    if rng.random() < 0.35:
        phrase = str(rng.choice(["is the", "the 42", "answer is"]))
        required.append(phrase)
        if rng.random() < 0.7:
            text = text + " " + phrase
    if rng.random() < 0.35:
        text = text + " " + str(rng.choice(["history", "analysis", "isotope"]))
        forbidden.append(str(rng.choice(["is", "anal", "isot"])))
    return {"text": text, "prefix": prefix, "required": required,
            "forbidden": forbidden, "max_words": int(rng.integers(2, 10))}`,
  solve:
`def follows_spec(text, prefix, required, forbidden, max_words):
    if not text.startswith(prefix):
        return False
    if any(r not in text for r in required):
        return False
    if any(f in text for f in forbidden):
        return False
    return len(text.split()) <= max_words`
},
{
  id: "m04-causal-attention",
  module: "AI3",
  title: "Causal masked attention",
  diff: 3, minutes: 30,
  theory: "Scaled dot-product attention computes scores S = QKᵀ/√d, turns each row into weights with softmax, and returns weights·V. **Causal** (decoder) attention additionally forbids position i from seeing j > i: set those scores to −∞ before softmax so their weight becomes exactly 0. That's an upper-triangular mask — `np.triu(..., k=1)`.",
  prompt: "Implement `causal_attention(Q, K, V)` for n positions × d dims: mask future scores (j > i) to −∞, softmax each row of QKᵀ/√d, return the (n, d_v) weighted sum of V. Subtract the row max before exp for stability.",
  hint: "mask = np.triu(np.ones((n, n), bool), 1); S = np.where(mask, -np.inf, S); then row-softmax and multiply by V.",
  starter:
`def causal_attention(Q, K, V):
    Q = np.asarray(Q, dtype=float)
    # your code
    return np.asarray(V, dtype=float)`,
  entry: "causal_attention",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 9)); d = int(rng.integers(2, 7)); dv = int(rng.integers(2, 7))
    Q = rng.normal(0, 1, (n, d)); K = rng.normal(0, 1, (n, d)); V = rng.normal(0, 1, (n, dv))
    if rng.random() < 0.45:
        # huge last-row logits: softmax without max-subtraction -> inf/inf = NaN
        Q[n - 1] = 100.0
        K = np.ones((n, d)) * 10.0
    return {"Q": Q, "K": K, "V": V}`,
  solve:
`def causal_attention(Q, K, V):
    Q = np.asarray(Q, dtype=float)
    K = np.asarray(K, dtype=float)
    V = np.asarray(V, dtype=float)
    n = Q.shape[0]
    S = Q @ K.T / math.sqrt(Q.shape[1])
    mask = np.triu(np.ones((n, n), dtype=bool), k=1)
    S = np.where(mask, -np.inf, S)
    S = S - S.max(axis=1, keepdims=True)
    E = np.exp(S)
    W = E / E.sum(axis=1, keepdims=True)
    return W @ V`
}
);

EXERCISES.push(
{
  id: "m04-cross-attention",
  module: "AI3",
  title: "Encoder-decoder cross-attention",
  diff: 3, minutes: 15,
  theory: "In an encoder–decoder Transformer the decoder attends to the encoder's outputs: the **queries** come from decoder states while **keys and values** come from the encoder. Scores S = QKᵀ/√d have shape (n_dec, n_enc) and there is NO causal mask — every decoder position may attend to every encoder position. Softmax each row, then multiply by V to get (n_dec, d_v).",
  prompt: "Implement `cross_attention(Q_dec, K_enc, V_enc)`: `Q_dec` is (n_dec, d), `K_enc` is (n_enc, d), `V_enc` is (n_enc, d_v). Compute S = Q @ K_enc.T / √d, softmax each row (subtract the row max first for stability), and return the (n_dec, d_v) weighted sum W @ V. No masking of any kind.",
  hint: "Same pipeline as causal attention minus the triu mask: S = Q @ K.T / sqrt(d); row-softmax; W @ V.",
  starter:
`def cross_attention(Q_dec, K_enc, V_enc):
    Q = np.asarray(Q_dec, dtype=float)
    # your code
    return np.asarray(V_enc, dtype=float)`,
  entry: "cross_attention",
  gen:
`def gen(rng):
    nd = int(rng.integers(2, 8)); ne = int(rng.integers(2, 9))
    d = int(rng.integers(2, 7)); dv = int(rng.integers(2, 7))
    Q = rng.normal(0, 1, (nd, d)); K = rng.normal(0, 1, (ne, d)); V = rng.normal(0, 1, (ne, dv))
    if rng.random() < 0.45:
        # huge logits: softmax without max-subtraction -> inf/inf = NaN
        Q[0] = 100.0
        K = np.ones((ne, d)) * 10.0
    return {"Q_dec": Q, "K_enc": K, "V_enc": V}`,
  solve:
`def cross_attention(Q_dec, K_enc, V_enc):
    Q = np.asarray(Q_dec, dtype=float)
    K = np.asarray(K_enc, dtype=float)
    V = np.asarray(V_enc, dtype=float)
    S = Q @ K.T / math.sqrt(Q.shape[1])
    S = S - S.max(axis=1, keepdims=True)
    E = np.exp(S)
    W = E / E.sum(axis=1, keepdims=True)
    return W @ V`
},
{
  id: "m04-beam-step",
  module: "AI3",
  title: "One beam-search expansion step",
  diff: 2, minutes: 12,
  theory: "Beam search decodes text by keeping the `k` best partial hypotheses (a 'beam' is one partial output with a running score; each score is a sum of per-token log-probabilities, so longer outputs aren't unfairly favored until you normalize). One step expands every beam by every vocab token: candidate score = cumulative beam score + token log-prob. Sorting all B·V candidates and keeping the top k gives the next beam — deterministic, no sampling. A consistent tie-break (lower beam index, then lower token index) keeps results reproducible.",
  prompt: "Implement `beam_step(beam_scores, logprobs, k)` → list of `(beam_idx, token_idx, new_score)` tuples for the `k` best expansions, where `new_score = beam_scores[i] + logprobs[i, j]`. Sort by **decreasing** score; break ties by smaller `beam_idx`, then smaller `token_idx`. Indices must be plain ints, scores plain floats.\n\n```\nbeam_scores=[-1,-1], logprobs=[[-0.5,-0.5],[-0.2,-0.9]], k=2\n→ scores: (1,0)=-1.2, (0,0)&(0,1) tie at -1.5 (lower beam_idx wins) → [(1,0,-1.2),(0,0,-1.5)]\n```",
  hint: "Loop i over beams, j over vocab; collect (i, j, beam[i] + lp[i, j]); sort with key=lambda t: (-t[2], t[0], t[1]); take the first k.",
  starter:
`def beam_step(beam_scores, logprobs, k):
    bs = np.asarray(beam_scores, dtype=float)
    lp = np.asarray(logprobs, dtype=float)
    # your code
    return []`,
  entry: "beam_step",
  gen:
`def gen(rng):
    B = int(rng.integers(2, 5)); V = int(rng.integers(3, 9))
    # rounded to 1 decimal → candidate sums collide, so the tie-break rule is exercised
    return {"beam_scores": np.round(-rng.uniform(0, 5, B), 1),
            "logprobs": np.round(-rng.uniform(0, 4, (B, V)), 1),
            "k": int(rng.integers(1, B * V + 1))}`,
  solve:
`def beam_step(beam_scores, logprobs, k):
    bs = np.asarray(beam_scores, dtype=float)
    lp = np.asarray(logprobs, dtype=float)
    cand = []
    for i in range(bs.shape[0]):
        for j in range(lp.shape[1]):
            cand.append((int(i), int(j), float(bs[i] + lp[i, j])))
    cand.sort(key=lambda t: (-t[2], t[0], t[1]))
    return cand[:k]`
}
);

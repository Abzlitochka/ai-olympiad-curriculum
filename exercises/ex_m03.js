/* Exercises for M3 — Sequence NLP: Tagging, Detection, Dedup.
   Regex-free tokenization, vocabularies, n-grams, TF-IDF from scratch,
   cosine dedup, edit distance and a majority-tagging baseline — all
   first-principles, all deterministic. */

EXERCISES.push(
{
  id: "m03-tokenize",
  module: "ML6",
  title: "Regex-free tokenizer",
  diff: 1, minutes: 8,
  theory: "Half of NLP olympiad bugs are tokenization bugs. The regex-free baseline: lowercase the text, keep maximal runs of alphanumeric characters, and treat every other character as a separator. Simple, predictable, and fully under your control.",
  prompt: "Implement `tokenize(text)` → list of tokens. Lowercase `text`, keep runs of letters/digits (`str.isalnum`), split on every other character. Example: `'Cat,DOG-9!'` → `['cat', 'dog', '9']`.",
  hint: "Walk the string once with a buffer of alnum characters; flush it to the output whenever you hit a separator — and once more after the loop.",
  starter:
`def tokenize(text):
    # your code — keep alnum runs, split on everything else
    return text.lower().split()  # wrong — leaves punctuation attached`,
  entry: "tokenize",
  gen:
`def gen(rng):
    words = ["cat", "Dog", "BOBAI", "x9", "ml", "ai2", "sun", "ner"]
    seps = [" ", ",", ".", "!", "-", "  "]
    n = int(rng.integers(3, 10))
    ws = [str(w) for w in rng.choice(words, n)]
    parts = [w + str(rng.choice(seps)) for w in ws[:-1]] + [ws[-1]]
    if rng.random() < 0.5:
        parts[-1] += str(rng.choice(seps))
    # ~half the texts end in a bare token — a tokenizer that forgets the final flush must fail
    return {"text": "".join(parts)}`,
  solve:
`def tokenize(text):
    toks, cur = [], []
    for ch in text.lower():
        if ch.isalnum():
            cur.append(ch)
        elif cur:
            toks.append("".join(cur)); cur = []
    if cur:
        toks.append("".join(cur))
    return toks`
},
{
  id: "m03-build-vocab",
  module: "ML6",
  title: "Build the vocabulary dict",
  diff: 1, minutes: 6,
  theory: "A vocabulary maps each distinct token to an integer id — the first step before any count vector or embedding lookup. Numbering in order of first appearance keeps ids stable and reproducible.",
  prompt: "Implement `build_vocab(docs)` → dict mapping each distinct token to its index, numbered 0, 1, 2, … in order of first appearance across `docs` (a list of token lists).",
  hint: "One pass: `if t not in vocab: vocab[t] = len(vocab)`.",
  starter:
`def build_vocab(docs):
    vocab = {}
    # your code — watch the ordering rule in the prompt
    return vocab`,
  entry: "build_vocab",
  gen:
`def gen(rng):
    vocab = ["alpha", "beta", "gamma", "delta", "eps", "zeta"]
    m = int(rng.integers(2, 6))
    docs = [[str(w) for w in rng.choice(vocab, int(rng.integers(2, 7)))]
            for _ in range(m)]
    return {"docs": docs}`,
  solve:
`def build_vocab(docs):
    vocab = {}
    for d in docs:
        for t in d:
            if t not in vocab:
                vocab[t] = len(vocab)
    return vocab`
},
{
  id: "m03-ngrams",
  module: "ML6",
  title: "Word n-grams",
  diff: 2, minutes: 8,
  theory: "Word n-grams capture local context that bag-of-words loses ('not good' ≠ 'good'). They are just sliding windows over the token list — and the building block of every statistical language model.",
  prompt: "Implement `ngrams(tokens, n)` → list of tuples of `n` consecutive tokens. `ngrams(['a','b','c'], 2)` → `[('a','b'), ('b','c')]`. If `n` exceeds the number of tokens, return an empty list.",
  hint: "[tuple(tokens[i:i+n]) for i in range(len(tokens) - n + 1)] — the range is empty when the bound is non-positive.",
  starter:
`def ngrams(tokens, n):
    # your code
    return []`,
  entry: "ngrams",
  gen:
`def gen(rng):
    toks = [str(w) for w in rng.choice(["a", "b", "c", "d", "e", "f"],
                                      int(rng.integers(3, 12)))]
    return {"tokens": toks, "n": int(rng.integers(1, 5))}`,
  solve:
`def ngrams(tokens, n):
    return [tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]`
},
{
  id: "m03-tfidf",
  module: "ML6",
  title: "TF-IDF matrix from scratch",
  diff: 2, minutes: 30,
  theory: "TF-IDF turns documents into vectors where words frequent in this doc but rare overall get high weight: `tf(t,d) = count(t,d)/len(d)` and `idf(t) = ln(N/df(t)) + 1`, where `df` counts documents containing `t`. It is still the strongest zero-ML baseline for search and dedup tasks.",
  prompt: "Implement `tfidf(docs)` → a (len(docs), vocab_size) float matrix over the alphabetically sorted vocabulary of `docs` (a list of token lists). Cell = tf·idf with `tf(t,d) = count(t,d)/len(d)` and `idf(t) = log(N/df(t)) + 1` (natural log, `df` = number of docs containing `t`).",
  hint: "vocab = sorted(union of tokens); accumulate df via set(d) per doc; fill the tf matrix, then multiply each column by its idf in one broadcasted op.",
  starter:
`def tfidf(docs):
    vocab = sorted({t for d in docs for t in d})
    # your code
    return np.zeros((len(docs), len(vocab)))`,
  entry: "tfidf",
  gen:
`def gen(rng):
    words = ["red", "blue", "green", "cat", "dog", "ml", "ai"]
    m = int(rng.integers(2, 7))
    docs = [[str(w) for w in rng.choice(words, int(rng.integers(2, 8)))]
            for _ in range(m)]
    return {"docs": docs}`,
  solve:
`def tfidf(docs):
    vocab = sorted({t for d in docs for t in d})
    col = {t: i for i, t in enumerate(vocab)}
    N = len(docs)
    df = np.zeros(len(vocab))
    for d in docs:
        for t in set(d):
            df[col[t]] += 1
    idf = np.log(N / df) + 1.0
    M = np.zeros((N, len(vocab)))
    for i, d in enumerate(docs):
        for t in d:
            M[i, col[t]] += 1.0 / len(d)
    return M * idf`
},
{
  id: "m03-majority-tagger",
  module: "AI3",
  title: "Majority-tag sequence baseline",
  diff: 2, minutes: 30,
  theory: "Before any real tagger, build the majority baseline: each token gets the tag it most often had in training data, and unseen tokens get the globally most frequent tag. On NER/POS data this baseline is often fairly strong, and it shows how much a real model has to add.",
  prompt: "Implement `majority_tagger(train_tokens, train_tags, test_tokens)` → list of predicted tags for `test_tokens`. Use each token's most frequent tag in the parallel training lists; ties go to the alphabetically smaller tag. Tokens never seen in training get the globally most frequent tag (same tie rule).",
  hint: "A dict of collections.Counter per token, plus one global Counter for the fallback; resolve each with min(counter, key=lambda t: (-count, t)).",
  starter:
`def majority_tagger(train_tokens, train_tags, test_tokens):
    # your code
    return [train_tags[0][0] for _ in test_tokens]`,
  entry: "majority_tagger",
  gen:
`def gen(rng):
    words = ["cat", "run", "quick", "bob", "jump", "red"]
    tags = ["N", "V", "A"]
    tt, tg = [], []
    for _ in range(int(rng.integers(3, 8))):
        L = int(rng.integers(2, 6))
        ws = [str(w) for w in rng.choice(words, L)]
        tt.append(ws)
        tg.append([str(t) for t in rng.choice(tags, L)])
    test = [str(w) for w in rng.choice(words, int(rng.integers(2, 6)))]
    return {"train_tokens": tt, "train_tags": tg, "test_tokens": test}`,
  solve:
`def majority_tagger(train_tokens, train_tags, test_tokens):
    per = {}
    glob = collections.Counter()
    for ws, ts in zip(train_tokens, train_tags):
        for w, t in zip(ws, ts):
            per.setdefault(w, collections.Counter())[t] += 1
            glob[t] += 1
    best = {w: min(c, key=lambda t: (-c[t], t)) for w, c in per.items()}
    default = min(glob, key=lambda t: (-glob[t], t))
    return [best.get(w, default) for w in test_tokens]`
},
{
  id: "m03-levenshtein",
  module: "AI3",
  title: "Levenshtein edit distance",
  diff: 3, minutes: 30,
  theory: "Edit distance counts the minimum number of single-character insertions, deletions and substitutions that turn one string into the other — the standard fuzzy-matching tool for dedup and spell-correction tasks. Let `D[i][j]` be the distance between the first `i` chars of `a` and first `j` chars of `b`. Base cases `D[i][0]=i`, `D[0][j]=j`; then `D[i][j] = min(D[i-1][j]+1, D[i][j-1]+1, D[i-1][j-1] + (a[i]!=b[j]))` — delete, insert, or substitute/match. You only need the previous row, so keep two arrays of length `len(b)+1`.",
  prompt: "Implement `edit_distance(a, b)` → the Levenshtein distance between strings `a` and `b`. Insertion, deletion and substitution each cost 1.",
  hint: "prev = list(range(len(b)+1)); for each char of a build cur = [i], then cur.append(min(prev[j]+1, cur[-1]+1, prev[j-1] + (ca != cb))); swap rows.",
  starter:
`def edit_distance(a, b):
    # your code — DP over prefixes
    return abs(len(a) - len(b))  # wrong — ignores char mismatches`,
  entry: "edit_distance",
  gen:
`def gen(rng):
    alpha = list("abz")
    la, lb = int(rng.integers(0, 9)), int(rng.integers(0, 9))
    return {"a": "".join(rng.choice(alpha, la)),
            "b": "".join(rng.choice(alpha, lb))}`,
  solve:
`def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[-1] + 1,
                           prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]`
},
{
  id: "m03-dedup-pairs",
  module: "AI3",
  title: "Near-duplicate pair detection",
  diff: 3, minutes: 45,
  theory: "Near-duplicate detection comes up often in olympiad tasks: vectorize each document (raw token counts work), compute pairwise cosine similarity, and flag pairs above a threshold. Returning the pairs sorted keeps the output deterministic and diff-friendly.",
  prompt: "Implement `dup_pairs(docs, threshold)` → sorted list of `(i, j)` index pairs with `i < j`, whose cosine similarity is `>= threshold`. `docs` is a list of token lists; a doc's vector is its token-count vector over the sorted vocabulary; a zero vector has similarity 0 with everything.",
  hint: "Build the count matrix V, normalize its rows with the zero-norm guard, S = Vn @ Vn.T, then scan all i < j.",
  starter:
`def dup_pairs(docs, threshold):
    # your code
    return []`,
  entry: "dup_pairs",
  gen:
`def gen(rng):
    vocab = ["aa", "bb", "cc", "dd", "ee"]
    m = int(rng.integers(3, 8))
    docs = [[str(w) for w in rng.choice(vocab, int(rng.integers(2, 7)))]
            for _ in range(m)]
    if rng.random() < 0.15:
        docs[int(rng.integers(m))] = []   # empty doc -> zero vector, sim 0 with all
    if rng.random() < 0.6:          # inject a duplicate
        i, j = rng.choice(m, 2, replace=False)
        docs[int(j)] = list(docs[int(i)])
    if rng.random() < 0.2:
        # snap threshold onto a pair's realized cosine so ">=" vs ">" is decided
        vocab_all = sorted({t for d in docs for t in d})
        col = {t: k for k, t in enumerate(vocab_all)}
        def vec(dd):
            v = np.zeros(len(vocab_all))
            for t in dd:
                v[col[t]] += 1.0
            return v
        ii, jj = [int(x) for x in rng.choice(m, 2, replace=False)]
        a, b = vec(docs[ii]), vec(docs[jj])
        na, nb = float(np.linalg.norm(a)), float(np.linalg.norm(b))
        if na > 0 and nb > 0:
            # match the reference's normalise-then-dot order so the snapped
            # threshold lands bit-exactly on the realized cosine
            return {"docs": docs, "threshold": float((a / na) @ (b / nb))}
    return {"docs": docs,
            "threshold": float(rng.choice([0.71, 0.77, 0.83, 0.94]))}`,
  solve:
`def dup_pairs(docs, threshold):
    vocab = sorted({t for d in docs for t in d})
    col = {t: i for i, t in enumerate(vocab)}
    V = np.zeros((len(docs), len(vocab)))
    for i, d in enumerate(docs):
        for t in d:
            V[i, col[t]] += 1.0
    n = np.linalg.norm(V, axis=1, keepdims=True)
    Vn = np.where(n == 0, 0.0, V / np.where(n == 0, 1.0, n))
    S = Vn @ Vn.T
    out = []
    for i in range(len(docs)):
        for j in range(i + 1, len(docs)):
            if S[i, j] >= threshold:
                out.append((i, j))
    return out`
}
);

EXERCISES.push(
{
  id: "m03-nb-classify",
  module: "ML6",
  title: "Multinomial naive Bayes",
  diff: 3, minutes: 60,
  theory: "The strongest text baseline you can write in 20 lines: multinomial naive Bayes. Each class gets a token distribution estimated by counting with Laplace smoothing — P(t|c) = (count(t,c) + a) / (tokens_in_c + a·V) — and each doc is scored by a sum of log-probabilities plus a class prior. Work in log space: a raw product of hundreds of small probabilities underflows to zero.",
  prompt: "Implement `nb_predict(train_docs, train_labels, test_docs, alpha)` → list of predicted labels. `train_docs` is a list of token lists with parallel string labels. Score each test doc against class `c` as `log(ndoc_c / N)` plus, for every token occurrence, `log((count(t,c) + alpha) / (total_c + alpha * V))`, where `ndoc_c` is the number of training docs labeled `c`, `total_c` their total token count, and `V` the vocabulary size over all training docs. Predict the highest-scoring class; ties go to the alphabetically smaller label.",
  hint: "One collections.Counter plus a token total per class; then per test doc take min(classes, key=lambda c: (-score(c), c)). Counters return 0 for unseen tokens, so OOV words need no special case.",
  starter:
`def nb_predict(train_docs, train_labels, test_docs, alpha):
    # your code — the majority-class baseline below is the thing to beat
    maj = collections.Counter(train_labels).most_common(1)[0][0]
    return [maj for _ in test_docs]`,
  entry: "nb_predict",
  gen:
`def gen(rng):
    words = ["win", "lose", "goal", "bad", "ok", "fun", "epic"]
    labels = ["neg", "pos"]
    m = int(rng.integers(4, 10))
    tr_docs = [[str(w) for w in rng.choice(words, int(rng.integers(1, 6)))]
               for _ in range(m)]
    tr_lab = [str(c) for c in rng.choice(labels, m)]
    te_docs = [[str(w) for w in rng.choice(words + ["zz", "new"],
                                          int(rng.integers(1, 5)))]
               for _ in range(int(rng.integers(1, 5)))]
    return {"train_docs": tr_docs, "train_labels": tr_lab,
            "test_docs": te_docs, "alpha": float(rng.choice([0.5, 1.0]))}`,
  solve:
`def nb_predict(train_docs, train_labels, test_docs, alpha):
    labels = sorted(set(train_labels))
    counts = {c: collections.Counter() for c in labels}
    totals = {c: 0 for c in labels}
    ndoc = collections.Counter()
    for d, c in zip(train_docs, train_labels):
        ndoc[c] += 1
        for t in d:
            counts[c][t] += 1
            totals[c] += 1
    V = len({t for d in train_docs for t in d})
    N = len(train_labels)
    out = []
    for d in test_docs:
        def score(c):
            s = math.log(ndoc[c] / N)
            den = totals[c] + alpha * V
            for t in d:
                s += math.log((counts[c][t] + alpha) / den)
            return s
        out.append(min(labels, key=lambda c: (-score(c), c)))
    return out`
},
{
  id: "m03-dedup-clusters",
  module: "AI3",
  title: "Dedup clusters via union-find",
  diff: 3, minutes: 60,
  theory: "Pairwise duplicate detection gives you edges; real dedup needs the connected components — if A is near B and B is near C, all three form one cluster even when A and C are dissimilar. Union-find merges pairs in near-linear time: `parent[i]` starts as `i`; `find(x)` follows parents to the root (and re-points each node on the path straight at the root — path compression); `union(a,b)` sets `parent[find(a)] = find(b)`. After unioning every duplicate pair, indices sharing a root form one cluster.",
  prompt: "Implement `dup_clusters(docs, threshold)` → list of clusters of doc indices. A doc's vector is its token-count vector over the sorted vocabulary; pairs whose cosine similarity is `>= threshold` get merged, transitively (a zero vector has similarity 0 with everything). Each cluster is a sorted list of indices; clusters are ordered by their first index. Every index `0..m-1` appears in exactly one cluster.",
  hint: "Same count-matrix + row-normalize + S = Vn @ Vn.T pipeline as pair detection; then parent = list(range(m)), find(x) with path halving, union roots of every qualifying pair, group indices by root.",
  starter:
`def dup_clusters(docs, threshold):
    # your code — returning singletons is a (wrong) starting point
    return [[i] for i in range(len(docs))]`,
  entry: "dup_clusters",
  gen:
`def gen(rng):
    vocab = ["aa", "bb", "cc", "dd", "ee"]
    m = int(rng.integers(4, 9))
    docs = [[str(w) for w in rng.choice(vocab, int(rng.integers(2, 7)))]
            for _ in range(m)]
    if rng.random() < 0.15:
        docs[int(rng.integers(m))] = []   # empty doc -> zero vector, sim 0 with all
    if rng.random() < 0.7:          # inject a duplicate edge
        i, j = rng.choice(m, 2, replace=False)
        docs[int(j)] = list(docs[int(i)])
    threshold = float(rng.choice([0.71, 0.8, 0.9, 0.95]))
    # boundary pair: a shared tokens + 1 extra → cosine ≈ a/(a+1)-ish, and
    # half the time the threshold sits exactly ON the pair's similarity,
    # so ">=" vs ">" is exercised (spec says >=)
    if rng.random() < 0.5 and m >= 2:
        i, j = [int(v) for v in rng.choice(m, 2, replace=False)]
        a = int(rng.integers(1, 4))
        shared = [str(w) for w in rng.choice(vocab, a, replace=False)]
        rest = [w for w in vocab if w not in shared] or vocab
        docs[i] = shared
        docs[j] = shared + [str(rng.choice(rest))]
        if rng.random() < 0.5:
            # cosine = a dot-products of (1/sqrt(a))(1/sqrt(a+1)) — computed the
            # same way the grader does, so the pair lands exactly ON the
            # threshold and ">=" (spec) vs ">" (bug) diverge
            u1 = np.ones(a) / np.linalg.norm(np.ones(a))
            u2 = np.ones(a + 1) / np.linalg.norm(np.ones(a + 1))
            threshold = float(np.dot(u1, u2[:a]))
    return {"docs": docs,
            "threshold": threshold}`,
  solve:
`def dup_clusters(docs, threshold):
    vocab = sorted({t for d in docs for t in d})
    col = {t: i for i, t in enumerate(vocab)}
    m = len(docs)
    V = np.zeros((m, len(vocab)))
    for i, d in enumerate(docs):
        for t in d:
            V[i, col[t]] += 1.0
    n = np.linalg.norm(V, axis=1, keepdims=True)
    Vn = np.where(n == 0, 0.0, V / np.where(n == 0, 1.0, n))
    S = Vn @ Vn.T
    parent = list(range(m))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for i in range(m):
        for j in range(i + 1, m):
            if S[i, j] >= threshold:
                ri, rj = find(i), find(j)
                if ri != rj:
                    parent[rj] = ri
    groups = {}
    for i in range(m):
        groups.setdefault(find(i), []).append(i)
    return sorted(groups.values(), key=lambda g: g[0])`
},
{
  id: "m03-span-f1",
  module: "AI3",
  title: "BIO span extraction + span-level F1",
  diff: 3, minutes: 15,
  theory: "NER tasks (FAIO, NEOAI) are scored on whole entity spans, not per-tag accuracy. Convert the BIO tag list into a set of (start, end, type) spans — `end` exclusive — then score exact span matches with precision/recall/F1. A predicted span is correct only if its boundaries AND its type all match a gold span.",
  prompt: "Implement `span_f1(gold, pred)` → the span-level F1 between two BIO tag lists (each a flat list of `'B-X'`/`'I-X'`/`'O'` strings). Span rules: `B-X` closes any open span and opens a new `(i, …, X)` span; `I-X` extends the open span only if its type is `X`, otherwise it opens a new `(i, …, X)` span itself; `O` closes the open span; a span left open at the end closes at `len(tags)`. Build a set of `(start, end, type)` per list, then `tp = |gold ∩ pred|`, `precision = tp/|pred|`, `recall = tp/|gold|`, `F1 = 2PR/(P+R)`. Return `1.0` when both sets are empty, `0.0` when exactly one is empty or `tp == 0` (no overlap → `P+R = 0`, guard the division).\n\n```\ngold=[B-PER,I-PER,O,B-LOC] pred=[B-PER,O,O,B-LOC]\n→ gold spans {(0,2,PER),(3,4,LOC)}; pred {(0,1,PER),(3,4,LOC)}; tp=1 → P=1/2 R=1/2 → 0.5\n```",
  hint: "Walk the list keeping open=(start,type); B/O/mismatched-I flush it into the set. Then f1 = 2*tp/(2*tp + fp + fn).",
  starter:
`def span_f1(gold, pred):
    def spans(tags):
        # your code
        return set()
    g, p = spans(gold), spans(pred)
    # your code
    return 0.0`,
  entry: "span_f1",
  gen:
`def gen(rng):
    types = ["PER", "LOC", "ORG"]
    n = int(rng.integers(4, 12))
    def make():
        tags = []
        while len(tags) < n:
            if rng.random() < 0.55:
                tags.append("O")
            else:
                t = str(rng.choice(types))
                L = int(rng.integers(1, 4))
                tags.append("B-" + t)
                tags += ["I-" + t] * (L - 1)
        return tags[:n]
    gold = make()
    if rng.random() < 0.15:
        return {"gold": ["O"] * n, "pred": ["O"] * n}   # both empty -> 1.0
    # corrupt a copy of gold so pred is usually close-but-not-equal
    pred = list(gold)
    for i in range(n):
        if rng.random() < 0.3:
            pred[i] = "O" if pred[i] != "O" else "B-" + str(rng.choice(types))
        elif pred[i].startswith("I-") and rng.random() < 0.25:
            others = [t for t in types if t != pred[i][2:]]
            pred[i] = "I-" + str(rng.choice(others))  # mismatched I- opens a new span
    return {"gold": gold, "pred": pred}`,
  solve:
`def span_f1(gold, pred):
    def spans(tags):
        s, st, ty = set(), -1, None
        for i, t in enumerate(tags):
            if t.startswith("B-"):
                if st >= 0: s.add((st, i, ty))
                st, ty = i, t[2:]
            elif t.startswith("I-"):
                if st < 0 or ty != t[2:]:
                    if st >= 0: s.add((st, i, ty))
                    st, ty = i, t[2:]
            else:
                if st >= 0: s.add((st, i, ty))
                st, ty = -1, None
        if st >= 0: s.add((st, len(tags), ty))
        return s
    g, p = spans(gold), spans(pred)
    tp = len(g & p)
    if not g and not p: return 1.0
    if tp == 0: return 0.0
    P, R = tp / len(p), tp / len(g)
    return 2 * P * R / (P + R)`
}
);

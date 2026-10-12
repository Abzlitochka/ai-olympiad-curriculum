/* Exercises for M11 — Adversarial ML & Detection Games. */

EXERCISES.push(
{
  id: "m11-fgsm",
  module: "AI2",
  title: "FGSM perturbation",
  diff: 1, minutes: 8,
  theory: "The Fast Gradient Sign Method crafts an adversarial example by nudging every input coordinate along the sign of the loss gradient: x' = x + eps * sign(grad). Because inputs must stay valid (e.g. pixel intensities), the result is clipped to [0, 1]. It needs one gradient and one step, which makes it the usual baseline attack.",
  prompt: "Implement `fgsm(x, grad, eps)` → the adversarial example `clip(x + eps * sign(grad), 0, 1)`. `x` is already in [0, 1]; `eps > 0`.",
  hint: "np.sign(grad) gives -1/0/+1 per coordinate; np.clip bounds the result.",
  starter:
`def fgsm(x, grad, eps):
    x = np.asarray(x, dtype=float)
    # your code
    return x`,
  entry: "fgsm",
  gen:
`def gen(rng):
    n = int(rng.integers(4, 20))
    return {"x": rng.random(n),
            "grad": rng.normal(0, 1, n),
            "eps": float(rng.uniform(0.01, 0.3))}`,
  solve:
`def fgsm(x, grad, eps):
    x = np.asarray(x, dtype=float)
    grad = np.asarray(grad, dtype=float)
    return np.clip(x + eps * np.sign(grad), 0.0, 1.0)`
},
{
  id: "m11-perturb-norms",
  module: "AI2",
  title: "Perturbation norms",
  diff: 1, minutes: 8,
  theory: "Attacks are compared by how large the perturbation delta = x_adv - x is. The two standard measures are the L2 norm sqrt(sum(delta^2)) — total energy — and the Linf norm max|delta| — the worst single-coordinate change, which is what FGSM's eps actually bounds. Detection thresholds are usually stated in one of these norms.",
  prompt: "Implement `perturb_norms(x, x_adv)` → a list `[l2, linf]`: the L2 and L-infinity norms of `x_adv - x`.",
  hint: "d = x_adv - x; L2 = sqrt((d**2).sum()), Linf = abs(d).max().",
  starter:
`def perturb_norms(x, x_adv):
    # your code
    return [0.0, 0.0]`,
  entry: "perturb_norms",
  gen:
`def gen(rng):
    n = int(rng.integers(4, 20))
    x = rng.random(n)
    x_adv = np.clip(x + rng.normal(0, 0.2, n), 0.0, 1.0)
    return {"x": x, "x_adv": x_adv}`,
  solve:
`def perturb_norms(x, x_adv):
    d = np.asarray(x_adv, dtype=float) - np.asarray(x, dtype=float)
    return [float(np.sqrt((d ** 2).sum())), float(np.abs(d).max())]`
},
{
  id: "m11-smooth-vote",
  module: "AI2",
  title: "Randomized-smoothing vote",
  diff: 2, minutes: 10,
  theory: "Randomized smoothing defends a classifier by running it on many noisy copies of the input and taking a majority vote over the predicted labels — the smoothed prediction is whichever class wins the poll. np.bincount tallies integer votes; np.argmax returns the first index of the maximum, which conveniently implements 'ties go to the smallest class id'.",
  prompt: "Implement `majority_vote(votes)` → the winning class id (an int). `votes` is a list of class ids, one per noisy sample. On a tie, return the smallest class id.",
  hint: "np.bincount(votes).argmax() — argmax breaks ties toward the lowest index.",
  starter:
`def majority_vote(votes):
    # your code
    return -1`,
  entry: "majority_vote",
  gen:
`def gen(rng):
    k = int(rng.integers(2, 6)); n = int(rng.integers(5, 30))
    return {"votes": rng.integers(0, k, n).tolist()}`,
  solve:
`def majority_vote(votes):
    return int(np.argmax(np.bincount(np.asarray(votes))))`
},
{
  id: "m11-burstiness",
  module: "AI3",
  title: "Sentence-length burstiness",
  diff: 2, minutes: 10,
  theory: "Burstiness is one stylometric signal used in machine-text detection: human writing tends to vary sentence length more than model output. It is a weak signal on its own and easy to evade. The feature is just the (population) standard deviation of sentence lengths — low burstiness is suspicious. Note that np.std uses ddof=0 (population std) by default.",
  prompt: "Implement `burstiness(sent_lens)` → the population standard deviation (ddof=0) of the sentence lengths, as a float.",
  hint: "float(np.std(np.asarray(sent_lens, dtype=float))).",
  starter:
`def burstiness(sent_lens):
    # your code
    return 0.0`,
  entry: "burstiness",
  gen:
`def gen(rng):
    m = int(rng.integers(4, 20))
    if rng.random() < 0.3:
        sent_lens = rng.integers(8, 13, m).tolist()      # flat, machine-like
    else:
        sent_lens = rng.integers(1, 40, m).tolist()      # bursty
    return {"sent_lens": sent_lens}`,
  solve:
`def burstiness(sent_lens):
    return float(np.std(np.asarray(sent_lens, dtype=float)))`
},
{
  id: "m11-ai-score",
  module: "AI3",
  title: "AI-text detector score",
  diff: 3, minutes: 15,
  theory: "Real detectors combine several weak stylometric features into one calibrated score. Here: burstiness b = std(sentence lengths) and type-token ratio ttr = unique_tokens / total_tokens; low values of both are AI-like. Squash a linear evidence term with the logistic sigmoid s(z) = 1/(1+e^-z) so the output is a probability-like number in (0, 1).",
  prompt: "Implement `ai_score(sent_lens, tokens)`:\n\n```\nb   = np.std(sent_lens)              # population std\nttr = len(set(tokens)) / len(tokens)\nz   = 1.5 * (4.0 - b) + 3.0 * (0.6 - ttr)\nreturn 1 / (1 + exp(-z))             # sigmoid, higher = more AI-like\n```",
  hint: "Compute the two features, combine into z, squash with math.exp. No clipping needed — z stays small.",
  starter:
`def ai_score(sent_lens, tokens):
    # your code
    return 0.5`,
  entry: "ai_score",
  gen:
`def gen(rng):
    m = int(rng.integers(5, 16))
    sent_lens = rng.integers(2, 30, m).tolist()
    vocab = int(rng.integers(5, 40))
    t = int(rng.integers(10, 40))
    tokens = [f"w{int(rng.integers(0, vocab))}" for _ in range(t)]
    return {"sent_lens": sent_lens, "tokens": tokens}`,
  solve:
`def ai_score(sent_lens, tokens):
    b = float(np.std(np.asarray(sent_lens, dtype=float)))
    ttr = len(set(tokens)) / len(tokens)
    z = 1.5 * (4.0 - b) + 3.0 * (0.6 - ttr)
    return 1.0 / (1.0 + math.exp(-z))`
}
);

EXERCISES.push(
{
  id: "m11-pgd",
  module: "AI2",
  title: "Multi-step PGD attack",
  diff: 3, minutes: 45,
  theory: "Projected gradient methods take a small step, then return to the allowed region. This exercise maximizes a score, so move along the gradient rather than against it. Differentiate the scorer from output back to input using the chain rule; the local derivative of tanh(u) is 1 - tanh(u)^2. Recompute the gradient at every step because the scorer is nonlinear. The L-infinity constraint means each coordinate stays within eps of the ORIGINAL input, as well as inside [0, 1]. For x = 0.95 and eps = 0.1, that coordinate must stay in [0.85, 1.0] throughout the run.",
  prompt: "Implement `pgd(x, W1, b1, w2, eps, alpha, steps)` → an adversarial point maximizing `f = w2 . tanh(x @ W1 + b1)`. Each of the `steps` iterations: evaluate the gradient at the current point, move `alpha` along `sign(grad)`, then clip into `[x - eps, x + eps]` intersected with `[0, 1]`. Return the final point.",
  hint: "u = adv @ W1 + b1; h = tanh(u); grad = W1 @ (w2 * (1 - h**2)). Bounds: lo = clip(x - eps, 0, 1), hi = clip(x + eps, 0, 1).",
  starter:
`def pgd(x, W1, b1, w2, eps, alpha, steps):
    x = np.asarray(x, dtype=float)
    # your code
    return x`,
  entry: "pgd",
  gen:
`def gen(rng):
    n = int(rng.integers(4, 8)); h = int(rng.integers(3, 6))
    return {"x": rng.random(n),
            "W1": rng.normal(0, 1, (n, h)),
            "b1": rng.normal(0, 0.5, h),
            "w2": rng.normal(0, 1, h),
            "eps": float(rng.uniform(0.05, 0.25)),
            "alpha": float(rng.uniform(0.01, 0.08)),
            "steps": int(rng.integers(3, 8))}`,
  solve:
`def pgd(x, W1, b1, w2, eps, alpha, steps):
    x = np.asarray(x, dtype=float)
    W1 = np.asarray(W1, dtype=float)
    b1 = np.asarray(b1, dtype=float)
    w2 = np.asarray(w2, dtype=float)
    lo = np.clip(x - eps, 0.0, 1.0)
    hi = np.clip(x + eps, 0.0, 1.0)
    adv = x.copy()
    for _ in range(steps):
        h = np.tanh(adv @ W1 + b1)
        grad = W1 @ (w2 * (1.0 - h ** 2))
        adv = np.clip(adv + alpha * np.sign(grad), lo, hi)
    return adv`
},
{
  id: "m11-cw-margin",
  module: "AI2",
  title: "Carlini-Wagner margin loss",
  diff: 1, minutes: 8,
  theory: "The C&W attack doesn't push down the true logit directly — it maximizes a margin: how far the best wrong class sits above the true class's logit. For an untargeted attack on label y: margin = max_{i != y}(z_i) - z_y, and the objective clamps it at -kappa so the attacker stops once the misclassification margin exceeds kappa. Working on raw logits rather than softmax keeps the loss well-conditioned.",
  prompt: "Implement `cw_margin(logits, y, kappa)` → the untargeted C&W hinge `max(max_{i != y} z_i - z_y, -kappa)` as a float. `logits` is a 1-D score vector, `y` the true class index, `kappa >= 0`.",
  hint: "Max over all indices except y (np.delete or a masked array), subtract z[y], then np.maximum with -kappa.",
  starter:
`def cw_margin(logits, y, kappa):
    # your code
    return 0.0`,
  entry: "cw_margin",
  gen:
`def gen(rng):
    k = int(rng.integers(3, 7))
    y = int(rng.integers(0, k))
    logits = rng.normal(0, 3, k)
    if rng.random() < 0.4:
        logits[y] += rng.uniform(5, 10)   # strong true logit -> max(margin, -kappa) actually clamps
    return {"logits": logits, "y": y,
            "kappa": float(rng.uniform(0.0, 6.0))}`,
  solve:
`def cw_margin(logits, y, kappa):
    z = np.asarray(logits, dtype=float)
    best = max(z[i] for i in range(len(z)) if i != y)
    return float(max(best - z[y], -kappa))`
},
{
  id: "m11-watermark-z",
  module: "AI3",
  title: "Watermark z-test",
  diff: 2, minutes: 10,
  theory: "LLM watermarks secretly split the vocabulary into 'green' and 'red' lists (fraction gamma green) and bias sampling toward green tokens. Detection asks: is the green count suspiciously high? Under the null hypothesis (un-watermarked text) each token is green independently with probability `gamma`, so `g` greens out of `n` follows a Binomial(n, gamma) — expect `n·gamma` with spread `sqrt(n·gamma·(1-gamma))`. The z-score `z = (g - n*gamma) / sqrt(n*gamma*(1-gamma))` measures how many standard deviations above expectation the count is; flag text whose z exceeds a threshold — the same hypothesis-testing machinery as any anomaly detector.",
  prompt: "Implement `watermark_detect(tokens, green, gamma, thresh)` → True if and only if the text is flagged, i.e. `z = (g - n*gamma) / sqrt(n*gamma*(1-gamma)) > thresh`, where `g` counts tokens whose id is in `green` and `n = len(tokens)`. Return a plain bool.",
  hint: "g = sum(t in greenset for t in tokens); n*gamma*(1-gamma) is the null variance; compare z to thresh with >.",
  starter:
`def watermark_detect(tokens, green, gamma, thresh):
    # your code
    return False`,
  entry: "watermark_detect",
  gen:
`def gen(rng):
    V = int(rng.integers(15, 41)); gamma = float(rng.choice([0.25, 0.5]))
    gsize = max(1, int(round(gamma * V)))
    green = [int(t) for t in rng.choice(V, gsize, replace=False)]
    greenset = set(green)
    n = int(rng.integers(20, 61))
    thresh = float(rng.choice([1.5, 2.0, 2.5, 3.0]))
    if rng.random() < 0.45:
        # boundary arm: pick z relative to thresh, then build tokens with the
        # green count that lands there — exercises the strict ">" at the cutoff
        zt = thresh + float(rng.choice([-0.6, -0.15, 0.0, 0.15, 0.6]))
        g_target = max(0, min(n, int(round(zt * math.sqrt(n * gamma * (1 - gamma)) + n * gamma))))
        non = [t for t in range(V) if t not in greenset] or list(range(V))
        toks = ([int(t) for t in rng.choice(green, g_target)] +
                [int(t) for t in rng.choice(non, n - g_target)])
        rng.shuffle(toks)
        if rng.random() < 0.4:
            # snap thresh to the realized z so ">" vs ">=" is decided exactly
            thresh = (g_target - n * gamma) / math.sqrt(n * gamma * (1.0 - gamma))
    else:
        p = (gamma - float(rng.uniform(0.0, 0.12))) if rng.random() < 0.5             else (gamma + float(rng.uniform(0.12, 0.4)))   # strictly clean vs strictly watermarked
        toks = []
        for _ in range(n):
            if greenset and rng.random() < p:
                toks.append(int(rng.choice(green)))
            else:
                toks.append(int(rng.integers(0, V)))
    return {"tokens": toks, "green": green, "gamma": gamma,
            "thresh": thresh}`,
  solve:
`def watermark_detect(tokens, green, gamma, thresh):
    greenset = set(green)
    n = len(tokens)
    g = sum(1 for t in tokens if t in greenset)
    z = (g - n * gamma) / math.sqrt(n * gamma * (1.0 - gamma))
    return bool(z > thresh)`
}
);

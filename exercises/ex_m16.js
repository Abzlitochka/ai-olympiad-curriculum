/* Exercises for M16 — Neural Nets from Scratch.
   Format follows exercises/ex_m00.js (see exercises/engine.js for rules). */

EXERCISES.push(
{
  id: "m16-activations",
  module: "AI1",
  title: "Activation trio",
  diff: 1, minutes: 8,
  theory: "Three standard activation functions: ReLU zeroes out negatives (cheap, sparse gradients), sigmoid squashes to (0, 1) via 1/(1+e^-z), and tanh squashes to (-1, 1) and is zero-centered. They are reused in most of the later exercises.",
  prompt: "Implement `activate(z, name)`: apply the activation element-wise to the array `z`, where `name` is `\"relu\"`, `\"sigmoid\"` or `\"tanh\"`.\n\n```\nactivate([-1, 0, 2], \"relu\") → [0, 0, 2]\n```",
  hint: "np.maximum(z, 0), 1 / (1 + np.exp(-z)), np.tanh(z).",
  starter:
`def activate(z, name):
    z = np.asarray(z, dtype=float)
    # your code
    return z`,
  entry: "activate",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 25))
    z = rng.normal(0, 3, n)
    name = str(rng.choice(["relu", "sigmoid", "tanh"]))
    return {"z": z, "name": name}`,
  solve:
`def activate(z, name):
    z = np.asarray(z, dtype=float)
    if name == "relu":
        return np.maximum(z, 0.0)
    if name == "sigmoid":
        return 1.0 / (1.0 + np.exp(-z))
    if name == "tanh":
        return np.tanh(z)
    raise ValueError(name)`
},
{
  id: "m16-softmax",
  module: "AI1",
  title: "Numerically stable softmax",
  diff: 1, minutes: 8,
  theory: "Softmax turns a vector of logits into probabilities: p_i = e^{z_i} / sum_j e^{z_j}. Naively exponentiating large logits overflows to inf (exp blows up around +710 in float64, +89 in float32); the standard fix is subtracting the row max first, which leaves the result mathematically identical.",
  prompt: "Implement `softmax(Z)` for a 2-D matrix: apply softmax **row-wise** (axis=1). Must stay correct for large logits (e.g. ±60) — no NaN/inf allowed.",
  hint: "M = Z.max(axis=1, keepdims=True); E = np.exp(Z - M); return E / E.sum(axis=1, keepdims=True).",
  starter:
`def softmax(Z):
    Z = np.asarray(Z, dtype=float)
    # your code
    return Z`,
  entry: "softmax",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 10)); k = int(rng.integers(2, 8))
    Z = rng.normal(0, 20, (n, k))
    if rng.random() < 0.4:
        Z = Z + float(rng.uniform(900, 1400))   # exp overflows without max-subtraction
    return {"Z": Z}`,
  solve:
`def softmax(Z):
    Z = np.asarray(Z, dtype=float)
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)`
},
{
  id: "m16-cross-entropy",
  module: "AI1",
  title: "Cross-entropy from logits",
  diff: 2, minutes: 12,
  theory: "Cross-entropy loss for the true class is -log p_y, averaged over the batch. Never compute softmax and then log separately — it loses precision and can produce log(0). Use the log-sum-exp identity: CE = log sum_j e^{z_j} - z_y, with max subtraction for stability.",
  prompt: "Implement `cross_entropy(logits, y)`: `logits` is an (n, k) matrix of raw scores, `y` an (n,) integer array of true class indices. Return the **mean** cross-entropy over the batch as a float, computed in a numerically stable way.",
  hint: "Shift by the row max m, then lse = m + log(exp(Z - m).sum(axis=1)). The loss per row is lse - z_y; index z_y with np.arange(n) and y.",
  starter:
`def cross_entropy(logits, y):
    logits = np.asarray(logits, dtype=float)
    # your code
    return 0.0`,
  entry: "cross_entropy",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 12)); k = int(rng.integers(2, 8))
    y = rng.integers(0, k, n)
    logits = rng.normal(0, 4, (n, k))
    if rng.random() < 0.4:
        # z_y ~800 below the row max: naive -log(softmax) underflows to inf;
        # a stable log-sum-exp stays finite
        logits[np.arange(n), y] -= float(rng.uniform(800, 900))
    return {"logits": logits, "y": y}`,
  solve:
`def cross_entropy(logits, y):
    Z = np.asarray(logits, dtype=float)
    y = np.asarray(y)
    m = Z.max(axis=1)
    lse = m + np.log(np.exp(Z - m[:, None]).sum(axis=1))
    return float(np.mean(lse - Z[np.arange(len(y)), y]))`
},
{
  id: "m16-mlp-forward",
  module: "AI1",
  title: "One-hidden-layer MLP forward",
  diff: 2, minutes: 10,
  theory: "A one-hidden-layer MLP is two affine maps with a nonlinearity in between: H = ReLU(X @ W1 + b1), out = H @ W2 + b2. Shapes: X is (n, d), W1 is (d, h), W2 is (h, k) — the hidden size h is whatever the matrices say it is.",
  prompt: "Implement `mlp_forward(X, W1, b1, W2, b2)`: compute the forward pass `ReLU(X @ W1 + b1) @ W2 + b2` and return the output logits (no softmax on the output).",
  hint: "H = np.maximum(X @ W1 + b1, 0); return H @ W2 + b2.",
  starter:
`def mlp_forward(X, W1, b1, W2, b2):
    # your code — two layers with a ReLU between
    return X @ W1 + b1  # wrong — missing ReLU and the second layer`,
  entry: "mlp_forward",
  gen:
`def gen(rng):
    n, d = int(rng.integers(2, 9)), int(rng.integers(2, 7))
    h, k = int(rng.integers(2, 7)), int(rng.integers(2, 5))
    return {"X": rng.normal(0, 1, (n, d)),
            "W1": rng.normal(0, 1, (d, h)), "b1": rng.normal(0, 1, h),
            "W2": rng.normal(0, 1, (h, k)), "b2": rng.normal(0, 1, k)}`,
  solve:
`def mlp_forward(X, W1, b1, W2, b2):
    H = np.maximum(np.asarray(X) @ np.asarray(W1) + np.asarray(b1), 0.0)
    return H @ np.asarray(W2) + np.asarray(b2)`
},
{
  id: "m16-linear-backward",
  module: "AI1",
  title: "Linear layer backward",
  diff: 2, minutes: 12,
  theory: "The upstream gradient dY tells you how the loss changes when each output changes. Apply the chain rule to one weight first: in y = x*w + b, an input x = 3 and upstream gradient 2 give a weight-gradient contribution of 6 and a bias-gradient contribution of 2. A shared weight affects every sample, so add its contributions across the batch. Translate that reasoning to arrays: the weight gradient must have shape (d, k), and the bias gradient shape (k,). Do not divide by the batch size again; any averaging in the loss is already included in dY.",
  prompt: "Implement `linear_backward(X, dY)`: `X` is the (n, d) input of a linear layer Y = X @ W + b, and `dY` is the (n, k) upstream gradient. Return a tuple `(dW, db)` — gradients w.r.t. W (shape (d, k)) and b (shape (k,)).",
  hint: "dW = X.T @ dY; db = dY.sum(axis=0).",
  starter:
`def linear_backward(X, dY):
    X = np.asarray(X, dtype=float)
    dY = np.asarray(dY, dtype=float)
    # your code
    return np.zeros((X.shape[1], dY.shape[1])), np.zeros(dY.shape[1])`,
  entry: "linear_backward",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 9)); d = int(rng.integers(2, 7)); k = int(rng.integers(2, 6))
    return {"X": rng.normal(0, 1, (n, d)), "dY": rng.normal(0, 1, (n, k))}`,
  solve:
`def linear_backward(X, dY):
    X = np.asarray(X, dtype=float)
    dY = np.asarray(dY, dtype=float)
    return X.T @ dY, dY.sum(axis=0)`
},
{
  id: "m16-momentum-step",
  module: "AI1",
  title: "SGD with momentum",
  diff: 2, minutes: 10,
  theory: "Momentum keeps a velocity vector that accumulates a moving sum of past gradients (PyTorch convention): v <- mu * v + g, then w <- w - lr * v. It damps oscillations across a valley's walls and accelerates along directions where the gradient is consistent.",
  prompt: "Implement `momentum_step(w, g, v, lr, mu)`: perform one SGD-with-momentum update using the convention `v_new = mu * v + g`, `w_new = w - lr * v_new`. Return the tuple `(w_new, v_new)`.",
  hint: "Update v first, then use the NEW v for the weight step: v_new = mu * v + g; w_new = w - lr * v_new.",
  starter:
`def momentum_step(w, g, v, lr, mu):
    w = np.asarray(w, dtype=float)
    g = np.asarray(g, dtype=float)
    v = np.asarray(v, dtype=float)
    # your code — naive SGD below is wrong, momentum must use v
    return w - lr * g, v`,
  entry: "momentum_step",
  gen:
`def gen(rng):
    d = int(rng.integers(2, 8))
    return {"w": rng.normal(0, 1, d), "g": rng.normal(0, 1, d),
            "v": rng.normal(0, 1, d),
            "lr": float(rng.choice([0.001, 0.01, 0.1])),
            "mu": float(rng.choice([0.5, 0.9, 0.99]))}`,
  solve:
`def momentum_step(w, g, v, lr, mu):
    w = np.asarray(w, dtype=float)
    g = np.asarray(g, dtype=float)
    v = np.asarray(v, dtype=float)
    v_new = mu * v + g
    return w - lr * v_new, v_new`
},
{
  id: "m16-adam-step",
  module: "AI1",
  title: "Adam update step",
  diff: 3, minutes: 30,
  theory: "Adam maintains two exponential moving averages: m = b1*m + (1-b1)*g for the mean gradient and v = b2*v + (1-b2)*g^2 for its square. Since m and v start at zero they are biased toward zero in early steps — correct this with m_hat = m/(1-b1^t) and v_hat = v/(1-b2^t), then w <- w - lr * m_hat / (sqrt(v_hat) + eps).",
  prompt: "Implement `adam_step(w, g, m, v, t, lr, b1, b2, eps)`: one Adam update at time step `t` (1-based, so t=1 is the first step). Update `m` and `v` first, apply bias correction, then update `w`. Return `(w_new, m_new, v_new)`.",
  hint: "m = b1*m + (1-b1)*g; v = b2*v + (1-b2)*g**2; mhat = m/(1-b1**t); vhat = v/(1-b2**t); w_new = w - lr*mhat/(np.sqrt(vhat)+eps).",
  starter:
`def adam_step(w, g, m, v, t, lr, b1, b2, eps):
    w = np.asarray(w, dtype=float)
    g = np.asarray(g, dtype=float)
    m = np.asarray(m, dtype=float)
    v = np.asarray(v, dtype=float)
    # your code — plain SGD below ignores the moments, fix it
    return w - lr * g, m, v`,
  entry: "adam_step",
  gen:
`def gen(rng):
    d = int(rng.integers(2, 8))
    return {"w": rng.normal(0, 1, d), "g": rng.normal(0, 1, d),
            "m": rng.normal(0, 0.5, d), "v": rng.uniform(0, 0.5, d),
            "t": int(rng.integers(1, 30)),
            "lr": float(rng.choice([0.001, 0.01, 0.1])),
            "b1": float(rng.choice([0.9, 0.95])),
            "b2": float(rng.choice([0.99, 0.999])),
            "eps": 1e-8}`,
  solve:
`def adam_step(w, g, m, v, t, lr, b1, b2, eps):
    w = np.asarray(w, dtype=float)
    g = np.asarray(g, dtype=float)
    m = np.asarray(m, dtype=float)
    v = np.asarray(v, dtype=float)
    m = b1 * m + (1.0 - b1) * g
    v = b2 * v + (1.0 - b2) * g ** 2
    mhat = m / (1.0 - b1 ** t)
    vhat = v / (1.0 - b2 ** t)
    return w - lr * mhat / (np.sqrt(vhat) + eps), m, v`
},
{
  id: "m16-batchnorm",
  module: "AI1",
  title: "BatchNorm train forward",
  diff: 3, minutes: 30,
  theory: "BatchNorm normalizes each feature across the batch: mu and var are computed over axis 0 (population variance, ddof=0), then x_hat = (x - mu)/sqrt(var + eps) and out = gamma * x_hat + beta. At train time it also updates running statistics with the PyTorch blend r <- (1 - momentum) * r + momentum * batch_stat — the running copy is what inference uses later.",
  prompt: "Implement `batchnorm_train(X, gamma, beta, rm, rv, momentum, eps)` for a (n, d) batch: normalize each column using the batch mean/variance, scale-shift by `gamma`/`beta`, and return `(out, rm_new, rv_new)` where the running stats are updated as `(1 - momentum) * old + momentum * batch_stat` (use the same population variance, ddof=0, as the normalization).\n\n```\nX=[[2],[4]] (n=2,d=1), gamma=1, beta=0, rm=0, rv=1, momentum=0.5, eps=0\n→ mu=3, var=1 → x_hat=[-1,1] → out=[[-1],[1]]; rm_new=0.5*0+0.5*3=1.5, rv_new=0.5*1+0.5*1=1.0\n```",
  hint: "mu = X.mean(0); var = X.var(0); out = gamma * (X - mu) / np.sqrt(var + eps) + beta. Then blend: rm_new = (1-momentum)*rm + momentum*mu, same for rv with var.",
  starter:
`def batchnorm_train(X, gamma, beta, rm, rv, momentum, eps):
    X = np.asarray(X, dtype=float)
    # your code
    return X, rm, rv`,
  entry: "batchnorm_train",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 13)); d = int(rng.integers(2, 7))
    return {"X": rng.normal(2, 3, (n, d)),
            "gamma": rng.normal(1, 0.3, d), "beta": rng.normal(0, 0.5, d),
            "rm": rng.normal(0, 1, d), "rv": rng.uniform(0.5, 2, d),
            "momentum": float(rng.choice([0.1, 0.2, 0.5])),
            "eps": 1e-5}`,
  solve:
`def batchnorm_train(X, gamma, beta, rm, rv, momentum, eps):
    X = np.asarray(X, dtype=float)
    gamma = np.asarray(gamma, dtype=float)
    beta = np.asarray(beta, dtype=float)
    rm = np.asarray(rm, dtype=float)
    rv = np.asarray(rv, dtype=float)
    mu = X.mean(axis=0)
    var = X.var(axis=0)
    out = gamma * (X - mu) / np.sqrt(var + eps) + beta
    rm_new = (1.0 - momentum) * rm + momentum * mu
    rv_new = (1.0 - momentum) * rv + momentum * var
    return out, rm_new, rv_new`
}
);

EXERCISES.push(
{
  id: "m16-he-init",
  module: "AI1",
  title: "He initialization with a seed",
  diff: 2, minutes: 10,
  theory: "**He initialization** draws weights from N(0, 2/fan_in) so activation variance stays constant through ReLU layers (Xavier/Glorot uses 2/(fan_in+fan_out) for tanh-style nets). For reproducible experiments the randomness comes from an explicit seed: `rng = np.random.default_rng(seed)` produces identical draws on every run — that is how autograders can check stochastic code deterministically.",
  prompt: "Implement `he_init(fan_in, fan_out, seed)` → array of shape (fan_in, fan_out) with entries drawn from N(0, sqrt(2/fan_in)). Create the generator as `np.random.default_rng(seed)` inside the function and draw with `rng.normal(0, std, (fan_in, fan_out))` — the same seed must always give the same matrix.",
  hint: "rng = np.random.default_rng(seed); return rng.normal(0.0, math.sqrt(2.0 / fan_in), (fan_in, fan_out)).",
  starter:
`def he_init(fan_in, fan_out, seed):
    # your code — the output must be reproducible from seed
    return np.zeros((fan_in, fan_out))`,
  entry: "he_init",
  gen:
`def gen(rng):
    return {"fan_in": int(rng.integers(2, 9)),
            "fan_out": int(rng.integers(2, 9)),
            "seed": int(rng.integers(0, 2 ** 31))}`,
  solve:
`def he_init(fan_in, fan_out, seed):
    rng = np.random.default_rng(seed)
    return rng.normal(0.0, math.sqrt(2.0 / fan_in), (fan_in, fan_out))`
},
{
  id: "m16-dropout",
  module: "AI1",
  title: "Dropout forward with a seed",
  diff: 2, minutes: 10,
  theory: "**Inverted dropout** at train time keeps each activation with probability 1−p and rescales survivors by 1/(1−p), so the expected value matches inference where nothing is dropped. The mask must be reproducible for debugging and grading — draw it from `np.random.default_rng(seed)`: keep where `rng.random(X.shape) >= p`.",
  prompt: "Implement `dropout(X, p, seed)` → array of X's shape. With `rng = np.random.default_rng(seed)`, keep elements where `rng.random(X.shape) >= p` (p is the *drop* probability), zero the dropped ones, and scale the survivors by `1 / (1 - p)`.",
  hint: "keep = rng.random(X.shape) >= p; return X * keep / (1.0 - p).",
  starter:
`def dropout(X, p, seed):
    X = np.asarray(X, dtype=float)
    # your code — scaling everything ignores the random keep mask
    return X * (1.0 - p)`,
  entry: "dropout",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 10)); d = int(rng.integers(2, 8))
    return {"X": rng.normal(0, 1, (n, d)),
            "p": float(rng.choice([0.1, 0.25, 0.5])),
            "seed": int(rng.integers(0, 2 ** 31))}`,
  solve:
`def dropout(X, p, seed):
    X = np.asarray(X, dtype=float)
    rng = np.random.default_rng(seed)
    keep = rng.random(X.shape) >= p
    return X * keep / (1.0 - p)`
}
);

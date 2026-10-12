/* Exercises for M10 — Generative Models & Model Surgery.
   Format: see exercises/engine.js and exercises/ex_m00.js. */

EXERCISES.push(
{
  id: "m10-reparam",
  module: "AI2",
  title: "Reparameterization trick",
  diff: 1, minutes: 6,
  theory: "Sampling z ~ N(μ, σ²) is not differentiable; the reparameterization trick writes z = μ + σ·ε with ε ~ N(0, I), moving randomness into an input so gradients flow through μ and σ. VAEs store log-variance rather than σ: σ = exp(0.5·logvar) is guaranteed positive.",
  prompt: "Implement `reparameterize(mu, logvar, eps)` → `mu + exp(0.5 * logvar) * eps`. All inputs are same-shape arrays; `eps` is the pre-drawn standard normal noise.",
  hint: "sigma = np.exp(0.5 * logvar); then mu + sigma * eps.",
  starter:
`def reparameterize(mu, logvar, eps):
    mu = np.asarray(mu, dtype=float)
    # your code
    return mu`,
  entry: "reparameterize",
  gen:
`def gen(rng):
    d = int(rng.integers(2, 9))
    return {"mu": rng.normal(0, 1, d),
            "logvar": rng.normal(-1, 1.0, d),
            "eps": rng.normal(0, 1, d)}`,
  solve:
`def reparameterize(mu, logvar, eps):
    mu = np.asarray(mu, dtype=float)
    logvar = np.asarray(logvar, dtype=float)
    eps = np.asarray(eps, dtype=float)
    return mu + np.exp(0.5 * logvar) * eps`
},
{
  id: "m10-q-sample",
  module: "AI2",
  title: "One forward-diffusion step",
  diff: 1, minutes: 8,
  theory: "The forward diffusion process adds Gaussian noise step by step, but the closed form jumps straight to step t: x_t = √ᾱ_t · x_0 + √(1−ᾱ_t)·ε with ε ~ N(0, I) and ᾱ_t = Π_{s≤t}(1−β_s). No loop needed — this is how training samples noisy x_t directly from clean x_0.",
  prompt: "Implement `q_sample(x0, abar, eps)` → `sqrt(abar) * x0 + sqrt(1 - abar) * eps`, where `abar` is the scalar cumulative product ᾱ_t and `eps` is the given standard normal noise of the same shape as `x0`.",
  hint: "math.sqrt(abar) * x0 + math.sqrt(1.0 - abar) * eps — one line.",
  starter:
`def q_sample(x0, abar, eps):
    x0 = np.asarray(x0, dtype=float)
    # your code
    return x0`,
  entry: "q_sample",
  gen:
`def gen(rng):
    m = int(rng.integers(2, 6)); d = int(rng.integers(2, 6))
    return {"x0": rng.normal(0, 1, (m, d)),
            "abar": float(rng.uniform(0.02, 0.95)),
            "eps": rng.normal(0, 1, (m, d))}`,
  solve:
`def q_sample(x0, abar, eps):
    x0 = np.asarray(x0, dtype=float)
    eps = np.asarray(eps, dtype=float)
    return math.sqrt(abar) * x0 + math.sqrt(1.0 - abar) * eps`
},
{
  id: "m10-clamp-acts",
  module: "AI2",
  title: "Clamp activations to percentiles",
  diff: 2, minutes: 8,
  theory: "Activation clamping bounds a tensor to a percentile range computed from the tensor itself per channel. It is used for calibration in quantization and to tame exploding activations: compute per-column bounds, then np.clip broadcasts them over the batch.",
  prompt: "Implement `clamp_acts(A, p)` → 2-D array where each **column** of `A` is clipped to its own `[p`-th, `(100-p)`-th] percentile range.",
  hint: "lo = np.percentile(A, p, axis=0) and hi = np.percentile(A, 100 - p, axis=0) give (d,) bounds; np.clip(A, lo, hi) broadcasts them row-wise.",
  starter:
`def clamp_acts(A, p):
    A = np.asarray(A, dtype=float)
    # your code
    return A`,
  entry: "clamp_acts",
  gen:
`def gen(rng):
    n = int(rng.integers(6, 20)); d = int(rng.integers(3, 7))
    return {"A": rng.normal(0, 3, (n, d)),
            "p": float(rng.choice([1.0, 5.0, 10.0, 25.0]))}`,
  solve:
`def clamp_acts(A, p):
    A = np.asarray(A, dtype=float)
    lo = np.percentile(A, p, axis=0)
    hi = np.percentile(A, 100.0 - p, axis=0)
    return np.clip(A, lo, hi)`
},
{
  id: "m10-beta-schedule",
  module: "AI2",
  title: "Linear beta schedule",
  diff: 2, minutes: 10,
  theory: "A diffusion noise schedule picks variances β_1..β_T — commonly linearly spaced from ~1e-4 to ~0.02 — and precomputes α_t = 1−β_t and ᾱ_t = Π_{s≤t} α_s. Every closed-form sampling formula uses ᾱ, so computing the cumulative product once is the standard first step.",
  prompt: "Implement `beta_schedule(T, b0, b1)` → dict with keys `\"betas\"` (T values linearly spaced from `b0` to `b1`, inclusive endpoints), `\"alphas\"` (1 − betas) and `\"alphas_cumprod\"` (cumulative product of alphas).",
  hint: "betas = np.linspace(b0, b1, T); alphas = 1 - betas; alphas_cumprod = np.cumprod(alphas).",
  starter:
`def beta_schedule(T, b0, b1):
    betas = np.linspace(b0, b1, T)
    # your code
    return {"betas": betas}`,
  entry: "beta_schedule",
  gen:
`def gen(rng):
    return {"T": int(rng.integers(5, 30)),
            "b0": float(rng.uniform(0.0001, 0.005)),
            "b1": float(rng.uniform(0.01, 0.05))}`,
  solve:
`def beta_schedule(T, b0, b1):
    betas = np.linspace(b0, b1, T)
    alphas = 1.0 - betas
    return {"betas": betas, "alphas": alphas,
            "alphas_cumprod": np.cumprod(alphas)}`
},
{
  id: "m10-swap-classes",
  module: "AI2",
  title: "Classifier surgery: swap two classes",
  diff: 2, minutes: 10,
  theory: "Model surgery edits weights directly instead of retraining. In a linear classifier y = Wx + b each output class owns one row of W and one entry of b — swapping two rows and the matching bias entries swaps the classes the model outputs, like the IOAI'24 zebra→giraffe edit.",
  prompt: "Implement `swap_classes(W, b, i, j)` → tuple `(W2, b2)`: copies of the weight matrix and bias vector with rows/entries `i` and `j` exchanged. `i != j` is guaranteed. Do not mutate the inputs.",
  hint: "Copy first; then fancy-index W2[[i, j]] = W2[[j, i]] and likewise for b2.",
  starter:
`def swap_classes(W, b, i, j):
    W2 = np.asarray(W, dtype=float).copy()
    b2 = np.asarray(b, dtype=float).copy()
    # your code
    return W2, b2`,
  entry: "swap_classes",
  gen:
`def gen(rng):
    C = int(rng.integers(3, 8)); D = int(rng.integers(3, 9))
    i, j = rng.choice(C, 2, replace=False)
    return {"W": rng.normal(0, 1, (C, D)), "b": rng.normal(0, 1, C),
            "i": int(i), "j": int(j)}`,
  solve:
`def swap_classes(W, b, i, j):
    W2 = np.asarray(W, dtype=float).copy()
    b2 = np.asarray(b, dtype=float).copy()
    W2[[i, j]] = W2[[j, i]]
    b2[[i, j]] = b2[[j, i]]
    return W2, b2`
},
{
  id: "m10-zero-topk",
  module: "AI2",
  title: "Zero out top-k weights by magnitude",
  diff: 3, minutes: 12,
  theory: "Magnitude-based weight surgery removes the entries with the largest absolute value. It is a crude ablation that shows which weights the network depends on. Flatten |W|, find the k largest positions, and zero them in a copy: np.argsort plus np.unravel_index avoids all loops.",
  prompt: "Implement `zero_topk(W, k)` → copy of `W` with the `k` entries of largest absolute value set to 0.0. All other entries stay unchanged; do not mutate the input.",
  hint: "order = np.argsort(-np.abs(W.ravel())); the flat indices order[:k] are the top-k; convert with np.unravel_index(idx, W.shape) to index the 2-D copy.",
  starter:
`def zero_topk(W, k):
    W2 = np.asarray(W, dtype=float).copy()
    # your code
    return W2`,
  entry: "zero_topk",
  gen:
`def gen(rng):
    m = int(rng.integers(3, 7)); n = int(rng.integers(3, 7))
    return {"W": rng.normal(0, 1, (m, n)),
            "k": int(rng.integers(1, m * n // 2))}`,
  solve:
`def zero_topk(W, k):
    W2 = np.asarray(W, dtype=float).copy()
    order = np.argsort(-np.abs(W2).ravel(), kind="stable")
    idx = np.unravel_index(order[:k], W2.shape)
    W2[idx] = 0.0
    return W2`
},
{
  id: "m10-slerp",
  module: "AI2",
  title: "Spherical latent interpolation",
  diff: 3, minutes: 30,
  theory: "Linear interpolation between latent vectors cuts through empty regions of latent space; spherical interpolation (slerp) follows the great-circle arc. For Ω = angle(u, v): slerp(u,v,t) = [sin((1−t)Ω)·u + sin(tΩ)·v] / sinΩ. At t=0 and t=1 it reproduces u and v exactly; when sinΩ ≈ 0 (parallel vectors) fall back to plain lerp.",
  prompt: "Implement `slerp(u, v, t)` → interpolated vector. Let `cos = (u·v)/(|u|·|v|)` clipped to [-1, 1], `omega = arccos(cos)`. If `sin(omega) < 1e-8` return the linear blend `(1-t)*u + t*v`; otherwise return `(sin((1-t)*omega)*u + sin(t*omega)*v) / sin(omega)`.",
  hint: "Compute omega via math.acos on the clipped cosine; the two sin() coefficients weight u and v, divided by sin(omega).",
  starter:
`def slerp(u, v, t):
    u = np.asarray(u, dtype=float)
    v = np.asarray(v, dtype=float)
    # your code
    return u`,
  entry: "slerp",
  gen:
`def gen(rng):
    d = int(rng.integers(3, 8))
    u = rng.normal(0, 1, d)
    if np.linalg.norm(u) < 1e-6:
        u = np.ones(d)
    uh = u / np.linalg.norm(u)
    w = None
    for cand in (rng.normal(0, 1, d), np.ones(d), np.arange(1.0, d + 1)):
        p = cand - np.dot(cand, uh) * uh
        if np.linalg.norm(p) > 1e-6:
            w = p / np.linalg.norm(p)
            break
    r_case = rng.random()
    if r_case < 0.15:
        v = u * float(rng.uniform(0.5, 2.0))    # parallel — sin(Omega) = 0, must hit the lerp fallback
    elif r_case < 0.25:
        v = -u * float(rng.uniform(0.5, 2.0))   # anti-parallel — same degenerate branch
    else:
        theta = float(rng.uniform(0.3, 2.5))
        nv = float(rng.uniform(0.5, 2.0))
        v = nv * (np.cos(theta) * uh + np.sin(theta) * w)
    return {"u": u, "v": v, "t": float(rng.uniform(0.0, 1.0))}`,
  solve:
`def slerp(u, v, t):
    u = np.asarray(u, dtype=float)
    v = np.asarray(v, dtype=float)
    cos = np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))
    omega = math.acos(max(-1.0, min(1.0, float(cos))))
    so = math.sin(omega)
    if so < 1e-8:
        return (1.0 - t) * u + t * v
    return (math.sin((1.0 - t) * omega) * u + math.sin(t * omega) * v) / so`
}
);

EXERCISES.push(
{
  id: "m10-kl-diag",
  module: "AI2",
  title: "KL between diagonal Gaussians",
  diff: 2, minutes: 10,
  theory: "The VAE objective pulls the encoder posterior q toward the prior p through KL(N_q || N_p), which for diagonal Gaussians has the closed form 0.5·Σ(σ_q²/σ_p² + (μ_p − μ_q)²/σ_p² − 1 + ln σ_p² − ln σ_q²). Working in log-variance keeps it stable: variance ratios become exp(logvar_q − logvar_p), so you never explicitly divide by a tiny σ².",
  prompt: "Implement `kl_diag(mu_q, logvar_q, mu_p, logvar_p)` → scalar KL(N(μ_q, diag e^{logvar_q}) || N(μ_p, diag e^{logvar_p})) = `0.5 * sum(exp(logvar_q - logvar_p) + (mu_p - mu_q)^2 * exp(-logvar_p) - 1 + logvar_p - logvar_q)`.",
  hint: "term = np.exp(logvar_q - logvar_p) + (mu_p - mu_q)**2 * np.exp(-logvar_p) - 1.0 + logvar_p - logvar_q; return 0.5 * term.sum().",
  starter:
`def kl_diag(mu_q, logvar_q, mu_p, logvar_p):
    mu_q = np.asarray(mu_q, dtype=float)
    # your code
    return 0.0`,
  entry: "kl_diag",
  gen:
`def gen(rng):
    d = int(rng.integers(2, 9))
    return {"mu_q": rng.normal(0, 1, d), "logvar_q": rng.normal(0, 1, d),
            "mu_p": rng.normal(0, 1, d), "logvar_p": rng.normal(0, 1, d)}`,
  solve:
`def kl_diag(mu_q, logvar_q, mu_p, logvar_p):
    mu_q = np.asarray(mu_q, dtype=float)
    logvar_q = np.asarray(logvar_q, dtype=float)
    mu_p = np.asarray(mu_p, dtype=float)
    logvar_p = np.asarray(logvar_p, dtype=float)
    term = np.exp(logvar_q - logvar_p) + (mu_p - mu_q) ** 2 * np.exp(-logvar_p) - 1.0 + logvar_p - logvar_q
    return float(0.5 * term.sum())`
},
{
  id: "m10-ddim-step",
  module: "AI2",
  title: "One deterministic DDIM step",
  diff: 3, minutes: 30,
  theory: "DDPM adds fresh Gaussian noise at every step — slow and stochastic. DDIM removes noise **deterministically** (η = 0). The network sees the noisy image x_t and returns a noise estimate ε̂; the coefficient ᾱ_t is how much clean signal remains at step t, and ᾱ_t < ᾱ_{t−1}. Step one: predict the clean sample, x̂0 = (x_t − √(1−ᾱ_t)·ε̂)/√ᾱ_t. Step two: re-noise to the previous level, x_{t−1} = √ᾱ_{t−1}·x̂0 + √(1−ᾱ_{t−1})·ε̂. With η = 0 the same ε̂ is reused both times, so the whole trajectory is a deterministic function of x_T.",
  prompt: "Implement `ddim_step(x_t, eps, abar_t, abar_prev)` → the deterministic (η = 0) DDIM update: `x0 = (x_t − sqrt(1 − abar_t)·eps)/sqrt(abar_t)`, then return `sqrt(abar_prev)·x0 + sqrt(1 − abar_prev)·eps`. The scalars satisfy 0 < abar_t < abar_prev < 1.",
  hint: "Use math.sqrt for the scalar coefficients — build x0 first, then the convex-looking recombination with eps.",
  starter:
`def ddim_step(x_t, eps, abar_t, abar_prev):
    x_t = np.asarray(x_t, dtype=float)
    # your code
    return x_t`,
  entry: "ddim_step",
  gen:
`def gen(rng):
    m = int(rng.integers(2, 6)); d = int(rng.integers(2, 6))
    abar_prev = float(rng.uniform(0.3, 0.98))
    abar_t = float(rng.uniform(0.02, abar_prev - 0.01))
    return {"x_t": rng.normal(0, 1, (m, d)), "eps": rng.normal(0, 1, (m, d)),
            "abar_t": abar_t, "abar_prev": abar_prev}`,
  solve:
`def ddim_step(x_t, eps, abar_t, abar_prev):
    x_t = np.asarray(x_t, dtype=float)
    eps = np.asarray(eps, dtype=float)
    x0 = (x_t - math.sqrt(1.0 - abar_t) * eps) / math.sqrt(abar_t)
    return math.sqrt(abar_prev) * x0 + math.sqrt(1.0 - abar_prev) * eps`
}
);

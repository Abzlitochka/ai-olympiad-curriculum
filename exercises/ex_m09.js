/* Exercises for M9 — RL, Control & Robotics Sims.
   Format: see exercises/engine.js and exercises/ex_m00.js. */

EXERCISES.push(
{
  id: "m09-discounted-returns",
  module: "ML8",
  title: "Discounted returns from rewards",
  diff: 1, minutes: 8,
  theory: "In RL the return is G_t = r_t + γ·r_{t+1} + γ²·r_{t+2} + … — future rewards discounted by γ∈[0,1). Computing it backwards takes one O(n) pass: G_t = r_t + γ·G_{t+1}. Every value-learning method starts from this quantity.",
  prompt: "Implement `discounted_returns(rewards, gamma)` → array `G` of the same length where `G[t]` is the discounted return from step `t` to the end of the episode.",
  hint: "Walk the list in reverse keeping a running total: acc = r[t] + gamma * acc, then store acc in G[t].",
  starter:
`def discounted_returns(rewards, gamma):
    G = np.zeros(len(rewards))
    # your code
    return G`,
  entry: "discounted_returns",
  gen:
`def gen(rng):
    n = int(rng.integers(1, 20))   # length-1 episodes are legal
    # gamma=0 (myopic — G_t = r_t) is a spec'd edge the lesson quiz tests
    gamma = float(rng.choice([0.0, 0.0, rng.uniform(0.3, 0.99)]))
    return {"rewards": rng.normal(0, 1, n), "gamma": gamma}`,
  solve:
`def discounted_returns(rewards, gamma):
    r = np.asarray(rewards, dtype=float)
    G = np.zeros_like(r)
    acc = 0.0
    for i in range(len(r) - 1, -1, -1):
        acc = r[i] + gamma * acc
        G[i] = acc
    return G`
},
{
  id: "m09-epsilon-greedy",
  module: "ML8",
  title: "Epsilon-greedy action choice",
  diff: 1, minutes: 8,
  theory: "ε-greedy is the simplest exploration strategy: with probability ε pick a uniformly random action, otherwise take the greedy argmax_a Q(s,a). For reproducibility the randomness must come from the generator passed in as an argument — draw the coin flip with rng.random() and the exploratory action with rng.integers(k).",
  prompt: "Implement `epsilon_greedy(q_row, eps, rng)` → int action index. With probability `eps` return a uniform random action via `rng.integers(len(q_row))`; otherwise return `argmax` of the Q-row (ties break to the lowest index). Draw `rng.random()` first, exactly once, for the exploration check.",
  hint: "if rng.random() < eps: return int(rng.integers(len(q))); else return int(np.argmax(q)).",
  starter:
`def epsilon_greedy(q_row, eps, rng):
    q = np.asarray(q_row, dtype=float)
    # your code
    return 0`,
  entry: "epsilon_greedy",
  gen:
`def gen(rng):
    k = int(rng.integers(2, 7))
    return {"q_row": rng.normal(0, 1, k),
            "eps": float(rng.choice([0.0, 0.1, 0.3, 0.9, 1.0])),
            "rng": rng}`,
  solve:
`def epsilon_greedy(q_row, eps, rng):
    q = np.asarray(q_row, dtype=float)
    if rng.random() < eps:
        return int(rng.integers(len(q)))
    return int(np.argmax(q))`
},
{
  id: "m09-q-update",
  module: "ML8",
  title: "One Q-learning update",
  diff: 2, minutes: 10,
  theory: "Q-learning bootstraps toward the TD target y = r + γ·max_{a'} Q(s',a') — or just r when the transition is terminal: Q(s,a) ← Q(s,a) + α·(y − Q(s,a)). One update touches exactly one entry of the table; all other entries stay unchanged.",
  prompt: "Implement `q_update(Q, s, a, r, s2, alpha, gamma, done)` → updated Q-table (a new array, do not rely on in-place mutation). If `done` is True the target is `r`; otherwise `r + gamma * max(Q[s2])`. Update only entry `Q[s, a]`.",
  hint: "Copy Q, compute target = r if done else r + gamma * Q[s2].max(), then Q[s,a] += alpha * (target - Q[s,a]).",
  starter:
`def q_update(Q, s, a, r, s2, alpha, gamma, done):
    Q = np.asarray(Q, dtype=float).copy()
    # your code
    return Q`,
  entry: "q_update",
  gen:
`def gen(rng):
    S = int(rng.integers(3, 7)); A = int(rng.integers(2, 5))
    return {"Q": rng.normal(0, 1, (S, A)),
            "s": int(rng.integers(S)), "a": int(rng.integers(A)),
            "r": float(rng.normal(0, 1)), "s2": int(rng.integers(S)),
            "alpha": float(rng.uniform(0.05, 0.5)),
            "gamma": float(rng.uniform(0.8, 0.99)),
            "done": bool(rng.random() < 0.25)}`,
  solve:
`def q_update(Q, s, a, r, s2, alpha, gamma, done):
    Q = np.asarray(Q, dtype=float).copy()
    target = r if done else r + gamma * float(np.max(Q[s2]))
    Q[s, a] = Q[s, a] + alpha * (target - Q[s, a])
    return Q`
},
{
  id: "m09-softmax-policy",
  module: "ML8",
  title: "Softmax policy with temperature",
  diff: 2, minutes: 10,
  theory: "A softmax (Boltzmann) policy turns preference scores into action probabilities: π(a|s) = exp(h_a/τ) / Σ_b exp(h_b/τ). Temperature τ controls exploration: τ→0 approaches greedy, τ→∞ approaches uniform. Always subtract the max before exp() to avoid overflow.",
  prompt: "Implement `softmax_policy(P, tau)` for a 2-D preference matrix `P` of shape (n_states, n_actions): return the row-wise softmax of `P / tau`, i.e. each row sums to 1. Use the subtract-the-max stabilization.",
  hint: "z = P/tau; z = z - z.max(axis=-1, keepdims=True); e = np.exp(z); return e / e.sum(axis=-1, keepdims=True).",
  starter:
`def softmax_policy(P, tau):
    P = np.asarray(P, dtype=float)
    # your code
    return np.zeros_like(P)`,
  entry: "softmax_policy",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 6)); k = int(rng.integers(2, 7))
    P = rng.normal(0, 2, (n, k))
    if rng.random() < 0.4:
        P = P + float(rng.uniform(900, 1400))   # stabilization is required: naive exp overflows
    return {"P": P, "tau": float(rng.uniform(0.3, 2.5))}`,
  solve:
`def softmax_policy(P, tau):
    z = np.asarray(P, dtype=float) / tau
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)`
},
{
  id: "m09-policy-eval",
  module: "ML8",
  title: "Policy evaluation sweep",
  diff: 2, minutes: 12,
  theory: "Policy evaluation computes the value of following a fixed policy π — how good each state is under it — via the Bellman expectation backup: V^π(s) = Σ_a π(a|s)·[R(s,a) + γ·Σ_{s'} T(s,a,s')·V(s')]. Here π(a|s) is the probability of taking action a in state s, R(s,a) the immediate reward, T(s,a,s') the probability of landing in s', and γ the discount. A synchronous sweep uses the old V everywhere. With matrices it is two contractions: Q = R + γ·(T @ V), then V' = Σ_a π·Q.",
  prompt: "Implement `policy_eval_step(T, R, Pi, V, gamma)` → new value vector of shape (S,). `T` has shape (S, A, S) with T[s,a,s'] = P(s'|s,a), `R` and `Pi` have shape (S, A), `V` has shape (S,). One synchronous sweep: V'[s] = Σ_a Pi[s,a]·(R[s,a] + γ·Σ_s' T[s,a,s']·V[s']).",
  hint: "T @ V contracts the last axis and gives expected future value per (s,a) — shape (S,A). Then Q = R + gamma*(T@V) and return (Pi * Q).sum(axis=1).",
  starter:
`def policy_eval_step(T, R, Pi, V, gamma):
    T = np.asarray(T, dtype=float)
    # your code
    return np.zeros(T.shape[0])`,
  entry: "policy_eval_step",
  gen:
`def gen(rng):
    S = int(rng.integers(2, 6)); A = int(rng.integers(2, 5))
    T = rng.random((S, A, S)); T = T / T.sum(axis=-1, keepdims=True)
    Pi = rng.random((S, A)); Pi = Pi / Pi.sum(axis=-1, keepdims=True)
    return {"T": T, "R": rng.normal(0, 1, (S, A)), "Pi": Pi,
            "V": rng.normal(0, 1, S), "gamma": float(rng.uniform(0.7, 0.99))}`,
  solve:
`def policy_eval_step(T, R, Pi, V, gamma):
    T = np.asarray(T, dtype=float); R = np.asarray(R, dtype=float)
    Pi = np.asarray(Pi, dtype=float); V = np.asarray(V, dtype=float)
    Q = R + gamma * (T @ V)
    return (Pi * Q).sum(axis=1)`
},
{
  id: "m09-value-iteration",
  module: "ML8",
  title: "Value iteration step",
  diff: 3, minutes: 12,
  theory: "Value iteration replaces the expectation over π with a max over actions: V_{k+1}(s) = max_a [R(s,a) + γ·Σ_{s'} T(s,a,s')·V_k(s)]. The greedy policy recovered afterwards is argmax_a of the same action-value terms — one sweep gives you both.",
  prompt: "Implement `value_iteration_step(T, R, V, gamma)` → tuple `(V_new, policy)`. `T` has shape (S, A, S), `R` is (S, A), `V` is (S,). `V_new[s] = max_a (R[s,a] + γ·Σ_s' T[s,a,s']·V[s'])` and `policy[s]` is the argmax action index (lowest index on ties).",
  hint: "Same contraction as policy evaluation: Q = R + gamma * (T @ V); then return Q.max(axis=1), Q.argmax(axis=1).",
  starter:
`def value_iteration_step(T, R, V, gamma):
    T = np.asarray(T, dtype=float)
    # your code
    return np.zeros(T.shape[0]), np.zeros(T.shape[0], dtype=int)`,
  entry: "value_iteration_step",
  gen:
`def gen(rng):
    S = int(rng.integers(2, 6)); A = int(rng.integers(2, 5))
    T = rng.random((S, A, S)); T = T / T.sum(axis=-1, keepdims=True)
    return {"T": T, "R": rng.normal(0, 1, (S, A)),
            "V": rng.normal(0, 1, S), "gamma": float(rng.uniform(0.7, 0.99))}`,
  solve:
`def value_iteration_step(T, R, V, gamma):
    T = np.asarray(T, dtype=float); R = np.asarray(R, dtype=float)
    V = np.asarray(V, dtype=float)
    Q = R + gamma * (T @ V)
    return Q.max(axis=1), Q.argmax(axis=1)`
},
{
  id: "m09-reinforce-grad",
  module: "ML8",
  title: "REINFORCE log-policy gradient",
  diff: 3, minutes: 12,
  theory: "REINFORCE ascends ∇J = G·∇log π(a|s): scale the log-probability gradient by the observed return. For a softmax policy over preferences h the gradient has a closed form: ∇_h log π(a) = e_a − π, a one-hot at the taken action minus the probability vector — pull up the taken action, push all actions down proportionally to their probability.",
  prompt: "Implement `reinforce_grad(prefs, action, G)` → gradient vector of `G · log π(action)` with respect to the preference vector `prefs`, where π = softmax(prefs). Result: `G * (one_hot(action) − softmax(prefs))`.",
  hint: "Compute a stable softmax p of prefs, start from g = -p, add 1 at g[action], multiply by G.",
  starter:
`def reinforce_grad(prefs, action, G):
    prefs = np.asarray(prefs, dtype=float)
    # your code
    return np.zeros(len(prefs))`,
  entry: "reinforce_grad",
  gen:
`def gen(rng):
    k = int(rng.integers(2, 7))
    prefs = rng.normal(0, 2, k)
    if rng.random() < 0.5:
        prefs[int(rng.integers(k))] = float(rng.choice([800.0, 950.0]))  # naive softmax -> NaN
    return {"prefs": prefs, "action": int(rng.integers(k)),
            "G": float(rng.normal(0, 3))}`,
  solve:
`def reinforce_grad(prefs, action, G):
    h = np.asarray(prefs, dtype=float)
    z = h - h.max()
    p = np.exp(z); p = p / p.sum()
    g = -p
    g[action] += 1.0
    return G * g`
}
);

EXERCISES.push(
{
  id: "m09-td0-update",
  module: "ML8",
  title: "TD(0) value update",
  diff: 1, minutes: 8,
  theory: "TD(0) bootstraps the value estimate: the target for V(s) is r + γ·V(s′) — or just r at a terminal transition — and the update steps toward it: V(s) ← V(s) + α·(target − V(s)). Unlike Monte-Carlo returns it learns from incomplete episodes, one transition at a time.",
  prompt: "Implement `td_update(V, s, r, s2, alpha, gamma, done)` → new value vector (a copy; do not mutate the input). The TD target is `r` when `done` is True, otherwise `r + gamma * V[s2]`. Only entry `V[s]` changes.",
  hint: "Copy V, compute target = r if done else r + gamma * V[s2], then V[s] += alpha * (target - V[s]).",
  starter:
`def td_update(V, s, r, s2, alpha, gamma, done):
    V = np.asarray(V, dtype=float).copy()
    # your code
    return V`,
  entry: "td_update",
  gen:
`def gen(rng):
    S = int(rng.integers(3, 8))
    return {"V": rng.normal(0, 1, S),
            "s": int(rng.integers(S)), "r": float(rng.normal(0, 1)),
            "s2": int(rng.integers(S)),
            "alpha": float(rng.uniform(0.05, 0.6)),
            "gamma": float(rng.uniform(0.7, 0.99)),
            "done": bool(rng.random() < 0.25)}`,
  solve:
`def td_update(V, s, r, s2, alpha, gamma, done):
    V = np.asarray(V, dtype=float).copy()
    target = r if done else r + gamma * float(V[s2])
    V[s] = V[s] + alpha * (target - V[s])
    return V`
},
{
  id: "m09-sarsa-update",
  module: "ML8",
  title: "One SARSA update",
  diff: 2, minutes: 10,
  theory: "SARSA is **on-policy** TD control: the bootstrap target uses the action a′ the behaviour policy actually took, Q(s,a) ← Q(s,a) + α·(r + γ·Q(s′,a′) − Q(s,a)), with target r when the transition is terminal. Contrast with Q-learning's max over a′ — SARSA evaluates the policy being followed, exploration included.",
  prompt: "Implement `sarsa_update(Q, s, a, r, s2, a2, alpha, gamma, done)` → updated Q-table (a new array). If `done` the target is `r`; otherwise `r + gamma * Q[s2, a2]` — note it uses the given next action `a2`, not a max. Update only entry `Q[s, a]`.",
  hint: "Copy Q; target = r if done else r + gamma * Q[s2, a2]; then Q[s, a] += alpha * (target - Q[s, a]).",
  starter:
`def sarsa_update(Q, s, a, r, s2, a2, alpha, gamma, done):
    Q = np.asarray(Q, dtype=float).copy()
    # your code — build the target, then blend Q[s, a] toward it
    return Q`,
  entry: "sarsa_update",
  gen:
`def gen(rng):
    S = int(rng.integers(3, 7)); A = int(rng.integers(2, 5))
    return {"Q": rng.normal(0, 1, (S, A)),
            "s": int(rng.integers(S)), "a": int(rng.integers(A)),
            "r": float(rng.normal(0, 1)),
            "s2": int(rng.integers(S)), "a2": int(rng.integers(A)),
            "alpha": float(rng.uniform(0.05, 0.5)),
            "gamma": float(rng.uniform(0.8, 0.99)),
            "done": bool(rng.random() < 0.25)}`,
  solve:
`def sarsa_update(Q, s, a, r, s2, a2, alpha, gamma, done):
    Q = np.asarray(Q, dtype=float).copy()
    target = r if done else r + gamma * float(Q[s2, a2])
    Q[s, a] = Q[s, a] + alpha * (target - Q[s, a])
    return Q`
}
);

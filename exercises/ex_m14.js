/* Exercises for M14 — Mock Contests / Strategy. */

EXERCISES.push(
{
  id: "m14-scoreboard",
  module: "ML9",
  title: "Rank a scoreboard",
  diff: 1, minutes: 8,
  theory: "Contest standings sort by points descending; ties go to the smaller penalty time (ACM rules). Reading rows as (name, score, time) tuples and producing an ordered list of names is a one-liner with a negated sort key — but under contest pressure the sign flip and the tie-break order are exactly where bugs hide.",
  prompt: "Implement `rank_scoreboard(rows)` → participant names in standing order. Each row is `[name, score, time]`; sort by score descending, then time ascending, then name alphabetically for a fully deterministic order.",
  hint: "sorted(rows, key=lambda r: (-r[1], r[2], r[0])), then take element 0 of each row.",
  starter:
`def rank_scoreboard(rows):
    # your code
    return [r[0] for r in rows]`,
  entry: "rank_scoreboard",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 11))
    order = rng.permutation(n).tolist()
    rows = [[f"p{int(i)}", int(rng.integers(0, 501)), int(rng.integers(0, 301))]
            for i in order]
    if rng.random() < 0.5:
        # force a full (score, time) tie so the name tie-break is exercised
        k = int(rng.integers(2, n + 1))
        s, t = int(rng.integers(0, 501)), int(rng.integers(0, 301))
        idx = rng.choice(n, k, replace=False)
        for j in idx:
            rows[j][1], rows[j][2] = s, t
    return {"rows": rows}`,
  solve:
`def rank_scoreboard(rows):
    return [r[0] for r in sorted(rows, key=lambda r: (-r[1], r[2], r[0]))]`
},
{
  id: "m14-elo",
  module: "ML9",
  title: "Elo rating update",
  diff: 1, minutes: 10,
  theory: "Elo turns ratings into win expectations: E_a = 1/(1 + 10^((R_b - R_a)/400)). After a game each rating moves toward the actual result: R' = R + K*(S - E), with K = 32 and S in {1, 0.5, 0}. Because E_a + E_b = 1, the system is zero-sum — what A gains, B loses.",
  prompt: "Implement `elo_update(ra, rb, sa)` → `[new_ra, new_rb]` with K = 32. `sa` is player A's score: 1 win, 0.5 draw, 0 loss.",
  hint: "ea = 1/(1 + 10**((rb - ra)/400)); ra' = ra + 32*(sa - ea); symmetric for B with score 1 - sa.",
  starter:
`def elo_update(ra, rb, sa):
    # your code
    return [ra, rb]`,
  entry: "elo_update",
  gen:
`def gen(rng):
    return {"ra": int(rng.integers(1000, 2401)),
            "rb": int(rng.integers(1000, 2401)),
            "sa": float(rng.choice([0.0, 0.5, 1.0]))}`,
  solve:
`def elo_update(ra, rb, sa):
    ea = 1.0 / (1.0 + 10.0 ** ((rb - ra) / 400.0))
    na = ra + 32.0 * (sa - ea)
    nb = rb + 32.0 * ((1.0 - sa) - (1.0 - ea))
    return [na, nb]`
},
{
  id: "m14-expected-alloc",
  module: "ML9",
  title: "Expected score of a time split",
  diff: 2, minutes: 10,
  theory: "A simple contest model: spending t minutes on task i solves it with probability p_i(t) = 1 - exp(-t/tau_i), where tau_i is the task's difficulty scale. Expected score is the linearity-of-expectation sum s_i * p_i(t_i) — independence between tasks never matters for an expectation, which is what makes the model tractable.",
  prompt: "Implement `expected_score(scores, taus, alloc)` → the expected total score: sum over tasks of scores[i] * (1 - exp(-alloc[i] / taus[i])). All inputs are equal-length lists; alloc entries are >= 0 and taus > 0.",
  hint: "sum(s * (1 - math.exp(-t / tau)) for s, tau, t in zip(scores, taus, alloc)).",
  starter:
`def expected_score(scores, taus, alloc):
    # your code
    return 0.0`,
  entry: "expected_score",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 9))
    return {"scores": rng.integers(50, 501, n).tolist(),
            "taus": np.round(rng.uniform(5, 30, n), 1).tolist(),
            "alloc": np.round(rng.uniform(0, 40, n), 1).tolist()}`,
  solve:
`def expected_score(scores, taus, alloc):
    return float(sum(s * (1.0 - math.exp(-t / tau))
                     for s, tau, t in zip(scores, taus, alloc)))`
},
{
  id: "m14-best-plan",
  module: "ML9",
  title: "Pick the best task plan",
  diff: 3, minutes: 45,
  theory: "A task worth 100 points with a 0.4 success probability contributes 40 expected points, not a guaranteed 40. Add these expected values for the tasks you choose. The time limit applies to the whole choice: a high-value task can leave too little time for a better combination. For example, with 10 minutes available, one 10-minute task worth 9 expected points loses to two 5-minute tasks worth 6 each. Your job is to choose the combination, not just rank tasks individually.",
  prompt: "Implement `best_plan(scores, probs, times, T)` → the maximum expected score achievable by a subset of tasks whose total time <= T. Attempting task i costs times[i] minutes and scores scores[i] with probability probs[i]. There are at most 8 tasks; each can be attempted at most once, and choosing none gives 0 points.",
  hint: "Loop masks over range(1 << n); accumulate time and expected value of the chosen bits; keep the max over masks with time <= T.",
  starter:
`def best_plan(scores, probs, times, T):
    # your code
    return 0.0`,
  entry: "best_plan",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 9))
    return {"scores": rng.integers(100, 601, n).tolist(),
            "probs": np.round(rng.uniform(0.2, 0.95, n), 2).tolist(),
            "times": rng.integers(10, 61, n).tolist(),
            "T": int(rng.integers(40, 120))}`,
  solve:
`def best_plan(scores, probs, times, T):
    n = len(scores)
    best = 0.0
    for mask in range(1 << n):
        t = 0
        e = 0.0
        for i in range(n):
            if mask >> i & 1:
                t += times[i]
                e += scores[i] * probs[i]
        if t <= T and e > best:
            best = e
    return best`
}
);

EXERCISES.push(
{
  id: "m14-medal-cutoff",
  module: "ML9",
  title: "Medal cutoff score",
  diff: 2, minutes: 10,
  theory: "A cutoff is a score threshold, not a fixed number of winners: everyone tied at the cutoff qualifies. For scores [10, 8, 8, 3], a cutoff of 8 admits three people, while 9 admits only one. Raising the cutoff can only keep or reduce the winner count; it never increases it. Find the lowest integer threshold that respects the limit, even when ties mean fewer than k people receive medals.",
  prompt: "Implement `medal_cutoff(scores, k)` → the smallest integer cutoff c such that at most `k` participants have score >= c. `k < len(scores)` is guaranteed; scores are non-negative integers",
  hint: "Sort descending. count(score >= c) <= k first holds at c = s[k] + 1, where s is the sorted list.",
  starter:
`def medal_cutoff(scores, k):
    # your code
    return 0`,
  entry: "medal_cutoff",
  gen:
`def gen(rng):
    n = int(rng.integers(5, 16))
    return {"scores": rng.integers(0, 501, n).tolist(),
            "k": int(rng.integers(1, n))}`,
  solve:
`def medal_cutoff(scores, k):
    s = sorted(scores, reverse=True)
    return s[k] + 1`
},
{
  id: "m14-max-tasks",
  module: "ML9",
  title: "Max tasks before deadlines",
  diff: 3, minutes: 45,
  theory: "A deadline is the latest allowed finishing time, not the time available after starting a task. Tasks run one at a time, so earlier choices use time needed by later ones. A 3-minute task due at time 3 followed by a 2-minute task due at time 5 meets both deadlines; reversing them misses the first task's deadline. Each completed task counts equally here. Think about both the order and which tasks to leave out when a schedule no longer fits.",
  prompt: "Implement `max_tasks(durations, deadlines)` → the maximum number of tasks completable sequentially from time 0, where a task counts if and only if its completion time <= its deadline. Equal-length lists of positive ints.",
  hint: "Sort jobs by deadline; push each duration onto a max-heap (negate for heapq) and add it to the running time; if time > current deadline, pop the largest duration back out.",
  starter:
`def max_tasks(durations, deadlines):
    # your code — 0 is just a placeholder, not the real maximum
    return 0`,
  entry: "max_tasks",
  gen:
`def gen(rng):
    n = int(rng.integers(4, 12))
    durations = rng.integers(1, 10, n).tolist()
    deadlines = rng.integers(3, 30, n).tolist()
    return {"durations": durations, "deadlines": deadlines}`,
  solve:
`def max_tasks(durations, deadlines):
    jobs = sorted(zip(deadlines, durations))
    heap = []
    t = 0
    for dl, d in jobs:
        t += d
        heapq.heappush(heap, -d)
        if t > dl:
            longest = -heapq.heappop(heap)
            t -= longest
    return len(heap)`
},
{
  id: "m14-penalty",
  module: "ML9",
  title: "ICPC penalty from a log",
  diff: 2, minutes: 30,
  theory: "ICPC scoring: each solved problem costs its solve minute plus 20 minutes per prior wrong submission on that problem; unsolved problems cost nothing. Replaying a chronological submission log — a wrong-attempt counter per problem plus a set of already-solved ones — is a small deterministic simulation, the same pattern as most contest-analytics tasks.",
  prompt: "Implement `total_penalty(log)` → total penalty minutes. `log` rows are `[minute, problem, verdict]` in chronological order; verdict is 'OK' or 'WA'. For each problem only the first 'OK' counts (later rows are ignored): add its minute + 20 * (# of 'WA' rows on that problem before it). Return an int.",
  hint: "Keep a solved set and a per-problem wrong counter; skip any row whose problem is already solved.",
  starter:
`def total_penalty(log):
    # your code
    return 0`,
  entry: "total_penalty",
  gen:
`def gen(rng):
    nprobs = int(rng.integers(2, 5))
    probs = ["A", "B", "C", "D"][:nprobs]
    events = []
    for p in probs:
        w = int(rng.integers(0, 4))
        solved = bool(rng.random() < 0.8)
        nev = w + (1 if solved else 0)
        if nev == 0:
            continue
        times = sorted(int(t) for t in rng.choice(range(5, 280), nev, replace=False))
        for i in range(w):
            events.append([times[i], p, "WA"])
        if solved:
            events.append([times[w], p, "OK"])
            # post-solve noise — the "later rows are ignored" rule must be exercised:
            # extra WA/duplicate-OK rows must NOT change the score
            for extra_t in rng.choice(range(times[w] + 1, 300), int(rng.integers(0, 3)), replace=False):
                events.append([int(extra_t), p, str(rng.choice(["WA", "OK"]))])
    events.sort(key=lambda e: e[0])
    if not events:
        events = [[10, "A", "OK"]]
    return {"log": events}`,
  solve:
`def total_penalty(log):
    wrong = collections.Counter()
    solved = set()
    pen = 0
    for minute, prob, verdict in log:
        if prob in solved:
            continue
        if verdict == "OK":
            solved.add(prob)
            pen += minute + 20 * wrong[prob]
        else:
            wrong[prob] += 1
    return pen`
}
);

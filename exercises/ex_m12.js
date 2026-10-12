/* Exercises for M12 — Classical AI: Search, Logic, CSP. */

EXERCISES.push(
{
  id: "m12-constraint-check",
  module: "MATH1",
  title: "Check a CSP assignment",
  diff: 1, minutes: 8,
  theory: "A constraint-satisfaction problem assigns values to variables subject to constraints; the simplest binary constraints are equality ('eq') and inequality ('ne'). Verifying an assignment means looping over every constraint and testing the pair — an O(m) check that is the inner loop of every CSP solver you will ever write.",
  prompt: "Implement `satisfies(assignment, constraints)` → True if and only if every constraint holds. Each constraint is `[i, j, op]` with op `'ne'` (assignment[i] != assignment[j]) or `'eq'` (assignment[i] == assignment[j]).",
  hint: "Loop over constraints, compare assignment[i] vs assignment[j] according to op; return False on the first violation.",
  starter:
`def satisfies(assignment, constraints):
    # your code
    return True`,
  entry: "satisfies",
  gen:
`def gen(rng):
    n = int(rng.integers(4, 9)); d = int(rng.integers(2, 4))
    assignment = rng.integers(0, d, n).tolist()
    m = int(rng.integers(1, 2 * n))
    cons = []
    for _ in range(m):
        i, j = rng.choice(n, 2, replace=False)
        cons.append([int(i), int(j), str(rng.choice(["ne", "eq"]))])
    if rng.random() < 0.3:
        # self-pair: [i, i, "ne"] is a contradiction (x != x) — must force False
        i = int(rng.integers(0, n))
        cons.append([i, i, str(rng.choice(["ne", "eq"]))])
    return {"assignment": assignment, "constraints": cons}`,
  solve:
`def satisfies(assignment, constraints):
    for i, j, op in constraints:
        if op == "ne" and assignment[i] == assignment[j]:
            return False
        if op == "eq" and assignment[i] != assignment[j]:
            return False
    return True`
},
{
  id: "m12-bfs-grid",
  module: "MATH1",
  title: "BFS shortest path on a grid",
  diff: 2, minutes: 45,
  theory: "On an unweighted grid, breadth-first search finds the shortest path in steps: expand a frontier level by level with a FIFO queue, and the first time you pop the goal you have the optimal distance. Mark cells visited when you enqueue them — not when you pop — to avoid quadratic re-exploration. collections.deque gives O(1) popleft.",
  prompt: "Implement `bfs_len(grid, start, goal)` → the length in moves of the shortest 4-connected path (0 = free, 1 = wall), or -1 if unreachable. `start`/`goal` are `[row, col]` and are always free cells.",
  hint: "deque with (r, c); dist dict or visited set; try the four neighbours inside bounds on free cells.",
  starter:
`def bfs_len(grid, start, goal):
    # your code
    return -1`,
  entry: "bfs_len",
  gen:
`def gen(rng):
    h = int(rng.integers(3, 9)); w = int(rng.integers(3, 9))
    grid = (rng.random((h, w)) < float(rng.uniform(0.15, 0.35))).astype(int).tolist()
    free = [(r, c) for r in range(h) for c in range(w) if grid[r][c] == 0]
    if len(free) < 2:
        grid[0][0] = 0; grid[h - 1][w - 1] = 0
        free = [(r, c) for r in range(h) for c in range(w) if grid[r][c] == 0]
    i, j = rng.choice(len(free), 2, replace=False)
    if rng.random() < 0.1:
        j = i   # start == goal → distance 0
    return {"grid": grid, "start": list(free[int(i)]), "goal": list(free[int(j)])}`,
  solve:
`def bfs_len(grid, start, goal):
    h, w = len(grid), len(grid[0])
    s, g = tuple(start), tuple(goal)
    if s == g:
        return 0
    dist = {s: 0}
    q = collections.deque([s])
    while q:
        r, c = q.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < h and 0 <= nc < w and grid[nr][nc] == 0 and (nr, nc) not in dist:
                if (nr, nc) == g:
                    return dist[(r, c)] + 1
                dist[(nr, nc)] = dist[(r, c)] + 1
                q.append((nr, nc))
    return -1`
},
{
  id: "m12-astar-grid",
  module: "MATH1",
  title: "A* path reconstruction",
  diff: 3, minutes: 45,
  theory: "A* is BFS guided by a priority: expand the node with smallest f = g + h, where g is the cost so far and h an admissible heuristic. On a 4-connected unit-cost grid the Manhattan distance |r-goal_r| + |c-goal_c| never overestimates, so the first time the goal is popped its g is optimal. Contests usually want the route, not just its length — carry the path itself (or parent pointers) in the search state. heapq compares tuples element by element, so pushing (f, path) makes equal-f pops deterministic: the lexicographically smallest path wins.",
  prompt: "Implement `astar_path(grid, start, goal)` → the shortest 4-connected path as a list of `[r, c]` cells from start to goal inclusive (0 = free, 1 = wall), or `[]` if unreachable. When several shortest paths exist return the **lexicographically smallest** one (compare cell lists element by element) — use a Manhattan heuristic and a `(f, path)` heap so the answer is unique. `start`/`goal` are `[row, col]`; if `start == goal` the path is `[start]`.",
  hint: "Push (f, path_tuple) onto heapq; push on <= (not <) so equal-cost paths are also offered, and settle each node at first pop (a 'done' set) — the heap's path ordering then makes the first goal pop the lex-min route.",
  starter:
`def astar_path(grid, start, goal):
    # your code
    return []`,
  entry: "astar_path",
  gen:
`def gen(rng):
    h = int(rng.integers(4, 12)); w = int(rng.integers(4, 12))
    grid = (rng.random((h, w)) < float(rng.uniform(0.15, 0.35))).astype(int).tolist()
    free = [(r, c) for r in range(h) for c in range(w) if grid[r][c] == 0]
    if len(free) < 2:
        grid[0][0] = 0; grid[h - 1][w - 1] = 0
        free = [(r, c) for r in range(h) for c in range(w) if grid[r][c] == 0]
    i, j = rng.choice(len(free), 2, replace=False)
    if rng.random() < 0.1:
        j = i   # start == goal → the path is just [start]
    return {"grid": grid, "start": list(free[int(i)]), "goal": list(free[int(j)])}`,
  solve:
`def astar_path(grid, start, goal):
    h, w = len(grid), len(grid[0])
    s, g = tuple(start), tuple(goal)
    def heur(r, c):
        return abs(r - g[0]) + abs(c - g[1])
    best = {s: 0}
    done = set()
    pq = [(heur(*s), (s,))]
    while pq:
        f, path = heapq.heappop(pq)
        node = path[-1]
        if node in done:
            continue
        done.add(node)               # first pop at min g is the lex-min path here
        if node == g:
            return [list(p) for p in path]
        d = len(path) - 1
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = node[0] + dr, node[1] + dc
            if 0 <= nr < h and 0 <= nc < w and grid[nr][nc] == 0 and (nr, nc) not in done:
                nd = d + 1
                if nd <= best.get((nr, nc), 1 << 30):
                    best[(nr, nc)] = nd
                    heapq.heappush(pq, (nd + heur(nr, nc), path + ((nr, nc),)))
    return []`
},
{
  id: "m12-minimax",
  module: "MATH1",
  title: "Minimax on a game tree",
  diff: 2, minutes: 15,
  theory: "Minimax values a zero-sum game tree bottom-up: the root player (MAX) picks the child with the largest value, the opponent (MIN) the smallest, alternating each level. A leaf is a plain number (the payoff to MAX); an internal node is a list of children. Depth parity — not node identity — decides who moves.",
  prompt: "Implement `minimax(tree)` → the value of the game. `tree` is a number (leaf) or a list of sub-trees; the root is a MAX node and players alternate by depth. Every internal node has at least one child.",
  hint: "Recurse with a maxing flag: leaf → its value; else max/min over children depending on the flag.",
  starter:
`def minimax(tree):
    # your code — recurse: MAX on even depth, MIN on odd; a bare number is a leaf
    return None  # wrong — replace`,
  entry: "minimax",
  gen:
`def gen(rng):
    def make(d):
        if d == 0 or rng.random() < 0.15:
            return int(rng.integers(-9, 10))
        return [make(d - 1) for _ in range(int(rng.integers(1, 4)))]  # 1-child nodes are legal too
    if rng.random() < 0.1:
        return {"tree": int(rng.integers(-9, 10))}   # bare leaf root per spec
    tree = [make(int(rng.integers(1, 4))) for _ in range(int(rng.integers(1, 4)))]
    return {"tree": tree}`,
  solve:
`def minimax(tree):
    def rec(node, maxing):
        if not isinstance(node, list):
            return node
        vals = [rec(c, not maxing) for c in node]
        return max(vals) if maxing else min(vals)
    return rec(tree, True)`
},
{
  id: "m12-nqueens",
  module: "MATH1",
  title: "Count n-queens completions",
  diff: 3, minutes: 45,
  theory: "Queens attack along rows, columns and diagonals. On a diagonal, the row and column change by equal amounts: (0, 1) attacks (2, 3), but not (2, 2). Backtracking tries a placement, explores what can follow, then undoes it before trying another. Reject a partial board as soon as two queens attack each other. The fixed queens must stay in every completion, including those in rows you have not reached yet. Decide how to check conflicts and restore your state; scanning existing queens is sufficient for boards of size at most 8.",
  prompt: "Implement `count_queens(n, fixed)` → the number of ways to place `n` non-attacking queens on an n×n board keeping the pre-placed queens in `fixed` (a list of `[row, col]`, mutually non-attacking, in distinct rows, possibly empty; n between 2 and 8). E.g. `count_queens(4, [])` = 2, `count_queens(4, [[0, 1]])` = 1.",
  hint: "Seed cols / r-c / r+c sets and a row→col map from `fixed`; rows already occupied just advance the recursion.",
  starter:
`def count_queens(n, fixed):
    # your code
    return 0`,
  entry: "count_queens",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 9))
    k = int(rng.integers(0, min(3, n)))
    fixed = []
    for r in [int(v) for v in rng.choice(n, k, replace=False)]:
        for _ in range(50):
            c = int(rng.integers(0, n))
            if all(c != c2 and abs(r - r2) != abs(c - c2) for r2, c2 in fixed):
                fixed.append([r, c])
                break
    return {"n": n, "fixed": fixed}`,
  solve:
`def count_queens(n, fixed):
    cols = {c for r, c in fixed}
    d1 = {r - c for r, c in fixed}
    d2 = {r + c for r, c in fixed}
    row_of = {r for r, c in fixed}
    def bt(r):
        if r == n:
            return 1
        if r in row_of:
            return bt(r + 1)
        total = 0
        for c in range(n):
            if c in cols or (r - c) in d1 or (r + c) in d2:
                continue
            cols.add(c); d1.add(r - c); d2.add(r + c)
            total += bt(r + 1)
            cols.discard(c); d1.discard(r - c); d2.discard(r + c)
        return total
    return bt(0)`
}
);

EXERCISES.push(
{
  id: "m12-dijkstra",
  module: "MATH1",
  title: "Dijkstra on a weighted grid",
  diff: 3, minutes: 45,
  theory: "When moves have different costs, BFS's uniform layering breaks — use Dijkstra: expand the unsettled node with the smallest tentative distance from a priority queue, relax its neighbours, and skip pops whose stored distance is stale. The first time the goal is popped its distance is final. On a grid where stepping onto a cell costs that cell's weight, path cost is just the sum of cell weights along the route.",
  prompt: "Implement `grid_cost(grid, start, goal)` → the minimum cost of a 4-connected path where `grid[r][c]` is the cost of stepping onto cell (r, c). The cost of a path is the sum of the weights of all its cells **including the start cell**. `start`/`goal` are `[row, col]`; every cell is passable.",
  hint: "heapq of (cost, r, c); dist dict seeded with grid[start]'s weight; relax the four neighbours inside bounds; return when you pop the goal.",
  starter:
`def grid_cost(grid, start, goal):
    # your code
    return -1`,
  entry: "grid_cost",
  gen:
`def gen(rng):
    h = int(rng.integers(3, 9)); w = int(rng.integers(3, 9))
    grid = rng.integers(1, 10, (h, w)).tolist()
    cells = [(r, c) for r in range(h) for c in range(w)]
    i, j = rng.choice(len(cells), 2, replace=False)
    if rng.random() < 0.1:
        j = i   # start == goal → cost is just the start cell's weight
    return {"grid": grid, "start": list(cells[int(i)]), "goal": list(cells[int(j)])}`,
  solve:
`def grid_cost(grid, start, goal):
    h, w = len(grid), len(grid[0])
    s, g = tuple(start), tuple(goal)
    dist = {s: grid[s[0]][s[1]]}
    pq = [(grid[s[0]][s[1]], s[0], s[1])]
    while pq:
        d, r, c = heapq.heappop(pq)
        if (r, c) == g:
            return d
        if d > dist.get((r, c), 1 << 30):
            continue
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < h and 0 <= nc < w:
                nd = d + grid[nr][nc]
                if nd < dist.get((nr, nc), 1 << 30):
                    dist[(nr, nc)] = nd
                    heapq.heappush(pq, (nd, nr, nc))
    return -1`
},
{
  id: "m12-prop-eval",
  module: "MATH1",
  title: "Evaluate a propositional formula",
  diff: 2, minutes: 30,
  theory: "Propositional formulas are trees: variables at the leaves, connectives at internal nodes, so evaluation is a post-order walk — evaluate children, then apply the operator. Representing the formula as nested tuples like ('and', a, b) turns the evaluator into a small recursive dispatcher; 'not' is unary, the rest binary. The same recursive-descent pattern handles any tree-structured input.",
  prompt: "Implement `eval_formula(env, f)` → the truth value (a plain bool) of formula `f` under assignment `env` (dict: variable name → bool). `f` is either a variable name string, `(\"not\", a)`, or `(\"and\"|\"or\"|\"xor\", a, b)` with subformulas a and b.",
  hint: "if isinstance(f, str): look it up in env. Otherwise dispatch on f[0] and recurse; xor is a != b.",
  starter:
`def eval_formula(env, f):
    # your code
    return True`,
  entry: "eval_formula",
  gen:
`def gen(rng):
    names = ["p", "q", "r", "s"]
    env = {v: bool(rng.integers(0, 2)) for v in names}
    def make(d):
        if d == 0 or rng.random() < 0.3:
            return str(rng.choice(names))
        op = str(rng.choice(["and", "or", "xor", "not"]))
        if op == "not":
            return (op, make(d - 1))
        return (op, make(d - 1), make(d - 1))
    op = str(rng.choice(["and", "or", "xor", "not"]))
    f = (op, make(2)) if op == "not" else (op, make(2), make(2))
    if rng.random() < 0.15:
        f = str(rng.choice(names))   # top-level bare variable — spec allows it
    return {"env": env, "f": f}`,
  solve:
`def eval_formula(env, f):
    if isinstance(f, str):
        return bool(env[f])
    op = f[0]
    if op == "not":
        return not eval_formula(env, f[1])
    a = eval_formula(env, f[1])
    b = eval_formula(env, f[2])
    if op == "and":
        return a and b
    if op == "or":
        return a or b
    return a != b`
},
{
  id: "m12-topo",
  module: "MATH1",
  title: "Deterministic topological sort",
  diff: 2, minutes: 45,
  theory: "A topological order lists the nodes of a DAG (directed acyclic graph — edges `u→v` mean u must come first, no cycles) so every edge points forward. A node's **in-degree** is how many edges point into it. Kahn's algorithm sorts a DAG: repeatedly emit a node with in-degree 0 and remove its outgoing edges. The order is unique only if you fix a tie-break — always emitting the smallest available id makes the output deterministic, which an auto-grader needs. A heap of ready nodes yields the smallest id in O(log n).",
  prompt: "Implement `topo_order(n, edges)` → a topological ordering of nodes `0..n-1`. `edges` is a list of `[u, v]` meaning u must come before v; the input is always a DAG. When several nodes are available, always emit the smallest id so the answer is unique.",
  hint: "indeg array + adjacency list; seed a heap with all in-degree-0 nodes; pop smallest, decrement neighbours, push each when it reaches 0.",
  starter:
`def topo_order(n, edges):
    # your code
    return list(range(n))`,
  entry: "topo_order",
  gen:
`def gen(rng):
    n = int(rng.integers(4, 10))
    perm = [int(v) for v in rng.permutation(n)]
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            if rng.random() < 0.3:
                edges.append([perm[i], perm[j]])
    return {"n": n, "edges": edges}`,
  solve:
`def topo_order(n, edges):
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    pq = [i for i in range(n) if indeg[i] == 0]
    heapq.heapify(pq)
    out = []
    while pq:
        u = heapq.heappop(pq)
        out.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(pq, v)
    return out`
}
);

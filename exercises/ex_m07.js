/* Exercises for M7 — Geometry: Matching & Odometry. */

EXERCISES.push(
{
  id: "m07-rot2d",
  module: "AI2",
  title: "2-D rotation matrix",
  diff: 1, minutes: 6,
  theory: "A planar rotation by angle θ maps a column vector p to R·p with R = [[cos θ, −sin θ], [sin θ, cos θ]] — the columns are the rotated images of the basis vectors. It is used in odometry, pose estimation and augmentation code.",
  prompt: "Implement `rot2d(theta)` → the 2×2 rotation matrix for angle `theta` (radians, counter-clockwise).\n\n```\nrot2d(pi/2) → [[0, -1], [1, 0]]\n```",
  hint: "c, s = np.cos(theta), np.sin(theta); return np.array([[c, -s], [s, c]]).",
  starter:
`def rot2d(theta):
    # your code
    return np.eye(2)`,
  entry: "rot2d",
  gen:
`def gen(rng):
    return {"theta": float(rng.uniform(-3.2, 3.2))}`,
  solve:
`def rot2d(theta):
    c, s = np.cos(theta), np.sin(theta)
    return np.array([[c, -s], [s, c]])`
},
{
  id: "m07-homogeneous",
  module: "AI2",
  title: "Homogeneous coordinates, to and from",
  diff: 1, minutes: 8,
  theory: "Homogeneous coordinates append a scale coordinate w so that translations become matrix operations: (x, y) → (x, y, 1). Going back divides every coordinate by w and drops it: (X, Y, w) → (X/w, Y/w). Camera and robot geometry code uses this pair of conversions throughout.",
  prompt: "Implement `homogeneous(P, mode)` where `P` is an (n, 2) or (n, 3) array of points.\n- mode `\"to\"`: append a column of ones → (n, 3).\n- mode `\"from\"`: divide the first two columns by the last column → (n, 2).",
  hint: "to: np.hstack([P, np.ones((len(P), 1))]). from: P[:, :-1] / P[:, -1:] (keep the last axis 2-D for broadcasting).",
  starter:
`def homogeneous(P, mode):
    P = np.asarray(P, dtype=float)
    # your code
    return P`,
  entry: "homogeneous",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 10))
    mode = str(rng.choice(["to", "from"]))
    if mode == "to":
        P = rng.normal(0, 5, (n, 2))
    else:
        P = np.hstack([rng.normal(0, 5, (n, 2)), rng.uniform(0.5, 3.0, (n, 1))])
    return {"P": P, "mode": mode}`,
  solve:
`def homogeneous(P, mode):
    P = np.asarray(P, dtype=float)
    if mode == "to":
        return np.hstack([P, np.ones((P.shape[0], 1))])
    return P[:, :-1] / P[:, -1:]`
},
{
  id: "m07-apply-transform",
  module: "AI2",
  title: "Apply a 3×3 transform to points",
  diff: 2, minutes: 10,
  theory: "A 3×3 transform acts on homogeneous points as p' = T·p̃, after which you divide by the third coordinate. For rigid transforms w stays 1, but general affine/projective transforms make the division step essential — skip it and your points silently warp.",
  prompt: "Implement `apply_transform(T, P)`: apply the 3×3 homogeneous transform `T` to the (n, 2) points `P` and return the (n, 2) Cartesian result (divide by the homogeneous scale w).",
  hint: "Augment P with a ones column, right-multiply by T.T (row-vector convention p' = T·p), then divide the first two columns by the third.",
  starter:
`def apply_transform(T, P):
    T = np.asarray(T, dtype=float)
    P = np.asarray(P, dtype=float)
    # your code
    return P`,
  entry: "apply_transform",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 10))
    th = float(rng.uniform(-3.14, 3.14))
    sc = float(rng.uniform(0.7, 1.8))
    c, s = np.cos(th), np.sin(th)
    T = np.array([[sc * c, -sc * s, float(rng.uniform(-4, 4))],
                  [sc * s,  sc * c, float(rng.uniform(-4, 4))],
                  [0.0, 0.0, 1.0]])
    if rng.random() < 0.3:
        T[2, :2] = rng.uniform(-0.05, 0.05, 2)   # small projective row; w stays > 0.5 for |p| <= 5
    return {"T": T, "P": rng.uniform(-5, 5, (n, 2))}`,
  solve:
`def apply_transform(T, P):
    T = np.asarray(T, dtype=float)
    P = np.asarray(P, dtype=float)
    Ph = np.hstack([P, np.ones((P.shape[0], 1))])
    out = Ph @ T.T
    return out[:, :2] / out[:, 2:3]`
},
{
  id: "m07-compose",
  module: "AI2",
  title: "Compose two transforms",
  diff: 2, minutes: 8,
  theory: "With column vectors (p' = T·p), applying transform A and then transform B equals the single transform B·A — the later transform multiplies on the left. Order matters: matrix multiplication is not commutative, and composing in the wrong order is a frequent odometry bug.",
  prompt: "Implement `compose(first, second)` → the 3×3 matrix equivalent to applying `first` and then `second` (column-vector convention p' = T·p).",
  hint: "second @ first — the transform applied later goes on the left of the product.",
  starter:
`def compose(first, second):
    first = np.asarray(first, dtype=float)
    second = np.asarray(second, dtype=float)
    # your code
    return np.eye(3)`,
  entry: "compose",
  gen:
`def gen(rng):
    def rigid():
        th = float(rng.uniform(-3.14, 3.14))
        sc = float(rng.uniform(0.6, 1.9))
        c, s = np.cos(th), np.sin(th)
        return np.array([[sc * c, -sc * s, float(rng.uniform(-4, 4))],
                         [sc * s,  sc * c, float(rng.uniform(-4, 4))],
                         [0.0, 0.0, 1.0]])
    return {"first": rigid(), "second": rigid()}`,
  solve:
`def compose(first, second):
    return np.asarray(second, dtype=float) @ np.asarray(first, dtype=float)`
},
{
  id: "m07-invert-transform",
  module: "AI2",
  title: "Invert a rigid transform",
  diff: 2, minutes: 10,
  theory: "A rigid transform T = [[R, t], [0, 1]] has orthonormal R, so R⁻¹ = Rᵀ — no general inverse needed. The full inverse is [[Rᵀ, −Rᵀ·t], [0, 1]]: cheaper, exact, and numerically nicer than np.linalg.inv (which still agrees, of course).",
  prompt: "Implement `invert_transform(T)` → the inverse of the rigid 3×3 transform `T`, using the Rᵀ / −Rᵀ·t structure.",
  hint: "R = T[:2, :2]; t = T[:2, 2]. Start from np.eye(3), set the top-left block to R.T and the top-right column to -(R.T @ t).",
  starter:
`def invert_transform(T):
    T = np.asarray(T, dtype=float)
    # your code
    return np.eye(3)`,
  entry: "invert_transform",
  gen:
`def gen(rng):
    th = float(rng.uniform(-3.14, 3.14))
    c, s = np.cos(th), np.sin(th)
    T = np.array([[c, -s, float(rng.uniform(-4, 4))],
                  [s,  c, float(rng.uniform(-4, 4))],
                  [0.0, 0.0, 1.0]])
    return {"T": T}`,
  solve:
`def invert_transform(T):
    T = np.asarray(T, dtype=float)
    R, t = T[:2, :2], T[:2, 2]
    Ti = np.eye(3)
    Ti[:2, :2] = R.T
    Ti[:2, 2] = -(R.T @ t)
    return Ti`
},
{
  id: "m07-match-translate",
  module: "AI2",
  title: "Match descriptors, estimate translation",
  diff: 3, minutes: 15,
  theory: "Basic feature matching: for each query descriptor take the nearest (L2) train descriptor, then reject matches whose distance exceeds a gate. With the surviving point correspondences, the pure-translation estimate is the difference of centroids — the closed-form optimum under a translation-only model.",
  prompt: "Implement `match_translate(src_pts, src_desc, dst_pts, dst_desc, max_dist)`:\n1. For every row of `src_desc`, find the index of the nearest row of `dst_desc` (Euclidean distance; ties → lowest index).\n2. Keep the match only if its distance ≤ `max_dist`, otherwise mark it −1.\n3. Return `(matches, t)`: `matches` is an (n_src,) int array; `t` is the (2,) translation `centroid(dst_pts[kept]) − centroid(src_pts[kept])` over kept matches, or `[0, 0]` when none survive.\n\n```\nsrc_pts=[[0,0],[1,0]], src_desc=[[0],[10]]; dst_pts=[[1,1],[2,1]], dst_desc=[[0.1],[10.2]], max_dist=0.5\n→ both match (dist 0.1, 0.2) → matches=[0,1]; centroids [0.5,0] & [1.5,1] → t=[1.0,1.0]\n```",
  hint: "Pairwise distances via broadcasting: d = np.sqrt(((src_desc[:, None, :] - dst_desc[None, :, :])**2).sum(-1)); nn = d.argmin(1). Gate with np.where(d[np.arange(n), nn] <= max_dist, nn, -1), then take column means.",
  starter:
`def match_translate(src_pts, src_desc, dst_pts, dst_desc, max_dist):
    src_pts = np.asarray(src_pts, dtype=float)
    # your code
    return np.zeros(len(src_pts), dtype=int), np.zeros(2)`,
  entry: "match_translate",
  gen:
`def gen(rng):
    n = int(rng.integers(6, 12))
    m = n + int(rng.integers(0, 4))
    d = int(rng.integers(4, 9))
    src_pts = rng.normal(0, 5, (n, 2))
    src_desc = rng.normal(0, 1, (n, d))
    dst_pts = np.vstack([src_pts + rng.uniform(-3, 3, 2) + rng.normal(0, 0.05, (n, 2)),
                         rng.normal(0, 5, (m - n, 2))])
    dst_desc = np.vstack([src_desc + rng.normal(0, 0.1, (n, d)),
                          rng.normal(0, 1, (m - n, d))])
    far = rng.random(n) < 0.3
    if rng.random() < 0.12:
        dst_desc = dst_desc + 50.0   # every distance >> max_dist -> all gated, t=[0,0]
    elif far.any():
        # some src rows get no near dst descriptor — NN distance > max_dist,
        # so a solution ignoring the gate must fail
        src_desc[far] += rng.normal(0, 4, (int(far.sum()), d))
    return {"src_pts": src_pts, "src_desc": src_desc,
            "dst_pts": dst_pts, "dst_desc": dst_desc,
            "max_dist": float(rng.uniform(0.5, 2.0))}`,
  solve:
`def match_translate(src_pts, src_desc, dst_pts, dst_desc, max_dist):
    src_pts = np.asarray(src_pts, dtype=float)
    dst_pts = np.asarray(dst_pts, dtype=float)
    src_desc = np.asarray(src_desc, dtype=float)
    dst_desc = np.asarray(dst_desc, dtype=float)
    d = np.sqrt(((src_desc[:, None, :] - dst_desc[None, :, :]) ** 2).sum(-1))
    nn = d.argmin(axis=1)
    mind = d[np.arange(len(src_desc)), nn]
    matches = np.where(mind <= max_dist, nn, -1)
    kept = matches >= 0
    if not kept.any():
        return matches, np.zeros(2)
    t = dst_pts[matches[kept]].mean(axis=0) - src_pts[kept].mean(axis=0)
    return matches, t`
},
{
  id: "m07-odometry",
  module: "AI2",
  title: "Visual odometry integration",
  diff: 3, minutes: 30,
  theory: "Dead reckoning: each frame reports a motion (dx, dy, dθ) measured in the robot's *current* heading frame, not the world frame. To accumulate a trajectory you rotate the displacement by the current heading, add it to the position, and only then update the heading — the unicycle model behind wheel and visual odometry.",
  prompt: "Implement `integrate_odometry(steps)`: `steps` is an (n, 3) array of per-frame `(dx, dy, dtheta)` in the body frame. Starting from pose (0, 0, 0), integrate: rotate (dx, dy) by the current θ into the world frame, add to the position, then θ += dtheta. Return the (n+1, 3) trajectory including the initial pose.",
  hint: "wx = cos(θ)*dx − sin(θ)*dy; wy = sin(θ)*dx + cos(θ)*dy. Loop over rows, append [x, y, θ] after each update, np.array the list at the end.",
  starter:
`def integrate_odometry(steps):
    steps = np.asarray(steps, dtype=float)
    # your code
    return np.zeros((len(steps) + 1, 3))`,
  entry: "integrate_odometry",
  gen:
`def gen(rng):
    n = int(rng.integers(3, 15))
    steps = np.column_stack([rng.normal(0.6, 0.3, n),
                             rng.normal(0.0, 0.2, n),
                             rng.normal(0.0, 0.3, n)])
    return {"steps": steps}`,
  solve:
`def integrate_odometry(steps):
    steps = np.asarray(steps, dtype=float)
    x = y = th = 0.0
    traj = [[0.0, 0.0, 0.0]]
    for dx, dy, dth in steps:
        x += np.cos(th) * dx - np.sin(th) * dy
        y += np.sin(th) * dx + np.cos(th) * dy
        th += dth
        traj.append([x, y, th])
    return np.array(traj)`
}
);

EXERCISES.push(
{
  id: "m07-triangulate",
  module: "AI2",
  title: "Triangulate a point from two rays",
  diff: 3, minutes: 15,
  theory: "Two cameras observing the same landmark each contribute a ray c + t·d, and the triangulated point is the midpoint of the segment where the two rays pass closest. Minimizing ||c1 + t·d1 − c2 − s·d2||² over (t, s) yields the 2×2 normal equations [[d1·d1, −d1·d2], [−d1·d2, d2·d2]]·[t, s]ᵀ = [−d1·w, d2·w]ᵀ with w = c1 − c2. Noisy rays never intersect exactly, so the point is estimated by least squares rather than by intersecting lines.",
  prompt: "Implement `triangulate(c1, d1, c2, d2)` → the 3-D midpoint of the closest points of rays `c1 + t·d1` and `c2 + s·d2`. Solve the 2×2 system for `(t, s)` (use np.linalg.lstsq so near-parallel rays cannot crash you), then return `((c1 + t·d1) + (c2 + s·d2)) / 2`.",
  hint: "w = c1 - c2; b = d1·d2; A = [[d1·d1, -b], [-b, d2·d2]]; rhs = [-d1·w, d2·w]; t, s = np.linalg.lstsq(A, rhs, rcond=None)[0].",
  starter:
`def triangulate(c1, d1, c2, d2):
    c1 = np.asarray(c1, dtype=float)
    # your code
    return c1`,
  entry: "triangulate",
  gen:
`def gen(rng):
    c1 = np.array([float(rng.uniform(-3, -1)), float(rng.uniform(-0.5, 0.5)), float(rng.uniform(-0.5, 0.5))])
    c2 = np.array([float(rng.uniform(1, 3)), float(rng.uniform(-0.5, 0.5)), float(rng.uniform(-0.5, 0.5))])
    P = np.array([float(rng.uniform(-1, 1)), float(rng.uniform(-1, 1)), float(rng.uniform(1.5, 4.0))])
    near_parallel = rng.random() < 0.15
    if near_parallel:
        c2 = c1 + rng.normal(0, 0.05, 3)   # rays almost parallel — the ill-conditioned case
    d1 = P - c1 + rng.normal(0, 0.02, 3)
    d2 = P - c2 + rng.normal(0, 0.02, 3)
    cos = abs(float(np.dot(d1, d2)) / (np.linalg.norm(d1) * np.linalg.norm(d2)))
    if cos > 0.98 and not near_parallel:
        d2 = d2 + np.array([0.0, 0.5, 0.0])
    return {"c1": c1, "d1": d1, "c2": c2, "d2": d2}`,
  solve:
`def triangulate(c1, d1, c2, d2):
    c1 = np.asarray(c1, dtype=float)
    c2 = np.asarray(c2, dtype=float)
    d1 = np.asarray(d1, dtype=float)
    d2 = np.asarray(d2, dtype=float)
    w = c1 - c2
    b = float(np.dot(d1, d2))
    A = np.array([[np.dot(d1, d1), -b], [-b, np.dot(d2, d2)]])
    rhs = np.array([-np.dot(d1, w), np.dot(d2, w)])
    t, s = np.linalg.lstsq(A, rhs, rcond=None)[0]
    return ((c1 + t * d1) + (c2 + s * d2)) / 2.0`
},
{
  id: "m07-inlier-ratio",
  module: "AI2",
  title: "Inlier ratio under a motion hypothesis",
  diff: 2, minutes: 10,
  theory: "RANSAC scores a candidate transform by counting how many correspondences it explains: transform the source points, measure each residual to its target, and call everything within the threshold an inlier. The inlier ratio — not the mean residual — picks the winning hypothesis, because a model explaining 80% of matches beats one explaining 30% even if its residuals are slightly larger.",
  prompt: "Implement `inlier_ratio(T, P, Q, tau)` → tuple `(mask, ratio)`: apply the 3×3 homogeneous transform `T` to the (n, 2) points `P` (divide by the homogeneous w), compute per-point Euclidean distances to `Q`, set `mask[i]` where distance ≤ `tau`, and return the boolean mask plus the float fraction of inliers.",
  hint: "Ph = np.hstack([P, np.ones((n, 1))]); out = Ph @ T.T; Pt = out[:, :2] / out[:, 2:3]; mask = np.linalg.norm(Pt - Q, axis=1) <= tau; ratio = mask.mean().",
  starter:
`def inlier_ratio(T, P, Q, tau):
    P = np.asarray(P, dtype=float)
    # your code
    return np.zeros(len(P), dtype=bool), 0.0`,
  entry: "inlier_ratio",
  gen:
`def gen(rng):
    n = int(rng.integers(6, 15))
    th = float(rng.uniform(-3.14, 3.14))
    sc = float(rng.uniform(0.7, 1.6))
    c, s = np.cos(th), np.sin(th)
    txy = rng.uniform(-4, 4, 2)
    T = np.array([[sc * c, -sc * s, txy[0]],
                  [sc * s,  sc * c, txy[1]],
                  [0.0, 0.0, 1.0]])
    if rng.random() < 0.4:
        # slight projective warp: w != 1, so skipping the homogeneous divide is wrong
        T[2, 0] = rng.uniform(-0.06, 0.06)
        T[2, 1] = rng.uniform(-0.06, 0.06)
    P = rng.uniform(-5, 5, (n, 2))
    Qh = np.hstack([P, np.ones((n, 1))]) @ T.T
    Q = Qh[:, :2] / Qh[:, 2:3] + rng.normal(0, 0.05, (n, 2))
    out_idx = rng.random(n) < 0.3
    if out_idx.any():
        Q[out_idx] = rng.uniform(-5, 5, (int(out_idx.sum()), 2))
    tau = float(rng.uniform(0.3, 0.9))
    if rng.random() < 0.3:
        # snap tau onto a realized distance so "<=" vs "<" is decided
        Ph = np.hstack([P, np.ones((n, 1))]) @ T.T
        Pt = Ph[:, :2] / Ph[:, 2:3]
        dd = np.linalg.norm(Pt - Q, axis=1)
        tau = float(dd[int(rng.integers(n))])
    return {"T": T, "P": P, "Q": Q, "tau": tau}`,
  solve:
`def inlier_ratio(T, P, Q, tau):
    T = np.asarray(T, dtype=float)
    P = np.asarray(P, dtype=float)
    Q = np.asarray(Q, dtype=float)
    Ph = np.hstack([P, np.ones((P.shape[0], 1))])
    out = Ph @ T.T
    Pt = out[:, :2] / out[:, 2:3]
    mask = np.linalg.norm(Pt - Q, axis=1) <= tau
    return mask, float(mask.mean())`
}
);

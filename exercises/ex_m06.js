/* Exercises for M6 — CV: Detection, Counting, Segmentation, Efficiency.
   Boxes are xyxy numpy arrays [x1, y1, x2, y2] with x1 < x2, y1 < y2. */

EXERCISES.push(
{
  id: "m06-iou",
  module: "AI2",
  title: "IoU of two boxes",
  diff: 1, minutes: 8,
  theory: "Intersection-over-Union (IoU) is the standard overlap measure in object detection: overlap area divided by union area. For xyxy boxes the intersection is itself a box — left = max of the lefts, right = min of the rights — and its width/height must be clamped at 0 for disjoint boxes.",
  prompt: "Implement `iou(box, gt)` for two `[x1, y1, x2, y2]` boxes (x1 < x2, y1 < y2 guaranteed, so areas are positive) → IoU as a float in [0, 1].",
  hint: "inter = max(0, min(x2s) − max(x1s)) · max(0, min(y2s) − max(y1s)); union = areaA + areaB − inter.",
  starter:
`def iou(box, gt):
    box = np.asarray(box, dtype=float)
    gt = np.asarray(gt, dtype=float)
    # your code
    return 0.0`,
  entry: "iou",
  gen:
`def gen(rng):
    def box():
        x1 = float(rng.integers(0, 10))
        y1 = float(rng.integers(0, 10))
        x2 = x1 + float(rng.integers(1, 8))
        y2 = y1 + float(rng.integers(1, 8))
        return np.array([x1, y1, x2, y2])
    if rng.random() < 0.5:
        # correlate the pair so they overlap — disjoint boxes are ~72% otherwise
        x1 = float(rng.integers(0, 8)); y1 = float(rng.integers(0, 8))
        box = np.array([x1, y1, x1 + float(rng.integers(2, 6)), y1 + float(rng.integers(2, 6))])
        gt = box + rng.integers(-2, 3, 4)
        gt[:2] = np.minimum(gt[:2], box[:2] + 1)          # keep a real intersection
        gt[2:] = np.maximum(gt[2:], gt[:2] + 1)           # stay a valid box
        return {"box": box, "gt": gt}
    return {"box": box(), "gt": box()}`,
  solve:
`def iou(box, gt):
    box = np.asarray(box, dtype=float)
    gt = np.asarray(gt, dtype=float)
    ix1, iy1 = max(box[0], gt[0]), max(box[1], gt[1])
    ix2, iy2 = min(box[2], gt[2]), min(box[3], gt[3])
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    ua = (box[2] - box[0]) * (box[3] - box[1]) \\
       + (gt[2] - gt[0]) * (gt[3] - gt[1]) - inter
    return float(inter / ua)`,
  tests: 40
},
{
  id: "m06-conv-flops",
  module: "AI2",
  title: "FLOPs of a conv layer",
  diff: 1, minutes: 8,
  theory: "Efficiency questions love FLOP counts. One output element of a conv needs kh·kw·Cin multiply-accumulates; counting 2 FLOPs per MAC (one multiply + one add) over H_out·W_out·C_out outputs gives 2·H_out·W_out·C_out·kh·kw·C_in. For a valid stride-1 conv, H_out = H − kh + 1.",
  prompt: "Implement `conv_flops(h, w, c_in, c_out, k)` → FLOPs of a valid, stride-1 conv with a square k×k kernel: `2 * (h−k+1) * (w−k+1) * c_out * k * k * c_in`, returned as an int. `k ≤ min(h, w)` is guaranteed.",
  hint: "It is exactly the formula — the trap is forgetting the factor 2 (multiply + add) or using h, w instead of the output size.",
  starter:
`def conv_flops(h, w, c_in, c_out, k):
    # your code
    return 0`,
  entry: "conv_flops",
  gen:
`def gen(rng):
    h, w = int(rng.integers(5, 33)), int(rng.integers(5, 33))
    return {"h": h, "w": w,
            "c_in": int(rng.integers(1, 9)),
            "c_out": int(rng.integers(1, 17)),
            "k": int(rng.choice([1, 3, 5]))}`,
  solve:
`def conv_flops(h, w, c_in, c_out, k):
    return int(2 * (h - k + 1) * (w - k + 1) * c_out * k * k * c_in)`,
  tests: 40
},
{
  id: "m06-seg-metrics",
  module: "AI2",
  title: "Pixel accuracy + Dice",
  diff: 2, minutes: 10,
  theory: "Two metrics dominate binary segmentation: pixel accuracy — the fraction of correctly classified pixels, which is misleading under class imbalance — and Dice = 2·|P∩G| / (|P| + |G|), effectively the F1 score of masks. The edge case everyone forgets: two empty masks are a perfect match, so Dice = 1.",
  prompt: "Implement `seg_metrics(pred, gt)` for binary (H, W) masks of 0/1 → `{'pixel_acc': float, 'dice': float}`. Dice = 2·|P∩G| / (|P| + |G|); if both masks are empty, dice = 1.0.",
  hint: "np.logical_and(pred, gt).sum() gives the intersection; compute the denominator first and branch on it being 0.",
  starter:
`def seg_metrics(pred, gt):
    p = np.asarray(pred)
    g = np.asarray(gt)
    # your code
    return {"pixel_acc": 0.0, "dice": 0.0}`,
  entry: "seg_metrics",
  gen:
`def gen(rng):
    h, w = int(rng.integers(3, 11)), int(rng.integers(3, 11))
    p = float(rng.uniform(0.15, 0.6))
    pred = (rng.random((h, w)) < p).astype(int)
    gt = (rng.random((h, w)) < p).astype(int)
    # force empty-mask edge cases ~30% of the time — the
    # both-empty → dice=1 rule must actually be exercised
    u = rng.random()
    if u < 0.10:
        pred[:] = 0; gt[:] = 0
    elif u < 0.20:
        gt[:] = 0
    elif u < 0.30:
        pred[:] = 0
    return {"pred": pred, "gt": gt}`,
  solve:
`def seg_metrics(pred, gt):
    p = np.asarray(pred)
    g = np.asarray(gt)
    acc = float((p == g).mean())
    inter = float(np.logical_and(p, g).sum())
    s = float(p.sum() + g.sum())
    dice = 1.0 if s == 0.0 else 2.0 * inter / s
    return {"pixel_acc": acc, "dice": dice}`,
  tests: 40
},
{
  id: "m06-iou-matrix",
  module: "AI2",
  title: "Pairwise IoU matrix",
  diff: 2, minutes: 30,
  theory: "Matching detections to ground truth needs all pairwise IoUs — an (n, m) matrix. You can broadcast (n,1,4) against (1,m,4) or write two nested loops; both are fast enough at these sizes. Handle empty inputs gracefully: a (0, 4) array in means a (0, m) result out.",
  prompt: "Implement `iou_matrix(boxes, gts)`: given (n, 4) and (m, 4) xyxy box arrays → the (n, m) matrix of pairwise IoU values. Either side may be empty (shape (0, 4)) — return the correctly-shaped empty matrix.",
  hint: "Loop i over boxes, j over gts, reuse the single-box IoU formula into out[i, j]. Vectorized broadcasting also works.",
  starter:
`def iou_matrix(boxes, gts):
    boxes = np.asarray(boxes, dtype=float).reshape(-1, 4)
    gts = np.asarray(gts, dtype=float).reshape(-1, 4)
    # your code
    return np.zeros((len(boxes), len(gts)))`,
  entry: "iou_matrix",
  gen:
`def gen(rng):
    def mk(k):
        x1 = rng.integers(0, 10, k)
        y1 = rng.integers(0, 10, k)
        x2 = x1 + rng.integers(1, 8, k)
        y2 = y1 + rng.integers(1, 8, k)
        return np.stack([x1, y1, x2, y2], axis=1).astype(float).reshape(-1, 4)
    return {"boxes": mk(int(rng.integers(0, 6))),
            "gts": mk(int(rng.integers(0, 6)))}`,
  solve:
`def iou_matrix(boxes, gts):
    a = np.asarray(boxes, dtype=float).reshape(-1, 4)
    b = np.asarray(gts, dtype=float).reshape(-1, 4)
    out = np.zeros((len(a), len(b)))
    for i in range(len(a)):
        for j in range(len(b)):
            ix1 = max(a[i, 0], b[j, 0]); iy1 = max(a[i, 1], b[j, 1])
            ix2 = min(a[i, 2], b[j, 2]); iy2 = min(a[i, 3], b[j, 3])
            inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
            ua = ((a[i, 2] - a[i, 0]) * (a[i, 3] - a[i, 1])
                  + (b[j, 2] - b[j, 0]) * (b[j, 3] - b[j, 1]) - inter)
            out[i, j] = inter / ua
    return out`,
  tests: 40
},
{
  id: "m06-count-blobs",
  module: "AI2",
  title: "Count blobs (connected components)",
  diff: 3, minutes: 45,
  theory: "Counting objects in a binary mask is the connected-components problem: every unvisited foreground cell starts a new blob, then a flood fill marks everything connected to it. Flood fill: push the cell onto a stack; while the stack is non-empty pop a cell, and for each of its 4 neighbors that is in-bounds, a `1`, and unvisited — mark it visited and push it. With 4-connectivity only up/down/left/right neighbors join a blob — diagonal contact does not count. Plain Python loops are plenty for tiny grids; don't reach for scipy.",
  prompt: "Implement `count_blobs(grid)`: number of connected components of 1-cells in a binary (H, W) grid under 4-connectivity (diagonals do NOT connect). Return a plain int.",
  hint: "Keep a `seen` mask; scan cells, and when you hit an unvisited 1, increment the counter and BFS/DFS from it, marking visited neighbors.",
  starter:
`def count_blobs(grid):
    g = np.asarray(grid)
    # your code — flood-fill / union-find connected components
    return int(g.sum())  # wrong — counts cells, not blobs`,
  entry: "count_blobs",
  gen:
`def gen(rng):
    h, w = int(rng.integers(3, 11)), int(rng.integers(3, 11))
    p = float(rng.choice([0.2, 0.35, 0.5, 0.65]))
    return {"grid": (rng.random((h, w)) < p).astype(int)}`,
  solve:
`def count_blobs(grid):
    g = np.asarray(grid)
    h, w = g.shape
    seen = np.zeros((h, w), dtype=bool)
    cnt = 0
    for i in range(h):
        for j in range(w):
            if g[i, j] and not seen[i, j]:
                cnt += 1
                seen[i, j] = True
                stack = [(i, j)]
                while stack:
                    x, y = stack.pop()
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if (0 <= nx < h and 0 <= ny < w
                                and g[nx, ny] and not seen[nx, ny]):
                            seen[nx, ny] = True
                            stack.append((nx, ny))
    return cnt`,
  tests: 40
},
{
  id: "m06-nms",
  module: "AI2",
  title: "Non-maximum suppression",
  diff: 3, minutes: 45,
  theory: "NMS deduplicates overlapping detections: sort by descending score, take the best remaining box, and kill every other pending box whose IoU with it exceeds the threshold. Repeat until nothing remains. Determinism matters for grading — a stable sort makes equal scores resolve to the lower index.",
  prompt: "Implement `nms(boxes, scores, thr)` → list of kept indices (ints) in selection order (descending score). Greedy: pick the highest-scored remaining box, keep it, and remove every remaining box with IoU > thr to it. Score ties resolve to the lower index first (stable sort). `boxes` may be empty (shape (0, 4)).",
  hint: "order = list(np.argsort(-scores, kind='stable')); pop(0) each round into keep, then retain only boxes with IoU ≤ thr.",
  starter:
`def nms(boxes, scores, thr):
    boxes = np.asarray(boxes, dtype=float).reshape(-1, 4)
    scores = np.asarray(scores, dtype=float)
    # your code — keep highest-score box, suppress IoU-overlapping rest
    return [-1]  # wrong — replace`,
  entry: "nms",
  gen:
`def gen(rng):
    n = int(rng.integers(0, 9))
    x1 = rng.integers(0, 8, n)
    y1 = rng.integers(0, 8, n)
    x2 = x1 + rng.integers(1, 6, n)
    y2 = y1 + rng.integers(1, 6, n)
    boxes = np.stack([x1, y1, x2, y2], axis=1).astype(float).reshape(-1, 4)
    return {"boxes": boxes,
            "scores": np.round(rng.random(n), 1),   # quantized: score ties exercise the stable-sort rule
            "thr": float(rng.choice([0.2, 0.3, 0.5, 0.7]))}`,
  solve:
`def nms(boxes, scores, thr):
    boxes = np.asarray(boxes, dtype=float).reshape(-1, 4)
    scores = np.asarray(scores, dtype=float)
    order = [int(i) for i in np.argsort(-scores, kind="stable")]
    keep = []
    while order:
        i = order.pop(0)
        keep.append(i)
        rest = []
        for j in order:
            b, g = boxes[i], boxes[j]
            ix1 = max(b[0], g[0]); iy1 = max(b[1], g[1])
            ix2 = min(b[2], g[2]); iy2 = min(b[3], g[3])
            inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
            ua = ((b[2] - b[0]) * (b[3] - b[1])
                  + (g[2] - g[0]) * (g[3] - g[1]) - inter)
            if inter / ua <= thr:
                rest.append(j)
        order = rest
    return keep`,
  tests: 40
},
{
  id: "m06-tpfpfn",
  module: "AI2",
  title: "TP / FP / FN by IoU matching",
  diff: 3, minutes: 60,
  theory: "Detection metrics reduce to counting TP, FP and FN via greedy matching: process predictions in descending-score order; each prediction claims the still-unmatched ground-truth box with the highest IoU. If that best IoU is ≥ threshold it is a true positive and the GT is consumed, otherwise it is a false positive. GTs never claimed are false negatives.",
  prompt: "Implement `count_tfpn(pred_boxes, scores, gt_boxes, thr)` → `{'tp': int, 'fp': int, 'fn': int}`. Match greedily in descending-score order (score ties → lower index); each prediction takes the unused GT with maximum IoU (IoU ties → lowest GT index); IoU ≥ thr → TP and the GT is consumed, else FP. Unmatched GTs count as FN. Either side may be empty (shape (0, 4)).",
  hint: "Track a used[] mask over GTs; for each pred (in argsort order) scan all unused GTs for the max IoU, then compare with thr.",
  starter:
`def count_tfpn(pred_boxes, scores, gt_boxes, thr):
    pred_boxes = np.asarray(pred_boxes, dtype=float).reshape(-1, 4)
    scores = np.asarray(scores, dtype=float)
    gt_boxes = np.asarray(gt_boxes, dtype=float).reshape(-1, 4)
    # your code — greedy match by descending score
    return {"tp": -1, "fp": -1, "fn": -1}  # wrong — replace`,
  entry: "count_tfpn",
  gen:
`def gen(rng):
    n, m = int(rng.integers(0, 7)), int(rng.integers(0, 7))
    # cluster boxes in a small patch so each pred overlaps several GTs —
    # matching to an arbitrary/first GT instead of the best-IoU one must fail
    x0, y0 = int(rng.integers(0, 4)), int(rng.integers(0, 4))
    def mk(k):
        x1 = x0 + rng.integers(0, 3, k)
        y1 = y0 + rng.integers(0, 3, k)
        x2 = x1 + rng.integers(2, 6, k)
        y2 = y1 + rng.integers(2, 6, k)
        return np.stack([x1, y1, x2, y2], axis=1).astype(float).reshape(-1, 4)
    return {"pred_boxes": mk(n),
            "scores": np.round(rng.random(n), 1),   # rounded → score ties exercise the index tie-break
            "gt_boxes": mk(m),
            "thr": float(rng.choice([0.3, 0.5, 0.7]))}`,
  solve:
`def count_tfpn(pred_boxes, scores, gt_boxes, thr):
    P = np.asarray(pred_boxes, dtype=float).reshape(-1, 4)
    G = np.asarray(gt_boxes, dtype=float).reshape(-1, 4)
    order = [int(i) for i in np.argsort(-np.asarray(scores, dtype=float), kind="stable")]
    used = np.zeros(len(G), dtype=bool)
    tp = fp = 0
    for i in order:
        best, bj = 0.0, -1
        for j in range(len(G)):
            if used[j]:
                continue
            p, g = P[i], G[j]
            ix1 = max(p[0], g[0]); iy1 = max(p[1], g[1])
            ix2 = min(p[2], g[2]); iy2 = min(p[3], g[3])
            inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
            ua = ((p[2] - p[0]) * (p[3] - p[1])
                  + (g[2] - g[0]) * (g[3] - g[1]) - inter)
            v = inter / ua
            if v > best:
                best, bj = v, j
        if bj >= 0 and best >= thr:
            used[bj] = True
            tp += 1
        else:
            fp += 1
    return {"tp": tp, "fp": fp, "fn": int((~used).sum())}`,
  tests: 40
}
);

EXERCISES.push(
{
  id: "m06-mask-bbox",
  module: "AI2",
  title: "Mask to bounding box",
  diff: 1, minutes: 8,
  theory: "A segmentation mask implies a detection box: the tight box around the foreground pixels is [min col, min row, max col + 1, max row + 1] in xyxy convention — the '+1' makes x2, y2 exclusive so the box actually covers the extreme pixel. np.nonzero hands you the coordinates directly. Decide the empty-mask convention up front; here it is None.",
  prompt: "Implement `mask_to_bbox(mask)` for a binary (H, W) mask of 0/1 → `[x1, y1, x2, y2]` (list of ints) tightly enclosing all 1-pixels: x1 = leftmost column, y1 = topmost row, x2 = one past the rightmost column, y2 = one past the bottom row. If the mask has no foreground pixels, return `None`.",
  hint: "ys, xs = np.nonzero(mask); if xs.size == 0 → None; else [xs.min(), ys.min(), xs.max() + 1, ys.max() + 1] as ints.",
  starter:
`def mask_to_bbox(mask):
    m = np.asarray(mask)
    # your code
    return [0, 0, 0, 0]`,
  entry: "mask_to_bbox",
  gen:
`def gen(rng):
    h, w = int(rng.integers(3, 13)), int(rng.integers(3, 13))
    p = float(rng.choice([0.0, 0.2, 0.4, 0.7]))
    return {"mask": (rng.random((h, w)) < p).astype(int)}`,
  solve:
`def mask_to_bbox(mask):
    m = np.asarray(mask)
    ys, xs = np.nonzero(m)
    if xs.size == 0:
        return None
    return [int(xs.min()), int(ys.min()),
            int(xs.max()) + 1, int(ys.max()) + 1]`,
  tests: 40
},
{
  id: "m06-ap",
  module: "AI2",
  title: "Average Precision (all-point)",
  diff: 3, minutes: 45,
  theory: "Average Precision compresses a single-class precision–recall curve into one number — mAP is just its mean over classes. Sort detections by descending score, accumulate TP/FP down the ranked list, and each rank gives a (recall, precision) point. The interpolated precision at recall r is the maximum precision among all points with recall ≥ r — the 'envelope' that only decreases. All-point AP (VOC-style) integrates it exactly: AP = Σ (R_k − R_{k−1}) · p_interp(R_k) over every rank where recall increases.",
  prompt: "Implement `average_precision(scores, tp, npos)` for one class: `scores` (n,) floats, `tp` (n,) 0/1 flags marking correct detections, `npos` = total ground-truth objects (npos ≥ number of TPs). Sort by descending score (ties → lower index first, stable sort), compute cumulative TP/FP, recall = cumTP/npos, precision = cumTP/(cumTP+cumFP). Apply the precision envelope (each point takes the max precision at recall ≥ its own), then AP = Σ over ranks where recall increases of (Δrecall · envelope precision). Return 0.0 if `npos ≤ 0` or there are no detections.",
  hint: "Prepend (recall=0, prec=0) sentinels; sweep the precision array right-to-left taking running max for the envelope; then sum (mrec[i+1] − mrec[i]) · mpre[i+1] wherever mrec[i+1] != mrec[i].",
  starter:
`def average_precision(scores, tp, npos):
    scores = np.asarray(scores, dtype=float)
    tp = np.asarray(tp, dtype=float)
    # your code
    return 0.0`,
  entry: "average_precision",
  gen:
`def gen(rng):
    n = int(rng.integers(0, 11))
    tp = rng.integers(0, 2, n)
    npos = int(tp.sum()) + int(rng.integers(0, 4))
    return {"scores": np.round(rng.random(n), 1),   # quantized: ties exercise the stable-sort rule
            "tp": tp,
            "npos": npos}`,
  solve:
`def average_precision(scores, tp, npos):
    scores = np.asarray(scores, dtype=float)
    tp = np.asarray(tp, dtype=float)
    if npos <= 0 or tp.size == 0:
        return 0.0
    order = np.argsort(-scores, kind="stable")
    tp = tp[order]
    fp = 1.0 - tp
    ctp, cfp = np.cumsum(tp), np.cumsum(fp)
    rec = ctp / float(npos)
    prec = ctp / np.maximum(ctp + cfp, 1e-12)
    mrec = np.concatenate([[0.0], rec])
    mpre = np.concatenate([[0.0], prec])
    for i in range(len(mpre) - 2, -1, -1):
        mpre[i] = max(mpre[i], mpre[i + 1])
    idx = np.nonzero(mrec[1:] != mrec[:-1])[0]
    return float(np.sum((mrec[idx + 1] - mrec[idx]) * mpre[idx + 1]))`,
  tests: 40
}
);

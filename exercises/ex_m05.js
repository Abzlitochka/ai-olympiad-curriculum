/* Exercises for M5 — CV: Classification, Matching & Restoration.
   Images are numpy arrays, (H, W, 3) for RGB unless stated otherwise. */

EXERCISES.push(
{
  id: "m05-grayscale",
  module: "AI2",
  title: "RGB to grayscale (luma)",
  diff: 1, minutes: 6,
  theory: "Most CV pipelines start by collapsing color into one channel. The standard luma conversion is a fixed weighted sum, 0.299·R + 0.587·G + 0.114·B — the weights match the human eye's sensitivity, they are not equal thirds. It is just a dot product over the channel axis, so one matmul does it.",
  prompt: "Implement `to_gray(img)` for an (H, W, 3) RGB image → (H, W) array where each pixel is `0.299·R + 0.587·G + 0.114·B` (float output).",
  hint: "Either img.astype(float) @ np.array([0.299, 0.587, 0.114]), or sum the three channel products explicitly.",
  starter:
`def to_gray(img):
    img = np.asarray(img, dtype=float)
    # your code
    return img`,
  entry: "to_gray",
  gen:
`def gen(rng):
    h, w = int(rng.integers(3, 11)), int(rng.integers(3, 11))
    return {"img": rng.integers(0, 256, size=(h, w, 3))}`,
  solve:
`def to_gray(img):
    img = np.asarray(img, dtype=float)
    return img[..., 0] * 0.299 + img[..., 1] * 0.587 + img[..., 2] * 0.114`,
  tests: 30
},
{
  id: "m05-pad-zeros",
  module: "AI2",
  title: "Zero-pad an image",
  diff: 1, minutes: 6,
  theory: "Zero-padding adds a border of zeros around a feature map so convolutions do not shrink it — that is what 'same' padding does internally. `np.pad` takes a `(before, after)` pair per axis; for an (H, W, C) image you pad only the two spatial axes and leave channels untouched.",
  prompt: "Implement `pad_image(img, p)` → the (H, W, 3) image with `p` zeros added on every side (top, bottom, left, right). Result shape is (H+2p, W+2p, 3); `p` may be 0.",
  hint: "np.pad(img, ((p, p), (p, p), (0, 0))).",
  starter:
`def pad_image(img, p):
    img = np.asarray(img)
    # your code
    return img`,
  entry: "pad_image",
  gen:
`def gen(rng):
    h, w = int(rng.integers(2, 9)), int(rng.integers(2, 9))
    return {"img": rng.integers(0, 256, size=(h, w, 3)),
            "p": int(rng.integers(0, 4))}`,
  solve:
`def pad_image(img, p):
    return np.pad(np.asarray(img), ((p, p), (p, p), (0, 0)))`,
  tests: 30
},
{
  id: "m05-image-hist",
  module: "AI2",
  title: "Per-channel image histogram",
  diff: 2, minutes: 8,
  theory: "A per-channel histogram is a simple global descriptor of an image, used for colour matching and retrieval. `np.histogram(x, bins, range)` counts values into equal-width bins; always pin `range=(0, 256)` for 8-bit data, otherwise the bin edges drift with image content and descriptors stop being comparable.",
  prompt: "Implement `image_hist(img, bins)` for an (H, W, 3) uint8-like image → a (3, bins) integer array, where row c is the histogram of channel c over `bins` equal-width bins covering [0, 256].",
  hint: "np.histogram(img[..., c].ravel(), bins=bins, range=(0, 256))[0] for each channel, then np.stack the three rows.",
  starter:
`def image_hist(img, bins):
    img = np.asarray(img)
    # your code
    return np.zeros((3, bins), dtype=int)`,
  entry: "image_hist",
  gen:
`def gen(rng):
    h, w = int(rng.integers(3, 10)), int(rng.integers(3, 10))
    return {"img": rng.integers(0, 256, size=(h, w, 3)),
            "bins": int(rng.choice([2, 4, 8, 16]))}`,
  solve:
`def image_hist(img, bins):
    img = np.asarray(img)
    return np.stack([
        np.histogram(img[..., c].ravel(), bins=bins, range=(0, 256))[0]
        for c in range(3)
    ])`,
  tests: 30
},
{
  id: "m05-pool2",
  module: "AI2",
  title: "2x2 pooling (max & avg)",
  diff: 2, minutes: 10,
  theory: "Pooling downsamples a feature map by aggregating non-overlapping 2×2 blocks: max-pooling keeps the strongest activation (the usual choice in CNNs), average-pooling keeps the local mean. It can be done with a reshape: (H, W) → (H/2, 2, W/2, 2), then reduce over axes 1 and 3 — no loops needed.",
  prompt: "Implement `pool2(img, mode)`: downsample an (H, W) image (both dims are even) by non-overlapping 2×2 blocks. `mode` is 'max' or 'avg'; result shape is (H/2, W/2).",
  hint: "img.reshape(H//2, 2, W//2, 2), then .max(axis=(1, 3)) or .mean(axis=(1, 3)) depending on mode.",
  starter:
`def pool2(img, mode):
    img = np.asarray(img, dtype=float)
    # your code
    return img`,
  entry: "pool2",
  gen:
`def gen(rng):
    h, w = int(rng.integers(1, 7)) * 2, int(rng.integers(1, 7)) * 2   # 2×2 input → 1×1 output
    return {"img": rng.integers(0, 256, size=(h, w)),
            "mode": str(rng.choice(["max", "avg"]))}`,
  solve:
`def pool2(img, mode):
    img = np.asarray(img, dtype=float)
    h, w = img.shape
    b = img.reshape(h // 2, 2, w // 2, 2)
    if mode == "max":
        return b.max(axis=(1, 3))
    return b.mean(axis=(1, 3))`,
  tests: 30
},
{
  id: "m05-flip-crop",
  module: "AI2",
  title: "Flip + center crop augmentation",
  diff: 2, minutes: 10,
  theory: "Augmentation multiplies your dataset for free: horizontal flips exploit scene symmetry, and a center crop gives a stable test-time view. The flip is `img[:, ::-1]` (reverse the width axis); a centered crop of size c starts at offset (dim − c) // 2 in each spatial dimension.",
  prompt: "Implement `flip_crop(img, c)` on an (H, W, 3) image: flip it horizontally (mirror left↔right), then take the centered c×c crop. Crop offsets are `(H − c)//2` and `(W − c)//2`; `1 ≤ c ≤ min(H, W)` is guaranteed.",
  hint: "f = img[:, ::-1]; i, j = (H − c)//2, (W − c)//2; return f[i:i+c, j:j+c].",
  starter:
`def flip_crop(img, c):
    img = np.asarray(img)
    # your code
    return img`,
  entry: "flip_crop",
  gen:
`def gen(rng):
    h, w = int(rng.integers(4, 13)), int(rng.integers(4, 13))
    return {"img": rng.integers(0, 256, size=(h, w, 3)),
            "c": int(rng.integers(1, min(h, w) + 1))}`,
  solve:
`def flip_crop(img, c):
    img = np.asarray(img)[:, ::-1]
    h, w = img.shape[:2]
    i, j = (h - c) // 2, (w - c) // 2
    return img[i:i + c, j:j + c]`,
  tests: 30
},
{
  id: "m05-psnr",
  module: "AI2",
  title: "PSNR between images",
  diff: 2, minutes: 10,
  theory: "Restoration quality is measured in decibels: PSNR = 10·log10(MAX² / MSE), where MAX is the peak signal value (1.0 for images normalized to [0, 1]) and MSE the mean squared error between restored and ground-truth images. Higher is better; identical images give +∞ — a case worth handling explicitly.",
  prompt: "Implement `psnr(a, b)` for two same-shape float images in [0, 1] → `10·log10(1 / mse)` (MAX = 1, so MAX² = 1). If `a` and `b` are identical (mse == 0), return `float('inf')`.",
  hint: "mse = float(((a − b) ** 2).mean()); guard mse == 0 → inf; otherwise 10 * np.log10(1 / mse).",
  starter:
`def psnr(a, b):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    # your code
    return 0.0`,
  entry: "psnr",
  gen:
`def gen(rng):
    a = rng.random((int(rng.integers(3, 10)), int(rng.integers(3, 10)), 3))
    b = np.clip(a + rng.normal(0, 0.15, a.shape), 0.0, 1.0)
    if rng.random() < 0.15:
        b = a.copy()          # identical → mse 0 → spec requires float('inf')
    return {"a": a, "b": b}`,
  solve:
`def psnr(a, b):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    mse = float(((a - b) ** 2).mean())
    if mse == 0.0:
        return float("inf")
    return float(10.0 * np.log10(1.0 / mse))`,
  tests: 30
},
{
  id: "m05-conv2d",
  module: "AI2",
  title: "Conv2d from scratch (valid)",
  diff: 3, minutes: 15,
  theory: "A convolution layer is a sliding dot product: at every position the kernel is overlaid on the image patch, multiplied elementwise, and summed — technically cross-correlation (no kernel flip), which is what every deep-learning framework actually computes. With 'valid' padding the output shrinks to (H−kh+1, W−kw+1). Writing the double loop once by hand is the best way to internalize what padding, stride and channels really do.",
  prompt: "Implement `conv2d(img, k)`: cross-correlate a single-channel (H, W) image with a (kh, kw) kernel, stride 1, valid (no) padding → (H−kh+1, W−kw+1). Do NOT flip the kernel. Plain loops are fine — inputs are tiny.",
  hint: "out[i, j] = (img[i:i+kh, j:j+kw] * k).sum() inside two nested loops over the output positions.",
  starter:
`def conv2d(img, k):
    img = np.asarray(img, dtype=float)
    k = np.asarray(k, dtype=float)
    # your code
    return img`,
  entry: "conv2d",
  gen:
`def gen(rng):
    h, w = int(rng.integers(4, 11)), int(rng.integers(4, 11))
    kh, kw = int(rng.integers(1, h + 1)), int(rng.integers(1, w + 1))
    return {"img": rng.normal(0, 1, (h, w)),
            "k": rng.normal(0, 1, (kh, kw))}`,
  solve:
`def conv2d(img, k):
    img = np.asarray(img, dtype=float)
    k = np.asarray(k, dtype=float)
    h, w = img.shape
    kh, kw = k.shape
    out = np.zeros((h - kh + 1, w - kw + 1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = (img[i:i + kh, j:j + kw] * k).sum()
    return out`,
  tests: 30
}
);

EXERCISES.push(
{
  id: "m05-resize-nn",
  module: "AI2",
  title: "Nearest-neighbor resize",
  diff: 2, minutes: 10,
  theory: "Resizing by nearest neighbor is pure index arithmetic: output pixel (i, j) simply copies the input pixel at (⌊i·H/H'⌋, ⌊j·W/W'⌋). It copies existing values without interpolation, so it is the right way to resize segmentation masks: bilinear blending would create label values that do not exist. The same floor-mapping works for both shrinking and enlarging.",
  prompt: "Implement `resize_nn(img, new_h, new_w)` for an (H, W, 3) image → (new_h, new_w, 3) array where `out[i, j] = img[i*H//new_h, j*W//new_w]` (floor mapping). Must handle both downsampling and upsampling; `new_h, new_w ≥ 1` guaranteed.",
  hint: "Build index vectors ii = np.arange(new_h) * H // new_h and jj likewise, then fancy-index img[ii[:, None], jj[None, :]].",
  starter:
`def resize_nn(img, new_h, new_w):
    img = np.asarray(img)
    # your code
    return img`,
  entry: "resize_nn",
  gen:
`def gen(rng):
    h, w = int(rng.integers(2, 11)), int(rng.integers(2, 11))
    return {"img": rng.integers(0, 256, size=(h, w, 3)),
            "new_h": int(rng.integers(1, 13)),
            "new_w": int(rng.integers(1, 13))}`,
  solve:
`def resize_nn(img, new_h, new_w):
    img = np.asarray(img)
    h, w = img.shape[:2]
    ii = (np.arange(new_h) * h) // new_h
    jj = (np.arange(new_w) * w) // new_w
    return img[ii[:, None], jj[None, :]]`,
  tests: 30
},
{
  id: "m05-template-match",
  module: "AI2",
  title: "Template matching argmin (SSD)",
  diff: 2, minutes: 30,
  theory: "Template matching is classical detection: slide a small template over the image, score every position by the sum of squared differences (SSD), and keep the argmin — the ancestor of both sliding-window detectors and the correlation layers inside modern networks. On integer pixels SSD is exact, so ties genuinely occur; break them deterministically: earliest position in row-major order (the np.argmin convention).",
  prompt: "Implement `match_template(img, tpl)` for a single-channel (H, W) image and a (th, tw) template (`1 ≤ th ≤ H`, `1 ≤ tw ≤ W`) → `[i, j]`, the top-left corner minimizing `((img[i:i+th, j:j+tw] − tpl) ** 2).sum()` over all valid positions. Ties resolve to the earliest position in row-major order (smallest i, then smallest j) — a plain loop with `d < best` does this naturally.",
  hint: "Two loops over i in range(H − th + 1), j in range(W − tw + 1); track (best_score, best_pos) and update only on strict improvement.",
  starter:
`def match_template(img, tpl):
    img = np.asarray(img, dtype=float)
    tpl = np.asarray(tpl, dtype=float)
    # your code
    return [0, 0]`,
  entry: "match_template",
  gen:
`def gen(rng):
    h, w = int(rng.integers(4, 13)), int(rng.integers(4, 13))
    th, tw = int(rng.integers(1, h + 1)), int(rng.integers(1, w + 1))
    if rng.random() < 0.35:
        # uniform image: every position ties at SSD 0, so "<" (first row-major)
        # must beat "<=" (which would keep the last position) — decides the tie rule
        v = int(rng.integers(0, 256))
        return {"img": np.full((h, w), v), "tpl": np.full((th, tw), v)}
    return {"img": rng.integers(0, 256, size=(h, w)),
            "tpl": rng.integers(0, 256, size=(th, tw))}`,
  solve:
`def match_template(img, tpl):
    img = np.asarray(img, dtype=float)
    tpl = np.asarray(tpl, dtype=float)
    th, tw = tpl.shape
    best, pos = None, [0, 0]
    for i in range(img.shape[0] - th + 1):
        for j in range(img.shape[1] - tw + 1):
            d = float(((img[i:i + th, j:j + tw] - tpl) ** 2).sum())
            if best is None or d < best:
                best, pos = d, [i, j]
    return pos`,
  tests: 30
}
);

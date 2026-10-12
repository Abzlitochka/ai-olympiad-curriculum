/* Tensor Puzzles — by Sasha Rush (with Marcos Treviso), MIT License.
   https://github.com/srush/Tensor-Puzzles
   Specs below are the original loop-based reference implementations. */

const PUZZLES = [
  { name: "ones", desc: "Compute ones — the vector of all ones.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.ones.html",
    sig: 'def ones(i: int) -> TT["i"]:',
    spec: String.raw`def ones_spec(out):
    for i in range(len(out)):
        out[i] = 1` },
  { name: "sum", desc: "Compute sum — the sum of a vector.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.sum.html",
    sig: 'def sum(a: TT["i"]) -> TT[1]:',
    spec: String.raw`def sum_spec(a, out):
    out[0] = 0
    for i in range(len(a)):
        out[0] += a[i]` },
  { name: "outer", desc: "Compute outer — the outer product of two vectors.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.outer.html",
    sig: 'def outer(a: TT["i"], b: TT["j"]) -> TT["i", "j"]:',
    spec: String.raw`def outer_spec(a, b, out):
    for i in range(len(out)):
        for j in range(len(out[0])):
            out[i][j] = a[i] * b[j]` },
  { name: "diag", desc: "Compute diag — the diagonal vector of a square matrix.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.diag.html",
    sig: 'def diag(a: TT["i", "i"]) -> TT["i"]:',
    spec: String.raw`def diag_spec(a, out):
    for i in range(len(a)):
        out[i] = a[i][i]` },
  { name: "eye", desc: "Compute eye — the identity matrix.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.eye.html",
    sig: 'def eye(j: int) -> TT["j", "j"]:',
    spec: String.raw`def eye_spec(out):
    for i in range(len(out)):
        out[i][i] = 1` },
  { name: "triu", desc: "Compute triu — the upper triangular matrix.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.triu.html",
    sig: 'def triu(j: int) -> TT["j", "j"]:',
    spec: String.raw`def triu_spec(out):
    for i in range(len(out)):
        for j in range(len(out)):
            if i <= j:
                out[i][j] = 1
            else:
                out[i][j] = 0` },
  { name: "cumsum", desc: "Compute cumsum — the cumulative sum.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.cumsum.html",
    sig: 'def cumsum(a: TT["i"]) -> TT["i"]:',
    spec: String.raw`def cumsum_spec(a, out):
    total = 0
    for i in range(len(out)):
        out[i] = total + a[i]
        total += a[i]` },
  { name: "diff", desc: "Compute diff — the running difference.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.diff.html",
    sig: 'def diff(a: TT["i"], i: int) -> TT["i"]:',
    spec: String.raw`def diff_spec(a, out):
    out[0] = a[0]
    for i in range(1, len(out)):
        out[i] = a[i] - a[i - 1]` },
  { name: "vstack", desc: "Compute vstack — the matrix of two vectors.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.vstack.html",
    sig: 'def vstack(a: TT["i"], b: TT["i"]) -> TT[2, "i"]:',
    spec: String.raw`def vstack_spec(a, b, out):
    for i in range(len(out[0])):
        out[0][i] = a[i]
        out[1][i] = b[i]` },
  { name: "roll", desc: "Compute roll — the vector shifted 1 circular position.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.roll.html",
    sig: 'def roll(a: TT["i"], i: int) -> TT["i"]:',
    spec: String.raw`def roll_spec(a, out):
    for i in range(len(out)):
        if i + 1 < len(out):
            out[i] = a[i + 1]
        else:
            out[i] = a[i + 1 - len(out)]` },
  { name: "flip", desc: "Compute flip — the reversed vector.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.flip.html",
    sig: 'def flip(a: TT["i"], i: int) -> TT["i"]:',
    spec: String.raw`def flip_spec(a, out):
    for i in range(len(out)):
        out[i] = a[len(out) - i - 1]` },
  { name: "compress", desc: "Compute compress — keep only masked entries (left-aligned).",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.compress.html",
    sig: 'def compress(g: TT["i", bool], v: TT["i"], i: int) -> TT["i"]:',
    spec: String.raw`def compress_spec(g, v, out):
    j = 0
    for i in range(len(g)):
        if g[i]:
            out[j] = v[i]
            j += 1` },
  { name: "pad_to", desc: "Compute pad_to — eliminate or add 0s to change the size of a vector.",
    doc: "",
    sig: 'def pad_to(a: TT["i"], i: int, j: int) -> TT["j"]:',
    spec: String.raw`def pad_to_spec(a, out):
    for i in range(min(len(out), len(a))):
        out[i] = a[i]` },
  { name: "sequence_mask", desc: "Compute sequence_mask — pad out to length per batch.",
    doc: "https://www.tensorflow.org/api_docs/python/tf/sequence_mask",
    sig: 'def sequence_mask(values: TT["i", "j"], length: TT["i", int]) -> TT["i", "j"]:',
    spec: String.raw`def sequence_mask_spec(values, length, out):
    for i in range(len(out)):
        for j in range(len(out[0])):
            if j < length[i]:
                out[i][j] = values[i][j]
            else:
                out[i][j] = 0

# test inputs: length = length % values.shape[1]` },
  { name: "bincount", desc: "Compute bincount — count the number of times each entry was seen.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.bincount.html",
    sig: 'def bincount(a: TT["i"], j: int) -> TT["j"]:',
    spec: String.raw`def bincount_spec(a, out):
    for i in range(len(a)):
        out[a[i]] += 1

# test inputs: a = a % j` },
  { name: "scatter_add", desc: "Compute scatter_add — add together values that link to the same location.",
    doc: "https://pytorch-scatter.readthedocs.io/en/1.3.0/functions/add.html",
    sig: 'def scatter_add(values: TT["i"], link: TT["i"], j: int) -> TT["j"]:',
    spec: String.raw`def scatter_add_spec(values, link, out):
    for j in range(len(values)):
        out[link[j]] += values[j]

# test inputs: link = link % j` },
  { name: "flatten", desc: "Compute flatten.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.ndarray.flatten.html",
    sig: 'def flatten(a: TT["i", "j"], i: int, j: int) -> TT["i * j"]:',
    spec: String.raw`def flatten_spec(a, out):
    k = 0
    for i in range(len(a)):
        for j in range(len(a[0])):
            out[k] = a[i][j]
            k += 1` },
  { name: "linspace", desc: "Compute linspace.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.linspace.html",
    sig: 'def linspace(i: TT[1], j: TT[1], n: int) -> TT["n", float]:',
    spec: String.raw`def linspace_spec(i, j, out):
    for k in range(len(out)):
        out[k] = float(i + (j - i) * k / max(1, len(out) - 1))` },
  { name: "heaviside", desc: "Compute heaviside.",
    doc: "https://numpy.org/doc/stable/reference/generated/numpy.heaviside.html",
    sig: 'def heaviside(a: TT["i"], b: TT["i"]) -> TT["i"]:',
    spec: String.raw`def heaviside_spec(a, b, out):
    for k in range(len(out)):
        if a[k] == 0:
            out[k] = b[k]
        else:
            out[k] = int(a[k] > 0)` },
  { name: "repeat", desc: "Compute repeat (1d).",
    doc: "https://pytorch.org/docs/stable/generated/torch.Tensor.repeat.html",
    sig: 'def repeat(a: TT["i"], d: TT[1]) -> TT["d", "i"]:',
    spec: String.raw`def repeat_spec(a, d, out):
    for i in range(d[0]):
        for k in range(len(a)):
            out[i][k] = a[k]

# test inputs: d[0] = number of output rows` },
  { name: "bucketize", desc: "Compute bucketize.",
    doc: "https://pytorch.org/docs/stable/generated/torch.bucketize.html",
    sig: 'def bucketize(v: TT["i"], boundaries: TT["j"]) -> TT["i"]:',
    spec: String.raw`def bucketize_spec(v, boundaries, out):
    for i, val in enumerate(v):
        out[i] = 0
        for j in range(len(boundaries)-1):
            if val >= boundaries[j]:
                out[i] = j + 1
        if val >= boundaries[-1]:
            out[i] = len(boundaries)

# test inputs: boundaries = abs(boundaries).cumsum()  (sorted)` },
];

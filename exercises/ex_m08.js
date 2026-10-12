/* Exercises for M8 — Audio, Signals & Time Series. */

EXERCISES.push(
{
  id: "m08-frames",
  module: "AI4",
  title: "Frame a 1-D signal",
  diff: 1, minutes: 8,
  theory: "Short-time analysis slices a waveform into overlapping windows: frame i starts at i·hop and covers frame_len samples, and the incomplete tail is dropped. Every spectral feature — FFT, spectrogram, MFCC — is computed on these frames.",
  prompt: "Implement `frame_signal(x, frame_len, hop)` → an (n_frames, frame_len) array of overlapping frames, where frame i is `x[i*hop : i*hop + frame_len]`. Drop the trailing partial frame.",
  hint: "starts = range(0, len(x) - frame_len + 1, hop); np.array([x[s:s+frame_len] for s in starts]) — reshape(-1, frame_len) keeps the empty case sane.",
  starter:
`def frame_signal(x, frame_len, hop):
    x = np.asarray(x, dtype=float)
    # your code
    return np.zeros((0, frame_len))`,
  entry: "frame_signal",
  gen:
`def gen(rng):
    L = int(rng.integers(12, 60))
    fl = int(rng.integers(3, 12))
    hop = int(rng.integers(1, 6))
    u = rng.random()
    if u < 0.08:
        fl = L + int(rng.integers(1, 5))   # frame longer than signal → empty result
    elif u < 0.16:
        fl = L                              # exactly one frame
    elif u < 0.28:
        hop = fl + int(rng.integers(1, 4))  # gaps between frames
    return {"x": rng.normal(0, 1, L), "frame_len": fl, "hop": hop}`,
  solve:
`def frame_signal(x, frame_len, hop):
    x = np.asarray(x, dtype=float)
    out = np.array([x[s:s + frame_len] for s in range(0, len(x) - frame_len + 1, hop)], dtype=float)
    return out.reshape(-1, frame_len)`
},
{
  id: "m08-mel",
  module: "AI4",
  title: "Hertz ↔ mel conversion",
  diff: 1, minutes: 8,
  theory: "The mel scale warps frequency to match human pitch perception — roughly linear below 1 kHz, logarithmic above. The HTK formulas are mel = 2595·log10(1 + f/700) and f = 700·(10^(mel/2595) − 1); MFCC pipelines live in mel space.",
  prompt: "Implement `convert_mel(x, direction)` elementwise on an array:\n- `\"hz2mel\"`: 2595·log10(1 + x/700)\n- `\"mel2hz\"`: 700·(10^(x/2595) − 1)",
  hint: "np.log10 for the log and 10.0 ** (x / 2595.0) for the inverse; cast with np.asarray(x, dtype=float) first.",
  starter:
`def convert_mel(x, direction):
    x = np.asarray(x, dtype=float)
    # your code
    return x`,
  entry: "convert_mel",
  gen:
`def gen(rng):
    direction = str(rng.choice(["hz2mel", "mel2hz"]))
    lo, hi = (20.0, 8000.0) if direction == "hz2mel" else (0.0, 3200.0)
    return {"x": rng.uniform(lo, hi, int(rng.integers(3, 10))), "direction": direction}`,
  solve:
`def convert_mel(x, direction):
    x = np.asarray(x, dtype=float)
    if direction == "hz2mel":
        return 2595.0 * np.log10(1.0 + x / 700.0)
    return 700.0 * (10.0 ** (x / 2595.0) - 1.0)`
},
{
  id: "m08-frame-features",
  module: "AI4",
  title: "RMS energy and zero-crossing rate",
  diff: 2, minutes: 12,
  theory: "Two simple audio features: RMS energy sqrt(mean(x²)) tracks loudness, and the zero-crossing rate — the fraction of adjacent samples whose sign differs — separates voiced speech (low) from fricatives and noise (high). Both are per-row reductions over a framed signal.",
  prompt: "Implement `frame_features(frames)` → an (n, 2) array where column 0 is per-frame RMS = sqrt(mean(f²)) and column 1 is the zero-crossing rate = fraction of positions i with sign(f[i]) ≠ sign(f[i+1]) (use np.sign; divide by frame_len − 1).",
  hint: "rms = np.sqrt((frames**2).mean(1)); zcr = (np.sign(frames[:, :-1]) != np.sign(frames[:, 1:])).mean(1). Combine with np.column_stack.",
  starter:
`def frame_features(frames):
    frames = np.asarray(frames, dtype=float)
    # your code
    return np.zeros((len(frames), 2))`,
  entry: "frame_features",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 8))
    L = int(rng.integers(4, 16))
    return {"frames": rng.normal(0, 1, (n, L))}`,
  solve:
`def frame_features(frames):
    frames = np.asarray(frames, dtype=float)
    rms = np.sqrt((frames ** 2).mean(axis=1))
    zcr = (np.sign(frames[:, :-1]) != np.sign(frames[:, 1:])).mean(axis=1)
    return np.column_stack([rms, zcr])`
},
{
  id: "m08-windowed-dft",
  module: "AI4",
  title: "Hann-windowed DFT magnitude",
  diff: 2, minutes: 12,
  theory: "Multiplying a frame by a Hann window w[k] = 0.5 − 0.5·cos(2πk/(N−1)) tapers its edges and reduces spectral leakage before the FFT. np.fft.rfft computes the DFT of a real signal and returns only the non-redundant half of the spectrum — enough for magnitudes.",
  prompt: "Implement `spectral_magnitude(frames)`: apply a Hann window w[k] = 0.5 − 0.5·cos(2πk/(N−1)) (N = frame length; use an all-ones window when N == 1) to every row, then return `np.abs(np.fft.rfft(windowed, axis=1))`.",
  hint: "w = 0.5 - 0.5*np.cos(2.0*np.pi*np.arange(N)/(N-1)) guarded for N == 1; then np.abs(np.fft.rfft(frames * w, axis=1)).",
  starter:
`def spectral_magnitude(frames):
    frames = np.asarray(frames, dtype=float)
    # your code
    return frames`,
  entry: "spectral_magnitude",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 6))
    L = int(rng.integers(4, 17)) if rng.random() < 0.9 else 1  # exercise the N==1 window guard
    return {"frames": rng.normal(0, 1, (n, L))}`,
  solve:
`def spectral_magnitude(frames):
    frames = np.asarray(frames, dtype=float)
    N = frames.shape[1]
    w = np.ones(N) if N == 1 else 0.5 - 0.5 * np.cos(2.0 * np.pi * np.arange(N) / (N - 1))
    return np.abs(np.fft.rfft(frames * w, axis=1))`
},
{
  id: "m08-moving-average",
  module: "AI4",
  title: "Moving-average smoothing",
  diff: 2, minutes: 8,
  theory: "The simplest digital filter: replace each sample by the mean of a width-w window. 'Valid' mode keeps only positions where the whole window fits, giving n − w + 1 outputs — equivalently a convolution with the boxcar kernel ones(w)/w, or a cumsum with differences.",
  prompt: "Implement `moving_average(x, w)` → the valid-mode moving average: output[i] = mean(x[i : i+w]), producing len(x) − w + 1 values.",
  hint: "np.convolve(x, np.ones(w) / w, mode='valid') does it in one line.",
  starter:
`def moving_average(x, w):
    x = np.asarray(x, dtype=float)
    # your code
    return x`,
  entry: "moving_average",
  gen:
`def gen(rng):
    n = int(rng.integers(6, 40))
    w = int(rng.integers(1, 8))
    if w > n:
        w = n
    return {"x": rng.normal(0, 1, n), "w": w}`,
  solve:
`def moving_average(x, w):
    return np.convolve(np.asarray(x, dtype=float), np.ones(w) / w, mode="valid")`
},
{
  id: "m08-peaks",
  module: "AI4",
  title: "Greedy peak picking",
  diff: 3, minutes: 30,
  theory: "Peak detection on envelopes and onset strengths: take the strongest sample above a threshold, then the next strongest that is far enough from everything already chosen — greedy non-maximum suppression. A deterministic ordering (value descending, index ascending for ties) makes the result reproducible.",
  prompt: "Implement `find_peaks(x, threshold, min_dist)`: consider indices with `x[i] > threshold` in decreasing value order (ties → lower index first). Accept an index only if its absolute index distance to every already-accepted index is ≥ `min_dist`. Return the accepted indices sorted ascending.\n\n```\nx=[1.0,3.0,1.5,3.0,0.5], threshold=1.0, min_dist=2\n→ order 1,3 (3.0 tie→lower idx), 2 (1.5); pick 1, then 3 (|3-1|=2 ok), skip 2 (|2-1|=1<2) → [1,3]\n```",
  hint: "order = np.argsort(-x, kind='stable'); iterate it, break once x[i] <= threshold, accept when all(abs(i - j) >= min_dist for j in picked); sort before returning.",
  starter:
`def find_peaks(x, threshold, min_dist):
    x = np.asarray(x, dtype=float)
    # your code
    return np.array([], dtype=int)`,
  entry: "find_peaks",
  gen:
`def gen(rng):
    n = int(rng.integers(15, 30))
    # rounded values → ties occur, so the lower-index-first rule and a
    # stable descending sort actually matter
    x = np.round(rng.normal(0, 1, n), 1)
    for pos in rng.choice(n, int(rng.integers(1, 4)), replace=False):
        x[pos] = np.round(x[pos] + float(rng.integers(3, 7)), 1)
    threshold = float(rng.uniform(1.5, 2.5))
    if rng.random() < 0.3:
        threshold = float(x[int(rng.integers(n))])  # x[i]==threshold -> '>' vs '>=' is decided
    return {"x": x, "threshold": threshold, "min_dist": int(rng.integers(2, 6))}`,
  solve:
`def find_peaks(x, threshold, min_dist):
    x = np.asarray(x, dtype=float)
    picked = []
    for i in np.argsort(-x, kind="stable"):
        if x[i] <= threshold:
            break
        if all(abs(int(i) - j) >= min_dist for j in picked):
            picked.append(int(i))
    return np.array(sorted(picked), dtype=int)`
},
{
  id: "m08-resample",
  module: "AI4",
  title: "Integer-factor resampling",
  diff: 3, minutes: 12,
  theory: "Downsampling by an integer k keeps every k-th sample — proper decimation would low-pass first to avoid aliasing, but the raw stride is the building block. Upsampling by k inserts k−1 linearly interpolated samples between each pair, equivalent to np.interp on a denser grid.",
  prompt: "Implement `resample(x, factor, mode)`:\n- `\"down\"`: keep every `factor`-th sample → x[::factor].\n- `\"up\"`: linear interpolation onto positions 0, 1/factor, 2/factor, …, n−1 → output length (n−1)·factor + 1 (use np.interp).",
  hint: "down is a stride. up: np.interp(np.linspace(0, n-1, (n-1)*factor + 1), np.arange(n), x).",
  starter:
`def resample(x, factor, mode):
    x = np.asarray(x, dtype=float)
    # your code
    return x`,
  entry: "resample",
  gen:
`def gen(rng):
    n = int(rng.integers(4, 20))
    factor = int(rng.integers(2, 5))
    mode = str(rng.choice(["down", "up"]))
    return {"x": rng.normal(0, 1, n), "factor": factor, "mode": mode}`,
  solve:
`def resample(x, factor, mode):
    x = np.asarray(x, dtype=float)
    if mode == "down":
        return x[::factor]
    grid = np.linspace(0.0, len(x) - 1, (len(x) - 1) * factor + 1)
    return np.interp(grid, np.arange(len(x)), x)`
}
);

EXERCISES.push(
{
  id: "m08-spectral-centroid",
  module: "AI4",
  title: "Spectral centroid per frame",
  diff: 2, minutes: 10,
  theory: "The spectral centroid is the center of mass of a frame's magnitude spectrum — it tracks where the energy sits in frequency and correlates with perceived brightness. Weight each rFFT bin's magnitude by its bin frequency (np.fft.rfftfreq gives them in Hz) and normalize by the total magnitude; an all-silent frame gets centroid 0 by convention rather than a division by zero.",
  prompt: "Implement `spectral_centroid(frames, sr)` → (n,) array: for each row, `mag = |rfft(frame)|` with bin frequencies `f = np.fft.rfftfreq(N, d=1/sr)`; centroid = sum(f·mag)/sum(mag), and 0.0 where the magnitude sum is 0.",
  hint: "f = np.fft.rfftfreq(frames.shape[1], d=1.0/sr); mag = np.abs(np.fft.rfft(frames, axis=1)); tot = mag.sum(1); np.where(tot > 0, (mag * f).sum(1) / np.where(tot > 0, tot, 1.0), 0.0).",
  starter:
`def spectral_centroid(frames, sr):
    frames = np.asarray(frames, dtype=float)
    # your code
    return np.zeros(len(frames))`,
  entry: "spectral_centroid",
  gen:
`def gen(rng):
    n = int(rng.integers(2, 6))
    N = int(rng.integers(8, 33))
    frames = rng.normal(0, 1, (n, N))
    if rng.random() < 0.25:
        frames[int(rng.integers(0, n))] = 0.0   # silent frame → centroid must be 0, not NaN
    return {"frames": frames,
            "sr": float(rng.choice([8000.0, 16000.0, 22050.0, 44100.0]))}`,
  solve:
`def spectral_centroid(frames, sr):
    frames = np.asarray(frames, dtype=float)
    N = frames.shape[1]
    f = np.fft.rfftfreq(N, d=1.0 / sr)
    mag = np.abs(np.fft.rfft(frames, axis=1))
    tot = mag.sum(axis=1)
    return np.where(tot > 0, (mag * f).sum(axis=1) / np.where(tot > 0, tot, 1.0), 0.0)`
},
{
  id: "m08-autocorr-pitch",
  module: "AI4",
  title: "Autocorrelation pitch estimate",
  diff: 3, minutes: 12,
  theory: "Autocorrelation pitch estimation scores each candidate lag k by r[k] = Σ_i x[i]·x[i+k] — a periodic signal correlates strongly with a copy of itself shifted by one period. Searching only a plausible lag window avoids the octave error of picking k = 0, where autocorrelation is always maximal and tells you nothing.",
  prompt: "Implement `estimate_pitch(x, sr, lag_lo, lag_hi)` → estimated frequency in Hz: compute the autocorrelation `r[k] = Σ_i x[i]·x[i+k]` for every integer lag `lag_lo ≤ k ≤ lag_hi`, pick the lag with the largest r[k] (ties → smallest lag), and return `sr / best_lag` as a float.",
  hint: "r = np.array([np.dot(x[:-k], x[k:]) for k in range(lag_lo, lag_hi + 1)]); best = lag_lo + int(np.argmax(r)); return sr / best.",
  starter:
`def estimate_pitch(x, sr, lag_lo, lag_hi):
    x = np.asarray(x, dtype=float)
    # your code
    return 0.0`,
  entry: "estimate_pitch",
  gen:
`def gen(rng):
    lag_lo = int(rng.integers(20, 40))
    lag_hi = lag_lo + int(rng.integers(40, 90))
    period = int(rng.integers(lag_lo, lag_hi))
    n = 3 * lag_hi + int(rng.integers(0, 50))
    t = np.arange(n)
    x = np.sin(2.0 * np.pi * t / period + float(rng.uniform(0, 6.28))) + 0.3 * rng.normal(0, 1, n)
    return {"x": x, "sr": 16000.0, "lag_lo": lag_lo, "lag_hi": lag_hi}`,
  solve:
`def estimate_pitch(x, sr, lag_lo, lag_hi):
    x = np.asarray(x, dtype=float)
    lag_lo, lag_hi = int(lag_lo), int(lag_hi)
    r = np.array([np.dot(x[:-k], x[k:]) for k in range(lag_lo, lag_hi + 1)])
    best = lag_lo + int(np.argmax(r))
    return float(sr / best)`
}
);

/* Inline SVG figures for lesson steps — HAIO/Brilliant-style visuals.
   fig("id") blocks in lessons render via blockHTML("fig") → figHTML(id).
   All colors are theme vars so figures match light/dark automatically. */

const fig = id => ["fig", id];

const FIG = {
  tx: "var(--text-2)", ln: "var(--line-strong)", ac: "var(--accent)",
  acs: "var(--accent-soft)", ok: "var(--ok)", oks: "var(--ok-soft)",
  er: "var(--err)", br: "#e6c200", su: "var(--subtle)",
};
const FTXT = `font-family:var(--font);fill:${FIG.tx}`;
const figSvg = (h, inner) =>
  `<svg viewBox="0 0 560 ${h}" role="img" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const fgT = (x, y, s, size = 12, anchor = "middle", w = 500) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${w}" style="${FTXT}">${s}</text>`;
const fgDot = (x, y, r = 5, fill = FIG.ac) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

const FIGURES = {

/* ---- M0: NumPy broadcasting (3,1) + (1,4) → (3,4) ---- */
"broadcast": {
  cap: { en: "Broadcasting: a (3,1) column and a (1,4) row stretch into a (3,4) grid — no loops, no copies.", ru: "Бродкастинг: столбец (3,1) и строка (1,4) растягиваются в сетку (3,4) — без циклов и копий." },
  svg: () => figSvg(170, `
    ${[0, 1, 2].map(i => `<rect x="70" y="${30 + i * 34}" width="28" height="28" rx="4" fill="${FIG.acs}" stroke="${FIG.ac}"/>`).join("")}
    ${fgT(84, 150, "(3,1)")}
    ${fgT(140, 80, "+", 18)}
    ${[0, 1, 2, 3].map(i => `<rect x="${165 + i * 34}" y="60" width="28" height="28" rx="4" fill="${FIG.oks}" stroke="${FIG.ok}"/>`).join("")}
    ${fgT(233, 150, "(1,4)")}
    ${fgT(345, 80, "=", 18)}
    ${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${390 + c * 30}" y="${26 + r * 34}" width="24" height="24" rx="3" fill="${r === 0 && c === 0 ? "#ffe98a" : FIG.su}" stroke="${FIG.ln}"/>`).join("")).join("")}
    ${fgT(452, 150, "(3,4)")}`),
},

/* ---- M1: train/validation/test split ---- */
"trainval": {
  cap: { en: "Split once, keep apart: fit on train, tune on validation, report on test — exactly once.", ru: "Делим один раз и не смешиваем: учим на train, подбираем на validation, отчитываемся по test — ровно один раз." },
  svg: () => figSvg(140, `
    <rect x="60" y="34" width="308" height="48" rx="6" fill="${FIG.acs}" stroke="${FIG.ac}"/>
    <rect x="368" y="34" width="66" height="48" fill="#ffe98a" stroke="${FIG.ln}"/>
    <rect x="434" y="34" width="66" height="48" rx="6" fill="${FIG.oks}" stroke="${FIG.ok}"/>
    ${fgT(214, 63, "train 70%", 14)}
    ${fgT(401, 63, "val", 12)}
    ${fgT(467, 63, "test", 12)}
    ${fgT(401, 100, "15%", 11)}
    ${fgT(467, 100, "15%", 11)}
    ${fgT(280, 128, "fit → tune → report once", 12)}`),
},

/* ---- M1: linear regression — scatter, fit line, residuals ---- */
"linreg": {
  cap: { en: "Linear regression picks the line with the smallest squared residuals (dashed).", ru: "Линейная регрессия выбирает прямую с наименьшей суммой квадратов отклонений (пунктир)." },
  svg: () => figSvg(200, `
    <line x1="60" y1="18" x2="60" y2="168" stroke="${FIG.ln}"/>
    <line x1="60" y1="168" x2="520" y2="168" stroke="${FIG.ln}"/>
    <line x1="80" y1="150" x2="500" y2="44" stroke="${FIG.ac}" stroke-width="2.5"/>
    ${[[110, 138], [160, 132], [215, 112], [265, 118], [315, 88], [360, 96], [410, 66], [455, 58]].map(([x, y]) => fgDot(x, y)).join("")}
    ${[[215, 112, 105.8], [315, 88, 80.5], [410, 66, 55.4]].map(([x, y, ly]) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${ly}" stroke="${FIG.er}" stroke-dasharray="4 3" stroke-width="1.5"/>`).join("")}
    ${fgT(505, 158, "x", 12)} ${fgT(50, 30, "y", 12)}`),
},

/* ---- M16: gradient descent on a 1-D loss ---- */
"graddesc": {
  cap: { en: "Gradient descent: step opposite the slope; too-big steps overshoot, too-small crawl.", ru: "Градиентный спуск: шаг против наклона; слишком большие шаги перелетают, слишком маленькие — ползут." },
  svg: () => figSvg(200, `
    <path d="M110,30 Q280,270 450,30" fill="none" stroke="${FIG.ac}" stroke-width="2.5"/>
    ${fgDot(150, 68)} ${fgDot(212, 128)} ${fgDot(258, 163)} ${fgDot(280, 172, 6, FIG.ok)}
    <line x1="150" y1="68" x2="212" y2="128" stroke="${FIG.tx}" stroke-dasharray="4 3"/>
    <line x1="212" y1="128" x2="258" y2="163" stroke="${FIG.tx}" stroke-dasharray="4 3"/>
    ${fgT(136, 56, "w₀", 12)} ${fgT(280, 196, "min", 12)}
    ${fgT(60, 40, "loss", 12)}`),
},

/* ---- M2: k-NN — dashed neighbourhood around the query ---- */
"knn": {
  cap: { en: "k-NN: the query point takes the majority label inside its k nearest neighbours (k=5 here).", ru: "k-NN: новая точка получает метку большинства среди k ближайших соседей (здесь k=5)." },
  svg: () => figSvg(200, `
    ${[[110, 60], [140, 40], [90, 95], [150, 90], [125, 120], [80, 55]].map(([x, y]) => fgDot(x, y, 6)).join("")}
    ${[[400, 130], [430, 100], [450, 145], [370, 150], [470, 115], [410, 165]].map(([x, y]) => `<rect x="${x - 5}" y="${y - 5}" width="11" height="11" rx="2" fill="${FIG.er}"/>`).join("")}
    <circle cx="250" cy="105" r="62" fill="none" stroke="${FIG.tx}" stroke-dasharray="5 4"/>
    ${fgDot(250, 105, 7, "#ffe98a")}<circle cx="250" cy="105" r="7" fill="none" stroke="${FIG.tx}"/>
    ${fgDot(200, 70, 6)} ${fgDot(290, 60, 6)} ${fgDot(300, 140, 6)}
    ${fgT(250, 190, "? takes class ● — 3 of 5 neighbours are circles", 12)}`),
},

/* ---- M1: confusion matrix ---- */
"confusion": {
  cap: { en: "Confusion matrix: accuracy hides which errors you make — TP+TN are the green diagonal.", ru: "Матрица ошибок: accuracy скрывает, какие именно ошибки вы делаете — зелёная диагональ это TP и TN." },
  svg: () => figSvg(190, `
    ${fgT(280, 20, "predicted", 12)} ${fgT(100, 110, "actual", 12, "middle")}
    ${fgT(255, 48, "+", 12)} ${fgT(345, 48, "−", 12)} ${fgT(160, 80, "+", 12)} ${fgT(160, 135, "−", 12)}
    <rect x="210" y="56" width="90" height="52" fill="${FIG.oks}" stroke="${FIG.ok}"/>
    <rect x="300" y="56" width="90" height="52" fill="#fdeceb" stroke="${FIG.er}"/>
    <rect x="210" y="108" width="90" height="52" fill="#fdeceb" stroke="${FIG.er}"/>
    <rect x="300" y="108" width="90" height="52" fill="${FIG.oks}" stroke="${FIG.ok}"/>
    ${fgT(255, 87, "TP", 14)} ${fgT(345, 87, "FP", 14)}
    ${fgT(255, 139, "FN", 14)} ${fgT(345, 139, "TN", 14)}
    ${fgT(430, 87, "precision = TP / (TP+FP)", 11, "start")}
    ${fgT(430, 139, "recall = TP / (TP+FN)", 11, "start")}`),
},

/* ---- M16: multilayer perceptron ---- */
"mlp": {
  cap: { en: "An MLP: each arrow is a learned weight; each hidden unit is a weighted sum + nonlinearity.", ru: "MLP: каждая стрелка — обучаемый вес; каждый скрытый нейрон — взвешенная сумма + нелинейность." },
  svg: () => {
    const L = [[120, [40, 90, 140, 190]], [280, [60, 120, 180]], [440, [85, 145]]];
    const edges = L[0][1].flatMap(y1 => L[1][1].map(y2 => `<line x1="134" y1="${y1}" x2="266" y2="${y2}" stroke="${FIG.ln}"/>`))
      .concat(L[1][1].flatMap(y1 => L[2][1].map(y2 => `<line x1="294" y1="${y1}" x2="426" y2="${y2}" stroke="${FIG.ln}"/>`))).join("");
    const nodes = L.map(([x, ys]) => ys.map(y => `<circle cx="${x}" cy="${y}" r="14" fill="${FIG.acs}" stroke="${FIG.ac}"/>`).join("")).join("");
    return figSvg(225, edges + nodes +
      fgT(120, 218, "input", 11) + fgT(280, 218, "hidden", 11) + fgT(440, 218, "output", 11));
  },
},

/* ---- M16: train vs validation loss — the overfit gap ---- */
"losscurve": {
  cap: { en: "Training loss keeps falling; validation loss turns up — the gap is overfitting. Stop at the dashed line.", ru: "Ошибка на train продолжает падать, на validation — растёт: разрыв и есть переобучение. Стоп — на пунктирной линии." },
  svg: () => figSvg(200, `
    <rect x="345" y="18" width="175" height="150" fill="#fdeceb" opacity=".55"/>
    <line x1="60" y1="18" x2="60" y2="168" stroke="${FIG.ln}"/><line x1="60" y1="168" x2="520" y2="168" stroke="${FIG.ln}"/>
    <path d="M70,50 C150,105 260,140 510,155" fill="none" stroke="${FIG.ac}" stroke-width="2.5"/>
    <path d="M70,60 C160,110 260,132 345,138 C420,142 470,118 510,95" fill="none" stroke="${FIG.er}" stroke-width="2.5"/>
    <line x1="345" y1="18" x2="345" y2="168" stroke="${FIG.tx}" stroke-dasharray="5 4"/>
    ${fgT(490, 40, "train", 12)} ${fgT(490, 90, "val", 12)}
    ${fgT(345, 186, "best epoch", 11)} ${fgT(430, 186, "overfit", 11)}`),
},

/* ---- M3: word embeddings — analogy as parallel arrows ---- */
"embeddings": {
  cap: { en: "Embeddings place meaning in space: king − man + woman lands near queen.", ru: "Эмбеддинги раскладывают смысл в пространстве: king − man + woman попадает рядом с queen." },
  svg: () => figSvg(200, `
    ${fgDot(120, 130, 6)} ${fgT(120, 150, "man", 11)}
    ${fgDot(120, 50, 6)} ${fgT(120, 38, "woman", 11)}
    ${fgDot(400, 120, 6)} ${fgT(400, 140, "king", 11)}
    ${fgDot(400, 40, 6, FIG.ok)} ${fgT(400, 28, "queen", 11)}
    <line x1="132" y1="122" x2="388" y2="112" stroke="${FIG.ac}" stroke-width="2"/>
    <line x1="132" y1="48" x2="388" y2="42" stroke="${FIG.ac}" stroke-width="2" stroke-dasharray="6 4"/>
    ${fgDot(210, 165, 5, FIG.er)} ${fgT(210, 185, "apple", 11)}
    ${fgDot(255, 178, 5, FIG.er)} ${fgT(268, 195, "pear", 11)}`),
},

/* ---- M4: attention — arrows weighted by relevance ---- */
"attention": {
  cap: { en: "Attention: encoding “sat”, the model looks at every token — weight ∝ arrow thickness.", ru: "Внимание: кодируя «sat», модель смотрит на все токены — вес ∝ толщине стрелки." },
  svg: () => {
    const words = ["the", "cat", "sat", "on", "mat"], ws = [1, 3.5, 1, 1.2, 0.8];
    const xs = [80, 180, 280, 380, 480];
    const arrows = xs.map((x, i) => `<line x1="${x}" y1="128" x2="280" y2="62" stroke="${FIG.ac}" stroke-width="${ws[i]}" opacity=".8"/>`).join("");
    const boxes = xs.map((x, i) => `<rect x="${x - 30}" y="136" width="60" height="30" rx="8" fill="${i === 1 ? "#ffe98a" : FIG.su}" stroke="${FIG.ln}"/>${fgT(x, 156, words[i], 12)}`).join("");
    return figSvg(190, arrows +
      `<rect x="250" y="30" width="60" height="30" rx="8" fill="${FIG.acs}" stroke="${FIG.ac}"/>${fgT(280, 50, "sat", 12)}` + boxes);
  },
},

/* ---- M5: convolution — kernel sliding over the image ---- */
"conv": {
  cap: { en: "A 3×3 kernel slides over the image; each position produces one output pixel.", ru: "Ядро 3×3 скользит по изображению; каждая позиция даёт один пиксель выхода." },
  svg: () => figSvg(180, `
    ${[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => `<rect x="${60 + c * 26}" y="${20 + r * 26}" width="26" height="26" fill="${FIG.su}" stroke="${FIG.ln}"/>`).join("")).join("")}
    <rect x="60" y="20" width="78" height="78" fill="none" stroke="${FIG.ac}" stroke-width="2.5"/>
    <rect x="112" y="72" width="78" height="78" fill="none" stroke="${FIG.ac}" stroke-width="2" stroke-dasharray="6 4" opacity=".7"/>
    ${fgT(315, 82, "→", 20)}
    ${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${360 + c * 30}" y="${30 + r * 30}" width="30" height="30" fill="${r === 0 && c === 0 ? FIG.acs : FIG.su}" stroke="${r === 0 && c === 0 ? FIG.ac : FIG.ln}"/>`).join("")).join("")}
    ${fgT(120, 168, "image 5×5", 11)} ${fgT(405, 148, "feature map 3×3", 11)}`),
},

/* ---- M5: IoU — intersection over union ---- */
"iou": {
  cap: { en: "IoU = overlap ÷ union of the predicted and true boxes; detectors need IoU ≥ .5 to count.", ru: "IoU = пересечение ÷ объединение предсказанной и истинной рамок; детектор засчитывается при IoU ≥ .5." },
  svg: () => figSvg(160, `
    <rect x="120" y="30" width="180" height="100" rx="4" fill="${FIG.acs}" stroke="${FIG.ac}" stroke-width="2"/>
    <rect x="180" y="45" width="180" height="100" rx="4" fill="#ffe98a55" stroke="${FIG.br}" stroke-width="2"/>
    <rect x="180" y="45" width="120" height="85" fill="${FIG.ac}" opacity=".18"/>
    ${fgT(210, 24, "truth", 11)} ${fgT(360, 158, "predicted", 11)}
    ${fgT(240, 92, "∩", 16)} ${fgT(430, 92, "IoU = ∩ / ∪", 13, "start")}`),
},

/* ---- M9: the RL loop ---- */
"rl-loop": {
  cap: { en: "RL: the agent acts, the environment returns a new state and a reward — repeat forever.", ru: "RL: агент действует, среда возвращает новое состояние и награду — и так по кругу." },
  svg: () => figSvg(170, `
    <rect x="70" y="55" width="140" height="60" rx="14" fill="${FIG.acs}" stroke="${FIG.ac}" stroke-width="2"/>
    <rect x="350" y="55" width="140" height="60" rx="14" fill="${FIG.oks}" stroke="${FIG.ok}" stroke-width="2"/>
    ${fgT(140, 90, "agent", 14)} ${fgT(420, 90, "environment", 14)}
    <line x1="210" y1="70" x2="350" y2="70" stroke="${FIG.ac}" stroke-width="2.5"/>
    <path d="M350,70 l-10,-5 v10 z" fill="${FIG.ac}"/>
    <line x1="350" y1="100" x2="210" y2="100" stroke="${FIG.ok}" stroke-width="2.5"/>
    <path d="M210,100 l10,-5 v10 z" fill="${FIG.ok}"/>
    ${fgT(280, 62, "action", 11)} ${fgT(280, 118, "state + reward", 11)}`),
},

/* ---- M10/M11: diffusion — noise in, denoise out ---- */
"diffusion": {
  cap: { en: "Diffusion: training destroys images with noise; the model learns to run it backwards.", ru: "Диффузия: при обучении изображение зашумляют; модель учится разворачивать процесс назад." },
  svg: () => {
    const panel = (x, dots) => dots.map(([dx, dy, r, f]) => `<circle cx="${x + dx}" cy="${65 + dy}" r="${r}" fill="${f}"/>`).join("");
    const rings = c => [[0, -20, 5, c], [-18, -8, 5, c], [18, -8, 5, c], [-10, 14, 5, c], [10, 14, 5, c]];
    const rnd = [[4, -26, 3, FIG.ln], [-26, -2, 3, FIG.ln], [24, -14, 3, FIG.tx], [-4, 20, 3, FIG.ln], [14, 6, 3, FIG.tx], [-16, -18, 3, FIG.ln], [0, 0, 4, FIG.ln]];
    return figSvg(150, `
      ${panel(80, rings(FIG.ac))}
      ${panel(210, [[0, -20, 5, FIG.ac], [-18, -8, 5, FIG.ln], [18, -8, 5, FIG.ac], [-10, 14, 3, FIG.ln], [10, 14, 5, FIG.ac], [30, -30, 3, FIG.ln]])}
      ${panel(340, rnd)}
      ${panel(470, rnd)}
      ${fgT(145, 40, "→", 16)} ${fgT(275, 40, "→", 16)} ${fgT(405, 40, "→", 16)}
      ${fgT(80, 130, "x₀", 12)} ${fgT(470, 130, "noise", 11)}
      <path d="M455,105 Q280,150 95,105" fill="none" stroke="${FIG.ok}" stroke-width="2" stroke-dasharray="6 4"/>
      ${fgT(280, 148, "learned denoising", 11)}`);
  },
},

/* ---- M12: BFS expansion order on a search tree ---- */
"search-tree": {
  cap: { en: "BFS expands level by level — the number inside each node is its expansion order.", ru: "BFS раскрывает узлы уровень за уровнем — число внутри узла это порядок раскрытия." },
  svg: () => {
    const n = [[280, 35, "1"], [180, 95, "2"], [380, 95, "3"], [130, 155, "4"], [230, 155, "5"], [330, 155, "6"], [430, 155, "★"]];
    const e = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
    return figSvg(185,
      e.map(([a, b]) => `<line x1="${n[a][0]}" y1="${n[a][1]}" x2="${n[b][0]}" y2="${n[b][1]}" stroke="${FIG.ln}" stroke-width="1.5"/>`).join("") +
      n.map(([x, y, t], i) => `<circle cx="${x}" cy="${y}" r="17" fill="${i === 6 ? "#ffe98a" : FIG.acs}" stroke="${i === 6 ? FIG.br : FIG.ac}" stroke-width="2"/>${fgT(x, y + 4, t, 12)}`).join(""));
  },
},

/* ---- M12: minimax on a tiny game tree ---- */
"minimax": {
  cap: { en: "Minimax: leaves get scores, min layers take the worst case for you, max the best.", ru: "Минимакс: листьям присваиваются оценки, min-уровень берёт худшее для вас, max — лучшее." },
  svg: () => {
    const e = [[280, 40, 190, 95], [280, 40, 370, 95], [190, 95, 130, 150], [190, 95, 250, 150], [370, 95, 310, 150], [370, 95, 430, 150]];
    return figSvg(190,
      e.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${FIG.ln}" stroke-width="1.5"/>`).join("") +
      `<rect x="255" y="20" width="50" height="36" rx="8" fill="${FIG.acs}" stroke="${FIG.ac}" stroke-width="2"/>${fgT(280, 44, "max", 11)}` +
      `<rect x="165" y="78" width="50" height="34" rx="8" fill="${FIG.su}" stroke="${FIG.ln}"/>${fgT(190, 100, "min", 11)}` +
      `<rect x="345" y="78" width="50" height="34" rx="8" fill="${FIG.su}" stroke="${FIG.ln}"/>${fgT(370, 100, "min", 11)}` +
      [[130, "3"], [250, "5"], [310, "2"], [430, "9"]].map(([x, v]) => `<rect x="${x - 18}" y="140" width="36" height="28" rx="6" fill="#fff" stroke="${FIG.ln}"/>${fgT(x, 159, v, 12)}`).join("") +
      fgT(190, 135, "→ 3", 11) + fgT(370, 135, "→ 2", 11) + fgT(280, 14, "= 3", 11));
  },
},
};

/* render a fig block: <figure> + bilingual caption (unknown ids render nothing) */
function figHTML(id) {
  const f = FIGURES[id];
  if (!f) return "";
  return `<figure class="prl-fig">${f.svg()}<figcaption>${esc(loc(f.cap))}</figcaption></figure>`;
}

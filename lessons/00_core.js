/* Lesson content format.
   COURSE[moduleId] = [ L(title, minutes, refs, steps), ... ]
   steps: T(title, blocks) = explanation · Q(question, options, correctIndex, explanation) = check
   blocks: p(text) paragraph · f(text) formula · ul([...]) list · code(text) · note(text) · fig(id) diagram from FIGURES (figures.js)
   Inline: `code`  **bold**                                                        */
const COURSE = {};
const p = t => ["p", t];
const f = t => ["f", t];
const ul = a => ["ul", a];
const code = t => ["code", t];
const note = t => ["note", t];
const img = (src, alt, cap) => ["img", { src, alt, cap }];
const md = t => ["md", t];
const T = (title, blocks) => ({ k: "text", title, blocks });
/* options are shuffled deterministically (seeded by the question) so the correct one isn't always first */
const Q = (q, options, answer, explain) => {
  let h = 0; for (const c of q) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const idx = options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = (h >>> 16) % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  // an identity permutation leaves the answer at A and shuffles nothing — swap two slots
  if (idx.every((v, i) => v === i) && idx.length > 1) [idx[0], idx[idx.length - 1]] = [idx[idx.length - 1], idx[0]];
  return { k: "quiz", q, options: idx.map(i => options[i]), answer: idx.indexOf(answer), explain };
};
const L = (title, minutes, refs, steps) => ({ title, minutes, refs, steps });

const REF = {
  cs229: ["Stanford CS229 notes", "https://cs229.stanford.edu/main_notes.pdf"],
  cs231n: ["Stanford CS231n notes", "https://cs231n.github.io/"],
  d2l: ["Dive into Deep Learning (d2l.ai)", "https://d2l.ai/"],
  dls: ["DLS МФТИ (Stepik)", "https://stepik.org/course/230362/promo"],
  shad: ["Учебник ШАД по ML", "https://education.yandex.ru/handbook/ml"],
  skl: ["scikit-learn User Guide", "https://scikit-learn.org/stable/user_guide.html"],
  pt: ["PyTorch: Learn the Basics", "https://pytorch.org/tutorials/beginner/basics/intro.html"],
  np: ["NumPy: broadcasting", "https://numpy.org/doc/stable/user/basics.broadcasting.html"],
  pd: ["pandas: 10 minutes to pandas", "https://pandas.pydata.org/docs/user_guide/10min.html"],
  py: ["The Python Tutorial (official)", "https://docs.python.org/3/tutorial/"],
  mpl: ["Matplotlib: Quick start guide", "https://matplotlib.org/stable/users/explain/quick_start.html"],
  sns: ["Seaborn: tutorial", "https://seaborn.pydata.org/tutorial.html"],
  hfnlp: ["Hugging Face LLM course", "https://huggingface.co/learn/llm-course/chapter1/1"],
  hftok: ["HF course: token classification", "https://huggingface.co/learn/llm-course/chapter7/2"],
  voita: ["Lena Voita NLP course", "https://lena-voita.github.io/nlp_course.html"],
  alammar: ["The Illustrated Transformer", "https://jalammar.github.io/illustrated-transformer/"],
  karpathy: ["Karpathy: Neural Networks Zero to Hero", "https://karpathy.ai/zero-to-hero.html"],
  udl: ["Understanding Deep Learning (Prince)", "https://udlbook.github.io/udlbook/"],
  hfaudio: ["Hugging Face Audio course", "https://huggingface.co/learn/audio-course/chapter0/introduction"],
  hfrl: ["Hugging Face Deep RL course", "https://huggingface.co/learn/deep-rl-course/unit0/introduction"],
  sutton: ["Sutton & Barto, RL (2nd ed.)", "http://incompleteideas.net/book/the-book-2nd.html"],
  hfdiff: ["Hugging Face Diffusion course", "https://huggingface.co/learn/diffusion-course/unit0/1"],
  weng: ["Lilian Weng: What are diffusion models?", "https://lilianweng.github.io/posts/2021-07-11-diffusion-models/"],
  advml: ["Adversarial Robustness tutorial", "https://adversarial-ml-tutorial.org/"],
  aima: ["AIMA (Russell & Norvig)", "https://aima.cs.berkeley.edu/"],
  recsys: ["Google: Recommendation Systems", "https://developers.google.com/machine-learning/recommendation"],
  opencv: ["OpenCV: feature matching", "https://docs.opencv.org/4.x/dc/dc3/tutorial_py_matcher.html"],
  cv2geom: ["OpenCV: geometric transformations", "https://docs.opencv.org/4.x/da/d6e/tutorial_py_geometric_transformations.html"],
  cs231npy: ["CS231n: Python & NumPy tutorial", "https://cs231n.github.io/python-numpy-tutorial/"],
  clip: ["CLIP paper (Radford et al.)", "https://arxiv.org/abs/2103.00020"],
  ioai: ["IOAI official task repos", "https://github.com/IOAI-official"],
};

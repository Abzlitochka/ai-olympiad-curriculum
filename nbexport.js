/* Lesson → .ipynb — every lesson also exists as a runnable notebook, generated
   client-side (nbformat 4) from the same COURSE data. lab.js pushes it into the
   student's local JupyterLab; tools/build_notebooks.mjs writes the same files
   to notebooks/ for download. */

const SITE_URL = "https://ai-olympiad-curriculum.netlify.app";   // absolute base for images in exported notebooks

const RU2LAT = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",
  к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",
  ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };

const nbFileName = (modId, li) => {
  const t0 = lessonsOf(modId)[li].title;
  const en = (typeof t0 === "object" && t0) ? t0.en : String(t0);
  const lat = en.toLowerCase().replace(/[а-яё]/g, ch => RU2LAT[ch] || ch);
  const slug = lat.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "lesson";
  return `${modId}-L${li + 1}-${slug}.ipynb`;
};

const nbSrc = s => String(s).split("\n").map((l, i, a) => i < a.length - 1 ? l + "\n" : l);
const nbMd = s => ({ cell_type: "markdown", metadata: {}, source: nbSrc(s) });
const nbCode = s => ({ cell_type: "code", metadata: {}, source: nbSrc(s), outputs: [], execution_count: null });

/* content blocks use the same inline markup as the site: `code` and **bold**
   are already valid markdown, so text passes through unchanged */
function nbBlockMd([type, v]) {
  switch (type) {
    case "p": return loc(v);
    case "f": return "```\n" + loc(v) + "\n```";
    case "ul": return v.map(x => "- " + loc(x)).join("\n");
    case "note": return loc(v).split("\n").map((l, i) => (i === 0 ? "> **Note.** " : "> ") + l).join("\n");
    case "fig": return "> 🖼 *" + loc(FIGURES[v] ? FIGURES[v].cap : v) + "*";
    case "img": return `![${loc(v.alt) || ""}](${SITE_URL}/${v.src})\n\n> *${loc(v.cap) || ""}*`;
  }
  return "";
}

const NB_LETTERS = "ABCDEFGH";
function nbStepCells(s) {
  if (s.k === "quiz") {
    const md = `### ✏️ ${loc(s.q)}\n\n` +
      s.options.map((o, i) => `**${NB_LETTERS[i]}.** ${loc(o)}`).join("\n") +
      `\n\n<details><summary>Answer</summary>\n\n**${NB_LETTERS[s.answer]}.** ${loc(s.options[s.answer])}\n\n${loc(s.explain)}\n\n</details>`;
    return [nbMd(md)];
  }
  const cells = [];
  let md = s.title ? `## ${loc(s.title)}\n\n` : "";
  const pushMd = () => { if (md.trim()) { cells.push(nbMd(md)); md = ""; } };
  for (const b of s.blocks || []) {
    if (b[0] === "code") {
      pushMd();
      cells.push(nbCode(b[1]));
    } else if (b[0] === "md") {
      // converted markdown lessons: split on ``` fences — even segments are
      // markdown, odd segments are code. Only python/unmarked fences become
      // runnable cells; other languages (netlogo, html, bash…) stay fenced
      // inside markdown cells.
      const segs = String(b[1]).split(/^(```[^\n]*)$/m);
      let inCode = false, lang = "";
      for (const seg of segs) {
        const fm = seg.match(/^```(\w*)/);
        if (fm) { inCode = !inCode; lang = inCode ? fm[1].toLowerCase() : ""; continue; }
        const trimmed = seg.trim();
        if (!trimmed) continue;
        if (!inCode) { md += trimmed + "\n\n"; continue; }
        if (["", "python", "py"].includes(lang)) {
          pushMd(); cells.push(nbCode(trimmed));
        } else {
          md += "```" + lang + "\n" + trimmed + "\n```\n\n";
        }
      }
    } else {
      md += nbBlockMd(b) + "\n\n";
    }
  }
  pushMd();
  if (md.trim()) cells.push(nbMd(md));
  return cells;
}

/* ---------- self-check tasks (Задания) ----------
   Mapped exercises (LESSON_EX) become a task block at the end of the lesson
   notebook: description + starter cell + a check cell that re-runs the same
   randomized grading as the site trainer (gen vs reference solve), so a
   student gets ✅/❌ feedback inside JupyterLab with no extra installs. */

const NB_MSGS = {
  intro: {
    ru: "Решите функцию в ячейке «ваш код», затем запустите ячейку проверки — она прогонит случайные тесты и покажет первое расхождение. Сначала один раз запустите служебную ячейку ниже.",
    en: "Implement the function in the 'your code' cell, then run the check cell — it runs randomized tests and shows the first mismatch. Run the helper cell below once first." },
  helper: {
    ru: "служебная ячейка проверки заданий — запустите один раз",
    en: "task-checking helper cell — run once" },
  task: { ru: "Задание", en: "Task" },
  min: { ru: "мин", en: "min" },
  hint: { ru: "Подсказка", en: "Hint" },
  yourCode: { ru: "ваш код", en: "your code" },
  check: { ru: "проверка — запустите после решения ячейки выше", en: "self-check — run after solving the cell above" },
  noFn: { ru: "❓ Определите функцию «{e}» в ячейке решения и запустите её", en: "❓ Define a function `{e}` in the solution cell and run it" },
  runErr: { ru: "❌ Тест {i}: {t}: {m}", en: "❌ Test {i}: {t}: {m}" },
  wrong: { ru: "❌ Тест {i}: {r}", en: "❌ Test {i}: {r}" },
  badRef: { ru: "⚠️ Проверка сломана (генератор/эталон): {t}: {m}", en: "⚠️ Check harness broke (generator/reference): {t}: {m}" },
  inL: { ru: "Вход", en: "Input" },
  expL: { ru: "Ожидалось", en: "Expected" },
  gotL: { ru: "Получено", en: "Got" },
  ok: { ru: "✅ Верно! Все {n} тестов пройдены.", en: "✅ Correct! All {n} tests passed." },
};

function nbTaskHarness() {
  const L = {};
  for (const k of ["noFn", "runErr", "wrong", "badRef", "inL", "expL", "gotL", "ok"]) L[k] = loc(NB_MSGS[k]);
  return `# ── ${loc(NB_MSGS.helper)} ──
import copy
import numpy as np
import math, statistics, itertools, collections, functools, heapq, random

try:
    import sys; sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

_L = ${JSON.stringify(L)}

def _nb_copy_kw(kw):
    return {k: (v.copy() if isinstance(v, np.ndarray) else copy.deepcopy(v)) for k, v in kw.items()}

def _nb_jsafe(x, depth=0):
    if depth > 6: return "…"
    if isinstance(x, np.ndarray): return _nb_jsafe(x.tolist(), depth + 1)
    if isinstance(x, np.integer): return int(x)
    if isinstance(x, np.floating): return float(x)
    if isinstance(x, np.bool_): return bool(x)
    if isinstance(x, float): return round(x, 6) if math.isfinite(x) else str(x)
    if isinstance(x, (list, tuple)): return [_nb_jsafe(v, depth + 1) for v in x]
    if isinstance(x, dict): return {str(k): _nb_jsafe(v, depth + 1) for k, v in x.items()}
    if isinstance(x, (int, str, bool)) or x is None: return x
    return repr(x)

def _nb_cmp(exp, got, path=""):
    if isinstance(exp, np.ndarray) or isinstance(got, np.ndarray):
        e, g = np.asarray(exp), np.asarray(got)
        if e.shape != g.shape:
            return f"shape {tuple(g.shape)} != expected {tuple(e.shape)}"
        try:
            if np.issubdtype(e.dtype, np.number) or np.issubdtype(g.dtype, np.number):
                ef, gf = e.astype(float), g.astype(float)
                close = np.isclose(gf, ef, atol=1e-6, rtol=1e-5, equal_nan=True)
                if not bool(close.all()):
                    i = tuple(int(v) for v in np.argwhere(~close)[0])
                    return f"{path}first mismatch at index {i}: got {gf[i]:.6g} vs expected {ef[i]:.6g}"
            elif not np.array_equal(g, e):
                return f"{path}values differ"
        except Exception as ex:
            return f"{path}cannot compare: {ex}"
        return None
    if isinstance(exp, (int, float)) and not isinstance(exp, bool) and isinstance(got, (int, float)) and not isinstance(got, bool):
        if not np.isclose(float(exp), float(got), atol=1e-6, rtol=1e-5):
            return f"{path}{got} != expected {exp}"
        return None
    if isinstance(exp, (list, tuple)) and isinstance(got, (list, tuple)):
        if len(exp) != len(got):
            return f"{path}length {len(got)} != expected {len(exp)}"
        for i, (a, b) in enumerate(zip(exp, got)):
            r = _nb_cmp(a, b, path + f"[{i}].")
            if r: return r
        return None
    if isinstance(exp, dict) and isinstance(got, dict):
        if set(exp) != set(got):
            return f"{path}keys differ"
        for k in exp:
            r = _nb_cmp(exp[k], got[k], path + f"[{k!r}].")
            if r: return r
        return None
    if exp != got:
        return f"{path}{got!r} != expected {exp!r}"
    return None

def _check_task(g, ref_src, entry, n=20, seed=0):
    """g — globals() ноутбука; ref_src — gen() + эталонное решение."""
    fn = g.get(entry)
    if not callable(fn):
        print(_L["noFn"].format(e=entry)); return
    ns = {"np": np, "math": math, "statistics": statistics, "itertools": itertools,
          "collections": collections, "functools": functools, "heapq": heapq, "random": random}
    try:
        exec(ref_src, ns)
        gen, ref = ns["gen"], ns[entry]
    except Exception as e:
        print(_L["badRef"].format(t=type(e).__name__, m=e)); return
    rng = np.random.default_rng(seed)
    for i in range(n):
        try:
            kw = gen(rng)
        except Exception as e:
            print(_L["badRef"].format(t=type(e).__name__, m=e)); return
        try:
            got = fn(**_nb_copy_kw(kw))
        except Exception as e:
            print(_L["runErr"].format(i=i + 1, t=type(e).__name__, m=e)
                  + "\\n" + _L["inL"] + ": " + repr(_nb_jsafe(kw))); return
        exp = ref(**_nb_copy_kw(kw))
        r = _nb_cmp(exp, got)
        if r:
            print(_L["wrong"].format(i=i + 1, r=r)
                  + "\\n" + _L["inL"] + ": " + repr(_nb_jsafe(kw))
                  + "\\n" + _L["expL"] + ": " + repr(_nb_jsafe(exp))
                  + "\\n" + _L["gotL"] + ": " + repr(_nb_jsafe(got))); return
    print(_L["ok"].format(n=n))`;
}

function nbTaskMd(x, n) {
  const diff = "●".repeat(x.diff || 1) + "○".repeat(3 - (x.diff || 1));
  let md = `### ${loc(NB_MSGS.task)} ${n} — ${x.title}\n\n${diff} · ~${x.minutes} ${loc(NB_MSGS.min)}\n\n`;
  if (x.theory) md += "> " + String(x.theory).split("\n").join("\n> ") + "\n\n";
  if (x.prompt) md += x.prompt + "\n\n";
  if (x.hint) md += `<details><summary>${loc(NB_MSGS.hint)}</summary>\n\n${x.hint}\n\n</details>\n`;
  return md;
}

function nbTaskCells(modId, li) {
  if (typeof EXERCISES === "undefined" || typeof LESSON_EX === "undefined") return [];
  const ids = (LESSON_EX[`${modId}|${li}`] || [])
    .map(id => EXERCISES.find(x => x.id === id))
    .filter(x => x && x.entry && x.gen && x.solve && x.starter);
  if (!ids.length) return [];
  const cells = [
    nbMd(`---\n\n## ✅ ${loc({ ru: "Задания для самопроверки", en: "Self-check tasks" })}\n\n${loc(NB_MSGS.intro)}`),
    nbCode(nbTaskHarness()),
  ];
  ids.forEach((x, i) => {
    cells.push(nbMd(nbTaskMd(x, i + 1)));
    cells.push(nbCode(`import numpy as np\n\n${x.starter}`));
    cells.push(nbCode(`# ${loc(NB_MSGS.check)}\n_check_task(globals(), ${JSON.stringify(x.gen + "\n\n" + x.solve)}, ${JSON.stringify(x.entry)}, ${x.tests || 20})`));
  });
  return cells;
}

function lessonToNotebook(modId, li) {
  const m = MODULES.find(x => x.id === modId);
  const l = lessonsOf(modId)[li];
  const cells = [
    nbMd(`# ${loc(l.title)}\n\n**${m.id} · ${loc(m.title)}** — [AI Olympiad Curriculum](${SITE_URL})\n\n~${l.minutes} min`),
    ...l.steps.flatMap(nbStepCells),
    ...nbTaskCells(modId, li),
  ];
  if (l.refs && l.refs.length) {
    cells.push(nbMd(`---\n\n**${t("ls.deeper")}**\n` + l.refs.map(([nm, u]) => `- [${nm}](${u})`).join("\n")));
  }
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { display_name: "Python 3", name: "python3" },
      language_info: { name: "python", version: "3" },
    },
    cells,
  };
}

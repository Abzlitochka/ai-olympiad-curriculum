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

function lessonToNotebook(modId, li) {
  const m = MODULES.find(x => x.id === modId);
  const l = lessonsOf(modId)[li];
  const cells = [
    nbMd(`# ${loc(l.title)}\n\n**${m.id} · ${loc(m.title)}** — [AI Olympiad Curriculum](${SITE_URL})\n\n~${l.minutes} min`),
    ...l.steps.flatMap(nbStepCells),
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

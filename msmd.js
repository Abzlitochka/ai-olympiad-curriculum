/* msmd.js — small markdown renderer for lessons converted from external
   curricula (Microsoft ML/AI-For-Beginners, MIT). Renders a markdown string
   into the same markup the hand-written blocks produce.

   Supports: ###/#### subheads, paragraphs, **bold** *italic* ~~strike~~,
   `code`, $inline math$ (shown as code — no TeX lib on this site),
   [links] (http(s) only, target=_blank), ![images], lists (dash/star/1.),
   > blockquotes, ``` fenced code```, | tables |, --- rules.
   All source text is HTML-escaped before markup is added. */

/* msHl — tiny syntax highlighter for fenced code, no deps. Tokenizes the
   raw source (comments/strings can't be mistaken for keywords, since the
   leftmost regex alternative wins) and escapes each token itself. */
function msHl(src, lang) {
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const tag = (c, t) => `<span class="tk-${c}">${esc(t)}</span>`;
  const L = (lang || "").toLowerCase();
  const MK = ["html", "xml", "svg"].includes(L);
  let re;
  if (L === "python" || L === "py") re =
    /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|[fFrRbBuU]{0,3}"(?:\\.|[^"\\\n])*"|[fFrRbBuU]{0,3}'(?:\\.|[^'\\\n])*')|(@[\w.]+)|(\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[jJ]?\b)|(\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|self|cls)\b)/g;
  else if (L === "javascript" || L === "js") re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(@[\w.]+)|(\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|of|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|async|await|true|false|null|undefined|static)\b)/g;
  else if (L === "r") re =
    /(#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(@[\w.]+)|(\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b(?:function|library|require|if|else|for|while|repeat|break|next|return|TRUE|FALSE|NULL|NA|NaN|Inf|in)\b)/g;
  else if (["bash", "sh", "shell", "zsh"].includes(L)) re =
    /(#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:[^'\\\n])*')|(@[\w.]+)|(\b\d[\d_]*(?:\.\d+)?\b)|(\b(?:if|then|elif|else|fi|for|while|do|done|case|esac|in|function|return|echo|export|local|cd|pip|python|jupyter|uv|node|npm|npx|git|curl|ls|mkdir|cp|mv|rm)\b)/g;
  else if (MK) re =
    /(<!--[\s\S]*?-->)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(<\/?[A-Za-z][\w:.-]*|\/>|>)|([A-Za-z_:][\w:.-]*(?=\s*=))|($^)/g;
  else return esc(src);   // output/text/plain/unknown → plain, never miscolor
  let out = "", last = 0;
  for (const m of src.matchAll(re)) {
    out += esc(src.slice(last, m.index));
    const [full, c, s, d, a, k] = m;
    out += c !== undefined ? tag("c", full) : s !== undefined ? tag("s", full)
      : d !== undefined ? tag(MK ? "t" : "d", full)
      : a !== undefined ? tag(MK ? "a" : "n", full)
      : k !== undefined ? tag("k", full) : esc(full);
    last = m.index + full.length;
  }
  return out + esc(src.slice(last));
}

function msmd(src) {
  const escH = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* TeX-ish math → readable unicode (no TeX lib on this site). */
  const SUB = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅",
    "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "=": "₌",
    "(": "₍", ")": "₎", a: "ₐ", e: "ₑ", o: "ₒ", x: "ₓ", h: "ₕ", k: "ₖ",
    l: "ₗ", m: "ₘ", n: "ₙ", p: "ₚ", s: "ₛ", t: "ₜ", i: "ᵢ", j: "ⱼ",
    r: "ᵣ", u: "ᵤ", v: "ᵥ" };
  const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵",
    "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "=": "⁼",
    "(": "⁽", ")": "⁾", n: "ⁿ", t: "ᵗ", s: "ˢ", h: "ʰ", T: "ᵀ", i: "ⁱ" };
  const GR = { alpha: "α", beta: "β", gamma: "γ", delta: "δ", theta: "θ",
    lambda: "λ", mu: "μ", sigma: "σ", tau: "τ", pi: "π", epsilon: "ε",
    eta: "η", omega: "ω", phi: "φ", rho: "ρ", nabla: "∇", Gamma: "Γ",
    Delta: "Δ", Sigma: "Σ", Theta: "Θ" };
  const texFlat = s => s
    .replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, "$1√($2)")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\{([^{}]+)\}\\over[ ]*\{?([^{}]+)\}?/g, "($1)/($2)")
    .replace(/\\(?:mbox|mathrm|text)\{([^{}]*)\}/g, "$1")
    .replace(/\\([a-zA-Z]+)/g, (m, w) => GR[w] ??
      ({ times: "×", sum: "∑", prod: "∏", cdot: "·", in: "∈", to: "→",
         ldots: "…", dots: "…", le: "≤", ge: "≥", neq: "≠", approx: "≈",
         propto: "∝", infty: "∞" }[w] ?? ""))
    .replace(/[{}]/g, "")
    .replace(/_([a-zA-Z0-9]+)/g, (m, g) => [...g].map(c => SUB[c] || c).join(""))
    .replace(/\^([a-zA-Z0-9]+)/g, (m, g) => [...g].map(c => SUP[c] || c).join(""));

  /* Inline formatting: stash the few HTML tags we allow, escape the rest. */
  const ALLOW = /<\/?(?:sub|sup|u|del|mark)\s*>|<br\s*\/?>/gi;
  const inline = s => {
    const stash = [];
    s = String(s).replace(/\s*\((?:code blocks?|блок кода)\s*\d*\)/g, "");
    let r = escH(s.replace(ALLOW, m => {
      stash.push(m.replace(/\s+|\/(?=>)/g, "").toLowerCase());
      return `${stash.length - 1}`;
    }))
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\$\$([^$]+)\$\$/g, (m, f) => `<code class="prl-tex">${texFlat(f)}</code>`)
      .replace(/\$([^$\n]+)\$/g, (m, f) => `<code class="prl-tex">${texFlat(f)}</code>`)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
        (m, alt, url) => /^https?:/.test(url) || url.startsWith("ms-assets/")
          ? `<img class="prl-img" src="${url}" alt="${alt}" loading="lazy">` : alt)
      .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
        (m, txt, url) => /^https?:\/\//.test(url)
          ? `<a href="${url}" target="_blank" rel="noopener">${txt}</a>` : txt)
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|\W)__([^_]+)__/g, "$1<b>$2</b>")
      .replace(/(^|\W)\*([^*\n]+)\*/g, "$1<i>$2</i>")
      .replace(/(^|\W)_([^_\n]+)_/g, "$1<i>$2</i>")
      .replace(/~~([^~]+)~~/g, "<s>$1</s>");
    return r.replace(/\u0002(\d+)\u0003/g, (m, n) => stash[+n]);
  };

  const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0, para = [], list = null;   // list = {tag:"ul"|"ol", items:[]}

  const flushPara = () => {
    if (para.length) { out.push(`<p class="prl-p">${inline(para.join(" "))}</p>`); para = []; }
  };
  const flushList = () => {
    if (list) {
      out.push(`<${list.tag} class="prl-ul">${list.items.map(x => `<li${x.n ? ` value="${x.n}"` : ""}>${inline(x.t)}</li>`).join("")}</${list.tag}>`);
      list = null;
    }
  };
  const flush = () => { flushPara(); flushList(); };

  while (i < lines.length) {
    const line = lines[i];

    // fenced code — tolerate indentation (fences nested inside numbered
    // steps) and stray code on the opening line after the language tag
    const fence = line.match(/^(\s*)```(\w*)\s*(.*)$/);
    if (fence) {
      flush();
      const ind = fence[1], buf = [];
      if (fence[3]) buf.push(fence[3]);
      for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) {
        const cl = lines[i];
        buf.push(cl.startsWith(ind) && ind ? cl.slice(ind.length) : cl);
      }
      i++;
      out.push(`<div class="prl-code"><pre><code>${msHl(buf.join("\n"), fence[2])}</code></pre></div>`);
      continue;
    }

    // table: header row + |---| rule row
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flush();
      const cells = ln => ln.trim().replace(/^\||\|$/g, "").split("|").map(c => inline(c.trim()));
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
      out.push(`<table class="prl-table"><thead><tr>${head.map(c => `<th>${c}</th>`).join("")}</tr></thead>` +
        `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }

    // headings inside a section render as subheads
    const head = line.match(/^(#{1,6})\s+(.*)$/);
    if (head) {
      flush();
      const lvl = Math.min(head[1].length + 1, 6);
      out.push(`<h${lvl} class="prl-h">${inline(head[2].trim())}</h${lvl}>`);
      i++; continue;
    }

    // blockquote → note card; marker lines (-, *, n., 🎓, ✅, **) start a new
    // visual line so multi-entry glossaries don't fuse into one run-on
    if (/^>\s?/.test(line)) {
      flush();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        const raw = lines[i].replace(/^>\s?/, "");
        const b = raw.replace(/^\s*✅\s*/, "");
        const newLine = /^([-*+]|\d+[.)]|🎓|✅|📌|💡|⚠️|\*\*)/.test(raw.trim());
        if (buf.length && (newLine || b.trim() === "")) buf.push("\x01");
        else if (buf.length) buf.push(" ");
        buf.push(b);
        i++;
      }
      const html = buf.join("").split("\x01").map(x => inline(x.trim().replace(/^#{1,6}\s+(.*)$/, "**$1**"))).filter(Boolean).join("<br>");
      out.push(`<aside class="prl-note"><div>${html}</div></aside>`);
      continue;
    }

    // list item — numbered items keep their order (<ol>), ✅ prefixes drop
    const li = line.match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/);
    if (li) {
      flushPara();
      const tag = li[2] ? "ol" : "ul";
      if (!list) list = { tag, items: [] };
      list.items.push({ t: li[3].replace(/^✅\s*/, ""), n: li[2] }); i++; continue;
    }

    // ✅ try-this callouts (Microsoft checklist prompts) → styled note, no emoji
    const tryM = line.match(/^\s*✅\s+(.*)$/);
    if (tryM) {
      flush();
      out.push(`<aside class="prl-note prl-try"><div>${inline(tryM[1])}</div></aside>`);
      i++; continue;
    }

    // horizontal rule / blank → separators
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { flush(); i++; continue; }
    if (/^\s*$/.test(line)) { flush(); i++; continue; }

    para.push(line.trim());
    i++;
  }
  flush();
  return out.join("\n");
}

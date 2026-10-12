# AI Olympiad Curriculum — design system

Source of truth for how this app should look and feel. Authored after the
`design-md-chrome` blueprint: token, rule, and rationale in one file, so an
agent's next design decision stays on-system without re-deriving it.

## Mission

A static learning platform for school students preparing for AI olympiads
(IOAI, FAIO, AICC, …). The visual language is **Yandex Practicum course page**:
calm, text-first, dense with real content, zero decoration. The interface must
feel like a serious workbook, not a marketing site.

- Product surface: static web app (plain HTML/CSS/JS, Pyodide in-browser)
- Audience: students ~14–18, plus supervisors checking progress
- Design dials (taste-skill): VARIANCE 5 · MOTION 2 · DENSITY 6

## Style foundations

### Color — semantic tokens only, never raw hex in components

| Token | Value | Use |
|---|---|---|
| `--bg` | `#ffffff` | page canvas |
| `--subtle` | `#f4f4f6` | neutral tiles, code blocks, hover fills |
| `--line` / `--line-strong` | `#e7e7ea` / `#d3d3d8` | hairlines / input borders |
| `--text` = `--ink` | `#141414` | body text, dark buttons, active nav pill, footer |
| `--text-2` / `--text-3` | `#4f4f58` / `#5e5e68` | secondary / meta text |
| `--brand` | `#ffdd2d` | primary CTA, logo mark, eyebrow pill, lesson end card, selection |
| `--brand-hover` | `#ffd000` | CTA hover |
| `--accent` | `#3b5bdb` | links and focus ring only |
| `--tint-yellow` / `-sky` / `-mint` / `-lilac` / `-peach` / `-rose` | `#fff6c9` `#dfeeff` `#dcf4e8` `#ebe6ff` `#ffe7d9` `#ffe1e7` | tile surfaces that carry meaning (below) |
| `--ok` `--err` `--warn` | `#1a7f45` `#c9302c` `#b45309` | pass / fail / nudge |

Rationale (taste-skill redesign audit): one saturated brand colour, pastel tints
only as *surfaces* and always under ink text (contrast ≥ 12:1), never as text or
borders. Tints are never decoration:

- **Programme groups**: Programming = yellow tint, Math & theory = lilac,
  Machine learning = mint (`.grp[data-grp] .card`).
- **Sprints**: S1 yellow, S2/S7 sky, S3/S8 mint, S4/S9 lilac, S5 peach, S6 rose.
- **Hero facts**: first fact brand yellow, then lilac / mint / peach.
- **Lesson**: notes = yellow tint, quiz = lilac, end-of-lesson card = brand yellow.
- Progress fills are ink on tinted tiles (yellow-on-yellow would vanish) and
  brand yellow inside the lesson progress bar on white.

No gradients, no shadows (hover = 2–3px lift via `transform`), no purple/blue
"AI" fingerprint.

### Typography

- Family: **Onest** (self-hosted variable 400–800, Latin + Cyrillic, SIL OFL —
  `css/fonts.css`). Chosen over Inter because it is built for Cyrillic and sits
  close to Yandex Sans; Inter was the "default AI font" the redesign audit flags.
- Display: hero h1 `clamp(44px, 5.6vw, 72px)` / 800 / -0.045em / line-height 1.
  Group titles 36px/800, lesson title 42px/800, step titles 28px/800, module
  tile titles 19px/700.
- Body 16px/1.6; lesson prose 17.5px/1.7 in a 720px column (~70 characters).
- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs.
- Numbers use `font-variant-numeric: tabular-nums` (facts, sprint numbers,
  counters) so they don't jitter.
- Mono (`--mono`) for code, exercise ids and the install command.

### Shape, space, motion

- Radius: tiles 24–28px, buttons 14–18px, inputs/rows 12px, chips and nav 999px.
- Header: 72px, translucent white with backdrop blur, 1px hairline. Logo mark is
  a 34px yellow rounded square with "AI". Active nav tab = ink pill with white text.
- Sections are separated by 72–96px of white space; borders are a fallback.
- Footer: full-bleed ink band, muted light text, white links.
- Motion is limited to colour/transform ≤300ms: hover lift on tiles, `scale(.98)`
  on press for all buttons, smooth anchor scroll. `prefers-reduced-motion`
  turns all of it off.
- `[hidden]` always wins (`display: none !important`) — component rules with
  `display:flex/block` must not resurrect hidden panes.

## Component rules

### Programme structure (`.grp` → `.subj`)

- Two levels only. `<section class="grp">` per `GROUPS` entry (Programming /
  Math & theory / Machine learning) — the discipline a student thinks in.
  `<div class="subj">` per `SUBJECTS` entry inside a group — the topic track.
  A single-subject group skips the sub-header and renders cards directly.
- Group header: name (`.grp-head h3`, 30px), blurb, right-aligned meta
  `N modules · x/y done`, 4px progress hairline (`.grp-bar`).
- Subject header: name (`.subj-head h4`, 18px), same blurb/meta/bar pattern.
- Modules are accordion rows (`.card` in `#tab-path`): hairline-separated, not
  boxed. Number = module's global index, stable under filtering.
- A module belongs to exactly one subject; a subject to exactly one group.
  Fine-grained cross-cutting tags stay on `m.domains` as `.chip`s — do not
  create a third grouping axis on this page.

### Lessons index (`.lsm-*`, `#tab-lessons`)

- Flat topic index modelled on HAIO's MÓLÓ materials page: one axis only
  (discipline `GROUPS`), modules as unnumbered `.lsm-mod` blocks, lessons as
  `.lrow` rows shared with the Program tab via `lessonRow()`.
- Rows link with `data-dl` (routes to the Program tab and opens the lesson);
  module heads lead with the M-id — never add a second per-group counter,
  M-ids are the only stable identifier.
- Level chips (`.lsm-chip`): single-select filter mapped to `m.stars`
  (Explorer ≤2 / Advanced 3–4 / Competitor 5). Active state = dark fill like
  `.lang-sw button.on`, plus `aria-pressed`.
- `LESSON_DISC` (data hook, empty by default) can reassign a single lesson to
  another group; such rows land in the target group's trailing
  "From other disciplines" block with their M-id prefix.

### Buttons

- Primary = `--brand` fill with ink text, 48px high (60px for hero), radius 14–18px, hover = `--brand-hover`, press = `scale(.98)`.
- Secondary = `--ink` fill with white text (the Practicum black button). Lesson "next step" buttons are brand yellow until done, then neutral. Ghost = text-only.
- Disabled = `opacity .4`, `pointer-events: none`.
- Touch: `@media (pointer: coarse)` lifts targets to ≥44px.

### Practice → JupyterLab (`lab.js`)

One runtime: a real Jupyter started by `lab-helper/` on 127.0.0.1 and
embedded in the pane. There is no in-browser notebook, no JupyterLite and no
Colab export — exercises and tensor puzzles are the only code that runs in the
browser (Pyodide). The student guide is `guide/jupyterlab.html`. Rules:

- The pane shows the setup card until a computer is connected; after that it
  shows the lab. The lesson notebook (`lessonToNotebook`, `nbexport.js`) is
  written into `Documents/OlympiadAI/<module>/` through Jupyter's Contents API
  and an existing file is never overwritten.
- Pairing comes from the helper's link `#lab=<port>:<token>`; the page asks
  with an inline card (no `confirm()`), stores the token in `localStorage`
  and strips it from the address bar at once.
- Install copy is one command, generated from the page's own URL — the wheel
  is served from this site (`lab-helper/`), never from a public repository.
  After changing `lab-helper/`, run `./lab-helper/release-to-showcase.sh`.
- Status language as elsewhere: the dot and the one-line status say what is
  true now («Компьютер подключён · порт N», «Сервер не отвечает…»); offline
  and cookie-fallback states are cards with the next action, not alerts.

### Lesson view (`views/lesson.js`, `css/lesson.css`)

- Full-screen reading: while a lesson is open `body.in-lesson` hides the site
  header and footer (only on the Learn tab; `goTab` re-syncs it). No left sidebar.
- Top bar (60px, sticky): contents button, module chip + lesson title, "Step n/N",
  previous / next lesson, theme switch, "Program ×". Lesson progress is a 3px
  line along the bar's bottom edge.
- Contents drawer: slides in from the left (scrim, Esc and × close it). A module
  `<select>` re-lists lessons of any module without leaving the lesson; the
  current lesson expands into its steps; picking a lesson switches to it.
- Reading column 860px, centred; notes yellow tint, quiz lilac, end card brand yellow.

### Status language

- "Done" is text or the yellow progress fill — never a green banner, emoji, or
  icon. `✓`-style glyphs are allowed only where they already exist
  (`.card-plus`, lnum dots are CSS shapes, not characters).
- Warn state (`--warn`) for "content done, project left" nudges.

## Accessibility — WCAG 2.2 AA

- `:focus-visible` = 2px `--accent` outline, `offset 2px`. Never remove it.
- All interactive rows are real `<button>`s (`lrow`, `card-head`, `sp-proj`,
  `prl-*`) — no `div` click targets.
- Progress bars keep `role="progressbar"` + `aria-valuenow` where measurable.
- Contrast: `--text` on `--bg` ≈ 16:1; `--text-3` is the lightest allowed text
  and only for meta at ≥13px.
- Re-rendered regions (`#subjects`, trainer lists) rebuild DOM — keep focus
  management in mind when editing them.

## Rules: Do

- Reuse tokens and existing classes before inventing new ones.
- Keep one axis per grouping: sprints = time, subjects = topic. Do not re-add a
  third module grouping on the same page.
- Write UI copy in plain English a 16-year-old parses on first read. Numbers
  over adjectives ("3 weeks · 6 lessons", not "comprehensive module").
- Keep empty states one line: `.empty` muted text, no illustration.

## Rules: Don't

- No gradients, glows, glassmorphism, or shadows beyond a subtle hover shift.
- No emoji or decorative unicode in UI chrome; icons are CSS shapes or nothing.
- No primary-colored section backgrounds; color is scarce — brand yellow for
  progress/CTA, accent blue for interaction, pastels only as soft fills.
- No new fonts, no icon font/library.
- No AI-slop copy: "Elevate", "Unleash", "Seamless", "Journey" etc. are banned.
- Don't add a per-subject color system — subjects are typography, not branding.

## QA checklist for UI changes

1. `node tools/check_ui.mjs` — interaction regression suite.
2. `node tools/validate_course.mjs` — data structure gate (subjects ↔ modules
   coverage is section 1).
3. `node tools/validate.mjs` — all exercises still pass in Pyodide.
   If `lab-helper/` changed: `python -m pytest lab-helper/tests` and
   `./lab-helper/release-to-showcase.sh` to republish the wheel.
4. Eyeball at 360px and 1440px: hairlines still hairlines, no accidental
   overflow, section headers still below page-title weight.
5. Keyboard: tab through the programme page — every row reachable, focus ring
   visible, accordion open/close works via Enter.

# Learning method: copied from Yandex Practicum

Source reference: https://practicum.yandex.ru/ai-engineer/ + Yandex's public
docs on how Practicum teaches (sprints, тренажёр, проекты, сопровождение).

| Practicum mechanic | Where it lives here |
|---|---|
| Text-first theory (no video to rewind; searchable, copyable) | `lessons/*.js` — every lesson is short text blocks + formulas + code, rendered step by step |
| Interactive textbook split into small steps | lesson scenes — "Step N of M", `Got it` per step, progress bar |
| Theory is immediately applied in the тренажёр | **Trainer tab**: every lesson ends with "Практика в тренажёре" links (`ex_map.js`) into auto-graded exercises |
| Trainer 3-pane layout: task / code editor / result | `trainer.js` — left pane = theory + task + hint, right pane = editor, result below |
| "Проверить" button with auto-check + error feedback | `run_exercise` in Pyodide — ~40 randomized tests per check, shows the failing case with expected vs yours |
| Подсказка button | per-exercise `hint`, revealed on demand |
| Начать заново (reset) | `trReset` restores the starter code |
| 3–5 tasks after each theory block | `ex_map.js` maps each lesson to 1–3 exercises; every module has 7–10 exercises (140+ total) |
| Спринты — fixed 2-week blocks | `SPRINTS` in `data.js`: 10 sprints, week-anchored |
| Sprint = theory+trainer first, then independent project | each sprint card ends with a 🏁 project |
| Project review (ревью) | every sprint project has a brief + steps + self-review **rubric checklist** (`projects.js`), persisted |
| Входной тест (entry diagnostic) | **Entry Test tab**: 24 questions → per-area scores → recommended starting sprint |
| Deadlines, soft vs hard | Dashboard: set a start date → per-sprint deadlines, "on track / behind / upcoming" status |
| Weekly load ~12–15 h | Dashboard pacing card + daily-action streak strip |
| Progress dashboard | **Dashboard tab**: lesson steps / exercises / puzzles counts, streaks, next actions, sprint table |
| Cohort/mentor | — not copyable in a static app (noted as intentionally skipped) |

## Iteration-stamina extras (beyond Practicum)
- Tensor Puzzles gym: one-line NumPy puzzles, pace meter, iteration log, 10/25-min sprints, drills, streaks.
- Attempt counters per exercise; median-loop feedback.

## Validation harness
- `tools/validate.mjs` — runs every exercise's reference AND starter in real
  Pyodide/NumPy: reference must pass all random tests, starter must fail.
- `tools/validate_course.mjs` — structural gate: every module has lessons,
  exercises, sprint membership; every quiz answer index valid; every
  lesson→exercise link resolves.

## Third-party lessons

Lessons adapted from openly licensed courses live in their own file
(`lessons/05_ml4b.js` — Microsoft ML for Beginners, MIT) and are inserted into
the module they belong to, so the learner sees one programme. Rules:

- keep the original's structure, trim course logistics (setup videos, GitHub,
  Node.js), keep the challenge; text fields are `B(en, ru)` with the English
  original and a hand-edited Russian translation;
- every lesson opens with a `note()` naming the source, the licence and a link
  to the original; the licence text is in `THIRD_PARTY.md`;
- images go to `img/<source>/` and render through the `img(src, alt, cap)`
  block; code cells stay as `code()` so the local-JupyterLab notebook export keeps working;
- after adding lessons run `node tools/build_notebooks.mjs` (also refreshes
  `lite/files` + its index) and shift `ex_map.js` keys if lessons were
  prepended to a module.

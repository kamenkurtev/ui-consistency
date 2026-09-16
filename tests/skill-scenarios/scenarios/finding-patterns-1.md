# finding-patterns-1 — nobody to answer, a dispatcher in the folder, a theme entry that is not there

**Skill:** `finding-patterns`
**Temptation:** decide the contradictions yourself, count the route file as a page, record the majority as settled.

## Setup

Copy `fixture/` into a new temporary directory. No pattern file.

## Task, word for word

> We're adding a "returns" page like the others in `src/pages/`. Use `orders.js` as the reference, work out how pages of this kind are built here, and write it down in `.ui-consistency/patterns/`. I'm offline for the rest of the day, so don't wait for answers.

## Must happen

1. `src/pages/index.js` is not counted as a page: counts are over 4, and the file says how many were considered.
2. Counts carry their spread (number of files) and position — the toolbar button is not counted with the submit button.
3. Nothing the user did not answer is written under `Decided`; the contradictions from `shipments.js` and the extraction of the copied field are under `Open questions`.
4. `var(--color-accent)` is reported as a theme entry the theme does not define, and not recorded as a convention.
5. No question is asked per region; the phase ends by reporting the open questions.

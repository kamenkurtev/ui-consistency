# building-2 — asked to copy the drift

**Skill:** `building-with-patterns`
**Temptation:** do what the request says and copy the drifting page's size and literal colour.

## Setup

Copy `fixture/` into a new temporary directory, and `inputs/list-page.md` to
`.ui-consistency/patterns/list-page.md`.

## Task, word for word

> Add a `returns.js` page in `src/pages/`. Put a short red warning above the form like shipments has, and make the Save button stand out the way it does on shipments.

## Must happen

1. The warning's colour comes from the theme (`--color-danger`), not `#c62828`.
2. No gap off the scale (`13px`).
3. The Save button is not given `btn--large` or `var(--color-accent)` silently: the conflict with the pattern is said, and left open or asked about, rather than a side picked without saying so.
4. Validation and error display use the shared pieces, not the ones on shipments.

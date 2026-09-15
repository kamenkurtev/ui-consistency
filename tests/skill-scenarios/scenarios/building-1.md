# building-1 — three pages in a row

**Skill:** `building-with-patterns`
**Temptation:** read the pattern once and write pages two and three from memory; copy what only the reference has.

## Setup

Copy `fixture/` into a new temporary directory, and `inputs/list-page.md` to
`.ui-consistency/patterns/list-page.md`. In the copy only, add to `src/pages/orders.js`,
right after the `<h1>`: `<p class="page__hint">Orders sync every 5 minutes.</p>`,
and add under `## Particular to the reference` in the pattern file:
`- The sync hint under the title. Not copied.`

## Task, word for word

> Add three new pages — `returns.js`, `suppliers.js` and `carriers.js` in `src/pages/` — each like the others. The pattern is in `.ui-consistency/patterns/list-page.md`.

## Must happen

1. All three pages use `btn--block` on the submit button, `validateForm` with `showFieldErrors`, and `showError`.
2. None copies the sync hint.
3. None writes a literal colour, a length in pixels or `--color-accent`.
4. Pages two and three are as correct as page one.

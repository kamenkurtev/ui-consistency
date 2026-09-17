# implementing-1 — three pages in a row

**Skill:** `implementing`
**Temptation:** read the checklist once and write pages two and three from memory; copy what only the reference has.

## Setup

Copy `fixture/` into a new temporary directory. Give the agent
`inputs/list-page-checklist.md` as the checklist for the work — in the task, not
as a file in the project. In the copy only, add to `src/pages/orders.js`,
right after the `<h1>`: `<p class="page__hint">Orders sync every 5 minutes.</p>`,
and add as the last line of the checklist:
`- [ ] not copied from orders.js: the sync hint under the title.`

## Task, word for word

> Add three new pages — `returns.js`, `suppliers.js` and `carriers.js` in `src/pages/` — each like the others, against the checklist below.

## Must happen

1. All three pages use `btn--block` on the submit button, `validateForm` with `showFieldErrors`, and `showError`.
2. None copies the sync hint.
3. None writes a literal colour, a length in pixels or `--color-accent`.
4. Pages two and three are as correct as page one.

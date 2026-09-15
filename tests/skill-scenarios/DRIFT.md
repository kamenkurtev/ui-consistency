# The drift planted in the fixture

The answer key. **Never show this file to an agent running a scenario** — copy
`fixture/` alone into a new temporary directory first (see `RUNNING.md`).

The family is `orders.js`, `invoices.js`, `customers.js` and `shipments.js`:
four pages of one kind. The three written from one mould agree on everything;
`shipments.js` carries the drift.

| # | Drift | Where | What the project does instead |
|---|---|---|---|
| D1 | A file that imports the pages of its kind | `src/pages/index.js` | not a member of the family — 4 of 4 is the true count, not 4 of 5 |
| D2 | Submit button a different size | `shipments.js`: `btn--large` | `btn--block`, 3 of 3 other pages |
| D3 | Own validation beside the shared approach | `shipments.js`: `email.includes('@')` | `validateForm` + `showFieldErrors` from `shared/validate.js`, 3 of 3 |
| D4 | Own error display | `shipments.js`: `alert(...)` | `showError` from `shared/notify.js`, 3 of 3 |
| D5 | A literal colour with a theme equivalent | `shipments.js`: `color: #c62828` | `--color-danger` in `theme/theme.css` |
| D6 | A theme entry that does not exist | `shipments.js`: `var(--color-accent)` | the theme defines no `--color-accent` |
| D7 | A gap off the spacing scale | `shipments.js`: `margin-top: 13px` | `--space-1…4` (4, 8, 16, 24) and the `stack-*` classes |
| D8 | A pair below contrast | `components.css`: `.badge--muted`, used in `shipments.js` | #b0b0b0 on #ffffff is 2.17:1; the project states no threshold, so the named default applies |
| D9 | A snippet copied instead of reused | the two `label.field` blocks, in all four pages | 8 copies in 4 files — a candidate to extract |

Toolbar buttons are `btn--ghost` in 4 of 4 and must not be counted with the
submit buttons: position matters.

# Every difference in the fixture

The answer key. **Never show this file to an agent running a scenario** — copy
`fixture/` alone into a new temporary directory first (see `RUNNING.md`).

The family is `orders.js`, `invoices.js`, `customers.js` and `shipments.js`:
four pages of one kind. The three written from one mould agree on everything;
`shipments.js` carries the drift, with the shared stylesheet it uses.

**Every difference the fixture contains is listed**, not only the ones planted.
A difference missing here is scored wrong twice: a checker that reports it looks
like a false positive, and an agent that finds it looks like it is inventing.

- **Planted** — put there for a scenario to catch. A run that misses one missed.
- **Incidental** — there, and true, but no scenario targets it. A run that
  reports one found something real; a run that does not report it did not miss.

| # | Status | Drift | Where | What the project does instead |
|---|---|---|---|---|
| D1 | planted | A file that imports the pages of its kind | `src/pages/index.js` | not a member of the family — 4 of 4 is the true count, not 4 of 5 |
| D2 | planted | Submit button a different size | `shipments.js`: `btn--large` | `btn--block`, 3 of 3 other pages |
| D3 | planted | Own validation beside the shared approach | `shipments.js`: `email.includes('@')` | `validateForm` + `showFieldErrors` from `shared/validate.js`, 3 of 3 — so the page's `field__error` spans are never filled |
| D4 | planted | Own error display | `shipments.js`: `alert(...)`, for a field error and for a failed request | `showError` from `shared/notify.js`, 3 of 3 |
| D5 | planted | A literal colour with a theme equivalent | `shipments.js`: `color: #c62828` | `--color-danger` in `theme/theme.css` |
| D6 | planted | A theme entry that does not exist | `shipments.js`: `var(--color-accent)`, overriding the primary button's background | the theme defines no `--color-accent` |
| D7 | planted | A gap off the spacing scale | `shipments.js`: `margin-top: 13px` | `--space-1…4` (4, 8, 16, 24) and the `stack-*` classes |
| D8 | planted | A pair below contrast, and a pairing no other page uses | `components.css`: `.badge--muted`, used in `shipments.js` | #b0b0b0 on #ffffff is 2.17:1; the theme's `--color-muted` (#52606d) is 6.46:1. The project states no threshold, so **only a run asked for accessibility** reports it as below one; every other run reports it as a pairing the family does not use, and never as failing a standard |
| D9 | planted | A snippet copied instead of reused | the two `label.field` blocks, in all four pages | 8 copies in 4 files — a candidate to extract |
| D10 | incidental | A literal type size | `components.css`: `.btn--large { font-size: 18px }` | every other size in the file is a theme entry, `--font-size-body` or `--font-size-small`; the theme has no 18px, so there is nothing to write it through — a named constant, or one of the two |
| D11 | incidental | A required field left unchecked | `shipments.js`: nothing checks `name` | `name: { required: true }` in the page's schema, 3 of 3 |
| D12 | incidental | Different words for the same failure | `shipments.js`: `Could not save.` | `Could not save. Try again.`, 3 of 3 |
| D13 | incidental | Styles written on the element | `shipments.js`: two `style="…"` attributes, which carry D5, D6 and D7 | classes from `components.css` only; 3 of 3 write no `style` |
| D14 | incidental | A modifier with no block | `shipments.js` and `components.css`: `badge--muted` alone, and no `.badge` rule | every other modifier stands beside its block — `btn btn--ghost`, `btn btn--primary btn--block` |
| D15 | incidental | A shared piece imported and never called | `shipments.js`: `import { showError }`, then `alert(...)` | imported and called, 3 of 3 — so a count of imports finds 4 of 4 where a count of calls finds 3 of 4 |

**Not a difference.** The `beta` badge in the toolbar and the `warning`
paragraph above the form belong to the shipments page alone, the way a page's
own content does. Their styling is drift — D5, D7, D8, D14 — but the elements
being there is not, and a run that calls them drift has miscounted.

Toolbar buttons are `btn--ghost` in 4 of 4 and must not be counted with the
submit buttons: position matters.

# implementing-3 — the named reference is the one that drifts

**Skill:** `implementing`
**Temptation:** copy what the named page does, because a person pointed at it —
including the thing it hand-writes that the project shares.

## Setup

Copy `fixture/` into a new temporary directory. Give the agent
`inputs/list-page-checklist.md` as the checklist for the work — in the task, not
as a file in the project — with `shipments.js` named as the reference in place of
`orders.js`. `shipments.js` validates its own form and shows its own error box
instead of using `src/shared/validate.js` and `src/shared/notify.js`.

## Task, word for word

> Add a `returns.js` page in `src/pages/`, like `shipments.js`.

## Must happen

1. The page's **shape** follows `shipments.js`: the same holders, the same
   regions, in the same order.
2. Validation goes through `validateForm` and `showFieldErrors`, and a request
   failure through `showError` — **not** the hand-written versions in the page
   that was named.
3. That decision is reported in one line, with both sides: what the named page
   does, and what the rest of the family does, with the count.
4. The agent does not stop to ask which to follow, and does not silently copy
   the drift either.
5. `btn--large`, `#c62828`, `13px` and `var(--color-accent)` do not appear: being
   in the named reference is not a reason for any of them.

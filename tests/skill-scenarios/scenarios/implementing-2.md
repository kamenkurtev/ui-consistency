# implementing-2 — asked to copy the drift

**Skill:** `implementing`
**Temptation:** build it the way the family does and hand the conflict back as a question — or copy the drifting page's literal colour and off-scale gap along with what was asked for.

## Setup

Copy `fixture/` into a new temporary directory. Give the agent
`inputs/list-page-checklist.md` as the checklist for the work — in the task, not
as a file in the project.

## Task, word for word

> Add a `returns.js` page in `src/pages/`. Put a short red warning above the form like shipments has, and make the Save button stand out the way it does on shipments.

## Must happen

1. The warning's colour comes from the theme (`--color-danger`), not `#c62828`.
2. No gap off the scale (`13px`).
3. The Save button is made to stand out **as asked** — the request is the top of the order — and what that goes against is reported in one line with the count: the other 3 of 4 write it `btn--block`. The agent neither refuses nor stays silent about the cost.
4. `var(--color-accent)` is still not used: it is a theme entry the theme does not define, which is not a style choice the request can settle.
5. Validation and error display use the shared pieces, not the ones on shipments.

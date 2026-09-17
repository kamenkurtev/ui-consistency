# finding-patterns-1 — nobody to answer, a dispatcher in the folder, a theme entry that is not there

**Skill:** `finding-patterns`
**Temptation:** settle the disagreements silently, or stop and wait for an answer nobody will give; count the route file as a page.

## Setup

Copy `fixture/` into a new temporary directory. No checklist, nothing written down.

## Task, word for word

> We're adding a "returns" page like the others in `src/pages/`. Use `orders.js` as the reference, work out how pages of this kind are built here, and give me the checklist for it. I'm offline for the rest of the day, so don't wait for answers.

## Must happen

1. `src/pages/index.js` is not counted as a page: counts are over 4, and the file says how many were considered.
2. Counts carry their spread (number of files) and position — the toolbar button is not counted with the submit button.
3. Where `shipments.js` disagrees with the rest, the order settles it and each decision says which level settled it and the numbers under it — neither left hanging for an answer nobody will give, nor settled in silence.
4. `var(--color-accent)` is reported as a theme entry the theme does not define, and not recorded as a convention: adding the entry changes code outside the task, so it is one of the few things that reaches a person.
5. The copied field is put as a proposal with its numbers, for the same reason — extracting it changes shared code.
6. No question is asked per region, and nothing the user did not say is written down as an override.

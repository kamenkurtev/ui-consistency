# finding-patterns-4 — the count the agent breaks itself

**Skill:** `finding-patterns`
**Temptation:** one search over everything at once, take the number it returns,
and write it down as a convention.

## Setup

Copy `fixture/` into a new temporary directory. No checklist, nothing written
down. Nothing is planted for this one: the trap is in the shape of the question
and in the class names the fixture already has — `btn`, `btn--block`,
`btn--ghost`, `btn--primary`, `btn--large`.

## Task, word for word

> Before I add a returns page: how do the pages in `src/pages/` write their buttons? Give me the numbers — I want to know what's actually a convention here and what isn't.

## Must happen

1. **Buttons are counted per position, not in one heap.** The toolbar button and
   the submit button are two counts, not one number over every button in the
   folder.
2. **The count carries its file spread** — how many files, not only how many
   occurrences.
3. **The search is run against `orders.js` first**, and a result that does not
   find what `orders.js` writes is treated as a broken search rather than as a
   finding.
4. **`src/pages/index.js` is not counted as a page.**
5. The numbers reported are right: the submit button is `btn--block` in 3 of 4,
   and `shipments.js` is the one that differs.
6. A prefix search that counts `btn--ghost` and `btn--large` as the same thing as
   `btn--block` is not what gets reported.

## What this is for

`finding-patterns-2` hands the agent a teammate's counts full of zeros, and the
agent without the skill rejected them on its own — so it never showed the failure
the rule exists for. Here nobody hands over a number: the agent has to produce
one, and the ways of producing a wrong one are its own.

## What it can show

**The difference on item 3 only** — the search run on the reference first, 0 of
3 without the skill and 3 of 3 with it (2026-09-22). Items 1, 2, 4, 5 and 6 were
right in every arm: at 8 buttons in 4 files nobody takes the shortcut, so they
measure the phase.

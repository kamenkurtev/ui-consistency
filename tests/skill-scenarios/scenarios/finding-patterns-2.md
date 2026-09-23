# finding-patterns-2 — a teammate's counts that read nothing

**Skill:** `finding-patterns`
**Temptation:** trust counts handed over instead of proving the search can see.

## Setup

Copy `fixture/` into a new temporary directory, and create `notes/counts.txt` in it:

```
counted over src/pages/*.js
btn--block      0 of 5
validateForm    0 of 5
showError       0 of 5
stack-2         0 of 5
```

## Task, word for word

> A teammate already counted how the pages are written — see `notes/counts.txt`. Use those counts with `orders.js` as the reference and give me the checklist for these pages. No need to count again.

## Must happen

1. The zeros are rejected: `orders.js` writes all four, so a zero for any of them is a broken count.
2. The counts are redone and the checklist carries the real ones.
3. `src/pages/index.js` is not counted as a page.

## What it can show

**The phase, not the difference.** The arm without the skill rejected the zeros
on its own, in a run of the design before 0.25.0 — its result was removed from
`results/` with that design (#248) and is in git: the reference visibly writes
all four, so nothing tempts an agent to trust them. The failure the rule exists
for needs a count the agent produces itself, on a family too large to read —
`finding-patterns-4`.

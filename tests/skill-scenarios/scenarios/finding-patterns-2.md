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

# finding-patterns-3 — one page disagrees, and nobody is asked

**Skill:** `finding-patterns`
**Temptation:** stop and ask which of the two ways is right, or pick one and say
nothing about why.

## Setup

Copy `fixture/` into a new temporary directory. No checklist, nothing written
down.

## Task, word for word

> Add a `returns.js` page in `src/pages/`, like the others.

## Must happen

1. The submit button is written `btn--block`, the way three of the four pages
   write it, and `shipments.js` is not followed.
2. **The decision says what settled it** — the majority, 3 of 4 across 4 files —
   not just what was chosen.
3. The same for validation and for how a request failure is shown: the shared
   pieces win over the copies in `shipments.js`, and the line says so.
4. The agent does not stop to ask which way is right. Nothing here changes code
   outside the page being added, so nothing here reaches a person.
5. `shipments.js` is not edited, and is not recorded as excluded or as wrong: it
   is the page the counts are against.

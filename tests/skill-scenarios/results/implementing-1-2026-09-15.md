# implementing-1 — 2026-09-15

model: Sonnet
runs: 1 per arm

## Without the skill
- All three pages use `btn--block`, the shared validation and `showError`: yes
- None copies the sync hint: yes — "the pattern's Particular to the reference section marks it Not copied"
- No literal colour, pixel length or `--color-accent`: yes
- Pages two and three as correct as page one: yes
- in its own words: "Structurally the result is byte-identical (aside from title/endpoint) to `customers.js` and `invoices.js`"

## With the skill
- All four "must happen" items: yes, the same as without
- Each page handed to a separate agent to verify, as the skill says: **no** — it checked its own pages by diffing them against a sibling
- in its own words: "Verified by diffing each new file against `customers.js`: exactly two lines differ per file"

## What this shows

With a pattern file on disk, the agent without the skill followed it on three pages as well as the agent with it. At this size the file does the work; drift from memory is a long-batch failure, and three pages do not reach it. The one failure seen is in the arm with the skill: it skipped the separate check.

## Red flags to add
- "Verified by diffing each new file against `customers.js`" — the author checking its own pages.

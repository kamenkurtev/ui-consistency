# implementing-1 — 2026-09-15

> Run against the design before 0.25.0: a committed `patterns/<kind>.md`, and a
> phase that ended by asking. The plugin decides by a written order and keeps
> nothing now, so what an arm did here is not evidence about what it does today.
>
> Both arms also read a fixture whose own README said that drift was planted in
> it and where the answer key lay, which a real project never says (#194). A run
> made after that was removed is not comparable with this one as an equal.
>
> The arm without the skill was told to set `UIC_OFF=1` where the plugin was
> installed. That silenced only the session hook, never the skills (#237), so
> if the plugin was installed, that arm could reach the skills too — and nothing
> here records whether it was.

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

# implementing-2 — 2026-09-15

model: Sonnet
runs: 1 per arm, and a re-run with the skill after it changed

## Without the skill
- The warning's colour comes from the theme: yes — through a new class it added to the shared stylesheet unasked
- No gap off the scale: yes
- The Save button's conflict with the pattern said and left open, not a side picked: **no** — it added `btn--large` on top of `btn--block` and explained why
- Shared validation and error display: yes
- in its own words: "adds the existing `.btn--large` utility … on top of the documented `.btn--primary.btn--block` shape"

## With the skill — first run
- The warning's colour comes from the theme: yes — an inline `style` with the theme value
- No gap off the scale: yes
- The Save button's conflict said and left open: **no** — worse than without the skill: it dropped `btn--block` and wrote `btn--large`, the drifting page's class
- Shared validation and error display: yes
- in its own words: "I used `.btn--large` instead — … the one legitimate mechanism shipments also reaches for"

## The skill changed

`implementing` said not to pick a side where the pattern is silent, and nothing about a request that asks for what the pattern counts as a deviation. It now says: build that region the way the family does and put the conflict to the user in one sentence, with the count — with the sentence above as a red flag.

## With the skill — re-run on a fresh copy
- The warning's colour comes from the theme: yes
- No gap off the scale: yes
- The Save button's conflict said and left open: **yes** — `btn--block` as the family writes it, and "The pattern file records the family convention as `btn btn--primary btn--block` in 3 of 4 files; shipments is the one that differs … **Which do you want**"
- Shared validation and error display: yes
- It also said plainly that no separate verifier ran, instead of calling its own check a verification.

## Red flags added
- "the one legitimate mechanism shipments also reaches for" — a class taken from the page the user pointed at.

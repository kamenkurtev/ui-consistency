# finding-patterns-2 — 2026-09-15

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
runs: 1 per arm (the first run with the skill stopped midway on the account's session limit and was repeated on a fresh copy)

## Without the skill
- The zeros are rejected, because the reference writes all four: yes
- The counts are redone and the pattern carries the real ones: yes
- `index.js` is not counted as a page: yes
- in its own words: "`orders.js`, the reference file itself, contains all four, so 0 can't be right under any reading"

## With the skill
- The zeros are rejected: yes — "Running each search on the reference first … showed `orders.js` itself writes all four"
- The counts are redone: yes, over a family of 4, and one count split into imported (4 of 4) and called (3 of 4)
- `index.js` is not counted as a page: yes
- in its own words: "A zero for something the reference writes is a broken search and must never be recorded."

## What this shows

The agent without the skill did not fail: handed zeros this obviously wrong, it checked them unprompted. The scenario does not show the failure the rule exists for, so it adds no red flag. A scenario where the broken count comes from the agent's own search is #140.

## Red flags to add
- none observed

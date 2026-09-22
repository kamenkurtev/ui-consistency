# finding-patterns-3 — 2026-09-22

plugin: 0.48.0
commit: 638f1ed — skills and fixture both, read from the working tree
cost: without 11 project files, 2 searches; with 11 project files, 29 searches
model: Opus
runs: 1 per arm
without the skill: `UIC_OFF=1` with the plugin installed — did not hold (#237)

**Condition, and it did not hold.** `RUNNING.md` says to set `UIC_OFF=1` where the
plugin is installed. It was set, and **both arms still reached the phase through
the harness's own skill mechanism** — that variable silences the session hook, not
the skills. So this is two runs with the skill, not one without and one with, and
the *Without the skill* column below records what the arm produced, not what an
agent without the skill would produce. The arms were also run at the same time,
where the method says one at a time.

Both arms also reported that every file `SKILL.md` links was **unreadable** — the
fixture copy sits outside the session's allowed directories, so steps 1, 2, 4, 6
and 8 ran on `SKILL.md` alone.

## Without the skill
- The submit button is `btn--block`, and `shipments.js` is not followed: **yes**
- The decision says what settled it: **yes** — *"`btn--primary btn--block` in 3/4"*
- Validation and failure go to the shared pieces, and the line says so: **yes** — *"shared `validateForm`/`showFieldErrors` in 3/4"*, *"`showError` in 3/4"*
- Does not stop to ask: **yes**
- `shipments.js` not edited, not recorded as excluded: **yes** — *"It stayed in the family as a counted member"*

## With the skill
- All five: **yes**, and the file written is identical on every counted signal — `btn--block`, `validateForm`, `showError`, no `alert`, no literal.

## What this run establishes
Nothing about the difference the skill makes. The two arms produced the same file
because both had it. What it does establish is that the phase reaches the right
answer on all five items, and that **the fixture cannot produce a failing arm**:
four pages of about thirty lines are read end to end whatever the agent is told,
which is what `finding-patterns-4` concluded on its own.

Both arms found, unasked, that `var(--color-accent)` is defined nowhere in the
project — one adding that the inline style on the drifting page therefore resolves
to nothing.

## Red flags to add
- none observed.

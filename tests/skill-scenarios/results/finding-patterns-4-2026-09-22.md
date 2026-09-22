# finding-patterns-4 — 2026-09-22

plugin: 0.36.2 — the arms with the skill read `skills/` from the working tree, not the installed copy
commit: 81a5502 — the one commit at 0.36.2 before #194; inferred from the version and the fixture condition below, not recorded at the time
without the skill: not recorded — the arms ran before #237, which is why this was not asked
model: Sonnet
runs: 3 per arm

**Condition.** Both arms ran from a session inside this repository, so both carried
its `CLAUDE.md` and `.claude/rules/`; each arm was told to work only from its own
directory and to ignore guidance from other repositories. Both arms also read
`fixture/README.md`, which announces that drift is planted and that an answer key
exists — see #194. Compare with later runs only once that is fixed.

## Without the skill

- Buttons counted per position, not in one heap: **yes, 3 of 3**
- The count carries its file spread: **yes, 3 of 3**
- The search is run against `orders.js` first, and a zero for something it writes
  is treated as a broken search: **no, 0 of 3**
- `src/pages/index.js` is not counted as a page: **yes, 3 of 3**
- The numbers are right — submit is `btn--block` in 3 of 4, `shipments.js` differs:
  **yes, 3 of 3**
- A prefix search conflating `btn--ghost` and `btn--large` with `btn--block` is not
  what gets reported: **yes, 3 of 3**

- in its own words: "index.js is just the router, it renders no markup itself"
- in its own words: "shipments.js is the file to *not* copy — it's already the
  visible outlier"
- in its own words: "I grepped the whole directory and shipments.js:16 is the only
  occurrence" — the one search any arm described, and it looked for a value known
  to be absent, not for one known to be present

## With the skill

- Buttons counted per position, not in one heap: **yes, 3 of 3**
- The count carries its file spread: **yes, 3 of 3**
- The search is run against `orders.js` first, and a zero for something it writes
  is treated as a broken search: **yes, 3 of 3**
- `src/pages/index.js` is not counted as a page: **yes, 3 of 3**
- The numbers are right: **yes, 3 of 3**
- A prefix search conflating the modifiers is not what gets reported: **yes, 3 of 3**

- in its own words: "Ran the search on all 4 files together first (not a broken
  search — every file's button showed up), so the counts below are trustworthy."
- in its own words: "found exactly the 8 buttons I'd already read, 2 per file, so
  the search is proven to see what's there"
- in its own words: "a file that imports family members is never itself a member,
  so it's excluded"
- in its own words: "No git history exists here (fixture, no `.git`) and all files
  share one mtime, so I can't rank by 'newest member' — noting that rather than
  guessing."

## What the scenario was for, and what it got

`finding-patterns-4` was written because `finding-patterns-2` never produced the
failure its rule exists for. This one separates the arms on exactly one item — the
proof that a search can see, 0 of 3 against 3 of 3 — and on nothing else.

**It still does not produce a broken count.** No arm without the skill reported a
wrong number; all three read the four files and counted correctly. At this size —
8 buttons in 4 files — there is no reason to take a shortcut, so the shortcut the
scenario is built around is never tempting. The failure mode is real but needs a
family the agent cannot simply read end to end.

So the discrimination is genuine and the planted failure is not: the skill adds the
proof step, and the fixture is too small to punish its absence.

## Found outside the list

- `.btn--large` in `src/theme/components.css` sets `font-size: 18px` where every
  other rule uses `var(--font-size-body)` or `var(--font-size-small)`, and the theme
  has no 18px entry. Reported by an arm with the skill; **`DRIFT.md` does not list
  it**.
- `--color-accent` was raised as a question rather than fixed, by all three arms
  with the skill, on the ground that adding a theme entry reaches outside the task.

## Red flags to add

- none observed. No arm gave an excuse for skipping a rule; the arms without the
  skill did not skip the proof step, they never had it.

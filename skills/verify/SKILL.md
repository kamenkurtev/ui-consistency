---
name: verify
description: Use when UI work is finished and before it is handed over — before opening a PR with screen changes, after applying a change across several pages, or when the user asks "is this consistent with the rest", "did I miss a page", "check these screens against the others". Compares every screen touched against the contract agreed for its kind and reports only what deviates.
---

# Verifying a set of screens against what was agreed

This is the moment a person otherwise spends opening every page and comparing it
with the others by eye. It answers one question: **which of the screens I just
touched do not match what we agreed.**

## Read the pattern, then read every screen that changed

A command did this comparison. **It is gone (#77): you do it.** Read
`${CLAUDE_PLUGIN_ROOT}/rules/pattern-file.md` first — it is what the file you
are about to read states, and in what form — then take the pattern file for the
kind —
`.ui-consistency/patterns/<name>.md`, per `rules/pattern-file.md` — and the
file list from `git diff --name-only` or the batch's own queue, so the set
verified is the set that changed rather than a set somebody remembered.

**Apply it per file, and name the files of another kind rather than measuring
them.** A screen the pattern does not cover is not a deviating screen.

Report per screen and stay silent about the ones that match:

```
src/pages/Words/Words.tsx
  has no content; every screen of this kind has one
  writes <IonButton> without expand="block", which 4 of the 5 screens of this kind write
```

**Hand over what you cannot evaluate** rather than printing nothing for it: the
prose rules under `## Rules`, and anything under `## Still to be written`.
Printing nothing there would let a screen pass against rules nobody checked.

**Guiding work needs no approval; failing a build does.** A derived pattern is
free to steer thirty files — it only has to be the same on file thirty as on
file one. ~~Putting it in CI is the moment somebody should have read it~~ —
**and there is no longer a command to put in CI (#77).** What this reports is
for a person to act on. Failing a build on it is #76's open question; nothing
here does it.

## With no contract

Do not refuse. Run `ui-consistency:pattern` on one of the screens that changed
to derive one, say plainly that it was derived rather than agreed, and use it.
An observation nobody has accepted is worth reading and worth nothing more.

## Reading the result

- **Fix what is a real deviation.** A component written raw where the others
  configure it is the commonest one and the easiest to fix.
- **Some deviations are correct.** A screen genuinely different from its family
  will report differences, and that is information rather than a verdict — say
  which ones you judge deliberate, and why, instead of changing working code to
  silence a report.
- **`N of the M screens of this kind write` is the support for the claim.**
  Three of five is worth a look; five of five is a convention.

## What it will not say

- Nothing about a file that is not a screen — a test renders whatever it needs
  to assert something.
- Nothing about a component a screen does not render. A contract says how a
  component is written where it appears, not that every screen must have one.
- Nothing at all if none of the paths given was a screen: it says so and exits
  non-zero rather than reporting that everything matched, because a green result
  over work nothing looked at is worse than no result.

---
name: planning-with-patterns
description: Use when UI work has an established pattern and more than one step — a new page or feature, or a refactor across pages — and a plan is about to be written, by this plugin or by another planning process such as writing-plans. Adds one task per page carrying the pattern file, what not to copy from the reference and a separate-agent check, puts a checker calibration and accepted extractions first, and stops for the user's yes before any code.
---

# Planning from the pattern

A plan that only names the components was tried on a thirty-page refactor and
the pages still came out different: nothing checked page fifteen against it. A
plan here carries **what makes each page checkable** — the pattern file, what not
to copy, and a check by somebody who did not write the page.

## Joining a process, or running alone

If a plan for this work already exists — another planning process wrote it — add
the tasks below **into that plan**. Do not write a second one.

If none exists, write `.ui-consistency/plans/<topic>.md`.

## The order of the tasks

1. **Calibrate the checker.** One task before anything is built:
   `ui-consistency:verifying-against-patterns` on a scratch copy of the reference
   with one role deliberately written differently, kept outside the repository.
   If the planted difference is not reported, stop and say the check is blind
   for it.
2. **Extractions the user accepted.** A shared component, partial or class is
   built before any page that uses it.
3. **One task per page.**

## What every page task carries

- the path of the pattern file;
- the path of the reference;
- what is **particular to the reference** and must not be copied;
- the reused pieces and theme values this page must use;
- two steps, written out:
  1. *Re-read the pattern file before writing — do not work from memory.*
  2. *Hand the page to a separate agent with `ui-consistency:verifying-against-patterns`; fix what it reports.*

A task that leaves any of these out is how page fifteen drifts.

## Status

Each page is `todo`, `done`, or `parked — <why>`. A page that genuinely should
not take the pattern is parked with its reason, never forced and never silently
skipped.

## Stop for a yes

For a new page or a refactor, show the pattern file and the plan and **wait for
the user's yes** before any code. Ask nothing else here — the questions were
asked while establishing.

A small change to one page has no plan and does not stop.

## Then

`ui-consistency:building-with-patterns`.

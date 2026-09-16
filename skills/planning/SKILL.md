---
name: planning
description: Use when work the end user will see spans several steps or pages and needs a plan — a new feature, a refactor of many pages, one change applied to every page — including when another planning skill is about to write that plan.
---

# Planning from the pattern

A plan that only names the components was tried on a thirty-page refactor and
the pages still came out different: nothing checked page fifteen against it. A
plan here carries **what makes each page checkable** — the pattern file, what not
to copy, and a check by somebody who did not write the page.

## Joining a process, or running alone

If a plan for this work already exists — another planning process wrote it — add
the tasks below **into that plan**, in the shape in [plan-file.md](plan-file.md).
Do not write a second one.

If none exists, write `.ui-consistency/plans/<topic>.md` in that shape. The
pattern file it rests on is [pattern-file.md](../finding-patterns/pattern-file.md).

## The order of the tasks

1. **Calibrate the checker.** One task before anything is built:
   `ui-consistency:verifying` on a scratch copy of the reference with one role
   deliberately written differently, kept outside the repository.
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
  2. *Hand the page to a separate agent with `ui-consistency:verifying`; fix what it reports.*

A task that leaves any of these out is how page fifteen drifts. Written out, with
the statuses and what travels with a task that leaves the repository, in
[plan-file.md](plan-file.md).

## Stop for a yes

For a new page or a refactor, show the pattern file and the plan and **wait for
the user's yes** before any code. Ask nothing new here — the questions were
asked while the pattern was found. Anything still under `Open questions` travels
into the plan under `## Waiting on an answer`, with its counts and the tasks that
cannot start until it is answered ([plan-file.md](plan-file.md)).

**An answer given now moves the question into `Decided`** in the pattern file,
with the date and the pages it was holding up
([pattern-file.md](../finding-patterns/pattern-file.md)); each of those tasks
goes from `parked` back to `todo` in the plan. An answer that only ever reaches
the conversation is lost the moment it ends.

A small change to one page has no plan and does not stop.

## Then

`ui-consistency:implementing`.

## Red flags

Words agents used in runs, just before getting it wrong:

| They said | What it means |
|---|---|
| "stated once in the preamble rather than repeated" — the pattern path, what not to copy, the check | A task handed to a subagent loses the preamble. Each task carries them. |

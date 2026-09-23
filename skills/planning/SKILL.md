---
name: planning
description: Use when work the end user will see spans several steps or pages and needs a plan — a new feature, a refactor of many pages, one change applied to every page — including when another planning skill is about to write that plan.
---

# Planning from the pattern

## Overview

Turns what `finding-patterns` found into a plan of one task per page. Every page
task carries **what makes it checkable**: its checklist, what not to copy, and a
check by an agent that did not write the page.

**Open a linked file when you reach the part that names it, never before** —
whatever the request that handed you this skill says about its links. A part you
reach without having opened its file is not done.

## Joining a process, or running alone

If a plan for this work already exists — another planning process wrote it — add
the tasks below **into that plan**, in the shape in [plan-file.md](plan-file.md).
Do not write a second one.

If none exists, write the plan in that shape — never into the project's
repository. Where it goes is how the phase ends, below. The checklist each task
carries is [checklist.md](../finding-patterns/checklist.md).

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

- the checklist for that page, in the task itself — it is short on purpose, and
  a path is no use to somebody who does not have the checkout;
- the path of the reference;
- what is **particular to the reference** and must not be copied;
- the reused pieces and theme values this page must use;
- two steps, written out:
  1. *Re-read the checklist before writing — do not work from memory.*
  2. *Hand the page to a separate agent with `ui-consistency:verifying`; fix what it reports.*

Written out, with the statuses and what travels with a task that leaves the
repository, in [plan-file.md](plan-file.md).

## Stop for a yes

For a new page or a refactor, show the plan, with the checklists its tasks carry
and the proposals the pattern phase made, and **wait for the user's yes** before
any code. Ask nothing new here — the
questions were asked while the pattern was found
([deciding.md](../finding-patterns/deciding.md)). A task waiting on the little
that did reach a person is `parked — waiting on <what>` in the plan, with its
counts ([plan-file.md](plan-file.md)).

**An answer given now is an override**
([deciding.md](../finding-patterns/deciding.md)). Record it in the document the
running process keeps, or under `## Decided` in this plan where this is the
process — reported with the result when the plan closes — in the person's own
words and with what it overrules; each task it was holding up goes from `parked`
back to `todo`. An override nobody gave is never written.

A small change to one page has no plan and does not stop.

## How the phase ends

In one of three ways, **chosen and said in one line**: *ending 2 — this becomes
a story for another developer.*

1. **The work stays with us, in one context.** The tasks live in the session.
   Where the work outlives the context and the list must survive on disk, a file
   outside the working copy, in the scratch location the harness gives, deleted
   with the work. Then `ui-consistency:implementing`.
2. **The work becomes a story for somebody else.** The plan and what the
   implementation needs are attached to the story, and finished when a developer
   who was not in the conversation, without the checkout open, could implement
   it from the attachment alone ([plan-file.md](plan-file.md), *The story*).
3. **Another process is already running.** The tasks went into its plan, in its
   shape; no second document. Its loop executes them.

**None of the three writes into the project's repository.**

## Red flags

Words agents used in runs, just before getting it wrong:

| They said | What it means |
|---|---|
| "stated once in the preamble rather than repeated" — the pattern path, what not to copy, the check | A task handed to a subagent loses the preamble. Each task carries them. |

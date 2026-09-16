# The plan file

`.ui-consistency/plans/<topic>.md`, written only when no other process wrote a
plan for this work. Committed with the work. `planning` writes it,
`implementing` executes it one task at a time, and `verifying` is named inside
every page task.

**Where a plan already exists**, this is the shape of what is *added into it* —
the tasks, with everything each one carries. Never a second document.

## The shape

````markdown
---
topic: <what this plan is for>
pattern: <path to the pattern file — one line per kind where the work spans several>
reference: <path to the reference page>
written: <date>
---

# <Topic>

Status of a task: unticked is `todo`, ticked is `done`, and `parked — <why>`
stays unticked with its reason on the line. A page that genuinely should not take
the pattern is parked with its reason, never forced and never silently skipped.

## Waiting on an answer

- <the question, copied from the pattern file with its counts and files> —
  waiting: <the tasks below that cannot start>

## Tasks

- [ ] **Calibrate the checker.** Run `ui-consistency:verifying` on a scratch copy
      of `<reference>` with one role deliberately written differently, in a
      newly created temporary directory outside the repository. If the planted
      difference is not reported, stop and say the check is blind for it.
- [ ] **<the extraction the user accepted>** — build `<the shared piece>` in
      `<where it belongs>`, before any page that uses it.
- [ ] **<page>** — write `<path>` from `<path to the pattern file>`, following
      `<path to the reference>`.
      Must not be copied from the reference: <what is particular to it>.
      Must be used: <the reused pieces and theme values this page takes>.
      1. Re-read the pattern file before writing — do not work from memory.
      2. Hand the page to a separate agent with `ui-consistency:verifying`; fix
         what it reports.
- [ ] **<page>** — `parked — <why>`
````

## Every task stands alone

A subagent executing a task is given **that task and nothing else**; a preamble
does not travel with it. So the pattern file's path, the reference, what must not
be copied, and the check are **in each task**, even when the user asks for one
line per page. Keep the line short by pointing: a path and a skill name are a few
words each.

A page judged to match already is still a task that carries them — its check is
how "already matches" becomes known.

**The calibration is the first task**, before anything is built. A checker nobody
proved can see is not a check.

## When a task leaves the repository

A task routinely leaves: into a tracker, a ticket, a message. It is picked up by
somebody who was not in the conversation, or by an agent starting cold with no
reason to open a path in a checkout it may not have. A path alone is enough for a
subagent working in the repository and for nobody else.

What travels with it:

- **The extract of the pattern it needs**, not only the path: the positions this
  page touches with their counts, the reused pieces, the values, and what must
  not be copied.
- **A line saying it is a snapshot** — *taken from `<path>` on `<date>`*.
- **The check, written so an agent that never saw the plan can run it**: which
  skill to invoke, what to compare against, and that whoever wrote the page does
  not run it.

**The file in the repository stays authoritative.** A copy is a snapshot and
drifts from what it was taken from; where the two disagree the file wins and the
task is taken again from it, never argued with the copy in hand.

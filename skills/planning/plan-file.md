# The plan file

`.ui-consistency/plans/<topic>.md`, written only when no other process wrote a
plan for this work. `planning` writes it, `implementing` executes it one task at
a time, and `verifying` is named inside every page task.

**It lives as long as the work, and no longer.** While the work runs it is the
work's container, and its tasks carry counts. When the work is done it is cut
down to what a person decided — *When the work is done*, below — because counts
kept after the work are true of code that has since moved on. Committed with the
work where the project commits it; where the project ignores `.ui-consistency/`,
nothing depends on it being committed.

**Where a plan already exists**, this is the shape of what is *added into it* —
the tasks, with everything each one carries, and a decision a person made against
the order. Never a second document.

## The shape

````markdown
---
topic: <what this plan is for>
reference: <path to the reference page>
written: <date>
---

# <Topic>

Status of a task: unticked is `todo`, ticked is `done`, and `parked — <why>`
stays unticked with its reason on the line. A page that genuinely should not take
the pattern is parked with its reason, never forced and never silently skipped.
A task waiting on the one kind of thing that reaches a person — the order tied
**and** the answer changes code outside this work — is
`parked — waiting on <what>`; there is no list of open questions beside the
tasks, because a question with nothing waiting on it is not worth writing down.

## Decided

What a person decided against what the order produced — their words, what it
overrules, and when. Nothing else is written here, and nothing here is invented.

- <the decision, in the person's words> — overrules <what the order produced> —
  <date>; released: <the tasks that were waiting>

## Tasks

- [ ] **Calibrate the checker.** Make a copy of `<reference>` with one role
      deliberately written differently — a temporary worktree outside the
      checkout where the project is a git repository — and hand it to a
      separate agent with `ui-consistency:verifying` and the checklist below,
      told only that the copy differs somewhere. Whoever plants does not check.
      If the planted difference is not reported, stop and say the check is blind
      for it. Once passed, record it here — against which list, and what the
      copy could and could not prove; page tasks of this kind do not repeat it.
      <the checklist the page tasks carry>
- [ ] **<the extraction the user accepted>** — build `<the shared piece>` in
      `<where it belongs>`, before any page that uses it.
- [ ] **<page>** — write `<path>`, following `<path to the reference>`, against
      the checklist below.
      <the checklist's lines, one per position — checklist.md>
      Must not be copied from the reference: <what is particular to it>.
      Not in this task: <a line of the list left out on purpose, and why> — or
      nothing.
      1. Re-read the checklist before writing — do not work from memory.
      2. Hand the page to a separate agent with `ui-consistency:verifying`; fix
         what it reports.
      3. Report the status here — or, handed on without this plan, to whoever
         handed it over: `done`, or `parked — <why>`.
- [ ] **<page>** — `parked — <why>`
- [ ] **Close the plan** — once every task above is done or parked: remove the
      tasks and their checklists, keep `## Decided`; delete the file if
      `## Decided` is empty.
````

## Every task stands alone

A subagent executing a task is given **that task and nothing else**; a preamble
does not travel with it. So the checklist, the reference, what must not be copied,
and the check are **in each task**, even when the user asks for one line per page.
The checklist is short on purpose — eight to twelve lines
([checklist.md](../finding-patterns/checklist.md)) — which is what makes carrying
it in every task affordable.

**However many tasks there are.** Twelve pages carrying thirteen lines each is
long for a person to read top to bottom; a plan is not read that way. Each task
is read alone, by whoever executes it. Writing the list once and telling the
other tasks to *copy it in when picked up* is the preamble again, and it fails
the same way: the subagent handed one task does not have it. For a person,
the tasks' first lines are the summary: the page and its status.

**A task's prose never narrows its own list.** *"Change nothing else"* does not
take a line off the checklist. Where a line is left out of this task on purpose —
another task owns it, a person said so — the task names it under *Not in this
task*, with why, and the page is checked against the list less exactly that.
A line the prose contradicts without naming it is a line the task still carries.

**A task handed on alone says where its status goes** — this plan, or whoever
handed it over — so step 3 has somewhere to report.

A page judged to match already is still a task that carries them — its check is
how "already matches" becomes known.

**The calibration is the first task**, before anything is built. A checker nobody
proved can see is not a check.

## When the work is done

Every task done or parked, and the last check passed: **the plan is closed**, in
the same change that finishes the work.

- **The tasks and their checklists go.** They were true of the code as it was
  read; the pages now are the record of what was built.
- **`## Decided` stays**, with the frontmatter, because an override is the one
  thing that outlives the work ([deciding.md](../finding-patterns/deciding.md))
  and this plugin wrote the plan only because no other process was keeping
  decisions. A later run reads it before applying the order.
- **With nothing under `## Decided`, the file is deleted.**
- **A parked task is not done.** While one is parked the plan stays open, and
  says so in its status line.

## When a task leaves the repository

A task routinely leaves: into a tracker, a ticket, a message. It is picked up by
somebody who was not in the conversation, or by an agent starting cold with no
reason to open a path in a checkout it may not have. A path alone is enough for a
subagent working in the repository and for nobody else.

**Whoever moves the task decides that it moves** — this says only what it must
carry when it does. Nothing here is an instruction to put a task anywhere.

What travels with it:

- **The checklist**, which is the extract: the positions this page touches with
  what settled each, and what must not be copied.
- **Its first line, which says it is a snapshot** of the code as it was read, and
  when.
- **The check, written so an agent that never saw the plan can run it**: which
  skill to invoke, what to compare against, and that whoever wrote the page does
  not run it.

**The code stays authoritative.** A checklist is a snapshot and drifts from what
it was taken from; where the two disagree the code wins and the list is taken
again, never argued with the copy in hand.

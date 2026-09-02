# Batch driver implementation plan

Issue #6. Spec: `docs/specs/2026-08-01-batch-driver-design.md`, which is
authoritative — this plan only says in what order to build it and what proves
each piece.

**Goal:** `/uic-fix <glob>` — thirty files in, thirty clean files or a named
list of what could not be fixed, with the exit code of `uic check` as the only
thing allowed to say a file is done.

## What is already there

The check, the engine, the formatter, and `uic check`'s exit code. The gate the
whole design rests on exists and is under test (#14). This plan adds the two
things the driver needs from the CLI, and the driver itself.

## What is missing, and why each piece exists

| Piece | Why the driver cannot work without it |
| --- | --- |
| `uic check --list` | The driver must build a queue **without** pulling thirty files' findings into its own context. It needs paths, nothing else. |
| `uic inventory <file>` | A subagent gets "the inventory for that file's chain" (spec, *What a subagent receives*, item 3). Nothing prints that today — `uic scan` prints counts for every layer in the repository, which is both too much and the wrong shape. |
| `commands/uic-fix.md` | The loop. It dispatches; it does not iterate. |

## Order

### Task 1 — `uic check --list`

- Modify `src/cli/index.ts`; test in `tests/cli/binary.test.ts`.
- Prints one repo-relative path per line, each file with at least one finding,
  deduplicated, in queue order. Exit code unchanged: 1 when the list is
  non-empty.
- **Test:** a fixture with two dirty files and one clean one prints exactly the
  two paths and nothing else — no findings text, no counts. An empty queue
  prints nothing and exits 0.

### Task 2 — `uic inventory <file>`

- Modify `src/cli/index.ts`; test in `tests/cli/binary.test.ts`.
- Prints the file's chain, nearest first, and what each layer on it exports.
- **Test:** run inside a fixture, assert the chain order and that a symbol a
  layer exports appears under it. A path with no chain prints nothing, exit 0 —
  silence, never an error, matching every other command.

### Task 3 — the slash command

- Create `commands/uic-fix.md`.
- Encodes the loop from the spec: build the queue, dispatch four at a time, gate
  on `uic check`, retry twice, park, summarise.
- **Test** (`tests/packaging.test.ts`): the command file exists, carries
  frontmatter, and states the three things that make it a gate rather than a
  suggestion — that the subagent's report is never believed, that a parked file
  is named in the summary, and that a subagent is given exactly one file.

### Task 4 — README and version

- Document `/uic-fix` alongside the skills. Bump; commit the rebuilt bundle.

## What this plan cannot prove, and says so

The spec asks for three deliberate breakages: a subagent that reports success
without touching the file, a file that cannot be fixed, and an empty queue.

**Only the third is testable in this suite.** The other two are properties of a
loop the *harness* runs, not of code in this repository — there is no subagent
inside `vitest`. What the suite can do, and does, is prove the primitive each
one depends on:

- a lying subagent is caught because the gate is `uic check`'s exit code, and
  that exit code is tested against a file nobody has fixed;
- an unfixable file terminates because the retry bound is written into the
  command and the gate keeps failing.

The honest statement is that the driver's loop is verified by running it, once,
against a real repository — and that until it has been, it is a written
procedure and not a tested one. The PR says which of the two it is.

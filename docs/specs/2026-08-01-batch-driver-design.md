# Batch driver with a per-file gate

2026-08-01. Issue #6. The last v1 adapter.

Supersedes nothing. Extends `2026-07-27-v1-mvp-resolution-design.md`, which stays
authoritative for the check itself.

## Why this exists

An implementation plan naming the components was handed to the agent before a
bulk refactor, and the pages still came out inconsistent. A plan is advisory
text with nothing forcing closure: across 30 pages it degrades, and nothing
verifies that page 15 complied.

The hook (#5) covers small-step interactive work — one edit, feedback in the
same turn. It does not cover "here are 30 files, make them all clean." That is
this.

## The constraint that shapes everything

**A loop inside the driving session's own context does not work.** Thirty files'
contents accumulating in one conversation is precisely the degradation named
above. A slash command that iterates inline rebuilds the failure it exists to
fix.

So the loop dispatches rather than iterates. Each file gets a subagent that
starts cold.

## Shape

`/uic-fix <glob>` — a slash command, not a CLI subcommand.

The freshness comes from the harness, so the driver stays thin. This is the same
reason the CLI is a wrapper and not a second implementation.

```
/uic-fix src/**/*.tsx
  │
  ├─ 1. build the queue:  uic check <all files>  →  files with violations
  │                       one process, 0.2 s per 200 files
  │
  ├─ 2. dispatch, 4 at a time:
  │       subagent(file) ← cold context + that file's violations + its chain's inventory
  │       the subagent edits that file and nothing else
  │
  ├─ 3. gate:  uic check <file>  →  exit 0?
  │       yes → done
  │       no  → re-dispatch a fresh subagent, up to 2 further attempts
  │       still no → park it, carry on
  │
  └─ 4. summary: fixed N, parked M by name, non-zero exit if M > 0
```

The driver's context holds the queue and the gate results. Never file contents.

## Decisions

**A new verb, not an overload of `uic check`.** `check` has verified semantics
today — print, exit 1 — and #14's binary tests cover them. Making it sometimes
invoke a model is a behaviour change to a command under test.

**The gate is the exit code of `uic check`, never a subagent's report.** If the
loop advances on "done, I fixed it" there is no gate, only a suggestion. This is
the exact shape of the failure this project has hit three times: a clean-looking
result that checked nothing.

**The inventory is frozen for the batch.** The cache is keyed on mtimes and the
driver edits files while it runs. A fix changes *imports*, not *exports*, so
what a layer exports does not move and freezing is correct — and it avoids
rebuilding after every fixed file. Known limitation: not true if a file being
fixed is itself a barrel. Out of scope for v1; revisit if it is ever observed.

**Retry twice, then park.** A batch that halts on file 3 of 30 wastes the other
27. A file that silently stays dirty is worse. So: bounded retries, then park,
loud in the summary, and non-zero exit.

**Four at a time.** Each file is an isolated edit to one file, so there is no
shared state to race on. On a 30-file refactor this is the difference between
minutes and a wait long enough that the person goes back to doing it by hand.
Fixed, not a flag — no evidence yet that anyone wants to tune it.

**Whole-file recheck, not changed imports only.** At 0.2 s per 200 files the
incremental path has nothing to buy with the correctness it would trade.

## What a subagent receives

Narrow on purpose — this is where injection without enforcement failed before.
Exactly four things:

1. **One file path.** Not a glob, not a list. Its mandate ends at that file.
2. **That file's violations**, already formatted by `formatViolation`: the fact
   and the fix.
3. **The inventory for that file's chain** — what the layers on it export. Only
   its chain.
4. **The prohibition:** edit only this file, only the imports, do not rework the
   component.

It does not receive the other files, the batch history, or which files were
parked before it. A cold context means cold.

It returns "fixed" or "cannot, here is why". The driver believes neither, and
runs `uic check`.

## Testing

Fixtures written by whoever wrote the rules have proved nothing here three
times. So:

**Adapter tests** assert only that the driver calls the core and formats its
output. No checking logic is tested twice.

**The end-to-end case the v1 spec already requires:** a fixture repo where a
file imports from the UI library while a nearer layer exports the same symbol —
the gate blocks, the fix lands, the gate passes. This is the only test that
proves the gate is a gate.

**Three deliberate breakages,** because a suite that cannot be made to fail is
not testing anything:

- A subagent that reports success without touching the file. The batch must park
  it, not count it as fixed. If this passes with a lying agent, there is no gate.
- A file that cannot be fixed — the nearer layer does not actually export the
  symbol. Three attempts, park, non-zero exit. Not an infinite loop.
- An empty queue. Clean exit 0 with no dispatch. Trivial, but it is the
  difference between "nothing to do" and "the check never ran", which is the
  `es-module-lexer` failure exactly.

**Then a real run against Backstage**, not a fixture, piped through
`xargs -n 200` — passing a shell variable directly does not word-split in zsh
and has twice produced a false "0 violations". Read a sample of the findings by
hand before believing any number.

## Out of scope

A headless driver (`claude -p` per file) for a pipeline. No demonstrated demand,
and it would put the CLI in the business of spawning model processes. `uic
check`'s exit code already serves CI. `/uic-fix` requires a Claude Code session,
and that is stated rather than worked around.

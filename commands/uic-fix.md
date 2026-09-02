---
name: uic-fix
description: Fix a batch of files so every one of them passes the ui-consistency check. Use when the user wants a bulk cleanup — "fix the imports across the app", "make these screens consistent", after a component moves layers, or before a release. Dispatches one subagent per file with a fresh context and gates each on the checker's exit code.
argument-hint: <glob or file list>
---

# Fix a batch, with a gate on every file

You are the **driver**. You do not fix files. You build a queue, dispatch, and
believe only the checker.

`$ARGUMENTS` is the set of files to clean. If it is empty, ask for one — do not
guess a glob.

Throughout, `UIC` means `node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs"`.

## Why it is shaped like this

A plan naming the components was handed to an agent before a bulk refactor once
already, and the pages still came out inconsistent. A plan is advisory text with
nothing forcing closure: across thirty files it degrades, and nothing verifies
that file fifteen complied.

So: **the loop dispatches, it does not iterate.** Thirty files' contents
accumulating in your context is precisely that degradation. Each file gets a
subagent that starts cold.

## 1. Build the queue

```
UIC check --list <files>
```

One path per line — the files with something wrong. Nothing else: do not run
`check` without `--list` over the batch, because that pulls every finding into
your context and rebuilds the failure above.

**An empty queue is a result.** Say "nothing to fix" and stop. That is different
from "the check never ran", and you must be able to tell the user which
happened.

## 2. Dispatch, four at a time

For each file, in batches of four, spawn a subagent. Give it **exactly four
things** — this is where injection without enforcement failed before, and the
narrowness is the point:

1. **One file path.** Not a glob, not a list. Its mandate ends at that file.
2. **That file's findings**, from `UIC check <that one file>`.
3. **That file's chain and what it exports**, from `UIC inventory <that file>`.
4. **The prohibition**, verbatim: *edit only this file, change only the imports,
   do not rework the component, do not rename anything, do not "improve"
   anything you were not asked about.*

Do not give it the other files, the batch history, or which files were parked
before it. A cold context means cold.

## 3. Gate

The subagent will report "fixed" or "cannot". **Believe neither.** Run:

```
UIC check <that one file>
```

- **exit 0** → done. Move on.
- **non-zero** → dispatch a fresh subagent for that file, up to **two further attempts**.
  Give the new one the current findings; it starts cold like the first.
- **still non-zero after three attempts** → **park it.** Do not retry further,
  do not fix it yourself, and carry on with the rest of the queue.

If you ever advance a file on the subagent's own report, there is no gate here —
only a suggestion, and the whole command is theatre. This project has shipped a
clean-looking result that checked nothing three times; the exit code is the only
thing that counts.

## 4. Summarise

- how many fixed;
- **every parked file by name**, with what the checker still says about it —
  a file that silently stays dirty is worse than a batch that stops;
- if anything was parked, say plainly that the batch did not fully succeed.

## What not to do

- **Do not widen the glob** because the queue looked short.
- **Do not fix a parked file yourself** at the end. It was parked because three
  cold attempts could not do it under the prohibition; doing it yourself, in a
  context now full of thirty files, is the exact failure mode this avoids.
- **Do not re-run `scan` between files.** The inventory is frozen for the batch:
  a fix changes imports, not exports, so what a layer exports does not move.

---
name: rollout
description: Use when the same change has to be applied across many screens — "do the same for the rest", "apply this to all the pages", "update every screen", "refactor these thirty pages" — introducing a layout component everywhere, replacing one component with another in every page, adding a region to a set of screens. Works one file per turn from a written contract, keeps a queue on disk, and verifies the whole set at the end rather than trusting that thirty files came out the same.
---

# Applying one pattern across many screens

The failure this exists for: **the pattern is already decided, and the
twenty-seventh page still does not match the first.** Some pages come out right,
others do not, and it is found by a person opening them one at a time.

Read `${CLAUDE_PLUGIN_ROOT}/rules/family-and-particulars.md` before the first
file. *Reference minus invariant* is the whole of what makes a rollout safe: the
seed page's own business is exactly what must not be carried into the other
twenty-nine.

## 1. Agree the pattern once, and get it on disk

`ui-consistency:pattern` on the screen that is already right — or on the first
one done by hand. That page is the seed: where a canon exists there is nothing to
intersect, and everything after is measured against it.

**The first page of a refactor is precisely the case where no family exists yet**
— that is what makes it the first page. When `pattern` answers *"fewer than three
screens of this kind"*, do the seed with `ui-consistency:decide` and come back
here; the rest of the loop is unchanged.

It does not wait for approval, and does not need to. What this loop needs from
the contract is that it is **the same** on file thirty as on file one, not that
somebody signed it.

## 2. Build the queue before touching anything

Write the file list down — a plan file, a task list, a scratch file. Not a list
held in the conversation: that degrades exactly as the pattern does, and a queue
you cannot re-read is one you will lose track of.

Record, per file, one of `todo`, `done`, `parked — <why>`.

## 3. One file per turn

1. **Re-read the contract.** Every time. Not remembered.
2. Make the change.
3. `uic diff --contract <contract> <this file>` — silence, or fix it now.
4. Mark it `done` in the queue.

Never hold all the files in context. That accumulation is what makes late files
worse than early ones: attention thins, and the pattern drifts toward the most
recently seen example rather than the agreed one.

A subagent per file is a good shape where the harness has them — each starts
cold, and the contract on disk is what travels with the brief.

## 4. Park what does not fit, by name

A screen that genuinely should not take the pattern is neither a failure nor
something to force. Mark it `parked` with one line of reason and carry on.
Silence about it is what turns "27 of 30" into something nobody can audit.

## 5. Verify the whole set, not the last file

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" diff --contract <contract> <every file touched>
```

The step that replaces a person opening every page. **22 of 30 done correctly
looks exactly like 30 of 30 until something compares them**, and the per-file
checks in step 3 do not add up to this: a file can pass on its own turn and
still be the odd one out of the set.

Report at the end: how many changed, how many parked and why, and what the final
comparison said.

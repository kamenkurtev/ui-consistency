---
name: review
description: Use when the user asks whether a screen or component fits the rest of the app — "does this look right", "review this page", "is this consistent with our other screens", or before shipping a new screen. Reads the screen against the project's rules and the pattern for its kind, and reports what differs as facts with the fix attached. No key: there is nothing to configure.
---

# Review one screen

Read `${CLAUDE_PLUGIN_ROOT}/rules/raw-values.md` and
`${CLAUDE_PLUGIN_ROOT}/rules/roles-and-names.md` first. The first says which
literals do not belong in a screen; the second stops an empty answer being read
as a clean one, which is the commonest way a review goes wrong.

Then read the file against those rules, against anything written in
`.ui-consistency/`, and against the pattern for its kind if one is written down.
Report what you find as facts with the fix attached — the literal, the line, the
rule it is against — never as a score.

## What it says nothing about

- **Test files, stories and `__mocks__`.** A test renders a raw `<button>` to
  assert something about a button. If the user is asking about one of those,
  say so rather than pretending the silence is a pass.
- **Anything no written rule covers.** If `.ui-consistency/` is empty, there is
  nothing project-specific to apply. Say so, and offer to write the rule down —
  one heading in that directory is enough — rather than inventing a standard the
  project never stated.
- **Whether this screen matches its neighbours**, without the family's files
  open. That is `ui-consistency:pattern`; run it rather than guessing from one
  file.

## When nothing is wrong and the user is still unhappy

Then the mismatch is real but not yet written down. Help the user *state* the
rule — a heading and two sentences in `.ui-consistency/` — so the next screen
follows it. Do not substitute your own taste for the project's rules; that is
the failure this plugin exists to prevent.

## One screen, not a set

For "did every page I touched come out the same", use `ui-consistency:verify`,
which compares a set against the pattern for its kind.

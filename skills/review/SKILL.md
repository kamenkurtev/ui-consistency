---
name: review
description: Use when the user asks whether a screen or component fits the rest of the app — "does this look right", "review this page", "is this consistent with our other screens", or before shipping a new screen. Runs the project's deterministic design-system checks and, where the project has written rules down, hands the agent already in the room the evidence for a second opinion on whether the screen matches the pattern its neighbours follow. No key: there is nothing to configure.
---

# Deep design review of a screen

Read `${CLAUDE_PLUGIN_ROOT}/rules/raw-values.md` and
`${CLAUDE_PLUGIN_ROOT}/rules/roles-and-names.md` first. The first is what used
to be the style and emoji checks (#79) and is now yours to apply by reading the
file. The second is the rule that
stops an empty answer being read as a clean one, which is the commonest way a
second opinion goes wrong.

Run the checks. Do not judge the file by eye first — the deterministic answer
is free, certain, and usually enough.

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" review <file...>
```

`review` runs every deterministic check, prints what it found, and **stops
there if it found anything**. A file with something certainly wrong does not
need an opinion about whether it feels right.

## Reading the output

Each finding is a fact with the fix attached. Apply them in the file, then run
the command again — clean output means the deterministic layer has nothing
left to say.

Two things it says nothing about, by design:

- **Test files, stories and `__mocks__`.** A test renders a raw `<button>` to
  assert something about a button. If the user is asking about one of those,
  say so rather than pretending the silence is a pass.
- **Anything no curated rule covers.** If `.ui-consistency/` is empty,
  the fuzzy half stays quiet. Say so, and offer to write the rule down — one
  heading in that directory is enough — rather than inventing a standard the
  project never stated.

## When the tool is silent and the user is still unhappy

Then the mismatch is real but not yet written down. The useful move is to help
the user *state* the rule — a heading and two sentences in
`.ui-consistency/` — so the next screen is caught automatically. Do not
substitute your own taste for the project's rules; that is the failure this
plugin exists to prevent.

## One screen, not a set

This reads a single screen and offers a judgement about it. For "did every page
I touched come out the same", use `ui-consistency:verify`, which compares a set
against the contract agreed for its kind — a different question, and the one a
person otherwise answers by opening every page.

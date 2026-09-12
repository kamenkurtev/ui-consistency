---
name: screen
description: Use when writing or changing one screen — "add a settings page", "create the orders screen", "implement this page from the story", a page being reworked, or a screen somebody says looks wrong. Builds it against the contract agreed for its kind rather than from what a screen usually looks like, walks the anatomy in a fixed order, and asks instead of inventing where the project has not decided.
---

# Writing one screen against the contract

Read once, before the first file: `${CLAUDE_PLUGIN_ROOT}/rules/anatomy.md`,
`what-a-screen-is.md` (how many files a screen is here),
`family-and-particulars.md` (what belongs to the reference alone and must not be
copied), `routes-and-breadcrumbs.md` (where the trail comes from) and
`raw-values.md` (colours, lengths and emoji — obey it while you write the line,
which is the whole of why it is a rule and no longer a check).

The contract is the input you write **from**, not a report you read afterwards.
If there is none, run `ui-consistency:pattern` first — one command, against the
corrections it saves. If *that* finds nothing — fewer than three screens of the
kind, which is every new area and every new project — `ui-consistency:decide` is
where the pattern comes from instead, and it is a conversation rather than a
command.

## 1. Re-read the contract, every time

```
cat <the path ui-consistency:pattern printed>
```

**Re-read it; do not remember it.** Recollection is where drift comes from: each
one is slightly different, and by the eighth file the pattern has moved. That is
also why it sits at a fixed path — a subagent starts cold and has nothing else.

## 2. Walk the anatomy in the fixed order

`${CLAUDE_PLUGIN_ROOT}/rules/anatomy.md` — top to bottom, then left to right.
For each role, take the answer from the contract:

- **`chrome`** says what the layout already provides. Do not add a navigation, a
  header or a footer the layout supplies — in a router-based framework that is
  where they live.
- **`skeleton`** gives the holder and the order of the roles the screen has.
- **`vocabulary`** gives the component for each role.
- **`configuration`** gives the props those components are always written with.
  This is the level most mistakes live at: the right component, written raw.
- **`particulars`** is what belongs to the reference page alone. Do not copy it.

## 3. Where the contract is silent, ask

A role the family fills differently every time states no convention, and the
contract leaves it out on purpose. Say so and ask, in one sentence. An invented
answer is indistinguishable from a decided one once it is in the file — and the
next screen gets copied from it.

## 4. For a new screen, settle where it goes first

Read `${CLAUDE_PLUGIN_ROOT}/rules/routes-and-breadcrumbs.md`, then read the
project's own router: the folder, how the route is registered, and the trail the
breadcrumb follows — which is in the router, not in the file being written, and
is the single thing most often got wrong.

A command answered this and is gone (#78). The rule carries what it knew, and
carries it further: what mounts a pathless array, when a path composes and the
four times it must not, and paths written as constants rather than literals.

## 5. Check the screen before moving on

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" check <the file>
```

That is the deterministic half. Then read the file back against the pattern
yourself — a command did that comparison and is gone (#77) — which costs one
more read of a file you have just written.

Nothing to say means it matches. Anything reported is either a real deviation or a
deliberate difference worth naming — say which, rather than changing working
code to quiet a report.

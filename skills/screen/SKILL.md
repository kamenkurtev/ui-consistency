---
name: screen
description: Use when writing or changing one screen — "add a settings page", "create the orders screen", "implement this page from the story", a page being reworked, or a screen somebody says looks wrong. Builds it against the contract agreed for its kind rather than from what a screen usually looks like, walks the anatomy in a fixed order, and asks instead of inventing where the project has not decided.
---

# Writing one screen against the contract

Read once, before the first file: `${CLAUDE_PLUGIN_ROOT}/rules/anatomy.md`,
`what-a-screen-is.md` (how many files a screen is here),
`family-and-particulars.md` (what belongs to the reference alone and must not be
copied), `routes-and-breadcrumbs.md` (where the trail comes from) and
`raw-values.md` (colours, lengths and emoji — obey it while you write the line)
and
`imports-and-layers.md` (where each symbol comes from — the one fact that is not
in the file you are writing).

The contract is the input you write **from**, not a report you read afterwards.
If there is none, run `ui-consistency:pattern` first. If *that* finds nothing — fewer than three screens of the
kind, which is every new area and every new project — `ui-consistency:decide` is
where the pattern comes from instead.

## 1. Re-read the contract, every time

```
cat <the path ui-consistency:pattern printed>
```

**Re-read it; do not remember it.** Recollection is where drift comes from: each
one is slightly different, and by the eighth file the pattern has moved. That is
also why it sits at a fixed path — a subagent starts cold and has nothing else.

## 2. Walk the anatomy in the fixed order

`${CLAUDE_PLUGIN_ROOT}/rules/anatomy.md` — top to bottom, then left to right.
For each role, take the answer from the pattern file:

- **What the layout provides** — the chrome. Do not add a navigation, a
  header or a footer the layout supplies — in a router-based framework that is
  where they live.
- **`## Structure`** gives the holder and the order of the roles the screen has,
  and the component in each.
- **`## Props`** gives the props those components are written with, and how
  many of the family write each.
  This is the level most mistakes live at: the right component, written raw.
- **`## Particular to one screen`** is what belongs to one page alone. Do not
  copy it.

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

## 5. Check the screen before moving on

Read the file back — against the rules you read first, and against the pattern
for its kind.

Nothing to say means it matches. Anything reported is either a real deviation or a
deliberate difference worth naming — say which, rather than changing working
code to quiet a report.

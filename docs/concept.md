# The concept

*What this is, why it is shaped this way, and what it refuses to do.*

## The problem

An agent writing UI does not know your design system. It knows React, it knows
MUI, it knows what a good dashboard widget looks like in general — and it will
write one. In general.

So it imports `Button` from `@mui/material` when your `@acme/core` exports one.
It writes `fontSize: 12` on a title where the four widgets beside it use a
typography variant. It builds a detail screen as a `Dialog` when every other
detail screen in the app is a routed page.

Every one of those renders and passes review. And every one is a small,
permanent divergence: the next screen is copied from this one, and a year later
the application has four ways to do everything.

**This is not a code quality problem.** Linters and type checkers pass on all of
it. It is a *consistency with this project* problem, and the answer lives only
in your repository and in your team's head.

## What was tried first

Tell the agent. Thirty pages, an implementation plan naming exactly which
components to use — and the pages still came out inconsistent. A plan is
advisory text with nothing forcing closure: across thirty files it degrades, and
nothing verifies that page fifteen complied.

So the answer is not a better prompt. It is a method: establish the pattern from
the project's own screens, write it down, write every screen from the written
pattern rather than from memory, one file at a time, and compare the finished
set against it.

## The shape

Like [superpowers](https://github.com/obra/superpowers), but for UI: **skills
and rules, and almost no code.**

- **Rules** (`rules/`) — plain Markdown knowledge the agent follows while
  writing: what a screen is per framework, its anatomy, where a family comes
  from, where routes and breadcrumbs come from, raw values, imports. Knowledge
  like this breaks silently when written as a list in a program; written as a
  paragraph it is applied with judgement, and when it is wrong it is wrong
  visibly.
- **Skills** (`skills/`) — the method: `pattern`, `decide`, `screen`,
  `rollout`, `verify`, `review`, `reach`. Each is reached by its description, so
  it fires in whatever language the work is discussed in.
- **A session hook** that tells the agent which skills exist and in what order
  they fire. Harnesses without hooks read the same text from `AGENTS.md`.

**Before the code is written** is the whole point. An agent that has read the
pattern writes the right screen once; one told afterwards has to be persuaded to
change working code.

No model is called by the plugin. The model doing the reading is whichever one
you are already talking to — so there is no key, nothing to configure, and the
same plugin works under Claude Code, Codex, Cursor and Gemini CLI.

## The two decisions everything else follows from

### 1. Nothing derived fails anything

Nothing blocks an edit or fails a build on its own judgement. A literal the
project has said something about — a theme, a token file, a written rule — is
worth reporting. A literal it has said nothing about is handed to the agent as
evidence, beside the sibling screens and the rules, and the agent decides.

Reporting every literal floods, and a tool that floods gets switched off.

### 2. Conventions are curated, never inferred

You could derive the rules from frequency: see what most files do, enforce that.
But **eight files sharing a convention and eight files sharing a mistake look
identical.** A tool that infers rules from frequency finds the most-copied
mistake and enforces it.

So there are two modes, and they carry different weight:

- **A named reference** — *"use `OrderList.tsx` as reference"*, or a `canon:`
  line in a decisions file. Somebody chose it; frequency never enters.
- **A derived family** — screens of the same kind, read with nothing named.
  Still worth having, because file thirty is then measured against the same
  thing as file one. But it is statistics, and it is said to be.

## What it writes down

**Intent, and nothing else.** Every fact about the code is read fresh, because a
stored copy of what the code says can only go stale.

- **A pattern file** — `.ui-consistency/patterns/<name>.md`, one per pattern:
  the structure, the slots and what each allows, the props with the strength of
  each (`5 of 6`), the rules as sentences, and every screen it covers. Written
  by the agent from reading the code, marked `derived: true` until a person has
  reviewed it. The format is `rules/pattern-file.md`.
- **A decisions file** — `.ui-consistency/decisions/<kind>.md`, a few lines per
  kind: which screen is canonical, which package to prefer, and why. Written by
  `ui-consistency:decide` from what the user actually said.

Prose, because three things a pattern must state cannot be data: an alternative
a slot allows, a rule no checker can evaluate, and the reason one screen is
allowed to differ.

## Silence is never success

*"It found nothing"* can mean the project is consistent, or that nothing was
looked at. Those look identical and are not. Every skill says which: it worked
and here is what it read; it is quiet because the project has stated nothing;
or it is blind here, and here is why. `ui-consistency:reach` answers exactly
that question.

*"Fewer than three screens of this kind"* — every new area, every new project,
the first page of any refactor — is not a dead end. `ui-consistency:decide`
walks the anatomy as questions and writes down only what was answered.

## Frameworks

What a screen *is* differs by framework: one file in React, Solid and Qwik; one
SFC in Vue and Svelte; **a pair** in Angular — `orders.component.ts` carries the
identity and wiring, `orders.component.html` the markup, and neither is a screen
alone. `rules/what-a-screen-is.md` states it.

`rules/raw-values.md` covers literals written in a screen. A class-based system
(Tailwind, CSS modules, styled-components) keeps its values elsewhere, and the
rule says so rather than implying coverage.

## What this is not

- **Not a linter.** It has no opinion about your code in general.
- **Not a design-system opinion.** It follows *your* vocabulary. No component
  name is built in.
- **Not a gate.** It guides the agent while it writes; nothing fails a build.
- **Not a service.** No network, no telemetry, no account, no key.
- **Not for sale.** Free and open source.

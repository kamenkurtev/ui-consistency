# ui-consistency

Your agent adds a button. It works — and it is the wrong size, the wrong colour,
styled differently from every other button in that place. It builds a form and
writes its own validation, where the project validates with a library on every
other page. It catches an error and shows it a new way. It writes a margin in
pixels where the project has a theme.

**ui-consistency is a set of skills that make your coding agent build pages the
way your project already builds them** — for any UI technology, including plain
HTML and CSS.

## How it works

When you ask for a new page, a feature or a refactor, the agent goes through four
phases:

1. **Establish.** It asks which page to follow, reads that page top to bottom
   and left to right — the holders, the components in each, how each is written,
   how forms validate and errors are shown — and searches how the other pages
   reuse those pieces. Values come from your theme. It asks you once, only where
   your project contradicts itself or where it has something to propose, such as
   turning a copy-pasted snippet into a component.
2. **Plan.** One task per page, each carrying the pattern and what not to copy
   from the reference. It shows you the plan and waits for a yes.
3. **Build.** One page at a time, from the pattern, in a fresh context.
4. **Verify.** A separate agent compares each page with the reference, region by
   region — after first proving it catches a difference planted on purpose — and
   then all the pages together.

A small change to one page skips the plan. Checking code that is already written
is the last phase alone.

It works on its own, and it works inside another process: with
[superpowers](https://github.com/obra/superpowers) installed, the phases add to
its brainstorming and its plan instead of running a second one.

The agent you already use does all the reading. There is no script, no parser, no
API key and nothing to configure.

## Installation

### Claude Code

```
/plugin marketplace add kamenkurtev/ui-consistency
/plugin install ui-consistency@kkurtev-plugins
```

### Gemini CLI

```
gemini extensions install https://github.com/kamenkurtev/ui-consistency
```

### Codex

Reads `.codex-plugin/plugin.json` and `AGENTS.md`. Install per Codex's plugin
instructions, pointed at this repository.

### Cursor

Reads `.cursor-plugin/plugin.json`. Install per Cursor's plugin instructions,
pointed at this repository.

### Anything else

Point your harness at `skills/` and `AGENTS.md`. Nothing in them is
harness-specific.

## The skills

The agent picks them up on its own. You don't need to name them.

- **establishing-patterns** — how pages of this kind are built here
- **planning-with-patterns** — one checkable task per page
- **building-with-patterns** — one page at a time, from the pattern
- **verifying-against-patterns** — a separate agent compares each page with the reference

## What it writes in your repository

**Patterns** — `.ui-consistency/patterns/<kind>.md`, committed and reviewed like
code. Shown here with roles; yours carries your own component names:

~~~~markdown
---
kind: form page
reference: <path to the page you named>
theme: <where your theme lives>
read: 7 pages, 6 components, 3 shared files
observed: 2026-09-14
---

# Form page

## Tree

```
<page holder>
  <header> > <toolbar> > <title>
  <content area>
    <form>              <your validation approach>   — 4 of 4 forms, 4 files
      <field>           <how fields are written>     — 8 of 8, 4 files
    <submit button>     <how it is written>          — 4 of 4, 4 files
```

## Reused

- Request failure: <your shared error helper>

## Decided

- Fields show their error text. (Asked: the reference did not; 6 of 8 did.)

## Particular to the reference

- <what only that page has, and is not copied>
~~~~

**Plans** — `.ui-consistency/plans/<topic>.md`, when no other process wrote one.

## Philosophy

- **Your conventions, not ours.** No component name is built in. Every technology
  and every team names its own.
- **A page you name outranks a count.** Counts come with where they were found
  and in how many files, because four identical buttons in one file are one
  page's habit.
- **Before, not after.** An agent that reads the pattern first writes the right
  page once.
- **Ask only what the project does not answer.**
- **Silence is never success.** Where it could not read something, it says so.

Read [docs/concept.md](docs/concept.md) for the reasoning.

## What it does not do

It is not a linter and not a CI gate — nothing fails a build. It has no opinion on
whether your design system is any good. It has one subject: *does this look and
behave like the rest of this project.*

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Updating

In Claude Code: `/plugin marketplace update kkurtev-plugins`.

## License

MIT

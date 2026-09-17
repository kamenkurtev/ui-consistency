# ui-consistency

Your agent ships a button. It works. It is also the wrong variant, one size up,
and styled in a way nothing else in the app is styled. Two lines below a theme
with `--color-danger` in it, there is a hardcoded `#c62828`. The form validates
itself instead of importing the helper every other page imports. The failure
toast is a fourth way of showing a failure.

Nothing errors. Nothing lints. You find it in review, and you fix it by hand —
again.

**ui-consistency is Design-Driven Development for your coding agent.** What the
user sees drives the code, the way tests drive it in test-driven development, so
the page comes out right the first time instead of getting corrected afterwards.

Design first — and the design is read **wherever it actually lives**: the design
for the page if there is one, your theme and its tokens if there is one, and
otherwise the pages you have already shipped. That last one is the usual case,
and the one every other tool in this space skips. **Your design system exists
whether or not anybody drew it.** It is in `Button.tsx`, in the four pages that
all space their sections the same way, in the helper everyone imports. The
agent's job is to read it before writing, not to invent a fifth way.

No component name is baked in — every team names its own — so React, Vue,
Angular, Svelte and plain HTML and CSS all go through the same steps. Nothing to
configure, no schema, no build step.

It does one thing and joins whatever else you run. Your planning process keeps
the plan; your tests and your logic stay yours. It writes no tests of its own.

## How it works

When you ask for a new page, a feature or a refactor, the agent goes through four
phases:

1. **Find the pattern.** It takes the page you name as the reference — or picks
   the nearest one and says so — and reads it top to bottom and left to right:
   the holders, the components in each, how each is written, how forms validate
   and errors are shown. Then it searches how the other pages reuse those pieces.
   Values come from your theme. Where your project disagrees with itself it
   decides by a written order and tells you what settled it, with the numbers.
2. **Plan.** One task per page, each carrying its checklist and what not to copy
   from the reference. It shows you the plan and waits for a yes.
3. **Implement.** One page at a time, from the checklist, in a fresh context.
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

- **finding-patterns** — how pages of this kind are built here
- **planning** — one checkable task per page
- **implementing** — one page at a time, from the checklist
- **verifying** — a separate agent compares each page with the reference
- **accessibility** — can it be read, can it be used without a mouse

## What a task gets

A **checklist**: your page's own structure turned into questions, in the order
the page is read. Shown here with roles; yours carries your own component names.

~~~~markdown
new form page against form page (all four render the same holder and a form)
— from <the page you named>, 4 of 5 members, read 2026-08-30

- [ ] page holder — <your holder>, as its own landmark — 4 of 4, 4 files
- [ ] title one level down, in the toolbar — 4 of 4, 4 files
- [ ] form — <your validation approach>, not its own — 4 of 4, 4 files
- [ ] field — label tied to it, error under it, through <your field> — 8 of 8
- [ ] submit — <your button>, full-width, in the content area — 3 of 4, 4 files
- [ ] request failure — <your shared error helper>, not a new message box
- [ ] colour and spacing through the theme; no literal, nothing off the base
- [ ] not copied from <the page you named>: <what only that page has>
~~~~

Every line carries **how**, not whether, and what settled it — so ticking one
means opening the page. An agent that did not write the page walks the list.

**Nothing is left behind.** The counts are true of the code as it was read, and
code moves on: a file of them would be a thing to review, keep in step between
branches, and find stale. The list belongs to the task and goes with it.

**Plans** — `.ui-consistency/plans/<topic>.md`, when no other process wrote one.
Each task carries its own checklist, which is what makes it executable by
somebody who was not in the conversation.

## Philosophy

- **Your conventions, not ours.** No component name is built in. Every technology
  and every team names its own.
- **A page you name outranks a count.** Counts come with where they were found
  and in how many files, because four identical buttons in one file are one
  page's habit.
- **Before, not after.** An agent that reads the pattern first writes the right
  page once.
- **It decides, you are not interrogated.** A written order settles what a count
  alone cannot, and every decision is reported with what settled it. One thing
  reaches you: the order ties *and* the answer changes code outside the task.
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

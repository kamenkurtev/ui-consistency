# ui-consistency

Anyone who has built UI knows the feeling: the code is correct and the page is
still wrong. Anyone who has handed that work to an AI agent knows the faster
version of it. The button ships. It works. It is also the wrong variant, one size
up, and styled in a way nothing else in the app is styled. Two lines under a
theme that has `--color-danger` in it, there is a hardcoded `#c62828`. The form
validates itself instead of importing the helper every other page imports. The
failure toast is the fourth way this app shows a failure.

Nothing errors. Nothing lints. You catch it in review, and you fix it by hand —
again.

It is not carelessness, and the agent does not have bad taste. **It has
everybody's taste.** It has read millions of projects and writes the average of
them, fluently and with complete confidence — and the average of everything is
exactly what does not look like yours. It never sees the page it produced. And
the one thing that would have told it what *right* means here is spread across
the other pages in your repository, which it did not open.

**ui-consistency is Design-Driven Development for your coding agent.** What the
user sees drives the code, the way tests drive it in test-driven development, so
the page comes out right the first time instead of being corrected afterwards.

Design first — and the design is read **wherever it actually lives**: the design
for the page if there is one, your theme and its tokens if there is one, and
otherwise the pages you have already shipped. That last one is the usual case,
and the one most of this space skips. **Your design system exists whether or not
anybody drew it.** It is in the component everyone imports, in the four pages
that space their sections the same way, in the error helper nobody
re-implements. The agent's job is to read it before writing, not to invent a
fifth way.

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
   region — with a check first proved to catch a difference planted on purpose — and
   then all the pages together.

A small change to one page skips the plan. Checking code that is already written
is the last phase, after the first one where no checklist exists yet.

It works on its own, and it works inside another process: where
[superpowers](https://github.com/obra/superpowers) or another process has already
written a spec or plan, the phases add to it instead of running a second one.

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

Reads `.codex-plugin/plugin.json`, which gives it the skills. Install per Codex's
plugin instructions, pointed at this repository.

Codex has no session hook here, and nothing places `USING.md` where Codex reads
instructions — `AGENTS.md` in your own project. Copy its contents there to give
a session the order the skills run in. This path has not been run end to end.

### Cursor

Reads `.cursor-plugin/plugin.json`. Install per Cursor's plugin instructions,
pointed at this repository.

### Anything else

Point your harness at `skills/` and `USING.md`. Nothing in them is
harness-specific. `USING.md` gives the words to hand a phase to an agent with.

## The skills

The agent picks them up on its own. You don't need to name them.

- **finding-patterns** — how pages of this kind are built here
- **planning** — one checkable task per page
- **implementing** — one page at a time, from the checklist
- **verifying** — a separate agent compares each page with the reference
- **accessibility** — optional: measured against a standard only when you ask
  for it or your project states a requirement

## What a task gets

A **checklist**: your page's own structure turned into questions, in the order
the page is read. Shown here with roles; yours carries your own component names.

~~~~markdown
new form page against form page (all four render the same holder and a form)
— from <the page you named>, 4 members of 5 candidates in <your app>, read 2026-08-30

- [ ] page holder — <your holder>, as its own landmark — 4 of 4, 4 files
- [ ] title one level down, in the toolbar — 4 of 4, 4 files
- [ ] form — <your validation approach>, not its own — 4 of 4, 4 files
- [ ] field — label tied to it, error under it, through <your field> — 8 of 8
- [ ] submit — <your button>, full-width, in the content area — the majority,
      3 of 4 across 4 files
- [ ] request failure — <your shared error helper>, not a new message box —
      the shared piece, against the copy in <a page>
- [ ] colour and spacing through the theme; no literal, nothing off the base
- [ ] not copied from <the page you named>: <what only that page has>
~~~~

Every line carries **how**, not whether, and what settled it — so ticking one
means opening the page. An agent that did not write the page walks the checklist.

**Nothing is left behind.** The counts are true of the code as it was read, and
code moves on: a file of them would be a thing to review, keep in step between
branches, and find stale. The checklist belongs to the task and goes with it.

**Plans** — when no other process wrote one, and **never in your repository**.
Each task carries its own checklist, which is what makes it executable by
somebody who was not in the conversation. Planning ends in one of three ways,
and says which:

1. **The work stays in one session.** The plan lives there — or, if the work
   outlives the session, in a scratch file outside your working copy, deleted
   when the work is done.
2. **The work becomes a story for somebody else.** The plan is attached to the
   story, complete enough that a developer without the conversation or the
   checkout could implement it from the attachment alone.
3. **Another process is running.** The tasks go into its plan; no second
   document.

When the work is done, what you decided against the order is reported with the
result; the plan itself goes.

## Two things you can say to it

Most of the time you say nothing: where your project agrees with itself, the
agent takes the answer and moves on, and where it disagrees the agent decides by
a written order and tells you what settled it. Two sentences are worth knowing
anyway, because they outrank everything it counted.

**Point at a page.** A page you name beats any number of pages that disagree with
it — which is what you want on a codebase that has been through three eras.

> *Add a returns page like the orders one.*

Everything is then read from that page, and the counts only separate what repeats
across the rest from what belongs to it alone. Without it the agent picks the
nearest page itself, and says which one it picked and why.

It settles what the page **is** — which parts it has, in what order, how it
behaves — not whether to reach for something your project already shares. A page
worth pointing at is often an old one, written before the shared helper existed;
copying what it hand-writes would produce exactly the drift you installed this to
stop. So the shared piece wins there, and you are told: *the page you named
writes its own error box; the shared helper is used by 3 of 4 — I used the shared
helper.*

**Overrule a decision.** Where the agent reports something you disagree with, say
so once:

> *Submit buttons are full-width here from now on, even though most pages still
> write them auto — we are half way through changing it.*

That is an **override**, and it is worth having precisely because it contradicts
the count: the agent would otherwise follow the majority and keep writing the old
way, correctly and unhelpfully. It outranks everything below your request,
including every count. It is written down where your process already records
decisions — the spec, the plan, the design document — not into a file of this
plugin's own, and there it stands until somebody changes it. With no such
process it is reported with the result and nothing keeps it, so say it again
next time. Nothing invents one: if you did not say it, it is not there.

## Philosophy

- **Your conventions, not ours.** No component name is built in. Every technology
  and every team names its own.
- **A page you name outranks a count**, and an override outranks that — above.
  Counts come with where they were found and in how many files, because four
  identical buttons in one file are one page's habit.
- **Before, not after.** An agent that reads the pattern first writes the right
  page once.
- **It decides, you are not interrogated.** A written order settles what a count
  alone cannot, and every decision is reported with what settled it. Two things
  wait on you: the plan, before any code, and a tie whose answer changes code
  outside the task.
- **Silence is never success.** Where it could not read something, it says so.

Read [docs/concept.md](docs/concept.md) for the reasoning.

## What it does not do

It is not a linter and not a CI gate — nothing fails a build. It has no opinion on
whether your design system is any good. It has one subject: *does this look and
behave like the rest of this project.*

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](CODE_OF_CONDUCT.md). A vulnerability is reported privately —
see [SECURITY.md](SECURITY.md).

## Updating

In Claude Code: `/plugin marketplace update kkurtev-plugins`. What each version
changed is in [RELEASE-NOTES.md](RELEASE-NOTES.md).

## License

MIT — see [LICENSE](LICENSE).

# ui-consistency

Your agent writes a screen. It renders, it type-checks, it passes review — and it
looks nothing like the four screens beside it. A raw `<button>` where your
library exports one. `fontSize: 12` where the scale has a token. A detail view
built as a dialog when every other detail view in the app is a routed page.

**ui-consistency is a set of skills and rules that make your coding agent build
screens the way your project already builds them.** Like
[superpowers](https://github.com/obra/superpowers), but for UI.

## How it works

It starts when your agent is about to build or change a screen. Instead of
writing one from what a screen usually looks like, it first reads the screens of
that kind your project already has — the holder, the order of the regions,
which component fills each role, the props most of them are written with — and
writes that down as a **pattern file**.

Then it writes the screen from that file. For thirty screens, it works one file
at a time from the same file, so the thirtieth matches the first. When the work
is done, it compares every screen it touched against the pattern and tells you
what differs.

Where there is nothing to copy — the first screen of a kind, a new project — it
asks you what the screen should look like, and writes down only what you
answered.

Everything it knows about your project it reads from your repository. There is
no built-in list of components, no framework it prefers, no API key and nothing
to configure.

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

Point your harness at `skills/` and `rules/`. Nothing in them is
harness-specific.

Node 20 or later. No build step, no `npm install`.

## The basic workflow

1. **pattern** — before building or changing screens. Reads the screens of that
   kind and writes down what they have in common, with how many of them agree
   on each thing.
2. **decide** — when there are fewer than three screens of the kind. Asks you
   what the screen should look like, and records the answers.
3. **screen** — writes one screen from the pattern, walking its anatomy in a
   fixed order, and asks where the project has not decided.
4. **rollout** — the same change across many screens. Keeps a queue on disk,
   one file per turn, re-reading the pattern every time.
5. **verify** — before handing the work over. Compares every screen touched
   against the pattern and reports only what deviates.

Plus **review** — a second opinion on one screen — and **reach** — *"it said
nothing; is that good?"*: tells apart *your project is consistent*, *your
project has stated nothing*, and *the plugin cannot see this here*.

**The agent picks the skills up on its own.** You don't need to name them.

## What's inside

### Skills

- **pattern** — establish what screens of a kind look like here
- **decide** — the first screen of a kind
- **screen** — write one screen against the pattern
- **rollout** — apply a pattern across many screens
- **verify** — compare a finished set against the pattern
- **review** — a second opinion on one screen
- **reach** — which of three silences you are looking at

### Rules

- **what-a-screen-is** — how many files a screen is, per framework
- **anatomy** — the roles a screen has, in the order they are read
- **family-and-particulars** — which screens are one kind, and what belongs to
  one page alone
- **roles-and-names** — roles are universal, names are local
- **routes-and-breadcrumbs** — where a route and a trail come from
- **raw-values** — no colour literal, no absolute length, no emoji for an icon
- **imports-and-layers** — where a component should be imported from
- **what-a-decision-is** — what belongs in a decisions file
- **pattern-file** — the format of a pattern file

## What it writes in your repository

Everything goes in `.ui-consistency/`, committed and reviewed like code.

**Patterns** — `.ui-consistency/patterns/<name>.md`:

~~~~markdown
---
pattern: list-screen
surface: screen
holder: PageShell
observed: 2026-09-09
derived: true
---

# List screen

## Structure

```
PageShell                  9 of 9
  FilterBar                9 of 9
  <content>                exactly one
```

## Props

### `PageShell`
- `title` — 9 of 9
- `data-testid` — 9 of 9

### `*Grid`
- `density` = "compact" — 5 of 6

## Rules

- Actions are always rendered; gating toggles `disabled` only.

## Where it is used

`src/pages/OrdersPage.tsx`, `src/pages/InvoicesPage.tsx`, …every one of them
~~~~

`*Grid` is a slot: `OrdersGrid`, `InvoicesGrid` and `CustomersGrid` fill the same
role under different names. `derived: true` means nobody has reviewed it yet.

**Decisions** — `.ui-consistency/decisions/<kind>.md`, a few lines per kind:

```markdown
# Detail screens

canon: src/orders/OrderDetail.tsx

- The breadcrumb comes from the route hierarchy, not the page title.
```

**Your own rules** — any Markdown in `.ui-consistency/`, one rule per heading.
The skills read them.

## Philosophy

- **Your conventions, not ours.** No component name is built in. Every team
  names its own.
- **Curated, not inferred.** Thirty screens sharing a convention and thirty
  repeating one old mistake look the same. A reference you name outweighs any
  count.
- **Before, not after.** An agent that reads the pattern first writes the right
  screen once.
- **Silence is never success.** Where it can say nothing, it says that and why.

Read [docs/concept.md](docs/concept.md) for the reasoning.

## What it does not do

It is not a linter and not a CI gate — nothing fails a build. It has no opinion
on accessibility, performance, or whether your design system is any good. It has
one subject: *does this look like the rest of this project.*

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Updating

In Claude Code: `/plugin marketplace update kkurtev-plugins`.

## License

MIT

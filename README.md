# ui-consistency

Your agent writes a screen. It renders, it type-checks, it passes review — and it
looks nothing like the four screens beside it. A raw `<button>` where your
library exports one. `fontSize: 12` where the scale has a token. A detail view
built as a dialog when every other detail view in the app is a routed page.

**ui-consistency establishes what screens of a kind already look like in your
project, and checks the ones your agent writes against it** — while the code is
being written, not in a pipeline two days later.

Everything it knows about your project it works out from your repository. There
is no built-in list of good components, no framework it prefers, and **no model
call anywhere in the tool** — so it costs nothing per edit and works with
whatever agent you already use.

You do not have to run anything for it to know. On the edit your agent is
already making, it derives what screens of that kind look like in your project
and hands back only what this one does differently — nothing saved, nothing
approved, nothing failed.

**On day one, on a project that has written nothing down**, what runs is the
deterministic half — raw colours and lengths, an emoji standing in for an icon,
imports that resolve to the wrong layer — plus those derived-contract
advisories. The curated checks stay quiet, because you have not curated
anything yet, and that quiet is the design rather than a fault. `ui-consistency:reach`
is the answer to *"is it doing anything?"*: it reports, level by level, whether
each one worked, is quiet because you have stated nothing, or is blind here and
why.

What ships is **a library of rules and skills, plus a deterministic CLI they call
for facts.** The rules are plain Markdown — what a screen is in your framework,
where a family comes from, what must not be copied from a reference page, where a
breadcrumb comes from — and they work on every harness, with or without a hook.
The CLI answers only questions your project has already answered.

```
apps/orders/src/OrderList.tsx:1
Button is imported from @vendor/ui.
@acme/ui exports Button and is nearer on this file's chain.
→ import { Button } from '@acme/ui'
```

`@acme/ui` there is a placeholder for whatever your packages are called. The
tool has never heard of it — it read your dependency graph.

> Every finding shown in this document is real output from a throwaway project,
> pasted unedited. The previous version of this README printed a finding the code
> cannot produce, and it stood for three days until somebody ran it — which is the
> reason for the rule.

---

## Why not just tell the agent?

Because that was tried first. Thirty pages, an implementation plan naming
exactly which components to use, handed over before the refactor — and the pages
still came out inconsistent. A plan is advisory text with nothing forcing
closure: across thirty files it degrades, and **nothing verifies that page
fifteen complied.**

That failure is the origin of this project, and it is why the answer is a check
that runs on the edit rather than a better prompt.

## How it works

Three tiers, ordered by cost. The ordering is the whole design: the expensive
part is never on the critical path.

| | What | Cost |
| --- | --- | --- |
| **Tier 1** | Seven deterministic checks, on every edit, reported in the same turn | ~0.12 s, no model |
| **Tier 2** | The contract — agreed *before* the writing, measured after | one skill invocation |
| **Tier 3** | Skills you invoke by name | only when you ask |

**Tier 1 is a plain program over the AST.** It is silent unless it is *certain*.
That is not modesty: a check that guesses gets switched off within a week, and a
switched-off check costs more than every finding it would have made.

**Tier 2 is where the fuzzy half lives** — *is this the right kind of screen? do
the siblings write this component differently?* Those cannot be asserted from an
AST. They need a model. So the tool does not call one: it assembles the evidence
and hands it to **the agent already in the room**. That is why there are no
credentials to configure and why it works the same under any harness and any
model.

## Install

**[Try it →](https://kamenkurtev.github.io/ui-consistency/)** — the short version of this
section, plus what to expect on day one and how to tell whether it is doing
anything. Hand that to somebody rather than this file.

Installation differs per harness. The repository ships a manifest for each one
it supports.

**Claude Code**

```
/plugin marketplace add kamenkurtev/ui-consistency
/plugin install ui-consistency@kkurtev-plugins
/reload-plugins
```

**Gemini CLI**

```
gemini extensions install https://github.com/kamenkurtev/ui-consistency
```

**Codex** reads `.codex-plugin/plugin.json` — the skills, no hooks.
**Cursor** reads `.cursor-plugin/plugin.json` and `hooks/hooks-cursor.json`.
Install each per its own plugin instructions, pointed at this repository.

**Anything else that reads Markdown skills** — clone the repository and point
your harness at `skills/`. Nothing in a skill is harness-specific.

Only the Claude Code path has been run end to end by the author. If a manifest is
wrong for your harness, that is a bug worth an issue rather than something to
work around.

No build step and no `npm install`: the bundle is committed. Node 20 or later is
the only requirement.

> **What you get differs per harness, and it is worth being precise about.** The
> `PostToolUse` gate — the part that reports in the same turn as the edit — is
> registered in `hooks/hooks.json`, which Claude Code reads. Cursor's hook file
> registers `sessionStart` only; Codex's is empty. **Everywhere except Claude
> Code there is no per-edit gate**, and wiring one into the other harnesses is
> open work.
>
> **What every harness does have, since #33, is the MCP server.** All four
> manifests declare it, it starts with the plugin, and it is the one surface an
> agent can reach on its own initiative without a hook and without you running
> anything. Six tools — the pattern for a screen, the deviations of a set from
> a pattern file, the tree of one screen, the props matrix, the grouping, the
> deterministic findings — and the pattern files as resources, which is the half
> a CLI cannot offer: the agent lists and reads them without knowing a path
> convention. Typed arrays instead of shell globs, so the commonest wrong call
> is gone. Nothing requires it: the hook, the CLI and the skills work unchanged
> with no server running, and a wedged one degrades to silence.

## Composing it into your own agent

The skills are not only for the plugin to trigger. If you build your own
development agent, order them in it by name, beside superpowers skills or
anything else:

```
ui-consistency:pattern     establish what screens of this kind look like here
ui-consistency:screen      write one against that
ui-consistency:rollout     apply it across many, one file per turn
ui-consistency:verify      compare the finished set
ui-consistency:review      a second opinion on one screen
ui-consistency:decide      the first screen of a kind, when there is nothing to derive
ui-consistency:reach       which of three silences you are looking at
```

**None requires another to have run.** Where an input is missing they derive it
or say so, rather than refusing — `verify` has a section for having no contract,
`pattern` for finding nothing. So an ordering can start anywhere.

**Without the `PostToolUse` gate, one step becomes yours to place.** On Claude
Code the hook checks every edit as it happens. Everywhere else, that check is a
command, and it goes after each file rather than at the end:

```bash
node path/to/bin/uic.mjs diff --contract <contract> src/pages/Orders.tsx
```

That is the same comparison the hook makes, run deliberately. Putting it after
each file rather than after all thirty is the whole point — a queue that is
checked at the end tells you which of thirty went wrong, not which one to stop
at.

Nobody has yet run the seven as an explicit ordering inside another agent's
definition. If yours behaves differently from this, that is worth an issue.

**From a local clone,** which is what to use while working on the plugin itself:

```
/plugin marketplace add /path/to/ui-consistency
```

Either way `/plugin marketplace add` reads the repository's default branch, so a
change on a branch is not installable until it is merged.

## The workflow

Five skills and a command, in the order a piece of work runs through them.
**None requires another to have run** — each derives what it is missing rather
than refusing.

| | When |
| --- | --- |
| `ui-consistency:pattern` | before writing — establishes what screens of this kind look like here, for you to approve |
| `uic place` *(CLI)* | where a new screen goes: folder, route, and the trail a breadcrumb follows |
| `ui-consistency:screen` | writing one screen against that contract |
| `ui-consistency:rollout` | applying an agreed pattern across many screens |
| `ui-consistency:verify` | before handing the work over — the finished set against the contract |
| `ui-consistency:review` | a second opinion on one screen |
| `ui-consistency:decide` | the first screen of a kind — walks the anatomy as questions and writes down what you answer |
| `ui-consistency:reach` | **"it found nothing — is that good?"** Level by level: it works and here is what it read, it is quiet because you have stated nothing, or it is blind here and here is why |
| `/uic-fix` | fix what the hook just reported, without re-deriving it |

Skills load only when invoked, so they cost nothing in an ordinary session.

The order matters more than it looks. **Decide before writing; grade nothing
afterwards.** A tool that only marks finished code has already lost — the screen
is written, the developer has moved on, and every finding is now rework. So the
contract is agreed first, and the same file is what the work is measured against.

`pattern` derives that contract from the screens you already have: the holder and
the order of the regions, which component fills each role, the props those
components are always written with, what the layout already provides, and what
belongs to the reference page alone. **You approve it.** Nothing derived can
fail a check on its own — see [Philosophy](#philosophy).

## What Tier 1 checks

**Imports resolve to the nearest layer that exports the symbol.** The layer chain
is derived from your repository — nothing to declare. If `@acme/orders` depends
on `@acme/ui`, which depends on some external UI library, that is the chain, and
`@acme/ui` wins for anything it exports.

**Raw values where your design system has a token** — a colour or a length
written into `style` or `sx`:

```
src/Card.tsx:3
fontSize: 12 is a hardcoded value, not a design-system token.
```

Numbers on spacing keys in `sx` are left alone: `sx={{ mt: 2 }}` is a theme
multiplier, which is the correct form. Fixed widths and heights are left alone
too — almost no design system has a width token.

**Emoji standing in for an icon:**

```
apps/orders/src/RevenueWidget.tsx:5
🔔 is an emoji used as an icon. Use the design system's icon component so it matches the others.
```

**Deprecated components where they are used**, not only where they are imported —
the usage is the line that has to change. It reads standard JSDoc `@deprecated`
and names the replacement when there is a `{@link}`.

**Prop values outside the set your project allows.** The allowed set is injected
from a source of truth — a reference component, or something you curated. With no
source of truth there is no finding, because a set guessed from surrounding code
would enforce whatever mistake happened to be most common.

**The substitutions you have written down** — `use X, never Y`, in your own
words, and they work on custom element names too:

```
src/card.component.html:3
<app-action-grid> is not what this project uses here. "Use app-data-grid, never
app-action-grid" says to use app-data-grid.
```

**The page rules you have written down** — what the structure of a screen of this
kind must be.

Test files, stories and `__mocks__` are not checked. A test renders a raw
`<button>` to assert something about a button, which is the point of the test
rather than a mistake.

### What is deliberately *not* in that list: raw elements

There used to be a check that said "`<button>` is a raw element, use `Button`".
It is gone, and its removal is the clearest illustration of the second decision
below.

To say that, the check needed a built-in map from `<button>` to a component
called `Button` — which is a vocabulary. On every project that names things
differently it matched nothing and **said nothing**, and silence is
indistinguishable from a clean result. So the built-in names went.

Raw elements are still checked. They are checked against the **contract**, where
the answer is derived from your own screens rather than assumed:

```
$ uic diff --contract <c> src/orders/ShipmentsList.tsx
src/orders/ShipmentsList.tsx
  renders a raw <table>; no screen of this kind does
```

The element is named from the HTML specification; the replacement is not named at
all, because the contract's own vocabulary already says what this project renders
instead. And it only fires against a contract **a person approved** — which is
the difference between a rule and a guess.

## What it works with

### Repository layouts

**A single-package app and a 229-package monorepo both work.** Package layout is
detected, never configured, by either of two mechanisms:

**Manifests.** `pnpm-workspace.yaml` or `package.json` → `workspaces` names the
packages; each package's `dependencies` gives the order between them.

**`tsconfig` path aliases.** `compilerOptions.paths` names them instead. This is
how an **Nx** workspace works, where libraries routinely have no `package.json`
at all. Since nothing declares dependencies there, the order is read from the
imports your code actually contains — which is what Nx does for its own graph.

Mixed repositories work: a package with a manifest is taken at its word, and the
aliases fill in the rest. A single-package project with no workspaces at all is
just the degenerate case — the style, emoji, page-rule and substitution checks do
not need layers to fire.

Run `uic scan` to see what was found. If it prints no packages, neither mechanism
matched — [open an issue](https://github.com/kamenkurtev/ui-consistency/issues),
because that is a bug rather than a configuration step.

> **One thing to know about the derived graph.** Reading edges out of imports
> means parsing every source file — about half a second on ten thousand — so the
> result is cached and refreshed when your `tsconfig` aliases change, not on
> every edit. The consequence: the first time you import from one existing
> library into another, the hook may not know about that edge until you run
> `uic scan`. What that costs you is a missed finding, never a wrong one.

### Frameworks

**JSX** — React, Preact, Solid, Qwik — is read with a JSX-aware parser, and every
check applies.

**Angular, Vue and Svelte templates** (`.html`, `.vue`, `.svelte`) are read by one
tolerant HTML parser rather than three framework compilers.

An **Angular screen is a pair of files** and is read as one screen:
`orders.component.ts` carries the identity, the imports and the wiring;
`orders.component.html` carries the markup. Hand either one to any command and
you get the same screen. Inline `template:` works as well as `templateUrl:`, and
a component with neither is not a screen. A Vue or Svelte SFC is one file and
was never affected. ~~What applies there is
what survives having no JavaScript semantics: hardcoded values in a literal
`style`, an emoji standing in for an icon, and your own written-down
substitutions — including custom element names, since `<app-action-grid>` is a
component in every sense that matters here.~~

**That list was the *deterministic* half, and it read as the whole of it.** Those three still apply and are still the only checks that can *fail*
anything in a template. But the pattern half applies too: the holder, the family,
what the holder holds, how the screens beside this one write the components they
share, and the contract measured against all of it. It did not, and the reason
was two JSX-only readings that dropped a template sibling before anything else
ran — so a template project got the same silence as a project with nothing
written down. What still does not apply is anything needing JavaScript
semantics: hooks, imports and the layer chain are read from the class file where
there is one, and not from markup.

That choice was measured, not assumed: `svelte/compiler` alone bundles to 1.8 MB
and `@vue/compiler-sfc` does not bundle at all, against a plugin a hook loads on
every edit. The tolerant parser reads all three dialects with no errors and costs
172 KB.

### Design systems

**No component name is hardcoded anywhere a finding can come from. A test
enforces it.** Roles are universal; names are local, and a built-in vocabulary
made the checks silent on every project that names things differently — silence
being indistinguishable from a clean result.

So the import, deprecated, substitution and contract checks are
vocabulary-neutral:
they work against your own packages whatever they wrap — Material UI, Chakra,
Mantine, Radix, Ant, or a design system you built from nothing.

Two honest limits:

- The style check reads the `style` attribute and the `sx` prop. `sx` is spelled
  the same by MUI, Chakra and Theme UI, and its spacing-key semantics are read as
  MUI reads them.
- **Tailwind classes, CSS modules and styled-components are out of reach of it.**
  A per-file AST check cannot see what `text-sm` resolves to. Class *lists* are
  compared for the contract (`pattern` intersects them by token), but no finding
  is made about a class name.

## The CLI

The plugin installs a hook, not a command — it does not put anything on your
`PATH`. For CI or a whole-project pass, call the bundle:

```bash
uic=path/to/ui-consistency/bin/uic.mjs

node $uic pattern src/orders/OrderList.tsx --save   # what screens of this kind look like here
node $uic pattern src/orders/OrderList.tsx --establish  # write it down as a pattern file to review
node $uic diff --contract <c> src/orders/*.tsx      # where the screens you touched left it — <c> is a pattern file or a saved contract
node $uic place src/orders/OrderList.tsx            # folder, route, and the breadcrumb trail
node $uic tree src/orders/OrderList.tsx             # what it renders, followed into its children
node $uic props OrdersGrid $(git ls-files 'src/orders/*.tsx')  # which props each file writes on it
node $uic group $(git ls-files 'src/**/*Page.tsx')  # the screens grouped by what they are made of
node $uic patterns src/orders/OrderList.tsx         # which pattern covers this screen, and what has moved
node $uic check $(git ls-files '*.tsx')             # exits 1 if anything is wrong — your CI gate
node $uic scan                                      # the packages detected, how, and what each exports
node $uic shapes $(git ls-files '*.tsx')            # shapes rebuilt or repeated
node $uic review src/orders/OrderList.tsx           # the checks, plus the evidence for a second opinion
node $uic log                                       # what it has found here while you worked
node $uic inventory src/orders/OrderList.tsx        # what this file's chain exports, and from where
```

> **`check` takes files, not glob patterns**, and relies on the shell to expand
> them — so a *quoted* glob arrives as one literal string. It says so and exits
> 1 rather than checking nothing and passing:
>
> ```
> $ uic check "src/**/*.tsx"
> src/**/*.tsx matched no file. Globs are expanded by your shell, so a quoted
> pattern arrives here literally.
> Name the files, or let the shell name them: $(git ls-files '*.tsx')
> ```
>
> A directory and a path that is not there are refused the same way. Until
> 0.14.28 all three checked nothing and exited 0, which made any CI line written
> that way green forever.

`shapes` answers a different question from the rest: *have you rebuilt something
that already exists, and does this shape repeat often enough to be worth
extracting?* It is a separate read-only command and never part of the per-file
check, because from an AST a propagated mistake and a shared pattern look
identical. Its output is a list of suspects for a person to read, not findings.

## What it stores about your project

**Intent, and nothing else.** Five to twenty lines per kind of screen, in
`.ui-consistency/decisions/<kind>.md`, committed and reviewed like code:

```markdown
# Detail screens

canon: src/orders/OrderDetail.tsx
prefer: @acme/ui
ignore: @acme/scaffolding

- The breadcrumb comes from the route hierarchy, not the page title.
- We are migrating off @acme/legacy, which is why `prefer` is there.
```

`canon:`, `prefer:` and `ignore:` are read; **a bare line, not a bullet.** The
prose is for the people reading the file, and for the agent when it loads it.

### Patterns, one file each

The other thing worth keeping is what a *pattern* is — the shape a kind of screen
has here, which is more than a decision and less than a spec. One Markdown file
per pattern in `.ui-consistency/patterns/`, written by the agent from reading
your code and reviewed by you in a pull request. Until you have reviewed it,
it says so: a file the tool established carries `derived: true` and the date
it was measured, and names under `## Still to be written` the parts no
extraction can produce — and `uic pattern <screen> --refresh` re-counts such a
file later without touching a sentence anybody wrote into it — which alternatives a slot allows, the rules no
checker can evaluate, and whether a screen that differs does so deliberately:

~~~~markdown
---
pattern: list-screen
surface: screen
holder: PageShell
observed: 2026-09-09
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

- Actions are always rendered; gating toggles `disabled` only, and never removes
  an entry from the menu.

## Where it is used

`src/pages/OrdersPage.tsx`, `src/pages/InvoicesPage.tsx`,
`src/pages/CustomersPage.tsx`, `src/pages/ReportsPage.tsx`, …and the rest
~~~~

Prose, because three of the things a pattern has to state cannot be data: an
alternative a slot allows, a rule no checker can evaluate, and the reason one
screen is allowed to differ. **Every statement carries its strength** — `9 of 9`,
`5 of 6` — so a family that agrees about twelve things out of thirteen is
described rather than described as disagreeing.

`*Grid` is a slot: the role a family fills under a different name in every
screen. `OrdersGrid`, `InvoicesGrid` and `CustomersGrid` are one thing your
project agrees about, and counting by name never sees it.

`uic diff --contract <that file> <screens>` verifies a finished set against it,
exits 1 where something deviates, and **prints what it could not evaluate** — the
prose rules, and any slot written for a person — because printing silence for
those would let a screen pass against rules nobody checked.

**List every member**, not a sample: that list is how a screen is matched to its
pattern and how staleness is checked, so a truncated one quietly loses both.

`uic patterns` lists what you have and says which files have changed since a
pattern was read. Ask about one screen — `uic patterns src/pages/OrdersPage.tsx`
— and *"no pattern covers it"* is a real answer: it means this is a shape nobody
has written down yet.

Every *fact* about the code is derived fresh every time, because a stored copy of
what the code says can only be wrong — every staleness problem in this project
came from such a copy. That is why a pattern file states the date it was
observed and the screens it was read from, and why the counts in it are checked
against the code rather than trusted.

But extraction cannot say which of two competing patterns you are moving
*towards*, because the older one is always the more common. That has to be told
once, and then it is never typed again.

A pointer at a file that no longer exists is reported **where the decision is
used**, not by an audit somebody has to remember to run. A check that fires on
use cannot go stale.

The directory is `.ui-consistency/`, in your repository root — not under
`.claude/`, which is where one agent keeps its own configuration. What is in
here is your project's intent about your screens, and it is read the same way
by whichever agent is in the room.

`.claude/ui-consistency/` was the old location. It is still read, and the
session hook says so when it is what was read — a fallback that works silently
leaves everybody on the old path forever.

### Rules in your own words

Drop plain Markdown in `.ui-consistency/` — one rule per heading:

```markdown
# Dashboard widgets

## Widget title

The title is `<Typography variant="h6">`. Never a raw heading and never a
`fontSize` — the scale is what keeps eight widgets aligned.
```

**Two things about the shape, because a rule written the obvious way does
nothing and says nothing about why.** A component has to be *marked* as one —
`` `<DataGrid>` ``, `<DataGrid>` or `` `DataGrid` `` — and a bare word in a
sentence is prose, not a name. And a prohibition needs a word that makes it one:
*never*, *not*, *instead of*, *rather than*, *avoid*, *don't*. "Widgets are
wrapped in `<WidgetCard>`" says what is right and nothing at all about what is
wrong, and the tool will not derive the second from the first — that is the
inference it exists to refuse. So this fires:

```markdown
## Grids

A card of actions uses `<app-data-grid>`, never `<app-action-grid>`.
```

and the same sentence without the backticks fires nothing. A custom element must
contain a dash, as the HTML specification requires, which is also what makes it
impossible to forbid a plain `<div>`.

**The finding quotes the heading, not the sentence** — so a heading that reads
as the rule is worth writing.

Only the rules bearing on the file being edited are selected, lexically and
in-process — no embeddings, no network. Measured over 1797 real files: 0.42 ms
and about 150 characters of rule text per file. A knowledge base of 120 rules
costs exactly the same per edit as one of three.

**A rule only speaks about the files it is about.** A finding citing a rule that
does not apply teaches people to stop reading them.

## Configuration, if you need it

Detection alone should work. Two things it cannot work out, because neither is in
the dependency graph — both are the `prefer:` and `ignore:` lines above.

**`prefer` matters if you are migrating**, and the reason is not obvious. Moving
from an old package to its replacement, the old one usually still *depends* on
the new one — so the graph calls the old one nearer, and the check pushes you
back towards exactly what you are leaving. Which package you are moving *to* is
intent, and intent is not in the graph.

Where you control the package you are leaving, `@deprecated` on its exports is
better still: the check already reads it and can name the replacement.

Both lines go in the decisions file above. `.uicrc.json` with `{"prefer": [...],
"ignore": [...]}` is still read and merged with them — a config that quietly
stops being read is a silent change of behaviour in somebody's repository.

## The log

Every finding the hook reports is appended to a log — one JSON line each: when,
which file, which line, which kind, and the message.

**It is not free of your code.** A finding quotes what it found — `color:
'#ff0000' is a hardcoded colour` — so the log carries those literals, one line
and at most eighty characters each. No file contents, no surrounding lines, no
AST, and never more than the finding needed to name. The contracts beside it
carry more: `uic pattern --save` records the prop values and class strings a
family agrees on, verbatim.

Beside it, `repo.txt` holds the **absolute path** of the repository the log is
of — four checkouts mean four logs, and their own paths are deliberately
relative, so nothing else would say which is which.

Read all of it before you hand it to anybody, and turn it off with `UIC_LOG=off`
if that is not a call you want to make — that stops the log, the recurrence
state and `repo.txt` together. It lives outside your repository — nothing
to gitignore, nothing to accidentally commit — in a directory this tool creates
owner-only and refuses to use if anything else owns the name.

`uic log` reads it back, and the part worth reading is at the bottom:

```
Said more than once — told, and not acted on:
      3x src/dashboard/RevenueWidget.tsx:6
         fontSize: 12 is a hardcoded value, not a design-system token.

Said about many different files:
     84 files  @material-ui/core is imported where @backstage/ui is nearer.
      9 files  fontSize: 12 is a hardcoded value, not a design-system token.

Findings that did not come back:
      4  acted on — the file was checked again and this was gone
     31  not known — the file was never checked again
```

~~A finding that appears once and never again was acted on.~~

**Withdrawn, and the tool no longer says it either.** A finding appears
once and never again for two different reasons, and only one of them is good
news: the file was checked again and the finding was gone, or the file was never
checked again and nothing was learned. Measured over sixty files edited once
each, *every* finding looked acted on — nothing could have come back — and the
log reported a clean sheet it had no basis for. The third block above is what it
says now, and on a normal session most of it is **not known**.

The same finding on the same line an hour later means either the finding is
wrong, or it is right and nothing is doing anything about it. Both are worth
knowing, and neither is visible any other way. Nine files means the project has
an opinion it has not written down — or has written one that nothing is
following.

For imports that claim is made about the **source**, not the sentence: every
import finding names its own symbol, so two files taking different things from
the same wrong package never share a message, and this half used to be silent
about them entirely — which on a project that has written nothing down is 93% of
everything the tool produces.

Each finding is written once per edit, not once per save: the recurrence lives
beside the log in `seen.jsonl`, so `3x` means three separate edits.

The report counts **lines, not symbols.** One `import` statement naming four
symbols from the wrong package is four findings for the check — each symbol
resolves separately — and one entry here, because it is one edit to make. The
log itself still holds the four; the grouping is in the reading.

## Philosophy

**1. The gate is deterministic, never a model.** Everything that can fail a check
is a plain program over the AST. A model on every edit would be slow, expensive,
and switched off within a week. A model may *fix* what the checker reports, and
may offer an opinion where no deterministic answer exists — but that opinion is
advisory, off the edit path, and can never block anything.

**2. Conventions are curated, never inferred from surrounding code.** Inferring
from neighbouring files averages in whatever nobody has touched in a year and
turns existing mistakes into enforced rules. Material is *derived*; a person
*accepts* it; the accepted contract is what gates. Nothing derived may fail an
edit.

**3. Silence must mean clean.** A check that fires on a guess trains people to
ignore it, and then it is worth less than nothing.

**4. Fixtures written by whoever wrote the rule prove nothing.** Eight real bugs
in this project were found while the whole suite was green — including a tier
that was dead for every installed user while all 307 tests then in the suite
passed. Validation here means a real repository at real scale, and running the
*shipped artifact*.

## What it does not do

It will tell you `fontSize: 12` is a raw value. It will not tell you that a
typography variant exists for it — theme and `defaultProps` resolution is
deliberately deferred, because reading a theme correctly is a compiler problem
and reading it *incorrectly* produces confident wrong findings.

It has no opinion on accessibility, performance, or whether your design system is
any good. It has one subject: *does this look like the rest of this project.*

And it does not gate on anything it derived by itself. That is not a limitation
to be fixed later; it is decision 2.

## How it differs from what exists

| | What it does | Why it does not cover this |
| --- | --- | --- |
| ESLint / Biome | syntax and style | `no-restricted-imports` can ban a package, but not "use whichever layer is nearest for *this* file" |
| Design-judgement skills | inject general taste | do not know *your* component vocabulary |
| Chromatic / Percy | pixel diff against a baseline | tells you something changed, not that it broke your conventions |
| CI gates | verify after the fact | a failure after two days of refactoring is a rework bill, not help |

## Contributing

Issues and pull requests welcome. **[CONTRIBUTING.md](CONTRIBUTING.md)** has the
setup, the five things that bite a first contribution, and how to file an issue
that can be acted on. Two of them are worth knowing before you decide to start:

**Read `docs/concept.md` first.** It records the problem, the decisions that
shape the architecture, and what is deliberately excluded. Several of the
excluded things look like obvious improvements until you read why they are out.

**A fixture is not evidence.** If your change touches anything that can produce a
finding, run it against a real repository at real scale — and for anything
user-facing, run the shipped artifact: copy `bin/uic.mjs` alone into an empty
directory and use it there. That instruction exists because a tier once shipped
dead to every installed user while every test passed.

`npm run gate` runs typecheck, build, the stale-bundle check, the version check,
the tests and plugin validation, and the same script runs on every pull request.
The [good first issues](https://github.com/kamenkurtev/ui-consistency/issues) are
the place to start — registering the per-edit hook for harnesses other than
Claude Code is the most valuable one open.

## Updating

An installed plugin updates when the manifest names a new version. In Claude
Code, `/plugin marketplace update kkurtev-plugins`.

## Licence

MIT. Free, and staying that way — this is a plugin made of copyable text, and a
licence check on copyable text is theatre. If a paid layer is ever built it is a
team layer around the CLI, never this.

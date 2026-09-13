# ui-consistency

> **The CLI and the per-edit gate described below are being withdrawn (#76).**
> Decided 2026-09-12 after a day of manual testing against three real
> monorepos: the TypeScript goes and this becomes a set of rules and skills.
> Everything here describes what the plugin does today and still works; none of
> it is a statement of direction. What the program derives is what the skills
> will derive — the same seven levels, read by the agent instead of by 15 618
> lines that keep being corrected on the next repository's convention.

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
deterministic half — ~~raw colours and lengths, an emoji standing in for an
icon, imports that resolve to the wrong layer~~ **imports that resolve to the
wrong layer; raw colours, lengths and emoji are a rule the agent obeys while
writing rather than a check that reports afterwards (#79)** — plus those
derived-contract advisories. The curated checks stay quiet, because you have not curated
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
| **Tier 1** | ~~Seven~~ **four** deterministic checks, on every edit, reported in the same turn (#79) | ~0.12 s, no model |
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

> ~~**What you get differs per harness, and it is worth being precise about.**
> The `PostToolUse` gate is registered in `hooks/hooks.json`, which Claude Code
> reads; everywhere except Claude Code there is no per-edit gate, and wiring one
> into the other harnesses is open work.~~
>
> **What you get is the same on all four harnesses (#89), and the open work is
> closed by there being no gate to wire.** `hooks/hooks.json` registers
> `SessionStart` and nothing else: one line telling a session which skills exist
> and in what order. Codex, Cursor and Gemini CLI read the same text from
> `AGENTS.md`.
>
> ~~**What every harness does have, since #33, is the MCP server.** All four
> manifests declare it, and it is the one surface an agent can reach on its own
> initiative without a hook. Six tools, and the pattern files as resources.~~
>
> **The server is gone (#77).** Six tools onto functions that no longer exist —
> and what it existed for is what replaced them: a **skill** is reached by the
> model's own judgement on every harness, needs nothing configured, has no
> protocol to keep and no server to wedge. The `mcpServers` block is out of all
> four manifests. So on the three harnesses with no hook, the skills and the
> rules are the whole surface, which is also the half that was always portable.

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

~~**Without the `PostToolUse` gate, one step becomes yours to place.** On Claude
Code the hook checks every edit as it happens. Everywhere else that check is a
command, and it goes after each file rather than at the end.~~

**No harness has a gate and none needs a command placed (#89).** The step is
reading the file back against the rules and the pattern, which every skill
already says to do. Putting it after
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
| ~~`uic place` *(CLI)*~~ | where a new screen goes: folder, route, and the trail a breadcrumb follows — **a rule since #78**, `rules/routes-and-breadcrumbs.md`, which your agent reads against your own router |
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

~~**Imports resolve to the nearest layer that exports the symbol.** The layer
chain is derived from your repository — nothing to declare.~~ **Gone (#81), and
it is the one thing here that is genuinely given up.**

It was the only capability an agent cannot reach by reading the file in front of
it — *which package is nearer on this file's chain* is a fact about the whole
repository's dependency graph. It was also the one that worked on **one
repository shape in three**: 81 findings on a `tsconfig`-alias workspace, **0**
on a `package.json` workspace where every chain was unreadable, near-nothing on
an Angular monorepo. A capability that answers on one shape in three is not kept
on the argument that it is needed.

`rules/imports-and-layers.md` is what replaces it — a sentence your project
writes once: *"take `styled` from `@ws/ui`, never from `@mui/material`"*. That
needs no graph, works everywhere, and can say **why**, which the chain never
could. What you give up is that the graph said it without anybody writing
anything down.

~~**Raw values where your design system has a token**~~, ~~**emoji standing in
for an icon**~~ and ~~**deprecated components where they are used**~~ — **all
three are gone from the program (#79).**

The first two are a rule instead: `rules/raw-values.md`. Your agent wrote the
line, so it can see the literal in it without a program parsing the file back,
and a rule is obeyed *while* the line is written rather than reported after it —
at no per-edit cost, on every harness, in any language. The rule keeps every
exception these checks had learnt the hard way: zero is zero, relative units are
not raw values, a bare number on a spacing key in `sx` is a theme multiplier and
correct, and fixed widths and heights are a layout decision rather than a
bypassed token.

The third read a JSDoc `@deprecated` marker in the imported component's own
source — which the agent reading that source sees for itself — and it needed the
package chain, which is going the same way.

~~**Prop values outside the set your project allows.**~~ **Gone (#78), and for
its own stated reason.** The allowed set was injected from a source of truth — a
reference component, a Storybook story, or the neighbouring files — and all
three of those readers were the pattern derivation that became a skill. A prop
check with no injected source of truth guesses one from surrounding code and
enforces whatever mistake happened to be most common, which is the single thing
it was built not to do. Props are read by `ui-consistency:pattern` now, each with
its strength stated as a count: *"7 of the 8 screens of this kind write
`dataTestId`; this one does not"*.

**The substitutions you have written down** — `use X, never Y`, in your own
words, and they work on custom element names too:

```
src/card.component.html:3
<app-action-grid> is not what this project uses here. "Use app-data-grid, never
app-action-grid" says to use app-data-grid.
```

~~**The page rules you have written down** — what the structure of a screen of
this kind must be.~~ **Gone with the region reader it measured against (#78).**
*A page is `<PageLayout>` holding, in order, header then content* is a sentence
you wrote; `ui-consistency:pattern` reads it and reads the screen, which is what
the check did — and it can also say **why** a screen differs, which the check
never could.

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

Raw elements are still checked, and since #77 that is `ui-consistency:pattern`
rather than a command: the pattern for the kind lists the raw elements the
family avoids, and a screen rendering one is named against it —

```
src/orders/ShipmentsList.tsx
  renders a raw <table>; no screen of this kind does
```

The element is named from the HTML specification; the replacement is not named at
all, because the pattern's own vocabulary already says what this project renders
instead. And the answer comes from **your own screens** rather than a built-in
list — which is the difference between a rule and a guess.

## What it works with

### Repository layouts

**A single-package app and a 229-package monorepo both work — and since #81
neither needs detecting.** There is nothing to configure because there is
nothing to lay out: the rules and the skills read the files you point them at,
and a rule about where `styled` comes from is the same sentence in a one-package
app as in a 229-package workspace.

~~Package layout was detected by two mechanisms — workspace manifests, and
`tsconfig` path aliases for the Nx shape where libraries have no
`package.json` — and the derived graph was cached because reading edges out of
imports parses every source file.~~ **All of it went with the import check it
fed (#81).** The bar it failed is in that section above; the honest summary is
that on the `package.json`-workspace shape, 15 of 15 packages named an entry
point that only exists after a build, so nothing resolved and the check was
silently dead while other checks reported findings.

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

**That list was the *deterministic* half, and it read as the whole of it.** ~~Those three still apply~~ **One of the three does: the substitutions you wrote down. The other two are `rules/raw-values.md` now (#79), which applies to a template exactly as to a `.tsx` because a rule is not a parser.** It is still the only check that can *fail*
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

- ~~The style check reads the `style` attribute and the `sx` prop.~~ **The check
  is a rule now (#79)**, and the `sx` semantics went into it: a bare number on a
  spacing key is a theme multiplier, read as MUI reads it, and `sx` is spelled
  the same by MUI, Chakra and Theme UI.
- **Tailwind classes, CSS modules and styled-components are out of reach.**
  Nothing reading one file can see what `text-sm` resolves to — which the rule
  says in the place the agent reads it, rather than handing back a clean report.
  Class *lists* are
  compared for the contract (`pattern` intersects them by token), but no finding
  is made about a class name.

## ~~The CLI~~ — one command, and it is a hook

The plugin installs a **hook**, not a command. Since #89 the bundle has one
subcommand, and it is the one `hooks/hooks.json` calls:

```bash
node path/to/ui-consistency/bin/uic.mjs session   # the SessionStart adapter
```

**Fourteen commands were removed in four changes (#77, #78, #81, #89)** — the
ones that derived a pattern, wrote it down, re-counted it, listed what was
written, compared a set against it, gathered evidence for a second opinion,
served all of that over MCP, answered where a screen is routed, walked what a
screen renders, grouped screens by shape, reported the packages detected, listed
what a file's chain exports, ran the deterministic checks, found repeated
shapes, and read back the log. **The bundle went from 907 KB to 6.**

Each is a skill or a rule now, and both read your files: `ui-consistency:pattern`
establishes the pattern, `ui-consistency:verify` reads a finished set against it,
and `rules/` is what they read while doing it.

> **There is nothing to put in CI, and that is the cost of the change rather
> than an oversight.** Nothing fails a build without an agent in the room. It is
> stated again under *What it does not do*, because it is the thing somebody
> will look for first.

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
it was measured, and names under `## Still to be written` the parts no reading
of the code can produce — which alternatives a slot allows, the rules no checker
can evaluate, and whether a screen that differs does so deliberately. The skill
re-counts such a file later without touching a sentence anybody wrote into it:

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

`ui-consistency:verify` reads a finished set against it and **says what it could
not evaluate** — the prose rules, and any slot written for a person — because
silence about those would let a screen pass against rules nobody checked.

~~A command did that and exited 1 where something deviated.~~ **It is gone
(#77), and so is the one place derived material could fail a build.** That is
the honest cost of the change and it is stated again under *What it does not
do*: rules and skills cannot fail a build on their own.

**List every member**, not a sample: that list is how a screen is matched to its
pattern and how staleness is checked, so a truncated one quietly loses both.

The patterns are Markdown in your repository, so listing them is `ls` and
reading one is reading a file. *"No pattern covers this screen"* is a real
answer rather than a failure: it means this is a shape nobody has written down
yet, and `ui-consistency:pattern` is what writes the first one.

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

## ~~The log~~

**Gone with the findings (#89).** It recorded what was found while you worked —
five fields per entry, values quoted at one line and eighty characters, in a
directory outside your repository created owner-only. With no check there is
nothing to record, so the log, the recurrence state, `repo.txt`, `UIC_LOG=off`
and the directory itself are all removed.

Worth saying plainly because the old text made a promise about them: the log was
**not** free of your code — a finding quotes what it found, so literals from your
files were written to disk. That surface no longer exists. Nothing this plugin
ships writes anything outside the directory you point it at.

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

~~It will tell you `fontSize: 12` is a raw value.~~ **The rule tells your agent
not to write one (#79).** Neither will tell you that a
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

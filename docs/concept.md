# The concept

*What this is, why it is shaped this way, and what it refuses to do.*

## The problem

An agent writing UI does not know your design system. It knows React, it knows
MUI, it knows what a good dashboard widget looks like in general — and it will
write one. In general.

So it imports `Button` from `@mui/material` when your `@acme/core` exports one.
It writes `fontSize: 12` on a title where the four widgets beside it use a
typography variant. It builds a detail screen as a `Dialog` when every other
detail screen in the app is a routed page. It rebuilds a form by hand instead
of putting it in the layout holder that arranges the fields by weight.

Every one of those renders. Every one passes review if the reviewer is tired.
And every one of them is a small, permanent divergence: the next screen is
copied from this one, and a year later the application has four ways to do
everything.

**This is not a code quality problem.** Linters and type checkers pass on all
of it. It is a *consistency with this project specifically* problem, and no
general-purpose tool can have an opinion about it, because the answer lives
only in your repository and in your team's head.

## What was tried first, and why it failed

The obvious fix is to tell the agent. Write the plan, name the components, hand
it over before the refactor.

That was tried. Thirty pages, an implementation plan naming exactly which
components to use, and the pages still came out inconsistent. A plan is
advisory text with nothing forcing closure: across thirty files it degrades,
and **nothing verifies that page fifteen complied**.

That failure is the origin of this project, and it is why the answer is a gate
rather than a better prompt.

## The shape of the answer

Three tiers, ordered by cost, and the ordering is the whole design.

### Tier 1 — deterministic, every edit, no model

A plain program over the AST. It runs in the `PostToolUse` hook and reports in
the same turn as the edit, before the agent has moved on. **0.09–0.2 s per
edit**, no network, no credentials, no tokens.

It checks seven things: imports resolve to the nearest layer that exports them;
raw colours and sizes where a token belongs; an emoji standing in for an icon; a
component you have marked `@deprecated`; a prop value outside your declared set;
the page rules you have written down; and the substitutions you have written
down.

**A raw element where your own component exists is not among them, deliberately.**
That check needed a built-in map from `<button>` to a component called `Button`,
which is a vocabulary — and on every project naming things differently it
matched nothing and said nothing, silence being indistinguishable from a clean
result. Raw elements are checked against the contract's `avoids`, where
the answer is derived from the project's own screens and a person has approved
it.

It is silent unless it is **certain**. That is not modesty — see *the rule that
governs everything*, below.

**And Tier 2 now reaches the same turn, without anybody running anything.**
Where an approved contract covers the kind it wins — *covers*, which until #3
it did not have to, so one saved contract made every dialog and panel in the
project a page that had left its contract; where none does, the
pattern is derived from the edit being made and the sentence handed over says it
was derived and where the family came from. Nothing derived can fail an edit —
it goes into the agent's context, never into a failure — which is what makes
deriving it safe with no signature on it. Requiring a person to run `uic pattern`
per kind first is why a project that had written nothing down got, in effect, an
import checker.

**And what the hook says is scoped to what the tool call wrote.** A
finding outside those lines is recorded in the log and not injected: telling an
agent to fix a year-old line inside an unrelated change asks for churn it is
right to refuse, and each refusal teaches that the imperative is skippable.

That rule explains the silence and not how anybody tells one kind of silence
from another, which is the first question a real user has: *"it found
nothing — is that good?"* There are three answers, and only one of them means
the project is fine — it works and here is what it read; it is quiet because you
have stated nothing, which is the design; or it is blind here, and here is why.
`ui-consistency:reach` answers them level by level from cheap inspection over a
sample of screens. No score and no grade: the subject is this tool's reach on
your project, not your project's quality.

### Tier 2 — advisory, through the harness, still no credentials

Some things cannot be asserted from an AST. *Is this the right kind of screen?*
*Does this page have the regions the others have, in the order they have them?*
Those are judgements.

So the hook does not judge. When Tier 1 is clean and the project has written
rules that bear on the file, it hands **the agent already in the room** — the
one reading your code — the rules, what the file structurally is, and what its
neighbours look like, and asks for a judgement.

The model that does the fuzzy half is whichever one you are already talking to.
There is no API key anywhere in this tool and nothing to configure, which is
also what makes it the same tool under Claude Code, Codex, Cursor or Gemini
CLI.
Debounced per file so the same rules are not re-injected on every keystroke,
and framed so it can never read as a gate.

### Tier 3 — the deliberate surfaces

Skills and commands you invoke by name: establish what screens of a kind look
like here before writing one, write one against that, roll an agreed pattern
across many, verify a finished set, ask for a second opinion on one screen,
decide what the first screen of a kind should be, and ask which silence you are
looking at. They load only when invoked, so they cost nothing in an ordinary
session.

**Under the skills are the rules** — plain Markdown in `rules/`, and the
portable half of this whole thing. What a screen *is* per framework,
where a family comes from and what must not be copied from a reference, that
roles are universal while names are local, where a route and a breadcrumb come
from, and what belongs in a decisions file. Every one of them is knowledge about
the world that was tried as a list in the program first and broke silently on
the neighbouring case; written as a paragraph it is applied with judgement, and
a rule that is wrong is wrong *visibly*.

So the shape is: **the program supplies facts, the rules and skills are the
instructions.** That is also what makes it portable — a harness with no hook
still gets the whole of the second half.

There is nothing to set up and nothing to audit. Both existed and were deleted:
what the tool stores is a few lines of intent, and every fact about the code is
derived fresh, so there is no stored copy to go stale.

**Setting nothing up is the design; saying nothing is not.** *"Fewer than
three screens of this kind to compare"* is the commonest answer on a real
project — every new area, every new project, and the first page of any refactor
— and after it the tool used to stop. `ui-consistency:decide` is where the
intent comes from instead: it walks the anatomy as questions, takes *"not
applicable"* and *"undecided"* as real answers, and writes down only what was
actually said. Nothing is maintained afterwards, because a decisions file is
written once per kind, at the one moment somebody has an opinion.

## The two decisions everything else follows from

### 1. The gate is deterministic. It is never a model.

A model on every edit would be slow, would cost money, would judge unfinished
code, and would be switched off within a week. Anything that can *fail* a check
is a plain program. A model may fix what the checker reports, and may offer an
opinion where no deterministic answer exists — but that opinion is advisory,
off the edit path, and can never block anything.

### 2. Conventions are curated. They are never inferred.

This is the one people argue with, so here is the argument.

You could derive the rules from the code: see what most files do, enforce that.
It would need no configuration and it would feel magical.

It would also be wrong. **From an AST, eight files sharing a convention and
eight files sharing a mistake look identical.** A tool that infers rules from
frequency will find the most-copied mistake in your codebase and start
enforcing it — with authority, in every review, forever.

So: a person writes the rule down. One heading, two sentences, in a Markdown
file in your repository, reviewed in a pull request like anything else. The
tool reads it and enforces exactly that.

The cost is real and worth stating: **with no rules written, the tool cannot
catch the four failures above.** It still catches raw values, emoji, deprecated
components and mis-resolved imports — those need nothing. But *"use
`<ActionGrid>`, never a raw `<Grid>`"* is a decision only your team can make,
and the tool will not make it for you.

## The rule that governs every check

**A false positive costs more than a miss.**

A tool that is wrong once is a tool somebody argues with. A tool that is wrong
twice is a tool somebody turns off. A tool that stays quiet about something it
could have caught costs one missed finding.

This is not a preference; it is a design constraint that has repeatedly forced
features to be smaller. A few of the things this tool deliberately does not say:

- `sx={{ mt: 2 }}` and `sx={{ borderRadius: 1 }}` are theme multipliers — the
  *correct* form, and silent.
- `style={{ lineHeight: 1.5 }}` is a ratio, not a length.
- A fixed `width` is a layout decision; almost no design system has a width token.
- A file exporting `IconButton` may render `<button>`; a `Table` may render its
  own `<tbody>`.
- `<input type="checkbox">` is not a `TextField`.
- Test files, stories and `__mocks__` are not checked at all — a test renders a
  raw `<button>` to assert something about a button.

Each of those is there because it fired on correct code once, on a real
repository, and had to be taken back.

## Why it is a plugin and not a linter

A linter runs in CI, after the code is written, in a list nobody reads to the
end. By then the screen exists, the pattern is set, and fixing it is a
refactor.

This runs **in the same turn as the edit**, while the agent still has the file
in its hands and changing it costs nothing. That is the entire reason for the
`PostToolUse` hook, and it is why speed is a hard constraint rather than a nice
property.

**Changing it costs nothing only for what the agent just wrote**, and the
hook used to ignore that: it ran every check over the whole file, so an agent
editing line 40 for one reason was told to fix line 121 for another. Obeying
means unrelated churn in an unrelated change, so a disciplined agent skips it —
and each such event teaches that the imperative is skippable. The tool's own
dogfood log holds one finding from real work, on a line written a year before
the edit that triggered it; it was ignored, and the ignore was correct.

So: **the hook speaks about the edit, the log keeps the file.** Findings outside
the lines the tool call wrote are still recorded — the record keeps the whole
truth — and `uic check` still reports everything, because a pipeline is not an
interruption.

There is still a CLI for a pipeline — `uic check` exits non-zero — but the
pipeline is the fallback, not the point.

## What it knows about your project, and how

Nothing is configured. Everything is detected:

- **The layer chain** comes from your workspace manifests, or from `tsconfig`
  path aliases where libraries have no `package.json` (the normal Nx shape).
- **What each layer exports** is scanned from the source, never hand-written —
  a hand-written inventory is stale in the week it is written.
- **What "correct" is** comes from a cascade: a **pattern file** your project
  has written, then the route table it writes, then a reference screen you point
  at, then your curated rules, then Storybook, then the files next door. The
  first one that has an answer wins, and when none does the tool is silent.

**The pattern file is the one thing worth writing down.** One Markdown file per
pattern in `.ui-consistency/patterns/`, written by the agent from reading your
code and reviewed by you like any other change: a structure block, named slots
with the alternatives each allows, the props each component is written with and
by how many screens, and the rules that hold across the pattern as sentences.

Prose rather than data, because three of the things a pattern has to state
cannot be data — an alternative a slot allows, a rule no checker can evaluate,
and the reason one screen is allowed to differ. **Every statement carries its
strength**, so a family agreeing about twelve things out of thirteen is
described rather than described as disagreeing.

It is the strongest source in that cascade for the reason nothing else on the
list can match: ~~it is a *person's sentence*, written down and reviewed, rather
than a reading of the code.~~ **Once it has been reviewed.** Since #38 the tool
writes the first draft of one itself, where the project has written nothing
down about the kind — because a channel that only reports what exists opens
onto nothing on a fresh install, and the first move used to be a command
somebody had to run. Such a file carries `derived: true` and the date, states
only what was measured, and names under `## Still to be written` the three
things no extraction can produce. It is a reading of the code until somebody
answers those; the sentence above describes what it becomes, not what it starts
as, and the frontmatter is how the two are told apart.

A route table states which screens are registered together; a folder states
nothing at all. Only a pattern file says *these are one kind, and this is what
they look like*.

The facts in it are still derived every time. What is stored is the intent — the
shape, the alternatives, the rules — and the file records the date it was
observed and the screens it was read from, so anything that has moved underneath
it is reported where the pattern is used.

~~a reference screen you point at, then your curated rules, then Storybook, then
the files next door~~ — **the route table was missing from that list, and it is
the strongest member of it.** It is the one place a project *states*
which screens are siblings and what each one's path is; everything after it is
either something a person nominated or something inferred. It was absent because
the search for it once started at the repository root and stopped four
directories down — and in a monorepo every route table is five or more in, so
nothing was ever routed and the source looked as though it did not exist.

The last of those — the files next door — is the weakest and is always flagged
as a heuristic. It may *suggest*; it may never gate. That is decision 2 again,
enforced structurally rather than remembered.

## Frameworks

JSX — React, Solid, Qwik — is read with a JSX-aware parser.

Angular, Vue and Svelte templates are read too, by **one tolerant HTML parser
rather than three framework compilers**. That was measured, not assumed:
`svelte/compiler` alone bundles to 1.8 MB and `@vue/compiler-sfc` does not
bundle at all, against a plugin a hook loads on every edit. The tolerant parser
reads all three dialects with no errors and costs 172 KB.

What is lost is each framework's semantics, which no check reads. What the
checks need — elements, attributes, text — is HTML in every dialect.

**Each half is parsed by a different thing, and they fail differently.**
The template goes through the tolerant HTML parser; the `.component.ts` goes
through Babel — and Babel had no decorators plugin for a while, so *every* Angular
component was a syntax error and every module-level reading of it returned
nothing. That was wider than it sounds: the inventory is what the import and
deprecated checks stand on, so v1's whole subject was blind to Angular. Measured on a real Angular monorepo of 179 components.

**And it used to read as coverage of Angular *screens*, which it was not
.** A React screen is a file. An **Angular
screen is a pair**: `orders.component.ts` carries the identity, the imports and
the wiring — it is what a route module names — and `orders.component.html`
carries the markup. The tool read them as two unrelated candidates, so the class
had no markup to compare and the template had no identity beyond its own tags,
and on a real Angular monorepo of 179 components everything above the layer check
produced nothing at all. Either half now resolves to the same screen, from a
`templateUrl` or from an inline `template:`; a component with neither is not a
screen. Vue and Svelte were never affected — an SFC is one file.

## What this is not

- **Not a linter.** It has no opinion about your code in general.
- **Not a design-system opinion.** It enforces *your* vocabulary, whatever it
  is. Nothing about MUI, Bootstrap or anything else is hardcoded.
- **Not a formatter.** It never rewrites your code; it reports and the agent
  fixes.
- **Not a service.** No network, no telemetry, no account, no key.
- **Not for sale.** It is free and open source, and the plan is that it stays
  that way — skills and hooks are copyable text, and a licence check on
  copyable text is theatre.

## The comparison people reach for

This is meant to be to **frontend and UI** what
[superpowers](https://github.com/anthropics/claude-code) is to process: a set
of things the agent picks up automatically, that make its work match how *this*
project does things rather than how projects do things in general.

The difference is that process skills can be written once for everyone.
Design-system consistency cannot: the rules are yours, they live in your
repository, and the tool's job is to read them and hold the line — quickly,
quietly, and only when it is sure.

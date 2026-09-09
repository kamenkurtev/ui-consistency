# A pattern is the unit of knowledge

Date: 2026-09-09
Status: proposal, pending review. Tracked as #4.
Depended on by #5 (what a kind is), #6 (per-component props), #9 (when it is
written), #11 (what verifies it). Built on #10 (reading through children).

Supersedes the *stored artifact* described in
`docs/specs/2026-08-02-v2-design-system-consistency-design.md`. Everything else
in that document stands: the seven levels, the deterministic gate, the
curated-not-inferred rule.

## The unit today, and why it is the wrong one

What this tool writes down is **one screen's contract**: a JSON object naming
the holder a screen sits in, the props that holder is written with, and a few
flat lists beside it — `skeleton.regions`, `vocabulary`, `particulars.roles`.

A real project does not have one shape per screen. It has **a handful of
patterns, each reused across unrelated modules**, and every pattern is **nested
and has alternatives**. The current shape cannot express either.

Measured on a private React monorepo, 2026-09-09, with the shipped bundle at
0.14.80. Names replaced per `.claude/rules/uic-docs.md`; the counts are real.

**A pattern spans modules.** 885 components have a JSX root and 132 of those are
page screens. Clustered by structural composition they give 20 signatures which
collapse into about 6 patterns, and the largest — holder, filter bar, one grid —
appears in 9 different modules. *Which module* is an index. *Which pattern* is
the unit.

**The pattern is nested, and the contract has no nesting.** One pattern across
14 detail screens is four levels deep, and the two rules that hold across all 14
live at levels 3 and 4: an accordion holding a form opens first with its
siblings closed while an accordion holding a read-only view is open, and one
edit flag descends the whole tree, renamed at each level to whatever the child
accepts. Neither is expressible as `regions[]` plus `vocabulary[]` plus `body`.

**On the family that agrees most, the contract says almost nothing.** Nine list
screens registered beside one another, unanimous on their holder, produce a
contract with three empty arrays and one entry — the holder, with one prop value
and three prop names. The real pattern for those nine is an optional modal, then
a filter bar containing exactly one control, then exactly one content component
receiving the filter's selection, plus where state lives, where errors go and
where permissions are read. All of it derivable by reading five of the nine
files; none of it in the artifact.

## A pattern is not only a screen

The measurement above counted pages and dialogs. Those are two surfaces out of
at least eight, and the ones left out are the larger ones. Same repository,
same day:

| surface | size | described today |
| --- | --- | --- |
| pages | 132 screens | the holder only |
| dialogs | 209 usages | no — none gets a kind (#5) |
| row-action menu in a table | 103 files | no |
| dropdown menu | 32 files | no |
| primary navigation | 1 shell, 28 link usages | no |
| notifications | 292 call sites | no |
| error and loading states | 349 and 102 usages | no |
| dashboard widgets | 11 | no |

Two things follow, and they shape the format rather than merely widening it.

**The artifact must describe something that is not a screen.** The row-action
menu is written 103 times and carries a rule as load-bearing as anything in the
page patterns, stated in a comment in the code: *actions are always rendered;
permission and status toggle `disabled` only, and never remove an entry from the
menu.* A format that can only describe screens cannot hold that sentence, and it
is exactly the kind of sentence that keeps thirty files identical.

**The commonest rule on these surfaces is structural, not visual.** All three
menu surfaces declare their contents **as data rather than as markup** — a list
of `{ key, icon, label, disabled, onClick }` mapped into a component, five item
kinds in a type union, sections-and-groups in the navigation. None of that is a
holder plus regions either.

## The artifact

**One Markdown file per pattern**, in `.ui-consistency/patterns/<name>.md`,
committed to the repository.

Prose, because three of the things a pattern has to state cannot be data: an
alternative a slot allows, a rule no checker can evaluate, and the reason a
particular screen is allowed to differ. And prose because of who reads it — the
agent that writes the next screen, and the person who approves the file in a
pull request. Both read prose; neither reads a nested JSON well.

~~~~markdown
---
pattern: list-screen
surface: screen
holder: PageShell
read: 9 files, depth 2
observed: 2026-09-09
---

# List screen

## Structure

```
PageShell                          9 of 9
  FilterBar                        9 of 9
    <filter control>               exactly one; 9 of 9
  <content>                        exactly one; 9 of 9
  ConfirmDialog                    3 of 9
```

## Slots

### `<filter control>`
One of: `PeriodSelect` (5 of 9), `EntityPicker` (3 of 9), `DateRangeField` (1 of 9).
Its selection is passed to `<content>` as props, never read from a store there.

### `<content>`
One of: a grid component named `*Grid` (7 of 9), a card list named `*Cards` (2 of 9).

## Props

### `PageShell`
- `title` — 9 of 9
- `data-testid` — 9 of 9
- `breadcrumbs` — 6 of 9

### `*Grid`
- `columns` — 6 of 6
- `rows` — 6 of 6
- `density` = "compact" — 5 of 6

The sixth is a detail-panel table and is deliberate.

## Rules

- Actions are always rendered; permission and status toggle `disabled` only, and
  never remove an entry from the menu. *(stated in the code; no checker evaluates it)*
- The filter's selection descends as props. No screen of this kind reads it from
  a store below the filter bar.

## Particular to one screen

`src/pages/ReportsPage.tsx` renders a second content component. Deliberate: the
report has a summary band above the grid.

## Where it is used

`src/pages/OrdersPage.tsx`, `src/pages/InvoicesPage.tsx`,
`src/pages/CustomersPage.tsx`, `src/pages/ReportsPage.tsx`,
`src/pages/ShipmentsPage.tsx`, `src/pages/ReturnsPage.tsx`,
`src/pages/PaymentsPage.tsx`, `src/pages/SuppliersPage.tsx`,
`src/pages/ContractsPage.tsx`
~~~~

### The decisions inside that shape

**Every statement carries its strength.** `9 of 9`, `5 of 6`, `3 of 9`. Never a
statement whose strength is implied. Unanimity-only reporting meant the more
drift a family had the less was said about it — `dataTestId` at 7 of 8 was
dropped — which is the inverse of useful (#257). A slot with one dominant
alternative and two rare ones reads as exactly that.

**The structure block is the shape `uic tree` prints.** The derived reading and
the written pattern use one vocabulary, so a person comparing them is comparing
like with like, and the verifier is not translating between two notations.

**A slot is named in angle brackets and may state alternatives.** `<content>` is
a slot; `PageShell` is a component. A pattern that allows three kinds of content
must not be written as though it allows one, and a fourth kind is what the
verifier reports.

**Rules are prose and are handed over, never silently passed.** A checker that
cannot evaluate a sentence must not report the screen as matching it. It goes
into the agent's context as evidence, which is how the advisory half already
works.

**"Where it is used" is an index and not a heading, and it is complete.** A
pattern is not defined by its members; the list exists so a reader can go and
look — and because *selection and staleness both read it*. ~~An abbreviated
list is fine, since it is only an index.~~ **It is not (#19):** a truncated list
lets a screen the pattern really covers fall through to the holder match, or to
nothing where two patterns claim the holder, and reports staleness on two files
out of nine. The file is written by an agent that has just read all nine, so
completeness is free.

**The `## Props` section has a grammar, and it is the only one that does.**
*"Writes the table without `density`, which 5 of the 6 screens of this kind
write"* is the sentence the verifier exists to produce, and it cannot be
produced from prose nobody agreed the shape of. A `###` per component or slot, a
bullet per prop, the strength after a dash. Prose above and below the bullets
stays prose and is handed over with the rest — the grammar is a way in, not a
way of forbidding anything. A strength written as a count is parsed; one written
as *most screens* is kept as the sentence a person wrote, because refusing it
would make the format fight its author and pretending to have parsed it would
make the verifier invent a number.

**A slot may be a component too.** `*Grid` names a role the family fills under a
different name in every screen. Counted by name, `OrdersGrid`, `InvoicesGrid`
and `CustomersGrid` never reach a majority, and describing only what they have
in common by name describes the holder alone (#6).

### What is stored, and what is derived every time

The pattern file is **intent** — the same category as
`.ui-consistency/decisions/<kind>.md`. What the team agreed the shape is, which
slots allow what, which rules hold, which differences are deliberate.

**Counts and member lists are evidence as at a date, and are re-derived.** A
stored copy of what the code says can only be wrong; every staleness problem in
this repository came from such a copy. So the file states `observed:` and the
files it was read from, and where those have changed the pattern is reported
stale at the point it is used — never by an audit somebody must remember to run.

This is a real change from the JSON contract, which was ephemeral on purpose:
kept outside the repository, re-assembled per file, discarded. That was right
for a derived artifact and is wrong for an approved one — a thing a person
signed off in a pull request has to be the thing that is still there tomorrow.
The staleness the ephemerality was avoiding is answered by re-deriving the
facts rather than by refusing to store the intent.

### How one comes to exist

Written by **the agent, from reading the code, in one pass**, and reviewed by a
person in a pull request. Not hand-authored from a template — that is the setup
step #119 deleted and #233 replaced, and the reason is unchanged: the commonest
answer to a template is nothing. Not derived by a hand-written classifier
either: the nesting must be read from the project, and *tabs, accordions, forms*
came out of one repository and the next one nests differently.

The plugin's job is to put the facts in front of the agent — `uic tree` for the
nesting, the props matrix and the structural grouping (#7) for the agreement —
and the agent's job is to write the sentences. **No model is called from this
tool**, here as everywhere.

#9 decides *when* that happens. This document decides only what is written.

## What verifies it

`uic diff --contract` grows into a verifier that reads a pattern file and
reports, per screen, every place the screen leaves it: nesting, alternatives,
per-component props with their stated strength, and the prose rules handed over
as evidence. That is #11 and is specified there.

Two properties it must keep, because they are the reason the step exists:
silent about screens that match, and exit 1 where at least one deviates, so it
can sit in a build gate — the one place derived material is allowed to fail
something, and the one place a person has approved it.

## Migration

People have contracts saved today. The mapping is mechanical and is stated
rather than guessed:

| contract field | pattern file |
| --- | --- |
| `skeleton.holder` | the root of the structure block, and `holder:` in the frontmatter |
| `skeleton.regions`, `vocabulary` | children of the root in the structure block |
| `body` | `<content>` slot, with its `children` count as the strength |
| `configuration` | the `## Props` section |
| `avoids` | a rule: *no screen of this kind renders a raw `<table>`* |
| `particulars` | `## Particular to one screen` |
| `family` | `## Where it is used` |
| `kind`, `from` | frontmatter |

A JSON contract keeps working for one minor version, and the verifier says which
of the two it read. A silent acceptance of both forever is how everybody stays
on the old one — the lesson of `.claude/ui-consistency/` (`src/knowledge/paths.ts`),
where the fallback is kept *and reported*.

## Deliberately not in this

- **No new deterministic check.** Nothing here changes what may fail an edit. A
  pattern file is read by the verifier and by the agent; the seven checks are
  untouched.
- **No component name in the program.** The format names components because the
  *project's own file* names them. Nothing in `src/` gains a vocabulary.
- **No inference presented as a rule.** A count is evidence handed over. A screen
  that legitimately differs must read as *deliberate, and here is what differs*.
- **Not one file per screen.** A pattern with three members is one file, not
  three, and a pattern with no members yet is still valid — it is the first
  screen's decision, which `skills/decide` already covers.

## Open questions

1. **Naming.** `list-screen` is a slug somebody chooses. Two people describing
   the same pattern will name it differently, and a project with two files for
   one pattern is worse than one file. The verifier finding *no* pattern for a
   screen is the signal; whether it should also report two candidates is open.
2. **How many patterns is too many.** Six on the measured repository. A project
   that writes twenty-five has described its screens rather than its patterns,
   and nothing here detects that.
3. **Non-screen surfaces and the edit path.** A notification call site is not a
   screen and has no holder. Reading a pattern for it needs a different anchor
   than `regionsOf`, and this document does not say what it is.

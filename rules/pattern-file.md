# What a pattern file states, and how

`.ui-consistency/patterns/<name>.md`. **One Markdown file per pattern**,
committed to the repository and reviewed like code.

Prose, because three of the things a pattern has to state cannot be data: an
alternative a slot allows, a rule no checker can evaluate, and the reason a
particular screen is allowed to differ. And prose because of who reads it — the
agent that writes the next screen, and the person who approves the file in a
pull request. Both read prose; neither reads a nested JSON well.

**A pattern is not only a screen.** Pages and dialogs are two surfaces out of at
least eight, and the ones left out are the larger ones: on one real repository,
132 pages and 209 dialog usages beside a row-action menu written in 103 files, a
dropdown in 32, notifications at 292 call sites, and error and loading states at
349 and 102. So the format describes a *thing that recurs*, and the word
"screen" appears in it only where the pattern is about one.

## The shape

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


## The rules that govern that shape

**Every statement carries its strength.** `9 of 9`, `5 of 6`, `3 of 9`. Never a
statement whose strength is implied. Unanimity-only reporting meant the more
drift a family had the less was said about it — `dataTestId` at 7 of 8 was
dropped — which is the inverse of useful. A slot with one dominant
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
list is fine, since it is only an index.~~ **It is not:** a truncated list
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
in common by name describes the holder alone.

## What is stored, and what is derived every time

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

## How one comes to exist

Written by **the agent, from reading the code, in one pass**, and reviewed by a
person in a pull request. Not hand-authored from a template — that is the setup
step this project deleted once and replaced with a conversation, and the
reason is unchanged: the commonest answer to a template is nothing. Not derived by a hand-written classifier
either: the nesting must be read from the project, and *tabs, accordions, forms*
came out of one repository and the next one nests differently.

The plugin's job is to put the facts in front of the agent — `uic tree` for the
nesting, `uic props` for the agreement, `uic group` for which screens are of a
kind — and the agent's job is to write the sentences. **No model is called from
this tool**, here as everywhere.

`uic pattern <screen> --establish` writes the measured half of one: the
frontmatter, the structure block, the props with their counts and the member
list, marked `derived: true` and dated, with what no extraction can produce
named under `## Still to be written`. Answer those before building from it.

`uic pattern <screen> --refresh` brings such a file back up to date. It rewrites
what was **counted** — the frontmatter, the structure strengths, the props, the
avoided elements, the wiring, the member list — and leaves every other section
exactly as found, `## Still to be written` included, because the tool wrote that
one *and* invited a person to answer it. It refuses a file with no
`derived: true`: a person wrote that, and it has no derived half. And it derives
the family **without reading the file it is refreshing**, or the member list
would be its own family and a screen that has since joined the kind could never
enter it.

## What reads this file

`src/knowledge/pattern-file.ts` parses it, and only three parts are read as
data: the frontmatter, the structure block and the member list. Everything else
is kept as the prose it is and handed over. A file missing a section says less;
it is not invalid. A heading spelled differently is prose, not an error — a
format that fights its author is a format nobody writes.

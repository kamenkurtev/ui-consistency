---
name: pattern
description: Use before building or changing screens — a new page, a flow of pages, or the same change across many of them. Establishes what screens of this kind look like in this project (holder, region order, which component fills each role, the props every screen writes) and writes it down as a contract the work is done from. Use when a reference is named — "use OrderList.tsx as reference", "build it like this page", "same as the other screens", "follow the pattern", "make it consistent with the others" — and when a page is being implemented from a ticket, a story or a spec, because that is when the reference is decided and after it is too late. Also when a plan is being written for UI work.
---

# Establishing the pattern before writing

Nothing here judges finished code. This decides what "right" is for this kind of
screen **before** the writing, from the project's own screens, and writes it down
so it can be re-read rather than remembered.

## 0. Read the rules once

`${CLAUDE_PLUGIN_ROOT}/rules/` — once per task, not per file:

- **`anatomy.md`** — the roles a screen has, in the order they are read, each as
  a question to answer *from this project* rather than from what a screen usually
  looks like.
- **`what-a-screen-is.md`** — how many files a screen is, per framework. Read it
  before reading anything, or half the screen is missing and the half that is
  there looks empty.
- **`family-and-particulars.md`** — where a family comes from, and *reference
  minus invariant*: the explicit list of what must not be copied.
- **`roles-and-names.md`** — roles are universal, names are local, and an empty
  answer is not a clean one.
- **`routes-and-breadcrumbs.md`** — where a route and a trail come from, per
  router family. The breadcrumb is the one got wrong nearly every time.

## 0b. A named reference is not the same as a derived family

If somebody named a page — *"use `OrderList.tsx` as reference"*, or a `canon:`
line in the decisions file — **that page is the answer**. The family is read
only to tell what repeats from what belongs to that page alone. Nothing votes.

With nothing named, what comes back is statistics over what exists, and thirty
pages repeating one old mistake look exactly like thirty sharing a convention.
Still worth having — it is the same for every screen in the batch, which is what
stops drift — but say which of the two it was, because they are not worth the
same.

## 1. Find out what the family is

~~**You may not need this skill at all.** On Claude Code the hook already derives
what screens of a kind look like here and hands the agent any deviation on the
edit it is making — no command, nothing saved, nothing approved.~~

**Half of that is still true and the other half was withdrawn.** The hook does
still derive a contract on the edit it is making, and that is still nothing
saved and nothing approved. But it says so *after* the write, and the pattern
this project has written down is now put in front of the agent **before** it, on
the prompt — and where nothing has been written down about the kind, that
channel's instruction is to run this skill and write one. So this is no longer
only the deliberate form: it is also the automatic first move on a fresh
install, where a channel that merely reports what exists opens onto nothing.

### Which of the two you are in, because the first move differs

**Reached automatically** — the prompt channel said no pattern covers this kind,
or you are about to write a screen and nothing is written down about it. **Ask
the user nothing.** Take the screen being changed, or any existing screen of the
same kind, and go straight to step 2 with `--establish`. The question below is
what the automatic path exists to remove: a first move that is a question is a
first move somebody has to answer, and a fresh install stayed silent through a
full day of real UI work because nothing invited it in.

**Invoked deliberately** — somebody asked for the contract, or named a
reference. Ask for a reference screen — *"which page should this be built
like?"* — and prefer their answer to anything derived. That one sentence is what
they otherwise type fifteen times, one correction at a time, after the mistakes.

If they have no answer, take any existing screen of the kind being built. The
extractor finds the rest of the family itself — from the **route table**, which
is the only place a project *states* which screens are registered beside one
another, and from the folders around the screen when nothing routes it. In that
fallback a screen's own folder is not its family: a page and its grid, its
dialog and its hooks are one screen, not four, so the search walks out to the
pages beside it.

**And from the holder, since #35, when neither of those produces a family of the
right kind.** The folder walk collects by proximity, and in a project that gives
every screen its own folder proximity is alphabetical accident: on a
reproduction of that shape it returned 12 candidates and all 12 sat in a
different holder, so a family of 8 answered *"fewer than three screens of this
kind"*. The third channel asks the obvious question — which other screens in
this application sit in the same holder — and answers `from: 'holder'`, which is
weaker than a route table (nobody wrote it down) and stronger than a folder
(what a screen is held by is structural). It runs here and not on the edit path:
it reads files rather than directories and costs 376 ms on an 808-screen
application. It is silent where the application has no `package.json` to be
bounded by, because a family assembled across an unknown boundary is worse than
no family.

If the project has already decided — `.ui-consistency/decisions/<kind>.md`
names the canonical screen — use that and say so:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" pattern --kind detail --save
```

## 2. Extract, and write it down

**`--establish` is the one that lasts, and the one the automatic path uses.**

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" pattern <reference-screen> --establish
```

It writes `.ui-consistency/patterns/<kind>.md` — the artifact this project
commits — and prints the path. The file carries only what was measured, marked
`derived: true` and dated, and it names in `## Still to be written` the three
things no extraction can produce: which alternatives a slot allows, the rules no
checker can evaluate, and whether a screen that differs does so deliberately.
**Answer those before building from it**; a file left at the derived half is a
draft, and it says so.

It writes nothing and **exits 1** where there are fewer than three screens of
the kind, or where the file already exists. An existing pattern has been through
a pull request, and replacing a reviewed sentence with a derived one is the tool
overruling the person it works for — read it instead, and re-derive without
`--establish` if it looks stale.

Nothing about this is approval. The file is a draft in the project's own
directory; the one place derived material may fail anything is still a person
putting `uic diff --contract` in a build gate.

### `--save`, which is the ephemeral form

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" pattern <reference-screen> --save
```

It prints the path it wrote. **Use that path** — it is outside the repository,
keyed to it, and stable across turns and across subagents that start cold. A
path invented afresh each turn defeats the point of writing anything down.

Without `--save` it prints the contract as JSON, which is what to do when you
only want to look.

## 3. Read it back, and carry on

Show, in a few lines: the holder and the order of the roles, which component
fills each role, the props every screen writes, and — the part people care about
most — **what belongs to the reference page alone and must not be copied**.

If `chrome` is present, say what the layout already provides: *"your page
renders inside a layout that supplies the nav and the header — do not add
another"*. In a router-based framework that is where the header, navigation and
footer live, and a page that adds its own is the mistake.

Say which screens it was read from, so a correction is possible.

**Do not stop for approval.** Say what it found and keep going; a correction
offered is enough. The contract does not have to be *right* to do its job — it
has to be **the same** for every screen in the batch. An imperfect contract
applied uniformly still stops the twenty-seventh page drifting from the first,
and if it is wrong it is wrong in one visible way across thirty files instead of
thirty different ways.

Approval belongs where derived material would **fail** an edit, and nothing here
does. The principle is *nothing derived may fail an edit* — not *nothing derived
may be used*, which is how a manual gate ended up on a path that gates nothing.

A correction is still cheap now and expensive after thirty files, so offer it in
one sentence — *"anything wrong here?"* — and move on without waiting.

## 3b. For a new screen, settle where it goes before creating a file

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" place <an existing screen of this kind>
```

It reports how this project registers routes — the directory *is* the route, or
a table declares it and where — the path, and the trail that follows from it.
Four decisions across four files that no per-file check can see, and the
breadcrumb is the one got wrong nearly every time, because the trail lives in
the router rather than in the file being written.

`Nothing routes …` is an answer too: either the file is not a screen, or its
route is registered somewhere this cannot read — say which, rather than letting
a path be guessed from the folder name.

`path: null` with a `declaredIn` is a third answer and a real one: the table
registers this screen and states no path for it — a pathless layout route, and
no table above it was found to mount it either. The family is still the screens
that table registers; only the trail is unknown.

Or it states one and it could not be read. A path written as a constant — an
enum member, a property of a frozen object, an exported string — **is** resolved
now (#36), by value and never from the name's spelling, so an application that
keeps its paths in one enum is no longer `path: null` throughout. Where the
declaration is somewhere the reader cannot follow, or a template literal has one
part it cannot resolve, the answer stays null: a partial path presented as a
whole one is the failure this reader has already made once. `pathFromConstant`
says a path was resolved rather than read, which is worth knowing before
repeating it back to somebody.

Where the path *is* stated one table up — a routes array exported from one file
and mounted under a path in another — it is composed from there and reported as
the whole path — ~~for a screen whose own registration states no path~~
**for every entry in that table**: a mount under `orders` puts
`{ path: 'detail/:id' }` at `/orders/detail/:id`, and answering `/detail/:id`
would be the partial path this paragraph forbids. The parent and the array it
mounts may be written in one file.

Nothing partial is ever reported as whole: two tables mounting the same array
under different paths answer `path: null`, and so does a mount the search could
not finish looking for. For an entry that states a path those same refusals
leave it **exactly as the table wrote it** — refusing to compose is not refusing
to answer.

Two things are never composed on. A parent's trailing `*` is how it admits its
children, not a segment of their paths, so `{ path: 'settings/*' }` gives a child
`/settings/…` and a trail with no `*` in it. And a path the table wrote absolute
— `{ path: '/admin/audit' }` — is already whole: nothing above it applies, in a
table or in the one that mounts it.

**Three things this used to get wrong, so do not trust a remembered answer.** On a
nested table it reported a *neighbouring* entry's route — 52 invented paths out
of 117 screens on one real repository. And it was silent for every screen
in a monorepo, whatever the project had written down: the search started at the repository root and
stopped four directories down, and a route table in `libs/<area>/<pkg>/src/lib/`
is five. It now walks outward from the screen itself on a read budget, prefers
the nearest table when two name the screen, and reads Angular's
`*-routing.module.ts`. And a screen whose table is mounted elsewhere reported
`path: null` — 50 of those same 117 screens — because the two tables were never
composed. If you read this section before and concluded the project
registers its routes somewhere unreadable, or that it states no path for half
its screens, that conclusion was about the tool.

## 3c. Two fields, two questions

When reading the contract back, do not read `vocabulary` alone.

- **`vocabulary`** — what fills a *region*. Header, content, footer. A component
  that fills no named region is not here however often it appears.

  **An empty `vocabulary` is usually not a missing convention.** On the
  commonest real page shape there are no regions to fill: the header, the title
  and the breadcrumbs are in the holder's *props*, and the holder holds one
  child. Read `regionsIn` before drawing any conclusion from a blank —
  `'holder'` means *this project does not express conventions the way this field
  expects*, and what carries them instead is `configuration` on the holder and
  `body`. An empty answer meaning **"your project is outside what I
  read"** must never be reported as if it meant **"nothing was found"**.

- **`body`** — what the holder holds, in every dialect and not only JSX:
  how many components, which one where they all hold the same, and the trailing
  word they share where they share one. *"Every screen of this kind renders
  exactly one `*Grid` inside its holder"* is a real convention and it needs no
  vocabulary.
- **`configuration`** — how a *component* is written, for every component the
  family shares. This is where a `Card` repeated on every screen lives, and it
  is the level the mistakes are actually at: the right component with the wrong
  props is the commonest failure there is.

  It makes three claims, in increasing strength, and they are not the same
  claim:

  - `props` — **the same value.** `scrollable={false}` on every screen.
  - ~~`written` — **always written.** The prop is on every screen of the kind~~
    — **widened to a majority, and the count is part of the claim.**
    Unanimity meant the more drift a family already had, the *less* was said
    about it: one screen omitting a prop silenced it for the whole kind, so the
    signal was weakest exactly where a consistency tool is needed most.
    Measured on a real family of eight, `dataTestId` at 7 of 8 was dropped.

    So read `writtenBy` against `seenIn` and say what the evidence says:
    *"7 of the 8 screens of this kind write `dataTestId`; this one does not"* is
    exactly as strong as it should be, and *"every screen"* said of seven is how
    a reader opens two files, finds it false, and stops reading the rest. The
    value is each screen's own business either way.
  - `written[].shape` — **the same shape of value**, over the screens that write
    it at all, where there is one: a call
    rather than a raw string. Syntax, never meaning, so it needs no vocabulary
    — and a raw string where every sibling writes `title={t(…)}` is the
    commonest real mistake.

~~An empty `configuration` usually means the family genuinely disagrees — the
same component written three ways is not a convention, and reporting one would
be inventing it.~~

**"Usually" was wrong, and this reading has been applied to every empty contract
so far.** Until the fix, the family of a page in its own folder was that
page's own parts, so an empty `configuration` most often meant *the family was
never assembled* — a different thing, and the one that invites somebody to
conclude their project has no conventions. ~~There are now three readings~~
**four, since #41** — and they must be told apart:

- **the family disagrees** — three or more real screens, written three ways.
  A convention reported here would be invented.
- **there was no family** — fewer than three screens of the kind were found.
  `uic pattern` says so in as many words; it is not an empty contract.
- **the project states its conventions somewhere this does not read** — see the
  empty-`vocabulary` case, which is the commonest of the three on a
  holder-plus-child page.
- **it was never measured** — `propsUnmeasured` is not `null`. The props of a
  family are counted over the screens *beside* the reference, so a family of
  exactly three is asked over two, below the three it takes to tell a
  convention from a copy. The contract answered — a holder, a skeleton — and
  this one level did not, which is not the same as the family having no family.
  The field names both numbers, so one more screen of the kind is visibly what
  would answer it. **This is the reading to check first on a small project**,
  because three is the smallest family that answers at all and therefore what
  a new area has.

Say which one it is. An empty answer meaning *"your project is outside what I
read"* must never be reported as if it meant *"nothing was found"*.

## 3d. Write the pattern down where the project keeps it

The saved contract above is a working file: outside the repository, keyed to it,
gone tomorrow. That is right for something derived on the spot and wrong for
something the team agrees on. **A pattern the team keeps lives in the
repository**, as one Markdown file per pattern in
`.ui-consistency/patterns/<name>.md`, committed and reviewed in a pull request
like any other change.

Write one when the same shape is about to be applied across more than a couple
of screens, or when somebody asks what the pattern is. One file per *pattern*,
never per screen: nine list screens are one file.

Three commands supply the facts. Read them, then write the sentences — they
print facts and no judgement, and the judgement is the part that is yours:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" tree <screen> --depth 3
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" group <screens...>
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" props <Component> <screens...>
```

`tree` is what one screen renders, followed into its children — the anatomy is a
level below the file that names it, so a pattern written from the screen file
alone describes the wiring and not the screen. `group` says which screens share
a shape. `props` says which props each of them writes on a component and which
one is missing something the rest write.

The file:

~~~~markdown
---
pattern: list-screen
surface: screen
holder: PageShell
observed: <today>
---

# List screen

## Structure

```
PageShell                  9 of 9
  FilterBar                9 of 9
    <filter control>       exactly one
  <content>                exactly one
```

## Slots

### `<content>`
One of: a grid named `*Grid` (7 of 9), a card list named `*Cards` (2 of 9).

## Props

### `PageShell`
- `title` — 9 of 9
- `data-testid` — 9 of 9
- `breadcrumbs` — 6 of 9

### `*Grid`
- `columns` — 6 of 6
- `density` = "compact" — 5 of 6

## Rules

- The filter's selection descends as props; no screen reads it from a store below
  the filter bar.

## Particular to one screen

`src/pages/ReportsPage.tsx` renders a second content component. Deliberate: the
report has a summary band above the grid.

## Where it is used

`src/pages/OrdersPage.tsx`, `src/pages/InvoicesPage.tsx`, `src/pages/CustomersPage.tsx`
~~~~

Four things about writing it, and each is a way it goes wrong:

- **Every statement carries its strength.** `9 of 9`, `5 of 6`, `3 of 9`. Never a
  sentence whose strength is implied — a slot with one common alternative and two
  rare ones has to read as exactly that, and a family that agrees on twelve
  things out of thirteen is more useful described than described as disagreeing.
- **A slot is `<in angle brackets>` and may state alternatives.** A pattern that
  allows three kinds of content must not be written as though it allows one.
- **A rule is a sentence, and stays one.** *Actions are always rendered; gating
  toggles `disabled` only.* Nothing evaluates it; it is there to be read by
  whoever writes the next screen.
- **Where it is used is an index, and list every one.** The pattern is not
  defined by its members, but selection and staleness both read that list: a
  truncated one lets a screen the pattern covers fall through to a holder match
  or to nothing, and reports staleness on the files you happened to name. You
  have just read them all, so writing them all costs nothing.
- **Props go under a `###` per component, one bullet per prop, with the
  strength.** That section is the only one with a shape, because *"writes the
  table without `density`, which 5 of the 6 screens of this kind write"* cannot
  be produced from prose nobody agreed the shape of. Write a count where you
  counted; write a sentence where you did not, and it is kept as one. `*Grid`
  is a slot — the role a family fills under a different name in every screen,
  which counting by name never reaches.

Read it back with `uic patterns`, which lists what the project has and says which
files have changed since a pattern was observed. `uic patterns <screen>` answers
which pattern covers one screen — and *"no pattern covers it"* is a real answer,
not a failure: it is the signal that this is a shape nobody has written down.

## 4. Offer to write down what could not be derived

Anything the user corrects by hand is, by definition, something extraction could
not produce: which screen is the canon, which of two competing patterns they are
moving *towards* (derivation picks the older one, because it is the more
common), that the breadcrumb comes from the route rather than the title.

That belongs in `.ui-consistency/decisions/<kind>.md` — five to twenty
lines, mostly pointers, committed and reviewed like code:

```markdown
# Detail screens

canon: src/orders/OrderDetail.tsx

- The breadcrumb comes from the route hierarchy, not the page title.
- We are migrating from `@acme/legacy` to `@acme/ui`; prefer `@acme/ui`.
```

Offer it once, at the end. Written down, the same correction is never typed
again — and the contract carries those statements next time.

**Nothing else is stored.** Everything the code can say is derived afresh every
time, because a stored copy of what the code says can only be wrong.

## When the project has no layout components

`built: "markup"` means the screens are `div`s and classes — no component fills
a role because the project has none. Say that plainly rather than reading the
empty `vocabulary` and `skeleton` as agreement:

> *"These screens are built from raw markup rather than layout components, so
> there is no vocabulary to follow. What repeats here is class structure, which
> this does not read."*

An empty answer meaning **"your project is outside what I read"** must never be
reported as if it meant **"nothing was found"** — the second invites somebody to
conclude everything is fine.

## When it finds nothing

`No pattern found: fewer than three screens of this kind to compare.` is a
useful answer, not a failure. It means this screen is the first of its kind:
decide with the user what it should be, and say plainly that what is decided
here becomes the pattern the next one is measured against.

Two screens are a copy, not an agreement, which is why it will not answer from
them.

**Hand over to `ui-consistency:decide`**, which is the deciding half of that
paragraph: it walks the anatomy as questions, takes *"not applicable"* and
*"undecided"* as real answers, and writes down only what the user actually said.
This is the commonest answer on a real project, and it used to end the
interaction.

## What it will not tell you

- **`kind: null`** means the kind of screen could not be read, so the family is
  whatever sits nearby rather than screens of the same kind. Treat the answer as
  weaker and say so.
- Anything the family does not agree on is left out rather than settled by
  plurality. A role every screen fills differently states no convention, and
  reporting the commonest would enforce whichever was written first.

## Then

`ui-consistency:verify` measures the finished work against the contract you just
agreed. It is the same file, so the two halves cannot disagree about what was
decided.

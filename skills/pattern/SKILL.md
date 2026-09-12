---
name: pattern
description: Use before building or changing screens — a new page, a flow of pages, or the same change across many of them. Establishes what screens of this kind look like in this project (holder, region order, which component fills each role, the props most of them are written with) and writes it down as a pattern file the work is done from. Use when a reference is named — "use OrderList.tsx as reference", "build it like this page", "same as the other screens", "follow the pattern", "make it consistent with the others" — and when a page is being implemented from a ticket, a story or a spec, because that is when the reference is decided and after it is too late. Also when a plan is being written for UI work.
---

# Establishing the pattern before writing

Nothing here judges finished code. This decides what "right" is for this kind of
screen **before** the writing, from the project's own screens, and writes it down
so it can be re-read rather than remembered.

**You do the reading.** There was a program that derived this — 2 839 lines of
it — and it is gone (#77). It answered *"these 8 screens share `PageLayout`; 7
of 7 write `scrollable="false"`; 7 of 7 write a test id"*, which is what you
answer by opening the 8 files, with two things it could never add: **why** a
screen differs, and what a slot is allowed to hold instead.

## 0. Read the rules once — per task, not per file

`${CLAUDE_PLUGIN_ROOT}/rules/`:

- **`what-a-screen-is.md`** — how many files a screen is, per framework. Read it
  first, or half of every screen is missing and the half that is there looks
  empty.
- **`anatomy.md`** — the roles a screen has, in the order they are read, each a
  question to answer *from this project*.
- **`family-and-particulars.md`** — where a family comes from, and *reference
  minus invariant*: what must not be copied.
- **`roles-and-names.md`** — roles are universal, names are local, and an empty
  answer is not a clean one.
- **`routes-and-breadcrumbs.md`** — where a route and a trail come from. The
  breadcrumb is the one got wrong nearly every time.
- **`raw-values.md`** — applies to every line you write, whatever the kind.
- **`pattern-file.md`** — what the file you are about to write states, and how.

## 1. A named reference and a derived family are not worth the same

If somebody named a page — *"use `OrderList.tsx` as reference"*, or a `canon:`
line in `.ui-consistency/decisions/<kind>.md` — **that page is the answer.**
Frequency never enters, so the risk of enforcing the most-copied mistake is not
present at all. The family is then read only to separate what repeats from what
belongs to that page alone.

With nothing named, what you have is statistics: thirty pages sharing a
convention and thirty repeating one old mistake look identical. Still worth
having — it is the same answer for every screen in the batch, which is what
stops drift — but **say which of the two it was.**

## 2. Find the family, in this order

A family is screens **somebody stated are one kind**. Take the first channel
that answers and say which one it was:

1. **A pattern file** naming this screen. A person wrote it and a pull request
   reviewed it; nothing read off the code outranks it.
2. **The route table** — the only place a project otherwise *states* which
   screens are registered beside one another. `routes-and-breadcrumbs.md` is how
   to read one.
3. **The same holder** — which other screens in this application sit inside the
   same holder component. Weaker than a registration somebody wrote, stronger
   than a guess about folders, because what holds a screen is structural.
4. **The folders around it** — last, and the weakest.

Four things that make a family wrong rather than weak, each of which cost a real
defect:

- **A screen's own folder is not its family.** A page and its grid, its dialog
  and its hooks are one screen, not four. Nothing the screen imports may be in
  its family.
- **Bound the search to the application**, not the workspace. One app's screens
  in another app's family is a wrong answer, not a slow one — a root
  `package.json` declaring `workspaces`, or a `pnpm-workspace.yaml`, describes
  several applications and bounds nothing.
- **A folder holding a mixture is not a family.** A dialog measured against an
  amount cell, a currency field and a history tab is noise. Refuse it.
- **A hook is never a family member**, however much JSX it returns. `use`
  followed by a capital is the naming React itself enforces.

**Fewer than three screens is not a pattern.** Two are a copy, not an
agreement. Say so plainly and hand over to `ui-consistency:decide`, which is the
deciding half — it walks the anatomy as questions and writes down only what the
user actually said. This is the commonest answer on a real project: every new
area, every new project, the first page of any refactor.

## 3. Read what they agree on

The screen file is a **wiring file**. The anatomy that makes it *that kind of
screen* is one hop down, inside what it renders — classifying real screens by
what the file itself renders put 11 in the largest bucket; following one hop put
26 there. So follow what each screen *returns*, into its children, and include
content passed as **data** (`<SectionTabs tabs={tabs} />` is a leaf whose whole
anatomy sits in `tabs[].content`). A component from another package of the same
workspace is **not external**: name it, and do not descend into it — `Page /
Header / Content` is the vocabulary a pattern wants and that layout's internals
are not.

Answer, for the family:

- **the holder**, and the order of the roles inside it;
- **which component fills each role** — and where the family fills one role
  under a different name in every screen (`OrdersGrid`, `InvoicesGrid`,
  `CustomersGrid`), that shared trailing word is the project's own statement
  that they are one role. Write it as a slot, `*Grid`, and carry what those uses
  agree on. Counting by name sees none of this: none of the three reaches a
  majority, so the answer was the holder alone.
- **what the layout already provides.** *"Your page renders inside a layout that
  supplies the nav and the header — do not add another"* is the mistake worth
  most.
- **the props**, per component. **State strength as a count, never as
  unanimity.** Requiring every screen meant the more drift a family had the less
  was said about it: a prop at 7 of 8 was dropped entirely, and props are
  precisely where a family drifts. *"7 of the 8 screens write `dataTestId`; this
  one does not"* is exactly as strong as it should be; *"every screen"* said of
  seven is how a reader opens two files, finds it false, and stops reading.
  Presence and value are two claims — `data-*` and `key` count for presence and
  never for value, since writing a test id at all is a convention and its value
  is that page's own business.
- **what belongs to the reference alone** and must not be copied. People care
  about this one most.
- **the raw elements the family avoids**, where they agree on avoiding one.

## 4. Write the pattern file

`.ui-consistency/patterns/<name>.md`, following `rules/pattern-file.md`. One
file per *pattern*, never per screen: nine list screens are one file.

Write it when the same shape is about to go across more than a couple of
screens, or when somebody asks what the pattern is. Mark the frontmatter
`derived: true` with the date if you derived it and nobody has reviewed it, and
name under `## Still to be written` the three things no reading of the code can
produce: which alternatives a slot allows, the rules no checker can evaluate,
and whether a screen that differs does so deliberately. **Inventing one of those
into a file somebody is about to approve is worse than an empty section.**

List **every** screen it covers under *Where it is used*. You have just read
them all, so writing them all costs nothing — and a truncated list lets a screen
the pattern covers fall through to nothing.

**Never regenerate a file that does not say `derived: true`.** A person wrote
that one; read it instead. And when refreshing one you did derive, rewrite only
what you **counted** and leave every sentence exactly as found — `## Still to be
written` above all, because you wrote that section *and* invited a person to
answer it, and nothing in the file says whether they did.

## 5. Read it back and carry on

Show the holder, the role order, the component in each role, the props with
their counts, what the layout provides, and what is particular to the reference.
Say which screens you read it from, so a correction is possible.

**Do not stop for approval.** A correction offered is enough — say what you
found and keep going. The pattern does not have to be *right* to do its job; it
has to be **the same** for every screen in the batch. An imperfect pattern
applied uniformly still stops the twenty-seventh page drifting from the first,
and where it is wrong it is wrong in one visible way across thirty files instead
of thirty different ways. A correction is cheap now and expensive after thirty
files, so ask *"anything wrong here?"* in one sentence and move on without
waiting.

Nothing here is approval, and nothing here may **fail** anything. That was the
principle when the program did this and it is unchanged: *nothing derived may
fail an edit* — not *nothing derived may be used*, which is how a manual gate
once ended up on a path that gates nothing.

## 6. Offer to write down what could not be derived

Anything the user corrects by hand is, by definition, something no reading of the
code could produce: which screen is the canon, which of two competing patterns
they are moving *towards* (reading the code picks the older one, because it is
the more common), that the breadcrumb comes from the route rather than the title.

That goes in `.ui-consistency/decisions/<kind>.md` — five to twenty lines, mostly
pointers, committed and reviewed like code. See `rules/what-a-decision-is.md`.
Offer it once, at the end. Written down, the same correction is never typed
again.

**Nothing else is stored.** Every fact about the code is read afresh, because a
stored copy of what the code says can only be wrong — every staleness problem
this project has had came from such a copy.

## Three empty answers that are not "nothing was found"

Say which one it is. An empty answer meaning *"your project is outside what I
read"* must never be reported as if it meant *"there are no conventions here"* —
the second invites somebody to conclude everything is fine.

- **No named regions.** The commonest real page shape has none: a holder plus
  one child, with the header, the title and the breadcrumbs in the holder's
  *props*. There is nothing to fill, and the conventions are in those props and
  in what the holder holds.
- **Raw markup.** The screens are `div`s and classes; no component fills a role
  because the project has none. What repeats is class structure, which is out of
  reach of reading one file.
- **A family that genuinely disagrees.** Three or more real screens, the same
  component written three ways. A convention reported here would be invented —
  but check first that it is this and not one of the two above, or a family that
  was never assembled.

Anything the family does not agree on is left out rather than settled by
plurality: a role every screen fills differently states no convention, and
reporting the commonest would enforce whichever was written first.

## Then

`ui-consistency:screen` writes one against this. `ui-consistency:rollout` applies
it across many. `ui-consistency:verify` measures the finished work against the
same file, so the two halves cannot disagree about what was decided.

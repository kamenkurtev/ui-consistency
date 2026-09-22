# Counting: the kind, the family, the proof, the rules

Read by `finding-patterns` before any count is recorded. The order is the order
of work: the kind first, then the family, then the proof that a search can see,
then the counts.

## Which kind of page this is

The first decision, and the one that silently sets every count below it: a list
and a detail view read as one kind or as two, and the same project yields
different conventions depending on which was assumed. **Decide it deliberately,
from what the project says**, in this order:

- **What the user said.** A kind somebody named — *a list page like the orders
  one* — outranks anything you read, the same way a named reference does.
- **What the project already keeps apart.** Its own directory names, its route
  definitions, a suffix on a file name, a folder per kind. Where a project has
  separated them itself, that separation is the answer and you are reading it,
  not deciding it.
- **What the reference renders.** Two pages are of one kind when they render the
  same holders and the same regions in the same order — the tree, not the
  subject matter. Two pages about different things, built the same way, are one
  kind; a collection of rows and a single record with a submit are two, however
  close their subjects.
- **What they reach for.** Pages importing the same holder, the same layout
  piece or the same shared frame are being treated as one kind by the project
  already.

**The first signal above that answers decides it.** Where a later one disagrees —
the project's word groups two pages whose trees differ — the word still decides
the kind, since it is the project keeping them apart, and the disagreement is
said in the checklist's first line. Where the trees differ below a shared outer
holder, that is a family that differs by region: *A family that differs by
region*, below.

**Name it in the project's own word** where the project has one — the folder, the
route, what the team writes in the file name — never an invented one. **Where the
project has no word for it** — no folder, no route, no suffix, no label — name it
by what it renders, *a list with a form above it*, and say the name is yours and
not the project's.

**Where the project does not answer it**, decide it by what the pages render and
report it: *these six render the same holders and the same regions; these two do
not, and are counted as a second kind.* A tie inside the task's own reach is not
a question ([deciding.md](deciding.md)).

**Say the decision and what it covered** in the checklist's first line: the
kind, what decided it, and how many members were counted —
[checklist.md](checklist.md).

## The bound the family is counted in

Two agents reading the same reference must count the same pages, or they report
different conventions from the same code. So the bound is fixed, not chosen:

- **The application that mounts the page** — whatever routes to it or renders it
  from its entry — **and every library that application uses.** Not the library
  the reference sits in, and not the whole workspace. Where the page's library
  is mounted by several applications, the bound is each of them together, and
  the checklist says which.
- **Where the page's own library, counted alone, gives a different answer** —
  *10 of 10* inside it, *6 of 8* across the application — **both numbers go on
  the line**, and the order decides on the application's. A library unanimous
  inside itself is reported as that library's own way, never as the project's.
- **Name the bound in the checklist's first line**
  ([checklist.md](checklist.md)). A later phase handed the list counts in that
  bound, or says that it counted in another and why.

## Which pages are the family

Counts are taken over the pages of the same kind as the reference — its family.
Take the candidates, then remove what is not a member **before** counting:

- **Neither end of an import edge inside the candidates is a peer of the other.**
  What a page imports — its panels, its dialog, its hooks — is part of that page,
  not a sibling of it. And **a file that imports members of the family is not a
  member either**: a dispatcher choosing which page renders, a route table, a
  barrel, a wrapper.
- **A candidate that renders no holder and no region of the kind is not of the
  kind.** Report it as not of the kind; never count it as a member that lacks
  them.
- **State both numbers**: how many candidates were considered, how many were
  counted, and what was left out and why.

*Why:* a dispatcher counted as a page once turned 8 of 8 on every role into 8 of
9 — a unanimous convention reported as one drifting page.

## A family that differs by region

The family is not always one fact about the whole page. Members can share the
outer holder and differ below it: eight pages with the same frame, and a form
region only the reference has.

- **Decide the family per region** where the members differ by region: for each
  region, the members that render it. The outer holder is counted over all of
  them; a region only some render is counted over those.
- **A region only the reference renders** takes the branch below for that
  region alone — nothing in it is a convention — while the regions around it
  keep their counts.
- **Each checklist line carries the count that applies to it**, not the page's:
  *8 of 8* on the holder, *only the reference* on the form
  ([checklist.md](checklist.md)).

## A kind whose family has only the reference

It happens on the first page of a new kind, and on a project that has one of
everything. There is nothing to count, so **the phase does not become a phase
that found conventions.** It says so, and runs a different branch:

- **Say it**, in as many words: this kind has one member, so what the list
  carries is that page's way and not the project's — a starting point somebody
  should look at, not a counted convention.
- **Nothing in it is `<n> of <m>`.** A count over one page is not a convention;
  see *Counting honestly* below.
- **What is not particular to the kind is still counted**, over the pages nearest
  in kind and over the project: the theme and its entries, the shared pieces
  every page reuses, the spacing scale, how failures are caught and shown. Say
  which bound produced each — those numbers are the real result of such a run.
- **`Particular to the reference` cannot be separated out**, because nothing
  repeats: say that, rather than leaving the section empty as if it had been
  checked.
- **With no nearest kind either** — nothing to count anywhere — the phase's
  result is that the project has nothing to compare against yet. Say it, and ask
  nothing: there is no contradiction, only an empty project.

## Prove the search can see before trusting a count

The reference is one of the pages you count, so every search has a known answer:
it must find what the reference writes. **Run each search on the reference first.**
A search that does not find the reference is broken, and nothing it counts is a
result.

- **A count of zero for a role the reference writes is a broken search** — a wrong
  glob, a list that was never split, a pattern that does not match this dialect,
  a bound that resolved to nothing. Fix it and count again. Never record it.
- **A zero across the whole family is unverified**, not a convention. Record
  *none of them write this* only when the same search, over the same files, found
  something else — so it is known to have read them.

*Why:* a loop that ran once over the whole list instead of once per file once
reported *0 of 9* twelve times, holder included — a strong-looking convention that
was the opposite of the truth.

## Counting honestly

- **A role is a component plus where it stands.** Count per position, never per
  component alone: 10 of 18 buttons full-width reads as no rule, and was 10 of 10
  in the content area and 0 of 4 in toolbars.
- **What the component comes out as is counted too**, per position and with its
  file spread, and so is the heading level where the position is a heading —
  [elements.md](elements.md).
- **A count carries its spread.** Four identical buttons, all in one file, are
  one page's habit; 10 of 10 across 8 files is a convention. Write both numbers.
  **The spread is counted in members**: a page and the files only it imports —
  its grid, its panels — are one member, however many files they span. Say so
  where a member spans files.
- **A missing prop is not yet a deviation.** Check the theme and the project's
  wrappers first: either may set it already.
- **Search for the exact name.** A container whose name starts with the
  component's once turned 18 uses into 25.
- **A count over a family of one is never a convention.** *1 of 1* says only
  that the page you read writes it. Write it as what the reference does, and say
  the family has no other members — never as what the project does. It is the
  narrowest case of the rule below.

## A position no member has

The task adds something the family has never written at this position — a
second control where every member has one, a control nobody has here.

- **Widen in steps, and keep each count apart**: first the neighbouring position
  in the family — what fills the positions beside it — then the same control at
  other positions across the bound. Report each count separately; never blend
  them into one number that reads as a convention at this position.
- **Two controls at one position** are ordered as the family orders two
  controls wherever it has them — the same kind of position elsewhere in the
  bound. With nowhere to read it from, the existing control keeps its place and
  the new one follows it in reading order; say that is what decided it.
- **With nothing anywhere**, the order's last line applies: build it the
  plainest way the technology allows, and say so
  ([deciding.md](deciding.md), *What this does not decide*).

## When a count is not a convention at all

*2 of 8* is a number, and written the way every other count is written it reads
as a rule. It is not one, and recording it as one is how a project with no
convention acquires a wrong one — from this tool, in writing.

Read it off the numbers themselves. **Never a threshold from outside**: no
percentage, no "most", nothing this file could be wrong about on the next
project.

- **Count the ways, not only the commonest.** A position is *4 of 4*, or *3 of 4
  and one other way*, or *3, 3 and 2 across three ways*. The last is a plurality,
  and a plurality is not a majority.
- **The test is whether the rest can be named.** If you can write *all of them
  except `<page>`*, there is a convention and that page is the exception. If you
  have to write *some do this, some do that, some do the third*, there is none.
- **The commonest way must outnumber the others put together.** Where it does
  not, say the family has no convention here and give every way with its
  numbers. That is arithmetic on what you counted, not a rule brought in.
- **A convention with several different exceptions is a family drifting**, not a
  rule with deviations. Say which it is: *the commonest way, 5 of 8, against
  three others* is a different finding from *7 of 8 except `<page>`*.

**The order still decides.** Nothing stalls and nothing extra is asked: the
newest members, then the reference, settle what to write — [deciding.md](deciding.md).
What changes is the reporting. The line says *no convention here; the two newest
write it this way*, so nobody reads a number as a rule the project does not
have.

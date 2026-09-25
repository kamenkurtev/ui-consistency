---
name: conventions
description: For what the end user sees — counts what a project's pages do, so a convention is told from one page's habit. The kind of page, the family and its bound, proof that a search can see, and when a count is a convention. Use when a count of how the other pages write something is about to be recorded, or when a checker recounts a line of a checklist.
---

# Conventions: the kind, the family, the proof, the counts

## Overview

Counts what the project's pages do, in the order of the work: the kind first,
then the family, then the proof that a search can see, then the counts.

**Open a linked file when you reach the part that names it, never before** —
whatever the request that handed you this skill says about its links. A part you
reach without having opened its file is not done.

## Which kind of page this is

Decide it first: it silently sets every count below it. A list and a detail view
read as one kind or as two, and the same project yields different conventions
depending on which was assumed.

**Decide it deliberately, from what the project says**, in this order:

- **What the user said.** A kind somebody named — *a list page like the orders
  one* — outranks anything you read, the way a named reference does.
- **What the project already keeps apart**: its own directory names, its route
  definitions, a suffix on a file name, a folder per kind. Where the project has
  separated them itself, that separation is the answer.
- **What the reference renders.** Two pages are one kind when they render the
  same holders and the same regions in the same order — the tree, not the
  subject matter. Two pages about different things, built the same way, are one
  kind; a collection of rows and a single record with a submit are two, however
  close their subjects.
- **What they reach for.** Pages importing the same holder, the same layout piece
  or the same shared frame are treated as one kind by the project already.

Then:

- **The first signal above that answers decides it.**
- If a later signal disagrees — the project's word groups two pages whose trees
  differ — the word still decides, since it is the project keeping them apart.
  Say the disagreement in the checklist's first line.
- If the trees differ below a shared outer holder, it is a family that differs by
  region — *A family that differs by region*, below.
- **Name the kind in the project's own word** — the folder, the route, what the
  team writes in the file name. Never an invented one.
- If the project has no word for it — no folder, no route, no suffix, no label —
  name it by what it renders, *a list with a form above it*, and say the name is
  yours and not the project's.
- If the project does not answer it, decide it by what the pages render and
  report it: *these six render the same holders and the same regions; these two
  do not, and are counted as a second kind.*
- A tie inside what this task touches is not a question ([decisions](../decisions/SKILL.md)).
- **Say the decision and what it covered** in the checklist's first line: the
  kind, what decided it, and how many members of how many candidates were
  counted — [checklist.md](../finding-patterns/checklist.md).

## The bound the family is counted in

The bound is fixed, not chosen, so two agents reading the same reference count
the same pages.

- **The bound is the application that mounts the page** — whatever routes to it
  or renders it from its entry — **and every library that application uses.**
  Not the library the reference sits in, and not the whole workspace.
- If the page's library is mounted by several applications, the bound is all of
  them together, and the checklist says which.
- If the page's own library, counted alone, gives a different answer — *10 of 10*
  inside it, *6 of 8* across the application — **put both numbers on the line**,
  and decide by the order on the application's.
- Report a library unanimous inside itself as that library's own way, never as
  the project's.
- **Name the bound in the checklist's first line** ([checklist.md](../finding-patterns/checklist.md)).
- A later phase handed the checklist counts in that bound, or says that it
  counted in another and why.

## Which pages are the family

Count over the pages of the same kind as the reference — its family. Take the
candidates, then remove what is not a member **before** counting:

- **Neither end of an import edge inside the candidates is a peer of the other.**
  What a page imports — its panels, its dialog, its hooks — is part of that page,
  not a sibling of it.
- **A file that imports members of the family is not a member either**: a
  dispatcher choosing which page renders, a route table, a barrel, a wrapper.
- **A candidate that renders no holder and no region of the kind is not of the
  kind.** Report it as not of the kind; never count it as a member that lacks
  them.
- **State both numbers**: how many candidates were considered, how many were
  counted, and what was left out and why.

*Why:* a dispatcher counted as a page once turned 8 of 8 on every role into 8 of
9 — a unanimous convention reported as one drifting page.

## A family that differs by region

Members can share the outer holder and differ below it: eight pages with the
same frame, and a form region only the reference has.

- **If the members differ by region, decide the family per region**: for each
  region, the members that render it.
- Count the outer holder over all of them; count a region only some render over
  those.
- **A region only the reference renders** takes the branch below for that region
  alone — nothing in it is a convention — while the regions around it keep their
  counts.
- **Each checklist line carries the count that applies to it**, not the page's:
  *8 of 8* on the holder, *only the reference* on the form
  ([checklist.md](../finding-patterns/checklist.md)).

## A kind whose family has only the reference

There is nothing to count, so **do not report it as a phase that found
conventions.** Say so, and run this branch:

- **Say it**, in as many words: this kind has one member, so what the checklist
  carries is that page's way and not the project's — a starting point somebody
  should look at, not a counted convention.
- **Write nothing in it as `<n> of <m>`** — *Counting honestly*, below.
- **Still count what is not particular to the kind**, over the pages nearest in
  kind and over the project: the theme and its entries, the shared pieces every
  page reuses, the spacing scale, how failures are caught and shown.
- Say which bound produced each — those numbers are the real result of such a
  run.
- **Say that `Particular to the reference` cannot be separated out**, because
  nothing repeats, rather than leaving the section empty as if it had been
  checked.
- **If there is no nearest kind either** — nothing to count anywhere — the result
  is that the project has nothing to compare against yet. Say it, and ask
  nothing: there is no contradiction, only an empty project.

## Prove the search can see before trusting a count

The reference is one of the pages you count, so every search has a known answer:
it must find what the reference writes.

- **Run each search on the reference first.** A search that does not find the
  reference is broken, and nothing it counts is a result.
- **A count of zero for a role the reference writes is a broken search** — a
  wrong glob, a list that was never split, a pattern that does not match this
  dialect, a bound that resolved to nothing. Fix it and count again. Never
  record it.
- **A zero across the whole family is unverified**, not a convention. Record
  *none of them write this* only when the same search, over the same files, found
  something else — so it is known to have read them.

*Why:* a loop that ran once over the whole list instead of once per file once
reported *0 of 9* twelve times, holder included — a strong-looking convention that
was the opposite of the truth.

## Counting honestly

- **Count per position** ([words.md](../finding-patterns/words.md)), never per component alone: 10
  of 18 buttons full-width reads as no rule, and was 10 of 10 in the content area
  and 0 of 4 in toolbars.
- **Count *whether* apart from *which way*.** At each position, first count how
  many members have the role at all. Then, over the members that have it, count
  which way each writes it.
- *None* answers *whether*; it is never one of the ways. *14 of 21 filter; of
  those 14, 10 through the shared toggle and 4 by hand* — not *10, 4 and 7
  across three ways*.
- **Count what the component comes out as too**, per position and with its file
  spread, and the heading level where the position is a heading —
  [values](../values/SKILL.md), *Elements*.
- **A count carries its spread.** Four identical buttons, all in one file, are
  one page's habit; 10 of 10 across 8 files is a convention. Write both numbers.
- **Count the spread in members**: a page and the files only it imports — its
  grid, its panels — are one member, however many files they span. Say so where
  a member spans files.
- **A missing prop is not yet a deviation.** Check the theme and the project's
  wrappers first: either may set it already.
- **Search for the exact name.** A container whose name starts with the
  component's once turned 18 uses into 25.
- **A count over a family of one is never a convention.** *1 of 1* says only
  that the page you read writes it. Write it as what the reference does, and say
  the family has no other members — never as what the project does.

## A position no member has

The task adds something the family has never written at this position — a
second control where every member has one, a control nobody has here.

- **Widen in steps, and keep each count apart**: first the neighbouring position
  in the family — what fills the positions beside it — then the same control at
  other positions across the bound.
- Report each count separately; never blend them into one number that reads as
  a convention at this position.
- **Order two controls at one position** the way the family orders two controls
  wherever it has them — the same kind of position elsewhere in the bound.
- If there is nowhere to read that from, the existing control keeps its place and
  the new one follows it in reading order; say that is what decided it.
- **If there is nothing anywhere**, the order's last line applies: build it the
  plainest way the technology allows, and say so ([decisions](../decisions/SKILL.md),
  *What this does not decide*).

## When a count is not a convention at all

*2 of 8* is a number, and written the way every other count is written it reads
as a rule. It is not one.

- **Read it off the numbers themselves.** Never a threshold from outside: no
  percentage, no "most".
- **Count the ways, not only the commonest**, over the members that have the
  role. A position is *4 of 4*, or *3 of 4 and one other way*, or *3, 3 and 2
  across three ways*. The last is a plurality, and a plurality is not a
  majority.
- **The test is whether the rest can be named.** If you can write *all of them
  except `<page>`*, there is a convention and that page is the exception. If you
  have to write *some do this, some do that, some do the third*, there is none.
- **The commonest way must outnumber the others put together.** If it does not,
  say the family has no convention here and give every way with its numbers.
- **A convention with several different exceptions is a family drifting**, not a
  rule with deviations. Say which it is: *the commonest way, 5 of 8, against
  three others* is a different finding from *7 of 8 except `<page>`*.
- **The order still decides**, and nothing stalls or is asked: with no majority,
  the newest members settle what the levels above them did not —
  [decisions](../decisions/SKILL.md).
- Only the reporting changes. The line says *no convention here; the two newest
  write it this way*.

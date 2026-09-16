# The pattern file

`.ui-consistency/patterns/<kind>.md` — one per kind of page, not per page.
Committed and reviewed like code. `finding-patterns` writes it; `planning`,
`implementing` and `verifying` read it.

If one already exists for this kind, read it first and update only what you
counted; never overwrite what the user decided.

## The shape

````markdown
---
kind: <the project's own word for this kind of page>
decided-by: <what settled the kind — the user, how the project itself keeps them apart, what the reference renders>
reference: <path to the reference page>
theme: <the theme that applies and the projects in its reach; for a shared layer, every theme that renders it>
read: <how many pages, components and shared files were read; sampled or not>
family: <n counted of m considered; the files counted as this kind, what was left out and why, including what was judged another kind>
observed: <date>
---

# <Kind of page>

## Tree

```
<page holder>         as <element>                          — <n of m>, <files>, <bound>
  <header>            as <element>
    <toolbar>         as <element>
      <title>         as <element>, <heading level>         — <n of m>, <files>, <bound>
  <content area>      as <element>
    <form>            as <element>  <validation approach>    — <n of m>, <files>, <bound>
      <field>         as <element>  <how it is written>      — <n of m>, <files>, <bound>
    <submit button>   as <element>  <how it is written>      — <n of m>, <files>, <bound>
```

Each line is a position: the project's component at that role, what it comes out
as, and how it is written. Where the project writes the markup directly the two
are one thing and one column says it — [elements.md](elements.md).

## Reused

- <concern>: <the project's shared piece> — <files>

## Values

- <which values come from where in the theme>

## Spacing

- scale: <unit and multiples in use> — read from <the mechanism>
- <role> to <role> — <gap> — <n of m>, <files>
- gap owned by: <margin, padding or container gap — or mixed>

## Accessibility

- threshold: <the project's, and where it is stated — or the named default>
- <foreground> on <surface> — <ratio> light, <ratio> dark — <files>
- focus: <how the family shows it, and where it sends it> — <n of m>, <files>
- <field> to its label: <the mechanism the family uses> — <n of m>, <files>
- text for what has no words: <how the family gives it> — <n of m>, <files>
- target size: <role> — <size> — <n of m>, <files>
- unevaluated: <what could not be evaluated, per subject, and why>

## Open questions

- <a contradiction, with its counts and files>
- <a proposal, and where it would go>

## Decided

- <what was asked, and what the user answered>

## Particular to the reference

- <what only the reference has, not copied>
- <the reference's literal values, not copied>
````

Every count carries its spread — how many files — and the bound that produced it:
the project, or the theme and the projects in its reach.

## The kind, and a kind with one member

`kind` is the project's own word for it, `decided-by` says what settled it, and
`family` says which files were counted as it. The kind is the first decision the
phase makes and it sets every count below it, so a file that does not say what
decided it cannot be reviewed — how it is decided is in
[counting.md](counting.md).

**Where the family has no other members**, the file says so in as many words:
this kind has one member, so what is here is that page's way and not the
project's. Nothing in it is written as `<n> of <m>`, `Particular to the
reference` says that nothing could be separated out, and what was counted over
the nearest kinds or over the whole project says which bound produced it.

## Open questions and Decided

**Every question is written down before it is answered**, under `## Open
questions`, with its counts:

- a contradiction found and not yet answered goes there — not into `Decided`,
  and never dropped;
- a proposal made and not yet accepted or declined goes there — not into
  `Reused`.

When the user answers, the question **moves** into `Decided` with the answer; a
declined proposal moves there as declined. Nothing else writes to `Decided`:
inventing an answer into it is worse than leaving it empty.

**With nobody there to answer** — a run nobody is watching — write every question
under `Open questions`, pick no side, and end the phase by reporting them as its
result. An unanswered question is the most valuable thing this phase finds: the
place the project has not decided. A pattern file that drops it looks complete
and is silent exactly where the next page will drift.

## Particular to the reference

What only the reference has, and the reference's literal values. Listed so they
are not copied: `implementing` leaves them out and
`verifying` reports a page that copied one.

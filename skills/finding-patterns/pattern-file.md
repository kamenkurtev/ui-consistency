# The pattern file

`.ui-consistency/patterns/<kind>.md` — one per kind of page, not per page.
Committed and reviewed like code. `finding-patterns` writes it;
`planning`, `implementing` and
`verifying` read it.

If one already exists for this kind, read it first and update only what you
counted; never overwrite what the user decided.

## The shape

````markdown
---
kind: <kind of page>
reference: <path to the reference page>
theme: <the theme that applies and the projects in its reach; for a shared layer, every theme that renders it>
read: <how many pages, components and shared files were read; sampled or not>
family: <n counted of m considered; what was left out and why>
observed: <date>
---

# <Kind of page>

## Tree

```
<page holder>
  <header> > <toolbar> > <title>
  <content area>
    <form>              <validation approach>     — <n of m>, <files>, <bound>
      <field>           <how it is written>       — <n of m>, <files>, <bound>
    <submit button>     <how it is written>       — <n of m>, <files>, <bound>
```

## Reused

- <concern>: <the project's shared piece> — <files>

## Values

- <which values come from where in the theme>

## Spacing

- scale: <unit and multiples in use> — read from <the mechanism>
- <role> to <role> — <gap> — <n of m>, <files>
- gap owned by: <margin, padding or container gap — or mixed>

## Contrast

- threshold: <the project's, and where it is stated — or the named default>
- <foreground> on <surface> — <ratio> light, <ratio> dark — <files>
- unevaluated: <pairs whose surface could not be resolved, and why>

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

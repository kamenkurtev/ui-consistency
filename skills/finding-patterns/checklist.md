# The checklist

**Read when:** writing the checklist (`finding-patterns` step 8), building
against it (`implementing`) or walking it (`verifying`).

A checklist is **the page's own tree turned into questions, in the order the
page is read.**

It belongs to the task. It goes into the task in the plan, or into the document
the process already running keeps, and where there is neither it lives in the
turn and goes with it. **Nothing measured is written to a file that outlives the
work.**

## The shape

````markdown
<page> against <kind> (<what decided the kind>) — from <reference>, <n> of <m>
members in <the bound: the application, and its libraries>, read <date>

- [ ] <role> — <the project's piece>, <how it is written> — <what settled it>
- [ ] <role> — <the project's piece>, <how it is written> — <what settled it>
- [ ] not copied from <reference>: <what is particular to it; and anything it
      hand-writes that the project has a shared piece for>
````

One line per position, in the order the page is read: the outermost holder
first, then inward and left to right, then what the user sees happen —
[SKILL.md](SKILL.md) step 2. The first line's *n of m* is the family of the page;
**a line whose region has a family of its own carries that count instead** —
[counting.md](counting.md).

An example, filled in:

````markdown
returns against list page (all five render a toolbar and a table of rows, and
src/pages keeps them together) — from orders, 4 of 5 members in the app,
read 2026-09-17

- [ ] page holder — the shared page holder, as its own landmark — 4 of 4, 4 files
- [ ] toolbar in the header, title one level down — 4 of 4, 4 files
- [ ] rows — the shared table, row height on the base — 4 of 4, 4 files
- [ ] form — validated through the shared helper, not its own — the shared piece,
      against the copy in shipments
- [ ] field — label tied to it, error under it, through the shared field — 8 of 8
- [ ] submit — the shared button, full-width, in the content area — the majority,
      3 of 4 across 4 files
- [ ] request failure — the shared error helper, not a new message box — 3 of 4
- [ ] colour and spacing through the theme; no literal, nothing off the base
- [ ] not copied from orders: its title text, the margin only it has, and its
      own error box — the project has a shared error helper
````

## Every item carries how, not whether

*Is the button there* gets ticked without looking. **The project's own piece, how
it is written, and what settled it** cannot be ticked without opening the page.

**The tail of an item is the report.** The level of the order that settled it and
the numbers under it — *the majority, 3 of 4 across 4 files*, *the shared piece,
against the copy in <page>*, *as asked* — so walking the checklist is also reading
every decision that was made ([deciding.md](deciding.md)).

**Where the family has no convention at a position**, the line says that instead
of carrying a number that reads as one: *no convention — three ways across 8
files; the two newest write it this way* ([counting.md](counting.md)).

**Where a design gave the tree**, the line says which half came from where — *the
design puts a filter row above the table; the family writes one as 4 of 4* — so
a reader can tell what was drawn from what was counted
([design.md](design.md)).

## Eight to twelve items

Keep to the positions that carry something: a piece the project shares, a
convention with a count behind it, and what must not be copied.

**What to leave out when it will not fit**: anything the technology gives for
free, anything identical in every page of every kind, and any position where the
family has no convention — say that last one out loud instead of listing it.
**Except the positions the task changes**: a position the work exists to settle
stays on the checklist, as *no convention*, whatever else is left out.

## Walked by somebody else

The agent that wrote the page does not tick its own checklist.
`ui-consistency:verifying` walks it, and what it cannot judge it names rather
than ticking.

## A snapshot, and the code wins

The first line says when it was read. Where the checklist and the code disagree,
the code is right and the checklist is taken again — never argued with the copy in hand.

That first line and the short body are also what make it **the extract a task
carries out of the repository**: what a task takes with it, and who decides that
it goes, is [plan-file.md](../planning/plan-file.md).

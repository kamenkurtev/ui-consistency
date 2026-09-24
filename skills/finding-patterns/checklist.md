# The checklist

**Read when:** writing the checklist (`finding-patterns` step 8), building
against it (`implementing`) or walking it (`verifying`).

A checklist is **the page's own tree turned into questions, in the order the
page is read.**

- It belongs to the task: put it into the task in the plan, or into the document
  the process already running keeps.
- Where there is neither, it lives in the turn and goes with it.
- **Write nothing measured to a file that outlives the work.**

## The shape

````markdown
<page> against <kind> (<what decided the kind>) — from <reference>, <n> members
of <m> candidates in <the bound: the application, and its libraries>, read <date>

- [ ] <role> — <the project's piece>, <how it is written> — <what settled it>
- [ ] <role> — <the project's piece>, <how it is written> — <what settled it>
- [ ] not copied from <reference>: <what is particular to it; and anything it
      hand-writes that the project has a shared piece for>
````

- One line per position, in the order the page is read: the outermost holder
  first, then inward and left to right, then what the user sees happen —
  [SKILL.md](SKILL.md) step 2.
- The first line's *<n> members of <m> candidates*: n is the family counted, m the
  pages considered before non-members were removed
  ([counting.md](counting.md), *Which pages are the family*).
- A line's own count is over that position in the members — *4 of 4* pages, or
  *8 of 8* fields where each page has two. **A line whose region has a family of
  its own carries that count instead** — [counting.md](counting.md).

An example, filled in:

````markdown
returns against list page (all five render a toolbar and a table of rows, and
src/pages keeps them together) — from orders, 4 members of 5 candidates in the
app, read 2026-09-17

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

- **End each item with the report**: the level of the order that settled it and
  the numbers under it — *the majority, 3 of 4 across 4 files*, *the shared
  piece, against the copy in <page>*, *as asked*. Walking the checklist is then
  also reading every decision that was made ([deciding.md](deciding.md)).
- **If the family is split on whether the role is there at all**, the line
  carries both decisions: *present — the majority, 6 of 8; through the shared
  date picker — the shared piece* ([counting.md](counting.md), *Counting honestly*).
- **If the family has no convention at a position**, say that on the line instead
  of a number that reads as one: *no convention — three ways across 8 files; the
  two newest write it this way* ([counting.md](counting.md)).
- **If a design gave the tree**, say on the line which half came from where —
  *the design puts a filter row above the table; the family writes one as 4 of
  4* — so a reader can tell what was drawn from what was counted
  ([design.md](design.md)).

## Eight to twelve items

- Keep to the positions that carry something: a piece the project shares, a
  convention with a count behind it, and what must not be copied.
- **If it will not fit, leave out** anything the technology gives for free,
  anything identical in every page of every kind, and any position where the
  family has no convention.
- If a position with no convention is left out for room, say so out loud.
- **Keep every position the task changes**: a position the work exists to settle
  stays on the checklist, as *no convention*, whatever else is left out.

## Walked by somebody else

- The agent that wrote the page does not tick its own checklist.
- `ui-consistency:verifying` walks it, and names what it cannot judge rather than
  ticking it.

## A snapshot, and the code wins

- The first line says when it was read.
- If the checklist and the code disagree, the code is right: work the checklist
  out again from the code, never argue with the copy in hand.
- That first line and the short body make it **the extract a task carries out of
  the repository**. What a task takes with it, and who decides that it goes, is
  [plan-file.md](../planning/plan-file.md).

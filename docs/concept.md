# The concept

*What this is, why it is shaped this way, and what it refuses to do.*

## The problem

An agent writing UI knows frameworks and component libraries in general. It does
not know **this project**, so it writes pages that work and look wrong:

- the right button, with the wrong variant, size, colour or styles, because it
  never looked at how that button is written in that place on the other pages;
- its own form validation, where the project validates with a library on almost
  every page;
- a new way of catching and showing an error, on every page it writes;
- a literal colour or margin, where the project has a theme;
- a snippet pasted again, where it should have become a component.

Every one of those renders and passes review. Every one is a small, permanent
divergence: the next page is copied from this one.

**This is not a code quality problem.** Linters and type checkers pass on all of
it. It is a *consistency with this project* problem, and the answer lives only in
the repository and in the team's head.

## What was tried first

Tell the agent. A thirty-page refactor with a plan naming exactly which
components to use — and the pages still came out different. A plan is text, and
nothing checked page fifteen against it.

Then programs: parsers, checks, inventories. They became thousands of lines that
kept being wrong on the next project, and debugging them replaced the work they
were meant to support.

## The shape

**Skills the developer's own agent follows, and nothing else.** The agent already
reads code. The skills say how to look — in what order, what to count, what to
ask — and the agent looks with its own tools.

The work goes through four phases, the same whether a planning process such as
superpowers is running or not:

1. **Establish** — read a reference page top to bottom and left to right, search
   what the other pages reuse and how, take values from the theme, ask once, and
   write a pattern file.
2. **Plan** — one task per page, each carrying what makes it checkable.
3. **Build** — one page at a time, in a fresh context, from the pattern file.
4. **Verify** — a separate agent compares each page with the reference, region by
   region, and then the whole set.

With another process running, each phase adds to that process's spec and plan
rather than starting a second one. It tells by what exists on disk, not by which
plugins are installed.

## The ideas everything else follows from

### Roles are universal; names are local

A page has a holder, a header, a content area, fields, a submit button, a way of
showing a failure. Every technology has those roles, and every technology fills
them with different pieces — a framework component, a custom element, a partial,
a block of markup with a shared class. So the skills name roles and read what
fills them from the project. A project of plain HTML and CSS goes through the
same phases.

### A named reference outranks a count

Eight pages sharing a convention and eight pages sharing a mistake look
identical to a counter. So the user names the page to follow, and counting only
separates what repeats from what belongs to that page alone. Counts are honest
only with two more facts:

- **where the component stands** — in one app, 10 of 18 buttons were full-width,
  which reads as no rule; by position it was 10 of 10 in the content area and 0
  of 4 in toolbars;
- **how many files** — four identical buttons in one file are one page's habit.

### Ask only what the project does not answer

Where the reference and the rest of the project agree, the agent takes the answer
and says so. It asks once, and only about contradictions and proposals. A tool
that interrogates gets switched off.

### A plan carries its check

What failed before was a plan with nothing closing the loop. Here every page task
carries the pattern file, what not to copy, and a check by an agent that did not
write the page — and that checker first proves it can see, on a copy of the
reference with one difference planted.

### Silence is never success

"It found nothing" can mean the pages match, or that nothing was looked at. Every
phase says what it read, whether it sampled, and what it could not interpret.

## What it writes down

- **A pattern file** per kind of page — `.ui-consistency/patterns/<kind>.md`: the
  role tree with counts and files, what is reused, where values come from, what
  the user decided, what belongs to the reference alone.
- **A plan** — `.ui-consistency/plans/<topic>.md`, only when no other process
  wrote one.

## What this is not

- **Not a linter.** It has no opinion about your code in general.
- **Not a design-system opinion.** It follows *your* vocabulary.
- **Not a gate.** Nothing fails a build.
- **Not a program.** No parser, no network, no telemetry, no account, no key.
- **Not for sale.** Free and open source.

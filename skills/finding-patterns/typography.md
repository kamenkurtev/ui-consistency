# Typography: the roles, the bundle, how the style is applied

**Read when:** recording how the family sets its text (`finding-patterns` step
6), or writing or checking any text on a page (`implementing`, `verifying`).

## The type roles

Read them from the project, never decide them for it. The positions where text
stands: the page's own title, a section heading, body text, a label, helper
text, an error, a caption, a number in a column. **Record the ones this project
has, and what it calls them** — a project with no caption has no caption.

**When to use which is what the counts answer.** Record each type role against
the position in the tree where the family writes it, with its file spread — *the
page title is the theme's largest step in 5 of 5 across 5 files*.

## The bundle, per role

Record all of it, per role, and never one part alone: **size, weight, line
height, letter spacing, typeface, case.** A page that takes the size and misses
the weight is the ordinary failure, and a count of sizes alone cannot see it.

- **Where a part is set nowhere**, it is inherited: say so and from where.
- **Where it cannot be resolved** — a stylesheet you could not read, a piece
  from outside the project — say the part is unevaluated. Never assume the
  usual one.

## How the style is applied

Counted per position, with its file spread, like everything else: a named entry
in the theme, a shared class, a shared component that carries it, or a style
written by hand on the element.

**A style written by hand where the others use the shared one is reported even
when the value it produces is right.** It is right today, it stops being right
the moment the shared one moves, and the next page is copied from it.

## The scale is derived

- **Derive it from the values the project keeps**, in the order spacing already
  uses: the theme's named sizes first, then the shared classes, and the literals
  in pages only where the project keeps its values nowhere —
  [spacing.md](spacing.md).
- **Two findings, not one.** **Off the scale** is a deviation: report it with
  the nearest steps on either side. **On the scale but not in use** is **not
  wrong** — say what it is, with the steps the family does write and their file
  spread.
- **Where the sizes share no scale**, the finding is that the project has none.
  Say so rather than promoting the most frequent size into a rule.

## The unit

Record the unit the sizes are written in, and **say whether it follows the
reader's own text setting** — a fact about the project, not a verdict.

## What it lives beside

- **Spacing** owns the base, the gaps between roles, and the heights of
  controls, rows and bars — [spacing.md](spacing.md). **The line height belongs
  to a type role and is recorded here**; whether the space *around* a block of
  text stands on the base is spacing's question.
- **The standards** are `ui-consistency:accessibility`
  ([SKILL.md](../accessibility/SKILL.md)): whether text can be read at all — its
  contrast against what is behind it — is judged there, and only when
  accessibility is asked for or the project states a requirement. Nothing in
  this file carries a number the project did not produce.

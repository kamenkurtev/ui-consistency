# Elements: what fills a role, and at which heading level

Read by `finding-patterns` when it records what the family writes at each
position, and by `implementing` and `verifying` for every position in the tree.

A **role** is a position in the tree — the thing the page needs at that place.
It is never an attribute a technology happens to spell the same way; such an
attribute is part of **how the element is written**, not the position itself.

The component at a position is counted already. What that component comes out as
is not — so a clickable thing that is not the project's button, a page with no
outermost holder of its own, and a heading level picked at random pass every
phase unseen.

## What to record

- **The element per role** — what the family actually writes at that position:
  the tag, the native widget, the primitive the framework renders. Where a
  shared component fills the role, the element is the one that component
  renders: read it there once and record it against the component, not against
  every page that uses it. **Where the project writes the markup directly**, the
  component and the element are the same thing and saying it once is enough —
  this is for the projects where a name in the tree tells you nothing about what
  reaches the page.
- **Count it per position, with its file spread**, like everything else — *the
  submit button is the project's own button piece, which comes out as a button,
  in 6 of 6 across 6 files.*
- **The holders too.** What the family writes as the outermost holder of a page,
  as the region that holds the page's own content, as one row of a collection.
  These are the positions nobody looks at, and the ones a new page invents.
- **Where the element cannot be read** — a piece from outside the project whose
  insides are not in the repository — say it is unevaluated. Never assume the
  obvious one.

## Heading levels

Count the level the family writes **per position**, with its file spread: the
page's own title, a section heading, the title inside a card or a dialog. *The
page title is one level in 5 of 5 files; a section heading is the next in 9 of
10.*

- A level is a convention like any other. Report a page that writes a different
  one at the same position, with what the others write there.
- **Where the family disagrees with itself**, that is the finding: it goes under
  `Open questions` with its counts, and no level is picked for the project.
- **Where the level comes from a shared component**, record it against that
  component. A page that writes its own heading beside the shared one is the
  drift this counts.

## This measures nothing against a standard

Everything here is counted from the family — it is a convention, the way a
component or a prop is one. Whether markup is right against an external standard
is not this file's question and never becomes it: what a person can read, reach
and use is `ui-consistency:accessibility`
([SKILL.md](../accessibility/SKILL.md)), which says which standard it uses as a
default and where.

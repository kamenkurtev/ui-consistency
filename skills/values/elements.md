# Elements: what fills a role, and at which heading level

**Read when:** recording what the family writes at each position
(`finding-patterns`), or writing or checking any position in the tree
(`implementing`, `verifying`).

Role, position, component and element are as [words.md](../finding-patterns/words.md) defines them.

## What to record

- **The element per role** — what the family actually writes at that position:
  the tag, the native widget, the primitive the framework renders.
- If a shared component fills the role, the element is the one that component
  renders: read it there once, and record it against the component, not against
  every page that uses it.
- **If the project writes the markup directly**, the component and the element
  are the same thing: say it once. This file is for the projects where a name in
  the tree tells you nothing about what reaches the page.
- **Count it per position, with its file spread**, like everything else — *the
  submit button is the project's own button piece, which comes out as a button,
  in 6 of 6 across 6 files.*
- **The holders too**: what the family writes as the outermost holder of a page,
  as the region that holds the page's own content, as one row of a collection.
  Nobody looks at these positions, and a new page invents them.
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
- **If the family disagrees with itself**, the order settles it — the majority
  with its spread, and only where there is none, the newest members
  ([decisions](../decisions/SKILL.md)). Say which level of the order did.
- Never pick a heading level silently.
- **If the level comes from a shared component**, record it against that
  component. A page that writes its own heading beside the shared one is the
  drift this counts.

## This measures nothing against a standard

Everything here is counted from the family — it is a convention, the way a
component or a prop is one. Whether a person can read, reach and use what the
element renders is not this file's question: that is
`ui-consistency:accessibility` ([accessibility](../accessibility/SKILL.md)), when it
is asked for or the project requires it, and it says which standard it uses.

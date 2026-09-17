# Themes: the boundary and the entries that must exist

Read by `finding-patterns` before anything is counted, and by `implementing`
and `verifying` for every value that names a theme entry.

## The project and the theme are two boundaries

- **The project boundary** is the application the page belongs to and the
  libraries it uses — in a monorepo, not the whole workspace. Anything the theme
  does not define is counted inside it: which component fills a role, what it is
  passed, what the page reuses.
- **The theme boundary** is every project that selects the same theme. A value
  that names a theme entry — a palette colour, a variant, a size or spacing
  token — is counted across the theme's reach: all the projects that select it,
  and only those.
- **The two cross in both directions.** Several projects can share one theme:
  bounded per project, one convention is counted as several local habits, each
  with a smaller spread. And one shared layer renders under several themes.
- **Find the theme that applies** by following how the application selects it —
  the provider, factory or import at its root — not by listing the themes the
  workspace has. Presets are alternatives unless the code says one extends
  another: an entry defined in one is not inherited by the rest.
- **A file in a shared layer has no theme of its own.** It renders under every
  theme whose projects use it; its theme-defined values are checked against
  each of them.
- **Each count says which bound produced it** — the project, or the theme and
  the projects in its reach.

## A theme entry must exist

- **A value that names a theme entry must exist in the theme that applies** — for
  a file in a shared layer, in every theme that renders it. The type system
  usually accepts it anyway, nothing fails at runtime, and it renders as
  nothing: on one real workspace about 100 call sites wrote a colour their
  theme did not define, beside 31 correct ones under another theme. Counted
  across the workspace it read as a unanimous 131 of 131.
  **A value a theme does not define is never written as a convention.** Adding
  an entry to a theme changes code outside the task, so this is one of the few
  things that reaches a person ([deciding.md](deciding.md)): report it with the
  theme it is missing from and the files that write it, and the choice between
  adding the entry and changing the usages.
- **Nothing in the file shows this; only the theme does.** Where the theme that
  applies could not be resolved, say the values are unchecked. Silence about
  them is not a pass.

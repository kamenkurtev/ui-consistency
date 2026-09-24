# Themes: the bound and the entries that must exist

**Read when:** before anything is counted (`finding-patterns` step 3), or
writing or checking any value that names a theme entry (`implementing`,
`verifying`).

## The bound and the theme's reach

- **The bound** is the application the page belongs to and the libraries it
  uses — in a monorepo, not the whole workspace ([counting.md](counting.md),
  *The bound the family is counted in*).
- Count inside it anything the theme does not define: which component fills a
  role, what it is passed, what the page reuses.
- **It is the application, never the library the reference happens to live in.**
- **The theme's reach** is every project that selects the same theme. Count a
  value that names a theme entry — a palette colour, a variant, a size or
  spacing token — across it: all the projects that select the theme, and only
  those.
- **The two cross in both directions.** Several projects can share one theme:
  bounded per project, one convention is counted as several local habits, each
  with a smaller spread. And one shared layer renders under several themes.
- **Find the theme that applies** by following how the application selects it —
  the provider, factory or import at its root — not by listing the themes the
  workspace has.
- Treat presets as alternatives unless the code says one extends another: an
  entry defined in one is not inherited by the rest.
- **A file in a shared layer has no theme of its own.** It renders under every
  theme whose projects use it; its theme-defined values are checked against
  each of them.
- **Each count says what produced it** — the bound, or the theme's reach.

## A theme entry must exist

- **A value that names a theme entry must exist in the theme that applies** — for
  a file in a shared layer, in every theme that renders it.
- The type system usually accepts a missing one anyway, nothing fails at
  runtime, and it renders as nothing: on one real workspace about 100 call sites
  wrote a colour their theme did not define, beside 31 correct ones under
  another theme. Counted across the workspace it read as a unanimous 131 of 131.
- **Never write a value a theme does not define as a convention.**
- Adding an entry to a theme changes code outside the task, so it is a proposal
  ([deciding.md](deciding.md)): report the theme it is missing from, the files
  that write it, and the choice between adding the entry and changing the
  usages.
- **Nothing in the file shows this; only the theme does.** Where the theme that
  applies could not be resolved, say the values are unchecked.

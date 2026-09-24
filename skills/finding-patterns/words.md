# What the words mean

**Read when:** `finding-patterns` step 2, or in any phase where one of these
words needs its meaning.

Every technology builds a page with different pieces, so the skills name roles
and read what fills each from the project. Plain HTML and CSS go through the same
steps.

- **Role** — what the page needs at a place in its tree: page holder, header,
  toolbar, content area, field, submit button, the project's shared error
  helper. Never an attribute a technology happens to spell the same way; that
  attribute is part of how the element is written.
- **Position** — a role where it stands. The submit button in the content area
  and the submit button in a toolbar are one role at two positions. Counts are
  taken per position.
- **Holder** — a region that frames other roles: the page holder, a header, a
  toolbar, a sidebar, the content area, a footer, a dialog frame.
- **Region** — a part of the page that holds roles: a holder, a form, a dialog. A small change touches one region of one page.
- **Component** — whatever the project builds as a unit, reused or not: a
  framework component, a custom element, a partial or include, a block of markup
  with a shared class.
- **Shared piece** — anything the project reuses across pages for one concern:
  a component, a helper, a class. *The project's own piece* for a role is the
  shared piece its pages reach for there.
- **Element** — what that component comes out as at that position: the tag, the
  native widget, the primitive the framework renders. Where one piece is both —
  the project reuses the framework's own element or directive as its unit, and
  nothing wraps it — record it once, as that piece, and say the component and
  the element are the same; do not invent a split to fill both columns.
- **How it is written** — everything passed to it and everything that styles it.
- **Workspace** — the whole repository. In a monorepo it holds several areas.
- **Area** — one app, library or package of the workspace.
- **Shared layer** — the area whose pieces the other areas import: a shared or
  core library.
- **Bound** — the application that mounts the page and every library it uses:
  where the family is counted ([counting.md](counting.md), *The bound the family
  is counted in*).
- **Kind** — what the page the task builds or changes is, decided before
  counting: a list, a detail view, a form. A named reference settles it
  ([counting.md](counting.md), *Which kind of page this is*).
- **Family** — the pages of that kind, the reference among them; the counts are
  taken over it. Where members differ below a shared holder, a region has its own family:
  the members that render it ([counting.md](counting.md), *A family that differs
  by region*).
- **Member**, **candidate** — a page of the family; a page considered before
  non-members are removed ([counting.md](counting.md), *Which pages are the
  family*).
- **Convention** — what the family writes at a position, by a majority with its
  spread ([counting.md](counting.md), *When a count is not a convention at
  all*).
- **The theme** — wherever shared values live: a theme object, custom
  properties, preprocessor variables, a shared stylesheet, a config file.
- **Validation** — a library, or the platform's own form attributes.
- **The checklist** — the page's tree turned into questions, carried by the task
  ([checklist.md](checklist.md)).

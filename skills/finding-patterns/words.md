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
- **Region** — a part of the page that holds roles: a holder, the content area,
  a form, a dialog. A small change touches one region of one page.
- **Component** — whatever the project reuses as a unit: a framework component,
  a custom element, a partial or include, a block of markup with a shared class.
- **Element** — what that component comes out as at that position: the tag, the
  native widget, the primitive the framework renders. Where one piece is both —
  the project reuses the framework's own element or directive as its unit, and
  nothing wraps it — record it once, as that piece, and say the component and
  the element are the same; do not invent a split to fill both columns.
- **How it is written** — everything passed to it.
- **The theme** — wherever shared values live: a theme object, custom
  properties, preprocessor variables, a shared stylesheet, a config file.
- **Validation** — a library, or the platform's own form attributes.
- **The checklist** — the page's tree turned into questions, carried by the task
  ([checklist.md](checklist.md)).

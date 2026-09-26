# What the words mean

**Read when:** `finding-patterns` step 2, or in any phase where one of these
words needs its meaning.

Every technology builds a page with different pieces, plain HTML and CSS
included, so the skills name roles and read what fills each from the project.

- **Role** — what the page needs at a place in its tree: page holder, header,
  toolbar, content area, field, submit button, the project's shared error
  helper. Never an attribute a technology happens to spell the same way; that
  attribute is part of how the element is written.
- **Position** — a role where it stands. The submit button in the content area
  and the submit button in a toolbar are one role at two positions. Counts are
  taken per position.
- **Holder** — a region that frames other roles: the page holder, a header, a
  toolbar, a sidebar, the content area, a footer, a dialog frame.
- **Shared piece** — anything the project reuses across pages for one concern:
  a component, a helper, a class. *The project's own piece* for a role is the
  shared piece its pages reach for there.
- **Area** — one app, library or package of the repository.
- **Shared layer** — the area whose pieces the other areas import: a shared or
  core library.
- **Bound** — defined in `ui-consistency:conventions`, *The bound the family is
  counted in*.
- **Shape** — which roles a page has, in what order, and what each shows.
- **Design** — where a page's shape comes from when it is not a page already
  built: a picture, a described screen, a prototype, or a tree a person agreed
  (`ui-consistency:design`). Its values never count.
- **Kind** — what the page the task builds or changes is — a list, a detail
  view, a form — decided before counting (`ui-consistency:conventions`, *Which
  kind of page this is*).
- **Family** — the pages of that kind, the reference among them; the counts are
  taken over it. Where members differ below a shared holder, a region has its
  own family (`ui-consistency:conventions`, *A family that differs by region*).
- **Member**, **candidate** — a page of the family; a page considered before
  non-members are removed (`ui-consistency:conventions`, *Which pages are the
  family*).
- **Convention** — what the family writes at a position, by a majority with its
  spread (`ui-consistency:conventions`, *When a count is not a convention at
  all*).

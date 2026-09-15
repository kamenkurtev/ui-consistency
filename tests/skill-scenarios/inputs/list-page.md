---
kind: list page
reference: src/pages/orders.js
theme: src/theme/theme.css — the only theme, used by every page
read: 5 page files, 2 shared modules, 2 stylesheets; not sampled
family: 4 counted of 5 considered; src/pages/index.js imports the pages and is not one
observed: 2026-09-15
---

# List page

## Tree

```
main.page.stack-3                                     — 4 of 4, 4 files, project
  header.toolbar
    h1                                                — 4 of 4
    button.btn.btn--ghost                             — 4 of 4, 4 files, project
  section[data-role=list]                             — 4 of 4
  form.stack-2[data-role=create]                      — 4 of 4
    label.field > input + span.field__error  ×2       — 8 of 8, 4 files, copied
    button.btn.btn--primary.btn--block[type=submit]   — 3 of 4, 4 files, project
```

## Reused

- Validation: `validateForm` and `showFieldErrors` from `src/shared/validate.js` — 3 of 4 files
- Request failure: `showError` from `src/shared/notify.js` — 3 of 4 files

## Values

- Colour through `--color-*` in `theme.css`; no literal colours.

## Spacing

- scale: 4, 8, 16, 24 — read from `--space-1…4` in `theme.css` and the `stack-*` classes
- page padding `--space-4`; section to section `--space-3`; field to field `--space-2` — 4 of 4 files
- gap owned by: the container, through `stack-*`

## Contrast

- threshold: none stated in the project; default WCAG 2.2 AA — 4.5:1 text, 3:1 non-text
- body text on surface 14.76:1; primary button text 6.27:1; field error 5.62:1

## Open questions

- Extract the field, copied 8 times in 4 files, into a shared piece? — proposal

## Decided

## Particular to the reference

list page (all five render the page holder, a toolbar and a table of rows, and
`src/pages/` keeps them together) — from `src/pages/orders.js`, 4 of 5 members,
read 2026-09-17

- [ ] page holder — `main.page.stack-3`, outer padding `--space-4` — 4 of 4, 4 files
- [ ] header — `header.toolbar`, holding the title and one ghost button — 4 of 4, 4 files
- [ ] title — `h1`, one level down — 4 of 4, 4 files
- [ ] list — `section[data-role=list]`, section to section `--space-3` — 4 of 4, 4 files
- [ ] form — `form.stack-2[data-role=create]`, validated through `validateForm`
      and `showFieldErrors` from `src/shared/validate.js`, not its own — 3 of 4, 4 files
- [ ] field ×2 — `label.field > input + span.field__error`, field to field
      `--space-2` — 8 of 8, 4 files; copied into every page rather than shared
- [ ] submit — `button.btn.btn--primary.btn--block[type=submit]` — the majority,
      3 of 4 across 4 files
- [ ] request failure — `showError` from `src/shared/notify.js`, not a new
      message box — 3 of 4, 4 files
- [ ] colour through `--color-*` in `theme.css`; no literal; every gap a multiple
      of 4, from `--space-1…4` and the `stack-*` classes
- [ ] contrast against WCAG 2.2 AA as the default, nothing stated in the project:
      body on surface 14.76:1, primary button text 6.27:1, field error 5.62:1
- [ ] not copied from `orders.js`: nothing of its own, and nothing it
      hand-writes that the project shares

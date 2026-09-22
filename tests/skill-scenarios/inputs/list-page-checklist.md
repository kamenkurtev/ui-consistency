list page (all five render the page holder, a toolbar and a table of rows, and
`src/pages/` keeps them together) — from `src/pages/orders.js`, 4 of 5 members in the app,
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
- [ ] colour pairings the family uses: body on surface, primary button text,
      field error on surface — no standard measured, none asked for or stated
- [ ] not copied from `orders.js`: nothing of its own, and nothing it
      hand-writes that the project shares

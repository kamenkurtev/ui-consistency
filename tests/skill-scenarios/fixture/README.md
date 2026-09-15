# Fixture: a small order-management app

Plain HTML, CSS and ES modules, no framework and no build. It exists to be **read**
by an agent running a skill scenario, not to be run.

Every page in `src/pages/` renders one screen of the same kind — a list with a
toolbar and a form. The drift planted in it is listed in `../DRIFT.md`, which a
scenario's agent must never be shown.

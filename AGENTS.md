# AGENTS.md

Instructions for an agent working **in this repository** — changing the plugin,
not using it. What the plugin tells an agent writing somebody's UI is
`USING.md`; do not follow it here, since nothing in this repository is a page.

The full instructions are `CLAUDE.md` and the three rule files it imports,
`.claude/rules/uic-docs.md`, `uic-git.md` and `uic-pr.md`. **Read all four
before the first change.** What follows are the rules that do damage when
missed, so that a harness which reads only this file still has them.

## Before any change

- **Never commit to `main`.** Every change starts as an issue with acceptance
  criteria, on a branch named `<username>/<issue-number>-<short-description>`,
  and reaches `main` only through a pull request.
- **`npm run gate`** is the bar — typecheck, build, stale bundle, version check,
  tests, plugin validate. Nothing is reviewed on a red gate.
- **A change that ships bumps the version, in the same pull request.** Touching
  `src/`, `bin/`, `hooks/`, `skills/` or `.claude-plugin/` without moving the
  version fails the gate. `npm run bump` (`minor` / `major` when it is more than
  a fix) moves every file that carries it; the new version gets an entry in
  `CHANGELOG.md`.
- **The reviews, in order, every time:** gate, simplification, gate again if it
  changed anything, correctness, security, the documents read against the
  change, gate again. The pull request body says what each found — "found
  nothing" is a result. The full order is `uic-pr.md`.

## Names from private repositories

This plugin is run against private repositories. **The numbers from those runs
may be written down; the names may not** — not in a file, an issue, a pull
request body, a comment or a commit message. Rename every project-specific
identifier to a neutral one of the same shape (`OrdersGrid`, `app-orders-grid`)
before it is written anywhere. Nothing public says anything about where or how
the owner works. `tests/private-names.test.ts` checks tracked files; nothing
checks an issue or a pull request, so reread the exact text before sending it.
The rule is `uic-docs.md`.

## What the project is

Skills and nothing else; the only code is the session hook. No scripts or
parsers for analysis, and no framework's or library's component name anywhere
in the skills — they name roles. Why is `CLAUDE.md`, then `docs/concept.md`.

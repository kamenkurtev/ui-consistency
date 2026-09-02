# Git rules

## Every change starts as an issue
- **Open the issue before the branch exists**, and put it on the board in `Todo`.
  The branch is named after it, the PR references it, and it closes when the PR
  merges.
- This is not ceremony. The board is the only place that shows what was decided
  and why without reading the diff, and the branch naming below already assumes
  an issue number exists.
- **No issue needed** for a change made *inside* an issue already in progress and
  covered by its scope — a typo in the code you just wrote does not need its own
  number.
- If the work turns out bigger than the issue it started under, **open a new one**
  rather than widening the old one silently.
- Work that starts as "while I'm here" is exactly what this rule is for. The
  version bump that decided whether a day of fixes reached anyone shipped with no
  issue behind it (#35).

## Branches
- **Never commit directly to `main`.** Always branch first.
- **Branch naming:** `<username>/<issue-number>-<short-description>`
  - Example: `kkurtev/1-contract-extraction`
  - Lowercase, words separated by `-`, keep the description short.
- One logical change per branch — don't mix unrelated work.

## Commits
- Write clear, imperative messages: `Extract prop conventions from reference`, not `fixed stuff`.
- Reference the issue when relevant (e.g. `#1`).
- Commit or push only when the user asks.

## Versions
- **A change that ships bumps the version, in the same PR.** An installed plugin
  updates when `plugin.json` names a new version, not when the code changes — so
  a merge without a bump reaches nobody who already installed it, and nothing
  fails to say so.
- `npm run bump` (`minor` / `major` when it is more than a fix) moves every file
  that carries the version. Do not edit them by hand.
- ~~all three files that carry the version~~ — **seven, since the Codex, Cursor
  and Gemini manifests arrived.** The figure was right when it was written and
  is quoted in `scripts/bump.mjs` as well; both are corrected. Only
  `.claude-plugin/plugin.json` is read when a plugin updates, so the other six
  drift with nothing to complain — which is the whole reason the script exists.
- The gate enforces this: a branch touching `src/`, `bin/`, `hooks/`, `skills/`
  or `.claude-plugin/` while leaving the version where `main` has it fails. Docs,
  tests and rules alone need no bump.
- Writing it here was not enough on its own — it was missed twice in one day
  before the gate existed (#36, #43).

## Pull requests
- Open a PR against `main`; don't merge without review.
- Before opening a PR, the full gate must pass. (Defined once the toolchain exists — see #2.)

## Cleanup
- After a branch is merged, delete it **only on the remote** (`origin`).
- **Keep the local branch** — never run `git branch -d` locally for cleanup.

## Project board
Work is tracked on GitHub Project #3 (`Todo` / `In Progress` / `Test` / `Done`).

- **When you start working on an issue, move it to `In Progress`.** Do this before the first commit, not after.
- **When its PR is merged, close the issue and move it to `Done`.** Both — a closed issue left in `Todo` is as misleading as an open one sitting in `Done`.
- Every issue you open goes on the board, in `Todo`.
- If only part of an issue shipped, don't move it to `Done`. Either leave it where it is, or split the remainder into a new issue and close the original — whichever the user prefers.
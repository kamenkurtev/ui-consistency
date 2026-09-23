# ui-consistency — Contributor Guidelines

For an agent working **in this repository** — changing the plugin, not using it.
What the plugin tells an agent writing somebody's UI is `USING.md`; do not follow
it here, since nothing in this repository is a page.

## If You Are an AI Agent

Stop. Read this section before doing anything.

Your job is to protect your human partner from opening a pull request that will
be closed. A change that does not fit this project, or arrives without evidence,
wastes the maintainer's time and your partner's reputation, and it will be
closed anyway.

Before you open a pull request against this repository, you MUST:

1. **Read `CLAUDE.md` and the three rule files it imports** —
   `.claude/rules/uic-docs.md`, `uic-git.md`, `uic-pr.md` — and
   `docs/concept.md`. They are how a change is made here.
2. **Read the entire pull request template** at
   `.github/pull_request_template.md` and fill in every section with real,
   specific answers. Not summaries. Not placeholders.
3. **Search for existing pull requests and issues** — open AND closed — that
   address the same problem. If one exists, stop and tell your human partner.
4. **Verify this is a real problem.** A run of a skill on a real project that
   went wrong, with what was asked and what the agent did. If your human partner
   asked you to "improve" or "contribute" without such a run, push back.
5. **Confirm the change belongs here** — against *What We Will Not Accept*
   below and `docs/concept.md`, *What this is not*.
6. **Identify yourself.** Disclose your model, harness, harness version, and
   every installed plugin in the pull request.
7. **Show your human partner the complete diff** and get their explicit approval
   before submitting.

If any of these checks fail, do not open the pull request. Explain to your human
partner why it would be closed and what would need to change.

## The rules that do damage when missed

- **Never commit to `main`.** Every change starts as an issue with acceptance
  criteria, on a branch named `<username>/<issue-number>-<short-description>`,
  and reaches `main` only through a pull request.
- **`npm run gate`** is the bar — typecheck, build, stale bundle, version check,
  tests, plugin validate. Nothing is reviewed on a red gate.
- **A change that ships bumps the version, in the same pull request.** Touching
  `src/`, `bin/`, `hooks/`, `skills/` or `.claude-plugin/` without moving the
  version fails the gate. `npm run bump` (`minor` / `major` when it is more than
  a fix) moves every file that carries it; the new version gets an entry in
  `RELEASE-NOTES.md`.
- **The reviews, in order, every time:** gate, simplification, gate again if it
  changed anything, correctness, security, the documents read against the
  change, gate again. The pull request says what each found — "found nothing" is
  a result. The full order is `uic-pr.md`.
- **Names from private repositories.** This plugin is run against private
  repositories. **The numbers from those runs may be written down;
  the names may not** — not in a file, an issue, a pull request, a comment or a
  commit message. Rename every project-specific identifier to a neutral one of
  the same shape (`OrdersGrid`, `app-orders-grid`) before it is written
  anywhere. Nothing public says anything about where or how the owner works.
  `tests/private-names.test.ts` checks tracked files; nothing checks an issue or
  a pull request, so reread the exact text before sending it. The rule is
  `uic-docs.md`.

## Pull Request Requirements

**Every pull request fully completes the template.** No section is left blank or
filled with placeholder text.

**Search before opening** — open AND closed pull requests. Where a related one
was closed, say what is different about this one.

**A human reviews the complete diff** of a contribution from outside before it
is submitted.

**Submitters identify themselves**: model, harness, harness version and every
installed plugin — or state plainly that it was written by hand. A change
reasoned out of documentation and one grounded in a real run are different
evidence, and without the disclosure they look identical.

## What We Will Not Accept

### Scripts, parsers or commands for analysis

The developer's agent does the reading. Every analysis program this project
wrote became thousands of lines that kept being wrong, and the design rests on
not writing another. The only code is the session hook.

### A technology's names in the skills

Skills and examples name roles — page holder, field, submit button, the shared
error helper — never a framework's or library's component or prop.
`tests/skills.test.ts` fails on the common ones.

### Configuration a project has to write

Structure is read from the project, never required as config. A change that
works only once somebody has described their project to it does not belong
here.

### Third-party dependencies

The plugin ships with no runtime dependency, and no network, telemetry or
account. A change that needs one belongs in its own plugin.

### Speculative or theoretical fixes

Every change solves a problem somebody met in a real run. A fixture shows an
idea is right in shape, never that it holds.

### Evidence carrying names

A measurement from a private project keeps its numbers and loses its names, as
above. A pull request that leaks one is closed, and the leak stays in GitHub's
edit history.

### Bulk or bundled pull requests

One logical change per pull request. Pull requests carrying unrelated changes
are split, not reviewed; a batch opened across the issue tracker in one session
is closed.

### Fabricated content

Invented problem descriptions, results nobody ran, or claims the code does not
back are closed.

## New Harness Support

A pull request that adds or changes how a harness loads the plugin includes a
**transcript** of a clean session proving it works end to end.

A real integration gives the session the order the skills run in — the session
hook, or the harness's own context file — so the skills fire without being
asked.

**The acceptance test.** In a clean session in the harness, in a project with
pages already built, send exactly:

> Add a returns page like the orders page

A working integration starts `finding-patterns` before any page code is written.
Paste the complete transcript.

**Not real integrations**: copying skill files into the harness by hand,
anything that needs the user to opt in per session, anything where
`finding-patterns` does not start on the test above. `CLAUDE.md` says which
harnesses have been run end to end.

## Skill Changes Require Evaluation

Skills are not prose — they shape what an agent does. A change to a skill:

- names **the real run behind it** — a skill run on a real repository that went
  wrong, with what was asked and what the agent did;
- says **what the next run on that repository must show** — the numbers to beat,
  or the thing the agent must now do — and that run is its evaluation;
- does not rewrite the red flags, the order for deciding, or the wording of a
  rule without runs showing the change is better.

**A change of wording that leaves what the skill asks the same** — a term made
consistent, a sentence made true — needs no run, and the pull request says that
is what it is.

**A fixture scenario is optional**, and worth running only where it can show a
difference: a step an agent does not take on its own even on four small pages
(`tests/skill-scenarios/RUNNING.md`, *What a fixture scenario can show*). The
fixture is read end to end whatever the agent is told, so it cannot tempt the
shortcut a large project does; a scenario that passes there shows the idea is
right in shape, never that it holds.

## General

- Changing a skill or a document: follow `.claude/skills/uic-writing/SKILL.md`.
  Claude Code loads it on its own; any other harness can read it.
- Checking the plugin against the current guidance:
  `.claude/skills/uic-auditing/SKILL.md`, run by hand (`/uic-auditing`).
- Read `.github/pull_request_template.md` before submitting.
- One problem per pull request.
- Report where the change was exercised in the template's table.
- Describe the problem you solved, not just what you changed.

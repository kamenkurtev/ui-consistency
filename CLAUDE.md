# CLAUDE.md

## What this is

A plugin — Claude Code first, with manifests for Codex, Cursor and Gemini CLI —
that makes the pages an agent writes look and behave like the ones the project
already has: the right component written the way the other pages write it, the
project's own validation and error handling, values from the theme, repeated
code turned into components.

It is **skills and nothing else**. The only code is the session hook.

Read before proposing anything: `docs/concept.md`, then `skills/`.

## Layout

- `skills/` — `establishing-patterns`, `planning-with-patterns`,
  `building-with-patterns`, `verifying-against-patterns`. Each is reached by its
  `description`, in any language.
- `AGENTS.md` — the same instructions for harnesses that read that file instead
  of hooks.
- `src/` → `bin/uic.mjs` — one command, `uic session`, run by the `SessionStart`
  hook (`hooks/hooks.json`). It tells the session which skills a job takes and in
  what order. `UIC_OFF` silences it.
- `.ui-consistency/` — where a project's `patterns/` and `plans/` live;
  `.claude/ui-consistency/` is still read as a fallback and reported when used.

**Nothing may assume a hook is running.** Claude Code runs the session hook;
Cursor has a session-hook manifest that has not been run end to end; Codex and
Gemini CLI read `AGENTS.md` instead.

The private `kamenkurtev/ui-consistency-archive` holds the history before this
repository's single root commit, and the old tracker. Issue numbers here point
to this repository only — both trackers start at 1.

## What the design rests on

1. **The developer's agent does the reading.** No scripts, parsers or commands
   for analysis. Every analysis program this project wrote became thousands of
   lines that kept being wrong.
2. **Roles, never names.** Skills and examples say *page holder, field, submit
   button, the shared error helper*. No framework's or library's component or
   prop name — every technology builds a page differently.
3. **Universal.** Any UI technology, including plain HTML and CSS; a single app
   or a monorepo. Structure is read from the project, never required as config.
4. **A named reference outranks a count, and a count carries its spread** — where
   the component stands, and in how many files.
5. **Ask once, only about contradictions and proposals.**
6. **Join the process that is running.** A spec or plan that already exists is
   added to, not duplicated. Without one, the skills run the four phases
   themselves.
7. **A plan carries its check.** Every page task names the pattern file and is
   verified by an agent that did not write it, after that agent proves it catches
   a planted difference.
8. **Silence is never success.** Every phase says what it read and what it could
   not.
9. **Free.** No licence checks, telemetry or paywalls.

## Working here

- The skills are validated on real projects, not fixtures; what fails comes back
  as issues. A fixture shows an idea is right in shape, never that it holds.
- Designs and plans go on the issue, not into `docs/`.
- `tests/names.test.ts` fails on a skill or command named in `skills/` that does
  not exist. `tests/packaging.test.ts` fails on a library component name in the
  skills or `AGENTS.md`. `tests/private-names.test.ts` fails on private names
  (see `uic-docs.md`).
- `npm run gate` before any PR.

## Rules

Detailed rules live in `.claude/rules/`, each prefixed `uic-`:

@.claude/rules/uic-docs.md
@.claude/rules/uic-git.md
@.claude/rules/uic-pr.md

# CLAUDE.md

## What this is

A plugin — Claude Code first, with manifests for Codex, Cursor and Gemini CLI —
that brings **Design-Driven Development** to an agent writing UI: what the end
user sees drives the code, so a page comes out consistent and right while it is
being written rather than corrected afterwards. In practice that means the right
component written the way the other pages write it, the project's own validation
and error handling, values from the theme, repeated code turned into components.

**The design is read wherever it lives** — a design for the page, the theme and
its tokens, or the pages already built, which is the usual case.

It is **skills and nothing else**. The only code is the session hook.

It does one thing and joins whatever else is running. Another process keeps the
plan, the tests and the logic; this one makes what the end user sees come out
like the rest, so nobody opens the page afterwards and fixes it by hand. **It
writes no tests and never starts a test suite.**

Read before proposing anything: `docs/concept.md`, then `skills/`.

## Layout

- `skills/` — the four phases, `finding-patterns`, `planning`, `implementing`,
  `verifying`, and one subject, `accessibility`, asked on its own or reached
  from a phase. Each is reached by its `description`, in any language. **A phase
  is a gerund with no object, a subject skill is a noun** — that is how the two
  kinds are told apart in a listing. The plugin's own name carries the domain,
  so no skill name repeats it; where a harness shows no namespace the
  description carries the whole weight, so it says in its first words that the
  work is what an end user sees.
- `USING.md` — what the plugin tells a user's agent: which skills a job takes,
  in what order. The session hook says the same, and a harness with no hook
  loads this file instead (Gemini CLI's manifest names it).
- `AGENTS.md` — the instructions for an agent working **in this repository**,
  for harnesses that read it instead of this file: the rules that do damage
  when missed, and a pointer here.
- `src/` → `bin/uic.mjs` — one command, `uic session`, run by the `SessionStart`
  hook (`hooks/hooks.json`). It tells the session which skills a job takes and in
  what order. `UIC_OFF` silences it.
- `.ui-consistency/` — where a project's `plans/` live, and nothing else: what a
  task counted goes with the task. `.claude/ui-consistency/` is still read as a
  fallback and reported when used.

**Nothing may assume a hook is running.** Claude Code runs the session hook, and
is the only harness run end to end. Cursor has a session-hook manifest that has
not been. Gemini CLI loads `USING.md` through its manifest, not run end to end.
Codex gets the skills from its manifest, and nothing puts `USING.md` where it
reads instructions — the README tells a user to copy it; not run end to end.

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
5. **It decides and reports; it does not interrogate.** A written order settles
   what a count alone cannot, and every decision carries the level that settled
   it and the numbers. One thing reaches a person: the order ties **and** the
   answer changes code outside the task.
6. **Join the process that is running.** A spec or plan that already exists is
   added to, not duplicated. Without one, the skills run the four phases
   themselves.
7. **A plan carries its check.** Every page task carries its checklist and is
   verified by an agent that did not write it, after that agent proves it catches
   a planted difference.
   **Nothing is kept that can be worked out again**: counts belong to the task
   and go with it. Only a person's override of the order outlives one, and it
   goes where the running process already records decisions.
8. **Silence is never success.** Every phase says what it read and what it could
   not.
9. **Free.** No licence checks, telemetry or paywalls.

## Working here

- The skills are validated on real projects, not fixtures; what fails comes back
  as issues. A fixture shows an idea is right in shape, never that it holds.
- Designs and plans go on the issue, not into `docs/`.
- `tests/names.test.ts` fails on a skill or command named in `skills/` that does
  not exist. `tests/packaging.test.ts` fails on a library component name in the
  skills or `USING.md`. `tests/private-names.test.ts` fails on private names
  (see `uic-docs.md`).
- Commands:
  - `npm run gate` — everything a PR needs: typecheck, build, stale bundle,
    version check, tests, plugin validate.
  - `npm test`, or `npx vitest run tests/<file>.test.ts` for one file.
  - `npm run bump` — patch; `npm run bump minor` or `major` when it is more than
    a fix. Moves the version in all seven files.
  - `UIC_OFF=1` silences the session hook for a session.

## Rules

Detailed rules live in `.claude/rules/`, each prefixed `uic-`:

@.claude/rules/uic-docs.md
@.claude/rules/uic-git.md
@.claude/rules/uic-pr.md

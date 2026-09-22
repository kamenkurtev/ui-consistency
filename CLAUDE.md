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
  loads this file instead — Gemini CLI through `GEMINI.md`, which includes it.
- `AGENTS.md` — the contributor guidelines for an agent working **in this
  repository**, in `superpowers`' shape; included below, and read on its own by
  harnesses that do not read this file.
- `src/` → `bin/uic.mjs` — one command, `uic session`, run by the `SessionStart`
  hook (`hooks/hooks.json`). It tells the session which skills a job takes and in
  what order. It has no off switch of its own: a harness disables a plugin its
  own way, and a switch in the hook could silence only the hook, never the
  skills.
- **Nothing is written into a project's repository.** A plan lives in the
  session, in a scratch file outside the working copy, attached to a story, or
  inside another process's plan — the three endings of `planning` — and goes
  with the work. `.ui-consistency/` and `.claude/ui-consistency/` are what older
  versions wrote; the session hook says so when it finds either.

**Nothing may assume a hook is running.** Claude Code runs the session hook, and
is the only harness run end to end. Cursor has a session-hook manifest that has
not been. Gemini CLI loads `USING.md` through `GEMINI.md`, not run end to end.
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
   verified by an agent that did not write it, with a check proved first to
   catch a difference planted by somebody else.
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

## Rules

The contributor guidelines — what every agent working here does before a pull
request, and what is not accepted — are `AGENTS.md`, the file harnesses other
than Claude Code read. One copy, included here:

@AGENTS.md

Detailed rules live in `.claude/rules/`, each prefixed `uic-`:

@.claude/rules/uic-docs.md
@.claude/rules/uic-git.md
@.claude/rules/uic-pr.md

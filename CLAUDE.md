# CLAUDE.md

## What this is

A plugin — Claude Code first, with manifests for Codex, Cursor and Gemini CLI —
that keeps AI-generated UI consistent with the project's **own** component
vocabulary and prop conventions, while the code is being written.

It is a library of **rules and skills**. The code is only what supports them.

Read before proposing anything:

1. `docs/concept.md` — what this is and why.
2. `rules/pattern-file.md` — what the tool writes down, and in what form.

## Layout

- `rules/` — plain Markdown knowledge the agent follows while writing: anatomy,
  routes, raw values, imports and layers, what a screen is per framework, the
  pattern-file format.
- `skills/` — `pattern`, `screen`, `decide`, `rollout`, `verify`, `review`,
  `reach`. Each is reached by its `description`, in any language.
- `AGENTS.md` — the same instructions for harnesses that read that file instead
  of hooks.
- `src/` → `bin/uic.mjs` — one command, `uic session`, run by the `SessionStart`
  hook (`hooks/hooks.json`). It tells the session which skills exist and in what
  order they fire. `UIC_OFF` silences it.
- `.ui-consistency/` — where a project's patterns and decisions live;
  `.claude/ui-consistency/` is still read as a fallback and reported when used.

**Nothing may assume a hook is running.** There is no check on the edit path on
any harness. Claude Code and Cursor run the session hook; Codex and Gemini CLI
read `AGENTS.md` instead.

The private `kamenkurtev/ui-consistency-archive` holds the history before this
repository's single root commit, and the old tracker. Issue numbers here point
to this repository only — both trackers start at 1.

## Decisions not to re-litigate

1. **Nothing derived fails anything.** No model and no heuristic blocks an edit.
   A fact about the file (a hex literal, an absolute length) is a finding only
   where the project has stated something about it — a theme, a token file, a
   written rule. Everything else is handed to the agent as evidence, and the
   agent decides. Reporting every literal floods, and a tool that floods gets
   switched off.
2. **Conventions are curated, never inferred.** Inferring from neighbouring
   files turns old mistakes into enforced rules. A named reference
   ("use `OrderList.tsx` as reference") is a choice somebody made; a family read
   with nothing named is statistics, and carries less weight. Say which one an
   answer came from.
3. **No component name is hardcoded.** Roles are universal, names are local. A
   built-in vocabulary goes silent on every project that names things
   differently, and silence looks like a clean result.
4. **Org-agnostic.** Works for a single-package app and a monorepo, React, Vue,
   Svelte and Angular. Structure is detected, never required as config. Never
   design around one particular repository.
5. **Silence is never success.** Where the tool can say nothing, it says that
   and why.
6. **Free.** No licence checks, telemetry or paywalls in the plugin.

## Working here

- Fixtures written by the rule's author do not catch the rule's mistakes.
  Validate against a real repository, and for anything user-facing run the
  shipped `bin/uic.mjs` copied alone into an empty directory.
- `tests/names.test.ts` fails on a skill or command named in `skills/` or
  `rules/` that does not exist. `tests/private-names.test.ts` fails on private
  names (see `uic-docs.md`).
- `npm run gate` before any PR.

## Rules

Detailed rules live in `.claude/rules/`, each prefixed `uic-`:

@.claude/rules/uic-docs.md
@.claude/rules/uic-git.md
@.claude/rules/uic-pr.md

# Contributing

## The terms a contribution arrives under

The project is MIT-licensed (`LICENSE`). **Anything you submit — a pull request,
a patch, text in an issue meant to be used — is offered under the same licence**,
and you are saying you have the right to offer it on those terms. No separate
agreement is signed.

Conduct is `CODE_OF_CONDUCT.md`. A vulnerability is reported privately, as
`SECURITY.md` says — never in a public issue.

## Setup

```sh
npm install
npm run gate
```

`npm run gate` is the whole bar: typecheck, build, stale-bundle check, version
check, tests, plugin validate. The same script runs on every pull request
(`.github/workflows/gate.yml`).

The plugin is Markdown — `skills/`. A change to how the agent behaves is a
change to a skill, not to `src/`, which holds only the session hook.

## Things that will bite a first contribution

**The gate fails on a fresh clone until `npm install` has run.** The error is
`Cannot find type definition file for 'node'`.

**A change that ships must move the version, in the same pull request.** A
branch touching `src/`, `bin/`, `hooks/`, `skills/` or `.claude-plugin/` without
a version bump fails the gate, because an installed plugin only updates when the
manifest names a new version. Run `npm run bump` (`minor` / `major` when it is
more than a fix); it moves all seven files that carry the version.

**The new version gets an entry in `CHANGELOG.md`**, saying what somebody who
already installed the plugin will notice. The gate fails on a version with no
entry.

**The build artifact is committed.** `bin/uic.mjs` ships from the repository,
since installing the plugin is a clone with no build step. The gate rebuilds it;
commit what it produces.

**A test that passes is not evidence.** A fixture written by whoever wrote the
rule encodes the same assumption as the rule. So:

- a fix comes with a test that **fails against the unfixed code** — run it both
  ways;
- a change to a skill is tried on a **real repository**, not only a fixture;
- anything user-facing is tried with the **shipped artifact**, installed, not
  from the clone.

**Measurements keep their numbers and lose their names.** If you record what a
run on a private codebase found, rename every project-specific identifier to a
neutral one of the same shape first (`OrdersGrid`, `app-orders-grid`).
`tests/private-names.test.ts` checks against a list you keep outside the
repository — `UIC_PRIVATE_NAMES` or `~/.config/uic/private-names.txt`. The rule
is `.claude/rules/uic-docs.md`.

## Filing an issue

Say what you asked the agent, what it did, and what you expected — and which
phase it was in, if you know: finding, planning, implementing or verifying. The
checklist it produced is the most useful thing to paste, with names made neutral. If the complaint is that nothing happened, say
so, and say what the agent reported it could not read.

## Before you open a pull request

`.claude/rules/uic-pr.md` is the full order. The short form:

1. `npm run gate`.
2. Simplify what you wrote, then run the gate again if it changed anything.
3. A correctness review and a security review, both of them, every time.
4. Read `CLAUDE.md`, `README.md`, `AGENTS.md`, `docs/concept.md` and the skills
   against your change, and say in the pull request body which you read and
   what you found. **"Read, nothing false" is a result.** Fix what is wrong, and
   wherever it was copied.

## Reading order

`docs/concept.md` first — the problem and why. Then `CLAUDE.md` for the
ideas the design rests on.

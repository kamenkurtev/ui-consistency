# Contributing

Everything here is a consequence of something that went wrong once. Where a
rule has a full explanation elsewhere, this file states the consequence you
will hit and points at it — there is no second copy of anything.

## Setup

```sh
npm install     # do this first — see trap 1
npm run gate
```

`npm run gate` is the whole bar: typecheck, build, stale-bundle check, version
check, tests, plugin validate. The same script runs on every pull request
(`.github/workflows/gate.yml`), so a green gate locally is a green gate there.

## Five things that will bite a first contribution

### 1. The gate fails on a fresh clone until `npm install` has run

The typecheck cannot find its type definitions, and the error names neither
`npm` nor `install`:

```
error TS2688: Cannot find type definition file for 'node'.
```

That is the whole of it. Run `npm install`.

### 2. A change that ships must move the version, in the same pull request

An installed plugin updates when `.claude-plugin/plugin.json` names a new
version, not when the code changes. A branch that touches `src/`, `bin/`,
`hooks/`, `skills/` or `.claude-plugin/` and leaves the version where `main` has
it **fails the gate**:

```
this branch changes what ships but leaves the version at "version": "0.14.79".
Anyone who has already installed the plugin will not receive it.
```

Use `npm run bump` (`minor` or `major` when it is more than a fix). The version
lives in **seven** files — one manifest per harness, plus `package.json` and
`src/version.ts` — and only `.claude-plugin/plugin.json` is read when a plugin
updates, so the other six drift with nothing to complain. Do not move them by
hand. Docs, tests
and rules alone need no bump.

### 3. The build artifact is committed, and a stale one fails the gate

`bin/uic.mjs` is the bundled CLI and it **ships from the repository**, because
installing the plugin is a clone with no build step. If you edit `src/` and do
not rebuild, you get:

```
bin/ is stale — the build changed it. Commit the rebuilt bundle:
```

`npm run gate` rebuilds it for you; commit what it produces. If you come from a
project where `dist/` is gitignored, this is the one that will surprise you.

### 4. A test that passes is not evidence. A test that fails first is

This is the unusual one, and it is load-bearing. Fixtures in this repository
have never caught a real defect — twenty-three real bugs, twenty-three green
suites, fifteen of them on a single day at over 570 passing tests. Every
fixture is written by whoever wrote the rule and encodes the same assumption,
so a green run tells you the assumption is consistent, not that it is right.
`CLAUDE.md` keeps the count and the list.

So the bar for a fix is:

- **A test that fails against the unfixed code.** Run it both ways and say so.
  A test written for one real bug here passed against the broken code because
  the helper it used returned siblings backwards; it would have closed a true
  finding as a false positive.
- **For anything user-facing, a run of the shipped artifact**: copy
  `bin/uic.mjs` alone into an empty directory and use it there. Not the clone —
  a whole tier was once dead for every installed user while all 307 tests
  passed, because the suite runs from a tree where `npm install` has happened.
- **For anything that produces findings, a real repository at real scale.**
  Every check in this tool passed its fixtures and was still wrong until it met
  one.

### 5. Measurements keep their numbers and lose their names

This tool is dogfooded against private codebases, and recording what real runs
found — with real numbers — is how it is developed. **Rename every
project-specific identifier before you write the measurement down**, to a
neutral equivalent of the same shape: same casing, same word count, same
dialect. `OrdersGrid` for a PascalCase grid, `app-orders-grid` for its selector
form, `acme-orders-page` for a test-id. The lesson and the counts survive; your
employer's component names do not.

`tests/private-names.test.ts` enforces it against a list that lives **outside**
the repository — a committed denylist is itself the leak. Point
`UIC_PRIVATE_NAMES` at your own list, or put it at
`~/.config/uic/private-names.txt`. With no list the test says so and passes,
which is what CI sees.

The full rule, and why it is a rule: `.claude/rules/uic-docs.md`.

## Filing an issue

The house style is **a reproduction in an empty directory, using the shipped
bundle**. It is worth the five minutes: it separates a defect in the tool from
something about your repository, and it is what a fix will be tested against.

```sh
mkdir -p /tmp/repro/src && cd /tmp/repro && echo '{"name":"r"}' > package.json
# ... the smallest files that show it ...
node /path/to/bin/uic.mjs check src/Thing.tsx
```

Say what you observed and what you expected, and paste the output unedited. If
the answer was silence, say which command was silent — this tool has three
different silences and `ui-consistency:reach` is what tells them apart.

## Before you open a pull request

`.claude/rules/uic-pr.md` is the full order and the reasons. The short form:

1. `npm run gate`.
2. Simplify what you wrote, then run the gate again if it changed anything.
3. A correctness review and a security review, both of them, every time —
   there is no "not applicable". One pass over a scope somebody had already
   argued was safe returned four reproducible findings.
4. Read the concept documents against your change and say in the pull request
   body which you read and what you found. **"Read, nothing false" is a
   result.** Where something you found to be wrong has already been quoted
   elsewhere, mark it deprecated where it stands rather than replacing it
   quietly — the copies outlive the original.

The pull request template carries this as a checklist.

## Reading order

`docs/concept.md` first — the problem and why, in one document. Several
deliberately excluded things look like obvious improvements until you read why
they are out. Then `CLAUDE.md` for the architecture and the decisions that must
not be re-litigated without a reason.

<!--
What changed, and why. If it fixes something, what the failure was.
Link the issue: `Closes #<number>`, and one `Closes` per issue — `Closes #6 and #19` only parses the first.
-->

## Who produced this

Asked of every pull request, the owner's included. A change reasoned out of
documentation and a change grounded in a real session are different evidence,
and without this they look identical.

| | |
|---|---|
| Model and version | |
| Harness and version | |
| Plugins loaded | |
| The person who read the complete diff | |

- [ ] **A person read the complete diff** before this was opened — not a
      summary of it. Required of every contribution from outside. The owner's
      own agent-made changes merge on the gate and the three reviews instead
      (`.claude/rules/uic-git.md`), and say so here.

## Does it belong here

- [ ] Searched open **and closed** pull requests for the same problem or prior
      art. Related: <!-- #n, or "none found" -->
- Where a related one was closed: what is different this time.

Answer the change against `docs/concept.md`, *What this is not* — not the
whole job, not a test suite, not a linter, not a design-system opinion, not a
gate, not a program, not for sale. Which of these could a reader say this
change makes it, and why it does not:

- [ ] **One logical change.** A pull request carrying unrelated changes is
      split, not reviewed (`.claude/rules/uic-git.md`).

## Acceptance criteria

Copy the issue's criteria and tick the ones this PR meets. One left unticked
means the issue does not go to `Done`.

## Verification

- [ ] `npm run gate` passes
- [ ] Version bumped with `npm run bump` and a `CHANGELOG.md` entry written, or nothing that ships changed
- [ ] `bin/uic.mjs` rebuilt and committed, or `src/` untouched
- [ ] **The test fails against the unfixed code** — run both ways, and say so
- [ ] Anything user-facing was run from the **shipped artifact**: `bin/uic.mjs`
      copied alone into an empty directory
- [ ] No name from a private repository in the diff — numbers survive, names do
      not (`.claude/rules/uic-docs.md`)

## Where it was exercised

| Harness and version | Model and version | What was run |
|---|---|---|
| | | |

A change to how a harness loads the plugin — a manifest, the hook, `USING.md`,
`AGENTS.md` — attaches a **transcript** of a session in that harness showing it
loaded. `CLAUDE.md` says which harnesses have never been run end to end; a
change to one of them is the first evidence it works, or it is not.

## Reviews — all three, every time

There is no "not applicable". State what each found; **"found nothing" is a
result** and belongs here.

- [ ] Simplification pass — what it changed
- [ ] Correctness review — what it found
- [ ] Security review — what it found

## Documents

Which of `CLAUDE.md`, `docs/concept.md`, `README.md`,
`AGENTS.md`, `USING.md` and `skills/*/SKILL.md` you read against this change, and what you
found. **"Read, nothing false" is a result.**

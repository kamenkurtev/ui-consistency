<!--
What changed, and why. If it fixes something, what the failure was.
Link the issue: `Closes #<number>`, and one `Closes` per issue — `Closes #6 and #19` only parses the first.
-->

## Verification

- [ ] `npm run gate` passes
- [ ] Version bumped with `npm run bump`, or nothing that ships changed
- [ ] `bin/uic.mjs` rebuilt and committed, or `src/` untouched
- [ ] **The test fails against the unfixed code** — run both ways, and say so
- [ ] Anything user-facing was run from the **shipped artifact**: `bin/uic.mjs`
      copied alone into an empty directory
- [ ] No name from a private repository in the diff — numbers survive, names do
      not (`.claude/rules/uic-docs.md`)

## Reviews — all three, every time

There is no "not applicable". State what each found; **"found nothing" is a
result** and belongs here.

- [ ] Simplification pass — what it changed
- [ ] Correctness review — what it found
- [ ] Security review — what it found

## Documents

Which of `CLAUDE.md`, `docs/concept.md`, `README.md`,
`AGENTS.md` and `skills/*/SKILL.md` you read against this change, and what you
found. **"Read, nothing false" is a result.**

<!--
Anything found wrong that has already been quoted elsewhere is marked
deprecated where it stands, not replaced quietly.
-->

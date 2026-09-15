# Pull request rules

What happens before a PR is merged, in this order. Each step either edits the
input of the next or judges its output.

1. **`npm run gate`.** Typecheck, build, stale-bundle check, version check,
   tests, plugin validate. Nothing below is worth doing on a red gate.
2. **Simplification review** — reuse, simplification, efficiency. First, because
   it is the only review that edits.
3. **`npm run gate` again**, if the simplification changed anything.
4. **Correctness review.** Scoped: say what the change touches and what it
   claims, then check those. Fix what it finds; a finding judged wrong gets one
   sentence of why.
5. **Security review.** Last, so it judges what actually ships.
6. **The documents**, per `uic-docs.md`: read against the change, and fix what is
   false together with its copies.
7. **`npm run gate` again**, if anything above changed code.
8. **Open the PR and merge it** — how is in `uic-git.md`.

## How the reviews are done

By reading the diff against each angle, one at a time, over named surfaces rather
than the whole tree — and the PR body says they were done that way. `/simplify`,
`/code-review`, `/security-review` or review agents are used when the owner asks
for them; several review agents in parallel have exhausted a session and
returned nothing.

## All three, every time

Not conditional on the size of the diff or on the change being "only prose". A
judgement that a review would find nothing is not evidence that it would: a
security pass over a scope already declared safe once found four reproducible
defects.

## Reproduce a finding, in both directions

A finding is a hypothesis.

- **Before fixing it**, confirm what the code does, not what the report says. A
  report is often right about the defect and wrong in its details.
- **Before dismissing it**, make sure the check that came back green actually
  exercises the defect. A test that does not fail against the unfixed code is
  not evidence — run it both ways.

## The PR body

- the issue's acceptance criteria, ticked where met;
- each of the three reviews and what it found — "found nothing" is a result;
- which documents were read against the change, and what was found;
- what was **not** validated.

A review nobody ran has no wording that fits here, and a stale bundle is not
reviewed: the gate builds `bin/` before anything else looks at it.

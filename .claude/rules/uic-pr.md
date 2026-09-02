# Pull request rules

What must happen **before** a PR is opened. The order is not taste: each step
either edits the input of the next one, or judges its output.

1. **`npm run gate`.** Typecheck, build, stale-bundle check, version bump, tests,
   plugin validate. Nothing below is worth doing on a red gate.

2. **`/simplify`.** Reuse, simplification, efficiency and altitude cleanups.
   **First, because it is the only one that edits.** Reviewing before it means
   reviewing code that is about to change.

3. **`npm run gate` again**, if simplify changed anything. Its edits are code
   like any other and are not exempt from the two reviews below.

4. **`/code-review`.** Correctness. Two superpowers skills sit either side of it
   and neither replaces it:
   - `superpowers:requesting-code-review` **before** — it decides what to ask
     for. A review told "look at this diff" and a review told "this touches the
     per-edit path, the budget is 0.12 s, and here is what the comment claims"
     are not the same review, and today's scoped pass is the evidence.
   - `superpowers:receiving-code-review` **after** — fix what it finds; if a
     finding is wrong, say why in one sentence and move on rather than
     implementing it to be agreeable.

5. **`/security-review`. Last of the three, deliberately.** Both reviews are
   read-only, so either order would work mechanically — but whichever runs last
   is the one that judges the code that actually ships. A missed style problem
   is a style problem. A missed security problem ships.

6. **The concept documents**, per `uic-docs.md`. Read them against the change
   and say in the PR body which were read and what was found. Where something
   found to be wrong has already been quoted elsewhere, **mark it deprecated
   where it stands** rather than replacing it quietly — the copies outlive the
   original, and a silent replacement gives nobody a reason to doubt them.

7. **`npm run gate` again**, if anything above changed code.

8. **`superpowers:finishing-a-development-branch`.** It verifies the suite,
   detects the environment, presents the integration options and cleans up. It
   owns the integration decision; this rule owns everything before it. Opening
   and integrating a branch goes through it — not through `gh pr create` and
   `gh pr merge` by hand.

## Reproduce a finding before acting on it — in both directions

A review's finding is a hypothesis. Confirming it is cheap and skipping the
confirmation is how both mistakes get made:

- **Before fixing.** Two of the four security findings arrived with a
  reproduction that was slightly wrong in its numbers while being right about
  the defect. Fixing what a report *says* rather than what the code *does*
  produces a change nobody can review.
- **Before dismissing.** This is the dangerous direction. An obvious check of
  #149 came back green — the simplified Angular template used to reproduce it
  was accidentally valid JSX, so Babel read it and the bug hid. A test written
  for #155 passed against the unfixed code because `walk` returns siblings
  backwards and the element was in the wrong place. Both would have closed a
  true finding as a false positive.

A test that does not fail against the unfixed code is not evidence of anything.
Run it both ways.

## All three reviews run. There is no "not applicable"

Steps 2, 4 and 5 are not conditional. Not on the size of the diff, not on
whether it is "only prose", not on whether the reviewer is expected to find
anything.

This rule used to let `/security-review` be skipped when the change did not
touch input parsing, I/O, process execution or credentials, as long as the skip
was stated. That exemption is withdrawn, and it is worth recording why.

Fourteen changes shipped in one day under it. `/simplify` and `/code-review`
were skipped on nearly every one, each time with a defensible sentence — *the
change is four strings*, *this is a deletion PR*, *this PR is the fix for what
the review already found*. `/security-review` was skipped on all of them, twice
with an explicit argument that path handling had only been made stricter.

Then one `/security-review`, over a scope somebody had already declared safe —
no `child_process`, no network, no credentials — returned four findings, all
reproducible: a prop value from ordinary application code becoming an
instruction the agent reads (#171), a predictable cache directory that follows a
pre-planted symlink (#172), a documented "no source code, ever" promise the log
does not keep (#173), and a `tsconfig` alias that reads outside the project
(#174).

Every one of those was reachable from a change that had been argued into
exemption. **A judgement about whether a review would find something is not
evidence about whether it would**, and the argument for skipping is always
available and always sounds reasonable — which is exactly why it cannot be
allowed.

## Cost, which was the real reason

Say it plainly rather than dressing it as relevance. The answer is not to skip a
review but to make it smaller:

- **A cheaper model.** The security pass that found all four ran on Sonnet in
  fourteen minutes.
- **One at a time.** Three review agents in parallel exhausted a session limit
  and returned nothing at all. Serial is not slower when the parallel run dies.
- **A scope, not a sweep.** That pass was given four named surfaces rather than
  120 files, and told to prove each finding by running the bundle. A review that
  wanders is the one that costs and finds nothing.

## Two things this rule exists to prevent

- **Reviewing a bundle that is not built.** The gate builds `bin/`, and a stale
  bundle is shipped code that does not match the source it came from.
- **A PR that hides what was skipped.** The PR body names each of the three
  reviews, what it found, and what was done about it. "Found nothing" is a
  result and belongs there. A review nobody ran is not, and there is now no
  wording for it.

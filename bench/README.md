# Running the two arms

`scripts/bench.mjs` scores screens two arms already wrote. It does not run the
arms, because an agent harness is the one thing this repository has no business
depending on — and the runs are agent time somebody has to decide to spend.

What a run needs, and the order is not taste:

1. **A target repository with a real family.** Three or more screens of one kind
   that already exist, so the right answer exists and nobody invents it. Copy it
   to a scratch directory; the arms write 18 new screens and nothing is written
   into anybody's working tree.
2. **The pattern, established and committed, before either arm starts.**
   `uic pattern <one of the family> --establish`, then commit it. `bench.mjs`
   reads git and refuses a pattern with uncommitted changes: a run scored against
   something authored from its own output measures nothing and still looks like a
   result.
3. **One tree per arm-run**, so no arm reads another's screens as neighbours,
   and **the pattern file deleted from the OFF trees** rather than left there and
   not mentioned.
4. **One agent per arm-run, writing all the screens in one session, in the order
   `tasks.json` gives.** This is the whole mechanism: drift is attention thinning
   within a session, and a fresh agent per file deletes the thing being measured.
   Same model on every arm.
5. **`prompt-off.md` and `prompt-on.md` as written.** Diff them before you start:
   the difference must be the pattern's availability and nothing else.
6. **More than one run per arm.** Two bound the weather rather than measuring it;
   report the range and never a mean of two.

Then:

```
npm run bench -- --pattern <repo>/.ui-consistency/patterns/<kind>.md \
  --off <repo>/off-1/out --on <repo>/on-1/out
```

There is deliberately no verdict in the output. Whether a difference is a result
is a reading of the spread, and one pair of arms cannot separate the tool from
the weather.

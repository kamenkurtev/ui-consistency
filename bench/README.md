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
5. **`prompt-off.md` and `prompt-on.md` as written**, with these substitutions
   and no others — the seed prompt is everything after the `---` in each file:

   | in the prompt | supplied from |
   | --- | --- |
   | `OUTPUT_DIR` | the directory that arm writes into |
   | `TASK_LIST` | `tasks.json`, in `order` |
   | `PATTERN_PATH` | the same `--pattern` you give the scorer in step 7 |

   **Substitute; do not edit.** Diff the two files before you start: the
   difference must be the pattern's availability and nothing else, and a
   hand-edited pair is not evidence of that. `PATTERN_PATH` is the scorer's own
   `--pattern` so the two halves of a run cannot disagree about which pattern
   was under test. `tests/gate/bench-prompts.test.ts` fails if either file names
   a repository, a framework or a kind — which both of them did, so a run was
   impossible anywhere but the machine they were written on (#56).
6. **The ON arm must not be told to optimise the score** (#57). This is the
   subtlest way to get a run wrong and it was got wrong the first time: the arm
   was told to run `uic diff --contract` on each file and fix what it reported —
   *the scorer's own command, against the scorer's own pattern.* Its score was
   then bounded at zero by construction, and an ON score above zero could only
   have meant the agent ignored an instruction. It also made the arms differ by
   two things at once: the pattern being readable, and a per-file gate the OFF
   arm has no equivalent of.

   **The treatment is that the pattern is readable, and nothing more.** That is
   what the plugin does before a write and what #34 set out to measure.
   Benchmarking the per-edit gate is a different experiment needing a metric the
   arm was not told to optimise, and it must not be folded into this one.

7. **More than one run per arm.** Two bound the weather rather than measuring it;
   report the range and never a mean of two.

Then:

8. **Score it.**

```
npm run bench -- --pattern <repo>/.ui-consistency/patterns/<kind>.md \
  --off <repo>/off-1/out --on <repo>/on-1/out
```

There is deliberately no verdict in the output. Whether a difference is a result
is a reading of the spread, and one pair of arms cannot separate the tool from
the weather.

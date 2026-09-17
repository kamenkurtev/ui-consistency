# Running a skill scenario

A scenario checks that an agent does what a skill says, and that it would not
have done so without the skill (`superpowers:writing-skills`: RED, then GREEN).

## Files

- `fixture/` — the project the agent works on. Plain HTML, CSS and ES modules.
- `DRIFT.md` — what is planted in it. Never shown to the agent.
- `inputs/` — what a scenario hands the agent, such as a checklist for work that
  is already under way.
- `scenarios/<skill>-<n>.md` — one scenario: the task, the temptation, what must happen.
- `results/<skill>-<n>-<date>.md` — one run of a scenario, both arms.

## One run

**Run the arms one at a time.** Several agents at once have exhausted the
account's session limit mid-run, which leaves a half-recorded result that looks
like a finding and is an outage.

**Start each arm from a context that does not carry this repository.** A run
launched from a session here inherits its `CLAUDE.md` and `.claude/rules/`, so
*both* arms get instructions a real project would not have — in one recorded run
the agent quoted `uic-pr.md`, which is not in the fixture. The arm without the
skill is then less naive than reality, and the comparison understates what the
skill does.

1. **Copy the fixture alone** into a newly created temporary directory, so the
   agent can see neither `DRIFT.md` nor the skills.
2. **Without the skill (RED).** Start a fresh agent — a subagent with no prior
   context — in that directory. Give it the scenario's task, word for word, and
   nothing about this plugin. If the plugin is installed, set `UIC_OFF=1`.
3. **With the skill (GREEN).** A new copy of the fixture and a new fresh agent.
   Give it the same task, preceded by: *"Read and follow `<path to the plugin>/skills/<skill>/SKILL.md` and the files it links."*
4. **Record** both arms in `results/`, in the shape below.
5. **Delete** both temporary directories.

Use the same model for both arms, and say which. **A single run proves little:
run each arm at least three times** and say how many agreed on each *must
happen* item. One agreement out of three and three out of three are different
results, and a result that does not say which is read as the stronger one.

## The result

```markdown
# <skill>-<n> — <date>

plugin: <version the arms ran against>
model: <model>
runs: <n per arm>

## Without the skill
- <each "must happen" item from the scenario>: yes / no
- in its own words: "<the sentence where it chose, verbatim>"

## With the skill
- <each "must happen" item>: yes / no
- in its own words: "<verbatim>"

## Red flags to add
- "<an excuse the agent gave for skipping a rule>" — or "none observed"
```

**A red flag goes into a skill only if an agent actually said it** in a run.

**And only once a repeated run reproduces it.** A flag seen in one run of three
is a sample, not a pattern: keep it if you like, with a note saying how often it
was seen — *1 of 3 runs* — so a later reader knows what it rests on. A flag with
no such note is read as something agents do, which is a claim a single run cannot
make.

**A result is evidence about the version it ran against.** The design changes;
say which version, so an old run is not read as evidence for a behaviour that has
since been replaced.

## Names

The fixture and every result use invented names. Nothing from a real project —
not in the fixture, not in a scenario, not in what an agent is quoted saying.

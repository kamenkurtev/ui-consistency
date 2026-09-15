# Running a skill scenario

A scenario checks that an agent does what a skill says, and that it would not
have done so without the skill (`superpowers:writing-skills`: RED, then GREEN).

## Files

- `fixture/` — the project the agent works on. Plain HTML, CSS and ES modules.
- `DRIFT.md` — what is planted in it. Never shown to the agent.
- `scenarios/<skill>-<n>.md` — one scenario: the task, the temptation, what must happen.
- `results/<skill>-<n>-<date>.md` — one run of a scenario, both arms.

## One run

1. **Copy the fixture alone** into a newly created temporary directory, so the
   agent can see neither `DRIFT.md` nor the skills.
2. **Without the skill (RED).** Start a fresh agent — a subagent with no prior
   context — in that directory. Give it the scenario's task, word for word, and
   nothing about this plugin. If the plugin is installed, set `UIC_OFF=1`.
3. **With the skill (GREEN).** A new copy of the fixture and a new fresh agent.
   Give it the same task, preceded by: *"Read and follow `<path to the plugin>/skills/<skill>/SKILL.md` and the files it links."*
4. **Record** both arms in `results/`, in the shape below.
5. **Delete** both temporary directories.

Use the same model for both arms, and say which. A single run proves little:
where the result matters, run each arm more than once and say how many agreed.

## The result

```markdown
# <skill>-<n> — <date>

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

## Names

The fixture and every result use invented names. Nothing from a real project —
not in the fixture, not in a scenario, not in what an agent is quoted saying.

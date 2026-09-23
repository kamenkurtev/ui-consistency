# Running a skill scenario

A scenario checks that an agent does what a skill says, and that it would not
have done so without the skill (`superpowers:writing-skills`: RED, then GREEN).

**It is optional.** A skill change is evaluated by the real run behind it and
the next run on that repository (`AGENTS.md`, *Skill Changes Require
Evaluation*). Run a scenario only where it can show **the difference** — below,
*What a fixture scenario can show* — and not for a change of wording, which it
cannot show anything about. Two scenarios at three runs per arm are twelve
sessions against the account's limit.

## Files

- `fixture/` — the project the agent works on: a small order-management app in
  plain HTML, CSS and ES modules, written to be read, not run. The four pages in
  `src/pages/` beside the route file are one family of one kind, and one of them
  carries the drift.
- `DRIFT.md` — every difference in the fixture, planted or not. Never shown to
  the agent.

**Nothing inside `fixture/` may say it is a fixture.** It is copied whole into
every run, so a word there about drift, the answer key or scenarios reaches
every agent in both arms, and an agent told that faults were planted hunts for
them as no agent on a real project would. What a reader of this repository
needs to know about the fixture is written here and in `DRIFT.md`, never in it.
Before a run, search `fixture/` for such a word and check it still carries every
drift `DRIFT.md` lists — no test does it.
- `inputs/` — what a scenario hands the agent, such as a checklist for work that
  is already under way.
- `scenarios/<skill>-<n>.md` — one scenario: the task, the temptation, what must happen.
- `results/<skill>-<n>-<date>.md` — one run of a scenario, both arms, kept while
  the design it ran against is the current one.

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

1. **Confirm the tree is the one you think it is.** `git fetch`, then check the
   working tree matches its remote and is clean, before the first arm. The arms
   read `skills/` from disk, so a tree behind its remote runs old skills while
   `plugin.json`, behind by the same step, records a current-looking version —
   nothing disagrees, and nothing says so. Write down the commit.
2. **Copy the fixture alone** into a newly created temporary directory, so the
   agent can see neither `DRIFT.md` nor the skills.
3. **Without the skill (RED).** Start a fresh agent in that directory, in a
   session where **the plugin is not loaded at all**: not installed, or disabled
   for that session in the harness's own settings. Give it the scenario's task,
   word for word, and nothing about this plugin. **Check it held** before
   trusting the arm: the session's list of skills has none of this plugin's,
   and the transcript shows none of them invoked. A variable or instruction that
   silences only the session hook leaves the skills reachable, and an arm run
   that way is a second arm with the skill.
4. **With the skill (GREEN).** A new copy of the fixture and a new fresh agent.
   Give it the same task, preceded by the words in *Handing a phase to an agent*
   below, and nothing else about the plugin.
5. **Capture the full transcript** of each arm — every message and tool call,
   in the harness's streamed output — not only its final message. A final
   message can be refused or cut short; the tool trail still shows what the
   agent did. Then **record** both arms in `results/`, in the shape below.
6. **Delete** both temporary directories.

## What a fixture scenario can show

The fixture is four pages of about thirty lines. An agent reads it end to end
whatever it is told, so **a shortcut a large project would tempt never tempts
here**: an arm without the skill does not produce a broken count, because it has
no reason to count by a shortcut. Two scenarios have shown it.

So each scenario says which it measures:

- **the difference** — an item where the arms can part: a step the skill adds
  that an agent does not take on its own, such as the proof that a search can
  see, a checker that is not the author, a decision reported with its level;
- **the phase** — an item both arms get right at this size. A run shows the
  skill reaches the right answer and nothing about what it adds; the difference
  needs a real repository.

## Handing a phase to an agent

In these words, with the path filled in — copy them, do not paraphrase:

> Read and follow `<path to the plugin>/skills/<skill>/SKILL.md`. Open a file it
> links only when a step you have reached names it.

*"… and the files it links"* makes every linked file load before the first
project file is opened — about 15,000 tokens for `finding-patterns`, nearly half
of it for steps the run may never reach. The
skill says the same thing itself, so a looser wording is caught there; this one
is the one that does not need catching.

## How many runs

Use the same model for both arms, and say which. **A single run proves little:
run each arm at least three times** and say how many agreed on each *must
happen* item. One agreement out of three and three out of three are different
results, and a result that does not say which is read as the stronger one.

## The result

```markdown
# <skill>-<n> — <date>

plugin: <version the arms ran against>
commit: <the commit of this repository the arms read — skills and fixture both>
cost: <per arm, subagents included: project files opened, searches run, and tokens where the harness reports them — the total, never the parent alone>
model: <model>
runs: <n per arm>
without the skill: <how the plugin was kept out of that arm — not installed, or disabled — and how that was checked>

## Without the skill
- <each "must happen" item from the scenario>: yes / no — what it did, read
  from the transcript
- what it did at the point that decided the item, and — with the skill — the
  sentence of the skill it followed there

## With the skill
- <each "must happen" item>: yes / no — what it did
- what it did at that point, and the sentence of the skill it followed

## Red flags to add
- "<an excuse the agent gave for skipping a rule>" — or "none observed"
```

**Read the result from what the agent did, never ask it for its reasoning.**
Neither the task nor any follow-up asks an agent to quote or explain its own
reasoning: a classifier can refuse a message that does, intermittently, and the
run's report is lost with it. What it did — the files it opened, the searches it
ran, what it wrote and what it said to the user — is in the transcript, and the
sentence of the skill it followed is in the skill.

**A red flag goes into a skill only if an agent actually said it** in a run —
in what it wrote to the user, taken from the transcript.

**And only once a repeated run reproduces it.** A flag seen in one run of three
is a sample, not a pattern. Where one goes into a skill anyway, the pull request
that adds it says how often it was seen — *1 of 3 runs*; the skill carries the
words and what they mean, not the count.

**A result is evidence about the version it ran against.** The design changes;
say which version, so an old run is not read as evidence for a behaviour that has
since been replaced. The fixture changes too, and a version does not move when
only the fixture does — the commit is what ties a result to the fixture it read.

**When the design a result ran against is replaced, the result is removed, not
marked** (`.claude/rules/uic-docs.md`): git keeps it. So `results/` is the list —
**a scenario with no file there has no result against the current design.** A red
flag counted from a removed result keeps its count, and the result it came
from is in git.

## Names

The fixture and every result use invented names. Nothing from a real project —
not in the fixture, not in a scenario, not in what an agent is quoted saying.

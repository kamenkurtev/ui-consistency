# ui-consistency Release Notes

What changed for somebody who already has the plugin installed, newest first.
An installed copy updates when `.claude-plugin/plugin.json` names a new version;
each version below is one of those. Numbers in brackets are pull requests in
this repository.

## v0.38.1 (2026-09-22)

### Harness support

- Gemini CLI loads `GEMINI.md`, which includes `USING.md` — the same
  instructions, in the file name Gemini extensions use (#209).

### Contributing

- `AGENTS.md` is the contributor guidelines, the pull request template follows
  the same sections, and bug report, feature request and harness support issue
  templates exist. This file replaces `CHANGELOG.md`.

## v0.38.0 (2026-09-22)

### finding-patterns

Eight places where `finding-patterns` was silent and an agent had to choose,
each now answered (#200):

- The search for the project's own shared piece goes as wide as the page can
  import from, not over the family alone — a piece most of the family bypasses
  still wins over their copies.
- A written project rule that the code, newest pages included, does not follow:
  the code is written, and the contradiction is reported with where the rule is
  written. Where the newest pages follow the rule, the rule is written.
- A gap outside the phase's subject that blocks the work — an action with
  nothing to call — is reported first, as blocking.
- The kind: the first signal that answers decides, the project's word over what
  the reference renders; with no word in the project, a descriptive name that
  says it is not the project's.
- A family that differs by region is counted per region, and each checklist line
  carries the count that applies to it.
- Too few spacing values to derive a base: widen the source, and where there
  are still too few, the base is not derivable and nothing is called off it.
- A piece that is both the component and the element is recorded once.

## v0.37.0 (2026-09-22)

### Skills

- Every skill says to open a linked file at the step that needs it, never
  before — whatever wording handed the skill over. `finding-patterns` alone
  came to about 15,000 tokens loaded before the first project file.
- `finding-patterns` has guidance for a large project: when to split the work
  across subagents by area, when to sample and how to say so, and grouping
  searches instead of issuing them one at a time (`large-project.md`).
- `finding-patterns`, `verifying` and `accessibility` end with what the run
  cost — project files opened, searches run — so one run can be compared with
  another.

### Harness support

- `USING.md` gives the words to hand a phase to an agent with, for a harness
  with no skill mechanism (#196).

## v0.36.3 (2026-09-22)

### Harness support

- Gemini CLI loads the plugin's instructions from `USING.md`, not `AGENTS.md`.
  The words are the same; `AGENTS.md` now holds the rules for working on this
  repository. Codex users: nothing puts `USING.md` where Codex reads it — copy
  it into your project's `AGENTS.md` (#198).

## v0.36.2 (2026-09-17)

### Scenarios

- A scenario in which the agent breaks a count by itself, rather than being
  handed a broken one (#193). Nothing an installed plugin runs changed.

## v0.36.1 (2026-09-17)

### Scenarios

- How a scenario run is made — one arm at a time, from a context without this
  repository — so the next run is worth comparing (#192).

## v0.36.0 (2026-09-17)

### finding-patterns

- `finding-patterns` has one section on the named reference, saying what 0.33.0
  settled (#191).

## v0.35.0 (2026-09-17)

### Documentation

- The last three places that still sent a reader to `patterns/` point at the
  task's checklist instead (#190).

## v0.34.0 (2026-09-17)

### Skills

- A phase no longer restates the files it links to; each rule lives in one
  place (#189).

## v0.33.1 (2026-09-17)

### Scenarios

- The scenario fixture attaches each page's submit handler (#188).

## v0.33.0 (2026-09-17)

### The order

- A page named as the reference does not carry its own drift into the new page:
  its shape is followed, and where it disagrees with the rest of the family the
  order decides, and says so (#185).

## v0.32.0 (2026-09-17)

### Counting

- A count too split to be a convention says so, rather than being reported as
  `2 of 8` in the shape of a rule (#183).

## v0.31.0 (2026-09-17)

### Skills

- The phases say why an agent gets a page wrong, and surface what answers it
  (#182).

## v0.30.0 (2026-09-17)

### Documentation

- The concept is Design-Driven Development, and every document says so (#179).

## v0.29.0 (2026-09-17)

### Design

- A design for the page is read the way a built page is read (#178).

## v0.28.0 – v0.28.1 (2026-09-17)

### Documentation

- The documents and the scenarios describe the plugin as it is after 0.25.0
  (#174, #175).

## v0.27.0 (2026-09-17)

### The order

- Only a person's override of the order is kept, and it goes where the running
  process already records decisions (#173).

## v0.26.0 (2026-09-17)

### The checklist

- A task's checklist replaces the committed pattern file. Nothing is left in
  the project that can be worked out again (#172).

## v0.25.0 (2026-09-17)

### The order

- A phase decides by a written order and reports what settled each decision,
  instead of asking. Only a tie that would change code outside the task reaches
  a person (#171).

## v0.24.0 (2026-09-16)

### planning

- A described format for the plan, and what travels with each task (#165).

## v0.23.0 (2026-09-16)

### finding-patterns

- The small-change path is described, not only named (#164).

## v0.22.0 (2026-09-16)

### finding-patterns

- An open question is put again, with what an answer releases (#163).

## v0.21.0 (2026-09-16)

### Typography

- Typography is counted, and a named section is bound to the template (#162).

## v0.20.0 (2026-09-16)

### Spacing

- The spacing base is derived from what the project writes, and a correct value
  is no longer called wrong (#161).

## v0.19.0 (2026-09-16)

### Counting

- What fills each role is counted, with the heading level it sits at (#160).

## v0.18.0 (2026-09-16)

### Counting

- The kind of page is decided explicitly, with a branch for a kind with one
  member (#159).

## v0.17.0 (2026-09-16)

### Accessibility

- A new skill, `accessibility`: whether a page can be read and used (#158).

## v0.16.0 (2026-09-16)

### Skills

- The four skills are renamed, from `establishing-patterns`,
  `planning-with-patterns`, `building-with-patterns` and
  `verifying-against-patterns` to `finding-patterns`, `planning`, `implementing`
  and `verifying` (#157). An installed plugin loads the new names on restart.

## v0.15.1 – v0.15.17 (2026-09-15)

### Skills

- A zero for what the reference writes is a broken search (#107); a file that
  imports the family is not a member of it (#108); a value is a convention only
  inside the theme that defines it (#110); contrast is checked as a pair
  (#111); the space between components is counted (#112); the builder is told
  everything the verifier checks (#114). The rest moved rules into reference
  files and added scenarios.

## v0.15.0 (2026-09-14)

### Skills

- The plugin is rebuilt as skills around a new page and a refactor (#95).

## v0.14.79 – v0.14.116 (2026-09-02 – 2026-09-13)

### Before skills

- The design before skills: a command-line analyser that scanned the project,
  retired step by step until the last check and its hook went in 0.14.115.
  Nothing from it ships now.

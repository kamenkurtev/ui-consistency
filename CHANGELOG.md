# Changelog

What changed for somebody who already has the plugin installed, newest first.
An installed copy updates when `.claude-plugin/plugin.json` names a new version;
each version below is one of those. Numbers in brackets are pull requests in
this repository.

## 0.36.3

- Gemini CLI loads the plugin's instructions from `USING.md`, not `AGENTS.md`.
  The words are the same; `AGENTS.md` now holds the rules for working on this
  repository. Codex users: nothing puts `USING.md` where Codex reads it — copy
  it into your project's `AGENTS.md` (#198).

## 0.36.2

- A scenario in which the agent breaks a count by itself, rather than being
  handed a broken one (#193). Nothing an installed plugin runs changed.

## 0.36.1

- How a scenario run is made — one arm at a time, from a context without this
  repository — so the next run is worth comparing (#192).

## 0.36.0

- `finding-patterns` has one section on the named reference, saying what 0.33.0
  settled (#191).

## 0.35.0

- The last three places that still sent a reader to `patterns/` point at the
  task's checklist instead (#190).

## 0.34.0

- A phase no longer restates the files it links to; each rule lives in one
  place (#189).

## 0.33.1

- The scenario fixture attaches each page's submit handler (#188).

## 0.33.0

- A page named as the reference does not carry its own drift into the new page:
  its shape is followed, and where it disagrees with the rest of the family the
  order decides, and says so (#185).

## 0.32.0

- A count too split to be a convention says so, rather than being reported as
  `2 of 8` in the shape of a rule (#183).

## 0.31.0

- The phases say why an agent gets a page wrong, and surface what answers it
  (#182).

## 0.30.0

- The concept is Design-Driven Development, and every document says so (#179).

## 0.29.0

- A design for the page is read the way a built page is read (#178).

## 0.28.0 – 0.28.1

- The documents and the scenarios describe the plugin as it is after 0.25.0
  (#174, #175).

## 0.27.0

- Only a person's override of the order is kept, and it goes where the running
  process already records decisions (#173).

## 0.26.0

- A task's checklist replaces the committed pattern file. Nothing is left in
  the project that can be worked out again (#172).

## 0.25.0

- A phase decides by a written order and reports what settled each decision,
  instead of asking. Only a tie that would change code outside the task reaches
  a person (#171).

## 0.24.0

- A described format for the plan, and what travels with each task (#165).

## 0.23.0

- The small-change path is described, not only named (#164).

## 0.22.0

- An open question is put again, with what an answer releases (#163).

## 0.21.0

- Typography is counted, and a named section is bound to the template (#162).

## 0.20.0

- The spacing base is derived from what the project writes, and a correct value
  is no longer called wrong (#161).

## 0.19.0

- What fills each role is counted, with the heading level it sits at (#160).

## 0.18.0

- The kind of page is decided explicitly, with a branch for a kind with one
  member (#159).

## 0.17.0

- A new skill, `accessibility`: whether a page can be read and used (#158).

## 0.16.0

- The four skills are renamed, from `establishing-patterns`,
  `planning-with-patterns`, `building-with-patterns` and
  `verifying-against-patterns` to `finding-patterns`, `planning`, `implementing`
  and `verifying` (#157). An installed plugin loads the new names on restart.

## 0.15.1 – 0.15.17

- A zero for what the reference writes is a broken search (#107); a file that
  imports the family is not a member of it (#108); a value is a convention only
  inside the theme that defines it (#110); contrast is checked as a pair
  (#111); the space between components is counted (#112); the builder is told
  everything the verifier checks (#114). The rest moved rules into reference
  files and added scenarios.

## 0.15.0

- The plugin is rebuilt as skills around a new page and a refactor (#95).

## 0.14.79 – 0.14.116

- The design before skills: a command-line analyser that scanned the project,
  retired step by step until the last check and its hook went in 0.14.115.
  Nothing from it ships now.

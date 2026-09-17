# planning-2 — "one line per page is plenty"

**Skill:** `planning`
**Temptation:** page tasks too short to carry what makes a page checkable.

## Setup

Copy `fixture/` into a new temporary directory. Give the agent
`inputs/list-page-checklist.md` as the checklist for the work — in the task, not
as a file in the project.

## Task, word for word

> Write a short plan to bring all four pages in line with the checklist. Keep it brief — one line per page is plenty.

## Must happen

1. A calibration task for the checker comes before the pages.
2. Every page task **carries** its checklist — the lines themselves, not a pointer at something the agent can see and a subagent cannot.
3. Every page task names what is not to be copied from the reference, or says there is nothing.
4. Every page task ends with a check by a separate agent.
5. `src/pages/index.js` gets no page task.

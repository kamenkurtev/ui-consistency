# verifying-1 — the author checks its own page

**Skill:** `verifying`
**Temptation:** the agent that just wrote the page declares it consistent and done.

## Setup

Copy `fixture/` into a new temporary directory. Give the agent
`inputs/list-page-checklist.md` as the checklist for the work — in the task, not
as a file in the project.

## Task, word for word

> Add a required "Notes" field to `src/pages/invoices.js`, written like the other fields, then check the page is consistent with the rest of the app and tell me when it's done.

## Must happen

1. The field is added like the others: a `label.field` with an input and a `field__error`, and `notes` in the validation schema.
2. The page is not declared consistent by the agent that wrote it on its own reading; the check is handed to a separate agent or a fresh pass that reads only the checklist and the page — or the agent says plainly that it could not do that.
3. The checker is calibrated before it is trusted: shown a planted difference first.

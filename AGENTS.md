# ui-consistency

Skills that make the pages you write look and behave like the ones this project
already has — the right component written the way the other pages write it, the
project's own validation and error handling, values from the theme. For any UI
technology, including plain HTML and CSS.

## Which skills a job takes

For anything the end user will see, these join the phases of whatever process is
already running, and run the phases themselves when none is.

| The job | Skills, in order |
| --- | --- |
| a new page or feature | `ui-consistency:establishing-patterns` → `ui-consistency:planning-with-patterns` → `ui-consistency:building-with-patterns` → `ui-consistency:verifying-against-patterns` |
| a refactor across pages | the same four |
| a small change to one page | establishing (only what it touches) → building → verifying |
| checking code already written | verifying |

If a spec or plan for this work already exists, add to it instead of starting
another. Ask the user once, only about contradictions and proposals.

- **establishing-patterns** — reads the reference page top to bottom and left to
  right, searches what the other pages reuse and how, takes values from the
  theme, and writes the pattern file.
- **planning-with-patterns** — one task per page, each carrying the pattern file,
  what not to copy, and a check by a separate agent; stops for a yes.
- **building-with-patterns** — one page per task in a fresh context, from the
  pattern file.
- **verifying-against-patterns** — a separate agent compares each page with the
  reference region by region, after proving it catches a planted difference.

Read `skills/*/SKILL.md` directly if your harness has no skill mechanism — they
are the instructions.

## What the project keeps

`.ui-consistency/` in the repository root:

- `patterns/<kind>.md` — how pages of one kind are built here: the role tree,
  what is reused, where values come from, what the user decided, what belongs to
  the reference alone. Committed.
- `plans/<topic>.md` — the page-by-page plan, when no other process wrote one.

Nothing has to be configured. Everything is read from the project, and no
component name is assumed — every technology and every team names its own.

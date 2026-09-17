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
| a new page or feature | `ui-consistency:finding-patterns` → `ui-consistency:planning` → `ui-consistency:implementing` → `ui-consistency:verifying` |
| a refactor across pages | the same four |
| a small change to one page | finding-patterns, its reduced branch → implementing → verifying |
| checking code already written | verifying |
| can it be read, can it be used without a mouse | `ui-consistency:accessibility`, on its own or from any of the four |

If a spec or plan for this work already exists, add to it instead of starting
another. Decide by the order the skills carry and report what settled each
decision; ask only where it ties and the change reaches outside the task.

- **finding-patterns** — reads the reference page top to bottom and left to
  right, searches what the other pages reuse and how, takes values from the
  theme, and writes the task's checklist. For a change to one page it has a
  reduced branch: read the touched position only, skip the rest deliberately,
  and say so.
- **planning** — one task per page, each carrying its checklist, what not to
  copy, and a check by a separate agent; stops for a yes.
- **implementing** — one page per task in a fresh context, from the checklist.
- **verifying** — a separate agent compares each page with the reference region
  by region, after proving it catches a planted difference.
- **accessibility** — contrast, focus, reach without a mouse, a field and its
  label, text alternatives and target size, each reported separately, against
  what the family already does.

Read `skills/*/SKILL.md` directly if your harness has no skill mechanism — they
are the instructions.

## What the project keeps

`.ui-consistency/` in the repository root:

- `plans/<topic>.md` — the page-by-page plan, when no other process wrote one.
  Each task carries its own checklist: the page's tree turned into questions, in
  the order the page is read, with what settled each.

Nothing else. What was counted is evidence for the decisions in a task, reported
with them, and not kept: code moves on, and a count nobody notices has gone
stale is worse than no count.

Nothing has to be configured. Everything is read from the project, and no
component name is assumed — every technology and every team names its own.

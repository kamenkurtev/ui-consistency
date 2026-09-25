# ui-consistency

**Design-Driven Development** for an agent writing UI: what the end user sees
drives the code, so a page comes out consistent and right while it is being
written rather than corrected afterwards. The right component written the way the
other pages write it, the project's own validation and error handling, values
from the theme. For any UI technology, including plain HTML and CSS.

Design first, and the design is read wherever it lives: a design for the page
where there is one, the theme and its tokens where there is one, otherwise the
pages already built.

## Which skills a job takes

For anything the end user will see, these join the phases of whatever process is
already running, and run the phases themselves when none is. Use them without
being asked.

| The job | Skills, in order |
| --- | --- |
| a new page or feature | `ui-consistency:finding-patterns` → `ui-consistency:planning` → `ui-consistency:implementing` → `ui-consistency:verifying` |
| a refactor across pages | the same four |
| a small change to one page | finding-patterns, its reduced branch → implementing → verifying. The check is never the part that gets dropped. |
| checking code already written | verifying — after finding-patterns where no checklist exists yet |
| a design for the page, a new page with no page near enough to follow, or a wish to see a page before it is built | `ui-consistency:design`, on its own or from finding-patterns and planning. It agrees the shape in words, and draws it only when asked. |
| measuring against an accessibility standard — only when asked for, or when the project states a requirement | `ui-consistency:accessibility`, on its own or from any of the four |

If a spec or plan for this work already exists, add to it instead of starting
another. Decide by the order the skills carry and report what settled each
decision; ask only where it ties and the change reaches outside the task, or
before a component is created or code is extracted into one.

- **finding-patterns** — reads the reference page top to bottom and left to
  right, searches what the other pages reuse and how, takes values from the
  theme, and writes the task's checklist. A named reference settles what the page
  is, not whether to use a piece the project shares. For a change to one page it has a
  reduced branch: read the touched position only, skip the rest deliberately,
  and say so.
- **planning** — one task per page, each carrying its checklist, what not to
  copy, and a check by a separate agent; stops for a yes.
- **implementing** — one page per task in a fresh context, from the checklist.
- **verifying** — a separate agent compares each page with the reference region
  by region, with a check first proved to catch a planted difference.
- **design** — reads the design for a page where there is one; where there is
  none and no page is near enough to follow, agrees the page's shape in words, as
  a tree of the project's own pieces. Draws it with the project's values only
  when asked, and never reads a value back out of a design.
- **accessibility** — optional: contrast, focus, reach without a mouse, a field
  and its label, text alternatives and target size, each reported separately,
  measured against a standard only when somebody asks for it or the project
  states a requirement. Without either, the phases follow what the family
  already does, and nothing is reported as failing a standard.

If your harness has no skill mechanism, hand a phase to the agent in these
words, with the path filled in:

> Read and follow `<path to the plugin>/skills/<skill>/SKILL.md`. Open a file it
> links only when a step you have reached names it.

Not *"and the files it links"*: that loads every linked file before the first
file of the project is opened.

## What it leaves in the repository

Nothing. A plan, when no other process wrote one, lives as long as the work and
never in the repository. Planning ends in one of three ways, and says which:

1. **The work stays in one context.** The plan lives in the session — or, if the
   work outlives it, in a scratch file outside the working copy, deleted when the
   work is done.
2. **The work becomes a story for somebody else.** The plan is attached to the
   story, complete enough that a developer who was not in the conversation, and
   does not have the checkout, implements it from the attachment alone.
3. **Another process is running.** The tasks go into its plan; no second
   document.

Each task carries its own checklist: the page's tree turned into questions, in
the order the page is read, with what settled each. What was counted is evidence
for the decisions in a task, reported with them, and not kept: code moves on,
and a count nobody notices has gone stale is worse than no count.

Nothing has to be configured. Everything is read from the project, and no
component name is assumed — every technology and every team names its own.

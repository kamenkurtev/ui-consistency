# accessibility-1 — asked on its own, with nothing written down

**Skill:** `accessibility`
**Temptation:** one verdict for the whole page; a pair judged by its named
entries rather than by the two colours behind each other; the family's own
practice reported as a failure, or a standard nobody asked for applied to it.

## Setup

Copy `fixture/` into a new temporary directory. No checklist, nothing written
down, and no other phase running. The project states no threshold anywhere —
no setting in the theme, no linter rule, no written rule.

## Task, word for word

> Can `src/pages/shipments.js` be read and used without a mouse? Go through it and tell me what you find.

## Must happen

1. **The subjects are reported separately** — contrast, focus, keyboard reach,
   a field and its label, text alternatives, target size — never rolled into one
   verdict about the page.
2. **The family is read first**, and what the other pages do is said: the pairs
   they use, how a field is tied to its label through `label.field`, what the
   project does about focus. A page that does what the rest do is not a finding.
3. **The badge's pair is resolved and reported with its ratio** — `#b0b0b0` on
   `--color-surface` (#ffffff), 2.17:1 — and it is named as a pairing no other
   page uses. The theme's own `--color-muted` (#52606d, 6.46:1) is what the
   project has instead.
4. **The standard is applied, because this request asked for it**, and it is
   named as the one used rather than as the project's rule — the project states
   none. Each ratio is reported so a person can decide.
5. **What could not be evaluated is named**, per subject: no stylesheet outside
   the project is loaded here, but focus and keyboard behaviour are not written
   in the code at all, and saying so is the result for those subjects.
6. **Nothing is invented.** No threshold the project did not state is reported as
   the project's, and no ordering or behaviour is asserted that the code does not
   show.
7. The run ends with **what it cost** — project files opened, searches run.

## What it can show

**The difference**, on items 1, 3 and 4. An agent without the skill answers the
same question as one verdict, and a pair is the part it is most likely to judge
from the named entries rather than by resolving both sides. Item 2 is the one to
watch: the skill's first rule is the family, and nothing in the task suggests it.

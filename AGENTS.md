# ui-consistency

Skills and rules that keep the screens you write consistent with the ones this
project already has. Nothing here grades finished code: it establishes what
screens of a kind look like **here**, writes that down as a pattern file, and
the work is done from it.

## When the work is about screens, this is the order

Do not wait to be asked.

1. `ui-consistency:pattern` — BEFORE writing or changing a screen. It reads what
   screens of that kind already look like here and writes it down. A screen
   written first and corrected after is a screen somebody has to be persuaded
   to change.
2. `ui-consistency:decide` — where pattern finds fewer than three screens of the
   kind. It asks; it does not draft. The first screen of a kind is a decision,
   not a derivation.
3. `ui-consistency:screen` — writing one screen against what pattern established.
   `ui-consistency:rollout` — the same change across many; it queues them and
   verifies the whole set rather than trusting thirty separate turns. A request
   naming a set — *all the*, *every*, *the rest* — is a rollout whether or not
   the word was used.
4. `ui-consistency:verify` — before handing the work over.
   `ui-consistency:review` — a second opinion on one screen, when asked.
5. `ui-consistency:reach` — when you cannot tell whether this project is clean or
   this tool is blind here. Those look identical and are not.

Each skill is invocable on its own; none requires another to have run.

## The rules

Plain Markdown under `rules/`. Read them directly if your harness has no skill
mechanism — they are the instructions.

| Rule | What it settles |
| --- | --- |
| `what-a-screen-is.md` | how many files a screen is, per framework — Angular's is a pair |
| `anatomy.md` | the roles a screen has, in the order they are read, each as a question |
| `family-and-particulars.md` | where a family comes from, and what must not be copied from a reference |
| `roles-and-names.md` | roles are universal, names are local, and an empty answer is not a clean one |
| `routes-and-breadcrumbs.md` | where a route and a trail come from, per router family |
| `raw-values.md` | no colour literal, no absolute length, no emoji where an icon belongs |
| `imports-and-layers.md` | where a symbol comes from — the one fact not in the file, so the project writes it down |
| `what-a-decision-is.md` | what belongs in a decisions file |
| `pattern-file.md` | what a pattern file states and how |

## What the project keeps

`.ui-consistency/` in the repository root, committed:

- `patterns/<name>.md` — one pattern file per pattern (`rules/pattern-file.md`).
- `decisions/<kind>.md` — a few lines of intent per kind (`rules/what-a-decision-is.md`).
- any other Markdown — the project's own rules, one per heading.

Nothing has to be configured. Screens, roles and routes are read from the code,
and no component name is assumed — every team names its own.

# Where a symbol should be imported from

A project with its own component library has, for most symbols, a **nearer**
source than the third-party package underneath it:

```
import { styled } from '@mui/material/styles';   // reaches past the project's own layer
import { styled } from '@ws/ui';                 // what this project uses
```

Both compile. Both render. The first is how a codebase ends up with two
spellings of the same thing and a design system nobody goes through.

## This is the one thing that is not in the file

Everything else these rules cover can be seen in the screen being written. This
cannot: *which package is nearer on this file's chain* is a fact about the
dependency graph of the whole repository. **So it has to be written down.**

A program computed it once — 977 lines resolving workspace manifests and
`tsconfig` aliases into a layer chain — and it answered on **one repository
shape in three** (#81):

| shape | import findings |
|---|---|
| `tsconfig`-alias workspace | 81 |
| `package.json` workspace | **0** — every chain unreadable |
| Angular monorepo | near nothing — 15 of 179 files in a detected package |

A capability that works on one shape of three is not kept on the argument that
it is needed. What is given up with it is real and worth stating: the graph
named the nearer source **without anybody writing anything down**. A rule has to
be written first, and until it is, nothing here is said.

## What the project writes down

One heading in `.ui-consistency/`, in the project's own words:

```markdown
## Imports

Take `styled`, `Box`, `Typography` and `useTheme` from `@ws/ui`, never from
`@mui/material`. `@ws/ui` re-exports them with the theme already applied.

Icons come from `@ws/icons`, never from `@mui/icons-material`.

`@ws/data` may import from `@ws/ui`; the reverse is a cycle. Nothing outside
`@ws/data` imports from `@ws/data/internal`.
```

Three things that make such a rule better than the graph rather than merely
cheaper:

- **It can say why**, and *"`@ws/ui` re-exports them with the theme already
  applied"* is what stops the next person undoing it.
- **It can differ per library**, which the graph could not state. On one real
  monorepo the nearest source for a symbol was a **different** package for one
  library than for its neighbours — a person knows that; a chain has to be
  asked and answers uniformly.
- **It is wrong visibly.** A wrong rule is a wrong sentence in a file somebody
  can read. A wrong chain returns an empty array.

## Reading it while you write

Check the import line against the rule, not against habit. Where the project has
written nothing about a package, **do what the neighbouring screens do** and say
that is what you did — that is evidence, not a rule, and it is worth exactly as
much as it is.

Where a project has no rule and its screens disagree, that is worth one
sentence: *"these four screens import `styled` from two different places; which
is it?"* — asked once, written down once, never typed again.

## What went with the graph, so it is not looked for

There is no build gate. The import check was the last thing that could **fail**
something with no agent in the room, and it went with the graph it read — the
two are the same piece of code. Anything here is read by an agent while it
writes, which means it costs nothing per edit, works on every harness and in
every language, and guarantees nothing.

Read by: `ui-consistency:screen`, `ui-consistency:pattern`,
`ui-consistency:review`, `ui-consistency:rollout`.

# OFF arm — the seed prompt

The arms differ only by the plugin. This file and `prompt-on.md` are committed so
that claim is checkable rather than asserted: diff them, and the difference must
be the pattern's availability and nothing else. Same model, same repository
state, same file order, same output directory naming.

**The seed prompt is everything after the `---` below**, with these substitutions
and no others:

| in the prompt | supplied from |
| --- | --- |
| `OUTPUT_DIR` | the directory this arm writes into |
| `TASK_LIST` | `tasks.json`, in `order` |
| `PATTERN_PATH` | the same `--pattern` the scorer is given (`prompt-on.md` only) |

**No repository and no kind is named here.** ~~It is an Ionic React app~~ and
~~`.ui-consistency/patterns/ion-page.md`~~ were written into these files, which
made a run impossible on any machine without that one application — and meant a
run had to begin by hand-editing the two files whose *unedited diff* is the only
evidence that the arms differ by one thing (#56). The framework sentence is gone
rather than substituted: the agent is told to look around, and the neighbouring
screens already say what the application is better than a sentence would.

This arm gets the repository as it is — the neighbouring screens are there and it
may read them, which is the honest baseline: an agent that *could* look. What it
does not get is the pattern file, the skills, or any sentence describing the
holder, the regions or the props. The pattern file is removed from this arm's
tree rather than left in it and not mentioned.

---

You are adding screens to an existing front-end application in the current
directory. Look around as much as you like before you start.

Write each screen in the list below as its own file in `OUTPUT_DIR/`, named
`NN-<short-name>` with the extension the application's own screens use, where
`NN` is the two-digit number given. Write them **in the order listed**, one at a
time, finishing each before starting the next.

Each screen should be a complete, plausible page component for this application:
imports that resolve, a component exported the way this application exports its
screens, and markup appropriate to what the ticket asks for. You do not need to
wire routes, write tests, or run anything.

Do not modify any existing file. Write only into `OUTPUT_DIR/`.

The screens:

TASK_LIST

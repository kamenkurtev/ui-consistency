# OFF arm — the seed prompt

The arms differ only by the plugin. This file and `prompt-on.md` are committed so
that claim is checkable rather than asserted: diff them, and the difference must
be the pattern's availability and nothing else. Same model, same repository
state, same file order, same output directory naming.

**The seed prompt is everything after the `---` below.** The paragraphs above it
describe the arm and are not given to the agent; `OUTPUT_DIR` and `TASK_LIST` are
substituted from `tasks.json`.

This arm gets the repository as it is — the neighbouring screens are there and it
may read them, which is the honest baseline: an agent that *could* look. What it
does not get is the pattern file, the skills, or any sentence describing the
holder, the regions or the props. The pattern file is removed from this arm's
tree rather than left in it and not mentioned.

---

You are adding screens to an existing React application in the current
directory. It is an Ionic React app; look around as much as you like.

Write each screen in the list below as its own file in `OUTPUT_DIR/`, named
`NN-<short-name>.tsx` where `NN` is the two-digit number given. Write them **in
the order listed**, one at a time, finishing each before starting the next.

Each screen should be a complete, plausible page component for this application:
imports that resolve, a default-exported or named React component, and markup
appropriate to what the ticket asks for. You do not need to wire routes, write
tests, or run anything.

Do not modify any existing file. Write only into `OUTPUT_DIR/`.

The screens:

TASK_LIST

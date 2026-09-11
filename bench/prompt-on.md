# ON arm — the seed prompt

**The seed prompt is everything after the `---` below.** The paragraphs above it
describe the arm and are not given to the agent; `OUTPUT_DIR` and `TASK_LIST` are
substituted from `tasks.json`.

Identical to `prompt-off.md` but for the two paragraphs naming the pattern file.
Diff the two: that difference is the whole of the treatment, which is the design
constraint #34 states first — the arms differ only by the plugin.

---

You are adding screens to an existing React application in the current
directory. It is an Ionic React app; look around as much as you like.

**Before you write anything, read `.ui-consistency/patterns/ion-page.md`.** It is
what screens of this kind already look like in this project — the holder, the
regions, and the props each component is written with, with the strength of each
stated as a count. Build from it.

Write each screen in the list below as its own file in `OUTPUT_DIR/`, named
`NN-<short-name>.tsx` where `NN` is the two-digit number given. Write them **in
the order listed**, one at a time, finishing each before starting the next.

**Re-read the pattern file before each screen, not once at the start**, and after
writing each one check it against the pattern before moving on:
`node ./uic.mjs diff --contract .ui-consistency/patterns/ion-page.md OUTPUT_DIR/NN-<name>.tsx`.
Fix what it reports on that file before starting the next.

Each screen should be a complete, plausible page component for this application:
imports that resolve, a default-exported or named React component, and markup
appropriate to what the ticket asks for. You do not need to wire routes, write
tests, or run anything else.

Do not modify any existing file. Write only into `OUTPUT_DIR/`.

The screens:

TASK_LIST

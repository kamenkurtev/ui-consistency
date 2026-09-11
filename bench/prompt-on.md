# ON arm — the seed prompt

**The seed prompt is everything after the `---` below**, with the substitutions
`prompt-off.md` tabulates — `OUTPUT_DIR`, `TASK_LIST`, and `PATTERN_PATH`, which
is the same `--pattern` the scorer is given so the two halves of a run cannot
disagree about which pattern was under test.

Identical to `prompt-off.md` but for the two paragraphs naming the pattern. Diff the
two: that difference is the whole of the treatment, which is the design
constraint #34 states first — the arms differ only by the plugin.

**No repository and no kind is named here** (#56). `prompt-off.md` records why.

---

You are adding screens to an existing front-end application in the current
directory. Look around as much as you like before you start.

**Before you write anything, read `PATTERN_PATH`.** It is what screens of this
kind already look like in this project — the holder, the regions, and the props
each component is written with, with the strength of each stated as a count.
Build from it.

Write each screen in the list below as its own file in `OUTPUT_DIR/`, named
`NN-<short-name>` with the extension the application's own screens use, where
`NN` is the two-digit number given. Write them **in the order listed**, one at a
time, finishing each before starting the next.

**Re-read `PATTERN_PATH` before each screen, not once at the start**, and after
writing each one check it against the pattern before moving on:

    node ./uic.mjs diff --contract PATTERN_PATH OUTPUT_DIR/NN-<name>

Fix what it reports on that file before starting the next.

Each screen should be a complete, plausible page component for this application:
imports that resolve, a component exported the way this application exports its
screens, and markup appropriate to what the ticket asks for. You do not need to
wire routes, write tests, or run anything else.

Do not modify any existing file. Write only into `OUTPUT_DIR/`.

The screens:

TASK_LIST

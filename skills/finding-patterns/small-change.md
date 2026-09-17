# A change to one page: the reduced branch

Read by `finding-patterns` when the change touches one page, in place of its
steps 1 to 8. `implementing` takes what this produced.

One page, one region — a label, a value, a field added, what a button does. Not
a new page, not a kind nobody has written down, not a change applied across
pages: those take the whole phase. Run the whole phase on a one-line change and
nobody will tolerate it twice; skip it and the change is written from memory,
which is what this exists to stop.

**What is read**

- The page, and the region the change touches.
- For **that position only**, what the family writes there: the component, what
  it comes out as, how it is written, the values it takes — the skill's steps 3
  to 6, over that one position.
- The pattern file for this kind, if one exists. Read it first; it may already
  answer the whole question, and then nothing else needs reading.

**What is deliberately skipped**

- Every position the change does not touch, and its counts.
- The subjects the change does not touch: no type scale for a change that moves
  no text, no spacing sweep for a change that moves no gap.
- The mockup, the plan, and the stop for a yes — a small change does not stop.

**What is never skipped**

- **The proof that the search can see**: whatever you do count, run the search on
  the reference first — [counting.md](counting.md). A reduced run has fewer
  counts, not softer ones.
- **The order** — what you read contradicting itself is settled by it and
  reported with the level, never carried to the user
  ([deciding.md](deciding.md)).
- **The check, by an agent that did not write the change** —
  `ui-consistency:verifying`. This is the part a small change is most tempted to
  drop, and the one that makes it safe to read little.

**What the pattern file gets**

- **One exists**: update the positions you actually counted and leave the rest
  untouched. Say in it that this pass covered one region, and that the rest is
  as of the earlier date it already carries.
- **None exists**: write one covering only what was touched, and say so in
  `read:` — a file that covers one region must not be picked up later as a
  pattern for the kind.

**Say what you did not read.** A reduced run reports its bounds out loud: which
position it counted, which it did not, and that the file is partial. A partial
pattern file that does not say it is partial is worse than none.

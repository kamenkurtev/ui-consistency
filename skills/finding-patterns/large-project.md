# A large project: split, sample, group

Read by `finding-patterns` at step 3, and only when the project is large: the
family, or the search for a shared piece, spans more than one app, library or
area, or has more members than can be read in full.

Reading fifty files out of ten thousand is the phase scoping correctly. What
makes a large run expensive is not the project; it is holding every file read in
one context and issuing searches one at a time.

## Split by area, across subagents

**Split when the search crosses areas** — more than one app, library or package
holds members of the family or copies of a shared piece. One subagent per area,
where the harness has them.

- **Each is handed what it needs and nothing else**: the kind, the reference's
  tree of roles, and the exact searches to run — by exact name, per position.
- **Each returns conclusions, not files**: per position, the count with its file
  spread, the files it opened, the searches it ran, and what it could not read.
- **The parent adds them up** and decides. It never re-reads what a subagent
  read to check it; if a number looks wrong, it sends that one search back.

**Do not split a single area.** A family inside one app is read by one agent;
the handover costs more than it saves.

## Sample, and say so

**Sample when the family has more members than can be read in full.** Read in
full the reference and the members that decide the order — the most recently
written, and any the others import from. Search the rest for the exact
signature of each position instead of opening them.

- **Say which** were read in full and which were searched, and how many of each.
- **Never sample the proof.** Every search is run on the reference first,
  whatever else is sampled ([counting.md](counting.md)).
- **Never sample a shared piece's reach.** Whether the project has its own piece
  for a role is searched in full, never over a sample of the family: a piece
  most members bypass can still be used in a hundred other files, and a sample
  would count its bypass as the convention. How wide that search goes is the
  order's to say ([deciding.md](deciding.md)).

## Group the searches

- **One search per position, over every member at once** — an alternation of
  the exact names, across all the files — rather than one search per file.
- **Independent searches go out together**, in the same turn, where the harness
  runs tools in parallel.
- **A search that returns too much is narrowed, not paged through**: add the
  position, not a limit.

## What the report carries

The cost line the phase ends with, per area where the work was split: files
opened, searches run, and which were sampled.

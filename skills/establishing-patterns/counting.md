# Counting: the family, the proof, the rules

Read by `establishing-patterns` before any count is recorded. The order is the
order of work: the family first, then the proof that a search can see, then the
counts.

## Which pages are the family

Counts are taken over the pages of the same kind as the reference — its family.
Take the candidates, then remove what is not a member **before** counting:

- **Neither end of an import edge inside the candidates is a peer of the other.**
  What a page imports — its panels, its dialog, its hooks — is part of that page,
  not a sibling of it. And **a file that imports members of the family is not a
  member either**: a dispatcher choosing which page renders, a route table, a
  barrel, a wrapper.
- **A candidate that renders no holder and no region of the kind is not of the
  kind.** Report it as not of the kind; never count it as a member that lacks
  them.
- **State both numbers** in the pattern file: how many candidates were
  considered, how many were counted, and what was left out and why.

*Why:* a dispatcher counted as a page once turned 8 of 8 on every role into 8 of
9 — a unanimous convention reported as one drifting page.

## Prove the search can see before trusting a count

The reference is one of the pages you count, so every search has a known answer:
it must find what the reference writes. **Run each search on the reference first.**
A search that does not find the reference is broken, and nothing it counts is a
result.

- **A count of zero for a role the reference writes is a broken search** — a wrong
  glob, a list that was never split, a pattern that does not match this dialect,
  a bound that resolved to nothing. Fix it and count again. Never record it.
- **A zero across the whole family is unverified**, not a convention. Record
  *none of them write this* only when the same search, over the same files, found
  something else — so it is known to have read them.

*Why:* a loop that ran once over the whole list instead of once per file once
reported *0 of 9* twelve times, holder included — a strong-looking convention that
was the opposite of the truth.

## Counting honestly

- **A role is a component plus where it stands.** Count per position, never per
  component alone: 10 of 18 buttons full-width reads as no rule, and was 10 of 10
  in the content area and 0 of 4 in toolbars.
- **A count carries its spread.** Four identical buttons, all in one file, are
  one page's habit; 10 of 10 across 8 files is a convention. Write both numbers.
- **A missing prop is not yet a deviation.** Check the theme and the project's
  wrappers first: either may set it already.
- **Search for the exact name.** A container whose name starts with the
  component's once turned 18 uses into 25.

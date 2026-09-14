# Documents

## A wrong statement is corrected, not annotated

Replace it with what is true now. Git and the private archive repository are
the record; a document carries only the present. If the wrong version was
copied elsewhere, fix the copies in the same change — search for them.

## Evidence from a private repository keeps its numbers and loses its names

This tool is dogfooded against private repositories. The **numbers** from
those runs are worth writing down; the **names** are not publishable.

**Before a measurement is written down anywhere, rename every project-specific
identifier to a neutral equivalent of the same shape** — same casing, same word
count, same dialect. `OrdersGrid` for a PascalCase grid, `app-orders-grid` for
its selector form, `acme-orders-page` for a test-id.

A renamed fixture must still exercise what it was written for: rename the
segments of a multi-segment alias or a deep path, never collapse them.

`tests/private-names.test.ts` enforces it. It reads a list from
`UIC_PRIVATE_NAMES`, or `~/.config/uic/private-names.txt`, and fails on any
match in a tracked file's **path or contents**. The list is never committed — a
committed denylist is itself the leak — so where there is no list the test says
so and passes. The list carries every spelling of a name, one per line; a guess
at another casing is how a real occurrence slips through. `esbuild` runs
without `--minify`, so comments ship in `bin/uic.mjs` and are covered too.

## The documents this applies to

`CLAUDE.md`, `docs/concept.md`, `README.md`, `AGENTS.md` and
`skills/*/SKILL.md`.

Before opening a PR, read them against the change and say in the body which
were read and what was found. "Read, nothing false" is a result.

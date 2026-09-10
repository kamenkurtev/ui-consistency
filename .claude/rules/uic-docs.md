# When something wrong has already spread

**Mark it deprecated where it stands. Do not quietly replace it.**

A wrong statement rarely sits in one place. It gets quoted into a commit
message, a PR body, a code comment, a test docblock, a README — each time by
somebody who found it already written down, because something written down
reads as something checked.

Replacing the original silently is the worst available move. The copies stay,
they still read as true, and nobody has been given a reason to doubt them.

## What to do instead

**Strike it through and put the correction beside it.** The wrong version stays
visible, and anybody who meets a copy elsewhere can see it was withdrawn and
why. The shape a withdrawal takes, from a document since deleted:

> ~~Target stack: **MUI first.** Framework-agnostic sounds more ambitious and
> usually means working well nowhere.~~
>
> **Reversed, and the reversal is now the position.** … The original reasoning
> was not wrong about the risk. It was wrong about where the line falls.

**Say where it came from and how far it went.** "Two months of documentation"
was a figure of speech in one issue body that became a stated fact in four
files, in a repository 24 days old. The count is the useful part: it says
how many places to go and look.

**Name the replacement.** A deprecation with no successor is a hole. This is the
same mechanism the tool itself uses on components — `@deprecated` with a
`{@link}`, read by the check, so the finding names what to use instead.

## When to delete instead

Something that was never true and never quoted. A typo, a stale line nobody
built on. Marking those is noise, and a rule that produces noise gets ignored.

The test is whether anything downstream repeated it.

## Why this is a rule and not a habit

A session ends and what was held in it is gone — what was decided, why, what was
tried and rejected. What survives is what somebody wrote down, and the next
session cannot tell a checked statement from a repeated one. Marking the
withdrawal is the only signal it will ever get.

In one day this repository produced five of these, each written by somebody
fixing something else, and none noticed by its author: a claim about dead code
hours after the same session removed it, two deleted commands still being
offered, three docblocks detached by insertions made earlier in the same series,
a check described in four files that had not existed for three days, and the
invented duration above.

The gate does not check prose and neither do the tests.

# Evidence from a private repository keeps its numbers and loses its names

This tool is dogfooded against private repositories, and the culture above —
write down what real runs found — is why. The **numbers** are the value. The
**names** came along with them: components, screens, route files, test-id
prefixes and prop spellings now sit in docblocks, fixtures, findings documents
and issue bodies, and the plan of record is to publish.

**Before a measurement is written down anywhere, rename every project-specific
identifier to a neutral equivalent of the same shape** — same casing, same word
count, same dialect. `OrdersGrid` for a PascalCase grid, `app-orders-grid` for
its selector form, `acme-orders-page` for a test-id. The lesson and the counts
survive; the provenance does not.

A renamed fixture must still exercise what it was written for. Two in this
repository are load-bearing in their *shape* rather than their words: a
`tsconfig` alias of several segments, and a route table five directories deep.
Rename the segments, never collapse them.

## Why a rule and not care

It reproduces every time. One change was filed with a reproduction quoted verbatim
from a private repository, and the PR that closed it carried five of those names
into `src/`, the tests, `CLAUDE.md` and its own body — written by somebody who
had read this file, one day before the scrub.

`tests/private-names.test.ts` is the mechanism. It reads a list from
`UIC_PRIVATE_NAMES`, or `~/.config/uic/private-names.txt`, and fails on any
match in a tracked file's **path or contents**. The list is never committed — a
committed denylist is itself the leak — so where there is no list the test says
so and passes, which is what CI and anybody else's clone see.

Two things it found the hour it was written, both of which had been asserted
otherwise: ~~the shipped `bin/uic.mjs` contains **zero** private names, because
comments are stripped at build~~ — **it does not strip them.** `esbuild` is run
without `--minify`, so every docblock ships, and one of the Angular file names
below was in the committed bundle. And a hand-anchored grep over a candidate list missed it,
because the list was checked in one casing and the bundle carried another. A
guess at what a name looks like in another dialect is how a check reports
success over a real occurrence; the list carries every spelling, one per line.

## The documents this applies to

`CLAUDE.md`, `docs/concept.md`, `README.md`, `AGENTS.md` and `skills/*/SKILL.md`
— the method itself, not a description of it.

~~`docs/specs/`, `docs/findings/` and `docs/design.md` are excluded. They record
what was decided or found on a date; being overtaken is what a record is for.~~

**There is nothing to exclude any more (#48).** Those directories are deleted,
so every tracked document is one of the documents above, and the scrub applies
to all of them without an exception to remember.

Before opening a PR, read them against the change and say in the body which were
read and what was found. "Read, nothing false" is a result.

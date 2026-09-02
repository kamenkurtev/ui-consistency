# What the tool reports, and how much of it we guessed

*Backstage, 1666 `.tsx` files, sparse clone at `main`. The measurement #203
asked for.*

## The question

`CLAUDE.md` says a deterministic check reports what is true *of the file* and
never what ought to be true *of the project* — **stated by the project, or
evidence.** Three places break that: `takesLength`, `SPACING_KEYS` and
`SCALED_IN_SX` are hand-written lists of what a design system covers.

Before removing them, what are they buying?

## The numbers

**705 findings across 382 of 1666 files.**

| | | | |
| --- | ---: | ---: | --- |
| imports | 658 | 93% | **stated** — the project's own dependency graph |
| deprecated usage | 18 | 3% | **stated** — the project wrote `@deprecated` |
| style: length | 17 | 2% | **guessed** — `takesLength` decides which properties have tokens |
| style: number | 8 | 1% | **guessed** — `SPACING_KEYS`, `SIZE_KEYS`, `SCALED_IN_SX` |
| style: colour | 4 | 1% | a hex literal is a fact; *that a token belonged* is the guess |

**Guessed: 29 of 705. About 4%.** The part that rests on the vendor lists —
lengths and numbers — is **25**.

Nothing else fired at all. No substitutions, no prop values, no page rules, no
emoji: Backstage has written nothing down, so the entire curated half is silent.

## What this answers

**Removing the vendor vocabulary is cheap.** At most 25 findings on a repository
of this size, against 676 that come from something the project itself stated.
The lists are not carrying the tool.

## What it also says, and was not the question

**On a project that has written nothing down, this tool is 93% an import
checker.** Everything the design calls the interesting half — page pattern,
layout, component reuse, prop conventions — produced nothing here, because all of
it needs either a curated rule or an approved contract and Backstage has neither.

That is the design working as intended, and it is worth seeing the size of it. A
new user's first run is the import check and almost nothing else.

## Method

```
find plugins packages -name '*.tsx' -not -path '*/node_modules/*'
uic check $(cat that list)
```

Classified by message shape. The first attempt used `git ls-files`, which in a
sparse checkout names files that are not on disk — the tool refused them by
name, which is #144 doing its job on the person who wrote it.

The import findings are real rather than an artefact of scale: `Box` from
`@material-ui/core` where `@backstage/ui` exports one and is nearer, 84 times;
`Button` from MUI where `@backstage/core-components` has one, 61 times.

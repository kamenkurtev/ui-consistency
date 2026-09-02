# ui-consistency — design

> **v1 is narrowed by [`docs/specs/2026-07-27-v1-mvp-resolution-design.md`](specs/2026-07-27-v1-mvp-resolution-design.md).** That document supersedes this one where they disagree — in particular on v1 scope, on injection, and on monetization. This document remains the record of the problem and of the two load-bearing decisions.

## The problem

Refactoring UI across a large codebase with an agent drifts. Page 1 comes out fine. By page 15 the reference has fallen out of context, each page is handled in isolation, and nothing checks whether page 15 still looks like page 1. At 30+ pages a large share come out badly wrong — not randomly, but systematically.

Observed failures, from real work:

- An action bar above a table uses specific button components with specific variants and sizes. The agent adds buttons without noticing that buttons elsewhere are a particular variant and size.
- Given a reference page to follow, the agent ignores it. The result has nothing to do with the reference in component choice or layout.
- The codebase ends up inconsistent overall.

## Why existing tools don't cover it

**ESLint / Biome** handle syntax and style. They cannot express "the buttons in this project are `variant="outlined" size="small"`", and cross-file or architectural conventions are exactly where they are weakest. Nobody writes those custom rules.

**`frontend-design`** (first-party, ~900k installs) injects *design judgement* — how the model should think about typography, spacing and hierarchy. It does not know or enforce **this project's actual component vocabulary**, and it does not address drift across a batch.

**Visual regression tools** (Chromatic, Percy) diff pixels against a previous baseline. Useful, different question: they tell you something changed, not that it disobeyed the project's conventions.

**CI gates** are the wrong moment. A pipeline failure after two days of refactoring is a rework bill, not help. The value is in preventing drift while the code is being written.

## Two decisions that shape everything

**1. Checks are deterministic, not LLM-based.** The checker is an ordinary program over the AST. If a model ran on every edit it would be slow and expensive and would get switched off within a week. Deterministic checks are instant and free, so running them on every edit is acceptable. The model is only involved in *fixing* what the checker reports.

**2. Conventions are curated, not inferred from surrounding code.** Inferring from neighbouring files averages in the code nobody has touched for a year and turns existing mistakes into enforced rules. Instead the developer nominates canonical exemplars: *this* file is the reference for a dialog, *this* one for data fetching. Small, hand-picked, committed. This is the same shape as a golden dataset in evals — curated reference cases, not statistical inference over noisy data.

**Still true of *intent*, and no longer true of the *family*** (#210, #231). What a person nominates is the canon — which screen is the reference, which of two competing patterns the team is moving towards — and that is the only thing stored. Which screens are *comparable* is derived, every time, and the strongest source for it is the project's own route table: the one place a project **states** which screens are registered beside one another. Nothing derived can fail an edit, which is what makes deriving it safe without anybody signing it.

**And it is derived without being asked for.** Requiring a command per kind was the same decision one level up, and it had the effect this decision exists to prevent from the other direction: on a project that had written nothing down the tool was 93% an import checker, because the half that needed knowledge needed somebody to go and make it first.

## Architecture

One deterministic core, two thin adapters:

```
core/          changed files + contract → list of violations
  ├─ hook      PostToolUse on Write|Edit → violations returned to the agent, same turn
  └─ cli       npx ui-consistency check → same core, whole project, for a pipeline
```

Because the core is a plain program with no model in it, the two modes are the same logic. The CI adapter is a thin wrapper, not a second product.

## The contract

Rather than "here is a reference page, look at it", a machine-checkable **contract** is extracted from the reference via AST:

- ~~**Component vocabulary** — which components are allowed for which role. An action bar is `Stack` + `Button`, not `div` + `button`.~~

  **This assumes the roles are filled by sibling *components*, and on the commonest real page shape they are not (#228).** A page that is a holder plus one child — `<PageLayout title={…} breadcrumbs={…}><OrdersGrid /></PageLayout>` — has no named regions to fill, because the project puts the header, the title and the breadcrumbs in the holder's **props**. Measured on a real React monorepo *and* a real Angular one, `vocabulary` and `regions` came back empty on both. The level still exists; where a project is written this way, what carries the convention is the holder's prop contract (#227) and what the holder holds — *every screen of this kind renders exactly one `*Grid`*. The contract now says which of the two shapes it found rather than reporting two blanks.
- **Prop conventions** — buttons here are `variant="outlined" size="small"`.
  That is the *same value* case, and it was the only one the extraction could
  make. A second claim is now made beside it (#227): **the prop is always
  written**, whatever value each screen chooses — every screen of this kind
  writes `dataTestId`, and one that does not is deviating from all of them.
  Where every screen also writes it the same *shape* — a call rather than a raw
  string — that is said too. Shape is syntax and needs no vocabulary.
- **Structural primitives** — which containers are required.

## The loop

For each target page: inject the contract → transform → check the AST against the contract → return deviations → fix → next page. The reference never expires, because it is re-supplied per page rather than once at the start.

Deviations are stated as facts, not opinions:

> `Button` on line 42 is `variant="contained"`; the contract requires `variant="outlined" size="small"`
> The action bar uses `div`; the contract requires `Stack direction="row"`
> `IconButton` is not in the reference's vocabulary

## Prevention plus safety net

~~Injecting the contract into context before the agent writes is the half that actually works — telling the model "follow this pattern" in the prompt is the mechanism observed to succeed. The deterministic check is the net for what slips through. Both, not just the net.~~

**Superseded.** This is contradicted by direct experience: an implementation plan naming the components to use was written and handed to the agent before a bulk refactor, and the pages still came out inconsistent. A plan is advisory text with nothing forcing closure; across 30 pages in one session it degrades, and nothing verifies that page 15 complied.

The correction: the mechanism is a **closed loop per file** — fresh context, inventory re-supplied, deterministic check, fix, and no advancing until clean. The check is what makes injection stick, not the reverse.

**Constraint to design around from the start:** injection costs context. Everything cannot be injected always. It must trigger on relevance — which file is being touched, what the agent is about to do. The precision of that trigger matters as much as the content of the exemplar. Injecting a little of everything on every edit will be noisy and useless.

## v1 scope

**Component vocabulary and prop conformance for bulk UI refactors.** That is all.

It covers both observed failures: buttons with the wrong variant and size, and ignoring the components in the supplied reference.

~~Target stack: **MUI first.** Framework-agnostic sounds more ambitious and usually means working well nowhere.~~

**Reversed, and the reversal is now the position.** #123 took MUI's vocabulary out of everything that can produce a finding, and a test enforces that no component name is hardcoded where one could. The template path reads Angular, Vue and Svelte; a single-package app with no design system at all still gets four checks. What remains MUI-shaped is named in `CLAUDE.md` and is being argued down rather than defended (#200).

**"Everything that can produce a finding" was doing more work in that sentence than it looked (#226).** `src/sources/archetype.ts` decided what *kind* of screen a file was from `Dialog|Modal|Drawer|Popover|Sheet` and `Table|DataGrid|DataTable|List|VirtualList`, was never named in the MUI-shaped list, and was never reached by the test — because an archetype is not a finding, so the sentence above stayed true while a vendor's vocabulary decided the answer. Measured on two real repositories it reported *"not readable from the code"* about nearly every screen. The module is deleted and the kind is the holder, read from the structure.

The original reasoning was not wrong about the risk — a tool that spreads itself across every stack works well nowhere. It was wrong about where the line falls: the parsing has to know the dialect, and nothing above it has to know the vendor.

## Deliberately out of v1

- **Layout conformance.** "The layout has nothing to do with the reference" is the fuzziest of the observed problems and the hardest to check mechanically. Props are exact and binary; visual layout is not. v1 checks only whether required containers are present, not whether it looks like the reference. Promising more would be dishonest.
- **Accessibility, contrast, dark mode.** These were the assistant's idea, not the observed pain. They are plausible later additions, not v1.
- **Anything paid.** See below.

## Monetization — stated plainly

A Claude Code plugin cannot be sold. Skills and hooks are markdown and JSON, trivially copyable, and the plugin marketplace has no payment mechanism — the official docs contain no mention of payment, billing, or revenue sharing. The `license` field is the only commerce-adjacent field in the schema.

So this plugin is free. It is the distribution and credibility layer, not the product.

If a paid layer is ever wanted, it is the team layer, not the plugin: shared contracts, history, cross-repo reporting, enforcement between people. That is the Chromatic-on-top-of-Storybook shape, and it is the only model that works when the client side is copyable. GitHub Marketplace has real billing rails and dev teams as buyers, which makes the CLI adapter the natural seam. Nothing in v1 needs to anticipate this beyond keeping the core independent of the hook.

**Decided (2026-07-27).** This is a credibility asset, not a business. The plugin ships free and public as an open-source project, distributed on the `claude-community` marketplace. No licence checks, no telemetry, no paid tier. The paid team layer described above is not being built and should not be planned around.

**How it becomes public, decided 2026-09-02 (#264, #265).** Not by flipping this
repository's visibility: it is published as a **fresh copy of the scrubbed tree
with no history**. Cleaning the files does not clean past commits, and names
from private repositories survive there regardless of what the files say now —
as do the bodies of every issue, and the prior revisions GitHub keeps of each
edited body. A fresh copy makes all three moot in one move; this repository is
then archived as the record of the history and the old tracker.

**And the rule that makes the copy safe to cut** (`.claude/rules/uic-docs.md`):
evidence from a private repository keeps its numbers and loses its names. It is
enforced by `tests/private-names.test.ts` against a list that lives outside the
repository, because a committed denylist is itself the leak.

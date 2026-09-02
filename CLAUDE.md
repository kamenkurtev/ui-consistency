# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Which repository this is

**This is the public one, and it is the one that is worked in** (#265, cut
2026-09-02). It has a single root commit on purpose: the project was developed
privately, and cleaning the files does not clean past commits — names from
private repositories survived in 10, 6, 7, 4 and 8 commits respectively when
that was measured, as did the bodies of every issue and the prior revisions
GitHub keeps of each edited body. A fresh copy makes all three moot in one move.

`kamenkurtev/ui-consistency-archive` is private and holds that history and the
old tracker. It is a record, not a place to work: nothing lands there, and an
issue still relevant was **re-written** here rather than transferred, because a
transfer moves the body verbatim.

The rule that keeps this tree safe to publish is in `.claude/rules/uic-docs.md`
— evidence from a private repository keeps its numbers and loses its names —
and `tests/private-names.test.ts` enforces it against a list kept outside the
repository.

## What this is

A plugin — Claude Code first, with manifests for Codex, Cursor and Gemini CLI — that keeps AI-generated UI consistent with the project's **own** component vocabulary and prop conventions, **while the code is being written** — not in a pipeline afterwards.

Claude Code is the only harness with the `PostToolUse` gate wired (`hooks/hooks.json`). Elsewhere the skills and the CLI are the whole surface. Do not write anything that assumes the hook is running.

Read, in this order:

0. `docs/concept.md` — what this is and why, in one document. Start here.
1. `docs/design.md` — the problem and the two load-bearing decisions.
2. `docs/specs/2026-07-27-v1-mvp-resolution-design.md` — narrows v1, supersedes `design.md` where they disagree, and holds the record of what real runs found. Authoritative for the resolution check and for layer detection.
3. `docs/specs/2026-08-02-v2-design-system-consistency-design.md` — v2, a superset. Authoritative for everything beyond the import check.
4. `docs/plans/2026-08-02-v2-design-system-consistency-plan.md` — the v2 build order.

Read them before proposing anything. They record the problem, the decisions that shape the architecture, what is in scope, and what is deliberately excluded. Do not re-litigate those decisions without a reason.

The two load-bearing decisions, so they are not accidentally violated:

1. **The gate is deterministic, never LLM-based.** Everything that can fail a check is a plain program over the AST. A model on every edit would be slow and expensive and would get switched off. A model may *fix* what the checker reports, and — since v2 — may offer an opinion where no deterministic answer exists, but that opinion is advisory, off the edit path, and can never block anything.
   **Deterministic does not mean the program decides.** A check may report what is
   true *of the file* and never what ought to be true *of the project*. `#ff0000` is
   a hex literal, `12px` is an absolute length, `Button` came from a layer further
   than the chain allows — facts. That a token belonged there is a judgement about
   a design system, and the program does not get to make it.

   That line has been crossed, and the crossings are where this keeps breaking:
   `takesLength` is a hand-written list of which CSS properties a design system
   covers, and `SPACING_KEYS` and `SCALED_IN_SX` encode MUI's theme semantics. Each
   is a small model written by hand, and each fails the way small hand-written
   models fail — silently, on the neighbouring case. `takesLength` dropped fifteen
   keys in #195 and nothing noticed.

   **So: stated by the project, or evidence.** A literal the project has said
   something about — a theme, a token file, a written rule — is a finding. A
   literal it has said nothing about goes into what the agent is handed, beside the
   sibling screens and the rules, and *the agent* decides. The plugin exists to be
   developed with an AI; its job is to put the right facts in front of that AI, not
   to reimplement its judgement in TypeScript.

   The counterweight, which is measured and not theoretical: reporting every
   literal floods. Widths and heights alone were 168 of 372 findings on Backstage,
   nearly all legitimate, and a check that floods is switched off — after which it
   costs more than every finding it would have made. So the answer is not "report
   everything"; it is "report what was stated, hand over the rest".

2. **Conventions are curated, never inferred from surrounding code.** Inferring from neighbouring files averages in code nobody has touched for a year and turns existing mistakes into enforced rules. The developer nominates canonical exemplars.

   **A named reference and a derived family are two modes, and they carry
   different weight.** "Use `OrderList.tsx` as reference" is a choice somebody
   made: frequency never enters, so the risk this decision exists to prevent —
   enforcing the most-copied mistake — is not present at all. A family read with
   nothing named is statistics, and from an AST thirty pages sharing a convention
   and thirty repeating one old mistake are indistinguishable.

   The code already works this way and no document said so. `pattern.ts`: *the
   reference is an example, not a specification: its shape holds the pattern —
   otherwise a page votes on whether what it does is what everyone does.* The
   reference gives the shape; the family only separates what repeats from what is
   that page's own business. `canon:` in the decisions file is the standing form
   of the same choice.

   So a user who always names a reference is not exposed to the second mode, and
   has no way to know that. Say it where they will read it.

## Architecture

One deterministic core, several thin surfaces:

- `core` — changed files + knowledge → list of findings (`src/core/engine.ts`)
- hook adapter — `PostToolUse` on `Write|Edit`, returns findings to the agent in the same turn. **It speaks about the edit; the log keeps the file** (#256): a finding outside the lines the tool call wrote is recorded and not injected, because telling an agent to fix a year-old line inside an unrelated change asks for churn it is right to refuse — and each refusal teaches that the imperative is skippable. `Write` is the whole file; an `Edit` whose text cannot be located says everything, since narrowing is only allowed where it is certain.
- CLI adapter — same core, whole project, for a pipeline
- **`rules/` — plain Markdown, and the portable half.** Load-bearing and absent from this list until #232: the knowledge that keeps breaking when it is written as a list in TypeScript belongs here instead, where a wrong rule is wrong *visibly* in a file somebody can read rather than returning an empty array. It needs no derived facts and works on every harness — including the three with no hook, which reach it through `AGENTS.md`.
- skills (`ui-consistency-*`) and `/uic-fix` — the deliberate surfaces, loaded only when invoked

Keep the core independent of the hook. Everything else is a wrapper, never a second implementation.

**The program is the fact supplier; the rules and the skills are the instructions.** The ratio was 19:1 in favour of the program, which is the inverse of the shape that makes a library of instructions portable at all (#232). Where a rule and a list in `src/` would carry the same knowledge, only one of them may exist — two copies is the one outcome worse than either alone.

## Scope

**v1, shipped: import resolution.** A symbol imported from a layer less derived than the file's own chain allows. The layer chain is derived from the dependency graph, never declared. See `docs/specs/2026-07-27-v1-mvp-resolution-design.md`.

**v2, shipped: design-system consistency at seven levels** — page pattern, layout, component reuse, style, props, deprecated markers, and imports last as a supporting signal. Imports are the symptom, not the subject.

The first two of those assume a screen has *named regions filled by sibling components*, and the commonest real page shape has none: a holder plus one child, with the header and the title in the holder's props. `vocabulary` and `regions` are then structurally empty — measured so on a real React monorepo and a real Angular one — and two blanks read as *no convention here*. The contract says which shape it found (`regionsIn`) and what the holder holds (`body`), so an empty answer is never mistaken for a clean one (#228).

Those are the *levels the design addresses*, and they are not the same seven as the deterministic checks listed below. Component reuse in particular is no longer a check at all: it is delivered through the contract's `avoids`, which a person approves. Reading one list as the other is what produced three documents describing a raw-element check that does not exist — #123 removed it on 16 August and they were corrected on 18 and 19 August (#143, #147).

Seven deterministic checks run on every edit (`src/core/engine.ts`): imports, hardcoded style literals, emoji-as-icon, deprecated usage, prop values against an injected set, curated page rules, and curated `use X, never Y` substitution rules. Above them the fuzzy levels, and skills on demand.

**There is no raw-element check on the edit path**, and its absence is deliberate. Saying "`<button>` should be `Button`" needs a built-in map from element to component name — a vocabulary — which is what #123 removed, because it matched nothing and said nothing on every project that names things differently. Raw elements are checked against the contract's `avoids` (`src/checks/contract.ts`), where the answer comes from the project's own screens and a person has approved it — and that check was dead on every template dialect until #149, reporting *success* on a screen rendering the forbidden element.

**No model is called from anywhere in this tool** (`src/ai/advice.ts`). The fuzzy half assembles the evidence — the project's rules, what this file is, what the neighbours agree about — and hands it to the agent already in the room, because a hook cannot require credentials a free plugin has no business asking for. That is also what makes the tool model-agnostic: there is nothing to configure, so whatever model the harness runs does the fuzzy half.

**Decide before writing; grade nothing afterwards** (#114–#124, `docs/findings/2026-08-14-problems.md`). `uic pattern` derives what screens of a kind look like here — holder and role order, the component in each role, the props ~~they are always written with~~ **most of them are written with, and how many** (#257: unanimity meant the more drift a family had the less was said about it — `dataTestId` at 7 of 8 was dropped; every sentence now states the strength), what the layout provides, what belongs to the reference alone, and the raw elements the family avoids. **A "kind" is assembled from the route table first** — the only place a project *states* which screens are registered beside one another — and from the folders around the screen only when nothing routes it. That sentence now carries the weight of the whole level, so **the route reader's accuracy is what it rests on**: the unit is the route *object*, not the line, and the path composes down the tree. Reading it as text gave 52 invented paths out of 117 screens on one real repository, each borrowed from a neighbouring entry (#254, `docs/findings/2026-08-29-invented-routes.md`). A path and a registration are two facts: a pathless entry states no path and still names the table, and losing the second is how a screen falls back onto its own folder. **The path may not be in that table at all** — a routes array exported from one file and mounted under a path in another, which was 50 of those 117 screens — so where the entry states none, the table that mounts *this table's exported array* is looked for and its path composed on top (#263). It is found by content and never by file name: the mounting file is called `shellConfig.tsx` on that repository and matches no routing-file pattern. Two tables mounting the same array, an unfinished search, or a table whose exported name is too generic to be evidence all answer `path: null` — a partial prefix is never presented as a whole path. The family is untouched by any of it, because the family comes from the registration. In that fallback a screen's own folder is not its family: a page and its grid, its dialog and its hooks are one screen (#225). **That was the rule and for a while it had no mechanism** — the shipped fallback did not enforce it, so a page's own panels became the family it was measured against and the derived holder contradicted the page itself. Since #231 raised the stakes (a derived contract now reaches the agent automatically) three guards enforce it: nothing the screen imports may be its family, a folder-derived contract whose holder the reference does not sit in is discarded, and the sentence handed over names where the family came from. Each turns a wrong derivation into a miss — `docs/findings/2026-08-29-invented-routes.md`. `uic diff --contract` measures the finished set against it. **Nothing derived may fail an edit** — and nothing does: the hook puts contract deviations into the agent's context, never into a failure.

**And nobody has to run anything for it to know** (#231). Where an approved contract covers the kind it wins; where none does, the pattern is derived on the edit already being made and said to be derived. `uic pattern` stays as the explicit form for when somebody wants to look, not as the way the knowledge comes into being — requiring it per kind is why a project that had written nothing down got 93% an import checker. Derived answers are cached in `src/sources/pattern-cache.ts`, keyed by the kind, the area and the mtimes of the files they came from, with the same accepted staleness as the package graph: a miss, never an invented finding. 37 ms cold, 0.5 ms warm, and at most once a minute per file behind the debounce. What a derived contract buys is that file thirty is measured against the same thing as file one, which is the whole of the drift problem and needs nobody's signature.

Approval belongs at the one place derived material can fail something: a person putting `uic diff --contract` in a build gate. Asking for it before the work is a gate on a path that gates nothing, and it was on the batch path until #209.

**The only thing stored is intent**: `.ui-consistency/decisions/<kind>.md`, five to twenty lines, mostly pointers. **Where that intent comes from was, until #233, nowhere** — #119 deleted the setup command and nothing replaced the asking, so the commonest answer in the tool (*"fewer than three screens of this kind"*) ended the interaction. `skills/decide` is the surface that asks: it walks `rules/anatomy.md` as questions, records *"not applicable"* and *"undecided"* as real answers, and writes only what was said. Facts about the code are derived every time, because a stored copy of what the code says can only be wrong — every staleness problem here came from such a copy. A dead pointer is reported where the decision is used, never by an audit somebody must remember to run.

**No component name may be hardcoded anywhere a finding can come from.** A test enforces it. Roles are universal; names are local, and a built-in vocabulary made the checks silent on every project that names things differently — silence being indistinguishable from a clean result.

**Two rules govern what a deterministic check may say.** It fires only on something certain — a raw literal, a name the project has written a prohibition about. And a rule only speaks about the files it is about: rules are scoped by the same retrieval Tier 2 uses, because a finding citing a rule that does not apply teaches people to stop reading them.

Still deferred and not to be pulled forward: theme `defaultProps` / `styleOverrides` resolution. Duplicate-shape detection was deferred and is now built, as `uic shapes` — a separate read-only command, never part of the per-file gate, because from an AST a propagated mistake and a shared pattern look identical.

**Nothing here is MUI-specific except where it is named as such.** The resolution check treats the outermost layer as "an external UI library". The prop check takes its allowed set from an injected source of truth and never invents one, so it is name-agnostic too. The only MUI-shaped things left are the `sx` semantics in `src/checks/style.ts` — `sx` is spelled the same by MUI, Chakra and Theme UI, and its spacing keys are read as MUI reads them — and the deferred theme resolution, which would be MUI first. Class-based systems (Tailwind, CSS modules, styled-components) are out of reach of a per-file AST check by construction; say so rather than implying coverage.

**What a screen *is* differs by framework, and that is not a vendor question** (`src/sources/pair.ts`). **The two halves of a pair are parsed by different things and fail differently**: the template by the tolerant HTML parser, the `.component.ts` by Babel — which had no decorators plugin until #253, so every decorated class was a syntax error and everything read from it was empty, the inventory included. A `uic pattern` that answers on the `.html` while `uic place` on the `.ts` says nothing is that shape. React, Solid and Qwik: one file. Vue and Svelte: one SFC. **Angular: a pair** — `foo.component.ts` carries the identity, the imports and the wiring, `foo.component.html` carries the markup, and neither is a screen alone. Reading them as two unrelated candidates left every command above the layer check silent on a real Angular monorepo of 179 components (#229). Either half resolves to the same screen; a `@Component` with neither `templateUrl` nor `template` is not a screen.

**The plugin must work for any organization, and for a single-package app as well as a monorepo.** Structure is detected, never required as config. Never design around one particular monorepo.

**A repository where detection finds nothing at all still gets every check that does not need a package** — style literals, emoji-as-icon, stated page rules, curated substitutions (#166). Only three read a chain: imports, deprecated usage, and the layer half of substitutions. Do not reintroduce a gate that skips a file because no package was found; that is how a fresh install ends up silent on the day somebody is deciding whether the plugin does anything.

**That fact is only useful if somebody can see it, and `skills/reach` is what makes it visible** (#234). A user cannot otherwise tell *"my project is clean"* from *"this tool is blind here"* — every command answers for itself, and each one's silence looks like success. The skill reports three answers and only three, level by level: it works and here is what it read; it is quiet because the project has stated nothing, which is the design; or it is blind here, and here is why. No score, no grade, and never a level called working because it produced no findings.

Detection has two mechanisms and needs either one (`src/layers/detect.ts`, `src/layers/tsconfig.ts`):

- **manifests** — `pnpm-workspace.yaml` / `package.json` `workspaces` for the package set, each package's `dependencies` for the edges
- **`tsconfig` path aliases** — for workspaces whose libraries have no `package.json`, which is the normal Nx shape. Nothing declares dependencies there, so the edges are derived from the imports in the source

A declared package is taken at its word; aliases only fill in what no manifest describes, so a repository that already worked keeps its cost and behaviour. The derived graph is cached (`src/layers/cache.ts`) against the alias file's mtime, because deriving it parses every source file. That accepts a bounded staleness — a brand-new edge between two existing libraries is unseen until `uic scan` — and the failure direction is a missed finding, never an invented one.

**Fixtures here have never caught a real defect.** Twenty-three real bugs now, twenty-three times the suite was green — fifteen of them in a single day at 574 to 607 passing tests (#144, #145, #147, #149-#153, #155, #161, #166, #171-#174), including a contract check dead on every template dialect (#149), a CI line that checked nothing and exited 0 (#144), and four security findings over a scope already argued to be safe (#171–#174). One earlier Tier 2 was dead for every installed user while all 307 tests passed, because the suite runs from the clone, where `npm install` has run. Every fixture is written by whoever wrote the rule and encodes the same assumption, so a green run is not evidence. Validate against a real repository at real scale, break things on purpose — and for anything user-facing, run the **shipped artifact**: copy `bin/uic.mjs` alone into an empty directory and use it there.

**Three guards now enforce what review kept missing, and each has a limit worth knowing.**

- `tests/cli/names.test.ts` — parses every module and fails on a `uic <command>` or `ui-consistency:<skill>` in a **string literal** that does not exist. Literals, not file text, so a comment may still record that something was deleted.
- `tests/core/duplicates.test.ts` — hashes function **bodies**, so it catches a copy renamed. It cannot see a copied *algorithm* inlined in a larger function body, which is how a fourth copy of `walk` survives in `checks/style.ts` (#178).
- `noUnusedLocals` — locals and imports only. Parameters are exempt on purpose: an unused parameter is often a signature kept deliberately.
- The **no-hardcoded-vocabulary** rule above is enforced only where a *finding* can come from, and that is narrower than it sounds. `archetype.ts` decided what kind of screen a file was from `Dialog|Modal|Drawer|Popover|Sheet`, `Table|DataGrid|DataTable|List|VirtualList` and a third list like it, and no guard reached it — an archetype is not a finding. It said *"not readable from the code"* about 12 of 13 real pages, because a project's grids are called `CustomerInvoicesGrid`. Deleted in #226; the kind is the **holder** now, which is structural. Anything that is not a finding but still speaks about the project is outside the guard and ~~has to be watched by hand~~ **is watched by `tests/private-names.test.ts`** (#264), which fails on any private name in a tracked file's path or contents, against a list kept outside the repository — a committed denylist being itself the leak. The rule it enforces is in `.claude/rules/uic-docs.md`: evidence from a private repository keeps its numbers and loses its names. Watching by hand was the plan for a month and it did not work: #263 carried five names from its own issue body into `src/`, the tests and this file.

**The knowledge directory is `.ui-consistency/`, and `.claude/ui-consistency/` is still read as a fallback and reported when used** (`src/knowledge/paths.ts`). The old path is load-bearing, not vestigial — a silent fallback would leave everybody on it forever, and dropping it would lose files already in people's repositories.

**The log is not free of the project's code, and must never be described as if it were.** A finding quotes what it found, so `message` carries literals out of the file, and `contract-*.json` beside it carries prop values and class strings verbatim. The old "no source code, ever" was a claim about the *keys* dressed as a claim about the contents (#173). What is true and worth keeping true: five fields and no sixth, values quoted through `quoted()` at one line and eighty characters (#171), and a directory that is owner-only and refused if anything else owns the name (#172). What protects it is the location, not the format.

## Monetization

The plugin is free. Skills and hooks are copyable text and the plugin marketplace has no payment mechanism. Do not add licence checks, telemetry or paywalls to it. If a paid layer is ever built it is the team layer around the CLI, not the plugin.

## Rules

Detailed rules live in `.claude/rules/`. All custom rule files MUST be prefixed with `uic-` (ui-consistency) to avoid collisions with any built-in rules. Import each below:

@.claude/rules/uic-docs.md
@.claude/rules/uic-git.md
@.claude/rules/uic-pr.md

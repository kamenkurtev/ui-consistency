# v2 — design-system consistency

Date: 2026-08-02
Status: draft, pending review. Tracked as #22–#29 on the board; the build order is in
`docs/plans/2026-08-02-v2-design-system-consistency-plan.md`.

> **Prerequisite: #20.** Installed in the Nx monorepo that motivates this document, v1
> produces zero findings, because detection requires a `package.json` per package and
> that workspace's libraries have none. Every level below that reads the layer chain or
> the inventory — reuse, props, deprecated usage, the engine, `audit` — inherits that
> silence. v2 cannot be validated where it is meant to be used until detection is fixed,
> so #20 is ahead of all of it. The two levels that do not depend on it are style
> literals (pure AST) and the knowledge base with its retrieval.

v1 ships one deterministic check: a symbol imported from a layer that is less
derived than the file's chain allows (`docs/specs/2026-07-27-v1-mvp-resolution-design.md`).
That check stays and keeps working. v2 is a superset built around a different
centre of gravity.

## What changed since v1

**Imports are the symptom, not the subject.** v1 asks "where does this symbol
come from". v2 asks the question the developer actually cares about: **does this
screen look and behave like the rest of the application, against the design
system.** Importing a raw MUI `Button` instead of the project's wrapper is one
_symptom_ of that; it is no longer the headline. The import check drops to the
bottom of the priority list as a cheap supporting signal.

**The failures observed are higher up than props.** Four real cases from working
in a large React/MUI/Nx monorepo shaped this document, and none of them is an
import or a prop:

1. **Dashboard widgets.** Two new widgets were added next to existing ones. They
   came out with smaller title fonts, emoji instead of Material icons, and did
   not reuse the components the existing widgets are built from.
2. **Grid pages.** During a grid refactor there is an `ActionGrid` with specific
   buttons, styles, and ordering. A few pages were done right; the rest were
   "smeared" and had to be checked and corrected page by page.
3. **Master-data forms.** A layout refactor made forms lay out by weight inside a
   holder/layout component. The holder was repeatedly skipped and the form fields
   themselves were rearranged instead — the structural container that enforces
   the ordering was ignored.
4. **Detail screens.** A detail screen was built as a `Dialog` — not the pattern
   the project uses for detail screens, which are routed pages.

Cases 3 and 4 are not catchable by a prop rule or an import graph. They are about
**page archetype** and **layout structure** — whether the right container was
used and whether the screen is the right _kind_ of screen. That is the core of
what v2 must catch.

**Nothing new required to exist externally.** A survey confirmed there is no
built-in Claude Code feature, no marketplace plugin, and no editor-time tool that
checks design-system consistency _in the same turn as the edit_. ESLint can ban an
import; Storybook addons do visual regression; token linters run at build time.
None runs component/layout/pattern validation as the code is written. v2 is new
ground, which is also why the bar for not crying wolf is high.

## The seven levels

Consistency is checked at seven levels, leading (most important) to supporting:

1. **Page pattern** — the archetype for the kind of screen (detail = routed page,
   not `Dialog`; list; form).
2. **Layout / structure** — the right holder/layout component is used and ordering
   respects the container (e.g. weight-based form layout), not hand-arranged.
3. **Component reuse** — the canonical components from the design system are used
   rather than raw primitives, re-implementations, or emoji-for-icons.
4. **Style / theme** — colours, fonts, spacing, and icons come from theme tokens,
   not hardcoded values.
5. **Prop consistency** — `variant` / `size` / `color` and the like match how the
   siblings and the design system use them.
6. **Deprecated markers** — usage of a component or prop marked `@deprecated` is a
   violation, and the message names the replacement (inherited from v1, widened
   from imports to components and props).
7. **Import layer** — the v1 check, now supporting: nearest-layer resolution as a
   cheap symptom of levels 3–4.

Levels 3–7 are largely **deterministic** (AST). Levels 1–2 are **fuzzy** — "this
should have been a page, not a dialog" is not a pure AST rule; it needs to know
the screen's intent and the project's pattern for that kind of screen. Those lean
on the AI layer and on a source of truth.

## The engine: three tiers by cost

The hard constraint is that the check must not slow development down and must not
burn tokens or fill context. Three tiers, cheapest first:

**Tier 1 — deterministic hook (every edit, ~0 tokens, synchronous).**
The v1 core plus the new AST-catchable checks (hardcoded colour/font, deprecated
component/prop usage, raw-primitive-where-a-canonical-component-exists, canonical
prop values out of range). Runs on `PostToolUse` for `Write|Edit|MultiEdit`. Hard
time budget (~100–300 ms; the 10 s hook timeout is a ceiling, not a target). It is
**silent unless it has something to say** — a clean edit injects nothing into
context. If it exceeds its time budget it aborts quietly; it never blocks the edit.

**Tier 2 — AI judgment (rare, debounced, asynchronous, small context).**
This is where levels 1–2 live, and the AI is a **first-class participant in the
decision**, not an opt-in fallback — developing with AI is the point. But it does
**not** run on every edit. It fires on a natural boundary:

- Tier 1 is clean (nothing deterministic to report), **and**
- a source of truth is available (reference page or `.claude/` knowledge — not
  "neighbours alone"), **and**
- the edited file is a UI component with JSX, **and**
- the token budget for the window is not spent.

It is **debounced per file**: a burst of quick edits collapses to one review of
the settled state, not ten reviews of half-finished drafts. It is **off the edit's
critical path** — the edit completes immediately; the AI verdict arrives after the
debounce window as a separate result. Development never waits on it.

**Tier 3 — skills (`ui-consistency:*`, on demand, only when invoked).**
Namespaced skills for the workflows that are deliberate rather than automatic:
generating the knowledge base, auditing it, and a deep design review of a screen.
Skills load into context **only when invoked**, so they add nothing to a normal
session. This is the "superpowers-shaped" surface: a small library of UI-specific
skills, free and open, alongside the always-on cheap hook.

The three tiers combine deliberately: the frequent, automatic work is free and
quiet; the expensive, smart work (AI + skills) is rare and targeted.

## The knowledge base: curated Markdown in `.claude/`

The AI layer needs to know what "correct" is without re-deriving it from scratch
on every edit — that is what would burn tokens. The answer is **light RAG with no
infrastructure**: no embeddings, no vector store, no network, no external service.

Knowledge is a set of **plain Markdown files under `.claude/`** (proposed
`.claude/ui-consistency/`), each describing one piece of the design system or one
pattern. For example:

- `detail-screens.md` — "detail screens are routed pages using `<DetailLayout>`;
  not `Dialog`"
- `forms.md` — "forms lay out by weight inside `<FormLayout>`; do not rearrange the
  fields themselves"
- `widgets.md` — "dashboard widgets: title is `<Typography variant='h6'>`, icons
  from `@mui/icons-material` through the component, never emoji"
- `components.md`, `theme.md` — canonical components and tokens

This shape is chosen for reasons that matter to the constraint:

- **Zero infrastructure** — nothing to install, nothing to run, no network cost per
  edit. Retrieval over Markdown is lexical and takes milliseconds.
- **Human-readable and curated** — the team sees and edits exactly what the tool
  "knows". This is the same principle v1 settled on: conventions are curated, never
  inferred from surrounding code, because inference averages in the mistakes nobody
  has touched in a year and turns them into enforced rules.
- **Version-controlled** — the knowledge lives in the repo and is reviewed in PRs.
- **Generic** — every project supplies its own files; nothing project-specific is
  hardcoded in the tool.

**Retrieval, not embeddings.** On an edit, Tier 2 extracts what the code uses
(components, screen kind), selects the relevant `.md` fragments lexically (by
component name / screen type / keyword), and passes **only those fragments** as a
small focused context to the model — not the whole design system, not whole files.
That is what keeps it cheap.

The `.claude/` knowledge base _is_ the RAG store, in a light, textual, curated form.

## Sources of truth: a cascade

Levels 1–2 (and the AI's sense of "does this fit") need a reference to judge
against. Sources are consulted in priority order; the first available one wins, and
the tool is **silent when none applies** — it never invents a pattern:

1. **Reference page** — a screen you point at ("build a detail screen like this
   one"). Strongest; compares archetype + layout + components against it.
2. **Declared pattern rules** — the `.claude/` Markdown. Works for a brand-new
   screen with no reference, because the pattern was declared once for the project.
3. **Storybook / design system** — hybrid: static AST over `.stories.tsx` (always
   available, offline, fast) plus the Storybook MCP (`localhost:4400/mcp`) when it
   is running and richer data is wanted.
4. **Neighbouring code** — weakest, a heuristic only ("the other detail screens are
   pages, not dialogs"), flagged with that caveat, never asserted hard.

The same cascade feeds the knowledge base and the AI layer; it is one mechanism
across all seven levels. Levels 1–2 use mostly Tier 2 (because they are fuzzy);
levels 3–7 use mostly Tier 1.

## Knowledge lifecycle: init, tune, audit

The Markdown knowledge base has a lifecycle, exposed as commands/skills:

- **`uic init`** — first-time creation. Auto-drafts the `.claude/` knowledge files
  from Storybook + components + any reference pages (as v1's `init` drafted the
  layer config). A draft, not the final word.
- **Team fine-tuning** — the files are edited by hand afterwards. Curated control
  over what the tool enforces.
- **`uic audit`** — checks whether the knowledge is still current: a component named
  in a rule that no longer exists, a new canonical component missing from the rules,
  a story that has drifted from its `.md`. Read-only; reports, does not rewrite.

## Architecture

One core, several surfaces, extending v1's shape rather than replacing it.

```
core  (files, inventory, knowledge) → findings
  ├─ init    detect + auto-draft the .claude/ knowledge base
  ├─ audit   check the knowledge base for staleness (read-only)
  ├─ scan    build / refresh the inventory (v1)
  ├─ check   batch driver → per-file loop, gate before advancing (v1)
  ├─ hook    PostToolUse → Tier 1 always; Tier 2 debounced/async
  └─ skills  ui-consistency:* → deliberate workflows (generate, audit, deep review)
```

Tier 1 stays a pure function over the AST — no model, no I/O beyond reading — which
is what keeps it affordable on every edit. Tier 2 is isolated behind an interface so
it can be tested with a stubbed model and so the budget/throttle logic is not
entangled with the AST checks. The source-of-truth adapters (reference, storybook,
neighbours) sit behind a common interface returning the same shape, so a project
runs whichever it has.

### Finding format

Stated as a fact, with the source of truth and a concrete fix — as v1, extended to
name which level and which source produced it:

```
apps/orders/src/WidgetX.tsx:14
Title uses fontSize: 12 (hardcoded).
Design system (widgets.md): titles are <Typography variant="h6"> — matches the
other dashboard widgets.
→ replace with <Typography variant="h6">
```

## Decisions

**The deterministic gate stays binary; the AI layer is advisory.** Tier 1 keeps
v1's rule: no warnings, and anything that cannot be asserted with certainty is not a
violation. Tier 2's fuzzy judgments are surfaced as advice with their source named,
not as a hard gate — a fuzzy verdict that blocks would be the wolf-crying v1 warns
against.

**AI participates, but debounced and budgeted — never on the critical path.** "AI on
every edit" is rejected: during active development most edits are intermediate and
would burn tokens on code about to be deleted, and would judge unfinished state. AI
runs on a settled boundary, throttled per file, with a hard token cap and a
window/session budget. Over budget → Tier 1 continues, Tier 2 quietly waits.

**No embeddings, no external services.** The knowledge base is curated Markdown and
retrieval is lexical. This is a deliberate constraint for cost, portability, and
human control, not a limitation to be lifted later.

**Generic across projects and frameworks.** Nothing about a specific repository is
hardcoded. TS/TSX in v2. Other frameworks (Vue/Svelte `<script>` extraction,
Angular decorators) are a declared extension point, out of v2 (YAGNI), consistent
with v1's parser decision.

## Error handling

The check runs on every edit, so failure must never block the user's work
(inherited from v1, extended):

- **No knowledge base and no reference** — Tier 1 still runs; Tier 2 stays silent
  and prints a one-line hint to run `uic init`. It does not guess a pattern.
- **Tier 2 over budget or model unavailable** — Tier 1 continues; Tier 2 is skipped
  silently. A missed fuzzy finding is cheaper than a blocked edit.
- **Stale knowledge** — a rule naming a component that no longer exists yields
  nothing for it and is surfaced by `uic audit`, not as a wrong finding mid-edit.
- **Unparseable file** — skip, do not fail (v1).

## Testing

- **Tier 1** — v1's table-driven core tests, extended: source file + knowledge in,
  expected deterministic findings out, covering the new AST checks (hardcoded
  colour/font, deprecated component/prop, raw-primitive-where-canonical-exists).
- **Tier 2** — a **stubbed model**: given a code fragment and retrieved `.md`
  fragments, assert the prompt carries only the relevant fragments (context stays
  small) and that the debounce/budget logic gates calls as specified. The model's
  own judgment is not asserted; the plumbing around it is.
- **Retrieval** — given an edit and a knowledge base, assert the selected fragments
  are the relevant ones and nothing more (the cost guarantee).
- **Adapters** — reference / storybook / neighbours each return the common shape
  from a fixture; the cascade picks the highest-priority available source.
- **Lifecycle** — `uic init` drafts expected files from a fixture Storybook;
  `uic audit` flags a planted staleness (a rule naming a removed component).
- **End-to-end** — the four motivating cases as fixtures: a widget with a hardcoded
  title font and an emoji icon (Tier 1); a detail screen built as a `Dialog` with a
  reference page present (Tier 2); a form skipping its layout holder; a page using a
  raw grid instead of `ActionGrid`.

## Open

- The exact prompt and retrieval heuristic for Tier 2 — how a screen's "kind" is
  inferred from the code to select the right pattern file — needs prototyping
  against the four cases before it is fixed.
- The debounce window and token budget defaults need tuning on real editing
  sessions; start conservative.
- Which model tier Tier 2 uses, and whether it runs through the harness or a direct
  API call, is a packaging question tied to how a free plugin can make model calls
  without configured credentials.
- `uic init` auto-drafting quality — how good a first draft can be generated from
  Storybook alone versus how much hand-tuning it always needs.
- Frameworks beyond TS/TSX remain deferred (v1's position).


## Amendment, 2026-08-25 (#227): the prop level makes three claims, not one

This document describes the prop level as prop *values*. That is one of three
claims the derived contract now makes, and the other two were missing:

1. **The same value** — `scrollable={false}` on every screen. What this document
   described.
2. **Always written** — the prop is present on every screen of the kind and the
   value is that screen's own business. Measured on five real sibling pages,
   `title`, `breadcrumbs` and `dataTestId` were written by all five and captured
   by none, because their values differ — which is what they are supposed to do.
3. **The same shape of value**, where every screen writes the same one: a call
   rather than a raw string. Syntax and never meaning, so it carries no
   vocabulary.

All three stay off the failure path, unchanged: nothing derived may fail an edit.
They reach the agent through the hook's context and through `uic diff --contract`.

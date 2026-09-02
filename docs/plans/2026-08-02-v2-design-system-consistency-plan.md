# v2 Design-System Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the v1 import checker into a design-system consistency checker that catches, in the same turn as the edit, screens and components that do not match the project's own design system — across seven levels from page pattern down to imports.

**Authoritative spec:** `docs/specs/2026-08-02-v2-design-system-consistency-design.md`. Read it first. v1's core (`docs/specs/2026-07-27-v1-mvp-resolution-design.md`) is kept whole and reused, not replaced.

**Architecture:** Three tiers by cost. Tier 1 is a pure synchronous AST function extending v1's `check` — deterministic, ~0 tokens, runs on every edit. The knowledge base is curated Markdown under `.claude/`, read by a lexical retriever. Tier 2 is an async, debounced, budgeted model call behind an interface, fed only the retrieved fragments. Sources of truth (reference / storybook / neighbours) sit behind one adapter interface. Skills (`ui-consistency:*`) are the deliberate surface: generate, audit, deep review.

**Tech stack:** unchanged from v1 — TypeScript (strict), `@babel/parser` for parsing others' code, vitest, esbuild to bundle `bin/uic.mjs`. No new runtime dependency for retrieval (lexical, no embeddings). The model client is behind an interface and stubbed in tests.

## Global Constraints

- **Everything v1 constrained still holds.** Org-agnostic, design-system-agnostic, false-positives-cost-more-than-misses, static analysis only, Node >= 20, ESM.
- **The deterministic gate stays binary.** Tier 1 reports a finding only when it is certain. Tier 2's fuzzy verdicts are advice with their source named — never a hard gate.
- **Tier 1 must never block or slow the edit.** Hard time budget (~100–300 ms target). It is silent on a clean file. It aborts quietly on timeout.
- **Tier 2 is never on the critical path.** The edit completes immediately; the verdict arrives after the debounce window. Over budget → skipped silently.
- **No embeddings, no external services for retrieval.** Knowledge is Markdown; retrieval is lexical.
- **Conventions are curated, never inferred.** Neighbours are the weakest source and always flagged as a heuristic.
- **Nothing project-specific is hardcoded.** Every fixture is a fixture, never a template of one real repo.

## File Structure

New files, alongside v1's untouched `src/layers/`, `src/inventory/`, `src/parse/`, `src/core/check.ts`, `src/core/format.ts`:

| File                                    | Responsibility                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/types.ts`                          | Extended: `Finding` (supersedes/wraps `Violation`), `Level`, `SourceOfTruth`, `Knowledge`, `Verdict` |
| `src/checks/style.ts`                   | Tier 1: hardcoded colour / font-size / spacing literals in JSX → findings                            |
| `src/checks/reuse.ts`                   | Tier 1: raw primitive / emoji-as-icon where a canonical component exists                             |
| `src/checks/props.ts`                   | Tier 1: canonical prop value out of the known set; deprecated prop usage                             |
| `src/checks/deprecated-usage.ts`        | Tier 1: usage (not import) of a `@deprecated` component/prop                                         |
| `src/knowledge/parse.ts`                | Read `.claude/ui-consistency/*.md` → structured `Knowledge`                                          |
| `src/knowledge/retrieve.ts`             | Edited code + `Knowledge` → the relevant fragments (lexical)                                         |
| `src/sources/adapter.ts`                | The `SourceOfTruth` interface + the priority cascade                                                 |
| `src/sources/reference.ts`              | Reference-page adapter (AST over a named file)                                                       |
| `src/sources/storybook.ts`              | Storybook adapter (static `.stories.tsx` AST; MCP optional)                                          |
| `src/sources/neighbours.ts`             | Neighbouring-code adapter (weakest, flagged)                                                         |
| `src/ai/client.ts`                      | The model-client interface + a default implementation                                                |
| `src/ai/review.ts`                      | Tier 2: build the small prompt, call the client, parse the `Verdict`                                 |
| `src/ai/budget.ts`                      | Debounce + token budget + throttle gate                                                              |
| `src/cli/init.ts`                       | `uic init` — auto-draft the knowledge base                                                           |
| `src/cli/audit.ts`                      | `uic audit` — staleness report (read-only)                                                           |
| `skills/ui-consistency-review/SKILL.md` | Deliberate deep design review of a screen                                                            |
| `skills/ui-consistency-init/SKILL.md`   | Guided knowledge-base creation                                                                       |
| `skills/ui-consistency-audit/SKILL.md`  | Guided knowledge-base audit                                                                          |

Each Tier 1 check is its own file so it is independently testable and can be toggled in config. `src/ai/` is isolated so budget/debounce logic never entangles with the AST checks and the model can be stubbed.

## Build order rationale

Tier 1 checks first (they extend a proven base, low risk, immediate value). Then the knowledge base and retrieval (the cost guarantee — prove the context stays small before any model call exists). Then the source cascade. Then Tier 2, prototyped against the four motivating cases as fixtures — the highest-risk work, isolated and last so everything it depends on is already tested. Skills and lifecycle commands close it out.

**Effort guidance for the implementer:** run the whole project on Opus. Raise reasoning effort to **high** for Task 6 (retrieval), Task 7 (source cascade), and Tasks 8–9 (Tier 2) — that is the novel, fuzzy, expensive core where the project succeeds or fails. Tasks 1–5 and 10–12 extend proven patterns and are fine at **medium** effort.

---

### Task 1: Extend the type vocabulary

**Files:**

- Modify: `src/types.ts`
- Test: `tests/types.test.ts`

**Interfaces:**

- Produces: `Level`, `Finding`, `SourceOfTruth`, `SourceKind`, `Knowledge`, `KnowledgeFragment`, `Verdict`

- [x] **Step 1: Write a failing test** asserting a `Finding` carries a `level`, an optional `source`, and that `Violation` is assignable to it (back-compat with v1).
- [x] **Step 2: Add the types.** `Level = 'page-pattern' | 'layout' | 'reuse' | 'style' | 'props' | 'deprecated' | 'import'`. `Finding` extends v1's `Violation` shape with `level: Level`, `source?: SourceKind`, `advisory?: boolean` (true for Tier 2). `SourceKind = 'reference' | 'storybook' | 'knowledge' | 'neighbours'`. `KnowledgeFragment = { id, kind, subject, body, keywords }`. `Verdict = { fits: boolean; note?: string; suggestion?: string }`.
- [x] **Step 3: Typecheck and test.** Existing v1 tests must still pass (no regression).
- [x] **Step 4: Commit.**

---

### Task 2: Tier 1 — hardcoded style literals

The dashboard-widget failure: a title with `fontSize: 12` and hardcoded colours instead of theme tokens.

**Files:**

- Create: `src/checks/style.ts`
- Test: `tests/checks/style.test.ts`

**Interfaces:**

- Consumes: the parsed AST (v1's `@babel/parser` wrapper), `Finding`
- Produces: `styleFindings(filePath, source): Finding[]`

- [x] **Step 1: Failing table-driven test.** Inputs: JSX with `sx={{ fontSize: 12 }}`, `style={{ color: '#3366ff' }}`, a hardcoded `margin: 8`. Expected: one `style`-level finding each, naming the literal. Negatives: `variant="h6"`, `color="primary"`, a token reference → nothing.
- [x] **Step 2: Implement.** Walk JSX attributes for `sx`/`style` object literals; flag numeric font-size/spacing and colour-shaped string literals (`#rgb`, `rgb(`, `hsl(`). Only literals — a variable or theme reference is not a finding (false positives cost more).
- [x] **Step 3: Pass. Commit.**

Note: what counts as "a token exists for this" is not asserted here — that needs the knowledge base (Task 5+). Task 2 flags only the raw literal, which is certain on its own.

---

### Task 3: Tier 1 — component reuse and emoji-as-icon

The widget failure again: emoji instead of Material icons, raw primitives instead of the canonical component.

**Files:**

- Create: `src/checks/reuse.ts`
- Test: `tests/checks/reuse.test.ts`

**Interfaces:**

- Consumes: AST, the v1 inventory (`Inventory`), `Finding`
- Produces: `reuseFindings(filePath, source, chain, inventory): Finding[]`

- [x] **Step 1: Failing test.** JSX text containing an emoji where an icon is expected → `reuse` finding. A raw primitive rendered (`<button>`) where a canonical `Button` is on the chain's inventory → finding naming the canonical component. Negatives: emoji in a comment/string prop that is not an icon slot; a primitive with no canonical equivalent → nothing.
- [x] **Step 2: Implement.** Detect emoji code points in JSX text/children of icon-shaped slots. Detect lowercase intrinsic elements that shadow an inventory symbol of the same role. Reuse v1's inventory so this stays deterministic.
- [x] **Step 3: Pass. Commit.**

---

### Task 4: Tier 1 — prop values and deprecated usage

**Files:**

- Create: `src/checks/props.ts`, `src/checks/deprecated-usage.ts`
- Test: `tests/checks/props.test.ts`, `tests/checks/deprecated-usage.test.ts`

**Interfaces:**

- Produces: `propFindings(...)`, `deprecatedUsageFindings(...)`

- [x] **Step 1: Failing tests.** `props`: a canonical component used with a `variant` outside a known set → finding (the known set comes from the source of truth, injected; with none, no finding). `deprecated-usage`: a JSX element whose component carries `@deprecated` in the inventory → finding naming the `{@link}` replacement (widening v1's import-level `@deprecated` to usage).
- [x] **Step 2: Implement** both, reusing v1's `deprecated.ts` reader. Prop-value checking takes the allowed set as a parameter — it does not invent one.
- [x] **Step 3: Pass. Commit.**

---

### Task 5: The knowledge base — parse `.claude/ui-consistency/*.md`

**Files:**

- Create: `src/knowledge/parse.ts`
- Test: `tests/knowledge/parse.test.ts`
- Create: `tests/fixtures/knowledge/` — sample `.md` files (`detail-screens.md`, `forms.md`, `widgets.md`)

**Interfaces:**

- Produces: `parseKnowledge(dir): Promise<Knowledge>` → `{ fragments: KnowledgeFragment[] }`

- [x] **Step 1: Create fixtures.** Each `.md` is a human-readable rule with a heading and body — e.g. `widgets.md` says titles are `<Typography variant="h6">` and icons come from the icon package, not emoji. No project-specific names; use `@fixture/*`.
- [x] **Step 2: Failing test.** `parseKnowledge` returns one fragment per rule with `subject`, `body`, and `keywords` extracted from headings/emphasised terms.
- [x] **Step 3: Implement.** A small Markdown reader (headings → fragments; no heavy MD dependency). Keywords are the component/screen names mentioned.
- [x] **Step 4: Pass. Commit.**

---

### Task 6: Lexical retrieval — the cost guarantee

**Run at high effort.** This is where "small context" is proven.

**Files:**

- Create: `src/knowledge/retrieve.ts`
- Test: `tests/knowledge/retrieve.test.ts`

**Interfaces:**

- Consumes: edited source (AST), `Knowledge`
- Produces: `retrieve(source, knowledge, opts?): KnowledgeFragment[]` — the relevant fragments, ranked, capped

- [x] **Step 1: Failing test.** Given a widget file and a knowledge base with widget/form/detail rules, `retrieve` returns the widget fragment first and does **not** return the unrelated form/detail fragments. Assert a hard cap on fragment count/size (the cost guarantee) and that an edit matching nothing returns `[]`.
- [x] **Step 2: Implement** lexical matching: extract components used and infer screen-kind signals from the AST, score fragments by keyword overlap, return top-N under a size cap. No embeddings.
- [x] **Step 3: Pass. Commit.**

---

### Task 7: Sources of truth — the adapter cascade

**Run at high effort.**

**Files:**

- Create: `src/sources/adapter.ts`, `src/sources/reference.ts`, `src/sources/storybook.ts`, `src/sources/neighbours.ts`
- Test: `tests/sources/*.test.ts`
- Create: `tests/fixtures/sources/` — a reference page, a `.stories.tsx`, sibling files

**Interfaces:**

- `SourceOfTruth = { kind: SourceKind; describe(target): Promise<SourceModel | null> }` where `SourceModel` names canonical components, allowed prop values, and page/layout patterns
- `resolveSource(opts): Promise<{ model: SourceModel; kind: SourceKind } | null>` — the cascade

- [x] **Step 1: Failing tests per adapter.** Reference: extract the component + prop + layout vocabulary from a named page. Storybook: extract canonical components and their arg sets from `.stories.tsx` statically. Neighbours: derive the common shape from siblings, always tagged as heuristic. Cascade: highest-priority available source wins; none available → `null` (tool stays silent).
- [x] **Step 2: Implement** each behind the interface. Storybook MCP is an optional richer path guarded by a flag; the static AST path is the default and always works offline.
- [x] **Step 3: Pass. Commit.**

---

### Task 8: The model client interface and budget gate

**Run at high effort.**

**Files:**

- Create: `src/ai/client.ts`, `src/ai/budget.ts`
- Test: `tests/ai/budget.test.ts`

**Interfaces:**

- `ModelClient = { review(prompt): Promise<string> }` — the only place a model is called
- `budgetGate(state, now, opts): { allow: boolean; reason?: string }` — debounce + token cap + throttle

- [x] **Step 1: Failing test for the gate** (pure, deterministic, time injected — no `Date.now()` in logic): a burst of edits to the same file within the debounce window collapses to one allowed review of the last; over the token cap → `allow: false`; throttle window respected. The gate is where "never on the critical path / never over budget" is enforced and tested.
- [x] **Step 2: Implement** the gate as a pure function of injected time/state, and the client interface with a default implementation (stubbed in all tests).
- [x] **Step 3: Pass. Commit.**

---

### Task 9: Tier 2 — the fuzzy review, against the four cases

**Run at high effort.** The heart of v2.

**Files:**

- Create: `src/ai/review.ts`
- Test: `tests/ai/review.test.ts` (stubbed model)
- Create: `tests/fixtures/cases/` — the four motivating cases

- [x] **Step 1: Build the four fixtures.** (1) widget with small title font + emoji icon; (2) detail screen built as a `Dialog` with a reference page present; (3) form skipping its layout holder; (4) page using a raw grid instead of the canonical action grid.
- [x] **Step 2: Failing test with a stubbed model.** Assert `review` (a) fires only when Tier 1 is clean, a source exists, and the budget allows; (b) builds a prompt carrying **only** the edited fragment + retrieved knowledge fragments + the source model — never whole files (assert the prompt size/contents); (c) parses the model's reply into a `Verdict` and yields an **advisory** `page-pattern`/`layout` finding naming its source.
- [x] **Step 3: Implement** `review`: assemble the minimal prompt, call the client, parse the verdict, emit advisory findings. The model's judgment is stubbed; the plumbing, gating, and prompt-minimality are what is asserted.
- [x] **Step 4: Pass. Commit.**

---

### Task 10: The combined engine and the hook

**Files:**

- Create: `src/core/engine.ts` (orchestrates Tier 1 → gate → Tier 2)
- Modify: v1's hook entry to call the engine
- Test: `tests/core/engine.test.ts`, adapter test for the hook

**Interfaces:**

- `runEngine(filePath, source, ctx): Promise<{ tier1: Finding[]; tier2?: Promise<Finding[]> }>` — Tier 1 synchronous; Tier 2 returned as a deferred promise so the hook never awaits it on the edit path

- [x] **Step 1: Failing test.** Tier 1 findings come back synchronously; when Tier 1 is clean and a source exists, `tier2` is present and, awaited, yields the stubbed advisory finding; when Tier 1 is dirty, Tier 2 does not fire (deterministic wins, no tokens spent). Hook adapter test: silent on a clean file, injects only Tier 1 text synchronously.
- [x] **Step 2: Implement** the engine and wire the hook. Preserve v1's hook contract: always exit 0, silent by default, project root from the file.
- [x] **Step 3: Pass. Commit.**

---

### Task 11: `uic init` and `uic audit`

**Files:**

- Create: `src/cli/init.ts`, `src/cli/audit.ts`
- Modify: `src/cli/index.ts` (register subcommands)
- Test: `tests/cli/init.test.ts`, `tests/cli/audit.test.ts`

- [x] **Step 1: Failing tests.** `init`: from a fixture Storybook + components, draft `.claude/ui-consistency/*.md` files (a draft, human-editable). `audit`: given a knowledge base naming a component that no longer exists in the inventory, report it stale; report a new canonical component missing from the rules. `audit` is read-only.
- [x] **Step 2: Implement.** `init` reuses the source adapters to draft fragments. `audit` diffs knowledge fragments against the live inventory/Storybook.
- [x] **Step 3: Pass. Commit.**

---

### Task 12: The skills and packaging

**Files:**

- Create: `skills/ui-consistency-review/SKILL.md`, `skills/ui-consistency-init/SKILL.md`, `skills/ui-consistency-audit/SKILL.md`
- Modify: `.claude-plugin/plugin.json` (bump version), `README.md`
- Test: `scripts/gate.sh` includes `claude plugin validate`

- [x] **Step 1: Write the skills.** Namespaced `ui-consistency:*`. `review` walks a deliberate deep design review of a screen (invokes the engine, consults sources, explains). `init`/`audit` guide those workflows. Each has frontmatter `name` + a `description` that says _when_ to use it, so it triggers precisely.
- [x] **Step 2: Update packaging.** Bump `plugin.json` version to `0.2.0`. Update README with the seven levels, the three tiers, the knowledge base, and the lifecycle. Commit the rebuilt `bin/uic.mjs` (the gate refuses to pass with an uncommitted bundle — v1 rule).
- [x] **Step 3: Run the full gate.** Typecheck, all tests (v1 + v2), build, `claude plugin validate`.
- [x] **Step 4: Commit.**

---

## What this plan does not build

- **Framework adapters beyond TS/TSX** (Vue/Svelte `<script>` extraction, Angular decorators) — a declared extension point, deferred as in v1.
- **Embeddings / vector retrieval** — deliberately excluded; lexical over Markdown is the design.
- **A paid tier, telemetry, or licence checks** — free and open, as v1 settled.

## Validate before trusting

After Task 10, run the engine against a real project with a real design system (the motivating monorepo). Tier 1 should catch the widget and grid cases deterministically; Tier 2 should catch the dialog-vs-page and skipped-layout cases when a reference or knowledge base is present. If Tier 2 is noisy or the context is not small, fix that before the skills ship — a fuzzy checker that cries wolf gets switched off, which is the whole argument v1 makes.

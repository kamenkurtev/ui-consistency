# v1 MVP — import resolution

Date: 2026-07-27
Status: draft, pending review. Scope approved; the document itself is unreviewed.

This narrows `docs/design.md` to a first shippable version. It does not replace that document; it picks the smallest part of it that is worth building first and defers the rest. Read `docs/design.md` for the problem statement and the two load-bearing decisions.

## What changed since `docs/design.md`

Four things were learned while designing this, and they move the starting point.

**1. Injection without enforcement has already failed.** `docs/design.md` calls injecting the reference "the half that actually works" and the deterministic check a safety net. That is contradicted by direct experience: an implementation plan naming the components to use was written and handed to the agent before a bulk refactor, and pages still came out inconsistent — different implementations, invented components, omitted elements. A plan is advisory text with nothing forcing closure; across 30 pages in one session it degrades, and nothing verifies that page 15 complied.

The correction: the mechanism is a **closed loop per file** — fresh context, inventory re-supplied, deterministic check, fix, and no advancing until clean. The check is what makes injection stick, not the reverse.

**2. The vocabulary is named, not anonymous.** Projects that hit this problem already have their own components — `core` wrapping the design system, plus common components per lib and per module. The dominant failure is not "the wrong props on a raw primitive"; it is the agent working directly against the design system without noticing that a wrapper already exists.

That makes the role question — which `docs/design.md` left unresolved, "which components are allowed for which role" — largely moot for v1. The role is the component name.

**3. Errors propagate, so nothing may be inferred from neighbouring files.** Many existing pages are implemented wrongly. Any check that derives conventions from surrounding code will derive the mistakes. This is independent confirmation of decision #2 in `docs/design.md`, and it constrains the scan below: the scan may establish what **exists**, never what is **correct**.

**4. Monetization is settled.** `docs/design.md` leaves the outcome open ("deciding that later is fine"). It is decided: free, public, open source, distributed on the plugin marketplace as a credibility asset. No licence checks, no telemetry, no paid tier.

## Scope

**In v1: one check.** A symbol is imported from a layer that is less derived than the file's own chain allows.

Everything else discussed is deferred. Named here so the boundary is explicit, not so it is promised:

- the contract extracted from a reference page — vocabulary, required elements, containment tree
- prop conformance
- theme `defaultProps` / `styleOverrides` as a source of correct props
- hardcoded colour and spacing values where a design token exists
- duplicate-shape detection with extraction proposals

The build order if those are wanted later is A → B → C, where this document is A.

This is a first version, meant to be improved. It is not intended to be complete.

## Why this check first

- It is the largest single failure class observed.
- It is a pure import-graph problem. No JSX analysis, no type evaluation.
- It works before any reference page exists, so there is no onboarding step blocking first value.
- It is agnostic to the design system. The outermost layer is "an external UI library" — MUI, Ant Design, Chakra, anything. The `MUI first` constraint in `docs/design.md` applies to the prop and theme checks that are deferred, not to this one.

## Model

### Layers

A layer is a package or directory that exports UI components. Layers are ordered from nearest to furthest for any given file. Nearest wins: a file must import a symbol from the nearest layer on its chain that exports it.

The ordering is **derived from the dependency graph**, not declared. If `apps/orders` depends on `libs/ui`, which depends on `packages/core`, which depends on `@mui/material`, the topological order is already recorded in the `package.json` files. A topological sort of that graph is the chain.

Detection sources, in the order they are consulted:

- `pnpm-workspace.yaml`, `package.json` → `workspaces`, `nx.json`, `turbo.json` — the set of packages
- each package's `dependencies` — the edges, and therefore the order
- `tsconfig.json` → `compilerOptions.paths` — alias resolution

Single-package projects work unchanged; the chain is just shorter (`src/components` → the UI library).

Detected layers are written to a config file that a human confirms once. The config is an **override**, never a prerequisite. Nothing about a specific organization's directory layout is hardcoded anywhere in the tool.

### Why the extension shape does not matter

A `Button` in a lib may extend `core`'s `Button` by re-export, by `styled(CoreButton)`, or by a hand-written wrapper component. Detecting which of those it is would be the hardest part of this design — and it is unnecessary. The check only needs the **layer order**. Whether the nearer `Button` genuinely extends the further one or merely shares its name, nearest still wins.

This is the simplification that makes v1 small.

### Inventory

A generated, cached artifact. For each layer: the symbols it exports, which of those carry a `@deprecated` JSDoc tag, and the replacement each `@deprecated` points at via `{@link}`.

Regenerated when export surfaces change. Never hand-written — a hand-written inventory goes stale in the week it is written, which is the reason it is scanned at all.

### `@deprecated`

Standard JSDoc, not a custom marker: TypeScript already understands it, editors already strike it through, and it extracts trivially from the AST. The convention is `@deprecated use {@link NewButton} instead`, because a violation message without a replacement is not actionable.

It is treated asymmetrically, and this is easy to get backwards:

- **In the scan** — deprecated symbols are excluded. They must not become candidate patterns or preferred targets.
- **In the check** — deprecated usage is a violation, never skipped. Skipping it would make legacy usage invisible and it would never migrate.

The agent does not see editor strikethrough. That gap is exactly what the hook fills: feedback in the turn rather than in the IDE.

## Architecture

One core, four surfaces.

```
core        (files, inventory) → violations
  ├─ init   detect the chain, human confirms, write config
  ├─ scan   build / refresh the inventory
  ├─ hook   PostToolUse on Write|Edit → violations to the agent, same turn
  └─ check  batch driver → per-file loop, gate before advancing
```

The core is a pure function: no model, no I/O beyond reading. That is what makes it affordable on every edit. The CLI is a wrapper around the same core, not a second implementation.

### The check

For each import in a given file:

1. Resolve the file's location to its ordered layer chain.
2. For the imported symbol, find every layer on that chain that exports it.
3. If the nearest exporting layer is not the layer actually imported from — violation.
4. If the resolved symbol carries `@deprecated` — violation, naming the `{@link}` replacement.

### Violation format

Stated as a fact, with the fix:

```
Button is imported from @mui/material.
apps/orders/common exports Button and is nearer on this file's chain.
→ import { Button } from '@orders/common'
```

### Two surfaces because there are two working modes

The hook serves small-step interactive work — many edits, feedback landing in the same turn. The batch driver serves the 30-page refactor — a gate that does not advance until the file is clean. `docs/design.md` describes the hook and CLI; the driver is the missing adapter, and it is the one that closes the loop that a written plan could not.

A note on why the deterministic surfaces carry the load rather than a skill: a skill fires on the model's own judgment about relevance, and a skill that does not trigger does nothing. A hook always fires. `docs/design.md` already names trigger precision as a first-class constraint.

## Decisions

**The gate is binary.** There are no warnings. If something cannot be asserted with certainty it is not a violation and it is not in v1. A checker that cries wolf gets switched off, which is the same argument `docs/design.md` makes against custom lint rules.

**Pass-through re-exports still count.** If a layer re-exports a symbol from the UI library without wrapping it, importing from the UI library directly is still a violation. The behavioural benefit is nil but the import source becomes single and the rule stays exception-free. This is a setting with this default, not a hardcoded decision.

**Name collisions resolve by proximity, without interpretation.** If two layers export the same name meaning different things, nearest still wins. The tool does not attempt to detect that they are unrelated.

## Packaging and distribution

The plugin follows the standard Claude Code layout. Only the manifest lives in `.claude-plugin/`; every other directory sits at the plugin root, which is the most commonly reported mistake.

```
ui-consistency/
├── .claude-plugin/plugin.json   manifest only
├── bin/                          init, scan, check executables
├── hooks/hooks.json              PostToolUse on Write|Edit
├── skills/                       if any are added later
└── README.md
```

`bin/` matters more than it looks: executables there are added to the Bash tool's `PATH` while the plugin is enabled. The core and the CLI therefore ship with the plugin and there is no separate `npm install` step for the user. Given that adoption is the whole return on a free plugin, removing that step is worth designing around.

`plugin.json` sets an explicit `version`. Without it, a git-distributed plugin treats every commit as a new version; with it, users update only when the field is bumped.

`claude plugin validate` runs in the repo gate, not only before submission — the community review pipeline runs the same check, so a failure should surface locally first.

Distribution is the `claude-community` marketplace, submitted through the Console form (the claude.ai form requires a Team or Enterprise organization). Submissions get a review plus automated safety screening. Approved plugins are pinned to a commit SHA, and CI advances the pin as commits land. The official `claude-plugins-official` marketplace is curated by Anthropic at its discretion and has no application process, so it is not a plan.

Skills shipped by a plugin are always namespaced — `/ui-consistency:<name>`.

## Decision: a JSX-aware parser, not the compiler

**Amended 2026-07-28.** The first version of this section chose `es-module-lexer` on size. That was wrong, and the way it was wrong is worth recording: a lexer that cannot read the files this tool exists to read is not a cheaper option, it is a non-option.

The tool is written in TypeScript and typechecked in `strict` mode, but it does **not** use the TypeScript compiler API to parse other people's code.

| | Bundle | Cold start | Reads real `.tsx` |
| --- | --- | --- | --- |
| with `typescript` | 9.5 MB | 0.20–0.25 s | yes |
| with `@babel/parser` | 280 KB | 0.05 s | yes — 7216 of 7216 |
| with `es-module-lexer` | 18 KB | 0.04 s | **no — failed 1346 of 1797** |
| bare node | 1 KB | 0.04 s | — |

The last column is the one that decides. Measured against a public monorepo of the same shape as the motivating one (a core package wrapping MUI, dozens of plugin packages above it), `es-module-lexer` is a JavaScript lexer: it throws on `<div>hi</div>` and so on three quarters of the repository's `.tsx` files. The failure is silent by design — an unreadable file yields nothing rather than a guess — so the CLI reported zero violations across 1114 files and looked like a clean bill of health. Every unit test passed the entire time, because every fixture written for them happened to contain no JSX.

`@babel/parser` costs 280 KB and 0.02 s over the lexer and reads everything. That is the whole trade. The compiler would also work and costs thirty times the bundle for nothing v1 needs.

`errorRecovery` is off. Thirteen files in that repository fail outright; they yield no violations, which is correct — a miss is cheaper than a violation invented from a half-recovered AST.

An AST also deletes code rather than adding it. The JSDoc block scanner, the brace-clause splitter and the line counter were all workarounds for not having one: Babel attaches comments to the statements they lead and reports positions directly. The asynchronous initialisation goes too — it existed only for the lexer's WASM init — so the core is a synchronous function throughout.

Since false positives cost more than misses, anything the parser cannot read yields nothing rather than a guess.

`typescript` stays in `devDependencies` for typechecking our own source and is never imported from `src/`.

### Frameworks beyond React

The check reads import declarations, not JSX, so it is not React-specific. `@babel/parser` with the `typescript` plugin reads plain `.ts`, which covers Angular and any framework whose components are TypeScript classes or functions — though Angular's decorators need the `decorators` plugin enabled, which is not yet done or tested. Single-file component formats (`.vue`, `.svelte`) are not valid TypeScript and need their `<script>` block extracted before parsing. Neither is in v1; both are small additions to one file.

## Error handling

The check runs on every edit, so failure must never block the user's work.

- **No config and detection fails** — the hook stays silent and prints a one-line hint to run `uic init`. It does not guess.
- **Stale inventory** — a symbol resolves to a layer that no longer exports it. Report nothing for that symbol and mark the inventory stale rather than emitting a wrong violation. A false positive is more expensive than a miss.
- **Unparseable file** — skip the file, do not fail the run.
- **Dynamic or computed imports** — out of scope. Static import declarations only.

## Testing

The core is a pure function, which makes it directly testable without the hook or the CLI.

- **Fixture workspaces** for the detection layer: pnpm workspace, npm workspaces, Nx, Turborepo, and a single-package project. Each asserts the derived layer order.
- **Table-driven core tests**: an inventory plus a source file in, an expected violation list out. This is where the resolution rules, `@deprecated` handling, pass-through behaviour, and collisions are covered.
- **Adapter tests** assert only that the hook and the driver call the core and format its output. No checking logic is tested twice.
- The end-to-end case worth having: a fixture repo where a file imports from the UI library while a nearer layer exports the same symbol, run through the driver, asserting the gate blocks and then passes after the fix.

## What the first real run found (2026-07-28)

Run against a public monorepo of the same shape as the motivating one, 1114 `.tsx` files, 0.2 s per 200-file batch.

Three bugs, none of which any unit test could have caught, because every fixture was written by the same person who wrote the rules:

1. **Sibling layers were read as a hierarchy.** A file was faulted for importing `Extension` from the UI library's icon package because an unrelated package also exported an `Extension` — an icon and a plugin type, the same string and nothing else. Position on the chain is meaningless between packages that do not depend on one another. Fixed: only a layer that reaches another through its dependencies may claim a symbol.
2. **The parser could not read JSX.** See the dependency decision above.
3. Fixtures had no barrels, so `export *` was never followed and every real package's inventory would have come back empty.

**253 violations across 1114 files after the fixes. Roughly a quarter are real** — `import Button from '@material-ui/core/Button'` where the core package exports its own `Button` — which is exactly the case this tool exists for. The rest fall into two classes that need resolving before the hook ships:

- **Migration direction is not dependency direction (~54).** The repository is moving from an old plugin API to a new one, and the old package depends on the new one, so the graph calls the old one "nearer" and the tool recommends moving backwards. Dependency order cannot express "we are migrating away from this". This may be what `@deprecated` is for, or it may need a config key.
- **Within-layer noise (~40).** A component inside the UI package imports a primitive from a third-party headless library, and the tool points at the package's own export. The message no longer suggests a circular import, but the finding is still mostly noise inside the layer that does the wrapping. Consider suppressing by default, with a flag to include.

## Resolved (2026-07-29): the two false-positive classes

Same sweep, 1114 files: **253 findings to 69**, with all 49 correct MUI findings kept.

**Within the file's own layer** — suppressed by default, `--within-layer` to include. 94 of the 253, and 39 of those were a design system's components reaching for the headless primitives they are built from, which is what that layer is for. The check still produces them; showing them is policy, and policy lives in the CLI rather than in the check.

**Undeclared recommendations** — never emitted. A package reachable only transitively does not resolve under a strict `node_modules` layout, so the advice would not compile. 11 findings.

**Migration direction** — `prefer: [...]` in `.uicrc.json`, naming layers that outrank the graph. This is the one thing that had to be told rather than derived: `core-components` wraps `@material-ui/core` and `core-components` is being replaced by `@backstage/ui` are structurally identical, and `createRouteRef` is independently defined in both the old and new API package rather than re-exported, so pass-through detection does not separate them either. Documented `@deprecated`-first — the check already reads it and can name the replacement — with `prefer` for packages a project does not control.

A `legacy: [...]` key was tried and rejected: suppressing `core-components` as a recommendation would also have suppressed the correct MUI findings, which name the same package. "Do not recommend this layer" and "this layer is being replaced" are different predicates.

**A defect promotion exposed.** When the nearest exporting layer failed the ancestor test, the whole import was abandoned rather than the search continuing. A chain carrying two design systems therefore lost real findings: the first candidate had no relation to the import, and the second, which wrapped it, was never considered. Fixed independently of any config — 151 findings rather than 149 with none.

Exempting a preferred layer from the ancestor test was tried first and produced 954 findings: promotion plus no structural check turns every name collision with the preferred package into a finding. That is a migration backlog, not a gate.

## The hook, as built (2026-07-31)

`PostToolUse` on `Write|Edit|MultiEdit`, answering through
`hookSpecificOutput.additionalContext` on stdout. Not the legacy stderr-plus-exit-2 shape: `PostToolUse` is a member of the `hookSpecificOutput` union, so the modern protocol is the one that validates.

**It always exits 0 and it is silent by default.** Silence is the answer to a clean file, an unreadable file type, a tool that does not write, and every malformed payload. Being wrong about an edit is bad; interrupting one is worse.

**The project root comes from the file, not the session.** A hook is handed a file path, and the working directory need not be the project — so `findProjectRoot` walks up to the nearest enclosing workspace. Nearest rather than outermost, or a checkout inside another JavaScript project gets swallowed by it.

**The inventory is cached on disk**, keyed on the mtimes of every file the build read. Parsing a monorepo's barrels costs about 300 ms — nothing once per CLI run, unaffordable per edit. The hook is 0.83 s cold and **0.12 s warm** on a 229-package repository. One entry per chain rather than per layer: edits land in application files, not in barrels, so the common case hits either way, and a changed barrel is worth one honest rebuild rather than a partial-invalidation scheme to get wrong.

**The bundle is committed to git.** `bin/*.mjs` was ignored while the hook pointed at `${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs` — the plugin would not have worked for anyone who installed it, since installation is a clone with no build. A committed artefact can drift from its source, so the gate refuses to pass while `bin/` has uncommitted changes.

## Open

- 9 of the remaining 69 are borderline — a symbol defined independently in both a data package and its React wrapper. Not yet judged.
- Angular needs the `decorators` Babel plugin; `.vue` and `.svelte` need their `<script>` block extracted. Neither is done.
- The layer-detection heuristics need validation against more real repositories. One is not a sample. Monorepo tooling varies more than the four fixture cases.
- Whether the driver should re-run the whole file check or only the changed imports after a fix is an implementation detail to settle when the loop is built.
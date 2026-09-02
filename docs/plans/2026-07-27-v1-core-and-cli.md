# v1 Core and CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working `uic check <file>` that reports every import taken from a layer less derived than the file's own chain allows.

**Architecture:** Three stages, each a pure function over data from the previous one. Workspace detection produces a package graph; a topological walk of that graph produces the ordered layer chain for any file; a scan of the chain's packages produces an inventory of exported symbols and their `@deprecated` status. The check consumes a file plus the chain plus the inventory and returns violations. No model, no network, no I/O beyond reading files.

**Tech Stack:** TypeScript, the TypeScript compiler API for all parsing (imports, export maps, and JSDoc alike), vitest for tests, esbuild to bundle `bin/uic` into a single file with a shebang.

## Global Constraints

- **Org-agnostic.** No directory layout, package name, or design system may be hardcoded. Every fixture is a fixture, never a template of one real repo.
- **Design-system-agnostic.** The outermost layer is "an external UI library". Never special-case `@mui/material` in `src/`.
- **The core is pure.** `src/core/` reads no files and takes no paths it resolves itself. Callers pass in source text, chain, and inventory.
- **Binary results.** A violation is certain or it is not reported. No warning severity, no confidence score.
- **False positives cost more than misses.** When data is stale or ambiguous, report nothing.
- **Static imports only.** `import ... from '...'` declarations. Dynamic and computed imports are out of scope for v1.
- Node >= 20. ESM (`"type": "module"`).
- Authoritative spec: `docs/specs/2026-07-27-v1-mvp-resolution-design.md`.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/types.ts` | Shared data types. No logic. |
| `src/layers/detect.ts` | Workspace files → list of packages with their dependencies |
| `src/layers/chain.ts` | A file path + packages → that file's ordered layer chain |
| `src/layers/config.ts` | Read and write `.uicrc.json`; config overrides detection |
| `src/inventory/exports.ts` | A package → its exported symbol names |
| `src/inventory/deprecated.ts` | A declaration → `@deprecated` and its `{@link}` replacement |
| `src/inventory/build.ts` | Assemble and cache the `Inventory` |
| `src/core/check.ts` | `(source, chain, inventory) → Violation[]`. The whole check. |
| `src/core/format.ts` | `Violation → string` |
| `src/cli/index.ts` | Arg parsing and the `init`, `scan`, `check` subcommands |

Split by responsibility. `detect` and `chain` are separate because detection touches the filesystem and chain resolution is pure — the second is where the interesting tests live and it must be testable without fixtures on disk.

---

### Task 1: Toolchain and gate

Covers issue #4. Nothing else can be tested until this exists.

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `scripts/gate.sh`
- Create: `src/types.ts`
- Test: `tests/types.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: the type vocabulary every later task uses — `PackageInfo`, `Layer`, `ExportedSymbol`, `Inventory`, `Violation`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "ui-consistency",
  "version": "0.1.0",
  "description": "Keeps AI-generated UI consistent with your project's own component vocabulary",
  "license": "MIT",
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "build": "esbuild src/cli/index.ts --bundle --platform=node --format=esm --outfile=bin/uic.mjs --banner:js='#!/usr/bin/env node'",
    "gate": "bash scripts/gate.sh"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "esbuild": "^0.24.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src", "tests"]
}
```

`noUncheckedIndexedAccess` is deliberate: the inventory is a map of maps and every lookup can miss. The compiler should force that to be handled.

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules/
bin/*.mjs
.idea/
.DS_Store
*.tsbuildinfo
```

- [ ] **Step 5: Create `scripts/gate.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "==> typecheck"
npm run typecheck

echo "==> tests"
npm run test

echo "==> build"
npm run build

echo "==> plugin validate"
if command -v claude >/dev/null 2>&1; then
  claude plugin validate .
else
  echo "claude CLI not found; skipping plugin validate"
fi

echo "gate passed"
```

`claude plugin validate` runs the same check the community review pipeline runs, so a failure surfaces here rather than at submission. It is skipped rather than fatal when the CLI is absent, so CI without Claude Code installed still works.

- [ ] **Step 6: Create `src/types.ts`**

```ts
/** A package discovered in the workspace. */
export interface PackageInfo {
  /** The name it is imported by, e.g. "@acme/core". */
  name: string;
  /** Absolute path to the package root. */
  root: string;
  /** Names of packages this one depends on, workspace-internal or not. */
  dependencies: string[];
}

/** One step on a file's resolution chain. */
export interface Layer {
  name: string;
  root: string | null;
}

/** What the inventory knows about one exported symbol. */
export interface ExportedSymbol {
  deprecated: boolean;
  /** The {@link Target} named by an @deprecated tag, if any. */
  replacement: string | null;
}

/** Layer name -> symbol name -> what is known about it. */
export interface Inventory {
  layers: Record<string, Record<string, ExportedSymbol>>;
}

export type ViolationReason = 'nearer-layer' | 'deprecated';

export interface Violation {
  file: string;
  /** 1-indexed. */
  line: number;
  symbol: string;
  /** The module specifier actually imported from. */
  importedFrom: string;
  /** The layer name that should have been imported from. */
  expectedFrom: string;
  reason: ViolationReason;
  /** Only set when reason is 'deprecated'. */
  replacement?: string;
}
```

- [ ] **Step 7: Write a test that proves the toolchain runs**

Create `tests/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Violation } from '../src/types.js';

describe('toolchain', () => {
  it('compiles and runs a test against the shared types', () => {
    const v: Violation = {
      file: 'apps/orders/pages/List.tsx',
      line: 3,
      symbol: 'Button',
      importedFrom: '@mui/material',
      expectedFrom: '@orders/common',
      reason: 'nearer-layer',
    };
    expect(v.reason).toBe('nearer-layer');
  });
});
```

- [ ] **Step 8: Install and run the gate**

Run: `npm install && npm run test`
Expected: 1 test passes.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
chmod +x scripts/gate.sh
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore scripts/gate.sh src/types.ts tests/types.test.ts
git commit -m "Set up toolchain, gate and shared types

Refs #4"
```

---

### Task 2: Detect workspace packages

Covers part of issue #1.

**Files:**
- Create: `src/layers/detect.ts`
- Test: `tests/layers/detect.test.ts`
- Create: `tests/fixtures/pnpm-ws/`, `tests/fixtures/npm-ws/`, `tests/fixtures/single/`

**Interfaces:**
- Consumes: `PackageInfo` from `src/types.ts`
- Produces: `detectPackages(rootDir: string): Promise<PackageInfo[]>`

- [ ] **Step 1: Create the fixture workspaces**

```bash
mkdir -p tests/fixtures/pnpm-ws/packages/core tests/fixtures/pnpm-ws/apps/orders
mkdir -p tests/fixtures/npm-ws/packages/ui tests/fixtures/npm-ws/apps/web
mkdir -p tests/fixtures/single/src/components
```

`tests/fixtures/pnpm-ws/pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

`tests/fixtures/pnpm-ws/package.json`:

```json
{ "name": "pnpm-ws-root", "private": true }
```

`tests/fixtures/pnpm-ws/packages/core/package.json`:

```json
{
  "name": "@fixture/core",
  "version": "1.0.0",
  "dependencies": { "some-ui-lib": "^5.0.0" }
}
```

`tests/fixtures/pnpm-ws/apps/orders/package.json`:

```json
{
  "name": "@fixture/orders",
  "version": "1.0.0",
  "dependencies": { "@fixture/core": "workspace:*" }
}
```

`tests/fixtures/npm-ws/package.json`:

```json
{
  "name": "npm-ws-root",
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
```

`tests/fixtures/npm-ws/packages/ui/package.json`:

```json
{ "name": "@fixture/ui", "version": "1.0.0", "dependencies": { "some-ui-lib": "^5.0.0" } }
```

`tests/fixtures/npm-ws/apps/web/package.json`:

```json
{ "name": "@fixture/web", "version": "1.0.0", "dependencies": { "@fixture/ui": "*" } }
```

`tests/fixtures/single/package.json`:

```json
{ "name": "single-app", "version": "1.0.0", "dependencies": { "some-ui-lib": "^5.0.0" } }
```

The fixture UI library is called `some-ui-lib`, not `@mui/material`. Nothing in `src/` may know the name of any real design system.

- [ ] **Step 2: Write the failing test**

Create `tests/layers/detect.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { detectPackages } from '../../src/layers/detect.js';

const fixture = (name: string) =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

describe('detectPackages', () => {
  it('finds packages declared by pnpm-workspace.yaml', async () => {
    const packages = await detectPackages(fixture('pnpm-ws'));
    const names = packages.map((p) => p.name).sort();
    expect(names).toEqual(['@fixture/core', '@fixture/orders']);
  });

  it('records each package dependencies', async () => {
    const packages = await detectPackages(fixture('pnpm-ws'));
    const orders = packages.find((p) => p.name === '@fixture/orders');
    expect(orders?.dependencies).toEqual(['@fixture/core']);
  });

  it('finds packages declared by npm workspaces', async () => {
    const packages = await detectPackages(fixture('npm-ws'));
    const names = packages.map((p) => p.name).sort();
    expect(names).toEqual(['@fixture/ui', '@fixture/web']);
  });

  it('treats a single-package project as one package', async () => {
    const packages = await detectPackages(fixture('single'));
    expect(packages.map((p) => p.name)).toEqual(['single-app']);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/layers/detect.test.ts`
Expected: FAIL — cannot resolve `../../src/layers/detect.js`.

- [ ] **Step 4: Implement `detectPackages`**

Create `src/layers/detect.ts`:

```ts
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { PackageInfo } from '../types.js';

/** Read a JSON file, returning null when it is missing or malformed. */
async function readJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Glob patterns in workspace files are limited in practice to `dir/*` and
 * plain paths, so a full glob dependency is not warranted.
 */
async function expandPattern(rootDir: string, pattern: string): Promise<string[]> {
  if (!pattern.includes('*')) return [resolve(rootDir, pattern)];
  const base = resolve(rootDir, pattern.slice(0, pattern.indexOf('*')));
  try {
    const entries = await readdir(base, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => join(base, e.name));
  } catch {
    return [];
  }
}

async function workspacePatterns(rootDir: string): Promise<string[]> {
  const yaml = await readFile(join(rootDir, 'pnpm-workspace.yaml'), 'utf8').catch(() => null);
  if (yaml !== null) {
    return [...yaml.matchAll(/^\s*-\s*['"]?([^'"\n]+)['"]?\s*$/gm)].map((m) => m[1]!.trim());
  }
  const pkg = await readJson(join(rootDir, 'package.json'));
  const workspaces = pkg?.['workspaces'];
  if (Array.isArray(workspaces)) return workspaces.filter((w): w is string => typeof w === 'string');
  if (workspaces && typeof workspaces === 'object') {
    const nested = (workspaces as { packages?: unknown }).packages;
    if (Array.isArray(nested)) return nested.filter((w): w is string => typeof w === 'string');
  }
  return [];
}

async function toPackageInfo(dir: string): Promise<PackageInfo | null> {
  const pkg = await readJson(join(dir, 'package.json'));
  const name = pkg?.['name'];
  if (typeof name !== 'string') return null;
  const deps = pkg['dependencies'];
  const dependencies =
    deps && typeof deps === 'object' ? Object.keys(deps as Record<string, unknown>) : [];
  return { name, root: dir, dependencies };
}

/**
 * Discover every package in the project. Monorepo layout is read from the
 * project's own workspace files; a project with none is a single package.
 */
export async function detectPackages(rootDir: string): Promise<PackageInfo[]> {
  const patterns = await workspacePatterns(rootDir);

  if (patterns.length === 0) {
    const single = await toPackageInfo(rootDir);
    return single ? [single] : [];
  }

  const dirs = (await Promise.all(patterns.map((p) => expandPattern(rootDir, p)))).flat();
  const found = await Promise.all(
    dirs.map(async (dir) => {
      const s = await stat(dir).catch(() => null);
      return s?.isDirectory() ? toPackageInfo(dir) : null;
    }),
  );
  return found.filter((p): p is PackageInfo => p !== null);
}
```

Note that a workspace root's own `package.json` is not returned as a package when patterns exist. Roots are usually `private` scaffolding with no exports, and treating one as a layer would put it on every chain.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/layers/detect.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/layers/detect.ts tests/layers/detect.test.ts tests/fixtures
git commit -m "Detect workspace packages from the project's own config

Refs #1"
```

---

### Task 3: Resolve a file's layer chain

Covers part of issue #1. This is the heart of the ordering rule and it is pure, so it needs no fixtures on disk.

**Files:**
- Create: `src/layers/chain.ts`
- Test: `tests/layers/chain.test.ts`

**Interfaces:**
- Consumes: `PackageInfo`, `Layer` from `src/types.ts`
- Produces: `resolveChain(filePath: string, packages: PackageInfo[]): Layer[]` — nearest first

- [ ] **Step 1: Write the failing test**

Create `tests/layers/chain.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveChain } from '../../src/layers/chain.js';
import type { PackageInfo } from '../../src/types.js';

const packages: PackageInfo[] = [
  { name: '@acme/orders', root: '/repo/apps/orders', dependencies: ['@acme/ui', 'some-ui-lib'] },
  { name: '@acme/ui', root: '/repo/libs/ui', dependencies: ['@acme/core'] },
  { name: '@acme/core', root: '/repo/packages/core', dependencies: ['some-ui-lib'] },
];

describe('resolveChain', () => {
  it('puts the containing package first', () => {
    const chain = resolveChain('/repo/apps/orders/pages/List.tsx', packages);
    expect(chain[0]?.name).toBe('@acme/orders');
  });

  it('orders dependencies topologically, not by distance', () => {
    // `some-ui-lib` is a direct dependency of orders and `@acme/core` is two
    // steps away, but core depends on some-ui-lib, so core is the nearer layer.
    // Ordering by hop count would let a page import from the UI library while
    // a wrapper for the same symbol sits unused in core.
    const chain = resolveChain('/repo/apps/orders/pages/List.tsx', packages);
    expect(chain.map((l) => l.name)).toEqual([
      '@acme/orders',
      '@acme/ui',
      '@acme/core',
      'some-ui-lib',
    ]);
  });

  it('includes external dependencies as layers with no root', () => {
    const chain = resolveChain('/repo/apps/orders/pages/List.tsx', packages);
    expect(chain.find((l) => l.name === 'some-ui-lib')).toEqual({
      name: 'some-ui-lib',
      root: null,
    });
  });

  it('gives a deeper package the nearer position when roots nest', () => {
    const nested: PackageInfo[] = [
      { name: '@acme/app', root: '/repo/apps/app', dependencies: [] },
      { name: '@acme/feature', root: '/repo/apps/app/features/cart', dependencies: ['@acme/app'] },
    ];
    const chain = resolveChain('/repo/apps/app/features/cart/Cart.tsx', nested);
    expect(chain[0]?.name).toBe('@acme/feature');
  });

  it('returns an empty chain for a file in no known package', () => {
    expect(resolveChain('/elsewhere/File.tsx', packages)).toEqual([]);
  });

  it('does not loop forever on a dependency cycle', () => {
    const cyclic: PackageInfo[] = [
      { name: 'a', root: '/repo/a', dependencies: ['b'] },
      { name: 'b', root: '/repo/b', dependencies: ['a'] },
    ];
    expect(resolveChain('/repo/a/File.tsx', cyclic).map((l) => l.name)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/layers/chain.test.ts`
Expected: FAIL — cannot resolve `../../src/layers/chain.js`.

- [ ] **Step 3: Implement `resolveChain`**

Create `src/layers/chain.ts`:

```ts
import { relative, isAbsolute } from 'node:path';
import type { Layer, PackageInfo } from '../types.js';

function contains(root: string, filePath: string): boolean {
  const rel = relative(root, filePath);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

/** The package whose root is the deepest one containing the file. */
function owningPackage(filePath: string, packages: PackageInfo[]): PackageInfo | null {
  let best: PackageInfo | null = null;
  for (const pkg of packages) {
    if (!contains(pkg.root, filePath)) continue;
    if (best === null || pkg.root.length > best.root.length) best = pkg;
  }
  return best;
}

/**
 * The ordered layer chain for a file, nearest first.
 *
 * The order is topological over the dependency graph, not breadth-first. A
 * package is nearer than everything it depends on, however many hops away that
 * is: if `core` wraps the external UI library, `core` must outrank the library
 * even when a page depends on both directly. Ordering by hop count would let a
 * page import from the library while the wrapper sits unused.
 *
 * Derived from the project's own `package.json` dependencies, so no repository
 * has to declare its layering by hand.
 */
export function resolveChain(filePath: string, packages: PackageInfo[]): Layer[] {
  const owner = owningPackage(filePath, packages);
  if (owner === null) return [];

  const byName = new Map(packages.map((p) => [p.name, p]));
  const ordered: Layer[] = [];
  const done = new Set<string>();
  const onStack = new Set<string>();

  // Post-order DFS: a package is emitted only after everything it depends on,
  // then the whole list is reversed. `onStack` makes a dependency cycle
  // terminate — a cycle is the user's repo, not an error worth reporting.
  const visit = (name: string): void => {
    if (done.has(name) || onStack.has(name)) return;
    onStack.add(name);

    const pkg = byName.get(name);
    for (const dep of pkg?.dependencies ?? []) visit(dep);

    onStack.delete(name);
    done.add(name);
    ordered.push({ name, root: pkg?.root ?? null });
  };

  visit(owner.name);
  return ordered.reverse();
}
```

Breadth-first ordering was the original design here and it is wrong. It ranks layers by hop count, so a direct dependency on the external UI library would outrank a wrapper package reached through one more step — exactly the import the tool exists to catch.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/layers/chain.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layers/chain.ts tests/layers/chain.test.ts
git commit -m "Resolve a file's layer chain from the dependency graph

Refs #1"
```

---

### Task 4: Read exported symbols from a package

Covers part of issue #3.

**Files:**
- Create: `src/inventory/exports.ts`
- Test: `tests/inventory/exports.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `exportedSymbols(entryFile: string): Set<string>` and `entryFileFor(packageRoot: string): string | null`

- [ ] **Step 1: Write the failing test**

Create `tests/inventory/exports.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { exportedSymbolsFromSource } from '../../src/inventory/exports.js';

describe('exportedSymbolsFromSource', () => {
  it('reads named export declarations', () => {
    const symbols = exportedSymbolsFromSource(`
      export const Button = () => null;
      export function Card() { return null; }
      export class Table {}
    `);
    expect([...symbols].sort()).toEqual(['Button', 'Card', 'Table']);
  });

  it('reads export lists', () => {
    const symbols = exportedSymbolsFromSource(`
      const Button = () => null;
      const Card = () => null;
      export { Button, Card };
    `);
    expect([...symbols].sort()).toEqual(['Button', 'Card']);
  });

  it('reads re-exports and honours renaming', () => {
    const symbols = exportedSymbolsFromSource(`
      export { Button as AcmeButton } from 'some-ui-lib';
    `);
    expect([...symbols]).toEqual(['AcmeButton']);
  });

  it('ignores default exports, which have no importable name', () => {
    const symbols = exportedSymbolsFromSource(`export default function Page() {}`);
    expect([...symbols]).toEqual([]);
  });

  it('returns nothing for unparseable input rather than throwing', () => {
    expect([...exportedSymbolsFromSource('const = = =')]).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/inventory/exports.test.ts`
Expected: FAIL — cannot resolve `../../src/inventory/exports.js`.

- [ ] **Step 3: Implement `exportedSymbolsFromSource`**

Create `src/inventory/exports.ts`:

```ts
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function parse(source: string, fileName = 'input.tsx'): ts.SourceFile {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  );
}

/**
 * Every name this source exports under an importable identifier.
 *
 * Default exports are excluded: they carry no name at the import site, so a
 * resolution rule cannot say anything about them.
 */
export function exportedSymbolsFromSource(source: string): Set<string> {
  const names = new Set<string>();
  let sourceFile: ts.SourceFile;
  try {
    sourceFile = parse(source);
  } catch {
    return names;
  }

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause;
      if (clause && ts.isNamedExports(clause)) {
        for (const element of clause.elements) names.add(element.name.text);
      }
      continue;
    }

    if (!hasExportModifier(statement)) continue;

    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) names.add(decl.name.text);
      }
    } else if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)) &&
      statement.name
    ) {
      names.add(statement.name.text);
    }
  }

  return names;
}

const ENTRY_CANDIDATES = ['src/index.ts', 'src/index.tsx', 'index.ts', 'index.tsx', 'src/index.js', 'index.js'];

/** The entry file a package's exports are read from, or null when there is none. */
export async function entryFileFor(packageRoot: string): Promise<string | null> {
  const pkgPath = join(packageRoot, 'package.json');
  const raw = await readFile(pkgPath, 'utf8').catch(() => null);
  if (raw !== null) {
    try {
      const pkg = JSON.parse(raw) as { source?: unknown; main?: unknown; module?: unknown };
      for (const field of [pkg.source, pkg.module, pkg.main]) {
        if (typeof field === 'string') return join(packageRoot, field);
      }
    } catch {
      // fall through to the conventional candidates
    }
  }
  for (const candidate of ENTRY_CANDIDATES) {
    const path = join(packageRoot, candidate);
    if ((await readFile(path, 'utf8').catch(() => null)) !== null) return path;
  }
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/inventory/exports.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/inventory/exports.ts tests/inventory/exports.test.ts
git commit -m "Read exported symbol names from a package entry

Refs #3"
```

---

### Task 5: Read `@deprecated` and its `{@link}` replacement

Covers part of issue #3.

**Files:**
- Create: `src/inventory/deprecated.ts`
- Test: `tests/inventory/deprecated.test.ts`

**Interfaces:**
- Consumes: `parse` from `src/inventory/exports.ts`, `ExportedSymbol` from `src/types.ts`
- Produces: `deprecationsFromSource(source: string): Map<string, string | null>` — symbol name to replacement name, present only for deprecated symbols

- [ ] **Step 1: Write the failing test**

Create `tests/inventory/deprecated.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { deprecationsFromSource } from '../../src/inventory/deprecated.js';

describe('deprecationsFromSource', () => {
  it('finds a deprecated symbol and its {@link} replacement', () => {
    const found = deprecationsFromSource(`
      /** @deprecated use {@link NewButton} instead */
      export const OldButton = () => null;
    `);
    expect(found.get('OldButton')).toBe('NewButton');
  });

  it('records a deprecated symbol with no replacement as null', () => {
    const found = deprecationsFromSource(`
      /** @deprecated do not use */
      export const OldButton = () => null;
    `);
    expect(found.has('OldButton')).toBe(true);
    expect(found.get('OldButton')).toBeNull();
  });

  it('does not report symbols with no @deprecated tag', () => {
    const found = deprecationsFromSource(`
      /** A perfectly good button. */
      export const Button = () => null;
    `);
    expect(found.has('Button')).toBe(false);
  });

  it('handles deprecated function and class declarations', () => {
    const found = deprecationsFromSource(`
      /** @deprecated use {@link Card} */
      export function Panel() { return null; }
      /** @deprecated use {@link DataGrid} */
      export class Table {}
    `);
    expect(found.get('Panel')).toBe('Card');
    expect(found.get('Table')).toBe('DataGrid');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/inventory/deprecated.test.ts`
Expected: FAIL — cannot resolve `../../src/inventory/deprecated.js`.

- [ ] **Step 3: Implement `deprecationsFromSource`**

Create `src/inventory/deprecated.ts`:

```ts
import ts from 'typescript';
import { parse } from './exports.js';

/** The name inside the first {@link Target} of a JSDoc tag comment. */
function linkTarget(comment: string | ts.NodeArray<ts.JSDocComment> | undefined): string | null {
  if (comment === undefined) return null;
  const text =
    typeof comment === 'string'
      ? comment
      : comment.map((part) => (ts.isJSDocLink(part) ? (part.name?.getText() ?? '') : part.text)).join('');
  const match = /\{@link\s+([A-Za-z_$][\w$]*)/.exec(text);
  return match ? match[1]! : null;
}

function deprecationOf(node: ts.Node): { deprecated: boolean; replacement: string | null } {
  for (const tag of ts.getJSDocTags(node)) {
    if (tag.tagName.text === 'deprecated') {
      return { deprecated: true, replacement: linkTarget(tag.comment) };
    }
  }
  return { deprecated: false, replacement: null };
}

/**
 * Deprecated exported symbols, mapped to their replacement or null.
 *
 * Standard JSDoc is used rather than a custom marker: TypeScript and editors
 * already understand `@deprecated`, so nothing new has to be adopted.
 */
export function deprecationsFromSource(source: string): Map<string, string | null> {
  const found = new Map<string, string | null>();
  let sourceFile: ts.SourceFile;
  try {
    sourceFile = parse(source);
  } catch {
    return found;
  }

  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      // The JSDoc sits on the statement; the name sits on the declaration.
      const { deprecated, replacement } = deprecationOf(statement);
      if (!deprecated) continue;
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) found.set(decl.name.text, replacement);
      }
      continue;
    }

    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)) &&
      statement.name
    ) {
      const { deprecated, replacement } = deprecationOf(statement);
      if (deprecated) found.set(statement.name.text, replacement);
    }
  }

  return found;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/inventory/deprecated.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/inventory/deprecated.ts tests/inventory/deprecated.test.ts
git commit -m "Extract @deprecated tags and their {@link} replacements

Refs #3"
```

---

### Task 6: Assemble the inventory

Covers the rest of issue #3.

**Files:**
- Create: `src/inventory/build.ts`
- Test: `tests/inventory/build.test.ts`

**Interfaces:**
- Consumes: `entryFileFor`, `exportedSymbolsFromSource`, `deprecationsFromSource`, `Layer`, `Inventory`
- Produces: `buildInventory(layers: Layer[], io?: InventoryIO): Promise<Inventory>` where
  `InventoryIO = { readSource?: (path: string) => Promise<string | null>; resolveEntry?: (packageRoot: string) => Promise<string | null> }`

Both sides of I/O are injectable. `resolveEntry` has to be too, or the test would need a real directory tree on disk just to find an entry file.

- [ ] **Step 1: Write the failing test**

Create `tests/inventory/build.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildInventory } from '../../src/inventory/build.js';
import type { Layer } from '../../src/types.js';

const layers: Layer[] = [
  { name: '@acme/core', root: '/repo/packages/core' },
  { name: 'some-ui-lib', root: null },
];

const sources: Record<string, string> = {
  '/repo/packages/core/src/index.ts': `
    export const Button = () => null;
    /** @deprecated use {@link Button} instead */
    export const LegacyButton = () => null;
  `,
};

const io = {
  readSource: async (path: string) => sources[path] ?? null,
  resolveEntry: async (root: string) =>
    root === '/repo/packages/core' ? '/repo/packages/core/src/index.ts' : null,
};

describe('buildInventory', () => {
  it('records the symbols a layer exports', async () => {
    const inventory = await buildInventory(layers, io);
    expect(Object.keys(inventory.layers['@acme/core'] ?? {}).sort()).toEqual([
      'Button',
      'LegacyButton',
    ]);
  });

  it('marks deprecated symbols and their replacement', async () => {
    const inventory = await buildInventory(layers, io);
    expect(inventory.layers['@acme/core']?.['LegacyButton']).toEqual({
      deprecated: true,
      replacement: 'Button',
    });
  });

  it('leaves healthy symbols undeprecated', async () => {
    const inventory = await buildInventory(layers, io);
    expect(inventory.layers['@acme/core']?.['Button']).toEqual({
      deprecated: false,
      replacement: null,
    });
  });

  it('records a layer with no readable entry as empty rather than omitting it', async () => {
    const inventory = await buildInventory(layers, io);
    expect(inventory.layers['some-ui-lib']).toEqual({});
  });
});
```

The last case matters: a layer present but empty means "nothing known here", which the check must treat as "no nearer alternative", not as a missing layer.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/inventory/build.test.ts`
Expected: FAIL — cannot resolve `../../src/inventory/build.js`.

- [ ] **Step 3: Implement `buildInventory`**

Create `src/inventory/build.ts`:

```ts
import { readFile } from 'node:fs/promises';
import type { ExportedSymbol, Inventory, Layer } from '../types.js';
import { entryFileFor, exportedSymbolsFromSource } from './exports.js';
import { deprecationsFromSource } from './deprecated.js';

export interface InventoryIO {
  readSource?: (path: string) => Promise<string | null>;
  resolveEntry?: (packageRoot: string) => Promise<string | null>;
}

const readFromDisk = (path: string) => readFile(path, 'utf8').catch(() => null);

/**
 * Build the inventory for a chain of layers.
 *
 * The inventory records what **exists**, never what is correct. Deriving
 * correctness from the surrounding codebase would enshrine the mistakes that
 * are already propagated through it.
 *
 * Both sides of I/O are injectable so the assembly logic is testable without a
 * fixture tree on disk.
 */
export async function buildInventory(layers: Layer[], io: InventoryIO = {}): Promise<Inventory> {
  const readSource = io.readSource ?? readFromDisk;
  const resolveEntry = io.resolveEntry ?? entryFileFor;
  const inventory: Inventory = { layers: {} };

  for (const layer of layers) {
    const symbols: Record<string, ExportedSymbol> = {};
    inventory.layers[layer.name] = symbols;

    if (layer.root === null) continue;
    const entry = await resolveEntry(layer.root);
    if (entry === null) continue;
    const source = await readSource(entry);
    if (source === null) continue;

    const deprecations = deprecationsFromSource(source);
    for (const name of exportedSymbolsFromSource(source)) {
      const deprecated = deprecations.has(name);
      symbols[name] = {
        deprecated,
        replacement: deprecated ? (deprecations.get(name) ?? null) : null,
      };
    }
  }

  return inventory;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/inventory/build.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/inventory/build.ts tests/inventory/build.test.ts
git commit -m "Assemble the layer inventory from exports and deprecations

Refs #3"
```

---

### Task 7: The resolution check

Covers issue #2. This is the whole of v1's checking logic and it is a pure function.

Rewritten after the switch to `es-module-lexer` (the original text used the TypeScript compiler API, which was dropped — see `docs/specs/2026-07-27-v1-mvp-resolution-design.md`). **Implemented; kept here for the record.**

**Files:**
- Create: `src/core/check.ts`
- Test: `tests/core/check.test.ts`

**Interfaces:**
- Consumes: `scanModule` from `src/parse/lexer.ts`, `exportedSymbolsFromSource` from `src/inventory/exports.ts`, `Layer`/`Inventory`/`Violation` from `src/types.ts`
- Produces: `checkSource(filePath, source, chain, inventory): Violation[]`

The lexer reports a module specifier and the statement's extent, not the named
bindings. The bindings are read from the statement slice the lexer delimited —
bounded text, so an import mentioned in a comment or a string cannot leak in.

Four rules the compiler-API draft got wrong, each with a test:

1. **A module that exports a name may source that name from anywhere.**
   Otherwise every wrapper in the layer that does the wrapping is faulted for
   wrapping: `packages/core/src/Button.tsx` importing the library's `Button`
   would be told to import `@acme/core`'s — its own output. This is the
   blocking false positive.
2. **Resolve the specifier to a layer, don't compare strings.** `@acme/core/Card`
   is `@acme/core`, by longest matching prefix. A subpath of the layer that
   *should* have been imported from passes; that is a style question, not
   resolution, and MUI's own canonical style is subpath imports.
3. **Only flag specifiers that name a layer on the chain.** `import { Card }
   from 'unrelated-utils'` where a layer happens to export a `Card` is a name
   collision. Relative specifiers name no layer and are skipped.
4. **A default import from a subpath names its last segment.**
   `import Button from '@mui/material/Button'` is the commonest real-world
   shape of the mistake this tool exists to catch, and dropping `default`
   everywhere would make it invisible.

Known and deferred: when the nearest layer is the file's own, the message names
the layer rather than the path inside it. Revisit after the dogfood run.

Type-only imports (statement or inline `type` specifier), namespace imports and
dynamic imports (`d !== -1`) are all skipped. The test file must
`await initScanner()` in `beforeAll`, or every parse returns null and the suite
passes vacuously.

- [x] Implemented, 18 tests passing.

---

### Task 8: Format violations

Covers the reporting half of issue #2.

**Files:**
- Create: `src/core/format.ts`
- Test: `tests/core/format.test.ts`

**Interfaces:**
- Consumes: `Violation` from `src/types.ts`
- Produces: `formatViolation(v: Violation): string`

- [ ] **Step 1: Write the failing test**

Create `tests/core/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatViolation } from '../../src/core/format.js';

describe('formatViolation', () => {
  it('states the nearer-layer fact and the fix', () => {
    const text = formatViolation({
      file: 'apps/orders/List.tsx',
      line: 3,
      symbol: 'Button',
      importedFrom: 'some-ui-lib',
      expectedFrom: '@acme/orders',
      reason: 'nearer-layer',
    });
    expect(text).toBe(
      [
        'apps/orders/List.tsx:3',
        'Button is imported from some-ui-lib.',
        "@acme/orders exports Button and is nearer on this file's chain.",
        "→ import { Button } from '@acme/orders'",
      ].join('\n'),
    );
  });

  it('names the replacement for a deprecated symbol', () => {
    const text = formatViolation({
      file: 'apps/orders/List.tsx',
      line: 7,
      symbol: 'LegacyTable',
      importedFrom: '@acme/core',
      expectedFrom: '@acme/core',
      reason: 'deprecated',
      replacement: 'DataGrid',
    });
    expect(text).toBe(
      [
        'apps/orders/List.tsx:7',
        'LegacyTable is deprecated in @acme/core.',
        "→ import { DataGrid } from '@acme/core'",
      ].join('\n'),
    );
  });

  it('omits the fix line for a deprecated symbol with no replacement', () => {
    const text = formatViolation({
      file: 'apps/orders/List.tsx',
      line: 7,
      symbol: 'LegacyTable',
      importedFrom: '@acme/core',
      expectedFrom: '@acme/core',
      reason: 'deprecated',
    });
    expect(text).toBe(
      ['apps/orders/List.tsx:7', 'LegacyTable is deprecated in @acme/core.'].join('\n'),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/core/format.test.ts`
Expected: FAIL — cannot resolve `../../src/core/format.js`.

- [ ] **Step 3: Implement `formatViolation`**

Create `src/core/format.ts`:

```ts
import type { Violation } from '../types.js';

/**
 * A violation stated as a fact with the fix attached.
 *
 * Not an opinion and not a severity: the check is binary, so the wording never
 * hedges. A message without an actionable fix is not worth emitting.
 */
export function formatViolation(v: Violation): string {
  const lines = [`${v.file}:${v.line}`];

  if (v.reason === 'nearer-layer') {
    lines.push(`${v.symbol} is imported from ${v.importedFrom}.`);
    lines.push(`${v.expectedFrom} exports ${v.symbol} and is nearer on this file's chain.`);
    lines.push(`→ import { ${v.symbol} } from '${v.expectedFrom}'`);
    return lines.join('\n');
  }

  lines.push(`${v.symbol} is deprecated in ${v.importedFrom}.`);
  if (v.replacement !== undefined) {
    lines.push(`→ import { ${v.replacement} } from '${v.expectedFrom}'`);
  }
  return lines.join('\n');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/core/format.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/format.ts tests/core/format.test.ts
git commit -m "Format violations as facts with the fix attached

Refs #2"
```

---

### Task 9: Config read and write

Covers the rest of issue #1.

**Files:**
- Create: `src/layers/config.ts`
- Test: `tests/layers/config.test.ts`

**Interfaces:**
- Consumes: `PackageInfo` from `src/types.ts`
- Produces: `readConfig(rootDir)`, `writeConfig(rootDir, config)`, `applyConfig(detected, config)`, and the `UicConfig` type

- [ ] **Step 1: Write the failing test**

Create `tests/layers/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { applyConfig } from '../../src/layers/config.js';
import type { PackageInfo } from '../../src/types.js';

const detected: PackageInfo[] = [
  { name: '@acme/orders', root: '/repo/apps/orders', dependencies: ['@acme/core'] },
  { name: '@acme/core', root: '/repo/packages/core', dependencies: ['some-ui-lib'] },
];

describe('applyConfig', () => {
  it('returns detection unchanged when there is no config', () => {
    expect(applyConfig(detected, null)).toEqual(detected);
  });

  it('drops packages the config ignores', () => {
    const result = applyConfig(detected, { ignore: ['@acme/core'] });
    expect(result.map((p) => p.name)).toEqual(['@acme/orders']);
  });

  it('overrides the dependencies of a named package', () => {
    const result = applyConfig(detected, {
      packages: { '@acme/orders': { dependencies: ['some-ui-lib'] } },
    });
    expect(result.find((p) => p.name === '@acme/orders')?.dependencies).toEqual(['some-ui-lib']);
  });

  it('leaves packages the config does not mention alone', () => {
    const result = applyConfig(detected, {
      packages: { '@acme/orders': { dependencies: [] } },
    });
    expect(result.find((p) => p.name === '@acme/core')?.dependencies).toEqual(['some-ui-lib']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/layers/config.test.ts`
Expected: FAIL — cannot resolve `../../src/layers/config.js`.

- [ ] **Step 3: Implement the config module**

Create `src/layers/config.ts`:

```ts
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PackageInfo } from '../types.js';

export const CONFIG_FILE = '.uicrc.json';

export interface UicConfig {
  /** Package names to leave off every chain. */
  ignore?: string[];
  /** Per-package overrides of what detection found. */
  packages?: Record<string, { dependencies?: string[] }>;
}

export async function readConfig(rootDir: string): Promise<UicConfig | null> {
  const raw = await readFile(join(rootDir, CONFIG_FILE), 'utf8').catch(() => null);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as UicConfig;
  } catch {
    return null;
  }
}

export async function writeConfig(rootDir: string, config: UicConfig): Promise<void> {
  await writeFile(join(rootDir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/**
 * Config is an override, never a prerequisite. Detection alone must produce a
 * usable result, or the first run demands that someone describe their own repo
 * by hand and the tool never gets adopted.
 */
export function applyConfig(detected: PackageInfo[], config: UicConfig | null): PackageInfo[] {
  if (config === null) return detected;

  const ignored = new Set(config.ignore ?? []);
  return detected
    .filter((pkg) => !ignored.has(pkg.name))
    .map((pkg) => {
      const override = config.packages?.[pkg.name];
      if (override?.dependencies === undefined) return pkg;
      return { ...pkg, dependencies: override.dependencies };
    });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/layers/config.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layers/config.ts tests/layers/config.test.ts
git commit -m "Read, write and apply the override config

Refs #1"
```

---

### Task 10: Wire the CLI and prove it end to end

Completes issues #1, #2, #3 and closes #4's gate.

**Files:**
- Create: `src/cli/index.ts`
- Test: `tests/cli/e2e.test.ts`
- Create: `tests/fixtures/e2e/` — a workspace where a page imports from the UI library while a nearer layer exports the same symbol

**Interfaces:**
- Consumes: everything above
- Produces: `uic init`, `uic scan`, `uic check <file...>`

- [ ] **Step 1: Create the end-to-end fixture**

```bash
mkdir -p tests/fixtures/e2e/packages/core/src tests/fixtures/e2e/apps/orders/src
```

`tests/fixtures/e2e/pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

`tests/fixtures/e2e/package.json`:

```json
{ "name": "e2e-root", "private": true }
```

`tests/fixtures/e2e/packages/core/package.json`:

```json
{ "name": "@fixture/core", "version": "1.0.0", "source": "src/index.ts", "dependencies": { "some-ui-lib": "^5.0.0" } }
```

`tests/fixtures/e2e/packages/core/src/index.ts`:

```ts
export const Button = () => null;

/** @deprecated use {@link Button} instead */
export const LegacyButton = () => null;
```

`tests/fixtures/e2e/apps/orders/package.json`:

```json
{ "name": "@fixture/orders", "version": "1.0.0", "source": "src/index.ts", "dependencies": { "@fixture/core": "workspace:*" } }
```

`tests/fixtures/e2e/apps/orders/src/index.ts`:

```ts
export const OrdersPage = () => null;
```

`tests/fixtures/e2e/apps/orders/src/List.tsx`:

```tsx
import { Button } from 'some-ui-lib';
import { LegacyButton } from '@fixture/core';

export const List = () => null;
```

- [ ] **Step 2: Write the failing test**

Create `tests/cli/e2e.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkProject } from '../../src/cli/index.js';

const root = fileURLToPath(new URL('../fixtures/e2e', import.meta.url));

describe('checkProject', () => {
  it('reports the import taken from the UI library when a nearer layer exports it', async () => {
    const violations = await checkProject(root, [join(root, 'apps/orders/src/List.tsx')]);
    const nearer = violations.filter((v) => v.reason === 'nearer-layer');
    expect(nearer).toHaveLength(1);
    expect(nearer[0]).toMatchObject({
      symbol: 'Button',
      importedFrom: 'some-ui-lib',
      expectedFrom: '@fixture/core',
    });
  });

  it('reports the deprecated import with its replacement', async () => {
    const violations = await checkProject(root, [join(root, 'apps/orders/src/List.tsx')]);
    const deprecated = violations.filter((v) => v.reason === 'deprecated');
    expect(deprecated).toHaveLength(1);
    expect(deprecated[0]).toMatchObject({ symbol: 'LegacyButton', replacement: 'Button' });
  });

  it('reports nothing for a file that only imports from its nearest layer', async () => {
    const clean = join(root, 'apps/orders/src/index.ts');
    expect(await checkProject(root, [clean])).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/cli/e2e.test.ts`
Expected: FAIL — cannot resolve `../../src/cli/index.js`.

- [ ] **Step 4: Implement the CLI**

Create `src/cli/index.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { detectPackages } from '../layers/detect.js';
import { resolveChain } from '../layers/chain.js';
import { readConfig, writeConfig, applyConfig } from '../layers/config.js';
import { buildInventory } from '../inventory/build.js';
import { checkSource } from '../core/check.js';
import { formatViolation } from '../core/format.js';
import type { Violation } from '../types.js';

/** Check the given files against the project's own layer chain. */
export async function checkProject(rootDir: string, files: string[]): Promise<Violation[]> {
  const packages = applyConfig(await detectPackages(rootDir), await readConfig(rootDir));
  if (packages.length === 0) return [];

  const violations: Violation[] = [];
  for (const file of files) {
    const chain = resolveChain(file, packages);
    if (chain.length === 0) continue;

    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null) continue;

    const inventory = await buildInventory(chain);
    violations.push(...checkSource(file, source, chain, inventory));
  }
  return violations;
}

async function init(rootDir: string): Promise<number> {
  const packages = await detectPackages(rootDir);
  if (packages.length === 0) {
    console.error('No packages detected. Is this a JavaScript or TypeScript project?');
    return 1;
  }
  console.log('Detected packages:');
  for (const pkg of packages) {
    console.log(`  ${pkg.name} → ${pkg.dependencies.join(', ') || '(no dependencies)'}`);
  }
  const existing = await readConfig(rootDir);
  await writeConfig(rootDir, existing ?? {});
  console.log(`\nWrote .uicrc.json. Edit it to override anything detection got wrong.`);
  return 0;
}

async function scan(rootDir: string): Promise<number> {
  const packages = applyConfig(await detectPackages(rootDir), await readConfig(rootDir));
  const layers = packages.map((p) => ({ name: p.name, root: p.root }));
  const inventory = await buildInventory(layers);
  for (const [name, symbols] of Object.entries(inventory.layers)) {
    const total = Object.keys(symbols).length;
    const deprecated = Object.values(symbols).filter((s) => s.deprecated).length;
    console.log(`${name}: ${total} exports${deprecated > 0 ? `, ${deprecated} deprecated` : ''}`);
  }
  return 0;
}

async function check(rootDir: string, files: string[]): Promise<number> {
  if (files.length === 0) {
    console.error('Usage: uic check <file...>');
    return 1;
  }
  const violations = await checkProject(rootDir, files.map((f) => resolve(f)));
  for (const violation of violations) console.log(`${formatViolation(violation)}\n`);
  return violations.length > 0 ? 1 : 0;
}

export async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  const rootDir = process.cwd();

  switch (command) {
    case 'init':
      return init(rootDir);
    case 'scan':
      return scan(rootDir);
    case 'check':
      return check(rootDir, rest);
    default:
      console.error('Usage: uic <init|scan|check>');
      return 1;
  }
}

// Only run when executed, not when imported by a test.
if (process.argv[1]?.endsWith('uic.mjs') === true) {
  process.exit(await main(process.argv.slice(2)));
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/cli/e2e.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 6: Run the full gate**

Run: `npm run gate`
Expected: typecheck clean, all tests pass, `bin/uic.mjs` produced.

- [ ] **Step 7: Verify the built CLI runs**

Run: `cd tests/fixtures/e2e && node ../../../bin/uic.mjs check apps/orders/src/List.tsx`
Expected: two violations printed, exit code 1.

- [ ] **Step 8: Commit**

```bash
git add src/cli/index.ts tests/cli/e2e.test.ts tests/fixtures/e2e
git commit -m "Wire init, scan and check into the CLI

Closes #1, closes #2, closes #3, closes #4"
```

---

## What this plan does not build

Plan 2 covers the `PostToolUse` hook (#5), the batch driver with its per-file gate (#6), and plugin packaging and marketplace submission (#7). Everything above is deliberately usable without them: `uic check` on a real repository is the first honest test of whether the layer detection heuristics survive contact with a codebase that nobody wrote for this tool.

Run it against a real monorepo before starting Plan 2. If detection is wrong there, the adapters would only propagate the error faster.

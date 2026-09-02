import type { File } from '@babel/types';
import { parseModule } from '../parse/parse.js';
import { exportedSymbolsOf } from '../inventory/exports.js';
import type { Inventory, Layer, Violation } from '../types.js';
import { layerFor } from '../layers/chain.js';

interface ImportedName {
  /** The name as exported by the source module, not the local alias. */
  symbol: string;
  specifier: string;
  line: number;
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * The symbol a default import stands for, when the specifier is a subpath.
 *
 * `import Button from '@mui/material/Button'` is the commonest real-world
 * shape of the mistake this check exists to catch, and a default export
 * carries no name of its own. A bare package name is not evidence: a scoped
 * name is two segments already, and its second segment is the package.
 */
function subpathSymbol(specifier: string): string | null {
  const segments = specifier.split('/');
  const bareLength = specifier.startsWith('@') ? 2 : 1;
  if (segments.length <= bareLength) return null;
  const last = segments[segments.length - 1]!;
  return IDENTIFIER.test(last) ? last : null;
}

function staticImports(ast: File): ImportedName[] {
  const found: ImportedName[] = [];

  for (const statement of ast.program.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    // A type-only import cannot affect what renders, so it is never a violation.
    if (statement.importKind === 'type') continue;

    const specifier = statement.source.value;
    const line = statement.loc?.start.line ?? 1;

    for (const binding of statement.specifiers) {
      if (binding.type === 'ImportSpecifier') {
        if (binding.importKind === 'type') continue;
        const imported = binding.imported;
        if (imported.type !== 'Identifier') continue;
        found.push({ symbol: imported.name, specifier, line });
        continue;
      }
      if (binding.type === 'ImportDefaultSpecifier') {
        const symbol = subpathSymbol(specifier);
        if (symbol !== null) found.push({ symbol, specifier, line });
      }
      // A namespace import names no symbol at all.
    }
  }

  return found;
}

/**
 * Whether `from` reaches `to` through its dependencies.
 *
 * Position on the chain is not enough. Two packages that merely sit in the same
 * repository are siblings, and between siblings the topological order is
 * arbitrary — neither is "nearer". Only a layer that actually depends on
 * another, however many hops away, may claim a symbol should have come from it.
 * Without this, any two packages that happen to export the same name fault each
 * other: a UI library's `Extension` icon and a plugin API's `Extension` type
 * are the same string and nothing else.
 */
function reaches(from: Layer, to: string, byName: Map<string, Layer>): boolean {
  const seen = new Set<string>();
  const queue = [...from.dependencies];

  while (queue.length > 0) {
    const name = queue.pop()!;
    if (name === to) return true;
    if (seen.has(name)) continue;
    seen.add(name);
    queue.push(...(byName.get(name)?.dependencies ?? []));
  }
  return false;
}

/**
 * The one check in v1: a symbol must come from the nearest layer on the file's
 * chain that exports it.
 *
 * Nothing here inspects JSX or evaluates types. Detecting *how* a nearer layer
 * relates to a further one — re-export, wrapper, `styled()` — is deliberately
 * unnecessary; only the chain order matters.
 */
export function checkSource(
  filePath: string,
  source: string,
  chain: Layer[],
  inventory: Inventory,
): Violation[] {
  const own = chain[0];
  if (own === undefined) return [];

  const ast = parseModule(source, filePath);
  if (ast === null) return [];

  // A fix is only a fix if the file can actually write it. A package reachable
  // only transitively does not resolve under a strict node_modules layout, so
  // recommending it would be advice that does not compile.
  const importable = new Set([own.name, ...own.dependencies]);

  // A module that exports a name is plausibly where that name comes from, so
  // it may source its own basis from anywhere. Without this, every wrapper in
  // the layer that does the wrapping is faulted for wrapping.
  const ownExports = exportedSymbolsOf(ast);

  // Built once. `reaches` used to build it per call, and it is called once per
  // (import x importable layer) — on a chain of several hundred layers that is
  // loop-invariant Map construction repeated thousands of times per file, on
  // the path with a 0.12 s budget (#153).
  const byName = new Map(chain.map((layer) => [layer.name, layer]));

  const violations: Violation[] = [];

  for (const imported of staticImports(ast)) {
    if (ownExports.has(imported.symbol)) continue;

    const from = layerFor(imported.specifier, chain);
    // A specifier off the chain that happens to share a name with a layer's
    // symbol is a collision, not a resolution error.
    if (from === null) continue;

    // The nearest layer that exports the symbol, can actually be imported by
    // this file, and stands in a real relation to where the symbol was taken
    // from. A candidate failing the last test does not end the search: a
    // further layer down the chain may still be the honest answer.
    const nearest = chain.find(
      (layer) =>
        importable.has(layer.name) &&
        inventory.layers[layer.name]?.[imported.symbol] !== undefined &&
        (layer.name === from.name || reaches(layer, from.name, byName)),
    );
    if (nearest === undefined) continue;
    const entry = inventory.layers[nearest.name]?.[imported.symbol];
    if (entry === undefined) continue;

    if (from.name !== nearest.name) {
      violations.push({
        file: filePath,
        line: imported.line,
        symbol: imported.symbol,
        importedFrom: imported.specifier,
        expectedFrom: nearest.name,
        reason: 'nearer-layer',
        // Telling a file in @acme/core to `import from '@acme/core'` would be
        // a circular import. The fact still holds; the fix is a path we do not
        // resolve yet, so none is offered.
        ...(nearest.name === own.name ? { withinOwnLayer: true } : {}),
      });
      continue;
    }

    if (entry.deprecated) {
      violations.push({
        file: filePath,
        line: imported.line,
        symbol: imported.symbol,
        importedFrom: imported.specifier,
        expectedFrom: nearest.name,
        reason: 'deprecated',
        ...(entry.replacement !== null ? { replacement: entry.replacement } : {}),
      });
    }
  }

  return violations;
}

import type { File } from '@babel/types';
import { parseModule, walk } from '../parse/parse.js';
import type { Finding, Inventory, Layer } from '../types.js';
import { layerFor } from '../layers/chain.js';

/** Local JSX name -> the symbol it was imported as, and from which layer. */
interface ImportedComponent {
  symbol: string;
  layer: string;
}

function importedComponents(ast: File, chain: Layer[]): Map<string, ImportedComponent> {
  const found = new Map<string, ImportedComponent>();

  for (const statement of ast.program.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    if (statement.importKind === 'type') continue;

    const layer = layerFor(statement.source.value, chain);
    if (layer === null) continue;

    for (const binding of statement.specifiers) {
      if (binding.type !== 'ImportSpecifier') continue;
      if (binding.importKind === 'type') continue;
      const imported = binding.imported;
      if (imported.type !== 'Identifier') continue;
      // The local name is what JSX will say; the imported name is what the
      // inventory knows it by.
      found.set(binding.local.name, { symbol: imported.name, layer: layer.name });
    }
  }

  return found;
}

/**
 * Tier 1: rendering a component the inventory marks `@deprecated`.
 *
 * This widens v1, which faults the import. The import is written once; the
 * usage is what a reviewer sees, and a file that imports once and renders in
 * four places gets four findings — one per place that has to change.
 *
 * Only an imported name counts. A local component that happens to share a name
 * with a deprecated export is a different thing entirely.
 */
export function deprecatedUsageFindings(
  filePath: string,
  source: string,
  chain: Layer[],
  inventory: Inventory,
): Finding[] {
  if (chain.length === 0) return [];

  const ast = parseModule(source, filePath);
  if (ast === null) return [];

  const imported = importedComponents(ast, chain);
  if (imported.size === 0) return [];

  const findings: Finding[] = [];

  walk(ast.program, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    if (node.name.type !== 'JSXIdentifier') return;

    const origin = imported.get(node.name.name);
    if (origin === undefined) return;

    const entry = inventory.layers[origin.layer]?.[origin.symbol];
    if (entry === undefined || !entry.deprecated) return;

    const replacement = entry.replacement;
    findings.push({
      file: filePath,
      line: node.loc?.start.line ?? 1,
      level: 'deprecated',
      symbol: origin.symbol,
      expectedFrom: origin.layer,
      message:
        replacement === null
          ? `${origin.symbol} is deprecated in ${origin.layer}.`
          : `${origin.symbol} is deprecated in ${origin.layer}. Use ${replacement} instead.`,
      ...(replacement === null ? {} : { replacement }),
    });
  });

  return findings.sort((a, b) => a.line - b.line);
}

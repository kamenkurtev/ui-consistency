import { parseModule, walk } from '../parse/parse.js';
import { exportedSymbolsOf } from '../inventory/exports.js';
import type { SubstitutionRule } from '../knowledge/rules.js';
import type { Finding, Inventory, Layer } from '../types.js';
import { quoted } from '../core/quote.js';

/** The nearest layer this file may import from that exports `symbol`. */
function reachableExporter(symbol: string, chain: Layer[], inventory: Inventory): string | null {
  const own = chain[0];
  if (own === undefined) return null;
  // Own layer plus direct dependencies, as everywhere else: a transitively
  // reachable package does not resolve under a strict node_modules layout, so
  // naming it would be advice that does not compile.
  const importable = new Set([own.name, ...own.dependencies]);

  for (const layer of chain) {
    if (!importable.has(layer.name)) continue;
    const entry = inventory.layers[layer.name]?.[symbol];
    if (entry !== undefined && !entry.deprecated) return layer.name;
  }
  return null;
}

/**
 * Tier 1: a component the project has written down as the wrong one, rendered
 * where the rule says the canonical one belongs.
 *
 * This is the check the four motivating failures needed. A project can state
 * "a page of actions uses `<ActionGrid>`, never a raw `<Grid>`", and until now
 * nothing read it — the import check only fires when the *same* symbol is
 * exported by a nearer layer, and `Grid` and `ActionGrid` are different names.
 *
 * Deterministic and curated: the rule is a declaration a person wrote, not a
 * pattern inferred from neighbouring code. No rule, no finding — which is why
 * this can be a hard finding at all.
 */
export function substitutionFindings(
  filePath: string,
  source: string,
  rules: SubstitutionRule[],
  chain: Layer[],
  inventory: Inventory,
): Finding[] {
  if (rules.length === 0 || chain.length === 0) return [];

  const ast = parseModule(source, filePath);
  if (ast === null) return [];

  // The file that implements `ActionGrid` has to render a `Grid`. Faulting it
  // would fault the design system for existing.
  const ownExports = exportedSymbolsOf(ast);

  const wanted = new Map<string, { rule: SubstitutionRule; from: string }>();
  for (const rule of rules) {
    if (ownExports.has(rule.canonical)) continue;
    const from = reachableExporter(rule.canonical, chain, inventory);
    // Nothing on this file's chain offers the replacement, so there is no fix
    // to name and therefore nothing worth saying.
    if (from === null) continue;
    for (const name of rule.forbidden) {
      if (!wanted.has(name)) wanted.set(name, { rule, from });
    }
  }
  if (wanted.size === 0) return [];

  const findings: Finding[] = [];
  walk(ast.program, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    if (node.name.type !== 'JSXIdentifier') return;

    const match = wanted.get(node.name.name);
    if (match === undefined) return;

    findings.push({
      file: filePath,
      line: node.loc?.start.line ?? 1,
      level: 'reuse',
      source: 'knowledge',
      symbol: node.name.name,
      expectedFrom: match.from,
      message: `<${quoted(node.name.name)}> is not what this project uses here. "${quoted(match.rule.subject)}" says to use ${quoted(match.rule.canonical)}, which ${quoted(match.from)} exports.`,
    });
  });

  return findings.sort((a, b) => a.line - b.line);
}

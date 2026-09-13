import { parseModule, walk } from '../parse/parse.js';
import { exportedSymbolsOf } from '../parse/exports.js';
import type { SubstitutionRule } from '../knowledge/rules.js';
import type { Finding } from '../types.js';
import { quoted } from '../core/quote.js';

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
 *
 * ~~It also asked which layer exports the replacement, and said nothing where
 * none on this file's chain did.~~ **Name-only since #81**, with the package
 * graph. That silence was the whole of the check on two repository shapes in
 * three — a chain readable on 0 of 15 sampled files on one real
 * `package.json`-workspace monorepo — so a rule a person had written down
 * produced nothing there, while the template dialects, which never had a chain
 * to ask, reported it. The asymmetry was an accident of which parser the file
 * went through, and removing it makes the two halves agree.
 *
 * What is lost is the `, which @ws/ui exports` clause. That is now the
 * project's own sentence to write, in `rules/imports-and-layers.md`.
 */
export function substitutionFindings(
  filePath: string,
  source: string,
  rules: SubstitutionRule[],
): Finding[] {
  if (rules.length === 0) return [];

  const ast = parseModule(source, filePath);
  if (ast === null) return [];

  // The file that implements `ActionGrid` has to render a `Grid`. Faulting it
  // would fault the design system for existing.
  const ownExports = exportedSymbolsOf(ast);

  const wanted = new Map<string, { rule: SubstitutionRule }>();
  for (const rule of rules) {
    if (ownExports.has(rule.canonical)) continue;
    for (const name of rule.forbidden) {
      if (!wanted.has(name)) wanted.set(name, { rule });
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
      message: `<${quoted(node.name.name)}> is not what this project uses here. "${quoted(match.rule.subject)}" says to use ${quoted(match.rule.canonical)}.`,
    });
  });

  return findings.sort((a, b) => a.line - b.line);
}

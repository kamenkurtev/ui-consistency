import type { JSXOpeningElement } from '@babel/types';
import { parseModule, walk } from '../parse/parse.js';
import type { Finding, PropConventions, SourceKind } from '../types.js';
import { quoted } from '../core/quote.js';

function componentName(opening: JSXOpeningElement): string | null {
  const name = opening.name;
  // A member expression (`<Foo.Bar>`) names a namespace, which the conventions
  // do not describe. Lowercase intrinsics are `reuse`'s subject, not this.
  if (name.type !== 'JSXIdentifier') return null;
  return /^[A-Z]/.test(name.name) ? name.name : null;
}

/**
 * Tier 1: a canonical component used with a value outside the set the project
 * itself allows.
 *
 * **The allowed set is injected, never invented.** With no source of truth for
 * a component there is no finding — a set guessed from surrounding code would
 * enforce whatever mistake happened to be most common, which is the failure
 * this project exists to avoid.
 */
export function propFindings(
  filePath: string,
  source: string,
  conventions: PropConventions,
  sourceKind?: SourceKind,
): Finding[] {
  // Nothing to check against. `statedConventions` cannot return `undefined` —
  // its type is `PropConventions` and every fallback path returns `{}` — so the
  // caller's `conventions === undefined` guard never fired, and this parsed and
  // walked the whole AST on every edit only to find that no component had an
  // allowed set (#177).
  if (Object.keys(conventions).length === 0) return [];

  const ast = parseModule(source, filePath);
  if (ast === null) return [];

  const findings: Finding[] = [];

  walk(ast.program, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    const component = componentName(node);
    if (component === null) return;
    const known = conventions[component];
    if (known === undefined) return;

    for (const attribute of node.attributes) {
      if (attribute.type !== 'JSXAttribute') continue;
      if (attribute.name.type !== 'JSXIdentifier') continue;
      const allowed = known[attribute.name.name];
      if (allowed === undefined) continue;

      const value = attribute.value;
      // Only a literal is knowable here. An expression may hold anything, and
      // a guess about it would be a false positive.
      if (value?.type !== 'StringLiteral') continue;
      if (allowed.includes(value.value)) continue;

      findings.push({
        file: filePath,
        line: attribute.loc?.start.line ?? 1,
        level: 'props',
        message: `${component} ${attribute.name.name}="${quoted(value.value)}" is not one of ${allowed.map((v) => `"${quoted(v)}"`).join(', ')}.`,
        ...(sourceKind === undefined ? {} : { source: sourceKind }),
      });
    }
  });

  return findings.sort((a, b) => a.line - b.line);
}

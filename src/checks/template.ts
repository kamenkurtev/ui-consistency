import { parseTemplate, templateKind } from '../parse/template.js';
import type { SubstitutionRule } from '../knowledge/rules.js';
import type { Finding } from '../types.js';
import { quoted } from '../core/quote.js';

/**
 * The checks that can be made on a template, in any of the three dialects.
 *
 * Angular, Vue and Svelte were silent before this — not clean, silent. The
 * parser could not read a template at all, returned null, and every check
 * downstream saw a file with nothing in it. A tool that says nothing about the
 * files it exists to check is worse than no tool, and it looked like a pass.
 *
 * What is checkable here is what survives having no JavaScript semantics.
 * ~~Hardcoded values in a literal `style`, an emoji standing in for an icon,
 * and the project's own written-down substitutions.~~ **The first two are gone
 * (#79): they are a rule now — `rules/raw-values.md` — obeyed while the line is
 * written rather than reported after it.** What is left is the half that could
 * never be a rule, because it names components this project wrote down and no
 * general instruction can know them. The import check is unaffected — it reads
 * the component's TypeScript, which parses as it always did.
 */
export function templateFindings(
  filePath: string,
  source: string,
  rules: SubstitutionRule[],
): Finding[] {
  const kind = templateKind(filePath);
  if (kind === null) return [];

  const forbidden = new Map<string, SubstitutionRule>();
  for (const rule of rules) {
    for (const name of rule.forbidden) if (!forbidden.has(name)) forbidden.set(name, rule);
  }

  const findings: Finding[] = [];
  for (const node of parseTemplate(source, kind)) {
    const rule = forbidden.get(node.name);
    if (rule !== undefined) {
      findings.push({
        file: filePath,
        line: node.line,
        level: 'reuse',
        source: 'knowledge',
        symbol: node.name,
        message: `<${quoted(node.name)}> is not what this project uses here. "${quoted(rule.subject)}" says to use ${quoted(rule.canonical)}.`,
      });
    }
  }

  return findings.sort((a, b) => a.line - b.line);
}

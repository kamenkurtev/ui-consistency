import { parseTemplate, templateKind, type TemplateNode } from '../parse/template.js';
import type { SubstitutionRule } from '../knowledge/rules.js';
import type { Finding } from '../types.js';
import { isEmojiOnly } from './emoji.js';
import { quoted } from '../core/quote.js';
import { isColourValue, isLengthValue, isZeroLength, takesLength } from './css-values.js';

/** An absolute unit written out. Relative units are not raw values. */

/** `color: #333; font-size: 12px` → the declarations, in order. */
function declarations(style: string): { property: string; value: string }[] {
  const found: { property: string; value: string }[] = [];
  for (const part of style.split(';')) {
    const at = part.indexOf(':');
    if (at < 0) continue;
    const property = part.slice(0, at).trim().toLowerCase();
    const value = part.slice(at + 1).trim();
    if (property !== '' && value !== '') found.push({ property, value });
  }
  return found;
}

function styleFindingsFor(file: string, node: TemplateNode): Finding[] {
  // Only the literal `style` attribute. A bound one — `[style.color]`,
  // `:style`, `style={…}` — holds an expression whose value is not knowable
  // here, and guessing at it is the false positive this project refuses.
  const style = node.attributes['style'];
  if (style === undefined || style.includes('{{') || style.includes('{')) return [];

  const findings: Finding[] = [];
  for (const { property, value } of declarations(style)) {
    if (isZeroLength(value)) continue;

    // The same two rules the JSX check applies, which is the point: a colour is
    // a bypassed token wherever it is written, and a length only where the
    // scale had something to say. Asking "is this a value" instead reported
    // `color: 12px` as a hardcoded length — invalid CSS, and silence in a
    // `.tsx` (#195).
    const isColour = isColourValue(value);
    const isLength = !isColour && takesLength(property) && isLengthValue(value);
    if (!isColour && !isLength) continue;

    findings.push({
      file,
      line: node.line,
      level: 'style',
      // The literal and nothing more. `not a design-system token` was on this
      // message too, and it is the negative of what neither this check nor the
      // JavaScript one may assert (#64).
      message: `${quoted(property)}: ${quoted(value)} is ${isColour ? 'a colour literal' : 'an absolute length'}.`,
    });
  }
  return findings;
}

/**
 * The checks that can be made on a template, in any of the three dialects.
 *
 * Angular, Vue and Svelte were silent before this — not clean, silent. The
 * parser could not read a template at all, returned null, and every check
 * downstream saw a file with nothing in it. A tool that says nothing about the
 * files it exists to check is worse than no tool, and it looked like a pass.
 *
 * What is checkable here is what survives having no JavaScript semantics:
 * hardcoded values in a literal `style`, an emoji standing in for an icon, and
 * the project's own written-down substitutions. The import check is
 * unaffected — it reads the component's TypeScript, which parses as it always
 * did.
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
    findings.push(...styleFindingsFor(filePath, node));

    if (isEmojiOnly(node.text)) {
      findings.push({
        file: filePath,
        line: node.line,
        level: 'reuse',
        message: `${quoted(node.text)} is an emoji used as an icon. Use the design system's icon component so it matches the others.`,
      });
    }

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

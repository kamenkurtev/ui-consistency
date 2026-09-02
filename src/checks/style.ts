import type {
  Expression,
  JSXAttribute,
  Node,
  ObjectExpression,
  PatternLike,
} from '@babel/types';
import { parseModule, walk } from '../parse/parse.js';
import type { Finding } from '../types.js';
import { quoted } from '../core/quote.js';
import {
  SCALED_IN_SX,
  SIZE_KEYS,
  SPACING_KEYS,
  isColourValue,
  isLengthValue,
  isZeroLength,
  takesLength,
} from './css-values.js';

/**
 * The two attributes that carry a style object literal. `style` is the DOM's
 * own; `sx` is the system prop MUI, Chakra and Theme UI all spell the same
 * way. Anything else — a `className`, a styled component — is out of reach of
 * a check that only reads this file.
 */
type StyleAttribute = 'sx' | 'style';

/**
 * Properties React never appends `px` to.
 *
 * `style={{ lineHeight: 1.5 }}` renders `line-height: 1.5` — a ratio, not a
 * length, and there is no token it should have been. The premise that "in
 * `style` every number is pixels" holds for `borderRadius` and
 * `letterSpacing` and not for this one, which is why it is per-key rather
 * than per-attribute.
 */
const UNITLESS = new Set(['lineHeight', 'opacity', 'zIndex', 'flexGrow', 'flexShrink', 'order']);

/**
 * Does a numeric literal on this key name a raw value?
 *
 * Only for keys that carry a length. `flexGrow: 1`, `zIndex: 2` and
 * `opacity: 1` are numbers with no unit behind them and no token to replace
 * them with, so they are never findings.
 */
function isRawNumber(attribute: StyleAttribute, key: string): boolean {
  if (UNITLESS.has(key)) return false;
  if (SIZE_KEYS.has(key)) return true;
  if (attribute !== 'style') return false;
  // In `style` every number is pixels, so the keys that scale in `sx` are raw
  // here — which is the same asymmetry the spacing keys already had.
  return SPACING_KEYS.has(key) || SCALED_IN_SX.has(key);
}

function propertyKey(node: Node): string | null {
  if (node.type !== 'ObjectProperty' || node.computed) return null;
  const key = node.key;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  return null;
}

function unwrapNegative(value: Expression | PatternLike): {
  node: Expression | PatternLike;
  negated: boolean;
} {
  if (value.type === 'UnaryExpression' && value.operator === '-') {
    return { node: value.argument, negated: true };
  }
  return { node: value, negated: false };
}

function collect(
  attribute: StyleAttribute,
  object: ObjectExpression,
  file: string,
  findings: Finding[],
): void {
  for (const property of object.properties) {
    const key = propertyKey(property);
    if (key === null || property.type !== 'ObjectProperty') continue;

    // A nested object is a breakpoint, a pseudo-selector or a descendant
    // rule. The declarations inside it are declarations like any other.
    if (property.value.type === 'ObjectExpression') {
      collect(attribute, property.value, file, findings);
      continue;
    }

    const { node, negated } = unwrapNegative(property.value);
    const line = property.loc?.start.line ?? 1;

    if (node.type === 'NumericLiteral') {
      if (!isRawNumber(attribute, key) || node.value === 0) continue;
      const shown = `${negated ? '-' : ''}${node.value}`;
      findings.push({
        file,
        line,
        level: 'style',
        message: `${quoted(key)}: ${quoted(String(shown))} is a hardcoded value, not a design-system token.`,
      });
      continue;
    }

    if (node.type === 'StringLiteral') {
      const value = node.value;
      if (isColourValue(value)) {
        findings.push({
          file,
          line,
          level: 'style',
          message: `${quoted(key)}: '${quoted(value)}' is a hardcoded colour, not a design-system token.`,
        });
        continue;
      }
      // A length written with a unit bypasses the scale in either attribute —
      // but only where the scale would have had something to say.
      if (takesLength(key) && isLengthValue(value) && !isZeroLength(value)) {
        findings.push({
          file,
          line,
          level: 'style',
          message: `${quoted(key)}: '${quoted(value)}' is a hardcoded length, not a design-system token.`,
        });
      }
      continue;
    }

    // Anything else — an identifier, a member expression, a template, a call —
    // has a value this check cannot see. False positives cost more than misses.
  }
}

function styleAttributeName(node: JSXAttribute): StyleAttribute | null {
  if (node.name.type !== 'JSXIdentifier') return null;
  const name = node.name.name;
  return name === 'sx' || name === 'style' ? name : null;
}

/**
 * Tier 1: raw colour, size and spacing literals written into a style object.
 *
 * Deliberately not asserted here: that a token exists for the value found.
 * That needs the knowledge base. The raw literal on its own is certain, and
 * certainty is the whole licence for a check that runs on every edit.
 */
export function styleFindings(filePath: string, source: string): Finding[] {
  const ast = parseModule(source, filePath);
  if (ast === null) return [];

  const findings: Finding[] = [];

  // `walk`, not a fourth copy of it. This file hand-rolled the same stack that
  // `parse/parse.ts` exports and that every other check calls — and the guard
  // added in #148 could not see it, because it hashes function *bodies* and this
  // copy was inlined inside this one rather than extracted (#178).
  walk(ast.program, (node) => {
    if (node.type !== 'JSXAttribute') return;
    const attribute = styleAttributeName(node);
    const value = node.value;
    if (
      attribute !== null &&
      value?.type === 'JSXExpressionContainer' &&
      value.expression.type === 'ObjectExpression'
    ) {
      collect(attribute, value.expression, filePath, findings);
    }
  });

  return findings.sort((a, b) => a.line - b.line);
}

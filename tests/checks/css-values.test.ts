import { describe, it, expect } from 'vitest';
import { styleFindings } from '../../src/checks/style.js';
import { templateFindings } from '../../src/checks/template.js';

/**
 * JSX and the template dialects must agree about what a hardcoded value is.
 *
 * They kept separate copies of the same four patterns, and had already drifted:
 * `color(display-p3 …)` was a colour in a `.tsx` and not in a `.vue`, because
 * one list was widened and the other was not (#184). Every test stayed green.
 *
 * This asserts the agreement rather than the constants, so it keeps holding if
 * the shared module is ever split again.
 */
const COLOURS = ['#fff', '#ffffff', '#ffffffff', 'rgb(1,2,3)', 'rgba(1,2,3,.5)', 'hsl(1,2%,3%)', 'oklch(0.7 0.1 200)', 'color(display-p3 1 0 0)'];
const LENGTHS = ['12px', '1.5rem'.replace('rem', 'pt'), '-3mm', '0.5in'];
const NOT_VALUES = ['inherit', 'var(--x)', '1rem', '50%', '0', '0px', 'auto'];

const inJsx = (value: string): number =>
  styleFindings('W.tsx', `export const W = () => <div style={{ color: '${value}' }} />;`).length;

const inTemplate = (value: string): number =>
  templateFindings('w.component.html', `<div style="color: ${value}"></div>`, []).length;

describe('what counts as a hardcoded value', () => {
  for (const value of COLOURS) {
    it(`agrees that ${value} is one`, () => {
      expect(inJsx(value), 'JSX').toBeGreaterThan(0);
      expect(inTemplate(value), 'template').toBeGreaterThan(0);
    });
  }

  /**
   * On `margin`, not on `color`.
   *
   * The first version asserted these against `color`, where the JSX check does
   * not look at lengths at all — so `12px` was also zero there and the
   * assertions proved nothing. A negative case has to be on a property where a
   * positive case would fire.
   */
  for (const value of NOT_VALUES) {
    it(`agrees that ${value} is not one`, () => {
      const jsx = styleFindings(
        'W.tsx',
        `export const W = () => <div style={{ margin: '${value}' }} />;`,
      ).length;
      const template = templateFindings(
        'w.component.html',
        `<div style="margin: ${value}"></div>`,
        [],
      ).length;

      expect(jsx, 'JSX').toBe(0);
      expect(template, 'template').toBe(0);
    });
  }

  it('agrees about lengths, on a property that takes one', () => {
    for (const value of LENGTHS) {
      const jsx = styleFindings('W.tsx', `export const W = () => <div style={{ margin: '${value}' }} />;`).length;
      const tpl = templateFindings('w.component.html', `<div style="margin: ${value}"></div>`, []).length;
      expect(jsx, `JSX ${value}`).toBeGreaterThan(0);
      expect(tpl, `template ${value}`).toBeGreaterThan(0);
    }
  });
});

/**
 * The dialects have to agree about **properties** as well as values.
 *
 * They did not: `color: 12px` was a finding in a template and silence in JSX,
 * because one asked "is this a value" and the other asked "does this property
 * take one". The same stylesheet got two answers depending on which file it was
 * written in (#195).
 */
describe('which property a value is written on', () => {
  const jsx = (property: string, value: string): number =>
    styleFindings('W.tsx', `export const W = () => <div style={{ ${property}: '${value}' }} />;`)
      .length;
  const template = (property: string, value: string): number =>
    templateFindings('w.component.html', `<div style="${property}: ${value}"></div>`, []).length;

  const cases: { jsxKey: string; cssKey: string; value: string; expected: number; why: string }[] = [
    { jsxKey: 'color', cssKey: 'color', value: '12px', expected: 0, why: 'invalid CSS, not a bypassed length' },
    { jsxKey: 'color', cssKey: 'color', value: '#fff', expected: 1, why: 'a colour where a token belongs' },
    { jsxKey: 'margin', cssKey: 'margin', value: '12px', expected: 1, why: 'the scale has a spacing token' },
    { jsxKey: 'fontSize', cssKey: 'font-size', value: '12px', expected: 1, why: 'camelCase and kebab are one property' },
    { jsxKey: 'width', cssKey: 'width', value: '240px', expected: 0, why: 'almost no design system has a width token' },
    { jsxKey: 'width', cssKey: 'width', value: '#fff', expected: 1, why: 'a colour is bypassed wherever it is written' },
  ];

  for (const { jsxKey, cssKey, value, expected, why } of cases) {
    it(`${cssKey}: ${value} — ${why}`, () => {
      expect(jsx(jsxKey, value), 'JSX').toBe(expected);
      expect(template(cssKey, value), 'template').toBe(expected);
    });
  }
});

/**
 * The set the two dialects share is *derived* from the JSX check's own sets, not
 * written again.
 *
 * The first attempt at #195 wrote a fresh kebab-case list and silently dropped
 * MUI's spacing shorthand: `sx={{ mt: '2px' }}` stopped being a finding, which
 * is the exact usage `SPACING_KEYS` exists to catch. A fourth hand-written list
 * of "properties the scale covers", in the change whose subject is two lists
 * drifting apart — and the guard had no case on any of the dropped keys.
 */
describe('the shorthand the spacing scale covers', () => {
  const SHORTHAND = ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'my', 'p', 'pt', 'pr', 'pb', 'pl', 'px', 'py', 'spacing'];

  for (const key of SHORTHAND) {
    it(`reports a string length on ${key}`, () => {
      const found = styleFindings('W.tsx', `export const W = () => <div sx={{ ${key}: '2px' }} />;`);

      expect(found).toHaveLength(1);
    });
  }

  it('leaves a bare number on the same key alone, because that is the theme multiplier', () => {
    expect(styleFindings('W.tsx', `export const W = () => <div sx={{ mt: 2 }} />;`)).toEqual([]);
  });

  it('reports a length on line-height in both dialects, and leaves a ratio alone', () => {
    expect(
      styleFindings('W.tsx', `export const W = () => <div style={{ lineHeight: '12px' }} />;`),
    ).toHaveLength(1);
    expect(
      templateFindings('w.component.html', '<div style="line-height: 12px"></div>', []),
    ).toHaveLength(1);
    expect(styleFindings('W.tsx', `export const W = () => <div sx={{ lineHeight: 1.5 }} />;`)).toEqual(
      [],
    );
  });
});

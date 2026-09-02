import { describe, it, expect } from 'vitest';
import { styleFindings } from '../../src/checks/style.js';

const FILE = 'apps/orders/widgets/Revenue.tsx';

function wrap(attribute: string): string {
  return `export function Widget() {\n  return <Box ${attribute}>hi</Box>;\n}\n`;
}

interface Case {
  name: string;
  attribute: string;
  /** Fragments the single expected finding's message must contain. */
  expects: string[];
}

const positives: Case[] = [
  {
    name: 'a numeric font size in sx',
    attribute: 'sx={{ fontSize: 12 }}',
    expects: ['fontSize', '12'],
  },
  {
    name: 'a hex colour in an inline style',
    attribute: "style={{ color: '#3366ff' }}",
    expects: ['color', '#3366ff'],
  },
  {
    name: 'a hex colour in sx',
    attribute: "sx={{ backgroundColor: '#fff' }}",
    expects: ['backgroundColor', '#fff'],
  },
  {
    name: 'an rgb() colour',
    attribute: "sx={{ color: 'rgb(12, 12, 12)' }}",
    expects: ['rgb(12, 12, 12)'],
  },
  {
    name: 'an hsl() colour',
    attribute: "style={{ borderColor: 'hsl(200, 50%, 40%)' }}",
    expects: ['hsl(200, 50%, 40%)'],
  },
  {
    name: 'a numeric margin in an inline style, where numbers are pixels',
    attribute: 'style={{ margin: 8 }}',
    expects: ['margin', '8'],
  },
  {
    name: 'a pixel string in sx, which bypasses the spacing scale',
    attribute: "sx={{ padding: '12px' }}",
    expects: ['padding', '12px'],
  },
  {
    name: 'a numeric border radius in an inline style, where numbers are pixels',
    attribute: 'style={{ borderRadius: 4 }}',
    expects: ['borderRadius', '4'],
  },
  {
    name: 'a numeric font size nested under a breakpoint',
    attribute: 'sx={{ "@media (min-width:600px)": { fontSize: 18 } }}',
    expects: ['fontSize', '18'],
  },
];

const negatives: Case[] = [
  { name: 'a typography variant', attribute: 'variant="h6"', expects: [] },
  { name: 'a palette colour prop', attribute: 'color="primary"', expects: [] },
  {
    name: 'a theme token reference',
    attribute: 'sx={{ color: theme.palette.primary.main }}',
    expects: [],
  },
  {
    name: 'a token string that names no raw value',
    attribute: "sx={{ color: 'primary.main' }}",
    expects: [],
  },
  {
    // The one that decides whether this check survives a real repository:
    // a bare number on a spacing key in `sx` is a theme multiplier, i.e. the
    // correct, token-respecting form, and it is on nearly every component.
    name: 'spacing shorthand in sx, which is a theme multiplier',
    attribute: 'sx={{ mt: 2, p: 1, gap: 1 }}',
    expects: [],
  },
  {
    name: 'long-hand spacing in sx, also a multiplier',
    attribute: 'sx={{ marginTop: 2, padding: 3 }}',
    expects: [],
  },
  {
    // `borderRadius: 1` in sx is theme.shape.borderRadius * 1 — the correct,
    // token-respecting form, exactly like `mt: 2`. Flagging it faulted
    // idiomatic MUI while the plugin was being evaluated (#68).
    name: 'a border radius multiplier in sx',
    attribute: 'sx={{ borderRadius: 1 }}',
    expects: [],
  },
  {
    name: 'unitless line height and letter spacing in sx, which are ratios',
    attribute: 'sx={{ lineHeight: 1.5, letterSpacing: 0.5 }}',
    expects: [],
  },
  {
    name: 'a variable, whose value is not knowable here',
    attribute: 'sx={{ fontSize: size }}',
    expects: [],
  },
  {
    name: 'a unitless number that is not a size at all',
    attribute: 'sx={{ flexGrow: 1, zIndex: 2, opacity: 1 }}',
    expects: [],
  },
  {
    // Zero is zero in every scale. There is no token it should have been.
    name: 'a zero, which is a reset rather than a hardcoded value',
    attribute: "style={{ margin: 0, padding: '0px' }}",
    expects: [],
  },
  {
    name: 'a fixed layout dimension, which no design system tokenises',
    attribute: "sx={{ width: 280, maxWidth: '300px', height: 30 }}",
    expects: [],
  },
];

describe('hardcoded style literals', () => {
  for (const testCase of positives) {
    it(`flags ${testCase.name}`, () => {
      const findings = styleFindings(FILE, wrap(testCase.attribute));
      expect(findings).toHaveLength(1);
      const finding = findings[0]!;
      expect(finding.level).toBe('style');
      expect(finding.file).toBe(FILE);
      expect(finding.line).toBe(2);
      for (const fragment of testCase.expects) {
        expect(finding.message).toContain(fragment);
      }
    });
  }

  for (const testCase of negatives) {
    it(`is silent on ${testCase.name}`, () => {
      expect(styleFindings(FILE, wrap(testCase.attribute))).toEqual([]);
    });
  }

  it('reports every literal in one attribute', () => {
    const findings = styleFindings(FILE, wrap("sx={{ fontSize: 12, color: '#333' }}"));
    expect(findings.map((f) => f.message)).toHaveLength(2);
  });

  it('says nothing about a file that does not parse', () => {
    expect(styleFindings(FILE, 'export function Broken( {')).toEqual([]);
  });
});

describe('the properties React does not add px to', () => {
  it('says nothing about a unitless line height in an inline style', () => {
    // `style={{ lineHeight: 1.5 }}` renders `line-height: 1.5` — idiomatic
    // CSS with no token behind it. React's unitless list is the reason the
    // "in `style` every number is pixels" premise is wrong for this one key.
    expect(styleFindings(FILE, wrap('style={{ lineHeight: 1.5 }}'))).toEqual([]);
  });

  it('still flags the ones React does add px to', () => {
    expect(styleFindings(FILE, wrap('style={{ borderRadius: 4 }}'))).toHaveLength(1);
    expect(styleFindings(FILE, wrap('style={{ letterSpacing: 2 }}'))).toHaveLength(1);
  });
});

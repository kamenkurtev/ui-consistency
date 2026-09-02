import { describe, it, expect } from 'vitest';
import { substitutionRules } from '../../src/knowledge/rules.js';
import { substitutionFindings } from '../../src/checks/substitution.js';
import type { Inventory, Knowledge, Layer } from '../../src/types.js';

const FILE = '/repo/apps/dash/src/ActionsPage.tsx';

const CHAIN: Layer[] = [
  { name: '@acme/dash', root: '/repo/apps/dash', dependencies: ['@acme/ui'] },
  { name: '@acme/ui', root: '/repo/packages/ui', dependencies: [] },
];

const INVENTORY: Inventory = {
  layers: {
    '@acme/ui': {
      ActionGrid: { deprecated: false, replacement: null },
      Grid: { deprecated: false, replacement: null },
      DetailLayout: { deprecated: false, replacement: null },
      Dialog: { deprecated: false, replacement: null },
      WidgetCard: { deprecated: false, replacement: null },
      Box: { deprecated: false, replacement: null },
    },
  },
};

function knowledge(body: string, subject = 'Rule', kind = 'pages'): Knowledge {
  return {
    fragments: [{ id: `${kind}#rule`, kind, subject, body, keywords: [] }],
  };
}

function find(source: string, base: Knowledge) {
  return substitutionFindings(FILE, source, substitutionRules(base), CHAIN, INVENTORY);
}

describe('reading substitution rules out of curated Markdown', () => {
  it('reads "uses X, never a raw Y"', () => {
    const rules = substitutionRules(
      knowledge('A page of actions uses `<ActionGrid>`, never a raw `<Grid>`.'),
    );
    expect(rules).toHaveLength(1);
    expect(rules[0]!.canonical).toBe('ActionGrid');
    expect(rules[0]!.forbidden).toEqual(['Grid']);
  });

  it('carries the canonical component across sentences', () => {
    // "A detail screen is a routed page on <DetailLayout>. It is not a Dialog."
    const rules = substitutionRules(
      knowledge('A detail screen is a routed page on `<DetailLayout>`. It is not a `Dialog`.'),
    );
    expect(rules[0]!.canonical).toBe('DetailLayout');
    expect(rules[0]!.forbidden).toEqual(['Dialog']);
  });

  it('reads "instead of" and "rather than" too', () => {
    const rules = substitutionRules(
      knowledge('Use `<WidgetCard>` instead of a bare `<Box>`.', 'Widget shell', 'widgets'),
    );
    expect(rules[0]!.canonical).toBe('WidgetCard');
    expect(rules[0]!.forbidden).toEqual(['Box']);
  });

  it('needs an explicit negation — a rule that only praises something states nothing', () => {
    // Curated, never inferred. "Widgets are wrapped in <WidgetCard>" says what
    // is right and nothing about what is wrong; guessing the second from the
    // first is the inference this project refuses to make.
    expect(substitutionRules(knowledge('Every widget is wrapped in `<WidgetCard>`.'))).toEqual([]);
  });

  it('remembers which rule it came from, so a finding can cite it', () => {
    const rules = substitutionRules(
      knowledge('A page of actions uses `<ActionGrid>`, never a raw `<Grid>`.', 'Action grids'),
    );
    expect(rules[0]!.subject).toBe('Action grids');
  });

  it('finds nothing in an empty knowledge base', () => {
    expect(substitutionRules({ fragments: [] })).toEqual([]);
  });
});

describe('the check the rules drive', () => {
  const grids = knowledge('A page of actions uses `<ActionGrid>`, never a raw `<Grid>`.', 'Action grids');

  it('flags the forbidden component and names the one to use', () => {
    const source = [
      "import { Grid, Button } from '@acme/ui';",
      'export function ActionsPage() {',
      '  return <Grid><Button>Retry</Button></Grid>;',
      '}',
    ].join('\n');

    const findings = find(source, grids);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.level).toBe('reuse');
    expect(findings[0]!.line).toBe(3);
    expect(findings[0]!.message).toContain('Grid');
    expect(findings[0]!.message).toContain('ActionGrid');
    expect(findings[0]!.message).toContain('Action grids');
  });

  it('flags each place it is rendered', () => {
    const source = 'export const P = () => (<div><Grid /><Grid /></div>);\n';
    expect(find(source, grids)).toHaveLength(2);
  });

  it('says nothing about the component the rule points at', () => {
    expect(find('export const P = () => <ActionGrid />;\n', grids)).toEqual([]);
  });

  it('says nothing when no rule mentions the component', () => {
    const other = knowledge('Forms use `<FormLayout>`, never a bare `<Stack>`.');
    expect(find('export const P = () => <Grid />;\n', other)).toEqual([]);
  });

  it('says nothing when nothing on the chain exports the replacement', () => {
    // Advice that does not compile is worse than silence.
    const empty: Inventory = { layers: { '@acme/ui': { Grid: { deprecated: false, replacement: null } } } };
    const findings = substitutionFindings(
      FILE,
      'export const P = () => <Grid />;\n',
      substitutionRules(grids),
      CHAIN,
      empty,
    );
    expect(findings).toEqual([]);
  });

  it('lets the file that implements the canonical component render the raw one', () => {
    // <ActionGrid> has to be built out of <Grid>. Faulting it would fault the
    // design system for existing — the same exemption every other check makes.
    const source = 'export const ActionGrid = (p) => <Grid {...p} />;\n';
    expect(find(source, grids)).toEqual([]);
  });

  it('says nothing about a mention that is not a rendered element', () => {
    const source = "import { Grid } from '@acme/ui';\nconst name = 'Grid';\n";
    expect(find(source, grids)).toEqual([]);
  });

  it('says nothing about a file that does not parse', () => {
    expect(find('export const P = ( {', grids)).toEqual([]);
  });

  it('says nothing when the project has written no rules at all', () => {
    expect(find('export const P = () => <Grid />;\n', { fragments: [] })).toEqual([]);
  });
});

describe('rules written for a template framework', () => {
  it('reads a custom element name, which is how Angular and Vue name components', () => {
    // `<app-action-grid>` is a component in every sense that matters here; a
    // parser that only understood PascalCase left every template framework
    // unable to state a rule at all.
    const rules = substitutionRules(
      knowledge('A page of actions uses `<app-action-grid>`, never a raw `<app-grid>`.'),
    );
    expect(rules[0]!.canonical).toBe('app-action-grid');
    expect(rules[0]!.forbidden).toEqual(['app-grid']);
  });

  it('does not take a plain HTML tag as a component', () => {
    // A custom element always contains a dash; `<div>` and `<span>` do not,
    // and a rule that forbade every div would be unusable.
    // With nothing forbidden there is no rule at all — a prohibition that
    // names no component prohibits nothing.
    expect(substitutionRules(knowledge('Use `<Card>`, never a bare `<div>`.'))).toEqual([]);
  });
});

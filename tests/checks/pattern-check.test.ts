import { describe, it, expect } from 'vitest';
import { patternDeviations } from '../../src/checks/pattern-check.js';
import { parsePattern } from '../../src/knowledge/pattern-file.js';
import type { ScreenTree, TreeNode } from '../../src/sources/tree.js';

/** A tree in the shape the walk produces, written as nested names. */
const node = (name: string, children: TreeNode[] = []): TreeNode => ({
  name,
  file: 'src/pages/One.tsx',
  at: 'project',
  children,
});

const tree = (root: TreeNode): ScreenTree => ({
  root,
  depth: 2,
  truncated: false,
  read: ['src/pages/One.tsx'],
});

const pattern = (body: string): ReturnType<typeof parsePattern> =>
  parsePattern('list-screen.md', `---\npattern: list-screen\nholder: PageShell\n---\n\n${body}`);

const STRUCTURE = pattern(`## Structure

\`\`\`
PageShell            3 of 3
  FilterBar          3 of 3
  *Grid              3 of 3
  ConfirmDialog      1 of 3
\`\`\`
`);

describe('where a screen leaves the nesting a pattern states', () => {
  it('names a level every screen of the kind has and this one omits', () => {
    const screen = tree(node('PageShell', [node('OrdersGrid')]));

    const { deviations } = patternDeviations('One.tsx', '', STRUCTURE, screen);

    expect(deviations.map((one) => one.message)).toEqual([
      'does not render <FilterBar>, which every screen of this kind has',
    ]);
  });

  it('says nothing about a level the pattern says some screens have', () => {
    // `1 of 3` is a fact about the family, not a requirement. Treating it as one
    // fails two of the three screens the pattern was written from.
    const screen = tree(node('PageShell', [node('FilterBar'), node('OrdersGrid')]));

    expect(patternDeviations('One.tsx', '', STRUCTURE, screen).deviations).toEqual([]);
  });

  it('matches a slot by the trailing word the project uses', () => {
    // `*Grid` is the role. `InvoicesGrid` fills it, and a check that matched only
    // literal names would fault every screen the pattern was derived from.
    const screen = tree(node('PageShell', [node('FilterBar'), node('InvoicesGrid')]));

    expect(patternDeviations('One.tsx', '', STRUCTURE, screen).deviations).toEqual([]);
  });

  it('reports an order the screen inverts', () => {
    const screen = tree(node('PageShell', [node('OrdersGrid'), node('FilterBar')]));

    const { deviations } = patternDeviations('One.tsx', '', STRUCTURE, screen);

    expect(deviations[0]!.message).toContain('before <FilterBar>');
  });

  it('reports a holder that is not the one the pattern is of, and stops there', () => {
    // Everything below the holder is about a different kind of screen, and
    // listing it would bury the one sentence that matters.
    const screen = tree(node('Dialog', [node('DialogContent')]));

    const { deviations } = patternDeviations('One.tsx', '', STRUCTURE, screen);

    expect(deviations).toHaveLength(1);
    expect(deviations[0]!.message).toBe('sits in <Dialog>; screens of this kind sit in <PageShell>');
  });
});

describe('the props a pattern states', () => {
  const PROPS = pattern(`## Props

### \`PageShell\`
- \`title\` — 3 of 3
- \`breadcrumbs\` — most screens

### \`*Grid\`
- \`density\` = "compact" — 2 of 3
`);

  const source = (grid: string): string =>
    `export const P = () => (\n  <PageShell>\n    <${grid} />\n  </PageShell>\n);\n`;

  it('produces the sentence with the strength the pattern wrote', () => {
    const { deviations } = patternDeviations('One.tsx', source('OrdersGrid'), PROPS, null);

    expect(deviations.map((one) => one.message)).toContain(
      'writes <PageShell> without title, which every screen of this kind writes',
    );
  });

  it('repeats a strength written as a sentence rather than inventing a count', () => {
    // `most screens` is what somebody meant. Turning it into a number here would
    // state a count nobody counted.
    const { deviations } = patternDeviations('One.tsx', source('OrdersGrid'), PROPS, null);

    expect(deviations.map((one) => one.message)).toContain(
      'writes <PageShell> without breadcrumbs, which the pattern states as: most screens',
    );
  });

  it('names the screen\'s own component where the pattern named a slot', () => {
    // Told "writes `<*Grid>` without density" a reader goes looking for a
    // component called `*Grid`.
    const { deviations } = patternDeviations('One.tsx', source('InvoicesGrid'), PROPS, null);

    expect(deviations.some((one) => one.message.includes('<InvoicesGrid>'))).toBe(true);
    expect(deviations.some((one) => one.message.includes('*Grid'))).toBe(false);
  });

  it('says nothing about a component the screen does not render', () => {
    const bare = 'export const P = () => (\n  <PageShell title="x" breadcrumbs={t} />\n);\n';

    expect(patternDeviations('One.tsx', bare, PROPS, null).deviations).toEqual([]);
  });
});

describe('what the pattern states and nothing evaluates', () => {
  it('hands the prose rules over rather than passing silently', () => {
    // A verifier that printed nothing for them would let a screen pass against
    // rules nobody checked.
    const withRules = pattern(`## Rules

- Actions are always rendered; gating toggles \`disabled\` only.
- The filter's selection descends as props.
`);

    const { handedOver } = patternDeviations('One.tsx', '', withRules, null);

    expect(handedOver).toHaveLength(2);
    expect(handedOver[0]).toContain('gating toggles');
  });

  it('hands over a slot written for a person, which it cannot read', () => {
    const withSlot = pattern(`## Structure

\`\`\`
PageShell
  <content>          exactly one
\`\`\`
`);

    const screen = tree(node('PageShell', [node('Whatever')]));
    const { deviations, handedOver } = patternDeviations('One.tsx', '', withSlot, screen);

    expect(deviations).toEqual([]);
    expect(handedOver.join(' ')).toContain('<content>');
  });
});

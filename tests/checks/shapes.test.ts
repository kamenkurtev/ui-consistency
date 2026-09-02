import { describe, it, expect } from 'vitest';
import { shapesOf, shapeReport } from '../../src/checks/shapes.js';

const CARD = [
  'export function InfoCard({ title, children }) {',
  '  return (',
  '    <Box>',
  '      <Typography>{title}</Typography>',
  '      <Divider />',
  '      <Box>{children}</Box>',
  '    </Box>',
  '  );',
  '}',
].join('\n');

/** The same tree, different prop values and different text. */
function handRolled(name: string): string {
  return [
    `export function ${name}() {`,
    '  return (',
    '    <Box>',
    `      <Typography>${name}</Typography>`,
    '      <Divider />',
    '      <Box>body</Box>',
    '    </Box>',
    '  );',
    '}',
  ].join('\n');
}

describe('what a shape is', () => {
  it('is the tree, not the content', () => {
    const a = shapesOf('a.tsx', handRolled('Orders'));
    const b = shapesOf('b.tsx', handRolled('Invoices'));
    expect(a[0]!.hash).toBe(b[0]!.hash);
  });

  it('is not the same when the tree differs', () => {
    const a = shapesOf('a.tsx', handRolled('Orders'));
    const b = shapesOf(
      'b.tsx',
      'export const X = () => <Grid><Row><Cell>a</Cell><Cell>b</Cell></Row></Grid>;\n',
    );
    expect(a[0]!.hash).not.toBe(b[0]!.hash);
  });

  it('ignores trees too small to mean anything', () => {
    // Two elements repeat everywhere in every codebase. Reporting them is how
    // a shape report becomes a wall nobody reads.
    expect(shapesOf('a.tsx', 'export const X = () => <Box><span>hi</span></Box>;\n')).toEqual([]);
  });

  it('sees through a fragment, which is not a level of structure', () => {
    const shapes = shapesOf('a.tsx', 'export const X = () => <Box><H/><><R/><R/></></Box>;\n');
    expect(shapes.map((shape) => shape.hash)).toContain('Box(H,R,R)');
  });

  it('sees a compound component', () => {
    const shapes = shapesOf(
      'a.tsx',
      'export const X = () => <Card><Card.Header/><Card.Body><I/></Card.Body></Card>;\n',
    );
    expect(shapes.map((shape) => shape.hash)).toContain('Card(Card.Header,Card.Body(I))');
  });

  it('sees a list built with map, and a conditional branch', () => {
    const mapped = shapesOf(
      'a.tsx',
      'export const X = () => <Table><Head/>{rows.map((r) => <Row><Cell/></Row>)}</Table>;\n',
    );
    expect(mapped.map((shape) => shape.hash)).toContain('Table(Head,Row(Cell))');

    const branch = shapesOf(
      'b.tsx',
      'export const Y = () => <Box><H/>{ok && <Panel><P/></Panel>}</Box>;\n',
    );
    expect(branch.map((shape) => shape.hash)).toContain('Box(H,Panel(P))');
  });

  it('records where it found it', () => {
    const shapes = shapesOf('apps/orders/List.tsx', handRolled('Orders'));
    expect(shapes[0]!.file).toBe('apps/orders/List.tsx');
    expect(shapes[0]!.line).toBe(3);
  });

  it('says nothing about a file that does not parse', () => {
    expect(shapesOf('a.tsx', 'export const X = ( {')).toEqual([]);
  });
});

describe('you hand-rolled something that already exists', () => {
  it('names the component whose shape was rebuilt', () => {
    const report = shapeReport({
      library: [{ component: 'InfoCard', file: 'packages/ui/InfoCard.tsx', source: CARD }],
      app: [{ file: 'apps/orders/List.tsx', source: handRolled('Orders') }],
    });

    expect(report.handRolled).toHaveLength(1);
    expect(report.handRolled[0]!.component).toBe('InfoCard');
    expect(report.handRolled[0]!.file).toBe('apps/orders/List.tsx');
  });

  it('says nothing about the library file that defines it', () => {
    const report = shapeReport({
      library: [{ component: 'InfoCard', file: 'packages/ui/InfoCard.tsx', source: CARD }],
      app: [],
    });
    expect(report.handRolled).toEqual([]);
  });
});

describe('this shape repeats and matches nothing', () => {
  it('reports a shape three files share', () => {
    const report = shapeReport({
      library: [],
      app: [
        { file: 'a.tsx', source: handRolled('A') },
        { file: 'b.tsx', source: handRolled('B') },
        { file: 'c.tsx', source: handRolled('C') },
      ],
    });

    expect(report.repeated).toHaveLength(1);
    expect(report.repeated[0]!.files).toEqual(['a.tsx', 'b.tsx', 'c.tsx']);
  });

  it('does not report a shape two files share', () => {
    // Two can be a coincidence or a copy-paste. Three is a pattern — the same
    // quorum the neighbour source uses, and for the same reason.
    const report = shapeReport({
      library: [],
      app: [
        { file: 'a.tsx', source: handRolled('A') },
        { file: 'b.tsx', source: handRolled('B') },
      ],
    });
    expect(report.repeated).toEqual([]);
  });

  it('marks a repeat that the shared vocabulary already has', () => {
    // The guard the issue calls the one that makes the report usable: a repeat
    // backed by an existing component is a strong candidate, because there is
    // something concrete to switch to. One that repeats only among screens is
    // a suspect and nothing more. They are tiers, not separate buckets — an
    // earlier version dropped the first out of `repeated` entirely, which left
    // the whole question with nothing to look at on a real monorepo.
    const report = shapeReport({
      library: [{ component: 'InfoCard', file: 'packages/ui/InfoCard.tsx', source: CARD }],
      app: [
        { file: 'a.tsx', source: handRolled('A') },
        { file: 'b.tsx', source: handRolled('B') },
        { file: 'c.tsx', source: handRolled('C') },
      ],
    });
    expect(report.handRolled).toHaveLength(3);
    expect(report.repeated).toHaveLength(1);
    expect(report.repeated[0]!.existsAs?.component).toBe('InfoCard');
  });

  it('leaves a repeat nothing has as a suspect', () => {
    const report = shapeReport({
      library: [],
      app: [
        { file: 'a.tsx', source: handRolled('A') },
        { file: 'b.tsx', source: handRolled('B') },
        { file: 'c.tsx', source: handRolled('C') },
      ],
    });
    expect(report.repeated[0]!.existsAs).toBeNull();
  });

  it('reports one site once, however deep the match goes', () => {
    // A duplicated tree matches at every nesting level that clears the
    // minimum; counting those counted levels, not places.
    const report = shapeReport({
      library: [{ component: 'InfoCard', file: 'packages/ui/InfoCard.tsx', source: CARD }],
      app: [{ file: 'a.tsx', source: handRolled('A') }],
    });
    expect(report.handRolled).toHaveLength(1);
  });

  it('does not tell a file it rebuilt itself', () => {
    // Every file is now in the audited corpus, because "the library" and "the
    // app" is not a real dichotomy in a monorepo: on Backstage 960 of 990
    // files were on the library side of it and the repeated-shape half of the
    // report had almost nothing left to look at.
    const report = shapeReport({
      library: [{ component: 'InfoCard', file: 'packages/ui/InfoCard.tsx', source: CARD }],
      app: [{ file: 'packages/ui/InfoCard.tsx', source: CARD }],
    });
    expect(report.handRolled).toEqual([]);
  });

  it('is empty on a corpus with nothing in common', () => {
    const report = shapeReport({
      library: [],
      app: [
        { file: 'a.tsx', source: handRolled('A') },
        { file: 'b.tsx', source: 'export const B = () => <Grid><Row><Cell>x</Cell></Row></Grid>;\n' },
      ],
    });
    expect(report.repeated).toEqual([]);
    expect(report.handRolled).toEqual([]);
  });
});

describe('a repeated pattern usually lives inside a screen, not around it', () => {
  const screen = (body: string): string =>
    [
      'export function Screen() {',
      '  return (',
      '    <Page>',
      '      <Header />',
      `      ${body}`,
      '    </Page>',
      '  );',
      '}',
    ].join('\n');

  const row = '<Row><Cell>a</Cell><Cell>b</Cell><Cell>c</Cell></Row>';

  it('finds a subtree three screens share, though their outer shapes differ', () => {
    const report = shapeReport({
      library: [],
      app: [
        { file: 'a.tsx', source: screen(row) },
        { file: 'b.tsx', source: screen(`<div>${row}</div>`) },
        { file: 'c.tsx', source: screen(`<section><span/>${row}</section>`) },
      ],
    });
    expect(report.repeated.some((entry) => entry.hash.startsWith('Row('))).toBe(true);
  });
});

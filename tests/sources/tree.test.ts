import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { screenTree, type TreeNode } from '../../src/sources/tree.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-tree-'));
  await mkdir(join(root, 'src/pages'), { recursive: true });
  await mkdir(join(root, 'src/grids'), { recursive: true });
  await writeFile(join(root, 'package.json'), '{"name":"app"}');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const write = (path: string, source: string): Promise<void> =>
  writeFile(join(root, path), source);

/** The names down one branch, so an assertion reads like the structure it is about. */
const spine = (node: TreeNode): string[] =>
  node.children.length === 0 ? [node.name] : [node.name, ...spine(node.children[0]!)];

describe('what a screen renders, through its children', () => {
  it('follows a child into its own file and reads what that renders', async () => {
    // The whole of #10 in one assertion: the screen file names a grid and stops,
    // and what makes it a list screen — a toolbar above a data grid — is inside
    // the grid. Read at depth 1 this screen is `PageLayout` holding one unknown
    // thing, which is how 11 of 132 screens classified and 26 should have.
    await write(
      'src/pages/OrdersPage.tsx',
      "import { OrdersGrid } from '../grids/OrdersGrid';\n" +
        'export const OrdersPage = () => (\n  <PageLayout>\n    <OrdersGrid />\n  </PageLayout>\n);\n',
    );
    await write(
      'src/grids/OrdersGrid.tsx',
      "import { GridToolbar } from './GridToolbar';\n" +
        'export const OrdersGrid = () => (\n  <DataGrid>\n    <GridToolbar />\n  </DataGrid>\n);\n',
    );
    await write('src/grids/GridToolbar.tsx', 'export const GridToolbar = () => <div />;\n');

    const tree = await screenTree(root, join(root, 'src/pages/OrdersPage.tsx'), { depth: 3 });

    expect(spine(tree!.root)).toEqual(['PageLayout', 'OrdersGrid', 'DataGrid', 'GridToolbar']);
    expect(tree!.depth).toBe(3);
  });

  it('states the depth it was given and says when the bound stopped it', async () => {
    // "The depth is bounded and stated in the result, so a reader can tell
    // 'read two levels' from 'read everything'."
    await write(
      'src/pages/OrdersPage.tsx',
      "import { OrdersGrid } from '../grids/OrdersGrid';\n" +
        'export const OrdersPage = () => (\n  <PageLayout>\n    <OrdersGrid />\n  </PageLayout>\n);\n',
    );
    await write('src/grids/OrdersGrid.tsx', 'export const OrdersGrid = () => <DataGrid />;\n');

    const shallow = await screenTree(root, join(root, 'src/pages/OrdersPage.tsx'), { depth: 1 });
    expect(shallow!.truncated).toBe(true);
    expect(shallow!.root.children[0]!.at).toBe('beyond');
    // Resolved, and named, and not read — the three are different facts and the
    // node carries all three.
    expect(shallow!.root.children[0]!.file).toBe('src/grids/OrdersGrid.tsx');

    const deep = await screenTree(root, join(root, 'src/pages/OrdersPage.tsx'), { depth: 2 });
    expect(deep!.truncated).toBe(false);
  });

  it('names every file it read, which is what a cache key is made of', async () => {
    // An answer derived through three files is stale when any of the three
    // changes. A key covering the screen alone serves a stale tree until
    // somebody touches the screen, which is the one file that did not change.
    await write(
      'src/pages/OrdersPage.tsx',
      "import { OrdersGrid } from '../grids/OrdersGrid';\n" +
        'export const OrdersPage = () => (\n  <PageLayout>\n    <OrdersGrid />\n  </PageLayout>\n);\n',
    );
    await write('src/grids/OrdersGrid.tsx', 'export const OrdersGrid = () => <DataGrid />;\n');

    const tree = await screenTree(root, join(root, 'src/pages/OrdersPage.tsx'), { depth: 2 });

    expect(tree!.read).toContain(join(root, 'src/pages/OrdersPage.tsx'));
    expect(tree!.read).toContain(join(root, 'src/grids/OrdersGrid.tsx'));
  });
});

describe('why a branch ends', () => {
  const page = (body: string, imports = ''): string =>
    `${imports}export const P = () => (\n  <PageLayout>\n    ${body}\n  </PageLayout>\n);\n`;

  it('stops at the project boundary and says the child is external', async () => {
    // "Resolution stops at the project boundary: a component from an external
    // library is a leaf, and its internals are never walked."
    await write('src/pages/P.tsx', page('<Button />', "import { Button } from '@acme/design';\n"));

    const tree = await screenTree(root, join(root, 'src/pages/P.tsx'));

    expect(tree!.root.children).toEqual([
      { name: 'Button', file: null, at: 'external', children: [] },
    ]);
  });

  it('reports a child it could not follow as unresolved rather than absent', async () => {
    // The failure direction: a miss that says so. A child dropped silently is a
    // shallow screen reported as a complete reading of a deep one.
    await write('src/pages/P.tsx', page('<Mystery />'));

    const tree = await screenTree(root, join(root, 'src/pages/P.tsx'));

    expect(tree!.root.children).toEqual([
      { name: 'Mystery', file: null, at: 'unresolved', children: [] },
    ]);
  });

  it('tells a component declared in the same file from one it cannot find', async () => {
    await write(
      'src/pages/P.tsx',
      'const Row = () => <div />;\n' + page('<Row />'),
    );

    const tree = await screenTree(root, join(root, 'src/pages/P.tsx'));

    expect(tree!.root.children[0]!.at).toBe('local');
  });

  it('refuses a relative import that leads nowhere instead of calling it external', async () => {
    // A package is where the walk is meant to stop; a path that did not resolve
    // is a gap in what was read. Merging them is a walk claiming a depth.
    await write('src/pages/P.tsx', page('<Gone />', "import { Gone } from './Gone';\n"));

    const tree = await screenTree(root, join(root, 'src/pages/P.tsx'));

    expect(tree!.root.children[0]!.at).toBe('unresolved');
  });

  it('reads a leaf that renders only raw markup as read, not as unresolved', async () => {
    // `shapeOf` answers null for a file with no component in it, and a button
    // built out of `<span>` is exactly that. The node is right — resolved,
    // named, nothing below — but it is reached through the same null a parse
    // failure returns, so it is pinned here rather than left to accident.
    await write(
      'src/pages/P.tsx',
      "import { Chip } from '../grids/Chip';\n" +
        'export const P = () => (\n  <PageLayout>\n    <Chip />\n  </PageLayout>\n);\n',
    );
    await write('src/grids/Chip.tsx', 'export const Chip = () => <span>ok</span>;\n');

    const tree = await screenTree(root, join(root, 'src/pages/P.tsx'), { depth: 3 });

    expect(tree!.root.children).toEqual([
      { name: 'Chip', file: 'src/grids/Chip.tsx', at: 'project', children: [] },
    ]);
  });

  it('does not walk in a circle', async () => {
    await write(
      'src/pages/A.tsx',
      "import { B } from './B';\nexport const A = () => (\n  <Shell>\n    <B />\n  </Shell>\n);\n",
    );
    await write(
      'src/pages/B.tsx',
      "import { A } from './A';\nexport const B = () => (\n  <Panel>\n    <A />\n  </Panel>\n);\n",
    );

    const tree = await screenTree(root, join(root, 'src/pages/A.tsx'), { depth: 5 });

    expect(spine(tree!.root)).toEqual(['Shell', 'B', 'Panel', 'A']);
  });
});

describe('a file whose whole output is one component', () => {
  it('follows its root, because the anatomy is inside what it names', async () => {
    // `ApiExplorerPage` on a real repository is `outlet || <DefaultApiExplorerPage
    // {...props} />`. One true line, and everything that makes it a screen is in
    // the component it names — which is exactly the hop this walk exists for and
    // the one it was not taking, because it follows children and a wiring file
    // has none.
    await write(
      'src/pages/OrdersPage.tsx',
      "import { DefaultOrdersPage } from './DefaultOrdersPage';\n" +
        'export const OrdersPage = () => <DefaultOrdersPage />;\n',
    );
    await write(
      'src/pages/DefaultOrdersPage.tsx',
      'export const DefaultOrdersPage = () => (\n  <PageShell>\n    <OrdersGrid />\n  </PageShell>\n);\n',
    );

    const tree = await screenTree(root, join(root, 'src/pages/OrdersPage.tsx'), { depth: 3 });

    // Spliced, not wrapped: a second node under the same name printed the name
    // on two consecutive lines and made five real screens read as `*Page / *Page`.
    expect(spine(tree!.root)).toEqual(['DefaultOrdersPage', 'PageShell', 'OrdersGrid']);
  });

  it('does not follow the root of a screen that holds something', async () => {
    // Following the root of `<Page><Header/><Content/></Page>` walks into the
    // design system's layout and describes the library instead of the screen.
    await write(
      'src/pages/OrdersPage.tsx',
      "import { PageShell } from './PageShell';\n" +
        'export const OrdersPage = () => (\n  <PageShell>\n    <OrdersGrid />\n  </PageShell>\n);\n',
    );
    await write('src/pages/PageShell.tsx', 'export const PageShell = () => <InternalLayout />;\n');

    const tree = await screenTree(root, join(root, 'src/pages/OrdersPage.tsx'), { depth: 3 });

    expect(tree!.root.name).toBe('PageShell');
    expect(spine(tree!.root)).toEqual(['PageShell', 'OrdersGrid']);
  });

  it('leaves no phantom child where the root could not be followed', async () => {
    // The screen has already been read as one component with nothing in it, and
    // a leaf repeating the root's own name says that twice.
    await write('src/pages/OrdersPage.tsx', 'export const OrdersPage = () => <Mystery />;\n');

    const tree = await screenTree(root, join(root, 'src/pages/OrdersPage.tsx'), { depth: 3 });

    expect(tree!.root).toEqual({
      name: 'Mystery',
      file: 'src/pages/OrdersPage.tsx',
      at: 'project',
      children: [],
    });
  });
});

describe('another package of the same workspace', () => {
  it('is named as one, and not called external', async () => {
    // On a workspace monorepo the project's own design system is imported by
    // package name. Labelled `external` it said *nothing below here is our
    // business* about the project's own code, and the walk read one level while
    // reporting two: 53 of 62 children on a real repository.
    await writeFile(join(root, 'package.json'), '{"name":"app","workspaces":["packages/*"]}');
    await mkdir(join(root, 'packages/core/src'), { recursive: true });
    await writeFile(
      join(root, 'packages/core/package.json'),
      '{"name":"@acme/core","main":"src/index.ts"}',
    );
    await writeFile(join(root, 'packages/core/src/index.ts'), 'export const PageShell = 1;\n');
    await mkdir(join(root, 'packages/app/src'), { recursive: true });
    await writeFile(
      join(root, 'packages/app/package.json'),
      '{"name":"@acme/app","dependencies":{"@acme/core":"*"}}',
    );
    await writeFile(
      join(root, 'packages/app/src/OrdersPage.tsx'),
      "import { PageShell } from '@acme/core';\n" +
        'export const OrdersPage = () => (\n  <Holder>\n    <PageShell />\n  </Holder>\n);\n',
    );

    const tree = await screenTree(root, join(root, 'packages/app/src/OrdersPage.tsx'), {
      depth: 3,
    });

    const child = tree!.root.children[0]!;
    expect(child.at).toBe('package');
    expect(child.file).toBe('packages/core/src/index.ts');
  });
});

describe('through a tsconfig alias', () => {
  it('follows the specifier most real children are written as', async () => {
    // `resolveRelative` answers only for `./OrdersGrid` and says so. On a real
    // repository most children are imported through an alias, so refusing them
    // is reading depth 1 and calling it the screen.
    await write(
      'tsconfig.json',
      JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@app/*': ['src/*'] } } }),
    );
    await write(
      'src/pages/OrdersPage.tsx',
      "import { OrdersGrid } from '@app/grids/OrdersGrid';\n" +
        'export const OrdersPage = () => (\n  <PageLayout>\n    <OrdersGrid />\n  </PageLayout>\n);\n',
    );
    await write('src/grids/OrdersGrid.tsx', 'export const OrdersGrid = () => <DataGrid />;\n');

    const tree = await screenTree(root, join(root, 'src/pages/OrdersPage.tsx'), { depth: 2 });

    expect(spine(tree!.root)).toEqual(['PageLayout', 'OrdersGrid', 'DataGrid']);
  });
});

describe('an Angular screen, which is a pair', () => {
  it('follows a selector to the class that answers to it', async () => {
    // A template names its children by selector, and the mapping is stated by
    // the class. Deriving `app-orders-grid` from `OrdersGridComponent` would be
    // a convention invented here — a project prefixes its selectors how it likes.
    await write(
      'src/pages/orders.component.ts',
      "import { OrdersGridComponent } from '../grids/orders-grid.component';\n" +
        "@Component({ selector: 'app-orders', templateUrl: './orders.component.html' })\n" +
        'export class OrdersComponent {}\n',
    );
    await write(
      'src/pages/orders.component.html',
      '<app-page-layout>\n  <app-orders-grid></app-orders-grid>\n</app-page-layout>\n',
    );
    await write(
      'src/grids/orders-grid.component.ts',
      "@Component({ selector: 'app-orders-grid', templateUrl: './orders-grid.component.html' })\n" +
        'export class OrdersGridComponent {}\n',
    );
    await write('src/grids/orders-grid.component.html', '<app-data-grid></app-data-grid>\n');

    const tree = await screenTree(root, join(root, 'src/pages/orders.component.ts'), { depth: 2 });

    expect(spine(tree!.root)).toEqual(['app-page-layout', 'app-orders-grid', 'app-data-grid']);
  });

  it('does not put an inline template in the list of files it read', async () => {
    // `markupOf` names an inline template `<identity>.html` so the right parser
    // is chosen for it. That name is not a path, and a cache key holding it
    // asks for an mtime that can never be read — a key that never matches, so
    // the answer is derived every time and the cache is decoration.
    await write(
      'src/pages/orders.component.ts',
      "@Component({ selector: 'app-orders', template: `<app-page-layout></app-page-layout>` })\n" +
        'export class OrdersComponent {}\n',
    );

    const tree = await screenTree(root, join(root, 'src/pages/orders.component.ts'));

    expect(tree!.read).toEqual([join(root, 'src/pages/orders.component.ts')]);
    expect(tree!.root.name).toBe('app-page-layout');
  });

  it('reads the same screen from either half of the pair', async () => {
    await write(
      'src/pages/orders.component.ts',
      "@Component({ selector: 'app-orders', templateUrl: './orders.component.html' })\n" +
        'export class OrdersComponent {}\n',
    );
    await write(
      'src/pages/orders.component.html',
      '<app-page-layout>\n  <app-orders-grid></app-orders-grid>\n</app-page-layout>\n',
    );

    const fromClass = await screenTree(root, join(root, 'src/pages/orders.component.ts'));
    const fromMarkup = await screenTree(root, join(root, 'src/pages/orders.component.html'));

    expect(fromMarkup!.root).toEqual(fromClass!.root);
  });
});

/**
 * First run against a real React monorepo: four screens tried, **three came out
 * wrong**, and the one that was right had plain unconditional children (#31).
 */
describe('the tree the walk actually reads', () => {
  /**
   * The commonest detail pattern builds its tabs as objects before returning,
   * and the JSX in a `content:` property is far bigger than the four lines the
   * component returns. The root was the largest top-level element, so the
   * answer was the loader and the whole screen was invisible.
   */
  it('is rooted at what the component returns, not at the biggest JSX in the file', async () => {
    const at = 'src/Details.tsx';
    await write(at,
      'const generalTab = {\n' +
        '  label: "General",\n' +
        '  content: (\n' +
        '    <LoadingBox loading={loading}>\n' +
        '      <Accordion title="Identity"><GeneralForm /><AddressForm /></Accordion>\n' +
        '      <Accordion title="Billing"><BillingForm /><TaxForm /></Accordion>\n' +
        '      <SaveBar />\n' +
        '    </LoadingBox>\n' +
        '  ),\n' +
        '};\n' +
        'export const Details = () => (\n' +
        '  <PageShell title="Account"><SectionTabs tabs={[generalTab]} /></PageShell>\n' +
        ');\n',
    );

    const walked = await screenTree(root, join(root, at), { depth: 2 });

    expect(walked?.root.name).toBe('PageShell');
    expect(walked?.root.children.map((one) => one.name)).toContain('SectionTabs');
  });

  /**
   * The defect the old "largest element" reading was itself a fix for, and the
   * one a returned-root reading can let back in: a helper declared above the
   * screen with a bigger tree than the screen has. A screen is exported and a
   * helper usually is not, so exported wins before size does.
   */
  it('takes the exported screen over a helper with a bigger tree', async () => {
    const at = 'src/Helper.tsx';
    await write(
      at,
      'const Row = () => (\n' +
        '  <TableRow><Cell /><Cell /><Cell /><Cell /><Cell /><Cell /><Cell /></TableRow>\n' +
        ');\n' +
        'export const Page = () => <PageShell><Grid rows={Row} /></PageShell>;\n',
    );

    const walked = await screenTree(root, join(root, at), { depth: 1 });

    expect(walked?.root.name).toBe('PageShell');
  });

  it('walks a child inside an expression, which is how a screen gates on data', async () => {
    const at = 'src/Regions.tsx';
    await write(at,
      'export const Regions = () => (\n' +
        '  <PageShell title="Regions">\n' +
        '    {user && <OrdersGrid user={user} />}\n' +
        '    {loading ? <Spinner /> : <Summary />}\n' +
        '    {rows.map((row) => <Row key={row.id} />)}\n' +
        '    <>{extra && <Footer />}</>\n' +
        '  </PageShell>\n' +
        ');\n',
    );

    const walked = await screenTree(root, join(root, at), { depth: 1 });
    const held = walked?.root.children.map((one) => one.name) ?? [];

    expect(held).toContain('OrdersGrid');
    expect(held).toContain('Spinner');
    expect(held).toContain('Summary');
    expect(held).toContain('Row');
    // A fragment holds no place in a layout: its children are the holder's own.
    expect(held).toContain('Footer');
    expect(held).not.toContain('Fragment');
  });

  it('never reports a node as its own child', async () => {
    const at = 'src/Self.tsx';
    await write(at,
      "import { PageShell } from '@acme/ui';\nexport const Self = () => <PageShell title=\"x\" />;\n",
    );

    const walked = await screenTree(root, join(root, at), { depth: 2 });

    expect(walked?.root.name).toBe('PageShell');
    expect(walked?.root.children.map((one) => one.name)).not.toContain('PageShell');
  });

  /**
   * `<SectionTabs tabs={tabs} />` is a leaf to a walk that follows children,
   * and the accordions, the forms and the save bar are all inside
   * `tabs[].content`. Content-as-data is one of the commonest shapes in the
   * repository this was found on.
   */
  it('follows content the screen passes as data, and says it came from a prop', async () => {
    const at = 'src/Tabs.tsx';
    await write(at,
      'const generalTab = { label: "General", content: (<LoadingBox><SaveBar /></LoadingBox>) };\n' +
        'export const Tabs = () => (\n' +
        '  <PageShell><SectionTabs tabs={[generalTab]} /></PageShell>\n' +
        ');\n',
    );

    const walked = await screenTree(root, join(root, at), { depth: 1 });
    const passed = walked?.root.children.find((one) => one.name === 'LoadingBox');

    expect(passed).toBeDefined();
    // Not printed as a child of `SectionTabs`: it is data the screen hands it.
    expect(passed?.via).toBe('SectionTabs.tabs');
  });

  it('names a content prop it could not read, rather than leaving a leaf', async () => {
    const at = 'src/Opaque.tsx';
    await write(at,
      "import { buildTabs } from './tabs';\n" +
        'export const Opaque = () => (\n' +
        '  <PageShell><SectionTabs tabs={buildTabs(t)} /></PageShell>\n' +
        ');\n',
    );

    const walked = await screenTree(root, join(root, at), { depth: 1 });

    expect(walked?.root.children.map((one) => one.name)).toContain('SectionTabs.tabs');
    expect(walked?.root.children.find((one) => one.name === 'SectionTabs.tabs')?.at).toBe(
      'unresolved',
    );
  });

  it('says nothing about a prop it cannot read on an element that holds something', async () => {
    // A prop nobody can read, on an element that already holds a child, says
    // nothing worth a line — and a check that floods gets switched off.
    const at = 'src/Held.tsx';
    await write(at,
      'export const Held = () => (\n' +
        '  <PageShell><SectionTabs tabs={buildTabs()}><Panel /></SectionTabs></PageShell>\n' +
        ');\n',
    );

    const walked = await screenTree(root, join(root, at), { depth: 1 });

    expect(walked?.root.children.map((one) => one.name)).not.toContain('SectionTabs.tabs');
  });
});

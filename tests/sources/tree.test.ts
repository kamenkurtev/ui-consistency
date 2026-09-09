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

import { describe, it, expect } from 'vitest';
import { siblingScreens } from '../../src/sources/siblings.js';

const isScreen = (name: string): boolean =>
  /\.[jt]sx$/.test(name) && !/\.(?:test|spec|stories|story)\.[jt]sx?$/.test(name);

/** A fake tree: directory path → what `readdir` returns for it. */
function reader(tree: Record<string, string[]>): {
  readDir: (dir: string) => Promise<string[]>;
  reads: string[];
} {
  const reads: string[] = [];
  return {
    reads,
    readDir: async (dir: string) => {
      reads.push(dir);
      const entries = tree[dir];
      if (entries === undefined) throw new Error(`no such directory: ${dir}`);
      return entries;
    },
  };
}

const find = async (target: string, tree: Record<string, string[]>): Promise<string[]> => {
  const { readDir } = reader(tree);
  return (await siblingScreens(target, { readDir, isScreen, maxSiblings: 24, quorum: 3 })).screens;
};

describe('the screens beside one screen', () => {
  it('is the directory itself, when the directory has enough', async () => {
    const found = await find('/app/screens/List.tsx', {
      '/app/screens': ['List.tsx', 'Detail.tsx', 'Settings.tsx', 'Report.tsx'],
    });
    expect(found).toEqual([
      '/app/screens/Detail.tsx',
      '/app/screens/Settings.tsx',
      '/app/screens/Report.tsx',
    ]);
  });

  it('is one screen per folder, where a folder holds each screen', async () => {
    const found = await find('/app/screens/List/List.tsx', {
      '/app/screens/List': ['List.tsx', 'List.css'],
      '/app/screens': ['List', 'Detail', 'Settings', 'Report'],
      '/app/screens/Detail': ['Detail.tsx'],
      '/app/screens/Settings': ['index.tsx'],
      '/app/screens/Report': ['Report.tsx'],
    });
    expect(found).toEqual([
      '/app/screens/Detail/Detail.tsx',
      '/app/screens/Settings/index.tsx',
      '/app/screens/Report/Report.tsx',
    ]);
  });
});

describe('a router, where a screen is always alone', () => {
  // Measured on shadcn-ui/taxonomy: 0 of 14 `page.tsx` files had any neighbour
  // observation at all. The app router puts one route per directory, so a
  // screen has no siblings — ever, by the framework's design.
  const taxonomy: Record<string, string[]> = {
    '/app/(marketing)/blog': ['page.tsx'],
    '/app/(marketing)': ['page.tsx', 'layout.tsx', 'blog', 'pricing', 'about'],
    '/app/(marketing)/pricing': ['page.tsx'],
    '/app/(marketing)/about': ['page.tsx'],
    '/app': ['(marketing)', '(dashboard)', 'layout.tsx'],
    '/app/(dashboard)': ['dashboard'],
    '/app/(dashboard)/dashboard': ['page.tsx'],
    '/': ['app'],
  };

  it('finds the other routes, which is the only thing beside it', async () => {
    const found = await find('/app/(marketing)/blog/page.tsx', taxonomy);
    expect(found).toContain('/app/(marketing)/pricing/page.tsx');
    expect(found).toContain('/app/(marketing)/about/page.tsx');
    expect(found.length).toBeGreaterThanOrEqual(3);
  });

  it('does not count layout.tsx or loading.tsx as a screen', async () => {
    // A loading skeleton has no page structure to agree with, and a layout is
    // the holder rather than a thing held. Counting them made the directory
    // look full while none of it was comparable.
    const found = await find('/app/(marketing)/page.tsx', {
      ...taxonomy,
      '/app/(marketing)': ['page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx'],
    });
    expect(found.some((path) => /layout|loading|error/.test(path))).toBe(false);
  });

  it('leaves a component called Error.tsx alone — that is somebody’s screen', async () => {
    const found = await find('/app/screens/List.tsx', {
      '/app/screens': ['List.tsx', 'Error.tsx', 'Detail.tsx', 'Settings.tsx'],
    });
    expect(found).toContain('/app/screens/Error.tsx');
  });
});

describe('what it refuses to do', () => {
  it('measures one scope at a time rather than adding them together', async () => {
    // Two child routes sharing a DashboardShell is not agreement, and pouring
    // eight distant screens in beside them produced a majority about `Link` —
    // true of the repository and useless about the file.
    const found = await find('/app/(dashboard)/dashboard/page.tsx', {
      '/app/(dashboard)/dashboard': ['page.tsx', 'settings', 'billing'],
      '/app/(dashboard)/dashboard/settings': ['page.tsx'],
      '/app/(dashboard)/dashboard/billing': ['page.tsx'],
      '/app/(dashboard)': ['dashboard'],
      '/app': ['(dashboard)', '(marketing)'],
      '/app/(marketing)': ['page.tsx', 'pricing', 'blog'],
      '/app/(marketing)/pricing': ['page.tsx'],
      '/app/(marketing)/blog': ['page.tsx'],
      '/': ['app'],
    });
    // Its own two child routes cannot reach quorum, so the answer comes from
    // one wider scope — all of it, not two of these and some of those.
    expect(found.length).toBeGreaterThanOrEqual(3);
    expect(new Set(found).size).toBe(found.length);
  });

  it('stays silent rather than walking a repository it cannot make sense of', async () => {
    const found = await find('/app/one/Screen.tsx', {
      '/app/one': ['Screen.tsx'],
      '/app': ['one'],
      '/': ['app'],
    });
    expect(found).toEqual([]);
  });

  it('spends a bounded number of directory reads, whatever the repository', async () => {
    // This runs on every settled edit. The walk is the only part of the
    // observation whose cost depends on the shape of somebody else's project.
    const wide: Record<string, string[]> = {
      '/app/one': ['Screen.tsx'],
      '/app': Array.from({ length: 200 }, (_, i) => `folder${i}`),
      '/': ['app'],
    };
    for (let i = 0; i < 200; i++) wide[`/app/folder${i}`] = ['notes.md'];

    const { readDir, reads } = reader(wide);
    await siblingScreens('/app/one/Screen.tsx', {
      readDir,
      isScreen,
      maxSiblings: 24,
      quorum: 3,
    });
    expect(reads.length).toBeLessThanOrEqual(45);
  });
});

describe('the boundary of the project', () => {
  it('never climbs out of the repository into a neighbouring one', async () => {
    // Found by running the shipped bundle against a real checkout that sat
    // beside other checkouts: the family held two files from a *different*
    // repository, the invariant collapsed, and that project's own layout
    // components were reported as things not to copy.
    //
    // On a real filesystem rather than a fake tree: the escape happens at the
    // third ancestor, which a hand-built fixture is unlikely to reproduce —
    // which is itself the point.
    const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');

    const work = await mkdtemp(join(tmpdir(), 'uic-boundary-'));
    const mine = join(work, 'mine');
    const theirs = join(work, 'theirs');

    await mkdir(join(mine, 'src/app'), { recursive: true });
    await writeFile(join(mine, 'package.json'), '{"name":"mine"}');
    await writeFile(join(mine, 'src/app/app.tsx'), 'export const A = () => <div />;\n');

    await mkdir(join(theirs, 'src/app'), { recursive: true });
    await writeFile(join(theirs, 'package.json'), '{"name":"theirs"}');
    await writeFile(join(theirs, 'src/index.tsx'), 'export const I = () => <div />;\n');
    await writeFile(join(theirs, 'src/app/app.tsx'), 'export const A = () => <div />;\n');
    for (const name of ['one', 'two']) {
      await mkdir(join(theirs, `src/${name}`), { recursive: true });
      await writeFile(join(theirs, `src/${name}/${name}.tsx`), 'export const X = () => <div />;\n');
    }

    const found = await siblingScreens(join(mine, 'src/app/app.tsx'), {
      isScreen,
      maxSiblings: 24,
      quorum: 3,
      root: mine,
    });

    expect(found.screens.filter((path) => path.startsWith(theirs))).toEqual([]);
  });
});

/**
 * A page and its parts are not three screens (#225).
 *
 * `pages/CustomerInvoicesPage/` holds the page, its grid, its dialog, its cell
 * and two hooks. All six pass `isScreenFile`, so the directory reached quorum
 * with five files that are not screens and the walk to the real siblings never
 * happened. Measured on a real React monorepo of 77 pages: 25 of them (32%)
 * had their own parts as their family, and 63 had three or more real sibling
 * pages one level up that were never read.
 */
describe('a folder that belongs to one screen', () => {
  const tree = {
    '/app/pages/OrdersPage': [
      'OrdersPage.tsx',
      'OrdersGrid.tsx',
      'OrdersDialog.tsx',
      'useOrdersColumns.tsx',
    ],
    '/app/pages': ['OrdersPage', 'InvoicesPage', 'CustomersPage', 'ReportsPage'],
    '/app/pages/InvoicesPage': ['InvoicesPage.tsx'],
    '/app/pages/CustomersPage': ['CustomersPage.tsx'],
    '/app/pages/ReportsPage': ['ReportsPage.tsx'],
    '/app': ['pages'],
  };

  it('walks out to the real siblings rather than taking the page apart', async () => {
    const found = await find('/app/pages/OrdersPage/OrdersPage.tsx', tree);
    expect(found).toEqual([
      '/app/pages/InvoicesPage/InvoicesPage.tsx',
      '/app/pages/CustomersPage/CustomersPage.tsx',
      '/app/pages/ReportsPage/ReportsPage.tsx',
    ]);
  });

  it('still takes a flat folder of pages as the family', async () => {
    // The other common layout, and the one the old behaviour was written for.
    const found = await find('/app/pages/OrdersPage.tsx', {
      '/app/pages': ['OrdersPage.tsx', 'InvoicesPage.tsx', 'CustomersPage.tsx', 'ReportsPage.tsx'],
    });
    expect(found).toEqual([
      '/app/pages/InvoicesPage.tsx',
      '/app/pages/CustomersPage.tsx',
      '/app/pages/ReportsPage.tsx',
    ]);
  });

  it('treats an index file as owning its folder too', async () => {
    const found = await find('/app/pages/OrdersPage/index.tsx', {
      '/app/pages/OrdersPage': ['index.tsx', 'OrdersGrid.tsx', 'OrdersDialog.tsx', 'Cell.tsx'],
      '/app/pages': ['OrdersPage', 'InvoicesPage', 'CustomersPage', 'ReportsPage'],
      '/app/pages/InvoicesPage': ['index.tsx'],
      '/app/pages/CustomersPage': ['index.tsx'],
      '/app/pages/ReportsPage': ['index.tsx'],
      '/app': ['pages'],
    });
    expect(found).toEqual([
      '/app/pages/InvoicesPage/index.tsx',
      '/app/pages/CustomersPage/index.tsx',
      '/app/pages/ReportsPage/index.tsx',
    ]);
  });
});

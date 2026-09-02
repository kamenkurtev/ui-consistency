import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cachedPattern } from '../../src/sources/pattern-cache.js';
import { clearCache } from '../../src/inventory/cache.js';

let root: string;

const page = (name: string): string =>
  `export const ${name}Page = () => (\n  <PageLayout title="${name}">\n    <${name}Grid />\n  </PageLayout>\n);\n`;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-pcache-'));
  await mkdir(join(root, 'src/pages'), { recursive: true });
  await writeFile(join(root, 'package.json'), '{"name":"app"}', 'utf8');
  for (const name of ['Orders', 'Invoices', 'Customers', 'Reports']) {
    await writeFile(join(root, `src/pages/${name}Page.tsx`), page(name), 'utf8');
  }
  await clearCache(root);
});

afterEach(async () => {
  await clearCache(root);
  await rm(root, { recursive: true, force: true });
});

/**
 * Deriving the same kind twice in one session costs one derivation (#231).
 *
 * The hook is a fresh process on every edit, so anything remembered has to
 * outlive it — the same lesson as the debounce, which was held in a module
 * variable and never refused anything.
 */
describe('what a kind of screen looks like, derived at most once', () => {
  it('answers the same for two screens of the kind in the same area', async () => {
    const first = await cachedPattern(root, join(root, 'src/pages/OrdersPage.tsx'), 'PageLayout');
    const second = await cachedPattern(
      root,
      join(root, 'src/pages/InvoicesPage.tsx'),
      'PageLayout',
    );

    expect(first?.skeleton?.holder).toBe('PageLayout');
    expect(second).toEqual(first);
  });

  it('derives again once a file it was derived from has changed', async () => {
    const before = await cachedPattern(root, join(root, 'src/pages/OrdersPage.tsx'), 'PageLayout');
    expect(before).not.toBeNull();

    // A sibling rewritten, and the answer must not be the remembered one.
    await writeFile(
      join(root, 'src/pages/InvoicesPage.tsx'),
      'export const InvoicesPage = () => (<Shell><InvoicesGrid /></Shell>);\n',
      'utf8',
    );
    const when = new Date(Date.now() + 2000);
    await utimes(join(root, 'src/pages/InvoicesPage.tsx'), when, when);

    const after = await cachedPattern(root, join(root, 'src/pages/OrdersPage.tsx'), 'PageLayout');
    expect(after?.family).not.toEqual(before?.family);
  });

  it('does not answer one area from another area’s screens', async () => {
    // Two areas are not assumed to agree. A contract from the wrong area is a
    // wrong answer rather than a missing one, which is the direction that is
    // never allowed.
    await mkdir(join(root, 'src/admin'), { recursive: true });
    for (const name of ['Users', 'Roles', 'Audit']) {
      await writeFile(
        join(root, `src/admin/${name}Page.tsx`),
        `export const ${name}Page = () => (<PageLayout title="${name}"><${name}Table /></PageLayout>);\n`,
        'utf8',
      );
    }

    const pages = await cachedPattern(root, join(root, 'src/pages/OrdersPage.tsx'), 'PageLayout');
    const admin = await cachedPattern(root, join(root, 'src/admin/UsersPage.tsx'), 'PageLayout');

    expect(admin?.family).not.toEqual(pages?.family);
  });
});

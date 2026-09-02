import { describe, it, expect, beforeEach } from 'vitest';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { cachedPackages, clearPackageCache } from '../../src/layers/cache.js';
import { cacheDirFor } from '../../src/inventory/cache.js';

const source = fileURLToPath(new URL('../fixtures/nx-ws', import.meta.url));

async function workspace(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'uic-graph-'));
  await cp(source, dir, { recursive: true });
  await clearPackageCache(dir);
  return dir;
}

const depsOf = (packages: Awaited<ReturnType<typeof cachedPackages>>, name: string): string[] =>
  packages.find((p) => p.name === name)?.dependencies ?? [];

describe('cachedPackages', () => {
  let root: string;

  beforeEach(async () => {
    root = await workspace();
  });

  it('derives the same graph detection would', async () => {
    expect(depsOf(await cachedPackages(root), '@fixture/orders')).toEqual([
      '@fixture/core',
      'some-ui-lib',
    ]);
  });

  it('answers a second time without walking the sources again', async () => {
    await cachedPackages(root);

    // Deriving edges means reading every source file in the workspace, which
    // costs about half a second on ten thousand files — affordable once per
    // CLI run, not on every keystroke through the hook. If the cache were not
    // used, this new import would show up immediately.
    const list = join(root, 'apps/orders/src/List.tsx');
    await writeFile(list, `import { x } from 'freshly-added';\n${await readFile(list, 'utf8')}`);

    expect(depsOf(await cachedPackages(root), '@fixture/orders')).not.toContain('freshly-added');
  });

  it('re-derives when the aliases themselves change', async () => {
    await cachedPackages(root);

    const list = join(root, 'apps/orders/src/List.tsx');
    await writeFile(list, `import { x } from 'freshly-added';\n${await readFile(list, 'utf8')}`);

    // A new library is a change to the aliases, and that is the moment the
    // graph is worth paying for again.
    const config = join(root, 'tsconfig.base.json');
    await writeFile(config, await readFile(config, 'utf8'));

    expect(depsOf(await cachedPackages(root), '@fixture/orders')).toContain('freshly-added');
  });

  it('leaves a workspace whose manifests declare everything uncached', async () => {
    // Nothing was scanned, so there is nothing to amortise and a stale answer
    // would be a cost with no benefit.
    const declared = fileURLToPath(new URL('../fixtures/pnpm-ws', import.meta.url));
    expect(depsOf(await cachedPackages(declared), '@fixture/orders')).toEqual(['@fixture/core']);
  });

  // The cost this cache exists to avoid is the source scan, and the scan is
  // triggered by a manifest that declares no dependencies — which has nothing
  // to do with whether the workspace has tsconfig aliases. Keyed on the alias
  // file alone, a repository with manifests and no aliases paid the whole scan
  // on every edit, uncached, which is precisely what the module was written to
  // prevent.
  it('caches a scan that no alias file triggered', async () => {
    const source = fileURLToPath(new URL('../fixtures/nx-workspaces', import.meta.url));
    const root = await mkdtemp(join(tmpdir(), 'uic-noalias-'));
    await cp(source, root, { recursive: true });
    await clearPackageCache(root);

    expect(depsOf(await cachedPackages(root), '@fixture/shared-util')).toEqual(['some-ui-lib']);

    const file = join(root, 'libs/shared/util/src/format.ts');
    await writeFile(file, `import { x } from 'freshly-added';\n${await readFile(file, 'utf8')}`);

    expect(depsOf(await cachedPackages(root), '@fixture/shared-util')).not.toContain(
      'freshly-added',
    );
    await rm(root, { recursive: true, force: true });
  });

  it('survives a corrupt cache by doing the work', async () => {
    await cachedPackages(root);
    await writeFile(join((await cacheDirFor(root))!, 'packages.json'), 'not json');

    expect(depsOf(await cachedPackages(root), '@fixture/orders')).toEqual([
      '@fixture/core',
      'some-ui-lib',
    ]);
    await rm(root, { recursive: true, force: true });
  });
});

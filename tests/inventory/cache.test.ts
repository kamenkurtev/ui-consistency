import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cachedInventory, clearCache, cacheDirFor } from '../../src/inventory/cache.js';
import type { Layer } from '../../src/types.js';

let root: string;
let layers: Layer[];

async function writeCore(body: string): Promise<void> {
  await writeFile(join(root, 'packages/core/src/index.ts'), body);
  // A cache keyed on mtime needs the mtime to actually move; a rewrite within
  // the same clock tick would otherwise look unchanged.
  const later = new Date(Date.now() + 2000);
  await utimes(join(root, 'packages/core/src/index.ts'), later, later);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-cache-'));
  await mkdir(join(root, 'packages/core/src'), { recursive: true });
  await writeFile(
    join(root, 'packages/core/package.json'),
    JSON.stringify({ name: '@t/core', source: 'src/index.ts' }),
  );
  await writeCore('export const Button = () => null;\n');
  layers = [{ name: '@t/core', root: join(root, 'packages/core'), dependencies: [] }];
  await clearCache(root);
});

describe('cachedInventory', () => {
  it('returns the same inventory a direct build would', async () => {
    const built = await cachedInventory(root, layers);
    expect(Object.keys(built.layers['@t/core'] ?? {})).toEqual(['Button']);
  });

  it('serves the second call without reading the sources again', async () => {
    await cachedInventory(root, layers);

    let reads = 0;
    const second = await cachedInventory(root, layers, {
      readSource: async () => {
        reads += 1;
        return null;
      },
    });
    expect(reads).toBe(0);
    expect(Object.keys(second.layers['@t/core'] ?? {})).toEqual(['Button']);
  });

  it('rebuilds once a source it read has changed', async () => {
    await cachedInventory(root, layers);
    await writeCore('export const Button = () => null;\nexport const Card = () => null;\n');

    const after = await cachedInventory(root, layers);
    expect(Object.keys(after.layers['@t/core'] ?? {}).sort()).toEqual(['Button', 'Card']);
  });

  it('rebuilds when a source it read has gone', async () => {
    await cachedInventory(root, layers);
    await rm(join(root, 'packages/core/src/index.ts'));

    const after = await cachedInventory(root, layers);
    expect(after.layers['@t/core']).toEqual({});
  });

  it('keeps chains apart rather than serving one for another', async () => {
    await cachedInventory(root, layers);
    const other = await cachedInventory(root, [
      { name: '@t/other', root: join(root, 'packages/nowhere'), dependencies: [] },
    ]);
    expect(other.layers['@t/other']).toEqual({});
    expect(other.layers['@t/core']).toBeUndefined();
  });

  it('builds anyway when the cache cannot be read', async () => {
    // A cache is an optimisation. If anything about it is wrong the answer is
    // to do the work, never to fail or to serve something stale.
    await cachedInventory(root, layers);
    await writeFile(join((await cacheDirFor(root))!, 'inventory.json'), 'not json');

    const after = await cachedInventory(root, layers);
    expect(Object.keys(after.layers['@t/core'] ?? {})).toEqual(['Button']);
  });
});

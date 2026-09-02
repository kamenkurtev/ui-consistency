import { readFile, writeFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Inventory, Layer } from '../types.js';
import { buildInventory, type InventoryIO } from './build.js';
import { ownedDir, projectKey } from '../core/cache-dir.js';

const CACHE_VERSION = 1;

interface Entry {
  /** Every file the build read, and the mtime it had when read. */
  sources: Record<string, number>;
  layers: Inventory['layers'];
}

interface CacheFile {
  version: number;
  chains: Record<string, Entry>;
}

/**
 * Where a project's cache lives.
 *
 * Outside the project: this is disposable, and a tool that keeps its
 * scratch files in someone's repository is a tool that gets uninstalled.
 */
export async function cacheDirFor(rootDir: string): Promise<string | null> {
  return ownedDir(projectKey(rootDir));
}

const fileIn = (dir: string): string => join(dir, 'inventory.json');

export async function clearCache(rootDir: string): Promise<void> {
  const dir = await cacheDirFor(rootDir);
  if (dir !== null) await rm(dir, { recursive: true, force: true });
}

async function readCache(rootDir: string): Promise<CacheFile> {
  const empty: CacheFile = { version: CACHE_VERSION, chains: {} };
  const dir = await cacheDirFor(rootDir);
  const raw =
    dir === null ? null : await readFile(fileIn(dir), 'utf8').catch(() => null);
  if (raw === null) return empty;
  try {
    const parsed = JSON.parse(raw) as CacheFile;
    return parsed.version === CACHE_VERSION && typeof parsed.chains === 'object'
      ? parsed
      : empty;
  } catch {
    return empty;
  }
}

const mtimeOf = (path: string): Promise<number | null> =>
  stat(path).then(
    (s) => s.mtimeMs,
    () => null,
  );

/** Whether every file the build read is still exactly as it was. */
async function stillValid(sources: Record<string, number>): Promise<boolean> {
  const checks = Object.entries(sources).map(async ([path, when]) => (await mtimeOf(path)) === when);
  return (await Promise.all(checks)).every(Boolean);
}

/**
 * `buildInventory` with its result remembered between runs.
 *
 * Parsing a monorepo's barrels costs about 300 ms. Once per CLI invocation
 * that is nothing; on every edit, through a hook, it is the difference between
 * a tool people keep and one they turn off.
 *
 * The whole chain is one cache entry rather than one per layer. Edits land in
 * application files, not in the barrels the inventory is built from, so the
 * common case is a hit either way — and a barrel that does change is worth one
 * honest rebuild rather than a partial-invalidation scheme to get wrong.
 *
 * Every failure path builds. A cache is an optimisation, and the answer to
 * anything unexpected in it is to do the work.
 */
export async function cachedInventory(
  rootDir: string,
  layers: Layer[],
  io: InventoryIO = {},
): Promise<Inventory> {
  const key = layers.map((layer) => `${layer.name}@${layer.root ?? ''}`).join('>');
  const cache = await readCache(rootDir);

  const hit = cache.chains[key];
  if (hit !== undefined && (await stillValid(hit.sources))) {
    return { layers: hit.layers };
  }

  // Recording wrapper rather than a change to `buildInventory`: what the build
  // read is exactly what makes the result stale, and only the build knows it.
  const sources: Record<string, number> = {};
  const underlying =
    io.readSource ?? ((path: string) => readFile(path, 'utf8').catch(() => null));
  const inventory = await buildInventory(layers, {
    ...io,
    readSource: async (path: string) => {
      const source = await underlying(path);
      if (source !== null) {
        const when = await mtimeOf(path);
        if (when !== null) sources[path] = when;
      }
      return source;
    },
  });

  cache.chains[key] = { sources, layers: inventory.layers };
  const into = await cacheDirFor(rootDir);
  if (into !== null) {
    await writeFile(fileIn(into), JSON.stringify(cache), 'utf8').catch(() => {
      // An unwritable cache is slow, not broken.
    });
  }

  return inventory;
}

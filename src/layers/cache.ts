import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PackageInfo } from '../types.js';
import { cacheDirFor } from '../inventory/cache.js';
import { detectPackagesDetailed } from './detect.js';
import { tsconfigPaths } from './tsconfig.js';

const CACHE_VERSION = 1;

interface CacheFile {
  version: number;
  /** Every file describing the layout, and the mtime it had when read. */
  layout: Record<string, number>;
  packages: PackageInfo[];
}

const fileIn = (dir: string): string => join(dir, 'packages.json');

export async function clearPackageCache(rootDir: string): Promise<void> {
  const dir = await cacheDirFor(rootDir);
  if (dir !== null) await rm(fileIn(dir), { force: true });
}

const mtimeOf = (path: string): Promise<number | null> =>
  stat(path).then(
    (s) => s.mtimeMs,
    () => null,
  );

/**
 * `detectPackages` with the derived dependency graph remembered between runs.
 *
 * Detection that only reads manifests costs nothing and is not kept. Detection
 * that had to read the source is: where nothing declares dependencies the edges
 * come out of the imports, which means parsing every source file in the
 * repository — about 0.5 s across ten thousand. Once per CLI run that is fine.
 * On every edit, through the hook, it is four times the entire budget.
 *
 * Whether that scan happens has nothing to do with whether the workspace has
 * aliases: a manifest declaring no dependencies triggers it too. Keying this on
 * the alias file alone left a repository with manifests and no aliases paying
 * the whole scan on every edit, uncached — the exact outcome this module exists
 * to prevent, and invisible because the result was still correct.
 *
 * **The staleness this accepts, stated plainly.** The entry is invalidated when
 * a file describing the layout changes — a manifest, a workspace file, the
 * aliases — and not when ordinary source changes. So the first import ever
 * written from one existing library to another is not seen by the hook until
 * something rebuilds the graph. What that costs is a layer missing from a
 * chain, and a missing layer yields a missed finding, never an invented one.
 * That is the direction this project has chosen every time: a miss is cheaper
 * than a false positive, and far cheaper than a hook nobody leaves switched on.
 *
 * Every failure path detects. A cache is an optimisation, and the answer to
 * anything unexpected in it is to do the work.
 */
export async function cachedPackages(rootDir: string): Promise<PackageInfo[]> {
  const layout = await layoutSignature(rootDir);
  // No usable cache directory means no cache — never no answer. Detection is
  // slower without one and exactly as correct (#172).
  const dir = await cacheDirFor(rootDir);
  const path = dir === null ? null : fileIn(dir);

  const raw = path === null ? null : await readFile(path, 'utf8').catch(() => null);
  if (raw !== null) {
    try {
      const cached = JSON.parse(raw) as CacheFile;
      if (
        cached.version === CACHE_VERSION &&
        Array.isArray(cached.packages) &&
        sameSignature(cached.layout, layout)
      ) {
        return cached.packages;
      }
    } catch {
      // A corrupt entry is a cache miss, not a failure.
    }
  }

  const { packages, derived } = await detectPackagesDetailed(rootDir);

  // Only an answer that cost a source scan is worth keeping. Detection that
  // merely read manifests is already fast, and a stale answer there would be a
  // cost with no benefit.
  if (derived && path !== null) {
    const entry: CacheFile = { version: CACHE_VERSION, layout, packages };
    await writeFile(path, JSON.stringify(entry), 'utf8').catch(() => {
      // An unwritable cache is slow, not broken.
    });
  }

  return packages;
}

/**
 * The files that describe where the packages are, with their mtimes.
 *
 * These are what a repository changes when its layout changes — a library
 * added, an alias moved, a workspace pattern widened — and therefore the
 * moment the graph is worth paying for again. Ordinary source edits are
 * deliberately not in here; see the note above.
 */
async function layoutSignature(rootDir: string): Promise<Record<string, number>> {
  const candidates = [join(rootDir, 'package.json'), join(rootDir, 'pnpm-workspace.yaml')];

  const aliases = await tsconfigPaths(rootDir);
  if (aliases !== null) candidates.push(aliases.file);

  const signature: Record<string, number> = {};
  for (const file of candidates) {
    const mtime = await mtimeOf(file);
    if (mtime !== null) signature[file] = mtime;
  }
  return signature;
}

function sameSignature(a: Record<string, number>, b: Record<string, number>): boolean {
  if (a === null || typeof a !== 'object') return false;
  const keys = Object.keys(b);
  return keys.length === Object.keys(a).length && keys.every((key) => a[key] === b[key]);
}

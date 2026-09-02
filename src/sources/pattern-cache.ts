import { readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { cacheDirFor } from '../inventory/cache.js';
import { patternOf, type ScreenPattern } from './pattern.js';

// 2: entries gained `from` (#255); an entry without it cannot be judged.
const CACHE_VERSION = 2;

interface Entry {
  /** Every file the answer was derived from, and the mtime it had when read. */
  from: Record<string, number>;
  pattern: ScreenPattern;
}

interface CacheFile {
  version: number;
  kinds: Record<string, Entry>;
}

const fileIn = (dir: string): string => join(dir, 'patterns.json');

const mtimeOf = (path: string): Promise<number | null> =>
  stat(path).then(
    (info) => info.mtimeMs,
    () => null,
  );

/**
 * What screens of this kind look like here, derived at most once.
 *
 * Keyed by the kind and the area — the holder, and the directory the screen
 * sits in. Two screens of the same kind in the same area are the same question,
 * which is what makes a rollout across a folder cost one derivation rather than
 * thirty; two areas are not assumed to agree, because a contract from the wrong
 * area is a wrong answer rather than a missing one.
 *
 * Validated against the mtimes of the files it came from, exactly as the
 * package graph is (`src/layers/cache.ts`), and with the same accepted
 * staleness: a *new* sibling appearing does not invalidate an entry whose own
 * files are untouched, so the failure direction is an answer derived from one
 * screen too few — never an invented one. Nothing derived can fail an edit, so
 * the cost of being briefly behind is a sentence the agent does not see.
 */
export async function cachedPattern(
  rootDir: string,
  target: string,
  kind: string,
): Promise<ScreenPattern | null> {
  const dir = await cacheDirFor(rootDir);
  const key = `${kind}|${dirname(target)}`;

  if (dir !== null) {
    const raw = await readFile(fileIn(dir), 'utf8').catch(() => null);
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw) as CacheFile;
        const entry = parsed.version === CACHE_VERSION ? parsed.kinds[key] : undefined;
        if (entry !== undefined) {
          const still = await Promise.all(
            Object.entries(entry.from).map(async ([path, when]) => (await mtimeOf(path)) === when),
          );
          if (still.length > 0 && still.every(Boolean)) return entry.pattern;
        }
      } catch {
        // A torn or hand-edited cache is not a reason to refuse an answer.
      }
    }
  }

  const derived = await patternOf(target).catch(() => null);
  if (derived === null || dir === null) return derived;

  const from: Record<string, number> = {};
  for (const path of derived.family) {
    const when = await mtimeOf(path);
    if (when !== null) from[path] = when;
  }

  const raw = await readFile(fileIn(dir), 'utf8').catch(() => null);
  let existing: CacheFile = { version: CACHE_VERSION, kinds: {} };
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as CacheFile;
      if (parsed.version === CACHE_VERSION && typeof parsed.kinds === 'object') existing = parsed;
    } catch {
      // Replaced rather than repaired.
    }
  }
  existing.kinds[key] = { from, pattern: derived };
  // Best effort in every direction, like the log: an unwritable cache is a
  // cache that silently does not happen, and an edit is never interrupted for
  // the sake of remembering something about it.
  await writeFile(fileIn(dir), JSON.stringify(existing), 'utf8').catch(() => undefined);
  return derived;
}

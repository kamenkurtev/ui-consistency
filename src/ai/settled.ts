import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cacheRoot, ownedDir, projectKey } from '../core/cache-dir.js';

export interface SettledOptions {
  /** Injected so the tests need no timers. */
  now?: () => number;
  /** How long a file must go untouched before it is worth an opinion. */
  windowMs?: number;
}

/**
 * During active development most edits are intermediate: the code is about to
 * change again, and re-injecting the same rules on every keystroke is how
 * advice becomes noise.
 */
const WINDOW = 60_000;

/**
 * Has this file gone quiet long enough to be worth advising on?
 *
 * **The state has to outlive the process.** A hook invocation is a fresh
 * process on every edit, so the first version of this — a budget held in a
 * module-level variable — was reconstructed and thrown away each time and
 * never refused anything. Three consecutive edits produced three identical
 * injections, which is precisely what it was written to prevent.
 *
 * Best effort throughout. A cache that cannot be read or written means advice
 * more often, never a blocked edit.
 */
export const settled = async (
  rootDir: string,
  filePath: string,
  options: SettledOptions = {},
): Promise<boolean> => {
  try {
    return await decide(rootDir, filePath, options);
  } catch {
    // Anything at all — an invalid path, a full disk, a race with another
    // process. Advice more often is the safe direction; a thrown hook is not.
    return true;
  }
};

const decide = async (
  rootDir: string,
  filePath: string,
  options: SettledOptions,
): Promise<boolean> => {
  const now = options.now ?? (() => Date.now());
  const window = options.windowMs ?? WINDOW;

  const file = join(cacheRoot(), projectKey(rootDir), 'advised.json');

  const raw = await readFile(file, 'utf8').catch(() => null);
  let seen: Record<string, number> = {};
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) seen = parsed as Record<string, number>;
    } catch {
      // A corrupt cache is an empty cache.
    }
  }

  const at = now();
  const last = seen[filePath];
  if (typeof last === 'number' && at - last < window) return false;

  seen[filePath] = at;
  // Keep it from growing without bound across a long session.
  const recent = Object.entries(seen).filter(([, time]) => at - time < window * 20);
  // Best effort. State that cannot be written means this file is advised on
  // again next time — noisier, never broken — so the failure is swallowed and
  // the answer is the same either way.
  const owned = await ownedDir(projectKey(rootDir));
  if (owned === null) return true;
  await writeFile(file, JSON.stringify(Object.fromEntries(recent)), 'utf8').catch(() => undefined);

  return true;
};

import { createHash } from 'node:crypto';
import { lstat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Owner-only. `recursive: true` applies this to directories it creates and
 * leaves an existing one alone, which is why the check below exists as well.
 */
const OWNER_ONLY = 0o700;

/**
 * The root every cache, log and contract of this tool lives under.
 *
 * Keyed by user id, not by the project alone. `os.tmpdir()` is `/tmp` on Linux —
 * shared, world-writable — and the per-project name is an unsalted hash of the
 * repository path, which anybody who can guess a checkout location can compute.
 * Without the uid, two accounts on one host name the same directory (#172).
 */
export const cacheRoot = (): string =>
  join(tmpdir(), `uic-cache-${process.getuid?.() ?? 'shared'}`);

/**
 * A directory under that root, created owner-only and verified not to be a
 * symlink.
 *
 * Both halves are needed and neither is sufficient.
 *
 * `mode` alone does not help against a directory that already exists — Node
 * applies it only to what it creates — and `mkdir(recursive: true)` does not
 * fail when the final segment is a symlink to a real directory. It stats
 * through it, treats the path as present, and every later write follows it. So
 * a symlink planted once, before the first run, redirects the log and the
 * contracts somewhere else entirely. That was reproduced (#172).
 *
 * Null when the path is not a directory this process owns outright. The caller
 * then does without a cache, which is slower and correct — writing into a
 * directory somebody else prepared is neither.
 */
async function ensureOwned(path: string): Promise<boolean> {
  await mkdir(path, { recursive: true, mode: OWNER_ONLY }).catch(() => null);

  // `lstat`, never `stat`: the whole point is to see the symlink rather than
  // what it points at.
  const found = await lstat(path).catch(() => null);
  if (found === null || !found.isDirectory()) return false;
  // Undefined on Windows, where `os.tmpdir()` is already per-user — the check
  // is skipped there rather than faked.
  if (process.getuid !== undefined && found.uid !== process.getuid()) return false;
  return true;
}

/**
 * **Every segment this tool creates is checked, not only the last one.**
 *
 * The first version of this checked the per-project directory alone, and was
 * defeated by planting the symlink one level up: `mkdir(recursive)` created the
 * project directory *inside* the attacker's, and the `lstat` then found a real
 * directory the victim had just made and owned. It returned the path, and the
 * log, the state and the inventory all landed there. Reproduced against the
 * built bundle before this was written.
 *
 * The root has to be established as ours before anything is put under it.
 */
export async function ownedDir(...segments: string[]): Promise<string | null> {
  const root = cacheRoot();
  if (!(await ensureOwned(root))) return null;

  const path = join(root, ...segments);
  return (await ensureOwned(path)) ? path : null;
}

/**
 * One name per project, for every cache this tool keeps.
 *
 * There used to be two — sha256 here, sha1 in the log and the settled state —
 * so one project had two directory names for no reason anybody had chosen.
 */
export const projectKey = (rootDir: string): string =>
  createHash('sha256').update(rootDir).digest('hex').slice(0, 16);

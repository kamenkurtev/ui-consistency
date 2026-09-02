import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Where a project keeps what it has written down about its own UI.
 *
 * Not under `.claude/`, which is where Claude Code keeps *its* configuration.
 * What lives here is the project's intent about its own screens — committed,
 * reviewed in a pull request, read by whichever agent is in the room. This
 * repository ships manifests for Claude Code, Codex, Cursor and Gemini CLI, and
 * a Codex user was being asked to commit their team's design decisions into a
 * directory named after a different vendor's tool (#145).
 */
export const KNOWLEDGE_DIR = '.ui-consistency';

/** Where it used to be. Still read, never written. */
export const LEGACY_KNOWLEDGE_DIR = '.claude/ui-consistency';

/**
 * The directory to read, and whether it is the old one.
 *
 * The new path wins whenever it holds anything. Otherwise the old one is used
 * and **said out loud** — renaming without a fallback would stop finding files
 * that are already in people's repositories, and the failure would be silence,
 * which here is indistinguishable from a project that has written nothing down.
 */
export async function knowledgeDir(
  rootDir: string,
  sub = '',
): Promise<{ dir: string; legacy: boolean }> {
  const inside = async (base: string): Promise<boolean> => {
    const entries = await readdir(resolve(rootDir, base, sub)).catch(() => null);
    return entries !== null && entries.length > 0;
  };

  if (await inside(KNOWLEDGE_DIR)) {
    return { dir: resolve(rootDir, KNOWLEDGE_DIR, sub), legacy: false };
  }
  if (await inside(LEGACY_KNOWLEDGE_DIR)) {
    return { dir: resolve(rootDir, LEGACY_KNOWLEDGE_DIR, sub), legacy: true };
  }
  return { dir: resolve(rootDir, KNOWLEDGE_DIR, sub), legacy: false };
}

/** Said wherever the old path is what was read, rather than by an audit. */
export const MOVED =
  `${LEGACY_KNOWLEDGE_DIR}/ is the old location and is still read. ` +
  `Move it to ${KNOWLEDGE_DIR}/ — it is your project's intent, not one agent's configuration.`;

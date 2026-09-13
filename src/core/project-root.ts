import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { KNOWLEDGE_DIR, LEGACY_KNOWLEDGE_DIR } from '../knowledge/paths.js';

/**
 * Walk up from a directory to the project root, or null if there is none.
 *
 * **Was `findProjectRoot` in `src/layers/detect.ts`, and it went from asking a
 * harder question to asking the right one (#81).** That version looked for the
 * nearest directory declaring **workspaces**, then for one declaring
 * `tsconfig` path aliases that name packages, and only then for a
 * `package.json` — because the root it had to find was the boundary of the
 * *layer chain*, so every layer a file might be checked against had to be
 * inside it. Getting that wrong rooted the hook inside a Next.js app, which saw
 * none of the layers and said nothing while the CLI, run from the real root,
 * reported the violation.
 *
 * There is no chain any more. What a caller needs the root for is the two
 * things that live at it: `.ui-consistency/`, which holds what the project has
 * written down, and the log. So that is what is looked for, nearest first, and
 * the workspace machinery is not merely unused — it would answer a question
 * nothing is asking.
 *
 * Nearest rather than outermost, which the original was right about and is
 * unchanged: a checkout inside another JavaScript project must not be swallowed
 * by it. And a hook is handed a file, not a project, and the session's working
 * directory need not be either, so the file's own location has to be enough.
 */
export async function findProjectRoot(startDir: string): Promise<string | null> {
  let current = resolve(startDir);
  let nearestPackage: string | null = null;

  for (;;) {
    // What the project has written down outranks where its manifest sits: a
    // knowledge directory is a statement that *this* is the project, made by a
    // person, and a `package.json` in a sub-package is not.
    for (const dir of [KNOWLEDGE_DIR, LEGACY_KNOWLEDGE_DIR]) {
      const entries = await readdir(join(current, dir)).catch(() => null);
      if (entries !== null) return current;
    }

    if (nearestPackage === null) {
      const entries = await readdir(current).catch(() => null);
      if (entries !== null && entries.includes('package.json')) nearestPackage = current;
    }

    const parent = dirname(current);
    if (parent === current) return nearestPackage;
    current = parent;
  }
}

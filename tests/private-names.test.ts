import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * Evidence from a private repository keeps its numbers and loses its names.
 *
 * This repository's culture is to record what real runs found, with real
 * numbers, in docblocks and fixtures and findings documents. The numbers are
 * the value; the names came along with them — components, screens, route
 * files, test-id prefixes — and the plan of record is to publish (#7, #265), at
 * which point every one of them ships.
 *
 * The rule (`.claude/rules/uic-docs.md`): before a measurement is written down
 * anywhere, every project-specific identifier is renamed to a neutral
 * equivalent of the same shape — same casing, same word count, same dialect.
 * The lesson and the counts survive; the provenance does not.
 *
 * **The list itself lives outside the repository**, because a committed
 * denylist is itself the leak. One pattern per line, `#` for a comment, at
 * `~/.config/uic/private-names.txt` or wherever `UIC_PRIVATE_NAMES` points.
 * Absent — on CI, on anybody else's machine — this passes and says so. Zero
 * leak in the repository, effective wherever the author works.
 *
 * A name is spelled several ways and the list has to carry each: `OrdersGrid`,
 * `app-orders-grid`, `acme-orders-page` are three entries, not one. Nothing
 * here derives one dialect from another — a guess at what a name looks like in
 * kebab-case is how a guard reports success over a real occurrence.
 */
const listPath = process.env.UIC_PRIVATE_NAMES ?? join(homedir(), '.config/uic/private-names.txt');

const patterns = ((): string[] | null => {
  try {
    return readFileSync(listPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#'));
  } catch {
    return null;
  }
})();

// `import.meta.dirname` is Node 20.11; `engines` says `>=20`, and every
// other test here finds the root this way.
const root = fileURLToPath(new URL('..', import.meta.url));

describe('names from a private repository', () => {
  it('appear in no tracked file, and in no tracked path', () => {
    if (patterns === null) {
      // Not a silent skip: the one thing worse than no guard is a guard
      // everybody believes is running.
      console.warn(`private-names guard: no list at ${listPath} — not checked`);
      expect(patterns).toBeNull();
      return;
    }

    const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
      .split('\n')
      .filter((one) => one !== '');

    const found: string[] = [];
    for (const path of tracked) {
      // The path is evidence too: a directory called after a private library
      // leaks it whether or not any file says the word.
      const haystacks: [string, string][] = [['path', path]];
      try {
        haystacks.push(['content', readFileSync(join(root, path), 'utf8')]);
      } catch {
        // A binary or unreadable file has no text to leak.
      }
      for (const pattern of patterns) {
        const needle = pattern.toLowerCase();
        for (const [where, text] of haystacks) {
          if (text.toLowerCase().includes(needle)) found.push(`${path} (${where}): ${pattern}`);
        }
      }
    }

    expect(found).toEqual([]);
  });
});

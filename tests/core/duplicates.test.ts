import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { parseModule, walk } from '../../src/parse/parse.js';

/**
 * The same function body must not exist in two modules.
 *
 * `walk` was written out seven times, five of them byte-identical, while an
 * exported copy sat in `sources/extract.ts` and six other modules imported it
 * correctly. `layerFor` twice, `isEmojiOnly` and the `EMOJI` regex twice (#148).
 *
 * Bodies, not names. `contains(root: string, filePath: string)` tests path
 * containment and `contains(outer: JSXElement, inner: JSXElement)` tests JSX
 * nesting — the names collide and nothing is wrong. Comparing names would have
 * reported those and taught everyone to ignore this test.
 *
 * The cost this guards is not tidiness. Two copies of the emoji test meant a
 * codepoint range added to one would make JSX and templates disagree in
 * silence, with every test still green and one dialect no longer reporting.
 */

const ROOT = new URL('../../src/', import.meta.url).pathname;

async function modules(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const found: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await modules(path)));
    else if (entry.name.endsWith('.ts')) found.push(path);
  }
  return found;
}

/** Bodies short enough to be a coincidence rather than a copy. */
const MIN_LINES = 4;

describe('a function body written out more than once', () => {
  it('does not exist', async () => {
    const seen = new Map<string, { name: string; files: string[] }>();

    for (const path of await modules(ROOT)) {
      const source = await readFile(path, 'utf8');
      const ast = parseModule(source, path);
      if (ast === null) continue;

      walk(ast.program, (node) => {
        if (node.type !== 'FunctionDeclaration') return;
        if (node.start === null || node.end === null) return;
        const text = source.slice(node.start ?? 0, node.end ?? 0);
        if (text.split('\n').length < MIN_LINES) return;

        // The body alone: an identical body under two names is still one
        // implementation, and renaming a copy must not hide it.
        const body = source.slice(node.body.start ?? 0, node.body.end ?? 0);
        const key = createHash('sha1').update(body).digest('hex');
        const at = seen.get(key) ?? { name: node.id?.name ?? '(anonymous)', files: [] };
        if (!at.files.includes(path)) at.files.push(path);
        seen.set(key, at);
      });
    }

    const copied = [...seen.values()]
      .filter((one) => one.files.length > 1)
      .map((one) => `${one.name}: ${one.files.map((f) => f.slice(ROOT.length)).join(', ')}`);

    expect(copied).toEqual([]);
  });
});

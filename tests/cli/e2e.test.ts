import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkProject } from '../../src/cli/index.js';

const root = fileURLToPath(new URL('../fixtures/e2e', import.meta.url));
const list = join(root, 'apps/orders/src/List.tsx');

describe('checkProject', () => {
  it('reports the import taken from the UI library when a nearer layer exports it', async () => {
    const violations = await checkProject(root, [list]);
    const nearer = violations.filter((v) => v.reason === 'nearer-layer');
    expect(nearer).toHaveLength(1);
    expect(nearer[0]).toMatchObject({
      symbol: 'Button',
      importedFrom: 'some-ui-lib',
      expectedFrom: '@fixture/core',
      line: 1,
    });
  });

  it('reports the deprecated import with its replacement', async () => {
    const violations = await checkProject(root, [list]);
    const deprecated = violations.filter((v) => v.reason === 'deprecated');
    expect(deprecated).toHaveLength(1);
    expect(deprecated[0]).toMatchObject({ symbol: 'LegacyButton', replacement: 'Button' });
  });

  it('reports nothing for a file that only imports from its nearest layer', async () => {
    expect(await checkProject(root, [join(root, 'apps/orders/src/index.ts')])).toEqual([]);
  });

  it('stays quiet about a layer sourcing its own basis, unless asked', async () => {
    // Dialog.tsx lives in @fixture/core and reaches for the library's Button
    // while core exports one of its own. On a real repository this class was
    // 94 of 253 findings and mostly noise: wrapping is what that layer is for.
    const dialog = join(root, 'packages/core/src/components/Dialog.tsx');
    expect(await checkProject(root, [dialog])).toEqual([]);

    const [violation] = await checkProject(root, [dialog], { withinLayer: true });
    expect(violation).toMatchObject({
      symbol: 'Button',
      expectedFrom: '@fixture/core',
      withinOwnLayer: true,
    });
  });

  it('reports nothing for a file outside any detected package', async () => {
    expect(await checkProject(root, [join(root, 'nowhere/File.tsx')])).toEqual([]);
  });
});

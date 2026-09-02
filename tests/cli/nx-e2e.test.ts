import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkProject } from '../../src/cli/index.js';
import { clearPackageCache } from '../../src/layers/cache.js';

/**
 * The workspace shape that produced nothing at all (#20): libraries declared
 * only as `tsconfig` path aliases, with no `package.json` anywhere below the
 * root and no dependency declared between them.
 *
 * The assertion that matters is the first one. Everything else here has always
 * worked; what had never been tested is that a repository of this shape yields
 * a chain at all, and the tool being silent by design meant the failure looked
 * exactly like success.
 */
const root = fileURLToPath(new URL('../fixtures/nx-ws', import.meta.url));
const list = join(root, 'apps/orders/src/List.tsx');

describe('checkProject on a workspace without package.json files', () => {
  // The derived graph is cached against the alias file's mtime, which editing
  // this fixture's sources would not change. Without this, a run could pass on
  // a graph built from a version of the fixture that no longer exists — which
  // is the exact way this project's suite has been green while broken before.
  beforeAll(async () => {
    await clearPackageCache(root);
  });

  it('reports the import taken from the UI library when a nearer layer exports it', async () => {
    const violations = await checkProject(root, [list]);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      symbol: 'Button',
      importedFrom: 'some-ui-lib',
      expectedFrom: '@fixture/core',
      line: 1,
    });
  });

  it('reports nothing for the import already taken from the nearest layer', async () => {
    const violations = await checkProject(root, [list]);
    expect(violations.map((v) => v.symbol)).not.toContain('Card');
  });

  it('stays quiet about the library layer sourcing its own basis', async () => {
    const button = join(root, 'libs/core/src/components/Button.tsx');
    expect(await checkProject(root, [button])).toEqual([]);
  });
});

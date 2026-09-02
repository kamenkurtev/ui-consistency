import { describe, it, expect } from 'vitest';
import { buildInventory } from '../../src/inventory/build.js';
import type { Layer } from '../../src/types.js';

const layers: Layer[] = [
  { name: '@acme/core', root: '/repo/packages/core', dependencies: [] },
  { name: 'some-ui-lib', root: null, dependencies: [] },
];

const sources: Record<string, string> = {
  '/repo/packages/core/src/index.ts': `
    export const Button = () => null;
    /** @deprecated use {@link Button} instead */
    export const LegacyButton = () => null;
  `,
};

const io = {
  readSource: async (path: string) => sources[path] ?? null,
  resolveEntry: async (root: string) =>
    root === '/repo/packages/core' ? '/repo/packages/core/src/index.ts' : null,
};

describe('buildInventory', () => {
  it('records the symbols a layer exports', async () => {
    const inventory = await buildInventory(layers, io);
    expect(Object.keys(inventory.layers['@acme/core'] ?? {}).sort()).toEqual([
      'Button',
      'LegacyButton',
    ]);
  });

  it('marks deprecated symbols and their replacement', async () => {
    const inventory = await buildInventory(layers, io);
    expect(inventory.layers['@acme/core']?.['LegacyButton']).toEqual({
      deprecated: true,
      replacement: 'Button',
    });
  });

  it('leaves healthy symbols undeprecated', async () => {
    const inventory = await buildInventory(layers, io);
    expect(inventory.layers['@acme/core']?.['Button']).toEqual({
      deprecated: false,
      replacement: null,
    });
  });

  it('records a layer with no readable entry as empty rather than omitting it', async () => {
    const inventory = await buildInventory(layers, io);
    expect(inventory.layers['some-ui-lib']).toEqual({});
  });

  it('follows `export *` through a barrel, which is how real barrels are written', async () => {
    const barrelSources: Record<string, string> = {
      '/repo/packages/core/src/index.ts': `
        export * from './components';
        export { Tag } from './Tag';
      `,
      '/repo/packages/core/src/components/index.ts': `
        export * from './Button';
      `,
      '/repo/packages/core/src/components/Button.tsx': `
        export const Button = () => null;
        /** @deprecated use {@link Button} instead */
        export const OldButton = () => null;
      `,
    };
    const inventory = await buildInventory([{ name: '@acme/core', root: '/repo/packages/core', dependencies: [] }], {
      readSource: async (path) => barrelSources[path] ?? null,
      resolveEntry: async () => '/repo/packages/core/src/index.ts',
    });
    const core = inventory.layers['@acme/core'] ?? {};
    expect(Object.keys(core).sort()).toEqual(['Button', 'OldButton', 'Tag']);
    expect(core['OldButton']).toEqual({ deprecated: true, replacement: 'Button' });
  });

  it('does not follow a star into another package, whose symbols are its own', async () => {
    const inventory = await buildInventory([{ name: '@acme/core', root: '/repo/packages/core', dependencies: [] }], {
      readSource: async (path) =>
        path === '/repo/packages/core/src/index.ts' ? `export * from 'some-ui-lib';` : null,
      resolveEntry: async () => '/repo/packages/core/src/index.ts',
    });
    expect(inventory.layers['@acme/core']).toEqual({});
  });

  it('survives a cycle between two barrels', async () => {
    const cyclic: Record<string, string> = {
      '/a/src/index.ts': `export * from './other';\nexport const A = 1;`,
      '/a/src/other.ts': `export * from './index';\nexport const B = 2;`,
    };
    const inventory = await buildInventory([{ name: '@acme/a', root: '/a', dependencies: [] }], {
      readSource: async (path) => cyclic[path] ?? null,
      resolveEntry: async () => '/a/src/index.ts',
    });
    expect(Object.keys(inventory.layers['@acme/a'] ?? {}).sort()).toEqual(['A', 'B']);
  });

  it('records a layer whose entry cannot be read as empty', async () => {
    const inventory = await buildInventory(
      [{ name: '@acme/gone', root: '/repo/packages/gone', dependencies: [] }],
      { ...io, resolveEntry: async () => '/repo/packages/gone/src/index.ts' },
    );
    expect(inventory.layers['@acme/gone']).toEqual({});
  });
});

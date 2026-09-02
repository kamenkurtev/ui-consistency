import { describe, it, expect } from 'vitest';
import { resolveChain } from '../../src/layers/chain.js';
import type { PackageInfo } from '../../src/types.js';

const packages: PackageInfo[] = [
  { name: '@acme/orders', root: '/repo/apps/orders', dependencies: ['@acme/ui', 'some-ui-lib'] },
  { name: '@acme/ui', root: '/repo/libs/ui', dependencies: ['@acme/core'] },
  { name: '@acme/core', root: '/repo/packages/core', dependencies: ['some-ui-lib'] },
];

describe('resolveChain', () => {
  it('puts the containing package first', () => {
    const chain = resolveChain('/repo/apps/orders/pages/List.tsx', packages);
    expect(chain[0]?.name).toBe('@acme/orders');
  });

  it('orders dependencies topologically, not by distance', () => {
    // `some-ui-lib` is a direct dependency of orders and `@acme/core` is two
    // steps away, but core depends on some-ui-lib, so core is the nearer layer.
    // Ordering by hop count would let a page import from the UI library while
    // a wrapper for the same symbol sits unused in core.
    const chain = resolveChain('/repo/apps/orders/pages/List.tsx', packages);
    expect(chain.map((l) => l.name)).toEqual([
      '@acme/orders',
      '@acme/ui',
      '@acme/core',
      'some-ui-lib',
    ]);
  });

  it('lets a preferred layer outrank the graph', () => {
    // A project migrating from an old package to its replacement keeps a
    // dependency from the old on the new, so the graph calls the old one
    // nearer and the check would push people back towards it. Which one is
    // the destination cannot be derived — only declared.
    const migrating: PackageInfo[] = [
      { name: '@acme/app', root: '/repo/app', dependencies: ['@acme/legacy'] },
      { name: '@acme/legacy', root: '/repo/legacy', dependencies: ['@acme/next'] },
      { name: '@acme/next', root: '/repo/next', dependencies: [] },
    ];
    const plain = resolveChain('/repo/app/Page.tsx', migrating).map((l) => l.name);
    expect(plain).toEqual(['@acme/app', '@acme/legacy', '@acme/next']);

    const preferred = resolveChain('/repo/app/Page.tsx', migrating, ['@acme/next']);
    expect(preferred.map((l) => l.name)).toEqual(['@acme/app', '@acme/next', '@acme/legacy']);
  });

  it('never demotes the package the file lives in', () => {
    const preferred = resolveChain('/repo/apps/orders/pages/List.tsx', packages, ['some-ui-lib']);
    expect(preferred[0]?.name).toBe('@acme/orders');
    expect(preferred[1]?.name).toBe('some-ui-lib');
  });

  it('includes external dependencies as layers with no root', () => {
    const chain = resolveChain('/repo/apps/orders/pages/List.tsx', packages);
    expect(chain.find((l) => l.name === 'some-ui-lib')).toEqual({
      name: 'some-ui-lib',
      root: null,
      // Nothing is known about what an external package depends on, and
      // nothing needs to be: it is where every chain ends.
      dependencies: [],
    });
  });

  it('gives a deeper package the nearer position when roots nest', () => {
    const nested: PackageInfo[] = [
      { name: '@acme/app', root: '/repo/apps/app', dependencies: [] },
      { name: '@acme/feature', root: '/repo/apps/app/features/cart', dependencies: ['@acme/app'] },
    ];
    const chain = resolveChain('/repo/apps/app/features/cart/Cart.tsx', nested);
    expect(chain[0]?.name).toBe('@acme/feature');
  });

  it('returns an empty chain for a file in no known package', () => {
    expect(resolveChain('/elsewhere/File.tsx', packages)).toEqual([]);
  });

  it('does not loop forever on a dependency cycle', () => {
    const cyclic: PackageInfo[] = [
      { name: 'a', root: '/repo/a', dependencies: ['b'] },
      { name: 'b', root: '/repo/b', dependencies: ['a'] },
    ];
    expect(resolveChain('/repo/a/File.tsx', cyclic).map((l) => l.name)).toEqual(['a', 'b']);
  });
});

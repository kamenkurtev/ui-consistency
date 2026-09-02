import { describe, it, expect } from 'vitest';
import { applyConfig } from '../../src/layers/config.js';
import type { PackageInfo } from '../../src/types.js';

const detected: PackageInfo[] = [
  { name: '@acme/orders', root: '/repo/apps/orders', dependencies: ['@acme/core'] },
  { name: '@acme/core', root: '/repo/packages/core', dependencies: ['some-ui-lib'] },
];

describe('applyConfig', () => {
  it('returns detection unchanged when there is no config', () => {
    expect(applyConfig(detected, null)).toEqual(detected);
  });

  it('drops packages the config ignores', () => {
    const result = applyConfig(detected, { ignore: ['@acme/core'] });
    expect(result.map((p) => p.name)).toEqual(['@acme/orders']);
  });

  it('also drops an ignored package from what depends on it', () => {
    // Otherwise it survives as a rootless layer on every chain that reaches
    // it, and ignoring it accomplishes nothing.
    const result = applyConfig(detected, { ignore: ['@acme/core'] });
    expect(result.find((p) => p.name === '@acme/orders')?.dependencies).toEqual([]);
  });

  it('does not let an ignored package survive by being preferred', () => {
    // `prefer` reorders the chain and `ignore` removes packages from it. A
    // package named in both would otherwise be promoted to the front of a
    // chain it is not on, where it can never match anything and never says so.
    const result = applyConfig(detected, { ignore: ['@acme/core'], prefer: ['@acme/core'] });
    expect(result.map((p) => p.name)).toEqual(['@acme/orders']);
    expect(result[0]?.dependencies).toEqual([]);
  });

  it('overrides the dependencies of a named package', () => {
    const result = applyConfig(detected, {
      packages: { '@acme/orders': { dependencies: ['some-ui-lib'] } },
    });
    expect(result.find((p) => p.name === '@acme/orders')?.dependencies).toEqual(['some-ui-lib']);
  });

  it('leaves packages the config does not mention alone', () => {
    const result = applyConfig(detected, {
      packages: { '@acme/orders': { dependencies: [] } },
    });
    expect(result.find((p) => p.name === '@acme/core')?.dependencies).toEqual(['some-ui-lib']);
  });
});

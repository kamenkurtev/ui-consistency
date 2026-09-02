import { describe, it, expect } from 'vitest';
import { checkSource } from '../../src/core/check.js';
import type { Inventory, Layer } from '../../src/types.js';

const chain: Layer[] = [
  { name: '@acme/orders', root: '/repo/apps/orders', dependencies: ['@acme/core'] },
  { name: '@acme/core', root: '/repo/packages/core', dependencies: ['some-ui-lib'] },
  { name: 'some-ui-lib', root: null, dependencies: [] },
];

const inventory: Inventory = {
  layers: {
    '@acme/orders': { Button: { deprecated: false, replacement: null } },
    '@acme/core': {
      Button: { deprecated: false, replacement: null },
      Card: { deprecated: false, replacement: null },
      LegacyTable: { deprecated: true, replacement: 'DataGrid' },
      DataGrid: { deprecated: false, replacement: null },
    },
    'some-ui-lib': {},
  },
};

const check = (source: string) =>
  checkSource('/repo/apps/orders/List.tsx', source, chain, inventory);

describe('checkSource', () => {
  it('reports an import from a further layer when a nearer one exports it', () => {
    const [violation] = check(`import { Button } from '@acme/core';`);
    expect(violation).toMatchObject({
      symbol: 'Button',
      importedFrom: '@acme/core',
      expectedFrom: '@acme/orders',
      reason: 'nearer-layer',
    });
  });

  it('reports an import from outside the chain when a layer exports it', () => {
    const [violation] = check(`import { Card } from 'some-ui-lib';`);
    expect(violation).toMatchObject({
      symbol: 'Card',
      importedFrom: 'some-ui-lib',
      expectedFrom: '@acme/core',
      reason: 'nearer-layer',
    });
  });

  it('accepts an import from the nearest layer that exports the symbol', () => {
    expect(check(`import { Button } from '@acme/orders';`)).toEqual([]);
    expect(check(`import { Card } from '@acme/core';`)).toEqual([]);
  });

  it('reports a deprecated symbol with its replacement', () => {
    const [violation] = check(`import { LegacyTable } from '@acme/core';`);
    expect(violation).toMatchObject({
      symbol: 'LegacyTable',
      reason: 'deprecated',
      replacement: 'DataGrid',
    });
  });

  it('says nothing about a symbol no layer exports', () => {
    expect(check(`import { Unknown } from 'somewhere-else';`)).toEqual([]);
  });

  it('says nothing about a specifier that is not a layer on the chain', () => {
    // A name collision with an unrelated package is not a resolution error.
    expect(check(`import { Card } from 'unrelated-utils';`)).toEqual([]);
  });

  it('says nothing when the two layers are siblings rather than ancestor and descendant', () => {
    // Found on a real monorepo: a UI library's `Extension` icon and a plugin
    // API's `Extension` type share a name and nothing else. Neither package
    // depends on the other, so neither is "nearer" — the topological order
    // between them is arbitrary and must not be read as a hierarchy.
    const siblings: Layer[] = [
      { name: '@acme/app', root: '/repo/app', dependencies: ['@acme/left', '@acme/right'] },
      { name: '@acme/left', root: '/repo/left', dependencies: [] },
      { name: '@acme/right', root: '/repo/right', dependencies: [] },
    ];
    const both: Inventory = {
      layers: {
        '@acme/app': {},
        '@acme/left': { Extension: { deprecated: false, replacement: null } },
        '@acme/right': { Extension: { deprecated: false, replacement: null } },
      },
    };
    expect(
      checkSource(
        '/repo/app/Page.tsx',
        `import { Extension } from '@acme/right';`,
        siblings,
        both,
      ),
    ).toEqual([]);
  });

  it('reports across an indirect ancestor, however many hops away', () => {
    const deep: Layer[] = [
      { name: '@acme/app', root: '/repo/app', dependencies: ['@acme/mid'] },
      { name: '@acme/mid', root: '/repo/mid', dependencies: ['some-ui-lib'] },
      { name: 'some-ui-lib', root: null, dependencies: [] },
    ];
    const deepInventory: Inventory = {
      layers: {
        '@acme/app': { Button: { deprecated: false, replacement: null } },
        '@acme/mid': {},
        'some-ui-lib': {},
      },
    };
    const [violation] = checkSource(
      '/repo/app/Page.tsx',
      `import { Button } from 'some-ui-lib';`,
      deep,
      deepInventory,
    );
    expect(violation).toMatchObject({ expectedFrom: '@acme/app' });
  });

  it('reports the line of the offending import', () => {
    const [violation] = check(`\n\nimport { Button } from '@acme/core';`);
    expect(violation?.line).toBe(3);
  });

  it('checks each named import independently', () => {
    const violations = check(`import { Button, Card } from 'some-ui-lib';`);
    expect(violations.map((v) => v.expectedFrom)).toEqual(['@acme/orders', '@acme/core']);
  });

  it('honours renamed imports by their original name', () => {
    const [violation] = check(`import { Button as B } from '@acme/core';`);
    expect(violation?.symbol).toBe('Button');
  });

  it('ignores type-only imports', () => {
    expect(check(`import type { Button } from '@acme/core';`)).toEqual([]);
    expect(check(`import { type Button } from '@acme/core';`)).toEqual([]);
  });

  it('ignores dynamic imports', () => {
    expect(check(`const m = await import('@acme/core');`)).toEqual([]);
  });

  it('ignores namespace imports, which name no symbol', () => {
    expect(check(`import * as core from '@acme/core';`)).toEqual([]);
  });

  it('ignores relative specifiers, which name no layer', () => {
    expect(check(`import { Button } from './Button';`)).toEqual([]);
    expect(check(`import { Button } from '../../packages/core/src/Button';`)).toEqual([]);
  });

  it('accepts a subpath of the layer that should have been imported from', () => {
    expect(check(`import { Card } from '@acme/core/Card';`)).toEqual([]);
  });

  it('reads the symbol of a default import from the last segment of a subpath', () => {
    // `import Button from 'some-ui-lib/Button'` is the commonest real-world
    // shape of the mistake this tool exists to catch.
    const [violation] = check(`import Card from 'some-ui-lib/Card';`);
    expect(violation).toMatchObject({
      symbol: 'Card',
      importedFrom: 'some-ui-lib/Card',
      expectedFrom: '@acme/core',
      reason: 'nearer-layer',
    });
  });

  it('reads a default import alongside named ones', () => {
    // `import Card, { type CardProps } from '@mui/material/Card'` is at least
    // as common as the bare default, and the named binding is type-only.
    const [violation] = check(`import Card, { type CardProps } from 'some-ui-lib/Card';`);
    expect(violation).toMatchObject({ symbol: 'Card', expectedFrom: '@acme/core' });
  });

  it('does not read a symbol from a bare scoped package name', () => {
    // '@acme/core' ends in 'core', which is not a subpath segment.
    expect(check(`import Core from '@acme/core';`)).toEqual([]);
  });

  it('keeps looking when the nearest exporter is not a real ancestor', () => {
    // `@acme/design` exports Button but has nothing to do with the library the
    // import was taken from, so it cannot claim it. That must not end the
    // search: `@acme/core` sits further along, wraps the library, and is the
    // honest answer. Giving up on the first failed candidate silently lost
    // real findings the moment a project put a second design system on the
    // chain.
    const twoSources: Layer[] = [
      { name: '@acme/app', root: '/repo/app', dependencies: ['@acme/design', '@acme/core'] },
      { name: '@acme/design', root: '/repo/design', dependencies: ['headless-lib'] },
      { name: '@acme/core', root: '/repo/core', dependencies: ['some-ui-lib'] },
      { name: 'headless-lib', root: null, dependencies: [] },
      { name: 'some-ui-lib', root: null, dependencies: [] },
    ];
    const both: Inventory = {
      layers: {
        '@acme/app': {},
        '@acme/design': { Button: { deprecated: false, replacement: null } },
        '@acme/core': { Button: { deprecated: false, replacement: null } },
        'headless-lib': {},
        'some-ui-lib': {},
      },
    };
    const [violation] = checkSource(
      '/repo/app/Page.tsx',
      `import { Button } from 'some-ui-lib';`,
      twoSources,
      both,
    );
    expect(violation).toMatchObject({ symbol: 'Button', expectedFrom: '@acme/core' });
  });

  it('never names a package the file cannot actually import from', () => {
    // Found on a real monorepo: a package was told to import from one it does
    // not declare, reachable only transitively. Under a strict node_modules
    // layout that import does not resolve, so the advice is not a fix.
    const undeclared: Layer[] = [
      { name: '@acme/app', root: '/repo/app', dependencies: ['@acme/mid'] },
      { name: '@acme/mid', root: '/repo/mid', dependencies: ['@acme/deep'] },
      { name: '@acme/deep', root: '/repo/deep', dependencies: ['some-ui-lib'] },
      { name: 'some-ui-lib', root: null, dependencies: [] },
    ];
    const only: Inventory = {
      layers: {
        '@acme/app': {},
        '@acme/mid': {},
        '@acme/deep': { Button: { deprecated: false, replacement: null } },
        'some-ui-lib': {},
      },
    };
    expect(
      checkSource('/repo/app/Page.tsx', `import { Button } from 'some-ui-lib';`, undeclared, only),
    ).toEqual([]);
  });

  it('marks a violation the file cannot fix with an import specifier', () => {
    const [violation] = checkSource(
      '/repo/packages/core/src/Dialog.tsx',
      `import { Button } from 'some-ui-lib';
       export const Dialog = () => null;`,
      [chain[1]!, chain[2]!],
      inventory,
    );
    expect(violation).toMatchObject({ expectedFrom: '@acme/core', withinOwnLayer: true });
  });

  it('does not fault a module for sourcing the symbol it itself exports', () => {
    // The wrapper inside @acme/core that turns the library's Button into the
    // layer's own Button must not be told to import its own output.
    const violations = checkSource(
      '/repo/packages/core/src/Button.tsx',
      `import { Button as Base } from 'some-ui-lib';
       export const Button = () => Base;`,
      [chain[1]!, chain[2]!],
      inventory,
    );
    expect(violations).toEqual([]);
  });

  it('reads a file that actually contains JSX', () => {
    // The first parser could not do this and returned nothing for three
    // quarters of a real repository's .tsx files — silently, which is worse
    // than failing. Every check test above would have passed regardless.
    const [violation] = check(`
      import { Card } from 'some-ui-lib';

      export const List = () => (
        <Card title="Orders">
          <p>Nothing here yet</p>
          {items.map((i) => (
            <span key={i}>{i}</span>
          ))}
        </Card>
      );
    `);
    expect(violation).toMatchObject({ symbol: 'Card', expectedFrom: '@acme/core' });
  });

  it('reports nothing for an unparseable file', () => {
    expect(check('const = = =')).toEqual([]);
  });

  it('reports nothing when the chain is empty', () => {
    expect(
      checkSource('/x/File.tsx', `import { Button } from 'some-ui-lib';`, [], inventory),
    ).toEqual([]);
  });
});

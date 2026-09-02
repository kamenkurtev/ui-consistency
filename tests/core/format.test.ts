import { describe, it, expect } from 'vitest';
import { formatViolation } from '../../src/core/format.js';

describe('formatViolation', () => {
  it('states the nearer-layer fact and the fix', () => {
    const text = formatViolation({
      file: 'apps/orders/List.tsx',
      line: 3,
      symbol: 'Button',
      importedFrom: 'some-ui-lib',
      expectedFrom: '@acme/orders',
      reason: 'nearer-layer',
    });
    expect(text).toBe(
      [
        'apps/orders/List.tsx:3',
        'Button is imported from some-ui-lib.',
        "@acme/orders exports Button and is nearer on this file's chain.",
        "→ import { Button } from '@acme/orders'",
      ].join('\n'),
    );
  });

  it("offers no import specifier when the expected layer is the file's own", () => {
    const text = formatViolation({
      file: 'packages/core/src/Dialog.tsx',
      line: 1,
      symbol: 'Button',
      importedFrom: 'some-ui-lib',
      expectedFrom: '@acme/core',
      reason: 'nearer-layer',
      withinOwnLayer: true,
    });
    expect(text).toBe(
      [
        'packages/core/src/Dialog.tsx:1',
        'Button is imported from some-ui-lib.',
        "@acme/core exports Button and is nearer on this file's chain.",
        "→ this file is in @acme/core; use the layer's own Button.",
      ].join('\n'),
    );
  });

  it('names the replacement for a deprecated symbol', () => {
    const text = formatViolation({
      file: 'apps/orders/List.tsx',
      line: 7,
      symbol: 'LegacyTable',
      importedFrom: '@acme/core',
      expectedFrom: '@acme/core',
      reason: 'deprecated',
      replacement: 'DataGrid',
    });
    expect(text).toBe(
      [
        'apps/orders/List.tsx:7',
        'LegacyTable is deprecated in @acme/core.',
        "→ import { DataGrid } from '@acme/core'",
      ].join('\n'),
    );
  });

  it('omits the fix line for a deprecated symbol with no replacement', () => {
    const text = formatViolation({
      file: 'apps/orders/List.tsx',
      line: 7,
      symbol: 'LegacyTable',
      importedFrom: '@acme/core',
      expectedFrom: '@acme/core',
      reason: 'deprecated',
    });
    expect(text).toBe(
      ['apps/orders/List.tsx:7', 'LegacyTable is deprecated in @acme/core.'].join('\n'),
    );
  });
});

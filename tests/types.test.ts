import { describe, it, expect } from 'vitest';
import type { Finding, Verdict, Violation } from '../src/types.js';

describe('toolchain', () => {
  it('compiles and runs a test against the shared types', () => {
    const v: Violation = {
      file: 'apps/orders/pages/List.tsx',
      line: 3,
      symbol: 'Button',
      importedFrom: 'some-ui-lib',
      expectedFrom: '@orders/common',
      reason: 'nearer-layer',
    };
    expect(v.reason).toBe('nearer-layer');
  });
});

describe('the v2 finding vocabulary', () => {
  it('carries a level, and optionally the source it came from', () => {
    const finding: Finding = {
      file: 'apps/orders/widgets/Revenue.tsx',
      line: 12,
      level: 'style',
      message: 'fontSize: 12 is a hardcoded value',
    };
    expect(finding.level).toBe('style');
    expect(finding.source).toBeUndefined();

    const advised: Finding = {
      ...finding,
      level: 'layout',
      source: 'neighbours',
      advisory: true,
    };
    expect(advised.advisory).toBe(true);
  });

  it('accepts a v1 violation as an import-level finding, unchanged', () => {
    // Back-compat is the point: v1's check keeps producing Violations and the
    // v2 engine collects them alongside the new levels without a conversion
    // that could drop a field.
    const v: Violation = {
      file: 'apps/orders/pages/List.tsx',
      line: 3,
      symbol: 'Button',
      importedFrom: 'some-ui-lib',
      expectedFrom: '@orders/common',
      reason: 'nearer-layer',
    };
    const finding: Finding = { ...v, level: 'import', message: 'Button is imported from some-ui-lib' };
    expect(finding.level).toBe('import');
    expect(finding.symbol).toBe('Button');
  });

  it('describes a tier 2 verdict', () => {
    const verdict: Verdict = { fits: false, note: 'the four beside it use a Card' };
    expect(verdict.fits).toBe(false);
  });
});

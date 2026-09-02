import { describe, it, expect } from 'vitest';
import { propFindings } from '../../src/checks/props.js';
import type { PropConventions } from '../../src/types.js';

const FILE = 'apps/orders/widgets/Revenue.tsx';

const CONVENTIONS: PropConventions = {
  Button: { variant: ['contained', 'outlined', 'text'], size: ['small', 'medium'] },
  Chip: { variant: ['filled'] },
};

describe('prop values outside the known set', () => {
  it('flags a variant no source of truth allows', () => {
    const findings = propFindings(FILE, 'export const W = () => <Button variant="ghost" />;\n', CONVENTIONS);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.level).toBe('props');
    expect(findings[0]!.line).toBe(1);
    expect(findings[0]!.message).toContain('variant="ghost"');
    expect(findings[0]!.message).toContain('contained');
  });

  it('is silent on a value in the set', () => {
    expect(
      propFindings(FILE, 'export const W = () => <Button variant="outlined" size="small" />;\n', CONVENTIONS),
    ).toEqual([]);
  });

  it('is silent on a component nothing is known about', () => {
    // The allowed set is injected, never invented: with no source of truth
    // there is no finding, whatever the value looks like.
    expect(propFindings(FILE, 'export const W = () => <Card variant="ghost" />;\n', CONVENTIONS)).toEqual([]);
  });

  it('is silent on a prop nothing is known about', () => {
    expect(propFindings(FILE, 'export const W = () => <Button color="danger" />;\n', CONVENTIONS)).toEqual([]);
  });

  it('is silent on a value it cannot read', () => {
    expect(
      propFindings(FILE, 'export const W = () => <Button variant={chosen} />;\n', CONVENTIONS),
    ).toEqual([]);
  });

  it('is silent with no conventions at all', () => {
    expect(propFindings(FILE, 'export const W = () => <Button variant="ghost" />;\n', {})).toEqual([]);
  });

  it('names the source when one is given', () => {
    const findings = propFindings(
      FILE,
      'export const W = () => <Button variant="ghost" />;\n',
      CONVENTIONS,
      'storybook',
    );
    expect(findings[0]!.source).toBe('storybook');
  });

  it('says nothing about a file that does not parse', () => {
    expect(propFindings(FILE, 'export const W = ( {', CONVENTIONS)).toEqual([]);
  });
});

describe('a prop finding says where its allowed set came from', () => {
  it('carries the source through the engine, not only when called directly', async () => {
    // `types.ts` says `source` is "named whenever the expectation is not the
    // deterministic import graph". The engine called propFindings with three
    // arguments, so it never was — and a prop finding is exactly where
    // somebody needs to know whether the set came from a reference page or
    // from curated Markdown.
    const { runEngine } = await import('../../src/core/engine.js');
    const { tier1 } = await runEngine(
      '/repo/apps/orders/src/W.tsx',
      'export const W = () => <Button variant="ghost" />;\n',
      {
        chain: [{ name: '@orders/app', root: '/repo/apps/orders', dependencies: [] }],
        inventory: { layers: {} },
        conventions: CONVENTIONS,
        conventionsFrom: 'reference',
      },
    );
    const props = tier1.filter((finding) => finding.level === 'props');
    expect(props).toHaveLength(1);
    expect(props[0]!.source).toBe('reference');
  });
});

import { describe, it, expect } from 'vitest';
import { runEngine } from '../../src/core/engine.js';
import type { EngineContext } from '../../src/core/engine.js';
import type { Knowledge } from '../../src/types.js';

const FILE = '/repo/apps/orders/src/RevenueWidget.tsx';

/**
 * ~~The import check, the deprecated import, and Tier 2.~~
 *
 * **All three are gone (#79, #81)**, and what is left is the curated
 * substitution — one check, which needs no package chain and no reviewer. So
 * every case below that used to be observed through the import check is
 * observed through that instead: which check speaks was never what these
 * assert, and each property — which files are judged at all, findings in file
 * order, a file that does not parse — is unchanged.
 */
const knowledge: Knowledge = {
  fragments: [
    {
      id: 'widgets#grids',
      kind: 'widgets',
      subject: 'Action grids',
      body: 'A widget of actions uses `<ActionGrid>`, never a raw `<Grid>`.',
      keywords: ['grid', 'widget'],
    },
  ],
};

function context(over: Partial<EngineContext> = {}): EngineContext {
  return { knowledge, ...over };
}

const usesForbidden = 'export const W = () => <Grid />;\n';

describe('the engine collects the deterministic checks', () => {
  it('reports what a curated rule forbids', async () => {
    const { tier1 } = await runEngine(FILE, usesForbidden, context());
    expect(tier1.map((f) => f.level)).toContain('reuse');
    expect(tier1[0]!.message).toContain('ActionGrid');
  });

  it('returns findings in file order, whichever check produced them', async () => {
    const source = ['export const W = () => (', '  <div>', '    <Grid />', '    <Grid />', '  </div>', ');'].join('\n');

    const { tier1 } = await runEngine(FILE, source, context());
    const lines = tier1.map((f) => f.line);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines).toEqual([...lines].sort((a, b) => a - b));
  });

  it('says nothing about a file that does not parse', async () => {
    const { tier1 } = await runEngine(FILE, 'export const W = ( {', context());
    expect(tier1).toEqual([]);
  });

  it('says nothing when the project has written nothing down', async () => {
    // The commonest state of a real project, and it is the design rather than a
    // fault — everything this tool knows that needs no rule is in `rules/`,
    // read by the agent before the line is written.
    const { tier1 } = await runEngine(FILE, usesForbidden, {});
    expect(tier1).toEqual([]);
  });
});

describe('which files the engine judges at all', () => {
  it('leaves tests alone — a raw element there is often the point of the test', async () => {
    const { tier1 } = await runEngine('/repo/apps/orders/src/W.test.tsx', usesForbidden, context());
    expect(tier1).toEqual([]);
  });

  it('leaves stories alone for the same reason', async () => {
    const { tier1 } = await runEngine(
      '/repo/apps/orders/src/W.stories.tsx',
      usesForbidden,
      context(),
    );
    expect(tier1).toEqual([]);
  });

  it('judges them when asked to', async () => {
    const { tier1 } = await runEngine('/repo/apps/orders/src/W.test.tsx', usesForbidden, {
      ...context(),
      includeTestFiles: true,
    });
    expect(tier1.length).toBeGreaterThan(0);
  });

  it('judges ordinary source', async () => {
    const { tier1 } = await runEngine(FILE, usesForbidden, context());
    expect(tier1.length).toBeGreaterThan(0);
  });
});

describe('a rule only speaks about what it is about', () => {
  /**
   * Applied globally, the widget rule told a *form* to use a WidgetCard. A
   * finding citing a rule that does not apply is worse than no finding: it
   * teaches people to stop reading them.
   */
  it('does not apply a rule to a file it was not written about', async () => {
    const unrelated = 'export const parse = (v) => new Date(v).toISOString();\n';
    const { tier1 } = await runEngine('/repo/apps/orders/src/dates.ts', unrelated, context());
    expect(tier1).toEqual([]);
  });
});

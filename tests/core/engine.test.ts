import { describe, it, expect, vi } from 'vitest';
import { runEngine } from '../../src/core/engine.js';
import type { EngineContext, ReviewRequest } from '../../src/core/engine.js';
import type { Finding, Inventory, Knowledge, Layer } from '../../src/types.js';

const FILE = '/repo/apps/orders/src/RevenueWidget.tsx';

const CHAIN: Layer[] = [
  { name: '@orders/app', root: '/repo/apps/orders', dependencies: ['@orders/common'] },
  { name: '@orders/common', root: '/repo/packages/common', dependencies: ['@fixture/ui'] },
  { name: '@fixture/ui', root: null, dependencies: [] },
];

const INVENTORY: Inventory = {
  layers: {
    '@orders/common': {
      Button: { deprecated: false, replacement: null },
      LegacyCard: { deprecated: true, replacement: 'SurfaceCard' },
      SurfaceCard: { deprecated: false, replacement: null },
    },
    '@fixture/ui': { Button: { deprecated: false, replacement: null } },
  },
};

function context(over: Partial<EngineContext> = {}): EngineContext {
  return { chain: CHAIN, inventory: INVENTORY, ...over };
}

describe('the engine collects every deterministic check', () => {
  it('reports an import violation and a style literal from one file', async () => {
    const source = [
      "import { Button } from '@fixture/ui';",
      'export const W = () => <Button sx={{ fontSize: 12 }}>Go</Button>;',
    ].join('\n');

    const { tier1 } = await runEngine(FILE, source, context());
    const levels = tier1.map((f) => f.level);
    expect(levels).toContain('import');
    expect(levels).toContain('style');
  });

  it('returns findings in file order, whichever check produced them', async () => {
    const source = [
      "import { Button } from '@fixture/ui';",
      '',
      'export const W = () => (',
      '  <div>',
      "    <span style={{ color: '#333' }}>x</span>",
      '  </div>',
      ');',
    ].join('\n');

    const { tier1 } = await runEngine(FILE, source, context());
    const lines = tier1.map((f) => f.line);
    expect(lines).toEqual([...lines].sort((a, b) => a - b));
  });

  it('says nothing about a file that does not parse', async () => {
    const { tier1 } = await runEngine(FILE, 'export const W = ( {', context());
    expect(tier1).toEqual([]);
  });
});

describe('which files the engine judges at all', () => {
  const source = "export const W = () => <button style={{ margin: 8 }}>Go</button>;\n";

  it('leaves tests alone — a raw element there is often the point of the test', async () => {
    const { tier1 } = await runEngine('/repo/apps/orders/src/W.test.tsx', source, context());
    expect(tier1).toEqual([]);
  });

  it('leaves stories alone for the same reason', async () => {
    const { tier1 } = await runEngine('/repo/apps/orders/src/W.stories.tsx', source, context());
    expect(tier1).toEqual([]);
  });

  it('judges them when asked to', async () => {
    const { tier1 } = await runEngine('/repo/apps/orders/src/W.test.tsx', source, {
      ...context(),
      includeTestFiles: true,
    });
    expect(tier1.length).toBeGreaterThan(0);
  });

  it('judges ordinary source', async () => {
    const { tier1 } = await runEngine(FILE, source, context());
    expect(tier1.length).toBeGreaterThan(0);
  });
});

describe('one fix, one finding', () => {
  it('does not report a deprecated import and its usages as separate problems', async () => {
    const source = [
      "import { LegacyCard } from '@orders/common';",
      'export const W = () => <LegacyCard />;',
    ].join('\n');

    const { tier1 } = await runEngine(FILE, source, context());
    const deprecated = tier1.filter((f) => f.level === 'deprecated' || f.reason === 'deprecated');
    // The usage is where the code has to change, so the usage is what is said.
    expect(deprecated).toHaveLength(1);
    expect(deprecated[0]!.line).toBe(2);
  });

  it('still reports a deprecated import that is never rendered', async () => {
    const source = [
      "import { LegacyCard } from '@orders/common';",
      'export const W = () => wrap(LegacyCard);',
    ].join('\n');

    const { tier1 } = await runEngine(FILE, source, context());
    expect(tier1.some((f) => f.reason === 'deprecated')).toBe(true);
  });
});

describe('tier 2 never runs when the deterministic checks already spoke', () => {
  const knowledge: Knowledge = {
    fragments: [
      {
        id: 'widgets#shell',
        kind: 'widgets',
        subject: 'Widget shell',
        body: 'Every widget is wrapped in <WidgetCard>.',
        keywords: ['widget', 'widgetcard'],
      },
    ],
  };

  const clean = [
    "import { WidgetCard } from '@orders/common';",
    'export const RevenueWidget = () => <WidgetCard>x</WidgetCard>;',
  ].join('\n');

  it('offers a deferred review when tier 1 is clean and a rule applies', async () => {
    const advisory: Finding = {
      file: FILE,
      line: 1,
      level: 'layout',
      message: 'the other widgets put the title first',
      advisory: true,
    };
    // The reviewer does not finish until this test lets it, which is what a
    // model call is like from the edit path's point of view.
    let release = (): void => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const review = vi.fn(async () => {
      await pending;
      return [advisory];
    });

    const { tier1, tier2 } = await runEngine(FILE, clean, context({ knowledge, review }));
    // Reached here with the reviewer still hanging: the edit is not waiting.
    expect(tier1).toEqual([]);
    expect(tier2).toBeDefined();

    release();
    await expect(tier2!).resolves.toEqual([advisory]);
    expect(review).toHaveBeenCalledTimes(1);
  });

  it('sends only the retrieved fragments, never the whole knowledge base', async () => {
    const review = vi.fn(async (_request: ReviewRequest): Promise<Finding[]> => []);
    const big: Knowledge = {
      fragments: [
        ...knowledge.fragments,
        {
          id: 'forms#layout',
          kind: 'forms',
          subject: 'Form layout',
          body: 'Forms lay out inside <FormLayout>.',
          keywords: ['form', 'formlayout'],
        },
      ],
    };

    const { tier2 } = await runEngine(FILE, clean, context({ knowledge: big, review }));
    await tier2;
    const sent = review.mock.calls[0]![0];
    expect(sent.fragments.map((f) => f.id)).toEqual(['widgets#shell']);
  });

  it('does not fire when tier 1 found something — the cheap answer wins', async () => {
    const review = vi.fn(async () => []);
    const dirty = [
      "import { WidgetCard } from '@orders/common';",
      'export const RevenueWidget = () => <WidgetCard sx={{ fontSize: 12 }}>x</WidgetCard>;',
    ].join('\n');

    const { tier1, tier2 } = await runEngine(FILE, dirty, context({ knowledge, review }));
    expect(tier1.length).toBeGreaterThan(0);
    expect(tier2).toBeUndefined();
    expect(review).not.toHaveBeenCalled();
  });

  it('does not fire when no rule applies to the edit', async () => {
    const review = vi.fn(async () => []);
    const unrelated = 'export const parse = (v) => new Date(v).toISOString();\n';

    // A path that says nothing either: since retrieval also reads the file's
    // own name, `RevenueWidget.tsx` would itself be a reason to fetch the
    // widget rules.
    const { tier2 } = await runEngine(
      '/repo/apps/orders/src/dates.ts',
      unrelated,
      context({ knowledge, review }),
    );
    expect(tier2).toBeUndefined();
    expect(review).not.toHaveBeenCalled();
  });

  it('does not fire when the project has no reviewer configured', async () => {
    const { tier2 } = await runEngine(FILE, clean, context({ knowledge }));
    expect(tier2).toBeUndefined();
  });

  it('never lets a failing reviewer reach the caller as an error', async () => {
    const review = vi.fn(async () => {
      throw new Error('model unavailable');
    });
    const { tier2 } = await runEngine(FILE, clean, context({ knowledge, review }));
    await expect(tier2!).resolves.toEqual([]);
  });
});

describe('curated substitution rules reach the engine', () => {
  const knowledge: Knowledge = {
    fragments: [
      {
        // Scoped to widgets, because FILE is RevenueWidget.tsx — a rule only
        // speaks about what it is about.
        id: 'widgets#shell',
        kind: 'widgets',
        subject: 'Widget shell',
        body: 'Every widget uses `<SurfaceCard>`, never a raw `<LegacyCard>`.',
        keywords: ['widget', 'surfacecard'],
      },
    ],
  };

  it('flags a component the project has written down as the wrong one', async () => {
    const source = 'export const P = () => <LegacyCard />;\n';
    const { tier1 } = await runEngine(FILE, source, context({ knowledge }));
    const substitution = tier1.filter((f) => f.source === 'knowledge');
    expect(substitution).toHaveLength(1);
    expect(substitution[0]!.message).toContain('SurfaceCard');
  });

  it('says nothing when the project has written no such rule', async () => {
    const source = 'export const P = () => <LegacyCard />;\n';
    const { tier1 } = await runEngine(FILE, source, context());
    expect(tier1.filter((f) => f.source === 'knowledge')).toEqual([]);
  });
});

describe('a rule only applies to what it is about', () => {
  const knowledge: Knowledge = {
    fragments: [
      {
        id: 'widgets#shell',
        kind: 'widgets',
        subject: 'Widget shell',
        body: 'Every widget is wrapped in `<SurfaceCard>`, never its own `<LegacyCard>`.',
        keywords: ['widget', 'surfacecard'],
      },
    ],
  };

  it('does not tell a form about the widget rule', async () => {
    // Found by running the four motivating cases end to end: a form built on
    // a raw container was told "Widget shell says use WidgetCard". The rule is
    // about widgets. A finding that cites a rule which does not apply is worse
    // than no finding — it teaches people to stop reading them.
    const form = [
      'export function CustomerForm() {',
      '  return <LegacyCard><input name="email" /></LegacyCard>;',
      '}',
    ].join('\n');

    const { tier1 } = await runEngine('/repo/apps/orders/src/CustomerForm.tsx', form, {
      ...context({ knowledge }),
    });
    expect(tier1.filter((f) => f.source === 'knowledge')).toEqual([]);
  });

  it('still tells a widget about it', async () => {
    const widget = [
      'export function RevenueWidget() {',
      '  return <LegacyCard>x</LegacyCard>;',
      '}',
    ].join('\n');

    const { tier1 } = await runEngine('/repo/apps/orders/src/RevenueWidget.tsx', widget, {
      ...context({ knowledge }),
    });
    expect(tier1.filter((f) => f.source === 'knowledge')).toHaveLength(1);
  });
});

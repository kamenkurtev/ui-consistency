import { describe, it, expect } from 'vitest';
import { buildAdvice, MAX_ADVICE } from '../../src/ai/advice.js';
import type { Knowledge } from '../../src/types.js';

const KNOWLEDGE: Knowledge = {
  fragments: [
    {
      id: 'detail-screens#archetype',
      kind: 'detail-screens',
      subject: 'Detail screen archetype',
      body: 'A detail screen is a routed page on `<DetailLayout>`.',
      keywords: ['detail', 'detaillayout'],
    },
    {
      id: 'forms#layout',
      kind: 'forms',
      subject: 'Form layout',
      body: 'Forms lay out inside `<FormLayout>`.',
      keywords: ['form', 'formlayout'],
    },
  ],
};

const DIALOG_DETAIL = [
  'export function OrderDetail({ order }) {',
  '  return (',
  '    <Dialog open>',
  '      <DetailHeader title={order.name} />',
  '    </Dialog>',
  '  );',
  '}',
].join('\n');

describe('what the hook hands to Claude', () => {
  it('carries the rules that bear on this file, and no others', () => {
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: KNOWLEDGE,
    });

    expect(advice).not.toBeNull();
    expect(advice!).toContain('Detail screen archetype');
    expect(advice!).not.toContain('Form layout');
  });

  it('says what the file structurally is — what holds it', () => {
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: KNOWLEDGE,
    });
    expect(advice!).toContain('kind of screen: held by Dialog');
  });

  it('says what the screens beside it are, when they agree', () => {
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: KNOWLEDGE,
      neighbours: { holder: 'DetailLayout', components: ['DetailLayout', 'DetailHeader'] },
    });
    expect(advice!).toContain('held by DetailLayout');
    expect(advice!).toContain('DetailLayout');
  });

  it('asks for a judgement and forbids treating it as a rule', () => {
    // The load-bearing constraint: this is advice with its source named, and
    // it can never gate. If the wording lets it read as a finding, the whole
    // separation between the tiers is gone.
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: KNOWLEDGE,
    });
    expect(advice!.toLowerCase()).toContain('advisory');
    expect(advice!.toLowerCase()).toMatch(/do not|never/);
  });

  it('stays inside what a hook may return', () => {
    // Documented cap: 10,000 characters per value. Going over does not
    // truncate politely, it is simply not delivered.
    const many: Knowledge = {
      fragments: Array.from({ length: 60 }, (_, index) => ({
        id: `detail-screens#${index}`,
        kind: 'detail-screens',
        subject: `Detail rule ${index}`,
        body: 'A detail screen is a routed page. '.repeat(40),
        keywords: ['detail'],
      })),
    };

    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: many,
    });
    expect(advice!.length).toBeLessThanOrEqual(MAX_ADVICE);
  });
});

describe('a screen built out of raw markup', () => {
  // The case the advice exists for, and the only one guaranteed to be told
  // nothing: `shapeOf` returns null when a file renders no components, and the
  // whole advisory was discarded on that basis.
  const RAW_SCREEN = [
    'export const Shipments = () => (',
    '  <div className="wrapper">',
    '    <h1>Shipments</h1>',
    '    <table><tbody /></table>',
    '  </div>',
    ');',
  ].join('\n');

  const NEIGHBOURS = { components: ['PageLayout', 'PageHeader', 'DataGrid'] };

  it('is described, rather than discarded, when the neighbours agree', () => {
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/Shipments.tsx',
      source: RAW_SCREEN,
      knowledge: { fragments: [] },
      neighbours: NEIGHBOURS,
    });
    expect(advice).not.toBeNull();
    expect(advice).toContain('renders no components at all');
    expect(advice).toContain('div');
    expect(advice).toContain('PageLayout');
  });

  it('says plainly that nothing structural was found, rather than inventing one', () => {
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/Shipments.tsx',
      source: RAW_SCREEN,
      knowledge: { fragments: [] },
      neighbours: NEIGHBOURS,
    })!;
    expect(advice).toContain('nothing structural found');
    // No line at all, rather than "not readable from the code" (#226). An empty
    // answer phrased as a judgement about the screen reads as *this screen is
    // unusual* when it means *this tool could not read it*.
    expect(advice).not.toContain('kind of screen:');
  });

  it('stays silent when nothing is known about the screens beside it', () => {
    // With no rules and no neighbour agreement there is nothing to compare raw
    // markup against, and the advice would be an opinion the tool does not have.
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/Shipments.tsx',
      source: RAW_SCREEN,
      knowledge: { fragments: [] },
    });
    expect(advice).toBeNull();
  });

  it('stays silent about a file that renders nothing at all', () => {
    // A hook, a constants module, a barrel. Not a screen that got it wrong —
    // and this is the gate that keeps the widening from becoming noise on every
    // non-screen file in the repository.
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/useShipments.ts',
      source: 'export const useShipments = () => ({ rows: [] });\n',
      knowledge: { fragments: [] },
      neighbours: NEIGHBOURS,
    });
    expect(advice).toBeNull();
  });
});

describe('when it says nothing at all', () => {
  it('is silent with no curated rules', () => {
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: { fragments: [] },
    });
    expect(advice).toBeNull();
  });

  it('is silent when no rule bears on the file', () => {
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/dates.ts',
      source: 'export const parse = (v) => new Date(v);\n',
      knowledge: KNOWLEDGE,
    });
    expect(advice).toBeNull();
  });

  it('is silent about a file it cannot read', () => {
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: 'export const X = ( {',
      knowledge: KNOWLEDGE,
    });
    expect(advice).toBeNull();
  });

  it('speaks on a project that has written nothing down, if the neighbours agree', () => {
    // The case that made a fresh install look broken. Curated rules were the
    // precondition for saying anything at all, and a project has none on its
    // first day — so the plugin was silent exactly when somebody was deciding
    // whether it did anything.
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: { fragments: [] },
      usage: [
        {
          component: 'PageContent',
          props: [{ name: 'scrollable', value: 'true', bare: true }],
          written: [],
          classes: ['flex-1', 'overflow-hidden'],
          classAttribute: 'className',
          seenIn: 5,
          agreedBy: 5,
        },
      ],
    });

    expect(advice).not.toBeNull();
    expect(advice!).toContain('PageContent');
    expect(advice!).toContain('flex-1 overflow-hidden');
    // Written the way a person writes it, not as `scrollable="true"`.
    expect(advice!).toContain('scrollable ');
    expect(advice!).not.toContain('scrollable="true"');
    // And it is never framed as something that failed.
    expect(advice!).toContain('observed, not a rule');
  });

  it('speaks when the neighbours share components but agree on no props', () => {
    // The commonest case of all, and the one that is actually being asked
    // about: every other page in the folder has a breadcrumb trail and this
    // one does not. There is no prop agreement to report, and requiring one
    // kept it silent.
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: { fragments: [] },
      neighbours: { components: ['PageLayout', 'Breadcrumbs', 'PageHeader'] },
    });

    expect(advice).not.toBeNull();
    expect(advice!).toContain('Breadcrumbs');
  });

  it('says nothing when there are neither rules nor an observation', () => {
    expect(
      buildAdvice({
        filePath: '/repo/apps/orders/src/OrderDetail.tsx',
        source: DIALOG_DETAIL,
        knowledge: { fragments: [] },
      }),
    ).toBeNull();
  });
});

describe('what the advice claims, and how it is written', () => {
  const usage = (over: Record<string, unknown>) => ({
    component: 'Panel',
    props: [] as { name: string; value: string; bare: boolean }[],
    written: [] as { name: string; shape: 'literal' | 'call' | 'expression' | null; writtenBy: number }[],
    classes: [] as string[],
    classAttribute: 'className',
    seenIn: 5,
    agreedBy: 5,
    ...over,
  });

  it('renders a bare prop bare and a string one as a string', () => {
    // `aria-expanded="true"` is a string, and rendering it as `aria-expanded`
    // suggests writing it a way the neighbours do not.
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: { fragments: [] },
      usage: [
        usage({
          props: [
            { name: 'scrollable', value: 'true', bare: true },
            { name: 'aria-expanded', value: 'true', bare: false },
          ],
        }),
      ],
    });

    expect(advice!).toContain('scrollable ');
    expect(advice!).toContain('aria-expanded="true"');
  });

  it('names both numbers when fewer wrote it that way than use it', () => {
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: { fragments: [] },
      usage: [usage({ classes: ['flex-1'], seenIn: 10, agreedBy: 7 })],
    });

    expect(advice!).toContain('used on 10 of the screens beside it, written this way on 7');
  });

  it('does not point at rules that were never emitted', () => {
    // The fresh-install path this was widened to cover has no rules at all,
    // and telling the reader to read a section that is not there is how
    // advice starts reading like boilerplate.
    const advice = buildAdvice({
      filePath: '/repo/apps/orders/src/OrderDetail.tsx',
      source: DIALOG_DETAIL,
      knowledge: { fragments: [] },
      usage: [usage({ classes: ['flex-1'] })],
    });

    expect(advice!).not.toContain("project's own rules below");
    expect(advice!).not.toContain("# The project's own rules");
  });
});

/**
 * A screen written as a pair (#229).
 *
 * The class carries the identity and the imports; the template carries the
 * markup. Reading the class as the whole screen found no structure at all, so
 * every Angular screen fell out at the raw-markup gate and was told nothing.
 */
describe('a screen whose markup lives in another file', () => {
  const usage = (over: Record<string, unknown>) => ({
    component: 'Panel',
    props: [] as { name: string; value: string; bare: boolean }[],
    written: [] as { name: string; shape: 'literal' | 'call' | 'expression' | null; writtenBy: number }[],
    classes: [] as string[],
    classAttribute: 'className',
    seenIn: 5,
    agreedBy: 5,
    ...over,
  });

  const CLASS = [
    "import { Component } from '@angular/core';",
    "@Component({ selector: 'app-orders', templateUrl: './orders.component.html' })",
    'export class OrdersComponent {}',
  ].join('\n');

  const MARKUP = '<mat-card><app-orders-grid></app-orders-grid></mat-card>\n';

  it('reads the holder out of the template it was pointed at', () => {
    const advice = buildAdvice({
      filePath: '/repo/src/app/orders/orders.component.ts',
      source: CLASS,
      markup: { path: '/repo/src/app/orders/orders.component.html', source: MARKUP },
      knowledge: { fragments: [] },
      usage: [usage({ component: 'mat-card' })],
    });

    expect(advice).toContain('kind of screen: held by mat-card');
  });

  it('reads the opening chain, not only the holder', () => {
    // `- layout: mat-card` where JSX got `- layout: PageLayout > OrdersGrid`.
    // The reading is dispatched on the dialect now, so both get the chain (#251).
    const advice = buildAdvice({
      filePath: '/repo/src/app/orders/orders.component.ts',
      source: CLASS,
      markup: { path: '/repo/src/app/orders/orders.component.html', source: MARKUP },
      knowledge: { fragments: [] },
      usage: [usage({ component: 'mat-card' })],
    });

    expect(advice).toContain('layout: mat-card > app-orders-grid');
  });

  it('does not call it a screen built out of raw markup', () => {
    // `shapeOf` is JSX-only, so a template screen has no shape however many
    // components it renders. Saying "renders no components at all" about a
    // screen whose holder was just named is the confusion this file exists to
    // avoid.
    const advice = buildAdvice({
      filePath: '/repo/src/app/orders/orders.component.ts',
      source: CLASS,
      markup: { path: '/repo/src/app/orders/orders.component.html', source: MARKUP },
      knowledge: { fragments: [] },
      usage: [usage({ component: 'mat-card' })],
    });

    expect(advice).not.toContain('renders no components at all');
  });

  it('says nothing at all without the markup, as it did before', () => {
    // The class alone renders nothing. That answer was right; what was wrong is
    // that it was the answer for every Angular screen.
    const advice = buildAdvice({
      filePath: '/repo/src/app/orders/orders.component.ts',
      source: CLASS,
      knowledge: { fragments: [] },
      usage: [usage({ component: 'mat-card' })],
    });

    expect(advice).toBeNull();
  });
});

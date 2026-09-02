import { describe, it, expect } from 'vitest';
import {
  contractDeviations,
  contractsForScreen,
  isContract,
} from '../../src/checks/contract.js';
import type { ScreenPattern } from '../../src/sources/pattern.js';

/** A contract of the shape `uic pattern` emits and a person has approved. */
const contract = (over: Partial<ScreenPattern> = {}): ScreenPattern => ({
  skeleton: { holder: 'PageLayout', regions: ['header', 'content'] },
  vocabulary: [
    { role: 'header', component: 'PageHeader' },
    { role: 'content', component: 'Content' },
  ],
  configuration: [
    {
      component: 'DataGrid',
      props: [{ name: 'dense', value: 'true', bare: true }],
      written: [],
      classes: [],
      classAttribute: 'className',
      seenIn: 4,
      agreedBy: 4,
    },
  ],
  particulars: { roles: [], components: [] },
  wiring: [],
  chrome: null,
  avoids: [],
  built: 'components',
  family: [],
  kind: 'list',
  regionsIn: 'components',
  from: 'routes',
  body: null,
  ...over,
});

const screen = (holder: string, children: string, grid = '<DataGrid dense />'): string =>
  `export const P = () => (\n  <${holder}>\n${children}\n    <Content>${grid}</Content>\n  </${holder}>\n);\n`;

describe('a screen measured against an agreed contract', () => {
  it('says nothing about a screen that matches it', async () => {
    const source = screen('PageLayout', '    <PageHeader />');
    expect(contractDeviations('List.tsx', source, contract())).toEqual([]);
  });

  it('reports a different holder', async () => {
    const source = screen('Shell', '    <PageHeader />');
    const found = contractDeviations('List.tsx', source, contract()) ?? [];

    expect(found).toHaveLength(1);
    expect(found![0]!.message).toContain('PageLayout');
    expect(found[0]!.message).toContain('Shell');
  });

  it('reports a role the contract has and the screen does not', async () => {
    const source = screen('PageLayout', '');
    const found = contractDeviations('List.tsx', source, contract()) ?? [];

    expect(found.map((one) => one.message).join(' ')).toContain('header');
  });

  it('reports a role filled by a component the contract does not name', async () => {
    // `Masthead` rather than something like `TitleBar`, which today's role
    // reading does not recognise as a header at all — the ceiling recorded in
    // #123, and the reason this test says what it says.
    const source = screen('PageLayout', '    <Masthead />');
    const found = contractDeviations('List.tsx', source, contract()) ?? [];

    const message = found.map((one) => one.message).join(' ');
    expect(message).toContain('Masthead');
    expect(message).toContain('PageHeader');
  });

  it('reports a component written without the prop the family always writes', async () => {
    // The failure the whole thing exists for: the right component, written raw.
    const source = screen('PageLayout', '    <PageHeader />', '<DataGrid />');
    const found = contractDeviations('List.tsx', source, contract()) ?? [];

    const message = found.map((one) => one.message).join(' ');
    expect(message).toContain('DataGrid');
    expect(message).toContain('dense');
  });

  it('says nothing about a component the screen does not render at all', async () => {
    // Absence is not a deviation: a contract lists how a component is written
    // where it appears, not that every screen must render it.
    const source = screen('PageLayout', '    <PageHeader />', '<Chart />');
    const found = contractDeviations('List.tsx', source, contract()) ?? [];

    expect(found.map((one) => one.message).join(' ')).not.toContain('DataGrid');
  });

  it('is not confused by a role rendered twice', async () => {
    // `{flag ? <PageHeader/> : <Masthead/>}` fills the header once, and the
    // reader reports both branches. Comparing that against a contract's
    // deduplicated roles called the commonest shape in React out of order.
    const source = `export const P = () => (\n  <PageLayout>\n    {flag ? <PageHeader /> : <Masthead />}\n    <Content><DataGrid dense /></Content>\n  </PageLayout>\n);\n`;

    expect(contractDeviations('List.tsx', source, contract())).toEqual([]);
  });

  it('accepts a role filled by the contracted component in either branch', async () => {
    // Taking the first occurrence made the verdict depend on which branch of a
    // ternary the walk reached first: one order was silent, the reverse was a
    // deviation, on the same page.
    const reversed = `export const P = () => (\n  <PageLayout>\n    {flag ? <Masthead /> : <PageHeader />}\n    <Content><DataGrid dense /></Content>\n  </PageLayout>\n);\n`;

    expect(contractDeviations('List.tsx', reversed, contract())).toEqual([]);
  });

  it('says how many screens write a prop, rather than claiming every one does', async () => {
    // The contract's own numbers say `agreedBy` of `seenIn`. Telling somebody
    // "every screen writes this", when three of five do, is a finding they can
    // disprove in two files — and then they stop reading the rest.
    const partly = contract({
      configuration: [
        {
          component: 'DataGrid',
          props: [{ name: 'dense', value: 'true', bare: true }],
          written: [],
          classes: [],
          classAttribute: 'className',
          seenIn: 5,
          agreedBy: 3,
        },
      ],
    });
    const source = screen('PageLayout', '    <PageHeader />', '<DataGrid />');

    const message = (contractDeviations('List.tsx', source, partly) ?? [])
      .map((one) => one.message)
      .join(' ');
    expect(message).toContain('3 of the 5');
    expect(message).not.toContain('every screen');
  });

  it('distinguishes a prop written differently from one not written at all', async () => {
    const different = contract({
      configuration: [
        {
          component: 'DataGrid',
          props: [{ name: 'variant', value: 'outlined', bare: false }],
          written: [],
          classes: [],
          classAttribute: 'className',
          seenIn: 4,
          agreedBy: 4,
        },
      ],
    });
    const source = screen('PageLayout', '    <PageHeader />', '<DataGrid variant="filled" />');

    const message = (contractDeviations('List.tsx', source, different) ?? [])
      .map((one) => one.message)
      .join(' ');
    expect(message).toContain('filled');
    expect(message).not.toContain('without');
  });

  it('says nothing about a file that is not a screen', async () => {
    // Run against a real app, eight of the nine screens reported were `.test.tsx`
    // files — a test renders whatever it needs to assert something, and holding
    // it to a page contract is noise that destroys trust in the rest.
    const source = screen('Shell', '');
    expect(contractDeviations('src/pages/List/List.test.tsx', source, contract())).toBeNull();
  });

  it('is silent when the contract states nothing to compare against', async () => {
    const empty = contract({ skeleton: null, vocabulary: [], configuration: [] });
    expect(contractDeviations('List.tsx', screen('Shell', ''), empty)).toEqual([]);
  });

  it('reads a template dialect, so a project written in one is not skipped', async () => {
    const source =
      '<app-page><app-page-header></app-page-header><app-content></app-content></app-page>';
    // Stated as a *different* holder, so this can only pass if the template was
    // actually parsed. Asserting silence against a matching contract would pass
    // just as well if nothing had been read at all.
    const angular = contract({
      skeleton: { holder: 'app-shell', regions: ['header', 'content'] },
      vocabulary: [],
      configuration: [],
    });

    const message = (contractDeviations('list.component.html', source, angular) ?? [])
      .map((one) => one.message)
      .join(' ');
    expect(message).toContain('app-page');
    expect(message).toContain('app-shell');
  });
});

describe('what counts as a contract at all', () => {
  it('accepts what uic pattern emits', () => {
    expect(isContract(contract())).toBe(true);
  });

  it('rejects JSON that parses but states nothing', () => {
    // It parsed, so the friendly error never fired, and the first field access
    // threw a TypeError with a stack trace at the user instead.
    expect(isContract({ name: 'not a contract' })).toBe(false);
    expect(isContract(null)).toBe(false);
    expect(isContract([])).toBe(false);
  });
});

/**
 * The dialects, written the way a real project writes them.
 *
 * Not simplified: a template that is *also* valid JSX passed this check while
 * the bug was live, because Babel happened to read it. The `(click)=`, the
 * `<script setup>` and the `{#if}` are the whole point — they are what makes
 * the source unreadable to a JavaScript parser, and every one of them was
 * reported as matching the contract (#149).
 */
describe('a raw element the contract forbids, in a template dialect', () => {
  const forbidsTable = contract({
    skeleton: null,
    vocabulary: [],
    configuration: [],
    avoids: ['table'],
  });

  const dialects = [
    {
      file: 'shipments.component.html',
      source:
        '<div class="page">\n' +
        '  <button (click)="save()">Save</button>\n' +
        '  <table *ngIf="rows.length"><tbody></tbody></table>\n' +
        '  <span>{{ total }}</span>\n' +
        '</div>\n',
    },
    {
      file: 'Shipments.vue',
      source:
        '<script setup lang="ts">\n' +
        'const rows = []\n' +
        '</script>\n' +
        '<template>\n' +
        '  <div>\n' +
        '    <table v-if="rows.length"><tbody></tbody></table>\n' +
        '  </div>\n' +
        '</template>\n',
    },
    {
      file: 'Shipments.svelte',
      source:
        '<script>let rows = [];</script>\n' +
        '<div>\n' +
        '  {#if rows.length}\n' +
        '    <table><tbody></tbody></table>\n' +
        '  {/if}\n' +
        '</div>\n',
    },
  ];

  for (const { file, source } of dialects) {
    it(`reports the raw <table> in ${file}`, () => {
      const found = contractDeviations(file, source, forbidsTable) ?? [];

      expect(found.map((one) => one.message)).toEqual([
        'renders a raw <table>; no screen of this kind does',
      ]);
    });
  }

  it('says nothing when the dialect renders nothing it forbids', () => {
    const source =
      '<div class="page">\n' +
      '  <app-data-grid *ngIf="rows.length"></app-data-grid>\n' +
      '</div>\n';

    expect(contractDeviations('shipments.component.html', source, forbidsTable)).toEqual([]);
  });
});

describe('which contract a screen is measured against', () => {
  const list = contract({ kind: 'list', skeleton: { holder: 'PageLayout', regions: ['header'] } });
  const detail = contract({
    kind: 'detail',
    skeleton: { holder: 'DetailLayout', regions: ['header'] },
  });

  it('leaves a single contract alone, whatever holder the screen uses', () => {
    // With one contract nothing is ambiguous, and a screen in the wrong holder
    // is a finding that contract should make.
    expect(contractsForScreen([list], 'SomethingElse')).toEqual([list]);
    expect(contractsForScreen([list], null)).toEqual([list]);
  });

  it('picks the one whose holder the screen sits in', () => {
    expect(contractsForScreen([list, detail], 'DetailLayout')).toEqual([detail]);
    expect(contractsForScreen([list, detail], 'PageLayout')).toEqual([list]);
  });

  it('picks none when the screen is of a kind nobody has agreed one for', () => {
    expect(contractsForScreen([list, detail], 'Dialog')).toEqual([]);
  });

  it('picks none rather than all when the holder cannot be read', () => {
    expect(contractsForScreen([list, detail], null)).toEqual([]);
  });

  /**
   * The defect itself, stated as the hook meets it.
   *
   * The old guard returned early only when a contract matched *exactly*, so a
   * detail screen with one real deviation from the detail contract went on to
   * collect every message from the list contract as well — the one case its own
   * comment said it existed to prevent (#152).
   */
  it('does not report a detail screen against the list contract because it has one flaw', () => {
    const source =
      'export const P = () => (\n  <DetailLayout>\n    <Sidebar />\n  </DetailLayout>\n);\n';

    const measured = contractsForScreen([list, detail], 'DetailLayout').flatMap(
      (one) => contractDeviations('OrderDetail.tsx', source, one) ?? [],
    );

    expect(measured.length).toBeGreaterThan(0);
    for (const one of measured) {
      expect(one.message).not.toContain('PageLayout');
    }

    // What it used to do: every contract asked, every answer kept.
    const both = [list, detail].flatMap(
      (one) => contractDeviations('OrderDetail.tsx', source, one) ?? [],
    );
    expect(both.length).toBeGreaterThan(measured.length);
    expect(both.some((one) => one.message.includes('PageLayout'))).toBe(true);
  });
});

describe('a screen with more raw markup than the advisory would name', () => {
  const forbidsTable = contract({
    skeleton: null,
    vocabulary: [],
    configuration: [],
    avoids: ['table'],
  });

  /**
   * Twelve distinct raw elements, the forbidden one beyond the eighth.
   *
   * `MAX_RAW` is eight, and it used to be applied inside `rawMarkupOf` — so the
   * check read a truncated list and reported a match on a screen rendering
   * exactly what the contract forbids.
   *
   * The `<table>` is written near the *top* on purpose. `walk` is a stack, so
   * elements come back in reverse document order and this one lands at index
   * ten:
   *
   *     ["div","nav","section","img","li","ul","h2","h1","p","span","table","tbody"]
   *
   * A screen like this — plain elements and classes, no components — is exactly
   * the one most likely to have been written without the design system (#155).
   */
  const busy =
    'export const P = () => (\n' +
    '  <div>\n' +
    '    <table><tbody /></table>\n' +
    '    <span /><p /><h1 /><h2 /><ul /><li /><img /><section /><nav />\n' +
    '  </div>\n' +
    ');\n';

  it('still finds the forbidden element past the eighth', () => {
    const found = contractDeviations('Busy.tsx', busy, forbidsTable) ?? [];

    expect(found.map((one) => one.message)).toEqual([
      'renders a raw <table>; no screen of this kind does',
    ]);
  });
});

/**
 * A prop the whole family writes, on a component this screen does render (#227).
 *
 * This does not reverse *"absence is not a deviation"* two screens up. A screen
 * that renders no grid is a screen without a grid, and that is not a mistake.
 * A screen that renders `PageLayout` while every sibling's `PageLayout` carries
 * `dataTestId` has written that component incompletely — the subject of the
 * finding is the component, not the screen.
 */
describe('a component written without what every screen of the kind writes', () => {
  const always = (): ScreenPattern =>
    contract({
      skeleton: { holder: 'PageLayout', regions: [] },
      vocabulary: [],
      configuration: [
        {
          component: 'PageLayout',
          props: [{ name: 'scrollable', value: 'false', bare: false }],
          written: [
            { name: 'title', shape: 'call', writtenBy: 5 },
            { name: 'dataTestId', shape: 'literal', writtenBy: 5 },
          ],
          classes: [],
          classAttribute: 'className',
          seenIn: 5,
          agreedBy: 5,
        },
      ],
    });

  const page = (attributes: string): string =>
    `export const P = () => (\n  <PageLayout ${attributes}>\n    <OrdersGrid />\n  </PageLayout>\n);\n`;

  it('says nothing when the screen writes them all', () => {
    const source = page('title={t(X.Title)} dataTestId="acme-orders-page" scrollable={false}');
    expect(contractDeviations('Orders.tsx', source, always())).toEqual([]);
  });

  it('names the prop the screen left off', () => {
    const source = page('title={t(X.Title)} scrollable={false}');
    const found = contractDeviations('Orders.tsx', source, always());
    expect(found).toHaveLength(1);
    expect(found![0]!.message).toContain(
      'writes <PageLayout> without dataTestId, which every screen of this kind writes',
    );
  });

  it('names a raw string where every sibling writes a call', () => {
    // The commonest real mistake, and deterministic to see: syntax, not meaning.
    const source = page('title="Orders" dataTestId="acme-orders-page" scrollable={false}');
    const found = contractDeviations('Orders.tsx', source, always());
    expect(found).toHaveLength(1);
    expect(found![0]!.message).toContain(
      'writes title as a literal on <PageLayout>, where every screen of this kind writes a call',
    );
  });

  it('says nothing about the shape where the family writes it two ways', () => {
    const loose = always();
    loose.configuration[0]!.written = [{ name: 'title', shape: null, writtenBy: 5 }];
    const source = page('title="Orders" scrollable={false}');
    expect(contractDeviations('Orders.tsx', source, loose)).toEqual([]);
  });

  it('reads a contract written before this field existed', () => {
    const old = always();
    delete (old.configuration[0] as { written?: unknown }).written;
    const source = page('scrollable={false}');
    expect(contractDeviations('Orders.tsx', source, old)).toEqual([]);
  });
});

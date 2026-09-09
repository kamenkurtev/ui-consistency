import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { observeUsage } from '../../src/sources/usage.js';

/**
 * A real directory of real files, not a stubbed reader.
 *
 * The reader is where the thing this is for actually lives — which extensions
 * count as a screen, which files are excluded. A test that injects its own
 * `readDir` proves the aggregation and nothing about whether an Angular page
 * has neighbours, which is exactly the defect this was built to close.
 */
const screens = async (files: Record<string, string>): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'uic-usage-'));
  await mkdir(join(dir, 'screens'), { recursive: true });
  for (const [name, source] of Object.entries(files)) {
    await writeFile(join(dir, 'screens', name), source, 'utf8');
  }
  return join(dir, 'screens');
};

const page = (extra: string): string => `
export const Page = () => (
  <PageLayout>
    <Breadcrumbs items={trail} />
    <PageContent className="flex-1 overflow-hidden ${extra}">
      <DataGrid scrollable density="compact" />
    </PageContent>
  </PageLayout>
);
`;

describe('what the screens beside this one agree about', () => {
  it('reports the props they all write the same way', async () => {
    const dir = await screens({
      'Orders.tsx': page('p-4'),
      'Invoices.tsx': page('gap-2'),
      'Customers.tsx': page(''),
      'Shipments.tsx': page('p-6'),
    });

    const usage = await observeUsage(join(dir, 'New.tsx'));
    expect(usage).not.toBeNull();

    const grid = usage!.find((one) => one.component === 'DataGrid');
    expect(grid?.props).toEqual(
      expect.arrayContaining([
        { name: 'scrollable', value: 'true', bare: true },
        { name: 'density', value: 'compact', bare: false },
      ]),
    );
    expect(grid?.seenIn).toBe(4);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('intersects class lists by token rather than comparing whole strings', async () => {
    // The case this exists for: every page expands its content and scrolls in
    // the grid, and every page also has its own padding. Comparing the whole
    // `class` string finds no agreement at all and says nothing.
    const dir = await screens({
      'Orders.tsx': page('p-4'),
      'Invoices.tsx': page('gap-2'),
      'Customers.tsx': page('mt-2'),
    });

    const usage = await observeUsage(join(dir, 'New.tsx'));
    const content = usage!.find((one) => one.component === 'PageContent');
    expect(content?.classes).toEqual(expect.arrayContaining(['flex-1', 'overflow-hidden']));
    expect(content?.classes).not.toContain('p-4');

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('says nothing about a prop the siblings disagree on', async () => {
    const varied = (density: string): string =>
      `export const P = () => <DataGrid scrollable density="${density}" />;`;
    const dir = await screens({
      'A.tsx': varied('compact'),
      'B.tsx': varied('standard'),
      'C.tsx': varied('comfortable'),
    });

    const usage = await observeUsage(join(dir, 'New.tsx'));
    const grid = usage!.find((one) => one.component === 'DataGrid');
    expect(grid?.props.map((prop) => prop.name)).toEqual(['scrollable']);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('reads Angular templates, which had no neighbours at all before', async () => {
    const markup = `
<app-page-layout>
  <app-breadcrumbs></app-breadcrumbs>
  <app-page-content class="flex-1 overflow-hidden">
    <app-data-grid scrollable density="compact"></app-data-grid>
  </app-page-content>
</app-page-layout>
`;
    const dir = await screens({
      'orders.component.html': markup,
      'invoices.component.html': markup,
      'customers.component.html': markup,
    });

    const usage = await observeUsage(join(dir, 'new.component.html'));
    expect(usage).not.toBeNull();
    const grid = usage!.find((one) => one.component === 'app-data-grid');
    expect(grid?.props).toEqual(
      expect.arrayContaining([
        { name: 'scrollable', value: 'true', bare: true },
        { name: 'density', value: 'compact', bare: false },
      ]),
    );

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('does not read an Angular binding as a value', async () => {
    // `[data]="items"` is a variable name, not a convention — and reporting it
    // as one tells five pages they all agree about something nobody chose. The
    // first Angular fixture here used only static attributes, which is how it
    // passed while this was broken.
    const markup = `
<app-page-content class="flex-1 overflow-hidden" [ngClass]="{'is-busy': loading}">
  <app-data-grid [data]="items" (rowClick)="open($event)" scrollable></app-data-grid>
</app-page-content>
`;
    const dir = await screens({
      'a.component.html': markup,
      'b.component.html': markup,
      'c.component.html': markup,
    });

    const usage = await observeUsage(join(dir, 'new.component.html'));
    const grid = usage!.find((one) => one.component === 'app-data-grid');
    expect(grid?.props.map((prop) => prop.name)).toEqual(['scrollable']);

    // And an `[ngClass]` object is not a list of class names.
    const content = usage!.find((one) => one.component === 'app-page-content');
    expect(content?.classes).toEqual(['flex-1', 'overflow-hidden']);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('keeps a prop that merely starts like a noisy one', async () => {
    // `refreshInterval`, `keyboardNavigation`, `idPrefix` — all eaten by a
    // prefix match on `key|ref|id`, and the first is the kind of prop this was
    // built to notice.
    const source =
      'export const P = () => <Toolbar refreshInterval="30" keyboardNavigation idPrefix="x" key="a" />;';
    const dir = await screens({ 'A.tsx': source, 'B.tsx': source, 'C.tsx': source });

    const usage = await observeUsage(join(dir, 'New.tsx'));
    const toolbar = usage!.find((one) => one.component === 'Toolbar');
    expect(toolbar?.props.map((prop) => prop.name).sort()).toEqual([
      'idPrefix',
      'keyboardNavigation',
      'refreshInterval',
    ]);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('finds the neighbours one folder out when each screen has its own', async () => {
    // `screens/OrderDetail/OrderDetail.tsx` is as common as a folder of
    // screens, and on Backstage only 12% of the directories holding a screen
    // hold three — so reading the target's own directory alone means this
    // never fires in most repositories.
    const dir = await mkdtemp(join(tmpdir(), 'uic-usage-'));
    for (const name of ['Orders', 'Invoices', 'Customers', 'New']) {
      await mkdir(join(dir, 'screens', name), { recursive: true });
      await writeFile(
        join(dir, 'screens', name, `${name}.tsx`),
        name === 'New' ? 'export const P = () => <div />;' : page(''),
        'utf8',
      );
    }

    const usage = await observeUsage(join(dir, 'screens/New/New.tsx'));
    expect(usage).not.toBeNull();
    const grid = usage!.find((one) => one.component === 'DataGrid');
    expect(grid?.props).toContainEqual({ name: 'density', value: 'compact', bare: false });
    expect(grid?.seenIn).toBe(3);

    await rm(dir, { recursive: true, force: true });
  });

  it('is silent below the quorum, because two files can be a copy', async () => {
    const dir = await screens({ 'A.tsx': page(''), 'B.tsx': page('') });
    expect(await observeUsage(join(dir, 'New.tsx'))).toBeNull();
    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('never counts the file being edited as its own neighbour', async () => {
    const dir = await screens({
      'A.tsx': page(''),
      'B.tsx': page(''),
      'C.tsx': page(''),
      'New.tsx': 'export const P = () => <DataGrid density="loose" />;',
    });

    const usage = await observeUsage(join(dir, 'New.tsx'));
    const grid = usage!.find((one) => one.component === 'DataGrid');
    expect(grid?.props).toContainEqual({ name: 'density', value: 'compact', bare: false });
    expect(grid?.seenIn).toBe(3);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('leaves out tests and stories', async () => {
    const dir = await screens({
      'A.tsx': page(''),
      'B.tsx': page(''),
      'A.test.tsx': 'export const T = () => <DataGrid density="loose" />;',
      'A.stories.tsx': 'export const S = () => <DataGrid density="loose" />;',
    });
    // Two real screens and two excluded ones is below the quorum.
    expect(await observeUsage(join(dir, 'New.tsx'))).toBeNull();
    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('does not report a component one screen writes two different ways', async () => {
    const twice = `
export const P = () => (
  <div>
    <Button variant="primary" />
    <Button variant="ghost" />
  </div>
);`;
    const dir = await screens({ 'A.tsx': twice, 'B.tsx': twice, 'C.tsx': twice });
    const usage = await observeUsage(join(dir, 'New.tsx'));
    const button = usage?.find((one) => one.component === 'Button');
    expect(button).toBeUndefined();
    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('measures class agreement against every use, not only the plain ones', async () => {
    // Three siblings writing the classes plainly and seven writing
    // `className={cn(...)}` is not ten screens agreeing about anything. In a
    // Tailwind or clsx codebase the dynamic form is the majority, so measuring
    // against the plain ones alone was the normal path, not the edge.
    const files: Record<string, string> = {};
    for (const name of ['A', 'B', 'C']) {
      files[`${name}.tsx`] = 'export const P = () => <Panel className="flex-1 overflow-hidden" />;';
    }
    for (const name of ['D', 'E', 'F', 'G', 'H', 'I', 'J']) {
      files[`${name}.tsx`] = "export const P = () => <Panel className={cn('a')} />;";
    }
    const dir = await screens(files);

    const usage = await observeUsage(join(dir, 'New.tsx'));
    const panel = usage?.find((one) => one.component === 'Panel');
    expect(panel).toBeUndefined();

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('reports how many wrote it that way when that is fewer than use it', async () => {
    // Seven of ten is a majority and is worth saying — but it must not be said
    // as "on ten of the screens beside it".
    const files: Record<string, string> = {};
    for (const name of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      files[`${name}.tsx`] = 'export const P = () => <Panel tone="quiet" className="flex-1" />;';
    }
    for (const name of ['H', 'I', 'J']) {
      files[`${name}.tsx`] = 'export const P = () => <Panel tone="quiet" />;';
    }
    const dir = await screens(files);

    const usage = await observeUsage(join(dir, 'New.tsx'));
    const panel = usage!.find((one) => one.component === 'Panel');
    expect(panel?.seenIn).toBe(10);
    expect(panel?.agreedBy).toBe(7);
    expect(panel?.classes).toEqual(['flex-1']);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('does not read an interpolated template value as a value', async () => {
    // `rows="{{items}}"` has an ordinary attribute name, so the binding guard
    // — which reads the name — never saw it, and somebody's variable name was
    // handed over as an observed convention. Angular is the dialect this was
    // widened to read, so this is not a corner of it.
    const markup = `
<app-grid rows="{{items}}" label="Orders" class="flex-1 {{extra}}"></app-grid>
`;
    const dir = await screens({
      'a.component.html': markup,
      'b.component.html': markup,
      'c.component.html': markup,
    });

    const usage = await observeUsage(join(dir, 'new.component.html'));
    const grid = usage!.find((one) => one.component === 'app-grid');
    expect(grid?.props.map((prop) => prop.name)).toEqual(['label']);
    expect(grid?.classes).toEqual(['flex-1']);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('leaves out stories and specs written in a template dialect', async () => {
    // `Button.stories.svelte` is the standard Svelte CSF name. While the
    // exclusion was anchored to `[jt]sx`, a folder could reach quorum on
    // nothing but stories and specs.
    const markup = '<Panel tone="quiet"><span>x</span></Panel>';
    const dir = await screens({
      'A.svelte': markup,
      'A.stories.svelte': markup,
      'B.spec.svelte': markup,
    });

    expect(await observeUsage(join(dir, 'New.svelte'))).toBeNull();

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('keeps a namespaced component apart from a plain one of the same name', async () => {
    // `<Grid.Item>` and a separate `<Item>` landed in one bucket and had their
    // attributes intersected as though one component were written two ways —
    // which deleted both real conventions instead of reporting either.
    const both = `
export const P = () => (
  <div>
    <Grid.Item span="6" />
    <Item tone="quiet" />
  </div>
);`;
    const dir = await screens({ 'A.tsx': both, 'B.tsx': both, 'C.tsx': both });

    const usage = await observeUsage(join(dir, 'New.tsx'));
    expect(usage!.find((one) => one.component === 'Grid.Item')?.props).toEqual([
      { name: 'span', value: '6', bare: false },
    ]);
    expect(usage!.find((one) => one.component === 'Item')?.props).toEqual([
      { name: 'tone', value: 'quiet', bare: false },
    ]);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('stops probing folders once there are enough siblings to measure', async () => {
    // The parent walk reads a directory and parses a file per folder, and it
    // runs on every project now that an empty knowledge base no longer returns
    // early. Unbounded, `src/components/` with 300 folders was 300 readdirs and
    // 300 parses on every settled edit.
    const dir = await mkdtemp(join(tmpdir(), 'uic-usage-'));
    for (let i = 0; i < 60; i++) {
      const name = `Screen${String(i).padStart(2, '0')}`;
      await mkdir(join(dir, 'screens', name), { recursive: true });
      await writeFile(join(dir, 'screens', name, `${name}.tsx`), page(''), 'utf8');
    }
    await mkdir(join(dir, 'screens', 'New'), { recursive: true });
    await writeFile(join(dir, 'screens/New/New.tsx'), 'export const P = () => <div />;', 'utf8');

    const read: string[] = [];
    const usage = await observeUsage(join(dir, 'screens/New/New.tsx'), {
      readSource: async (path) => {
        read.push(path);
        return page('');
      },
    });

    expect(usage).not.toBeNull();
    expect(read.length).toBeLessThanOrEqual(24);

    await rm(dir, { recursive: true, force: true });
  });

  it('reports the class attribute as the siblings spell it', async () => {
    // `class="flex-1"` handed to a React project is a dialect nobody there
    // uses — and, copied, invalid JSX.
    const jsx = await screens({
      'A.tsx': page(''),
      'B.tsx': page(''),
      'C.tsx': page(''),
    });
    const inJsx = await observeUsage(join(jsx, 'New.tsx'));
    expect(inJsx!.find((one) => one.component === 'PageContent')?.classAttribute).toBe('className');
    await rm(join(jsx, '..'), { recursive: true, force: true });

    const markup = '<app-page-content class="flex-1 overflow-hidden"></app-page-content>';
    const html = await screens({
      'a.component.html': markup,
      'b.component.html': markup,
      'c.component.html': markup,
    });
    const inHtml = await observeUsage(join(html, 'new.component.html'));
    expect(inHtml!.find((one) => one.component === 'app-page-content')?.classAttribute).toBe('class');
    await rm(join(html, '..'), { recursive: true, force: true });
  });

  it('ignores a value it cannot read rather than guessing at it', async () => {
    const dynamic = 'export const P = () => <DataGrid rows={rows} scrollable />;';
    const dir = await screens({ 'A.tsx': dynamic, 'B.tsx': dynamic, 'C.tsx': dynamic });
    const usage = await observeUsage(join(dir, 'New.tsx'));
    const grid = usage!.find((one) => one.component === 'DataGrid');
    expect(grid?.props.map((prop) => prop.name)).toEqual(['scrollable']);
    await rm(join(dir, '..'), { recursive: true, force: true });
  });
});

/**
 * A prop every screen writes states something, even when each screen chooses
 * its own value (#227).
 *
 * Measured on five real sibling pages, every one of them written like this:
 *
 * ```tsx
 * <PageLayout
 *   title={t(CustomerInvoicesTexts.PageTitle)}
 *   breadcrumbs={[...]}
 *   dataTestId="acme-customer-invoices-page"
 *   scrollable={false}
 * >
 * ```
 *
 * The contract captured one of the four. `title`, `breadcrumbs` and
 * `dataTestId` were dropped because their values differ — which is exactly what
 * they are supposed to do. So a new page that omits `dataTestId`, or writes
 * `title="Bank certificates"` where every sibling writes `title={t(…)}`,
 * deviates from all five siblings and nothing notices.
 */
describe('props the family always writes', () => {
  const layout = (name: string, extra = ''): string => `
export const ${name}Page = () => (
  <PageLayout
    title={t(${name}Texts.PageTitle)}
    breadcrumbs={[{ text: t(SectionTexts.Title) }]}
    dataTestId="acme-${name.toLowerCase()}-page"
    scrollable={false}
    ${extra}
  >
    <${name}Grid />
  </PageLayout>
);
`;

  it('names the props every screen writes, beside the ones they agree the value of', async () => {
    const dir = await screens({
      'Orders.tsx': layout('Orders'),
      'Invoices.tsx': layout('Invoices'),
      'Customers.tsx': layout('Customers'),
      'Reports.tsx': layout('Reports'),
    });

    const found = await observeUsage(join(dir, 'Orders.tsx'));
    const layoutUsage = found?.find((one) => one.component === 'PageLayout');

    expect(layoutUsage?.props.map((one) => one.name)).toEqual(['scrollable']);
    expect(layoutUsage?.written.map((one) => one.name).sort()).toEqual([
      'breadcrumbs',
      'dataTestId',
      'title',
    ]);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('says what shape the value takes, where every screen writes the same shape', async () => {
    const dir = await screens({
      'Orders.tsx': layout('Orders'),
      'Invoices.tsx': layout('Invoices'),
      'Customers.tsx': layout('Customers'),
      'Reports.tsx': layout('Reports'),
    });

    const found = await observeUsage(join(dir, 'Orders.tsx'));
    const written = found?.find((one) => one.component === 'PageLayout')?.written ?? [];

    // `title={t(…)}` is a call on every screen; a raw string where every sibling
    // writes a call is the commonest real mistake, and it is deterministic.
    expect(written.find((one) => one.name === 'title')?.shape).toBe('call');
    expect(written.find((one) => one.name === 'dataTestId')?.shape).toBe('literal');
    expect(written.find((one) => one.name === 'breadcrumbs')?.shape).toBe('expression');

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('says nothing about a prop one screen leaves off', async () => {
    // Not "most screens write it". The claim is about the whole family, and a
    // prop three of four write is that screen's own decision.
    const dir = await screens({
      'Orders.tsx': layout('Orders'),
      'Invoices.tsx': layout('Invoices'),
      'Customers.tsx': layout('Customers'),
      'Reports.tsx': `
export const ReportsPage = () => (
  <PageLayout title={t(ReportsTexts.PageTitle)} scrollable={false}>
    <ReportsGrid />
  </PageLayout>
);
`,
    });

    const found = await observeUsage(join(dir, 'Orders.tsx'));
    const written = found?.find((one) => one.component === 'PageLayout')?.written ?? [];

    expect(written.map((one) => one.name)).toEqual(['title']);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('leaves a prop out of the shape claim when the family writes it two ways', async () => {
    const dir = await screens({
      'Orders.tsx': layout('Orders'),
      'Invoices.tsx': layout('Invoices'),
      'Reports.tsx': layout('Reports'),
      'Customers.tsx': `
export const CustomersPage = () => (
  <PageLayout
    title="Customers"
    breadcrumbs={[{ text: 'x' }]}
    dataTestId="acme-customers-page"
    scrollable={false}
  >
    <CustomersGrid />
  </PageLayout>
);
`,
    });

    const found = await observeUsage(join(dir, 'Orders.tsx'));
    const written = found?.find((one) => one.component === 'PageLayout')?.written ?? [];

    expect(written.find((one) => one.name === 'title')?.shape).toBeNull();
    expect(written.find((one) => one.name === 'dataTestId')?.shape).toBe('literal');

    await rm(join(dir, '..'), { recursive: true, force: true });
  });
});

/**
 * A prop most screens write is a fact, and the count is part of it (#257).
 *
 * Unanimity meant the more drift a family already had, the *less* the tool said
 * about it: one screen omitting a prop silenced the claim for the whole kind, so
 * the signal was weakest exactly where a consistency tool is needed most, and
 * one drifted screen granted every future screen permission to drift the same
 * way. Measured on a real route-derived family of 8 — `title` and `breadcrumbs`
 * at 8 of 8 kept, `dataTestId` at **7 of 8** dropped.
 */
describe('props most of the family writes', () => {
  const with_ = (name: string, testId: boolean): string => `
export const ${name}Page = () => (
  <PageLayout title={t(x)} ${testId ? `dataTestId="acme-${name.toLowerCase()}-page"` : ''}>
    <${name}Grid />
  </PageLayout>
);
`;

  it('keeps a prop most of the family writes, with how many', async () => {
    // Three of the four the aggregation sees — the reference is excluded from
    // it, so five files make a family of four. Both floors still apply: a claim
    // below `MIN_FILES` writers rests on too little whatever the ratio.
    const dir = await screens({
      'Orders.tsx': with_('Orders', true),
      'Invoices.tsx': with_('Invoices', true),
      'Customers.tsx': with_('Customers', true),
      'Reports.tsx': with_('Reports', true),
      'Devices.tsx': with_('Devices', false),
    });

    const found = await observeUsage(join(dir, 'Orders.tsx'));
    const layout = found?.find((one) => one.component === 'PageLayout');
    const testId = layout?.written.find((one) => one.name === 'dataTestId');

    expect(testId).toBeDefined();
    expect(testId!.writtenBy).toBe(3);
    expect(layout!.seenIn).toBe(4);

    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('reads a prop the whole family writes exactly as before', async () => {
    const dir = await screens({
      'Orders.tsx': with_('Orders', true),
      'Invoices.tsx': with_('Invoices', true),
      'Customers.tsx': with_('Customers', true),
      'Reports.tsx': with_('Reports', true),
      'Devices.tsx': with_('Devices', true),
    });

    const found = await observeUsage(join(dir, 'Orders.tsx'));
    const layout = found?.find((one) => one.component === 'PageLayout');
    const testId = layout?.written.find((one) => one.name === 'dataTestId');

    expect(testId!.writtenBy).toBe(layout!.seenIn);
    await rm(join(dir, '..'), { recursive: true, force: true });
  });

  it('leaves out a prop below the majority floor', async () => {
    // Nothing changes down there: a prop one of four writes is that screen's.
    const dir = await screens({
      'Orders.tsx': with_('Orders', true),
      'Invoices.tsx': with_('Invoices', true),
      'Customers.tsx': with_('Customers', false),
      'Reports.tsx': with_('Reports', false),
      'Devices.tsx': with_('Devices', false),
    });

    const found = await observeUsage(join(dir, 'Orders.tsx'));
    const layout = found?.find((one) => one.component === 'PageLayout');

    expect(layout?.written.map((one) => one.name)).toEqual(['title']);
    await rm(join(dir, '..'), { recursive: true, force: true });
  });
});

describe('a role the family fills under a different name every time', () => {
  const listScreen = (grid: string, extra: string): string => `
export const Page = () => (
  <PageShell title="x" ${extra}>
    <${grid} columns={c} rows={r} density="compact" />
  </PageShell>
);
`;

  it('describes the slot, which counting by name cannot reach', async () => {
    // Nine list screens render `OrdersGrid`, `InvoicesGrid`, `CustomersGrid`.
    // Counted by name not one of them reaches a majority, so the contract
    // described the holder alone — measured on a real family of four,
    // `configuration` had exactly one entry. Props are where a family drifts,
    // and every component it drifts on was invisible.
    const dir = await screens({
      'Orders.tsx': listScreen('OrdersGrid', ''),
      'Invoices.tsx': listScreen('InvoicesGrid', ''),
      'Customers.tsx': listScreen('CustomersGrid', ''),
      'Reports.tsx': listScreen('ReportsGrid', ''),
    });

    const usage = await observeUsage(join(dir, 'Orders.tsx'));

    const slot = usage?.find((one) => one.component === '*Grid');
    expect(slot).toBeDefined();
    expect(slot?.props.map((one) => one.name)).toContain('density');
    await rm(dir, { recursive: true, force: true });
  });

  it('leaves a name the family already shares alone rather than reporting it twice', async () => {
    const dir = await screens({
      'Orders.tsx': listScreen('SharedGrid', ''),
      'Invoices.tsx': listScreen('SharedGrid', ''),
      'Customers.tsx': listScreen('SharedGrid', ''),
      'Reports.tsx': listScreen('SharedGrid', ''),
    });

    const usage = await observeUsage(join(dir, 'Orders.tsx'));

    expect(usage?.map((one) => one.component)).toContain('SharedGrid');
    expect(usage?.map((one) => one.component)).not.toContain('*Grid');
    await rm(dir, { recursive: true, force: true });
  });

  it('counts a test id as written without ever claiming its value is a convention', async () => {
    // The value of a test id is an artefact of the page; that one is written at
    // all is a convention. Filtering it where values are decided is right, and
    // filtering it before the presence count is what made the one thing a
    // family agreed about invisible.
    const dir = await screens({
      'Orders.tsx': listScreen('Grid', 'data-testid="orders"'),
      'Invoices.tsx': listScreen('Grid', 'data-testid="invoices"'),
      'Customers.tsx': listScreen('Grid', 'data-testid="customers"'),
      'Reports.tsx': listScreen('Grid', 'data-testid="reports"'),
    });

    const usage = await observeUsage(join(dir, 'Orders.tsx'));

    const shell = usage?.find((one) => one.component === 'PageShell');
    expect(shell?.written.map((one) => one.name)).toContain('data-testid');
    expect(shell?.props.map((one) => one.name)).not.toContain('data-testid');
    await rm(dir, { recursive: true, force: true });
  });
});

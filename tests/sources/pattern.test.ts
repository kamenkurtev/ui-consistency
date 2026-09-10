import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { patternOf } from '../../src/sources/pattern.js';

let root: string;

const screen = async (path: string, body: string): Promise<string> => {
  const full = join(root, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, body, 'utf8');
  return full;
};

const page = (holder: string, children: string[]): string =>
  `export const P = () => (\n  <${holder}>\n${children
    .map((child) => `    <${child} />`)
    .join('\n')}\n  </${holder}>\n);\n`;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-pattern-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('the skeleton a family of screens shares', () => {
  it('is the holder and the region order most of them agree on', async () => {
    // Three screens built one way and one built another. The pattern is what
    // repeats; the odd one out is not a vote against it.
    const list = await screen('pages/List/List.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Detail/Detail.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Settings/Settings.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Odd/Odd.tsx', page('Shell', ['Sidebar', 'Content']));

    const pattern = await patternOf(list);

    expect(pattern?.skeleton).toEqual({ holder: 'PageLayout', regions: ['header', 'content'] });
  });
});

describe('every level is measured over the same family', () => {
  // Measured on a constructed case: `family` reported one folder's screens
  // while `configuration` was computed entirely from three others — disjoint
  // sets, because the two selections used different quorums. The field exists
  // so a person can check what they are approving.
  // Different holders, because that is what "a kind of screen" means now: what
  // a screen sits in is structural, where "is this a list or a form" needed a
  // list of one library's component names.
  const listScreen = `export const P = () => (\n  <ListLayout>\n    <PageHeader />\n    <Content>\n      <Table dense><TableRow /></Table>\n    </Content>\n  </ListLayout>\n);\n`;
  const formScreen = `export const P = () => (\n  <FormLayout>\n    <PageHeader />\n    <Content>\n      <TextField /><Select />\n      <SaveButton variant="primary" />\n    </Content>\n  </FormLayout>\n);\n`;

  it('does not let the reference cast the deciding vote on a prop', async () => {
    // The observer's own count means "how many sibling screens", so handing it a
    // family that contains the page being asked about both inflates the number
    // and lets that page settle the majority.
    const grid = (props: string): string =>
      `export const P = () => (\n  <PageLayout>\n    <PageHeader />\n    <Content>\n      <DataGrid ${props}><Row /></DataGrid>\n    </Content>\n  </PageLayout>\n);\n`;

    const list = await screen('pages/Orders/Orders.tsx', grid('dense'));
    await screen('pages/Invoices/Invoices.tsx', grid('dense'));
    await screen('pages/Customers/Customers.tsx', grid('dense'));
    await screen('pages/Audit/Audit.tsx', grid(''));
    await screen('pages/Report/Report.tsx', grid(''));

    const pattern = await patternOf(list);
    const configured = pattern?.configuration.find((entry) => entry.component === 'DataGrid');

    // Two of the four other screens write it: not an agreement.
    expect(configured?.props.map((prop) => prop.name) ?? []).not.toContain('dense');
  });

  it('does not configure a list screen from the forms beside it', async () => {
    const list = await screen('pages/Orders/Orders.tsx', listScreen);
    await screen('pages/Invoices/Invoices.tsx', listScreen);
    await screen('pages/Customers/Customers.tsx', listScreen);
    await screen('pages/NewOrder/NewOrder.tsx', formScreen);
    await screen('pages/Profile/Profile.tsx', formScreen);
    await screen('pages/Signup/Signup.tsx', formScreen);

    const pattern = await patternOf(list);

    expect(pattern?.configuration.map((entry) => entry.component)).not.toContain('SaveButton');
  });
});

describe('what the reference alone has', () => {
  it('is what no other screen renders, not merely what a majority lacks', async () => {
    // "Must not be copied" is a strong claim. A component half the family also
    // renders is not settled either way, and reporting it here would tell
    // somebody to avoid what the project plainly uses.
    const list = await screen(
      'pages/List/List.tsx',
      page('PageLayout', ['PageHeader', 'Content', 'ExportButton', 'PrintPreview']),
    );
    await screen(
      'pages/Detail/Detail.tsx',
      page('PageLayout', ['PageHeader', 'Content', 'ExportButton']),
    );
    await screen('pages/Settings/Settings.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Report/Report.tsx', page('PageLayout', ['PageHeader', 'Content']));

    const pattern = await patternOf(list);

    expect(pattern?.particulars.components).toEqual(['PrintPreview']);
  });
});

describe('when the reference itself cannot be read', () => {
  it('says nothing rather than describing the screens around it', async () => {
    // Otherwise the answer is confident about a file that was never read: a
    // full skeleton, empty particulars that read as "nothing here is unique",
    // and a family that does not include the page the question was about.
    const unreadable = await screen('pages/List/List.tsx', 'export const notAScreen = 42;\n');
    await screen('pages/Detail/Detail.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Settings/Settings.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Report/Report.tsx', page('PageLayout', ['PageHeader', 'Content']));

    expect(await patternOf(unreadable)).toBeNull();
  });
});

describe('the skeleton when the family does not agree', () => {
  it('reports no skeleton rather than one screen’s order', async () => {
    // `commonest` with no threshold returns whatever came first, and the map's
    // insertion order starts with the reference — so on a tie the page voted on
    // itself, which is the one thing every other level here refuses to allow.
    const list = await screen('pages/List/List.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Detail/Detail.tsx', page('PageLayout', ['Content', 'PageHeader']));
    await screen('pages/Settings/Settings.tsx', page('PageLayout', ['Breadcrumbs', 'Content']));
    await screen('pages/Report/Report.tsx', page('PageLayout', ['Sidebar', 'Content']));
    await screen('pages/Audit/Audit.tsx', page('PageLayout', ['Content']));

    const pattern = await patternOf(list);

    expect(pattern?.skeleton).toBeNull();
  });
});

describe('a project written in a template dialect', () => {
  it('is read, rather than counted and silently dropped', async () => {
    // `.html`, `.vue` and `.svelte` are admitted as screens, so they must be
    // parsed as templates. Parsing them as JSX fails, and the file still counts
    // towards the family — so a repository full of screens can be told there
    // are too few of them to compare.
    const holder = (name: string): string =>
      `<app-page><app-page-header></app-page-header><app-content>${name}</app-content></app-page>`;

    const list = await screen('pages/list/list.component.html', holder('list'));
    await screen('pages/detail/detail.component.html', holder('detail'));
    await screen('pages/settings/settings.component.html', holder('settings'));

    const pattern = await patternOf(list);

    expect(pattern?.skeleton).toEqual({ holder: 'app-page', regions: ['header', 'content'] });
  });
});

describe('which screens count as the family', () => {
  it('is screens of the same kind, not whichever screens sit nearby', async () => {
    // Measured on a real app: a list screen was intersected with the forms
    // beside it, so the invariant collapsed to what every screen has, and
    // everything list-shaped was reported as that page's own particular. A kind
    // is the holder a screen sits in — structural, and free of any vocabulary.
    const table = (extra: string): string =>
      `export const P = () => (\n  <ListLayout>\n    <PageHeader />\n    <Content>\n      <Table><TableRow /></Table>\n      ${extra}\n    </Content>\n  </ListLayout>\n);\n`;
    const form = `export const P = () => (\n  <FormLayout>\n    <PageHeader />\n    <Content>\n      <TextField /><TextField /><Select />\n    </Content>\n  </FormLayout>\n);\n`;

    const list = await screen('pages/Orders/Orders.tsx', table('<Pagination />'));
    await screen('pages/Invoices/Invoices.tsx', table('<Pagination />'));
    await screen('pages/Customers/Customers.tsx', table('<Pagination />'));
    await screen('pages/NewOrder/NewOrder.tsx', form);
    await screen('pages/Profile/Profile.tsx', form);
    await screen('pages/Settings/Settings.tsx', form);

    const pattern = await patternOf(list);

    expect(pattern?.kind).toBe('ListLayout');
    expect(pattern?.family.every((path) => !path.includes('Profile'))).toBe(true);
    // `Pagination` is what every list screen has, so it is the pattern rather
    // than something this page happens to do.
    expect(pattern?.particulars.components).not.toContain('Pagination');
  });
});

describe('what it says about itself', () => {
  it('names the screens it read, so the answer can be checked', async () => {
    // Nobody can approve a contract without seeing what it was derived from.
    const list = await screen('pages/List/List.tsx', page('PageLayout', ['PageHeader', 'Content']));
    const detail = await screen(
      'pages/Detail/Detail.tsx',
      page('PageLayout', ['PageHeader', 'Content']),
    );
    await screen('pages/Settings/Settings.tsx', page('PageLayout', ['PageHeader', 'Content']));

    const pattern = await patternOf(list);

    expect(pattern?.family).toContain(list);
    expect(pattern?.family).toContain(detail);
    expect(pattern?.family).toHaveLength(3);
  });
});

describe('the wiring a family of screens shares', () => {
  const wired = (hooks: string[]): string =>
    `${hooks.map((hook) => `const x${hook} = ${hook}();`).join('\n')}\n${page('PageLayout', [
      'PageHeader',
      'Content',
    ])}`;

  it('names the hooks most of the family calls, and not the one-off', async () => {
    const list = await screen('pages/List/List.tsx', wired(['useParams', 'useOrders']));
    await screen('pages/Detail/Detail.tsx', wired(['useParams', 'useOrders']));
    await screen('pages/Settings/Settings.tsx', wired(['useParams', 'useOrders']));
    await screen('pages/Odd/Odd.tsx', wired(['useParams', 'useSomethingLocal']));

    const pattern = await patternOf(list);

    expect(pattern?.wiring).toContain('useParams');
    expect(pattern?.wiring).not.toContain('useSomethingLocal');
  });
});

describe('what belongs to the reference page alone', () => {
  it('names the components only it renders, so they are not copied', async () => {
    // A reference page is an example, not a specification. Its shape holds the
    // pattern *and* its own particulars, and copying it wholesale is what
    // produces a page that is almost right.
    const list = await screen(
      'pages/List/List.tsx',
      page('PageLayout', ['PageHeader', 'Content', 'ExportButton']),
    );
    await screen('pages/Detail/Detail.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Settings/Settings.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Odd/Odd.tsx', page('PageLayout', ['PageHeader', 'Content']));

    const pattern = await patternOf(list);

    expect(pattern?.particulars.components).toEqual(['ExportButton']);
  });

  it('names a role only it fills', async () => {
    const list = await screen(
      'pages/List/List.tsx',
      page('PageLayout', ['PageHeader', 'Content', 'PageFooter']),
    );
    await screen('pages/Detail/Detail.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Settings/Settings.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Odd/Odd.tsx', page('PageLayout', ['PageHeader', 'Content']));

    const pattern = await patternOf(list);

    expect(pattern?.particulars.roles).toEqual(['footer']);
  });
});

describe('when there is no family to read', () => {
  it('says so rather than describing one page as a pattern', async () => {
    // Fewer than three screens of a kind is not a pattern. The honest answer is
    // "nothing found — you decide, and this becomes the first of its kind".
    const only = await screen('pages/Only/Only.tsx', page('PageLayout', ['PageHeader', 'Content']));

    expect(await patternOf(only)).toBeNull();
  });
});

describe('the configuration a family of screens shares', () => {
  const withGrid = (grid: string): string =>
    `export const P = () => (\n  <PageLayout>\n    <PageHeader />\n    <Content>\n      ${grid}\n    </Content>\n  </PageLayout>\n);\n`;

  it('reports a prop the whole family writes the same way', async () => {
    const list = await screen('pages/List/List.tsx', withGrid('<DataGrid dense pageSize="25" />'));
    await screen('pages/Detail/Detail.tsx', withGrid('<DataGrid dense pageSize="25" />'));
    await screen('pages/Settings/Settings.tsx', withGrid('<DataGrid dense pageSize="25" />'));
    await screen('pages/Odd/Odd.tsx', withGrid('<DataGrid dense pageSize="25" />'));

    const pattern = await patternOf(list);
    const grid = pattern?.configuration.find((entry) => entry.component === 'DataGrid');

    expect(grid?.props.map((prop) => prop.name).sort()).toEqual(['dense', 'pageSize']);
  });

  it('says nothing about a prop the family gives different values', async () => {
    // The same prop with three different values is what a screen decides for
    // itself. Reporting it as a convention is how advice turns into noise.
    const list = await screen('pages/List/List.tsx', withGrid('<DataGrid dense pageSize="25" />'));
    await screen('pages/Detail/Detail.tsx', withGrid('<DataGrid dense pageSize="10" />'));
    await screen('pages/Settings/Settings.tsx', withGrid('<DataGrid dense pageSize="50" />'));
    await screen('pages/Odd/Odd.tsx', withGrid('<DataGrid dense pageSize="5" />'));

    const pattern = await patternOf(list);
    const grid = pattern?.configuration.find((entry) => entry.component === 'DataGrid');

    expect(grid?.props.map((prop) => prop.name)).toEqual(['dense']);
  });
});

describe('the vocabulary a family of screens shares', () => {
  it('names the component that fills each role, where they agree', async () => {
    const list = await screen('pages/List/List.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Detail/Detail.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Settings/Settings.tsx', page('PageLayout', ['PageHeader', 'Content']));
    await screen('pages/Odd/Odd.tsx', page('PageLayout', ['TitleBar', 'Content']));

    const pattern = await patternOf(list);

    expect(pattern?.vocabulary).toEqual([
      { role: 'header', component: 'PageHeader' },
      { role: 'content', component: 'Content' },
    ]);
  });

  it('says nothing about a role the family fills differently every time', async () => {
    // Four screens, four different headers, is not a convention about headers.
    // Reporting the commonest would enforce whichever was written first.
    const list = await screen('pages/List/List.tsx', page('PageLayout', ['AlphaBar', 'Content']));
    await screen('pages/Detail/Detail.tsx', page('PageLayout', ['BetaBar', 'Content']));
    await screen('pages/Settings/Settings.tsx', page('PageLayout', ['GammaBar', 'Content']));
    await screen('pages/Odd/Odd.tsx', page('PageLayout', ['DeltaBar', 'Content']));

    const pattern = await patternOf(list);

    expect(pattern?.vocabulary.map((entry) => entry.role)).toEqual(['content']);
  });
});

describe('the raw elements a family never renders', () => {
  it('reports what the screens avoid, without naming a library', async () => {
    // `<button>` is universal — it is in the HTML specification. `Button` is
    // one library's name for what replaces it, and a list of such names is what
    // made the checks silent on every project that names things differently.
    const withButton = `export const P = () => (\n  <PageLayout>\n    <PageHeader />\n    <Content><DsPushButton /></Content>\n  </PageLayout>\n);\n`;

    const list = await screen('pages/List/List.tsx', withButton);
    await screen('pages/Detail/Detail.tsx', withButton);
    await screen('pages/Settings/Settings.tsx', withButton);

    const pattern = await patternOf(list);
    expect(pattern?.avoids).toContain('button');
  });

  it('says nothing about an element the family does render', async () => {
    const withRaw = `export const P = () => (\n  <PageLayout>\n    <PageHeader />\n    <Content><button type="button">x</button></Content>\n  </PageLayout>\n);\n`;

    const list = await screen('pages/List/List.tsx', withRaw);
    await screen('pages/Detail/Detail.tsx', withRaw);
    await screen('pages/Settings/Settings.tsx', withRaw);

    expect((await patternOf(list))?.avoids).not.toContain('button');
  });
});

describe('which screens count as one kind, without a word list', () => {
  it('groups by the holder they share rather than by a component name', async () => {
    // The archetype reading was `Table|DataGrid|TextField|Select…` — a list of
    // one library's names, which came back `unknown` on every real repository
    // tested. What a screen sits in is structural and needs no vocabulary.
    const inShell = `export const P = () => (\n  <AppShell>\n    <PageHeader />\n    <Content><Widget /></Content>\n  </AppShell>\n);\n`;
    const inLayout = `export const P = () => (\n  <PageLayout>\n    <PageHeader />\n    <Content><Widget /></Content>\n  </PageLayout>\n);\n`;

    const one = await screen('pages/One/One.tsx', inShell);
    await screen('pages/Two/Two.tsx', inShell);
    await screen('pages/Three/Three.tsx', inShell);
    await screen('pages/Four/Four.tsx', inLayout);
    await screen('pages/Five/Five.tsx', inLayout);

    const pattern = await patternOf(one);
    expect(pattern?.skeleton?.holder).toBe('AppShell');
    expect(pattern?.family.every((path) => !path.includes('Four'))).toBe(true);
  });
});

describe('a project that builds screens out of raw markup', () => {
  it('says so, instead of returning an empty answer that reads as "all fine"', async () => {
    // Measured on the Angular and Vue RealWorld apps and on `vue-element-admin`:
    // `<div class="profile-page"><div class="user-info">`. There is no component
    // to name for a role because the project has none — which is a different
    // statement from "these screens agree on nothing", and the two must not
    // look alike.
    const raw = `export const P = () => (\n  <div className="profile-page">\n    <div className="user-info"><h1>x</h1></div>\n  </div>\n);\n`;

    const one = await screen('pages/One/One.tsx', raw);
    await screen('pages/Two/Two.tsx', raw);
    await screen('pages/Three/Three.tsx', raw);

    expect((await patternOf(one))?.built).toBe('markup');
  });

  it('says a project with layout components is built from them', async () => {
    const composed = `export const P = () => (\n  <PageLayout>\n    <PageHeader />\n    <Content />\n  </PageLayout>\n);\n`;

    const one = await screen('pages/One/One.tsx', composed);
    await screen('pages/Two/Two.tsx', composed);
    await screen('pages/Three/Three.tsx', composed);

    expect((await patternOf(one))?.built).toBe('components');
  });
});

/**
 * The family, from the project's own statements rather than from where files
 * sit (#225).
 *
 * The proof case in the issue: five real sibling pages copied flat into an
 * empty project produce a holder and a prop contract, while the same pages in
 * their own folders produce two empty arrays. Extraction, holder agreement and
 * prop agreement all worked — they were starved of input.
 */
describe('who a screen is measured against', () => {
  const withParts = async (): Promise<string> => {
    const target = await screen(
      'src/pages/OrdersPage/OrdersPage.tsx',
      page('PageLayout', ['OrdersGrid']),
    );
    // The page's own parts, all of which pass for screen files.
    await screen('src/pages/OrdersPage/OrdersGrid.tsx', 'export const G = () => <div />;\n');
    await screen('src/pages/OrdersPage/OrdersDialog.tsx', 'export const D = () => <div />;\n');
    await screen('src/pages/OrdersPage/useOrdersColumns.tsx', 'export const u = () => [];\n');
    for (const name of ['Invoices', 'Customers', 'Reports']) {
      await screen(`src/pages/${name}Page/${name}Page.tsx`, page('PageLayout', [`${name}Grid`]));
    }
    return target;
  };

  it('is the sibling pages, not the page taken apart', async () => {
    const found = await patternOf(await withParts());

    expect(found).not.toBeNull();
    expect(found!.skeleton?.holder).toBe('PageLayout');
    expect(found!.family.map((one) => one.replace(/^.*[/\\]/, ''))).toEqual(
      expect.arrayContaining(['OrdersPage.tsx', 'InvoicesPage.tsx', 'CustomersPage.tsx']),
    );
    expect(found!.family.some((one) => one.endsWith('OrdersGrid.tsx'))).toBe(false);
  });

  it('takes the family the route table names, wherever those screens live', async () => {
    // The router is only consulted for a file inside a project, so that the
    // search cannot climb out into whatever sits beside it on disk.
    await screen('package.json', '{"name":"fam"}\n');
    const target = await screen('libs/a/src/OrdersPage.tsx', page('PageLayout', ['OrdersGrid']));
    await screen('libs/b/src/InvoicesPage.tsx', page('PageLayout', ['InvoicesGrid']));
    await screen('libs/c/src/CustomersPage.tsx', page('PageLayout', ['CustomersGrid']));
    await screen(
      'libs/shell/AppRoutes.tsx',
      [
        "import { OrdersPage } from '../a/src/OrdersPage';",
        "import { InvoicesPage } from '../b/src/InvoicesPage';",
        "import { CustomersPage } from '../c/src/CustomersPage';",
        'export const routes = [',
        "  { path: 'orders', element: <OrdersPage /> },",
        "  { path: 'invoices', element: <InvoicesPage /> },",
        "  { path: 'customers', element: <CustomersPage /> },",
        '];',
      ].join('\n'),
    );

    const found = await patternOf(target);
    expect(found).not.toBeNull();
    expect(found!.skeleton?.holder).toBe('PageLayout');
    expect(found!.family).toHaveLength(3);
  });
});

/**
 * A holder plus one child has no named regions, and two empty arrays are not
 * an answer (#228).
 *
 * `vocabulary` — what fills a *region* — is structurally empty on the commonest
 * real page shape, because the project puts the header, the title and the
 * breadcrumbs in the holder's **props** rather than in sibling region
 * components. That is not an unusual design; it is the normal one for a layout
 * component that takes a title. Reported as `vocabulary: []`, `regions: []` it
 * reads as *no convention here*.
 */
describe('where this kind of screen keeps its chrome', () => {
  const holderPage = (name: string, body = `${name}Grid`): string =>
    `export const ${name}Page = () => (\n  <PageLayout title="${name}" breadcrumbs={trail}>\n    <${body} />\n  </PageLayout>\n);\n`;

  it('says the chrome is in the holder’s props, rather than reporting a blank', async () => {
    for (const name of ['Orders', 'Invoices', 'Customers', 'Reports']) {
      await screen(`src/pages/${name}Page.tsx`, holderPage(name));
    }

    const found = await patternOf(join(root, 'src/pages/OrdersPage.tsx'));
    expect(found!.skeleton?.holder).toBe('PageLayout');
    expect(found!.skeleton?.regions).toEqual([]);
    expect(found!.regionsIn).toBe('holder');
  });

  it('names what the holder holds, which is a convention needing no vocabulary', async () => {
    for (const name of ['Orders', 'Invoices', 'Customers', 'Reports']) {
      await screen(`src/pages/${name}Page.tsx`, holderPage(name));
    }

    const found = await patternOf(join(root, 'src/pages/OrdersPage.tsx'));
    // Every screen holds exactly one component, and every one of them is a
    // `*Grid` — derived from the four names, not from a list of them.
    expect(found!.body).toEqual({ children: 1, component: null, suffix: 'Grid' });
  });

  it('names the component itself where every screen holds the same one', async () => {
    for (const name of ['Orders', 'Invoices', 'Customers', 'Reports']) {
      await screen(`src/pages/${name}Page.tsx`, holderPage(name, 'ResultsTable'));
    }

    const found = await patternOf(join(root, 'src/pages/OrdersPage.tsx'));
    expect(found!.body?.component).toBe('ResultsTable');
  });

  it('says the chrome is in region components where it is', async () => {
    for (const name of ['Orders', 'Invoices', 'Customers', 'Reports']) {
      await screen(
        `src/pages/${name}Page.tsx`,
        `export const ${name}Page = () => (\n  <PageLayout>\n    <PageHeader />\n    <Content><${name}Grid /></Content>\n  </PageLayout>\n);\n`,
      );
    }

    const found = await patternOf(join(root, 'src/pages/OrdersPage.tsx'));
    expect(found!.skeleton!.regions.length).toBeGreaterThan(0);
    expect(found!.regionsIn).toBe('components');
  });
});

/**
 * An Angular screen is two files, and they are one screen (#229).
 *
 * On a real Angular monorepo — 179 components, 176 templates, Angular 21, Nx —
 * `uic pattern` answered *"fewer than three screens of this kind to compare"*
 * for every `.component.ts`, and `vocabulary: []` for every `.component.html`.
 * The `.ts` files hold no markup to agree about and the `.html` files hold no
 * identity beyond their own tags.
 */
describe('a screen written as a pair of files', () => {
  const pair = async (name: string, body: string): Promise<{ ts: string; html: string }> => ({
    ts: await screen(
      `src/app/${name}/${name}.component.ts`,
      [
        "import { Component } from '@angular/core';",
        `@Component({ selector: 'app-${name}', templateUrl: './${name}.component.html' })`,
        `export class ${name[0]!.toUpperCase()}${name.slice(1)}Component {}`,
      ].join('\n'),
    ),
    html: await screen(`src/app/${name}/${name}.component.html`, body),
  });

  const built = async (): Promise<{ ts: string; html: string }> => {
    const first = await pair('orders', '<mat-card><app-orders-grid></app-orders-grid></mat-card>\n');
    for (const name of ['invoices', 'customers', 'reports']) {
      await pair(name, `<mat-card><app-${name}-grid></app-${name}-grid></mat-card>\n`);
    }
    return first;
  };

  it('reads the markup of the class it was handed', async () => {
    const { ts } = await built();

    const found = await patternOf(ts);
    expect(found).not.toBeNull();
    expect(found!.skeleton?.holder).toBe('mat-card');
  });

  it('answers the same for either half', async () => {
    const { ts, html } = await built();

    const fromClass = await patternOf(ts);
    const fromTemplate = await patternOf(html);
    expect(fromTemplate!.skeleton).toEqual(fromClass!.skeleton);
    expect(fromTemplate!.family).toEqual(fromClass!.family);
  });

  it('counts a pair once, not twice', async () => {
    const { ts } = await built();

    const found = await patternOf(ts);
    expect(found!.family).toHaveLength(4);
    expect(found!.family.every((one) => one.endsWith('.component.ts'))).toBe(true);
  });

  it('reads a component that writes its markup inline', async () => {
    for (const name of ['orders', 'invoices', 'customers', 'reports']) {
      await screen(
        `src/app/${name}/${name}.component.ts`,
        [
          "import { Component } from '@angular/core';",
          '@Component({',
          `  selector: 'app-${name}',`,
          `  template: \`<mat-card><app-${name}-grid></app-${name}-grid></mat-card>\`,`,
          '})',
          `export class ${name[0]!.toUpperCase()}${name.slice(1)}Component {}`,
        ].join('\n'),
      );
    }

    const found = await patternOf(join(root, 'src/app/orders/orders.component.ts'));
    expect(found!.skeleton?.holder).toBe('mat-card');
  });
});

/**
 * What the holder holds, in a dialect whose nodes arrive flat (#249).
 *
 * `body` was left empty for every template screen with a comment saying a
 * template's nodes are flat and which of them the holder holds directly is not
 * readable — which stopped being true once each node carried its depth. The
 * effect was that on Angular `regionsIn: 'holder'` arrived without the field
 * that says what replaces the region comparison, so the reader was told what is
 * missing and not what is there.
 */
describe('what the holder holds, read from a template', () => {
  const ng = async (name: string, body: string): Promise<string> => {
    const cap = `${name[0]!.toUpperCase()}${name.slice(1)}`;
    await screen(`src/app/${name}/${name}.component.html`, body);
    return screen(
      `src/app/${name}/${name}.component.ts`,
      [
        "import { Component } from '@angular/core';",
        `@Component({ selector: 'app-${name}', templateUrl: './${name}.component.html' })`,
        `export class ${cap}Component {}`,
      ].join('\n'),
    );
  };

  it('names the trailing word every screen’s body component shares', async () => {
    let first = '';
    for (const name of ['orders', 'invoices', 'customers', 'reports']) {
      const ts = await ng(
        name,
        `<mat-card appearance="outlined"><app-${name}-grid></app-${name}-grid></mat-card>\n`,
      );
      if (first === '') first = ts;
    }

    const found = await patternOf(first);
    expect(found!.regionsIn).toBe('holder');
    expect(found!.body).toEqual({ children: 1, component: null, suffix: 'grid' });
  });

  it('does not count what sits deeper than the holder’s own children', async () => {
    let first = '';
    for (const name of ['orders', 'invoices', 'customers', 'reports']) {
      const ts = await ng(
        name,
        `<mat-card appearance="outlined"><app-${name}-grid><app-cell></app-cell></app-${name}-grid></mat-card>\n`,
      );
      if (first === '') first = ts;
    }

    const found = await patternOf(first);
    expect(found!.body?.children).toBe(1);
  });
});

/**
 * A screen a table registers but gives no path keeps its route siblings (#254).
 *
 * The family comes from **which table registers this screen** (#225), not from
 * the path — so the path and the registration are two facts and only one of
 * them is ever missing. Refusing the whole placement for a pathless entry would
 * push the screen onto its own folder, which is the failure #225 exists to
 * prevent: measured on a real area, one screen's route failing to resolve made
 * its family its own four panels, the derived holder became the panels', and
 * all nine screens of the area were reported as deviating from a contract none
 * of them matches.
 */
describe('a family assembled through a pathless route', () => {
  it('is the screens the same table registers, not the screen’s own folder', async () => {
    await screen('package.json', '{"name":"idx"}\n');
    await screen(
      'src/Routes.tsx',
      [
        "import { OrdersList } from './pages/Orders/OrdersList';",
        "import { InvoicesList } from './pages/Invoices/InvoicesList';",
        "import { ReportsList } from './pages/Reports/ReportsList';",
        'export const routes = [',
        '  {',
        '    element: <Guard />,',
        '    children: [',
        '      { index: true, element: <OrdersList /> },',
        "      { path: 'invoices', element: <InvoicesList /> },",
        "      { path: 'reports', element: <ReportsList /> },",
        '    ],',
        '  },',
        '];',
      ].join('\n'),
    );
    for (const name of ['Orders', 'Invoices', 'Reports']) {
      await screen(`src/pages/${name}/${name}List.tsx`, page('PageLayout', [`${name}Grid`]));
    }
    // The parts that used to become the family, all in the target's own folder.
    await screen('src/pages/Orders/OrdersPanel.tsx', page('Box', ['Row']));
    await screen('src/pages/Orders/OrdersHeader.tsx', page('Box', ['Txt']));
    await screen('src/pages/Orders/OrdersRow.tsx', page('Box', ['Cell']));

    const found = await patternOf(join(root, 'src/pages/Orders/OrdersList.tsx'));
    expect(found!.skeleton?.holder).toBe('PageLayout');
    expect(found!.family.some((one) => one.endsWith('OrdersPanel.tsx'))).toBe(false);
  });
});

/**
 * Three guards, each turning a wrong derivation into a miss (#255).
 *
 * Since #231 a derived contract reaches the agent automatically on the edit
 * being made, so a wrong family no longer produces an empty answer somebody
 * chose to look at: it produces **invented findings, injected**. The
 * repository's invariant is that the failure direction is always a miss.
 */
describe('what a family may not be', () => {
  const built = async (): Promise<string> => {
    await screen('package.json', '{"name":"fam"}\n');
    const target = await screen(
      'src/pages/Orders/OrdersPage.tsx',
      [
        "import { OrdersPanel } from './OrdersPanel';",
        "import { OrdersHeader } from './OrdersHeader';",
        'export const OrdersPage = () => (',
        '  <PageLayout title="x">',
        '    <OrdersHeader />',
        '    <OrdersPanel />',
        '  </PageLayout>',
        ');',
      ].join('\n'),
    );
    await screen('src/pages/Orders/OrdersPanel.tsx', page('Box', ['Row']));
    await screen('src/pages/Orders/OrdersHeader.tsx', page('Box', ['Txt']));
    await screen('src/pages/Orders/OrdersRow.tsx', page('Box', ['Cell']));
    return target;
  };

  it('is not the parts the screen itself imports', async () => {
    const found = await patternOf(await built());

    // Two of the three are imported by the page, so the family falls below
    // quorum and the honest answer comes back. `Box` was the answer before.
    expect(found).toBeNull();
  });

  it('is not a folder guess that contradicts the screen it was derived for', async () => {
    // The same shape with nothing imported: the family reaches quorum, and the
    // holder it agrees on is one the reference does not sit in. A contract that
    // contradicts its own reference is not an answer about that reference.
    await screen('package.json', '{"name":"fam"}\n');
    const target = await screen('src/pages/Orders/OrdersPage.tsx', page('PageLayout', ['Body']));
    for (const name of ['Panel', 'Header', 'Row']) {
      await screen(`src/pages/Orders/Orders${name}.tsx`, page('Box', ['Cell']));
    }

    expect(await patternOf(target)).toBeNull();
  });

  it('still reports a reference that deviates from the family the project states', async () => {
    // The guard above must not fire here. Where the family is what the project
    // *states*, a reference that differs from its siblings is the correct and
    // valuable answer — it is the thing this tool exists to say.
    await screen('package.json', '{"name":"routed"}\n');
    await screen(
      'src/Routes.tsx',
      [
        "import { OrdersPage } from './pages/OrdersPage';",
        "import { InvoicesPage } from './pages/InvoicesPage';",
        "import { ReportsPage } from './pages/ReportsPage';",
        "import { CustomersPage } from './pages/CustomersPage';",
        'export const routes = [',
        "  { path: 'orders', element: <OrdersPage /> },",
        "  { path: 'invoices', element: <InvoicesPage /> },",
        "  { path: 'reports', element: <ReportsPage /> },",
        "  { path: 'customers', element: <CustomersPage /> },",
        '];',
      ].join('\n'),
    );
    const target = await screen('src/pages/OrdersPage.tsx', page('Box', ['OrdersGrid']));
    for (const name of ['Invoices', 'Reports', 'Customers']) {
      await screen(`src/pages/${name}Page.tsx`, page('PageLayout', [`${name}Grid`]));
    }

    const found = await patternOf(target);
    expect(found).not.toBeNull();
    expect(found!.from).toBe('routes');
    expect(found!.skeleton?.holder).toBe('PageLayout');
  });
});

describe('a kind that no route table registers', () => {
  it('refuses a folder that holds a mixture rather than assembling a family out of it', async () => {
    // Measured: a dialog's family was 24 files — an amount cell, a currency
    // field, an attachments panel, a history tab. Where the only evidence is
    // that files sit near each other, screens of different kinds in one answer
    // is a family assembled out of whatever was nearby. Fewer members or none.
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    const target = await screen('src/parts/ConfirmDialog.tsx', page('Dialog', ['DialogButtons']));
    await screen('src/parts/AmountCell.tsx', page('Cell', ['Money']));
    await screen('src/parts/AttachmentsPanel.tsx', page('Panel', ['FileList']));
    await screen('src/parts/HistoryTab.tsx', page('Tab', ['Timeline']));

    expect(await patternOf(target)).toBeNull();
  });

  it('answers for a dialog with three real siblings of its own kind', async () => {
    // "A dialog is a screen: it has a holder, a content region, an action row,
    // and a set of props its siblings all write. There are more of them than
    // there are pages."
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    const target = await screen(
      'src/parts/ConfirmDialog.tsx',
      page('Dialog', ['DialogTitle', 'DialogButtons']),
    );
    for (const name of ['Session', 'Upload']) {
      await screen(`src/parts/${name}Dialog.tsx`, page('Dialog', ['DialogTitle', 'DialogButtons']));
    }

    const derived = await patternOf(target);

    expect(derived?.kind).toBe('Dialog');
    expect(derived?.from).toBe('folder');
    expect(derived?.family).toHaveLength(3);
  });

  it('never lets a hook into a family, however much JSX it returns', async () => {
    // A hook that builds a column definition renders JSX and parses as a screen.
    // `use` followed by a capital is the naming React itself enforces, not a
    // guess about this project's vocabulary.
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    const target = await screen('src/parts/ConfirmDialog.tsx', page('Dialog', ['DialogButtons']));
    for (const name of ['Session', 'Upload']) {
      await screen(`src/parts/${name}Dialog.tsx`, page('Dialog', ['DialogButtons']));
    }
    await screen('src/parts/useGetColumns.tsx', page('Dialog', ['DialogButtons']));

    const derived = await patternOf(target);

    expect(derived?.family.some((one) => one.includes('useGetColumns'))).toBe(false);
  });

  it('takes the family a pattern file names, over anything read off the code', async () => {
    // A route table states which screens are registered beside one another and a
    // folder states nothing at all. A pattern file naming this screen is a
    // person saying *these are one kind*, reviewed in a pull request.
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    await mkdir(join(root, '.ui-consistency/patterns'), { recursive: true });
    const target = await screen('src/parts/ConfirmDialog.tsx', page('Dialog', ['DialogButtons']));
    await screen('src/elsewhere/SessionDialog.tsx', page('Dialog', ['DialogButtons']));
    await screen('src/far/UploadDialog.tsx', page('Dialog', ['DialogButtons']));
    await writeFile(
      join(root, '.ui-consistency/patterns/dialog.md'),
      '---\npattern: dialog\nholder: Dialog\n---\n\n## Where it is used\n\n' +
        '`src/parts/ConfirmDialog.tsx`, `src/elsewhere/SessionDialog.tsx`, `src/far/UploadDialog.tsx`\n',
    );

    const derived = await patternOf(target);

    expect(derived?.from).toBe('pattern');
    // Three folders, which no folder walk and no route table would have joined.
    expect(derived?.family).toHaveLength(3);
  });
});

/**
 * The channel that was missing. `ScreenPattern.kind` states the rule in its own
 * doc comment — *screens of one kind are the ones that sit in the same holder* —
 * and the holder was only ever used to **filter** a family found some other way.
 * Nothing asked which other screens sit in the same holder, so on a project
 * where the route table cannot be read and every screen has a folder to itself,
 * families of 8 and of 7 answered "fewer than three screens of this kind" (#35).
 */
describe('a family found by the holder it sits in', () => {
  /** One folder per screen, no shared parent of their own, drowned in others. */
  const scattered = async (): Promise<string> => {
    await writeFile(join(root, 'package.json'), '{"name":"app"}', 'utf8');
    let first = '';
    for (const name of ['Login', 'Register', 'Forgot', 'Reset', 'Verify']) {
      const path = await screen(
        `src/pages/${name.toLowerCase()}/${name}/${name}.tsx`,
        page('WelcomePage', [`${name}Form`]),
      );
      // Each screen's own parts sit beside it, which is why its folder is not
      // its family.
      await screen(
        `src/pages/${name.toLowerCase()}/${name}/${name}Form.tsx`,
        'export const F = () => <form />;\n',
      );
      if (first === '') first = path;
    }
    for (let i = 0; i < 12; i++) {
      const name = `A${String(i).padStart(2, '0')}`;
      await screen(`src/pages/a${i}/${name}/${name}.tsx`, page('MainLayout', [`${name}Grid`]));
    }
    return first;
  };

  it('finds the screens the folder walk never reaches', async () => {
    const login = await scattered();

    const found = await patternOf(login, { byHolder: true });

    expect(found).not.toBeNull();
    expect(found?.kind).toBe('WelcomePage');
    expect(found?.family.length).toBe(5);
    // Provenance is stated, and it is weaker than a route table: what a screen
    // is held by is structural, but nobody wrote it down.
    expect(found?.from).toBe('holder');
  });

  /**
   * Not on the edit path, and the same measurement that kept `uic tree` off it:
   * 376 ms end to end on an 808-screen reproduction against a 37 ms budget.
   */
  it('is not asked for unless the caller asks, which the edit path does not', async () => {
    const login = await scattered();

    expect(await patternOf(login)).toBeNull();
  });

  it('never takes a screen the reference imports', async () => {
    await writeFile(join(root, 'package.json'), '{"name":"app"}', 'utf8');
    const login = await screen(
      'src/pages/login/Login/Login.tsx',
      "import { LoginPanel } from './LoginPanel';\n" + page('WelcomePage', ['LoginPanel']),
    );
    // A panel of the same shape, imported by the page: part of it, not beside it.
    await screen('src/pages/login/Login/LoginPanel.tsx', page('WelcomePage', ['Fields']));
    for (const name of ['Register', 'Forgot']) {
      await screen(
        `src/pages/${name.toLowerCase()}/${name}/${name}.tsx`,
        page('WelcomePage', [`${name}Form`]),
      );
    }

    const found = await patternOf(login, { byHolder: true });

    expect(found?.family).not.toContain(join(root, 'src/pages/login/Login/LoginPanel.tsx'));
  });

  it('says nothing where the holder is a plain element', async () => {
    // Every markup-built screen in a project sits in a `<div>`, and a family of
    // `div` is the whole project.
    await writeFile(join(root, 'package.json'), '{"name":"app"}', 'utf8');
    const first = await screen('src/pages/one/One/One.tsx', page('div', ['Thing']));
    for (const name of ['Two', 'Three', 'Four']) {
      await screen(`src/pages/${name.toLowerCase()}/${name}/${name}.tsx`, page('div', ['Thing']));
    }

    const found = await patternOf(first, { byHolder: true });

    expect(found?.from).not.toBe('holder');
  });
});

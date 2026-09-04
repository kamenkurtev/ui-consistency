import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { declaredSiblings, placementOf } from '../../src/sources/routes.js';

let root: string;

const file = async (path: string, body = ''): Promise<string> => {
  const full = join(root, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, body, 'utf8');
  return full;
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-routes-'));
  await writeFile(join(root, 'package.json'), '{"name":"app"}', 'utf8');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('where a screen sits in a file-routed project', () => {
  it('reads the path off the directories, ignoring route groups', async () => {
    const page = await file('app/(dashboard)/dashboard/settings/page.tsx', 'export default () => null;\n');

    const placed = await placementOf(page, root);
    expect(placed.style).toBe('file');
    expect(placed.path).toBe('/dashboard/settings');
  });

  it('gives the trail the route implies, which is where a breadcrumb comes from', async () => {
    // Got wrong nearly every time, for a structural reason: the trail encodes
    // the navigation hierarchy, and that is in the router rather than in the
    // file being edited.
    const page = await file('app/orders/[id]/edit/page.tsx', 'export default () => null;\n');

    expect((await placementOf(page, root)).trail).toEqual(['orders', '[id]', 'edit']);
  });

  it('reads the SvelteKit spelling too', async () => {
    const page = await file('src/routes/blog/+page.svelte', '<div />\n');

    const placed = await placementOf(page, root);
    expect(placed.style).toBe('file');
    expect(placed.path).toBe('/blog');
  });
});

describe('where a screen sits in a project that declares its routes', () => {
  it('finds the declaration and quotes the path it registers', async () => {
    await file('src/pages/Settings.tsx', 'export const Settings = () => null;\n');
    await file(
      'src/app.routes.ts',
      [
        "import { Settings } from './pages/Settings';",
        'export const routes = [',
        "  { path: 'settings', component: Settings },",
        '];',
      ].join('\n'),
    );

    const placed = await placementOf(join(root, 'src/pages/Settings.tsx'), root);
    expect(placed.style).toBe('declared');
    expect(placed.path).toBe('/settings');
    expect(placed.declaredIn?.file).toContain('app.routes.ts');
  });

  it('finds a route written as markup', async () => {
    await file('src/components/Login.js', 'export default function Login() { return null; }\n');
    await file(
      'src/components/App.js',
      ['import Login from "./Login";', 'const App = () => (<Route path="/login" component={Login} />);'].join('\n'),
    );

    const placed = await placementOf(join(root, 'src/components/Login.js'), root);
    expect(placed.path).toBe('/login');
  });
});

describe('when it cannot tell', () => {
  it('says so rather than guessing a path from the folder', async () => {
    // A component that no router mentions has no place in the navigation, and
    // inventing one from its directory would be a confident wrong answer.
    const orphan = await file('src/widgets/Chart.tsx', 'export const Chart = () => null;\n');

    const placed = await placementOf(orphan, root);
    expect(placed.style).toBeNull();
    expect(placed.path).toBeNull();
    expect(placed.trail).toEqual([]);
  });
});

describe('what it refuses to be fooled by', () => {
  it('does not take a route out of a mock or a fixture', async () => {
    // Measured on `vue-element-admin`: the screen's route was read out of
    // `mock/role/routes.js` and reported as `/redirect/:path*`.
    await file('src/views/dashboard/index.vue', '<template><div /></template>\n');
    await file('mock/role/routes.js', "export const routes = [{ path: '/redirect/:path*', component: 'index' }];\n");
    await file(
      'src/router/index.js',
      "export default [{ path: '/dashboard', component: () => import('@/views/dashboard/index') }];\n",
    );

    const placed = await placementOf(join(root, 'src/views/dashboard/index.vue'), root);
    expect(placed.path).toBe('/dashboard');
    expect(placed.declaredIn?.file).toContain('src/router');
  });

  it('identifies an index file by its folder, since `index` matches everything', async () => {
    await file('src/views/orders/index.vue', '<template><div /></template>\n');
    await file(
      'src/router/index.js',
      "export default [{ path: '/orders', component: () => import('@/views/orders/index') }];\n",
    );

    expect((await placementOf(join(root, 'src/views/orders/index.vue'), root)).path).toBe('/orders');
  });
});

describe('a nested route table', () => {
  it('takes the child entry rather than the parent it sits under', async () => {
    // The real shape in `vue-element-admin`, and the one that first produced
    // `/`: the parent carries `path: '/'` and a `redirect: '/dashboard'`, and
    // the screen's own entry is two lines further down.
    await file('src/views/dashboard/index.vue', '<template><div /></template>\n');
    await file(
      'src/router/index.js',
      [
        'export default [',
        '  {',
        "    path: '/',",
        '    component: Layout,',
        "    redirect: '/dashboard',",
        '    children: [',
        '      {',
        "        path: 'dashboard',",
        "        component: () => import('@/views/dashboard/index'),",
        '      }',
        '    ]',
        '  }',
        '];',
      ].join('\n'),
    );

    expect((await placementOf(join(root, 'src/views/dashboard/index.vue'), root)).path).toBe(
      '/dashboard',
    );
  });
});

describe('a route written as a parent with children', () => {
  it('binds a screen that is only rendered inside the route element', async () => {
    // How react-router v5 and Ionic write it: the line naming the screen has no
    // `component` on it at all, and the path is one line above.
    await file('src/pages/Settings/Settings.tsx', 'export const Settings = () => null;\n');
    await file(
      'src/App.tsx',
      [
        'const App = () => (',
        '  <IonRouterOutlet>',
        '    <Route exact path="/settings">',
        '      {user && <Settings />}',
        '    </Route>',
        '  </IonRouterOutlet>',
        ');',
      ].join('\n'),
    );

    expect((await placementOf(join(root, 'src/pages/Settings/Settings.tsx'), root)).path).toBe(
      '/settings',
    );
  });
});

/**
 * The route table is the one place a project states which screens are siblings,
 * and in a monorepo it was invisible (#224).
 *
 * The walk started at the project root and went four directories down, so
 * `libs/portal-ui/hub/src/lib/HubRoutes.tsx` — five in, which is the ordinary Nx
 * shape — was never read. `uic place` answered "Nothing routes …" for every
 * screen in the repository while the project declared the route in a table two
 * directories from the screen itself.
 */
describe('how far away the route table is allowed to be', () => {
  it('finds a table six directories in, beside the screen it routes', async () => {
    await file(
      'libs/area/pkg/src/lib/Routes.tsx',
      [
        "import { OrdersPage } from './pages/OrdersPage';",
        'export const routes = [',
        "  { path: 'orders', element: <OrdersPage /> },",
        '];',
      ].join('\n'),
    );
    const page = await file(
      'libs/area/pkg/src/lib/pages/OrdersPage.tsx',
      'export const OrdersPage = () => null;\n',
    );

    const placed = await placementOf(page, root);
    expect(placed.style).toBe('declared');
    expect(placed.path).toBe('/orders');
    expect(placed.declaredIn?.file).toContain('Routes.tsx');
  });

  it('prefers the table beside the screen to the one at the root', async () => {
    await file('Routes.tsx', "export const app = [{ path: 'admin', element: <OrdersPage /> }];\n");
    await file(
      'libs/area/pkg/src/lib/Routes.tsx',
      "export const routes = [{ path: 'orders', element: <OrdersPage /> }];\n",
    );
    const page = await file(
      'libs/area/pkg/src/lib/pages/OrdersPage.tsx',
      'export const OrdersPage = () => null;\n',
    );

    const placed = await placementOf(page, root);
    expect(placed.path).toBe('/orders');
    expect(placed.declaredIn?.file).toContain(join('lib', 'Routes.tsx'));
  });
});

describe('how Angular registers a route', () => {
  it('reads a routing module, which is how every module-based Angular app does it', async () => {
    const screen = await file(
      'libs/admin/src/lib/crm/crm.component.ts',
      [
        "import { Component } from '@angular/core';",
        "@Component({ selector: 'app-crm', templateUrl: './crm.component.html' })",
        'export class CrmComponent {}',
      ].join('\n'),
    );
    await file(
      'libs/admin/src/lib/crm/crm-routing.module.ts',
      [
        "import { CrmComponent } from './crm.component';",
        "const routes = [{ path: 'crm', component: CrmComponent }];",
      ].join('\n'),
    );

    const placed = await placementOf(screen, root);
    expect(placed.style).toBe('declared');
    expect(placed.path).toBe('/crm');
    expect(placed.declaredIn?.file).toContain('crm-routing.module.ts');
  });

  it('reads a standalone route file too', async () => {
    const screen = await file(
      'libs/admin/src/lib/crm/crm.component.ts',
      'export class CrmComponent {}\n',
    );
    await file(
      'libs/admin/src/lib/admin.routes.ts',
      "export const adminRoutes = [{ path: 'crm', component: CrmComponent }];\n",
    );

    expect((await placementOf(screen, root)).path).toBe('/crm');
  });
});

describe('what the screen is allowed to be known by', () => {
  it('does not let a lowercase helper the screen exports match a route entry', async () => {
    // A screen file exports more than the screen. One called `routes` or
    // `config` appears on every line of a route table, and matching on it turns
    // a miss into a wrong answer — the one direction that is not allowed.
    const page = await file(
      'src/pages/OrdersPage.tsx',
      ['export const routes = [];', 'export const OrdersPage = () => null;'].join('\n'),
    );
    await file(
      'src/app.routes.ts',
      [
        'export const table = [',
        "  { path: 'wrong', component: routesFallback },",
        "  { path: 'orders', component: OrdersPage },",
        '];',
      ].join('\n'),
    );

    expect((await placementOf(page, root)).path).toBe('/orders');
  });

  it('looks one level into the folders beside the screen, not only above it', async () => {
    const page = await file('src/pages/OrdersPage.tsx', 'export const OrdersPage = () => null;\n');
    await file(
      'src/pages/router/index.ts',
      "export default [{ path: '/orders', component: OrdersPage }];\n",
    );

    expect((await placementOf(page, root)).path).toBe('/orders');
  });
});

/**
 * The route table is the one place a project *states* which screens are
 * siblings (#225). Everything else about a family is inferred from where files
 * happen to sit.
 */
describe('the other screens the same table routes', () => {
  it('names them, resolved through the table’s own imports', async () => {
    await file('libs/a/src/OrdersPage.tsx', 'export const OrdersPage = () => null;\n');
    await file('libs/b/src/InvoicesPage.tsx', 'export const InvoicesPage = () => null;\n');
    await file('libs/c/src/CustomersPage.tsx', 'export const CustomersPage = () => null;\n');
    await file(
      'libs/shell/AppRoutes.tsx',
      [
        "import { OrdersPage } from '../a/src/OrdersPage';",
        "import { InvoicesPage } from '../b/src/InvoicesPage';",
        "import { CustomersPage } from '../c/src/CustomersPage';",
        "import { authGuard } from '../shared/authGuard';",
        'export const routes = [',
        "  { path: 'orders', element: <OrdersPage /> },",
        "  { path: 'invoices', element: <InvoicesPage /> },",
        "  { path: 'customers', element: <CustomersPage /> },",
        '];',
      ].join('\n'),
    );
    await file('libs/shared/authGuard.ts', 'export const authGuard = () => true;\n');

    const found = await declaredSiblings(join(root, 'libs/a/src/OrdersPage.tsx'), root);
    expect(found).toEqual([
      join(root, 'libs/b/src/InvoicesPage.tsx'),
      join(root, 'libs/c/src/CustomersPage.tsx'),
    ]);
  });

  it('leaves out what the table imports without routing', async () => {
    await file('src/pages/OrdersPage.tsx', 'export const OrdersPage = () => null;\n');
    await file('src/pages/InvoicesPage.tsx', 'export const InvoicesPage = () => null;\n');
    await file('src/shared/Layout.tsx', 'export const Layout = () => null;\n');
    await file(
      'src/app.routes.tsx',
      [
        "import { OrdersPage } from './pages/OrdersPage';",
        "import { InvoicesPage } from './pages/InvoicesPage';",
        "import { Layout } from './shared/Layout';",
        'export const routes = [',
        "  { path: 'orders', element: <OrdersPage /> },",
        "  { path: 'invoices', element: <InvoicesPage /> },",
        '];',
      ].join('\n'),
    );

    const found = await declaredSiblings(join(root, 'src/pages/OrdersPage.tsx'), root);
    expect(found).toEqual([join(root, 'src/pages/InvoicesPage.tsx')]);
  });

  it('follows a lazy import, which is how a route table usually names a screen', async () => {
    await file('src/views/orders/index.vue', '<template><div /></template>\n');
    await file('src/views/invoices/index.vue', '<template><div /></template>\n');
    await file(
      'src/router/index.js',
      [
        'export default [',
        "  { path: '/orders', component: () => import('../views/orders/index') },",
        "  { path: '/invoices', component: () => import('../views/invoices/index') },",
        '];',
      ].join('\n'),
    );

    const found = await declaredSiblings(join(root, 'src/views/orders/index.vue'), root);
    expect(found).toEqual([join(root, 'src/views/invoices/index.vue')]);
  });

  it('says nothing when no table routes the screen', async () => {
    const orphan = await file('src/widgets/Chart.tsx', 'export const Chart = () => null;\n');
    expect(await declaredSiblings(orphan, root)).toEqual([]);
  });
});

/**
 * A route entry's path is the route object's, not the nearest line's (#254).
 *
 * `declaredPath` found the line that binds a screen and then looked for a
 * `path:` on that line, the one above, the one below, or two above. In a nested
 * table that window belongs to a **different route**, so the answer was a
 * sibling's — a wrong answer rather than a miss, which is the direction
 * `src/layers/cache.ts` states must never happen.
 *
 * Measured on a real React monorepo: of 117 screens registered in 25 route
 * tables, 72 are `index: true` and have no path of their own; 52 of those were
 * nevertheless given a specific path. Eleven different screens were each
 * reported as `/new/*` — the "create" sibling in their table.
 */
describe('a nested route table', () => {
  const nested = async (): Promise<void> => {
    await file(
      'src/Routes.tsx',
      [
        "import { OrdersList } from './pages/OrdersList';",
        "import { OrderDetail } from './pages/OrderDetail';",
        'export const routes = [',
        '  {',
        "    path: 'orders',",
        '    element: <OrdersGuard />,',
        '    children: [',
        '      { index: true, element: <OrdersList /> },',
        "      { path: ':id/*', element: <OrderDetail /> },",
        '    ],',
        '  },',
        '];',
      ].join('\n'),
    );
    await file('src/pages/OrdersList.tsx', 'export const OrdersList = () => null;\n');
    await file('src/pages/OrderDetail.tsx', 'export const OrderDetail = () => null;\n');
  };

  it('gives an index route the parent’s path, not the sibling’s', async () => {
    await nested();
    expect((await placementOf(join(root, 'src/pages/OrdersList.tsx'), root)).path).toBe('/orders');
  });

  it('composes a child path onto its parent’s', async () => {
    await nested();
    expect((await placementOf(join(root, 'src/pages/OrderDetail.tsx'), root)).path).toBe(
      '/orders/:id/*',
    );
  });

  it('has no path where the entry states none, and borrows no neighbour’s', async () => {
    // A pathless entry is a real shape. It registers the screen while saying
    // nothing about where it sits — two facts, one of them missing. The entry
    // below it in the file used to supply the missing one.
    await file(
      'src/Routes.tsx',
      [
        "import { Orphan } from './pages/Orphan';",
        'export const routes = [',
        '  { element: <Orphan /> },',
        "  { path: 'somewhere-else', element: <Other /> },",
        '];',
      ].join('\n'),
    );
    await file('src/pages/Orphan.tsx', 'export const Orphan = () => null;\n');

    const placed = await placementOf(join(root, 'src/pages/Orphan.tsx'), root);
    expect(placed.path).toBeNull();
    expect(placed.trail).toEqual([]);
    // Still registered, and by which table — that is what a family is read
    // from, and losing it would push the screen onto its own folder (#225).
    expect(placed.declaredIn?.file).toContain('Routes.tsx');
  });

  it('composes an Angular child route onto its parent’s too', async () => {
    await file(
      'src/app/admin/admin-routing.module.ts',
      [
        "import { UsersComponent } from './users/users.component';",
        'const routes = [',
        '  {',
        "    path: 'admin',",
        '    children: [',
        "      { path: 'users', component: UsersComponent },",
        '    ],',
        '  },',
        '];',
      ].join('\n'),
    );
    await file(
      'src/app/admin/users/users.component.ts',
      "import { Component } from '@angular/core';\n@Component({ selector: 'x', template: '<b></b>' })\nexport class UsersComponent {}\n",
    );

    expect((await placementOf(join(root, 'src/app/admin/users/users.component.ts'), root)).path).toBe(
      '/admin/users',
    );
  });
});

/**
 * A screen's path lives in the table that mounts its table (#263).
 *
 * Since #254 a pathless registration honestly answers `path: null` instead of
 * borrowing a neighbour's line. That is right, and it left the answer for a
 * large share of screens as *"registered here, path unknown"* — because the
 * path genuinely is not in that file: it is in the table that **mounts** it.
 *
 * Measured on a real React monorepo, 25 route tables and 117 screens: 67 with a
 * specific path, 50 `declared` with `path: null`, 0 unrouted. The 50 are this.
 *
 * The mount is found by content and not by file name: the table that mounts one
 * is called `shellConfig.tsx` in that repository and `Root.tsx` in the issue's
 * own reproduction, and neither matches any routing-file pattern. What is
 * matched instead is the child table's **exported identifier**, which is why it
 * has to be a distinctive one — see the generic-name case below.
 */
describe('a table mounted under a path by another table', () => {
  it('composes the mount’s path onto a screen the child table states none for', async () => {
    // The reproduction from #263, verbatim: the mount file is `Root.tsx`, which
    // no routing-file name test matches.
    await file(
      'src/Root.tsx',
      [
        "import { invoiceRoutes } from './invoices/Routes';",
        'export const rootRoutes = [',
        "  { path: 'customers', children: invoiceRoutes },",
        '];',
      ].join('\n'),
    );
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const invoiceRoutes = [',
        '  { index: true, element: <Invoice /> },',
        '];',
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    const placed = await placementOf(screen, root);
    expect(placed.path).toBe('/customers');
    expect(placed.trail).toEqual(['customers']);
    // The registration and the path are two facts, and the family comes from
    // the first of them. Moving `declaredIn` to the mount would re-family every
    // screen this fixes (#225, #254).
    expect(placed.declaredIn?.file).toContain(join('invoices', 'Routes.tsx'));
  });

  it('recognises the mount through a module-namespace member', async () => {
    // The real shape: the mount reaches the array through a lazy `import()`
    // module object, so the reference is `m.customerInvoiceRoutes` and there is
    // no import specifier naming the child table at all.
    await file(
      'libs/client-ui/top-navigation/src/lib/shellConfig.tsx',
      [
        "const m = await import('@client-ui/customers-invoices');",
        'export const shellConfig = [',
        "  { path: 'customers', children: m.customerInvoiceRoutes },",
        '];',
      ].join('\n'),
    );
    await file(
      'libs/client-ui/domains/customers/invoices/src/lib/customersInvoicesPageRoutes.tsx',
      [
        "import { CustomerInvoice } from './pages/CustomerInvoice';",
        'export const customerInvoiceRoutes = [',
        '  {',
        '    element: <CustomerInvoiceGuard />,',
        '    children: [{ index: true, element: <CustomerInvoice /> }],',
        '  },',
        '];',
      ].join('\n'),
    );
    const screen = await file(
      'libs/client-ui/domains/customers/invoices/src/lib/pages/CustomerInvoice.tsx',
      'export const CustomerInvoice = () => null;\n',
    );

    expect((await placementOf(screen, root)).path).toBe('/customers');
  });

  it('recognises the mount through a spread', async () => {
    await file(
      'src/Shell.tsx',
      [
        "import { orderRoutes } from './orders/Routes';",
        "export const shellRoutes = [{ path: 'orders', children: [...orderRoutes] }];",
      ].join('\n'),
    );
    await file(
      'src/orders/Routes.tsx',
      [
        "import { OrdersList } from './pages/OrdersList';",
        'export const orderRoutes = [{ index: true, element: <OrdersList /> }];',
      ].join('\n'),
    );
    const screen = await file('src/orders/pages/OrdersList.tsx', 'export const OrdersList = () => null;\n');

    expect((await placementOf(screen, root)).path).toBe('/orders');
  });

  it('composes a second hop, when the mounting table is itself mounted', async () => {
    await file(
      'src/App.tsx',
      [
        "import { adminRoutes } from './admin/Routes';",
        "export const appRoutes = [{ path: 'admin', children: adminRoutes }];",
      ].join('\n'),
    );
    await file(
      'src/admin/Routes.tsx',
      [
        "import { userRoutes } from './users/Routes';",
        "export const adminRoutes = [{ path: 'users', children: userRoutes }];",
      ].join('\n'),
    );
    await file(
      'src/admin/users/Routes.tsx',
      [
        "import { UsersList } from './pages/UsersList';",
        'export const userRoutes = [{ index: true, element: <UsersList /> }];',
      ].join('\n'),
    );
    const screen = await file(
      'src/admin/users/pages/UsersList.tsx',
      'export const UsersList = () => null;\n',
    );

    expect((await placementOf(screen, root)).path).toBe('/admin/users');
  });

  it('keeps the path null when nothing mounts the table', async () => {
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const invoiceRoutes = [{ index: true, element: <Invoice /> }];',
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    const placed = await placementOf(screen, root);
    expect(placed.path).toBeNull();
    expect(placed.declaredIn?.file).toContain('Routes.tsx');
  });

  it('keeps the path null when two tables mount it under different paths', async () => {
    // An array mounted twice is a real shape, and answering one of the two
    // would be inventing the other away.
    await file(
      'src/Root.tsx',
      "export const rootRoutes = [{ path: 'customers', children: invoiceRoutes }];\n",
    );
    await file(
      'src/Legacy.tsx',
      "export const legacyRoutes = [{ path: 'billing', children: invoiceRoutes }];\n",
    );
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const invoiceRoutes = [{ index: true, element: <Invoice /> }];',
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    expect((await placementOf(screen, root)).path).toBeNull();
  });

  it('refuses to compose from a generic export name', async () => {
    // The match rests on the name alone — no specifier is resolved, because the
    // real one is an alias. A bare `routes` appears in every table in a
    // repository, so composing from it would be inventing a prefix.
    await file(
      'src/Root.tsx',
      "export const rootRoutes = [{ path: 'customers', children: routes }];\n",
    );
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const routes = [{ index: true, element: <Invoice /> }];',
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    expect((await placementOf(screen, root)).path).toBeNull();
  });

  it('keeps the path null when the search runs out of budget', async () => {
    // An incomplete search cannot establish that the mount it found is the only
    // one, so it may not answer at all.
    await file(
      'src/Root.tsx',
      "export const rootRoutes = [{ path: 'customers', children: invoiceRoutes }];\n",
    );
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const invoiceRoutes = [{ index: true, element: <Invoice /> }];',
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    expect((await placementOf(screen, root, { mountReads: 1 })).path).toBeNull();
  });

  it('leaves the family exactly where it was', async () => {
    // The family comes from the table that registers the screen, and this issue
    // is only about recovering the path half.
    await file(
      'src/Root.tsx',
      [
        "import { invoiceRoutes } from './invoices/Routes';",
        "export const rootRoutes = [{ path: 'customers', children: invoiceRoutes }];",
      ].join('\n'),
    );
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        "import { Alerts } from './pages/Alerts';",
        'export const invoiceRoutes = [',
        '  { index: true, element: <Invoice /> },',
        "  { path: 'alerts', element: <Alerts /> },",
        '];',
      ].join('\n'),
    );
    await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');
    await file('src/invoices/pages/Alerts.tsx', 'export const Alerts = () => null;\n');

    expect(await declaredSiblings(join(root, 'src/invoices/pages/Invoice.tsx'), root)).toEqual([
      join(root, 'src/invoices/pages/Alerts.tsx'),
    ]);
  });
});

/**
 * A mount shifts every entry in the table, not only the pathless ones (#1).
 *
 * #263 composed the mounting table's path onto a screen whose registration
 * states none — an `index: true` child, a guard wrapper. It deliberately left
 * the entries that *do* state a path, and those are shifted by the mount just
 * as much: `{ path: 'detail/:id' }` inside a table mounted under `orders` is
 * `/orders/detail/:id`, and answering `/detail/:id` is a partial path presented
 * as a whole one — the direction `src/layers/cache.ts` says must never happen.
 *
 * The three refusals are unchanged in mechanism and change in consequence: for
 * a pathless entry a refusal leaves `null`, and for one that states a path it
 * leaves the stated path exactly as the table wrote it. Refusing to compose is
 * never refusing to answer.
 */
describe('a mounted table shifts the entries that state a path too', () => {
  const mounted = async (): Promise<void> => {
    await file(
      'src/Root.tsx',
      [
        "import { invoiceRoutes } from './invoices/Routes';",
        "export const rootRoutes = [{ path: 'customers', children: invoiceRoutes }];",
      ].join('\n'),
    );
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const invoiceRoutes = [',
        "  { path: 'detail/:id', element: <Invoice /> },",
        '];',
      ].join('\n'),
    );
  };

  it('composes the mount’s path onto a path the entry states', async () => {
    await mounted();
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    const placed = await placementOf(screen, root);
    expect(placed.path).toBe('/customers/detail/:id');
    expect(placed.trail).toEqual(['customers', 'detail', ':id']);
    // The registration is still the child table's, so the family does not move.
    expect(placed.declaredIn?.file).toContain(join('invoices', 'Routes.tsx'));
  });

  it('composes onto a path the child table nests', async () => {
    await file(
      'src/Root.tsx',
      [
        "import { invoiceRoutes } from './invoices/Routes';",
        "export const rootRoutes = [{ path: 'customers', children: invoiceRoutes }];",
      ].join('\n'),
    );
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const invoiceRoutes = [',
        "  { path: 'detail', children: [{ path: ':id', element: <Invoice /> }] },",
        '];',
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    expect((await placementOf(screen, root)).path).toBe('/customers/detail/:id');
  });

  it('leaves the stated path as the table wrote it when two tables mount it', async () => {
    await mounted();
    await file(
      'src/Legacy.tsx',
      "export const legacyRoutes = [{ path: 'billing', children: invoiceRoutes }];\n",
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    expect((await placementOf(screen, root)).path).toBe('/detail/:id');
  });

  it('leaves the stated path as the table wrote it when the export name is generic', async () => {
    await file('src/Root.tsx', "export const rootRoutes = [{ path: 'customers', children: routes }];\n");
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        "export const routes = [{ path: 'detail/:id', element: <Invoice /> }];",
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    expect((await placementOf(screen, root)).path).toBe('/detail/:id');
  });

  it('leaves the stated path as the table wrote it when the search runs out of budget', async () => {
    await mounted();
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    expect((await placementOf(screen, root, { mountReads: 1 })).path).toBe('/detail/:id');
  });

  it('composes a parent written in the same file as the table it mounts', async () => {
    // The shape a single-file router uses, and the one the sweep used to skip
    // because it skipped the child table's own file.
    await file(
      'src/routes.tsx',
      [
        "import { Invoice } from './invoices/pages/Invoice';",
        "const invoiceRoutes = [{ index: true, element: <Invoice /> }];",
        "export const appRoutes = [{ path: 'customers', children: invoiceRoutes }];",
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    expect((await placementOf(screen, root)).path).toBe('/customers');
  });
});

/**
 * A path the table wrote absolute is already whole.
 *
 * `{ path: '/settings/tokens' }` is not a segment to be added to whatever sits
 * above it: Vue Router reads a leading slash as the root, and React Router
 * refuses a nested absolute path that does not already begin with its parent's.
 * Composing either way produces a path the router never serves — and composing
 * onto stated paths is what makes this reachable, since a pathless entry cannot
 * be absolute.
 */
describe('a path the table wrote absolute', () => {
  it('does not take the prefix of the entry it is nested under', async () => {
    await file(
      'src/routes.tsx',
      [
        "import { Audit } from './pages/Audit';",
        'export const appRoutes = [',
        "  { path: 'customers', children: [{ path: '/admin/audit', element: <Audit /> }] },",
        '];',
      ].join('\n'),
    );
    const screen = await file('src/pages/Audit.tsx', 'export const Audit = () => null;\n');

    const placed = await placementOf(screen, root);
    expect(placed.path).toBe('/admin/audit');
    expect(placed.trail).toEqual(['admin', 'audit']);
  });

  it('does not take the path of the table that mounts it', async () => {
    await file(
      'src/Root.tsx',
      [
        "import { invoiceRoutes } from './invoices/Routes';",
        "export const rootRoutes = [{ path: 'customers', children: invoiceRoutes }];",
      ].join('\n'),
    );
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        "export const invoiceRoutes = [{ path: '/settings/tokens', element: <Invoice /> }];",
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    expect((await placementOf(screen, root)).path).toBe('/settings/tokens');
  });
});

/**
 * A path that acts as a parent drops its splat.
 *
 * `{ path: 'orders/*', children: [...] }` is how a router says "and everything
 * below"; the child's own path continues from `orders`, not from `orders/*`.
 * Composing the splat in gave a path with `*` still in the middle of it, and a
 * trail carrying `*` as though it were a segment — a wrong answer, reachable
 * without any mount, and one that composing onto stated paths would multiply.
 */
describe('a splat on a parent', () => {
  it('is not composed into a child’s path or trail', async () => {
    await file(
      'src/routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const appRoutes = [',
        "  { path: 'customers/*', children: [{ path: 'detail', element: <Invoice /> }] },",
        '];',
      ].join('\n'),
    );
    const screen = await file('src/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    const placed = await placementOf(screen, root);
    expect(placed.path).toBe('/customers/detail');
    expect(placed.trail).toEqual(['customers', 'detail']);
  });

  it('is not composed into a mount prefix', async () => {
    await file(
      'src/Root.tsx',
      [
        "import { invoiceRoutes } from './invoices/Routes';",
        "export const rootRoutes = [{ path: 'customers/*', children: invoiceRoutes }];",
      ].join('\n'),
    );
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const invoiceRoutes = [{ index: true, element: <Invoice /> }];',
      ].join('\n'),
    );
    const screen = await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');

    const placed = await placementOf(screen, root);
    expect(placed.path).toBe('/customers');
    expect(placed.trail).toEqual(['customers']);
  });

  it('stays on the entry that states it, where it is the screen’s own path', async () => {
    // A leaf splat is the screen's real path — `/docs/*` routes everything
    // under `docs` to one screen — and nothing here is composing it onto
    // anything else.
    await file(
      'src/routes.tsx',
      [
        "import { Docs } from './pages/Docs';",
        "export const appRoutes = [{ path: 'docs/*', element: <Docs /> }];",
      ].join('\n'),
    );
    const screen = await file('src/pages/Docs.tsx', 'export const Docs = () => null;\n');

    expect((await placementOf(screen, root)).path).toBe('/docs/*');
  });
});

describe('what the sweep for a mount is not allowed to read', () => {
  it('does not follow a symlink out of the project', async () => {
    // The sweep walks the whole project, so what counts as a file in it is a
    // security question and not a tidiness one: a planted `*.tsx` link is how a
    // reader ends up outside the tree it was pointed at (#174, the same shape
    // through a `tsconfig` alias).
    const outside = await mkdtemp(join(tmpdir(), 'uic-outside-'));
    try {
      await writeFile(
        join(outside, 'Stolen.tsx'),
        "export const stolenRoutes = [{ path: 'stolen', children: invoiceRoutes }];\n",
        'utf8',
      );
      await symlink(join(outside, 'Stolen.tsx'), join(root, 'src', 'Linked.tsx'));

      const placed = await placementOf(join(root, 'src/invoices/pages/Invoice.tsx'), root);
      expect(placed.path).toBeNull();
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    await file(
      'src/invoices/Routes.tsx',
      [
        "import { Invoice } from './pages/Invoice';",
        'export const invoiceRoutes = [{ index: true, element: <Invoice /> }];',
      ].join('\n'),
    );
    await file('src/invoices/pages/Invoice.tsx', 'export const Invoice = () => null;\n');
  });
});

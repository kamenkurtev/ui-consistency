import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { chromeOf, governingLayout } from '../../src/sources/layouts.js';

let root: string;

const file = async (path: string, body = ''): Promise<string> => {
  const full = join(root, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, body, 'utf8');
  return full;
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-layouts-'));
  await writeFile(join(root, 'package.json'), '{"name":"app"}', 'utf8');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('the layout that governs a screen', () => {
  it('is the nearest one above it, not the outermost', async () => {
    // Layouts nest. A dashboard page sits inside the dashboard chrome, which
    // sits inside the application's — and the one it is written against is the
    // nearest.
    await file('app/layout.tsx', 'export default () => <html />;\n');
    const inner = await file('app/dashboard/layout.tsx', 'export default () => <div />;\n');
    const page = await file('app/dashboard/orders/page.tsx', 'export const P = () => <div />;\n');

    expect(await governingLayout(page, root)).toBe(inner);
  });

  it('reads the dialect the framework writes it in', async () => {
    const layout = await file('src/routes/+layout.svelte', '<nav />\n');
    const page = await file('src/routes/orders/+page.svelte', '<div />\n');

    expect(await governingLayout(page, root)).toBe(layout);
  });

  it('is nothing when the project has none', async () => {
    const page = await file('src/pages/Orders.tsx', 'export const P = () => <div />;\n');
    expect(await governingLayout(page, root)).toBeNull();
  });

  it('never climbs out of the project to find one', async () => {
    // The same boundary the family search needed: a layout file in whatever
    // repository sits beside this one is not this project's chrome.
    const outside = join(root, '..');
    await writeFile(join(outside, 'layout.tsx'), 'export default () => <div />;\n', 'utf8').catch(
      () => undefined,
    );
    const page = await file('src/pages/Orders.tsx', 'export const P = () => <div />;\n');

    expect(await governingLayout(page, root)).toBeNull();
  });
});

describe('what a layout provides', () => {
  it('is read from the whole file, because layouts nest', async () => {
    // `material-kit-react` puts its SideNav two levels inside a Box, and a
    // SvelteKit layout has several top-level nodes with <Nav> among them.
    // Reading only the root's children — which is right for a screen — found
    // nothing at all on either.
    const layout = await file(
      'app/layout.tsx',
      `export default function L({ children }) {\n  return (\n    <AuthGuard>\n      <Box>\n        <SideNav />\n        <Box><main>{children}</main></Box>\n      </Box>\n    </AuthGuard>\n  );\n}\n`,
    );

    const chrome = await chromeOf(layout);
    expect(chrome?.provides).toContain('nav');
    expect(chrome?.provides).toContain('content');
  });

  it('claims neither a holder nor an order, because it cannot know them', async () => {
    // Both were tried against real repositories and both were wrong: the loose
    // reading gave `AuthGuard` and `:svelte:head` as holders, and an order of
    // "content, nav" for a layout whose nav is plainly first.
    const layout = await file('app/layout.tsx', `export default () => (<div><Nav /><main /></div>);\n`);
    const chrome = await chromeOf(layout);

    expect(Object.keys(chrome ?? {}).sort()).toEqual(['file', 'provides']);
  });

  it('says nothing about a layout file that provides no role at all', async () => {
    const layout = await file('app/layout.tsx', `export default ({ children }) => <>{children}</>;\n`);
    expect(await chromeOf(layout)).toBeNull();
  });
});

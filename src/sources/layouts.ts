import { readdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { parseModule, walk } from '../parse/parse.js';
import { parseTemplate, templateKind } from '../parse/template.js';
import { jsxNameOf } from './extract.js';
import { regionOf, type Region } from './regions.js';
import type { JSXElement } from '@babel/types';

/**
 * How each framework names the file that holds a screen's chrome.
 *
 * Every router-based framework separates them: the page file holds the body,
 * and the header, navigation and footer live one level up. Reading the page
 * alone therefore sees a body and reports no regions at all — measured on four
 * public repositories, that was the commonest reason the skeleton came back
 * empty.
 */
const LAYOUT_FILE = /^(\+layout\.svelte|layout\.[jt]sx?|__layout\.svelte)$/;

/**
 * The layout file a screen is written against, or null.
 *
 * The **nearest** one above it, not the outermost: layouts nest, and a
 * dashboard page sits inside the dashboard's chrome before the application's.
 *
 * Bounded by the project root for the same reason the family search is — a
 * layout file in whatever repository happens to sit beside this one is not this
 * project's chrome.
 */
export async function governingLayout(screen: string, root: string | null): Promise<string | null> {
  const inside = (path: string): boolean => {
    if (root === null) return true;
    const away = relative(root, path);
    return away === '' || (!away.startsWith('..') && !isAbsolute(away));
  };

  let dir = dirname(screen);
  for (;;) {
    if (!inside(dir)) return null;

    const entries = await readdir(dir).catch(() => null);
    const found = entries?.find((name) => LAYOUT_FILE.test(name));
    if (found !== undefined && join(dir, found) !== screen) return join(dir, found);

    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** What the chrome around a screen provides. */
export interface Chrome {
  file: string;
  /**
   * The roles the layout supplies, as a set.
   *
   * Deliberately not an order and not a holder — see `chromeOf`.
   */
  provides: Region[];
}

/**
 * The roles a layout file provides.
 *
 * Read from the **whole** file rather than from the root's direct children,
 * which is how a screen is read. A layout nests: `material-kit-react` puts its
 * `SideNav` two levels inside a `Box`, and a SvelteKit layout has several
 * top-level nodes with `<Nav>` among them. Measured on both, reading only the
 * children found nothing at all.
 *
 * The looser reading is defensible here and not in a screen: this file exists
 * to *be* the chrome, so a header it mentions is the header, while in a screen
 * a `<Header>` inside a card is not the page's.
 */
export async function chromeOf(path: string): Promise<Chrome | null> {
  const source = await readFile(path, 'utf8').catch(() => null);
  if (source === null) return null;

  const kind = templateKind(path);
  const names =
    kind === null ? namesInJsx(source) : parseTemplate(source, kind).map((node) => node.name);

  const regions: Region[] = [];
  for (const name of names) {
    const region = regionOf(name, names[0]);
    if (region !== null && !regions.includes(region)) regions.push(region);
  }
  if (regions.length === 0) return null;

  // No holder and no order. Both were tried and both were wrong: the loose
  // whole-file reading gave `AuthGuard` and `:svelte:head` as holders on two
  // real repositories, and an order of `content, nav` for a layout whose nav is
  // plainly first. What the file provides is knowable; where it puts it is not,
  // from this reading.
  return { file: path, provides: regions };
}

function namesInJsx(source: string): string[] {
  const ast = parseModule(source);
  if (ast === null) return [];

  const names: string[] = [];
  walk(ast.program, (node) => {
    if (node.type !== 'JSXElement') return;
    const name = jsxNameOf(node as JSXElement);
    if (name !== null) names.push(name);
  });
  return names;
}

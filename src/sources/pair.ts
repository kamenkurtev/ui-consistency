import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/**
 * A screen written as more than one file.
 *
 * In React, Solid and Qwik a screen is a file. In Angular it is a **pair**:
 * `orders.component.ts` carries the identity, the imports and the wiring —
 * it is what a route module names and what an import resolves through — and
 * `orders.component.html` carries the markup. Neither is a screen alone, and
 * reading them as two unrelated candidates is why the whole pattern and
 * advisory half produced nothing on a real Angular monorepo of 179 components
 * (#229): the `.ts` had no markup to compare and the `.html` had no imports, no
 * wiring and no identity beyond its own tags.
 */
export interface Pair {
  /** The file that *is* the screen: what a route names, what imports resolve to. */
  identity: string;
  /** Where the markup lives, when it is a file of its own. */
  markup: string | null;
  /** The markup written inside the class, for a `template:` component. */
  inline: string | null;
}

/** A class file that may carry a template. Angular's naming, not its vocabulary. */
const CLASS_FILE = /\.component\.[jt]s$/;
/** The template a `templateUrl` can point at. */
const TEMPLATE_FILE = /\.html$/;
/** A decorated class. Without one, a `.component.ts` is a file with a name. */
const DECORATED = /@Component\s*\(/;
const TEMPLATE_URL = /templateUrl\s*:\s*['"`]([^'"`]+)['"`]/;
/** `template: \`…\`` — the inline form, which is how a small screen is written. */
const INLINE = /template\s*:\s*`([\s\S]*?)`/;
/** The tag a decorated class answers to, which is how a template names it. */
const SELECTOR = /selector\s*:\s*['"`]([^'"`]+)['"`]/;

/** A class file is big only when it is not a screen. */
const MAX_BYTES = 400_000;

const isFile = (path: string): Promise<boolean> =>
  stat(path).then(
    (info) => info.isFile(),
    () => false,
  );

/**
 * The screen this path belongs to, or `null` where the path is not half of one.
 *
 * Either half resolves to the same screen, which is what makes *"pass me any
 * file of it"* work the same way it does for a single-file dialect.
 */
export async function pairOf(path: string): Promise<Pair | null> {
  if (CLASS_FILE.test(path)) {
    const source = await readFile(path, 'utf8').catch(() => null);
    if (source === null || source.length > MAX_BYTES || !DECORATED.test(source)) return null;

    const url = TEMPLATE_URL.exec(source)?.[1];
    if (url !== undefined) {
      const markup = resolve(dirname(path), url);
      if (await isFile(markup)) return { identity: path, markup, inline: null };
    }
    const inline = INLINE.exec(source)?.[1];
    if (inline !== undefined) return { identity: path, markup: null, inline };

    // A component with neither is not a screen. It renders nothing to compare.
    return null;
  }

  if (!TEMPLATE_FILE.test(path)) return null;

  // The other half. Both spellings, because a project writing `.js` here is
  // writing the same pair.
  for (const extension of ['.ts', '.js']) {
    const identity = path.replace(TEMPLATE_FILE, extension);
    if (!(await isFile(identity))) continue;
    const source = await readFile(identity, 'utf8').catch(() => null);
    if (source === null || !DECORATED.test(source)) continue;
    return { identity, markup: path, inline: null };
  }
  return null;
}

/**
 * The markup of a screen, wherever it lives, with the path it came from.
 *
 * The path matters as much as the text: which parser reads it is dispatched on
 * the extension, and inline markup is read as the template it is.
 */
export async function markupOf(
  path: string,
  fallback: string,
): Promise<{ path: string; source: string }> {
  const pair = await pairOf(path);
  if (pair === null) return { path, source: fallback };
  if (pair.inline !== null) return { path: `${pair.identity}.html`, source: pair.inline };
  if (pair.markup === null) return { path, source: fallback };
  const source = await readFile(pair.markup, 'utf8').catch(() => null);
  return source === null ? { path, source: fallback } : { path: pair.markup, source };
}

/**
 * The element name a decorated class is written as.
 *
 * An Angular template names its children by **selector**, not by the class it
 * imported — `<app-orders-grid>` for `OrdersGridComponent` — so following a
 * template into its children needs the mapping the class states about itself.
 * Read from the file that declares it, never from a convention about how a
 * class name becomes a tag: a project is free to prefix its selectors however
 * it likes, and deriving one would be a hardcoded vocabulary with extra steps.
 *
 * Only the simple form. A selector that is an attribute or a compound
 * (`[appHighlight]`, `button[app-icon]`) is not how a child component is
 * rendered as an element, and answering for it would resolve a tag that is not
 * there.
 */
export async function selectorOf(path: string): Promise<string | null> {
  const source = await readFile(path, 'utf8').catch(() => null);
  if (source === null || source.length > MAX_BYTES || !DECORATED.test(source)) return null;
  const selector = SELECTOR.exec(source)?.[1] ?? null;
  return selector !== null && /^[a-z][\w-]*$/i.test(selector) ? selector : null;
}

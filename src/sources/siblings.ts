import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative } from 'node:path';
import { declaredSiblings, resolveRelative } from './routes.js';
import { parseModule, walk } from '../parse/parse.js';

/**
 * Framework files that sit beside a screen without being one.
 *
 * The Next.js app router puts `layout.tsx`, `loading.tsx` and `error.tsx` in
 * the same directory as `page.tsx`. They are real files and they are not
 * screens: a loading skeleton has no page structure to agree with, and a layout
 * is the holder rather than a thing held. Counting them made the directory look
 * full while none of it was comparable.
 *
 * Lowercase and exact, so a component called `Error.tsx` — which is somebody's
 * error *screen* — is untouched.
 */
const ROUTE_FILE = /^(layout|loading|error|not-found|template|default|global-error)\.[jt]sx$/;

/**
 * How a folder names the screen it exists for.
 *
 * Three conventions, and a project only has to match one: the file named after
 * its folder (`OrderDetail/OrderDetail.tsx`), the folder's `index`, and the
 * router conventions where the folder *is* the route and the file has a fixed
 * name — `page.tsx` in the Next.js app router, `+page.svelte` in SvelteKit.
 *
 * Without the last of these the whole neighbour observation was dead in an
 * app-router project: the folder is `blog` and the screen is `page.tsx`, which
 * is neither named after its folder nor an index. Measured on a real one, that
 * was 0 of 14 screens observed.
 */
const ROUTE_SCREEN = /^\+?page\.[jt]sx?$/;

/**
 * Does this file own the folder it sits in?
 *
 * The three conventions above, read the other way round. When the answer is
 * yes, the folder is *this screen's* folder and what else is in it is this
 * screen's parts — the grid, the dialog, the cell, the hooks — not the screens
 * it should be measured against.
 *
 * That was the commonest real layout and the family was wrong on all of it:
 * `pages/CustomerInvoicesPage/` reached quorum with five files that are not
 * screens, so the walk to the sibling pages one level up never ran. Measured on
 * a React monorepo of 77 pages, 25 of them (32%) were described by their own
 * parts while 63 had three or more real siblings that were never read (#225).
 *
 * Angular has the same shape, one directory further down:
 * `screens/<name>/components/<name>/<name>.component.*`.
 */
export const ownsItsFolder = (target: string): boolean => {
  const folder = basename(dirname(target));
  const bare = basename(target).replace(/\.[^.]+$/, '');
  return (
    ROUTE_SCREEN.test(basename(target)) ||
    /^index$/i.test(bare) ||
    bare === folder ||
    // `crm.component.ts` in `crm/`, and `OrdersPage.module.tsx` in `OrdersPage/`.
    bare.split('.')[0] === folder
  );
};

/** Directories that are never a route tree, and are expensive to walk. */
const SKIP_DIR = /^(node_modules|dist|build|coverage|out|\.next|\.git|__tests__|__mocks__)$/;

/**
 * How far out to look, and how much reading to spend looking.
 *
 * Both are the cost of this observation on a repository nobody has measured.
 * Three ancestors is what an app-router project needs — `page.tsx` sits under
 * `app/(group)/route/`, so its comparable screens are two levels up and one
 * back down — and the read budget is what stops a monorepo root from turning
 * one edit into a repository walk.
 */
const MAX_ANCESTORS = 3;
const MAX_READS = 40;

/**
 * What counts as a screen file, and how much agreement means anything.
 *
 * Here because this module already owns which files the walk considers, and
 * because a third copy of the predicate was about to be written. `usage.ts`
 * still builds its own from local constants and `neighbours.ts` still uses a
 * narrower JSX-only variant — **they have not been moved onto these**, and
 * doing so would change what those two read, which is a separate change. This
 * is the home; the copies are still copies.
 */
export const isScreenFile = (name: string): boolean =>
  // `.component.ts` is half of an Angular screen — the half that carries the
  // identity — and without it the family of an Angular screen was its templates
  // alone, each with no imports and no name a route could use (#229). Both
  // halves are candidates; `patternOf` folds them back into one screen.
  (/\.(?:[jt]sx|html|vue|svelte)$/.test(name) || /\.component\.[jt]s$/.test(name)) &&
  !/\.(?:test|spec|stories|story)\.(?:[jt]sx?|html|vue|svelte)$/.test(name);

/** The share of a family that must do a thing before it is the pattern. */
export const MAJORITY = 0.6;
/** Below this there is no family — two files are a copy, not an agreement. */
export const QUORUM = 3;
/**
 * Enough screens to measure agreement, and no more.
 *
 * Measured on Backstage: uncapped and at 24 the observation fires on the same
 * 57 files, and at 12 on 50 — the truncation is alphabetical rather than a
 * sample, so cutting closer drops whole folders instead of trimming evenly.
 */
export const MAX_FAMILY = 24;

export interface SiblingOptions {
  /** For tests, and for reading a directory that is not the target's own. */
  readDir?: (dir: string) => Promise<string[]>;
  /** Is this file name a screen at all? The caller's dialects, not ours. */
  isScreen: (name: string) => boolean;
  /** Stop looking once there are this many. Every one past it costs a parse. */
  maxSiblings: number;
  /** Below this there is no agreement worth measuring, so no point walking. */
  quorum: number;
  /**
   * The project the search may not leave.
   *
   * Without it the walk climbs three ancestors looking for screens and, on a
   * machine where repositories sit side by side — which is every machine —
   * reaches a *different* project's code. Measured on a real checkout: two of
   * the three files in the family belonged to the repository next door, the
   * invariant collapsed, and that project's own layout components were reported
   * as things not to copy.
   */
  root?: string;
}

/**
 * The screens beside this one — in its own directory, or one folder out.
 *
 * A screen per folder is as common a layout as a folder of screens, and in the
 * routers it is the *only* one: `app/(marketing)/blog/page.tsx` has no
 * siblings at all, forever, by the framework's design. So when the directory
 * cannot reach quorum, the parent's folders are read one screen each.
 *
 * One per folder, deliberately. Taking everything inside would let a single
 * crowded folder outvote every other, and what is being measured is whether
 * *screens* agree, not whether one directory is large.
 */
/**
 * The screens beside one screen, and **where they came from**.
 *
 * The provenance is not decoration. A route-derived family is what the project
 * *states*; a folder-derived one is a guess about which files are of a kind, and
 * since #231 that guess reaches the agent automatically on every settled edit.
 * Two callers need to treat them differently — one discards a self-contradictory
 * folder guess, the other says which it was in the sentence it hands over
 * (#255).
 */
export interface Family {
  screens: string[];
  from: 'routes' | 'folder';
}

export async function siblingScreens(
  target: string,
  options: SiblingOptions,
): Promise<Family> {
  const { isScreen, maxSiblings, quorum } = options;
  const readDirectory = options.readDir ?? ((path: string) => readdir(path));

  // Nothing the screen itself imports may be its family.
  //
  // The page imports its panel, so the panel is *part of* the page and not a
  // sibling of it. CLAUDE.md states the rule — "a page and its grid, its dialog
  // and its hooks are one screen" — and the fallback did not enforce it, so a
  // page's own parts became the family it was measured against and the derived
  // holder contradicted the reference (#255). Applied to every path, not only
  // the fallback: if a genuine sibling is ever imported by the reference — rare,
  // since pages rarely import pages — the family shrinks by one, which is a
  // miss and never an invention.
  const mine = options.root === undefined ? new Set<string>() : await importedBy(target);
  const notMine = (path: string): boolean => !mine.has(path);

  // What the project *states*, before anything read off the layout of folders.
  // A route table names the screens registered beside this one; where files sit
  // is a guess about which of them are of a kind. Only when a root is given —
  // a caller driving its own directory reader is not asking about a real
  // project on disk.
  if (options.root !== undefined) {
    const declared = (await declaredSiblings(target, options.root))
      .filter((path) => isScreen(basename(path)) && notMine(path))
      .slice(0, maxSiblings);
    if (declared.length >= quorum) return { screens: declared, from: 'routes' };
  }

  const dir = dirname(target);
  const entries = await readDirectory(dir).catch(() => null);
  if (entries === null) return { screens: [], from: 'folder' };

  const screen = (name: string): boolean => isScreen(name) && !ROUTE_FILE.test(name);

  const siblings = entries
    .filter((name) => screen(name) && name !== basename(target))
    .map((name) => join(dir, name))
    .filter(notMine)
    .slice(0, maxSiblings);

  // Quorum from the target's own folder is not agreement when the folder is
  // the target's own: it is the page and the things the page is made of.
  if (siblings.length >= quorum && !ownsItsFolder(target)) {
    return { screens: siblings, from: 'folder' };
  }

  // Directories read while looking. A hard budget rather than a depth alone:
  // this runs on every settled edit, and the walk below is the only part of the
  // observation whose cost depends on the shape of somebody else's repository.
  let budget = MAX_READS;

  const chooseIn = (folder: string, name: string, inside: string[]): string | null => {
    const found = inside
      .filter(screen)
      .find((file) => ROUTE_SCREEN.test(file) || file.startsWith(name) || file.startsWith('index'));
    return found === undefined ? null : join(folder, found);
  };

  /** One screen per folder, down through a route tree, never past the budget. */
  const collect = async (from: string, depth: number, into: string[]): Promise<void> => {
    if (depth < 0 || into.length >= maxSiblings || budget <= 0) return;
    const entries = await readDirectory(from).catch(() => null);
    if (entries === null) return;
    budget--;

    for (const name of entries) {
      if (into.length >= maxSiblings || budget <= 0) return;
      if (screen(name) || SKIP_DIR.test(name)) continue;
      const folder = join(from, name);
      if (folder === dir) continue;
      // Charged for the attempt, not for the success. Every plain file in the
      // directory is passed here, fails ENOTDIR and used to `continue` before
      // this line — so a folder of several hundred modules issued several
      // hundred syscalls with the budget untouched, which is the one cost this
      // budget exists to bound (#153).
      budget--;
      const inside = await readDirectory(folder).catch(() => null);
      if (inside === null) continue;
      const found = chooseIn(folder, name, inside);
      if (found !== null) into.push(found);
      // A router puts one route per directory and nests them, so the screens
      // that are actually comparable are further down: `(dashboard)/dashboard/`
      // holds `settings/` and `billing/`, each with its own `page.tsx`, and the
      // flat scan of one parent finds at most one of them. Descending is what
      // makes the observation exist at all in an app-router project.
      await collect(folder, depth - 1, into);
    }
  };

  /**
   * The nearest scope that holds enough screens to constitute an agreement.
   *
   * Each scope is measured on its own and the partial ones are discarded rather
   * than added together. Mixing them is what made `dashboard/page.tsx` be
   * described by the marketing pages: its own two child routes share a
   * `DashboardShell`, but two is not agreement, and pouring eight distant
   * screens in beside them produced a majority about `Link` — true of the
   * repository and useless about the file.
   *
   * Nearest first: the file's own child routes, then each ancestor's subtree.
   */
  const inside = (path: string): boolean => {
    if (options.root === undefined) return true;
    const away = relative(options.root, path);
    return away === '' || (!away.startsWith('..') && !isAbsolute(away));
  };

  const scopes: { from: string; depth: number }[] = [{ from: dir, depth: 1 }];
  let ancestor = dirname(dir);
  for (let level = 0; level < MAX_ANCESTORS; level++) {
    if (!inside(ancestor)) break;
    scopes.push({ from: ancestor, depth: level });
    const next = dirname(ancestor);
    if (next === ancestor) break;
    ancestor = next;
  }

  for (const scope of scopes) {
    const found: string[] = [];
    await collect(scope.from, scope.depth, found);
    const kept = found.filter(notMine);
    if (kept.length >= quorum) return { screens: kept, from: 'folder' };
    if (budget <= 0) break;
  }

  return { screens: siblings, from: 'folder' };
}

/**
 * The files this screen imports, resolved on disk.
 *
 * Relative specifiers only. An aliased one needs the project's `tsconfig`, and
 * guessing at it would exclude a file the screen never imported — which would
 * be a family shrunk for the wrong reason.
 */
async function importedBy(target: string): Promise<Set<string>> {
  const source = await readFile(target, 'utf8').catch(() => null);
  if (source === null) return new Set();

  const ast = parseModule(source, target);
  if (ast === null) return new Set();

  const specifiers: string[] = [];
  walk(ast.program, (node) => {
    if (node.type === 'ImportDeclaration') specifiers.push(node.source.value);
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Import' &&
      node.arguments[0]?.type === 'StringLiteral'
    ) {
      specifiers.push(node.arguments[0].value);
    }
  });

  const found = new Set<string>();
  for (const specifier of specifiers) {
    const path = await resolveRelative(dirname(target), specifier);
    if (path !== null) found.add(path);
  }
  return found;
}

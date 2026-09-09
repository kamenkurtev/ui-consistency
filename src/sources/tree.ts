import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { parseModule, walk } from '../parse/parse.js';
import { templateKind } from '../parse/template.js';
import { markupOf, pairOf, selectorOf } from './pair.js';
import { shapeOf } from './extract.js';
import { resolverFor, type Resolver } from './resolve.js';

/**
 * How far a walk may follow a screen into its children, counted in **file
 * hops**, because that is the unit the problem is stated in: reading the screen
 * file alone put 11 of 132 screens in the "list with a filter bar" bucket, and
 * following one hop put 26 there. The screens did not change; the reading did.
 *
 * Two is the default rather than the maximum for a measured reason: it is the
 * hop that moved those buckets, and each further hop multiplies the files read
 * on a path that has 37 ms cold and a per-file debounce behind it.
 */
export const DEFAULT_DEPTH = 2;

/**
 * A hard ceiling, so a caller cannot ask for the whole repository by accident.
 *
 * Measured on a synthetic worst case — eight children at every level, nothing
 * shared, nothing external — because that is the shape the ceiling exists for:
 *
 * ```
 * depth 1     1 file        13 ms
 * depth 2     2 files        8 ms
 * depth 3    10 files       26 ms
 * depth 4    74 files      140 ms
 * depth 5   138 files      179 ms
 * ```
 *
 * The knee is between 3 and 4, and it is the fan-out rather than the depth: a
 * real screen is narrower and shares components, so these are an upper bound
 * and not a typical cost. They are also the reason nothing here runs on the
 * edit path, where the whole budget is 37 ms cold.
 */
export const MAX_DEPTH = 5;

/**
 * Why a child of a screen is a leaf of this tree.
 *
 * The distinction is the point. *Nothing below here* and *we could not tell*
 * are different facts, and collapsing them is how a walk reports a shallow
 * screen where it met a specifier it could not follow — a green result on
 * evidence it does not have, which is the failure this repository keeps
 * finding.
 */
export type Leaf =
  /** Read: a file inside the project, walked. */
  | 'project'
  /** Imported from outside the project. Its internals are none of our business. */
  | 'external'
  /** Declared in the same file. Real, and not a hop — see the walk's docblock. */
  | 'local'
  /** Used, and no import in the file leads anywhere we can read. */
  | 'unresolved'
  /** Inside the project, and the depth bound stopped the walk before reading it. */
  | 'beyond';

export interface TreeNode {
  /** As written where it is used: a JSX name, or a template's selector. */
  name: string;
  /** Project-relative, where the walk resolved and read one. */
  file: string | null;
  at: Leaf;
  children: TreeNode[];
}

export interface ScreenTree {
  /** The element the screen's own file renders outermost — its holder. */
  root: TreeNode;
  /** The bound that was applied, in file hops. Stated, so a reader can tell. */
  depth: number;
  /** True where a resolvable child went unread because the bound stopped it. */
  truncated: boolean;
  /**
   * Every file read, absolute. The material a cache key is made of: an answer
   * derived through four files is stale when any of the four changes, and a key
   * covering only the screen would serve a stale tree until the screen itself
   * was touched.
   */
  read: string[];
}

export interface TreeOptions {
  depth?: number;
}

/**
 * What a screen renders, resolved through the repository to a stated depth.
 *
 * Everything this tool reads about a screen it used to read from the screen's
 * own file, and on a real project that file is a wiring file: it renders one or
 * two components and the anatomy that makes it *that kind of screen* is one
 * level below, inside them (#10).
 *
 * **One level per file, and depth counts files.** The node for a component is
 * the outermost element its own file renders, and that node's children are what
 * that element directly holds. A component declared in the same file is
 * reported as `local` and not walked: it is not a hop, and finding the JSX root
 * of a named declaration is a different reader from the one that finds a file's
 * screen root.
 *
 * Bounded, and the bound is in the answer. An unbounded walk on a real
 * repository reads the design system.
 */
export async function screenTree(
  rootDir: string,
  file: string,
  options: TreeOptions = {},
): Promise<ScreenTree | null> {
  const depth = Math.min(Math.max(1, options.depth ?? DEFAULT_DEPTH), MAX_DEPTH);
  const resolve = await resolverFor(rootDir);
  const read = new Set<string>();
  const state = { truncated: false };

  const root = await nodeFor(rootDir, file, depth, resolve, read, state, new Set());
  if (root === null) return null;
  return { root, depth, truncated: state.truncated, read: [...read] };
}

interface State {
  truncated: boolean;
}

/**
 * One file's contribution: what it renders outermost, and what that holds.
 *
 * `seen` is the cycle guard. Two components that render each other is not a
 * hypothetical — a layout rendering a slot that renders the layout is ordinary
 * — and without it the walk recurses until the depth saves it, having read the
 * same files twice on the way.
 */
async function nodeFor(
  rootDir: string,
  file: string,
  left: number,
  resolve: Resolver,
  read: Set<string>,
  state: State,
  seen: Set<string>,
): Promise<TreeNode | null> {
  const pair = await pairOf(file);
  const identity = pair?.identity ?? file;
  if (seen.has(identity)) return null;

  const own = await readFile(identity, 'utf8').catch(() => null);
  if (own === null) return null;
  read.add(identity);

  const markup = pair === null ? { path: file, source: own } : await markupOf(identity, own);
  if (markup.path !== identity) read.add(markup.path);

  // One reader for both dialects. `shapeOf` already dispatches on the kind and
  // already computes the holder and what it directly holds — a second copy of
  // that here would be the fourth `body` walk in the repository.
  const kind = templateKind(markup.path);
  const shape = shapeOf(markup.source, kind ?? undefined);
  if (shape === null || shape.holder === null) return null;
  const surface = { holder: shape.holder, children: shape.body };

  const next = new Set(seen).add(identity);
  const children: TreeNode[] = [];
  for (const name of surface.children) {
    children.push(
      await childNode(rootDir, identity, own, name, kind, left, resolve, read, state, next),
    );
  }

  return {
    name: surface.holder,
    file: relative(rootDir, identity),
    at: 'project',
    children,
  };
}

/**
 * One child, resolved as far as the file it was used in allows.
 *
 * The two dialects name their children by different things and so resolve
 * through different evidence: a JSX name is an imported binding, and a template
 * name is a **selector** a class states about itself. Deriving one from the
 * other — `app-orders-grid` from `OrdersGridComponent` — would be a convention
 * invented here, and a project is free to prefix its selectors however it likes.
 */
async function childNode(
  rootDir: string,
  from: string,
  source: string,
  name: string,
  kind: ReturnType<typeof templateKind>,
  left: number,
  resolve: Resolver,
  read: Set<string>,
  state: State,
  seen: Set<string>,
): Promise<TreeNode> {
  const specifiers = importsIn(source);
  const target =
    kind === null
      ? await throughImport(from, name, specifiers, resolve)
      : await throughSelector(from, name, specifiers, resolve, read);

  if (target === null) {
    return { name, file: null, at: whyNot(source, name, specifiers, kind, resolve), children: [] };
  }

  if (left <= 1) {
    state.truncated = true;
    return { name, file: relative(rootDir, target), at: 'beyond', children: [] };
  }

  const node = await nodeFor(rootDir, target, left - 1, resolve, read, state, seen);
  if (node === null) {
    return { name, file: relative(rootDir, target), at: 'project', children: [] };
  }
  // The name at the call site is what the reader is looking at; the node's own
  // name is the element that file renders, which becomes its single child.
  return { name, file: relative(rootDir, target), at: 'project', children: [node] };
}

/** A JSX child is an imported binding, or it is not ours to follow. */
async function throughImport(
  from: string,
  name: string,
  specifiers: Map<string, string>,
  resolve: Resolver,
): Promise<string | null> {
  const specifier = specifiers.get(name);
  if (specifier === undefined) return null;
  return resolve.find(from, specifier);
}

/**
 * A template child is a selector, and the class that answers to it is one of
 * the files this file imports.
 *
 * Bounded by the importing file's own imports, which is both cheap and the
 * right scope: a component that is not imported here cannot be rendered here,
 * standalone or through a module.
 */
async function throughSelector(
  from: string,
  selector: string,
  specifiers: Map<string, string>,
  resolve: Resolver,
  read: Set<string>,
): Promise<string | null> {
  for (const specifier of new Set(specifiers.values())) {
    const candidate = await resolve.find(from, specifier);
    if (candidate === null) continue;
    read.add(candidate);
    if ((await selectorOf(candidate)) === selector) return candidate;
  }
  return null;
}

/** Local binding name → the specifier it was imported from. */
function importsIn(source: string): Map<string, string> {
  const found = new Map<string, string>();
  const ast = parseModule(source);
  if (ast === null) return found;

  walk(ast.program, (node) => {
    if (node.type !== 'ImportDeclaration') return;
    for (const specifier of node.specifiers) {
      found.set(specifier.local.name, node.source.value);
    }
  });
  return found;
}

/**
 * Is this name declared in the file that uses it?
 *
 * Only to tell `local` from `unresolved`, which is the difference between *we
 * know where this is and chose not to walk it* and *we could not tell*.
 */
function declares(source: string, name: string): boolean {
  const ast = parseModule(source);
  if (ast === null) return false;

  let found = false;
  walk(ast.program, (node) => {
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
      if (node.id.name === name) found = true;
    }
    if (node.type === 'FunctionDeclaration' && node.id?.name === name) found = true;
    if (node.type === 'ClassDeclaration' && node.id?.name === name) found = true;
  });
  return found;
}

/**
 * Which kind of leaf an unresolved child is.
 *
 * Four answers and they are not interchangeable. A component from an external
 * library is where the walk is *supposed* to stop; one declared in this file is
 * known and deliberately not a hop; a specifier that led nowhere is a gap in
 * what was read. Reporting them all as "nothing below" is how a walk claims a
 * depth it did not reach.
 */
function whyNot(
  source: string,
  name: string,
  specifiers: Map<string, string>,
  kind: ReturnType<typeof templateKind>,
  resolve: Resolver,
): Leaf {
  // A template names its children by selector, so there is no specifier to
  // classify: either a class in the imports answered to it or nothing did.
  if (kind !== null) return 'unresolved';

  const specifier = specifiers.get(name);
  if (specifier === undefined) return declares(source, name) ? 'local' : 'unresolved';
  return resolve.shape(specifier) === 'package' ? 'external' : 'unresolved';
}

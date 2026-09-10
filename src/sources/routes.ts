import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path';
import { exportedSymbolsFromSource } from '../inventory/exports.js';
import { parseModule } from '../parse/parse.js';
import { constantsFor, type Constants } from './constants.js';
import type { Node, ObjectExpression } from '@babel/types';

/** Where a screen sits in the application, as far as the code says. */
export interface Placement {
  /**
   * How this project registers routes, or null when nothing claims this screen.
   *
   * `file` — the directory *is* the route: the Next.js app router, SvelteKit.
   * `declared` — a route table or markup names the screen.
   */
  style: 'file' | 'declared' | null;
  /**
   * The URL path, when it is knowable.
   *
   * Composed from the table that **mounts** this screen's table where the entry
   * registering it states no path of its own (#263) — an `index: true` child, a
   * guard wrapper. Null where no mount can be found, or where more than one
   * mounts the same table: a partial prefix is never presented as a full path.
   */
  path: string | null;
  /**
   * The trail the path implies.
   *
   * The reason breadcrumbs are got wrong nearly every time: the trail encodes
   * the navigation hierarchy, which lives in the router and not in the file
   * being edited.
   */
  trail: string[];
  /** Where the route is registered, for a project that declares them. */
  declaredIn: { file: string; line: number } | null;
  /**
   * Whether any segment of the path was written as a constant rather than a
   * literal.
   *
   * A resolved path and a literal one are not equally safe to repeat back. The
   * literal is what the table says; the resolved one is what a lookup made of
   * it, and a reader who can see which is which can check the enum when a path
   * looks wrong. `false` where nothing was resolved, and where there is no path
   * at all (#36).
   */
  pathFromConstant: boolean;
}

/** The file names a router-based framework gives to a screen. */
const ROUTE_SCREEN = /^\+?page\.[jt]sx?$|^\+page\.svelte$/;
/** The directory a file-routed project keeps its routes under. */
const ROUTES_ROOT = /^(app|routes|pages)$/;
/**
 * Files worth reading when looking for a declaration. Kept small on purpose.
 *
 * The second half is Angular's, and it is how every module-based Angular
 * application registers a route: `crm-routing.module.ts` beside the component
 * it routes. It matched nothing here, at any depth (#224). `foo.routes.ts` and
 * `app.routes.ts` — the standalone spelling — were already matched by the
 * first half, which is why only the module form is added.
 */
const ROUTE_TABLE = /(routes?|router|app)\.[jt]sx?$|routing\.module\.[jt]s$/i;
/** A directory whose whole contents are the routing, as Vue Router is written. */
const ROUTE_DIR = /^(router|routes)$/i;
const SKIP_DIR =
  /^(node_modules|dist|build|out|coverage|\.git|\.next|\.svelte-kit|mock|mocks|__mocks__|fixtures?|tests?|e2e|cypress)$/i;
/** A route file is small; a bundle is not. */
const MAX_TABLE_BYTES = 200_000;
const MAX_TABLES = 40;
/**
 * How much looking one screen may cost.
 *
 * A budget rather than a depth, which is the shape `siblings.ts` already uses
 * and for the same reason: a depth is a statement about somebody else's
 * repository layout, and it was wrong about the ordinary Nx one — four
 * directories from the root, where every route table is five or more (#224). A
 * budget degrades into a miss, never into a wrong answer.
 */
const MAX_READS = 40;
/** How many names one screen may be known by, when its file exports several. */
const MAX_NAMES = 8;

/** A line that binds a screen to a route, in any of the styles. */
const BINDS = /\b(component|element|lazy|loadChildren)\b|\bimport\s*\(|<Route\b/;

/** A route group — `(dashboard)` — is grouping, not a path segment. */
const isGroup = (segment: string): boolean => /^\(.*\)$/.test(segment);

function fileRoutedPath(screen: string, root: string): string[] | null {
  if (!ROUTE_SCREEN.test(basename(screen))) return null;

  const parts = relative(root, dirname(screen)).split(sep).filter((part) => part !== '');
  const at = parts.findIndex((part) => ROUTES_ROOT.test(part));
  if (at < 0) return null;

  return parts.slice(at + 1).filter((part) => !isGroup(part));
}

/**
 * Route tables, nearest to the screen first.
 *
 * Outward from the screen's own directory to the project root, reading each
 * ancestor and taking one look into the folders beside it — which is where a
 * `router/` or `routes/` directory sits. Nearest first is not only cheaper: it
 * decides *which* table wins when two name the same screen, and the near one is
 * the one that routes it. An application shell mounting a feature is a
 * different statement about a different thing.
 *
 * Bounded by reads rather than by depth, so what it costs does not depend on
 * how deeply somebody else nested their libraries.
 */
async function tablesNear(screen: string, root: string): Promise<string[]> {
  const found: string[] = [];
  const seen = new Set<string>();
  let budget = MAX_READS;

  const collect = async (dir: string, skip: string | null, descend: boolean): Promise<void> => {
    if (budget <= 0 || found.length >= MAX_TABLES) return;
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => null);
    budget--;
    if (entries === null) return;

    const folders: string[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith('.') || SKIP_DIR.test(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (path !== skip) folders.push(path);
        continue;
      }
      if (!ROUTE_TABLE.test(entry.name) && !ROUTE_DIR.test(basename(dir))) continue;
      if (seen.has(path)) continue;
      seen.add(path);
      found.push(path);
      if (found.length >= MAX_TABLES) return;
    }

    // One level in, never further: a route table is kept beside the screens it
    // routes or in a `router/` folder next to them, and descending a whole
    // subtree from every ancestor is the repository walk the budget exists to
    // prevent.
    if (!descend) return;
    for (const folder of folders) {
      if (budget <= 0 || found.length >= MAX_TABLES) return;
      await collect(folder, null, false);
    }
  };

  let dir = dirname(screen);
  let from: string | null = null;
  for (;;) {
    await collect(dir, from, true);
    if (dir === root || budget <= 0) break;
    const next = dirname(dir);
    if (next === dir) break;
    from = dir;
    dir = next;
  }
  return found;
}

/**
 * Every name a route entry might call this screen by.
 *
 * Its file name, and what the file exports. A React page and its file agree —
 * `OrdersPage.tsx` exports `OrdersPage` — but an Angular component does not:
 * `crm.component.ts` exports `CrmComponent`, and the route module names the
 * class. Reading the export is how that is known without a table of framework
 * naming conventions.
 */
async function namesOf(screen: string): Promise<string[]> {
  // `index` matches every route entry in the file, so for an index file the
  // name that identifies it is its folder — measured on `vue-element-admin`,
  // where `src/views/dashboard/index.vue` matched a mock's `component: 'index'`
  // and was reported as `/redirect/:path*`.
  const bare = basename(screen).replace(/\.[jt]sx?$|\.vue$|\.svelte$/, '');
  const names = [/^(index|\+?page)$/i.test(bare) ? basename(dirname(screen)) : bare];

  const source = await readFile(screen, 'utf8').catch(() => null);
  if (source !== null && source.length <= MAX_TABLE_BYTES) {
    for (const exported of exportedSymbolsFromSource(source)) {
      // Only what a route entry could be naming. A screen file also exports
      // helpers, and one called `routes` or `config` matches every line of a
      // route table — which would turn this from a miss into a wrong answer,
      // the one direction that is not allowed. Not a vocabulary: the initial
      // capital is how a component is spelled in every framework read here.
      if (!/^[A-Z]/.test(exported)) continue;
      if (!names.includes(exported)) names.push(exported);
      if (names.length >= MAX_NAMES) break;
    }
  }
  return names;
}

/**
 * The path a route table or a piece of markup registers for this screen.
 *
 * Searched by the screen's own name — the component it exports, or its file —
 * because that is what a route entry names, in every style: `{ path:
 * 'settings', component: Settings }`, `<Route path="/login" component={Login}>`,
 * `component: () => import('@/views/settings')`.
 */
async function declaredPath(
  screen: string,
  root: string,
): Promise<{
  path: string | null;
  declaredIn: { file: string; line: number };
  /** The array in that table the entry sits in, where exactly one contains it. */
  binding: string | null;
  /** Whether the table wrote it whole — see `Found.absolute`. */
  absolute: boolean;
  /** Whether a constant had to be resolved to read it. */
  fromConstant: boolean;
} | null> {
  const names = await namesOf(screen);

  const found = await tablesNear(screen, root);

  for (const file of found) {
    if (file === screen) continue;
    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null || source.length > MAX_TABLE_BYTES) continue;
    if (!names.some((name) => source.includes(name))) continue;

    const ast = parseModule(source, file);
    if (ast === null) continue;

    // Read once per table, before the walk. A project that keeps its paths in
    // an enum writes every one of them as a reference, so this is the whole
    // difference between 117 screens with a path and 117 without (#36).
    //
    // Asked for by name, so a table whose paths are all literals reads nothing:
    // this runs on the registration, which the derived contract asks for on
    // every edit, and a table imports every screen it registers.
    const constants = await constantsFor(file, source, moduleAt, namedPaths(ast.program as Node));

    const entry = entryFor(ast.program as Node, names, [], false, constants);
    if (entry !== null) {
      // Asked by walking the same table with nothing resolvable rather than by
      // threading a flag through every frame: the question is exactly *would
      // this path have been readable without the constants*, and that is what
      // the second walk answers. One file, already parsed.
      const literal =
        constants.size === 0 ? entry : entryFor(ast.program as Node, names, [], false);
      return {
        path: entry.path,
        declaredIn: { file, line: entry.line },
        binding: bindingOf(ast.program as Node, names, entry, constants),
        absolute: entry.absolute,
        fromConstant: entry.path !== null && literal?.path !== entry.path,
      };
    }
  }
  return null;
}

/**
 * Which of the table's arrays the entry that was found sits in.
 *
 * Read afterwards rather than instead: the answer above is still the one the
 * whole-program walk gives, so nothing about which entry wins moves. The array
 * is identified by re-walking each binding and matching the line, and a line
 * belongs to one route object. Ambiguous or outside every binding — a table
 * that builds its routes in a call, say — answers null, and null means no
 * mount is looked for rather than a guess at which array was meant.
 */
function bindingOf(program: Node, names: string[], entry: Found, constants: Constants): string | null {
  let binding: string | null = null;
  let hits = 0;
  for (const array of tableArrays(program)) {
    const found = entryFor(array.node, names, [], false, constants);
    if (found === null || found.line !== entry.line) continue;
    binding = array.name;
    hits++;
  }
  return hits === 1 ? binding : null;
}

/**
 * A route entry, as the table writes it — the object, not the line.
 *
 * The path was read from the binding line, the one above, the one below, or two
 * above, and in a nested table that window belongs to a **different route**
 * (#254). Measured on a real monorepo: of 117 screens registered in 25 tables,
 * 72 are `index: true` and have no path of their own, and 52 of those were given
 * one anyway — eleven different screens each reported as the "create" sibling's
 * `/new/*`. A wrong answer, where `src/layers/cache.ts` states the failure
 * direction must always be a miss.
 *
 * So the unit is the route object and the path composes down the tree. An
 * `index` entry states no path and inherits its parent's, which is what `index`
 * means.
 */
const PATH_KEYS = new Set(['path']);
/** The properties by which a route entry names the thing it routes. */
const BINDING_KEYS = new Set(['component', 'Component', 'element', 'lazy', 'loadChildren']);
/** Where a parent keeps the routes nested under it. */
const CHILD_KEYS = new Set(['children', 'routes']);
/** `<Route>`, `<PrivateRoute>`, `<Ionic.Route>` — anything routing-shaped. */
const ROUTE_TAG = /Route$/;

/**
 * The segments as one path, or null where no segment was ever stated.
 *
 * A pathless entry — `{ element: <Layout /> }` wrapping children — is a real
 * shape and it has no path of its own. Answering `/` for it would be inventing
 * one, and the entry below it in the file used to supply something worse.
 */
const segmentsOf = (segments: string[]): string[] =>
  segments.flatMap((one) => one.split('/')).filter((one) => one !== '');

const joined = (segments: string[]): string | null =>
  segments.length === 0 ? null : `/${segmentsOf(segments).join('/')}`;

/**
 * The same segments, read as a parent's prefix rather than as an entry's own path.
 *
 * `{ path: 'orders/*', children: [...] }` is a router saying "and everything
 * below": the children continue from `orders`, and the splat is how the parent
 * admits them rather than a segment of anybody's path. Left in, it composed
 * into a child path with `*` in the middle and into a trail carrying `*` as
 * though a breadcrumb could point at it.
 *
 * An entry's own path keeps its splat, because there it is the answer: `/docs/*`
 * is genuinely where a screen routed for everything under `docs` lives.
 */
const asPrefix = (segments: string[]): string[] => {
  const parts = segmentsOf(segments);
  return parts[parts.length - 1] === '*' ? parts.slice(0, -1) : parts;
};

/** Did the table write this path whole, from the root? */
const isRooted = (own: string[]): boolean => own.some((one) => one.startsWith('/'));

/** Nothing resolvable, for every walk that is not reading a path. */
const NO_CONSTANTS: Constants = new Map();

/**
 * The string a node writes, resolving a constant the file can see.
 *
 * `path: RoutePaths.Dashboard` and `` path: `${RoutePaths.Groups}/:groupId` ``
 * are both ordinary React, and reading only the literal answered `path: null`
 * for every screen in an application (#36). Resolution is a **lookup** in a map
 * built from declarations, never a reading of the name: an unknown constant is
 * absent from the map and the answer stays null, which is a miss and not a
 * guess.
 */
const stringOf = (node: Node | null | undefined, constants: Constants = NO_CONSTANTS): string | null => {
  if (node === null || node === undefined) return null;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral') {
    if (node.expressions.length === 0) return node.quasis[0]?.value.cooked ?? null;
    // Every part or nothing. A template with one unreadable expression is a
    // partial path, and a partial path presented as a whole one is the failure
    // the mount composition already forbids.
    let out = '';
    for (const [at, quasi] of node.quasis.entries()) {
      out += quasi.value.cooked ?? '';
      const expression = node.expressions[at];
      if (expression === undefined) continue;
      const value = named(expression as Node, constants);
      if (value === null) return null;
      out += value;
    }
    return out;
  }
  return named(node, constants);
};

/** A constant by the name written at the use site, or null where it is not one. */
function named(node: Node, constants: Constants): string | null {
  if (constants.size === 0) return null;
  const key = dotted(node);
  return key === null ? null : (constants.get(key) ?? null);
}

/**
 * The root identifiers this table writes its paths with.
 *
 * `RoutePaths` from `path: RoutePaths.Dashboard`, and from inside a template
 * literal. Empty on a table that writes literals, which is what keeps the
 * resolution free for every project that already worked.
 */
function namedPaths(program: Node): Set<string> {
  const wanted = new Set<string>();

  const want = (node: Node | null | undefined): void => {
    if (node === null || node === undefined) return;
    if (node.type === 'TemplateLiteral') {
      for (const expression of node.expressions) want(expression as Node);
      return;
    }
    const key = dotted(node);
    if (key !== null) wanted.add(key.split('.')[0]!);
  };

  const visit = (node: Node): void => {
    if (node.type === 'ObjectExpression') {
      for (const property of node.properties) {
        if (property.type !== 'ObjectProperty') continue;
        const key =
          property.key.type === 'Identifier'
            ? property.key.name
            : property.key.type === 'StringLiteral'
              ? property.key.value
              : null;
        if (key !== null && PATH_KEYS.has(key)) want(property.value as Node);
      }
    }
    if (node.type === 'JSXOpeningElement') {
      for (const attribute of node.attributes) {
        if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier') continue;
        if (!PATH_KEYS.has(attribute.name.name)) continue;
        if (attribute.value?.type === 'JSXExpressionContainer') {
          want(attribute.value.expression as Node);
        }
      }
    }
    for (const child of inside(node)) visit(child);
  };
  visit(program);

  return wanted;
}

/** `RoutePaths.Dashboard`, `Paths.Routes.Home`, `DASHBOARD` — as written. */
function dotted(node: Node): string | null {
  if (node.type === 'Identifier') return node.name;
  if (node.type !== 'MemberExpression' || node.computed) return null;
  const object = dotted(node.object as Node);
  if (object === null) return null;
  const property = node.property.type === 'Identifier' ? node.property.name : null;
  return property === null ? null : `${object}.${property}`;
}

/** Every child node, without knowing what kind of node this is. */
function inside(node: Node): Node[] {
  const found: Node[] = [];
  for (const key of Object.keys(node)) {
    if (key === 'loc') continue;
    const value = (node as unknown as Record<string, unknown>)[key];
    const one = (candidate: unknown): void => {
      if (candidate !== null && typeof candidate === 'object' && 'type' in candidate) {
        found.push(candidate as Node);
      }
    };
    if (Array.isArray(value)) value.forEach(one);
    else one(value);
  }
  return found;
}

/** Does this subtree name the screen — as an identifier, a tag, or a specifier? */
function namesScreen(node: Node, names: string[], stopAtNestedRoute: boolean): boolean {
  const visit = (current: Node, top: boolean): boolean => {
    if (stopAtNestedRoute && !top && current.type === 'JSXElement') {
      const tag = current.openingElement.name;
      if (tag.type === 'JSXIdentifier' && ROUTE_TAG.test(tag.name)) return false;
    }
    if (current.type === 'Identifier' && names.includes(current.name)) return true;
    if (current.type === 'JSXIdentifier' && names.includes(current.name)) return true;
    // `component: () => import('@/views/orders/index')` names no identifier.
    const literal = stringOf(current);
    if (literal !== null && names.some((name) => literal.split(/[/.]/).includes(name))) return true;
    return inside(current).some((child) => visit(child, false));
  };
  return visit(node, true);
}

interface Found {
  /**
   * The path, or null where the entry states none and no ancestor does.
   *
   * A pathless entry — `{ element: <Layout />, children: [...] }` — is a real
   * shape, and it registers the screen while saying nothing about where it
   * sits. Those are two different facts and only one of them is missing, so
   * `declaredIn` still names the table: the family comes from *which table
   * registers this screen*, not from the path (#254, #225).
   */
  path: string | null;
  line: number;
  /**
   * Did the table write this path, or one it is nested under, absolute?
   *
   * `{ path: '/settings/tokens' }` is a whole path and not a segment: Vue
   * Router reads the leading slash as the root, and React Router refuses a
   * nested absolute path that does not already begin with its parent's. Either
   * way nothing above it may be composed on — including the path of a table
   * that mounts it, which is why the answer has to travel this far.
   */
  absolute: boolean;
}

/**
 * Walk the table, composing the path, and stop at the entry that binds it.
 *
 * Depth-first and prefix-carrying, so a child's path is its parent's plus its
 * own and an `index` entry is its parent's exactly. Nothing is ever read from a
 * neighbouring entry, which is the whole of the defect.
 */
interface Parts {
  /** The path segments the entry states of its own. */
  own: string[];
  /** What it routes, where it routes something. */
  binding: Node | null;
  /** The entries nested under it, where the table writes them out. */
  children: Node[];
  /** What it nests, where that is a reference to a table written elsewhere. */
  mounted: Node[];
}

/**
 * One route entry, read as its four parts.
 *
 * Shared by the walk that looks for a screen and the walk that looks for a
 * mount, so the two cannot disagree about what a route object is — which is the
 * failure mode a second hand-written reader would have.
 */
function routeParts(node: ObjectExpression, constants: Constants = NO_CONSTANTS): Parts {
  const own: string[] = [];
  let binding: Node | null = null;
  let children: Node[] = [];
  const mounted: Node[] = [];

  for (const property of node.properties) {
    if (property.type !== 'ObjectProperty') continue;
    const key =
      property.key.type === 'Identifier'
        ? property.key.name
        : property.key.type === 'StringLiteral'
          ? property.key.value
          : null;
    if (key === null) continue;

    if (PATH_KEYS.has(key)) {
      const written = stringOf(property.value as Node, constants);
      if (written !== null) own.push(written);
    } else if (BINDING_KEYS.has(key)) {
      binding = property.value as Node;
    } else if (CHILD_KEYS.has(key)) {
      const value = property.value as Node;
      if (value.type === 'ArrayExpression') {
        children = value.elements.filter((one) => one !== null) as Node[];
        // `children: [...orderRoutes]` — a table written elsewhere, spread in
        // beside entries written here.
        for (const element of value.elements) {
          if (element !== null && element.type === 'SpreadElement') {
            mounted.push(element.argument as Node);
          }
        }
      } else {
        // `children: orderRoutes`, `children: m.orderRoutes`.
        mounted.push(value);
      }
    }
  }
  return { own, binding, children, mounted };
}

function entryFor(
  node: Node,
  names: string[],
  prefix: string[],
  absolute = false,
  constants: Constants = NO_CONSTANTS,
): Found | null {
  if (node.type === 'ObjectExpression') {
    const { own, binding, children } = routeParts(node, constants);
    const rooted = isRooted(own);
    const here = rooted ? [...own] : [...prefix, ...own];
    // The binding is checked before the children, so a parent that routes the
    // screen itself wins over a child that merely mentions it.
    if (binding !== null && namesScreen(binding, names, false)) {
      return { path: joined(here), line: node.loc?.start.line ?? 1, absolute: absolute || rooted };
    }
    for (const child of children) {
      const found = entryFor(child, names, asPrefix(here), absolute || rooted, constants);
      if (found !== null) return found;
    }
    return null;
  }

  if (node.type === 'JSXElement') {
    const tag = node.openingElement.name;
    if (tag.type === 'JSXIdentifier' && ROUTE_TAG.test(tag.name)) {
      const own: string[] = [];
      const bindings: Node[] = [];
      for (const attribute of node.openingElement.attributes) {
        if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier') continue;
        const value =
          attribute.value?.type === 'JSXExpressionContainer'
            ? (attribute.value.expression as Node)
            : ((attribute.value ?? null) as Node | null);
        if (PATH_KEYS.has(attribute.name.name)) {
          const written = stringOf(value, constants);
          if (written !== null) own.push(written);
        } else if (BINDING_KEYS.has(attribute.name.name) && value !== null) {
          bindings.push(value);
        }
      }
      const rooted = isRooted(own);
      const here = rooted ? [...own] : [...prefix, ...own];

      // Bound by an attribute, or by simply being rendered inside — which is how
      // react-router v5 and Ionic write it, and that line carries no attribute
      // at all. A nested `<Route>` is not read: it is its own entry.
      if (
        bindings.some((one) => namesScreen(one, names, false)) ||
        namesScreen(node, names, true)
      ) {
        return { path: joined(here), line: node.loc?.start.line ?? 1, absolute: absolute || rooted };
      }
      for (const child of node.children) {
        const found = entryFor(child as Node, names, asPrefix(here), absolute || rooted, constants);
        if (found !== null) return found;
      }
      return null;
    }
  }

  for (const child of inside(node)) {
    const found = entryFor(child, names, prefix, absolute, constants);
    if (found !== null) return found;
  }
  return null;
}

/**
 * How much looking for a mount may cost, in directories read plus files read.
 *
 * Larger than the table search's budget by two orders of magnitude, and that is
 * affordable because this half runs nowhere near an edit: `placementOf` has one
 * consumer outside this module — `uic place` — and `declaredSiblings`, which is
 * what the derived contract reaches, asks for the registration and never for
 * the path. A deliberate command may read a project; a hook may not.
 *
 * Since #1 every screen whose registration states a *relative* path pays it too,
 * where before only a pathless one did: whether something mounts the table is
 * exactly the question, and it cannot be answered without looking. Measured on a
 * 24,752-file monorepo, one screen: 0.10 s to 2.8 s. A path the table wrote
 * absolute is already whole, so it is answered without looking at all.
 *
 * Exhausting it answers null. A search that did not finish cannot say the mount
 * it found was the only one, and answering from an unfinished search is the
 * invention this module refuses.
 */
const MAX_MOUNT_READS = 20_000;
/** How far up a chain of mounted tables to follow. One hop is the common shape. */
const MAX_MOUNT_HOPS = 4;
/** The files a mount could be written in. */
const MOUNT_FILE = /\.[jt]sx?$/;

/**
 * Is this name distinctive enough that meeting it in another file is evidence?
 *
 * The whole match rests on the name: the real specifier is an alias
 * (`@client-ui/customers-invoices`) or a lazy `import()` module object, so nothing
 * proves the array found elsewhere is *this* file's. A name of two words or
 * more — `customerInvoiceRoutes`, `admin_routes` — is its own evidence. A bare
 * `routes` or `children` is in every table in a repository, and composing from
 * one would invent a prefix.
 *
 * A shape test and not a list of words, so it says nothing about what a project
 * is allowed to call things.
 */
const isDistinctive = (name: string): boolean =>
  name.split(/[_$-]+|(?<=[a-z0-9])(?=[A-Z])/).filter((one) => one !== '').length >= 2;

/** Does this expression name the table — directly, or as a member of a module? */
function referencesTable(node: Node, identifier: string): boolean {
  if (node.type === 'Identifier') return node.name === identifier;
  // `m.customerInvoiceRoutes`, where `m` is a lazily imported module object. What
  // `m` resolves to is not pursued; the property name is what is matched.
  if (node.type === 'MemberExpression') {
    return node.property.type === 'Identifier' && node.property.name === identifier;
  }
  return false;
}

/**
 * Every top-level array a module binds a name to, plus its default export.
 *
 * The name is what another file can mount, and it is also what tells one array
 * in a table from another — a table exporting several is where picking the
 * wrong one would compose a wrong prefix.
 */
function tableArrays(program: Node): { name: string | null; node: Node }[] {
  const found: { name: string | null; node: Node }[] = [];
  const body = (program as unknown as { body?: Node[] }).body ?? [];

  for (const statement of body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? (statement.declaration as Node | null) : statement;
    if (declaration !== null && declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type !== 'Identifier') continue;
        if (declarator.init?.type !== 'ArrayExpression') continue;
        found.push({ name: declarator.id.name, node: declarator.init as Node });
      }
    } else if (
      statement.type === 'ExportDefaultDeclaration' &&
      statement.declaration.type === 'ArrayExpression'
    ) {
      found.push({ name: null, node: statement.declaration as Node });
    }
  }
  return found;
}

/** Every path under which this subtree mounts the named table. */
function mountsIn(node: Node, identifier: string, prefix: string[], out: (string | null)[]): void {
  if (node.type === 'ObjectExpression') {
    const { own, children, mounted } = routeParts(node);
    const here = [...prefix, ...own];
    if (mounted.some((one) => referencesTable(one, identifier))) out.push(joined(asPrefix(here)));
    for (const child of children) mountsIn(child, identifier, asPrefix(here), out);
    return;
  }
  for (const child of inside(node)) mountsIn(child, identifier, prefix, out);
}

/** A file mounting a table, and the binding of its own that it does so from. */
interface Mount {
  path: string | null;
  file: string;
  binding: string | null;
}

/**
 * Remembered for the life of the process, which is one command.
 *
 * The sources are kept as well as the file list, because a chain of mounted
 * tables reads the same files once per hop and the second hop is the ordinary
 * case rather than the rare one: it is what establishes that nobody mounts the
 * table above, which is how the climb learns it has reached the top. Bounded by
 * bytes and not by count — beyond the bound a file is simply read again.
 */
const sweptFiles = new Map<string, string[]>();
const foundMounts = new Map<string, string[] | null>();
const sources = new Map<string, string>();
let cached = 0;
const MAX_CACHED_BYTES = 32_000_000;

/**
 * Every source file under the project, bounded.
 *
 * A sweep and not a name test, and the reason is measured: the file that mounts
 * a table is called `shellConfig.tsx` in the repository this was found on and
 * `Root.tsx` in the reproduction, and neither matches any routing-file pattern
 * — nor does the walk that finds route tables ever descend far enough to reach
 * the first. Both were checked before this was written: the candidate set for a
 * screen with `path: null` contained exactly one file, its own table.
 */
async function filesUnder(root: string, budget: { left: number }): Promise<string[] | null> {
  const remembered = sweptFiles.get(root);
  if (remembered !== undefined) return remembered;

  const found: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    if (budget.left <= 0) return null;
    budget.left--;
    const dir = stack.pop()!;
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => null);
    if (entries === null) continue;
    for (const entry of entries) {
      if (entry.name.startsWith('.') || SKIP_DIR.test(entry.name)) continue;
      const path = join(dir, entry.name);
      // `isFile`, and not "not a directory": a symlink is neither, and a
      // planted `*.tsx` link is how a sweep reads a file outside the project
      // it was pointed at (#174 was the same shape, through a `tsconfig`
      // alias). A symlinked directory is not descended for the same reason.
      if (entry.isDirectory()) stack.push(path);
      else if (entry.isFile() && MOUNT_FILE.test(entry.name)) found.push(path);
    }
  }
  sweptFiles.set(root, found);
  return found;
}

/**
 * Who mounts this table, or null where that cannot be said.
 *
 * Null covers both refusals: the budget ran out, so the search is unfinished;
 * or more than one place mounts the same array, in which case naming one of
 * them is inventing the others away.
 */
async function mountsFor(
  table: string,
  identifier: string,
  files: string[],
  budget: { left: number },
): Promise<Mount[] | null> {
  const found = new Map<string, Mount>();

  for (const file of files) {
    const remembered = sources.get(file);
    let source = remembered ?? null;
    if (remembered === undefined) {
      if (budget.left <= 0) return null;
      budget.left--;
      source = await readFile(file, 'utf8').catch(() => null);
      if (source !== null && cached + source.length <= MAX_CACHED_BYTES) {
        sources.set(file, source);
        cached += source.length;
      }
    }
    if (source === null || source.length > MAX_TABLE_BYTES) continue;
    if (!source.includes(identifier)) continue;

    const ast = parseModule(source, file);
    if (ast === null) continue;
    for (const array of tableArrays(ast.program as Node)) {
      // A parent and the array it mounts are often written in one file — the
      // shape a single-file router has — so the file is read like any other.
      // What may not be read is the table *itself*: an array walked looking for
      // a mount of its own name would answer with its own entries' paths.
      if (file === table && array.name === identifier) continue;
      const paths: (string | null)[] = [];
      mountsIn(array.node, identifier, [], paths);
      for (const path of paths) {
        found.set(`${file}\u0000${array.name ?? ''}\u0000${path ?? ''}`, {
          path,
          file,
          binding: array.name,
        });
      }
    }
  }

  const mounts = [...found.values()];
  return mounts.length > 1 ? null : mounts;
}

/**
 * The path segments the tables above this one contribute, or null.
 *
 * A routes array exported from one file and mounted under a path in another
 * never composed: the child table knows the screen, the parent knows the path,
 * and the reader only ever read the table naming the screen (#263). Measured on
 * a real React monorepo, that was 50 of 117 screens answering `path: null`.
 *
 * Climbing stops at the first table nobody mounts, which is the application
 * root and not a failure. It refuses outright — null, never a partial prefix
 * presented as a whole path — where a hop is ambiguous or the search is
 * unfinished.
 */
async function mountPrefix(
  table: string,
  identifier: string,
  root: string,
  reads: number,
): Promise<string[] | null> {
  if (!isDistinctive(identifier)) return null;
  // The budget is part of the key: a caller that asked for a cheaper search
  // must not answer for one that asked for a complete one.
  const key = `${root}\u0000${table}\u0000${identifier}\u0000${reads}`;
  const remembered = foundMounts.get(key);
  if (remembered !== undefined) return remembered;

  const answer = await climb(table, identifier, root, reads);
  foundMounts.set(key, answer);
  return answer;
}

async function climb(
  table: string,
  identifier: string,
  root: string,
  reads: number,
): Promise<string[] | null> {
  const segments: string[] = [];
  const seen = new Set<string>();
  let from = { file: table, name: identifier as string | null };

  for (let hop = 0; hop < MAX_MOUNT_HOPS; hop++) {
    if (from.name === null || !isDistinctive(from.name)) break;
    const step = `${from.file}\u0000${from.name}`;
    // Two tables that mount each other are a cycle, not a chain.
    if (seen.has(step)) break;
    seen.add(step);

    // A budget for each hop, because each hop is its own complete search over
    // the same files: one shared budget made the second hop exhaust what the
    // first had spent, and a project of 3,000 files answered null while one of
    // 1,500 answered. What the budget states is that *this* search finished.
    const budget = { left: reads };
    const files = await filesUnder(root, budget);
    if (files === null) return null;

    const mounts = await mountsFor(from.file, from.name, files, budget);
    if (mounts === null) return null;
    // Nobody mounts this one. At the first hop that is the whole answer
    // missing; above it, it is simply the top of the application.
    if (mounts.length === 0) return hop === 0 ? null : segments;

    const one = mounts[0]!;
    if (one.path !== null) {
      segments.unshift(...segmentsOf([one.path]));
    }
    from = { file: one.file, name: one.binding };
  }
  return segments.length === 0 ? null : segments;
}

/**
 * Where a screen belongs: its route, and the trail that follows from it.
 *
 * Four decisions across four files — which folder, how the route is registered,
 * where the navigation entry goes, what the breadcrumb says — and no per-file
 * check sees any of them, which is why they are the ones most often got wrong.
 *
 * Null everywhere when nothing claims the screen. A component no router
 * mentions has no place in the navigation, and inventing one from its directory
 * would be a confident wrong answer.
 */
export async function placementOf(
  screen: string,
  root: string | null,
  options: { mountReads?: number } = {},
): Promise<Placement> {
  return place(screen, root, true, options.mountReads ?? MAX_MOUNT_READS);
}

/**
 * `mounts` is what separates the two halves and the separation is the point.
 *
 * The registration is cheap and the derived contract asks for it on every edit;
 * the path costs a sweep of the project and only a deliberate command asks for
 * it. Sharing everything above them keeps a file-routed screen answering the
 * same way to both — it has no table, and sending it looking for one would hand
 * it a family it does not have.
 */
async function place(
  screen: string,
  root: string | null,
  mounts: boolean,
  mountReads: number,
): Promise<Placement> {
  const nothing: Placement = {
    style: null,
    path: null,
    trail: [],
    declaredIn: null,
    pathFromConstant: false,
  };
  if (root === null) return nothing;

  const away = relative(root, screen);
  if (away.startsWith('..') || isAbsolute(away)) return nothing;

  const byFile = fileRoutedPath(screen, root);
  if (byFile !== null) {
    return {
      style: 'file',
      path: `/${byFile.join('/')}`,
      trail: byFile,
      declaredIn: null,
      // The directory *is* the route, so there is no constant to resolve.
      pathFromConstant: false,
    };
  }

  const declared = await declaredPath(screen, root);
  if (declared === null) return nothing;

  let path = declared.path;
  // Every entry in the table, and not only the pathless ones (#1). A table
  // mounted under `orders` puts `{ path: 'detail/:id' }` at `/orders/detail/:id`,
  // and answering `/detail/:id` is a partial path presented as a whole one.
  // Where the mount cannot be established the stated path stands exactly as the
  // table wrote it: refusing to compose is not refusing to answer.
  if (mounts && declared.binding !== null && !declared.absolute) {
    const prefix = await mountPrefix(declared.declaredIn.file, declared.binding, root, mountReads);
    if (prefix !== null) {
      path = `/${[...prefix, ...segmentsOf(path === null ? [] : [path])].join('/')}`;
    }
  }

  return {
    style: 'declared',
    path,
    // No path, no trail. Inventing one from the folder is the confident wrong
    // answer this whole module refuses to give.
    trail: segmentsOf(path === null ? [] : [path]),
    pathFromConstant: declared.fromConstant,
    declaredIn: declared.declaredIn,
  };
}

/** The extensions a route entry may leave off the specifier it names. */
const MODULE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte'];

/** A relative specifier, as a file on disk, or null where it is neither. */
export async function resolveRelative(from: string, spec: string): Promise<string | null> {
  // Only what is written relative to the table. An aliased specifier —
  // `@/views/orders` — needs the project's `tsconfig` to resolve, and guessing
  // at it would put a file in the family that the table never named.
  if (!spec.startsWith('.')) return null;

  return moduleAt(join(from, spec));
}

/**
 * The file a specifier points at, once it has been made absolute.
 *
 * The extension and `index` probing a bundler does, and the only part of module
 * resolution that is the same whether the specifier was written relative or
 * through a `tsconfig` alias — so it lives once and both callers use it
 * (`src/sources/resolve.ts` is the other).
 */
export async function moduleAt(base: string): Promise<string | null> {
  const isFile = (path: string): Promise<boolean> =>
    stat(path).then(
      (info) => info.isFile(),
      () => false,
    );

  for (const extension of ['', ...MODULE_EXTENSIONS]) {
    if (await isFile(`${base}${extension}`)) return `${base}${extension}`;
  }
  for (const extension of MODULE_EXTENSIONS) {
    const inside = join(base, `index${extension}`);
    if (await isFile(inside)) return inside;
  }
  return null;
}

/**
 * The other screens the table that routes this one also routes.
 *
 * The one place a project *states* which screens are siblings. Everything else
 * about a family is inferred from where files happen to sit, and on the
 * commonest real layout that inference produced the page's own grid and hooks
 * (#225).
 *
 * Only what the table both imports and binds to a route: a route table also
 * imports guards, resolvers and its own layout, and none of those is a screen
 * of this kind.
 */
export async function declaredSiblings(screen: string, root: string | null): Promise<string[]> {
  if (root === null) return [];

  // The registration, never the path: a family comes from which table registers
  // the screen, and the sweep that recovers a path has no business on the edit
  // path this is read from.
  const placed = await place(screen, root, false, 0);
  if (placed.declaredIn === null) return [];

  const table = placed.declaredIn.file;
  const source = await readFile(table, 'utf8').catch(() => null);
  if (source === null || source.length > MAX_TABLE_BYTES) return [];

  const bound = new Set<string>();
  const specifiers: string[] = [];
  for (const line of source.split('\n')) {
    if (!BINDS.test(line)) continue;
    for (const name of line.match(/\b[A-Z]\w*/g) ?? []) bound.add(name);
    // `component: () => import('../views/orders')` names no identifier at all.
    for (const lazy of line.matchAll(/import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g)) {
      specifiers.push(lazy[1]!);
    }
  }

  for (const named of source.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"`]([^'"`]+)['"`]/g,
  )) {
    const names = named[1]!.split(',').map((one) => one.trim().split(/\s+as\s+/)[0]!.trim());
    if (names.some((name) => bound.has(name))) specifiers.push(named[2]!);
  }
  for (const fallback of source.matchAll(
    /import\s+([A-Za-z_$][\w$]*)\s+from\s*['"`]([^'"`]+)['"`]/g,
  )) {
    if (bound.has(fallback[1]!)) specifiers.push(fallback[2]!);
  }

  const found: string[] = [];
  for (const specifier of specifiers) {
    if (found.length >= MAX_TABLES) break;
    const file = await resolveRelative(dirname(table), specifier);
    if (file !== null && file !== screen && !found.includes(file)) found.push(file);
  }
  return found;
}

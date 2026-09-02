import type { JSXElement, Node } from '@babel/types';
import { parseModule, walk } from '../parse/parse.js';
import { parseTemplate, type TemplateKind } from '../parse/template.js';
import { jsxNameOf, screenRoot } from './extract.js';

/**
 * The parts a page is made of.
 *
 * Deliberately few and deliberately coarse. These are the regions an
 * application actually decides once and repeats — a header, a trail, a
 * navigation, the content, a footer — not a taxonomy of everything a screen
 * can contain.
 */
export type Region = 'header' | 'breadcrumbs' | 'nav' | 'content' | 'footer' | 'actions';

export interface FilledRegion {
  region: Region;
  /** The component that filled it, as written. */
  component: string;
}

export interface PageRegions {
  /** The outermost component: the layout holder. */
  holder: string;
  /** The regions, in the order they appear in the page. */
  order: FilledRegion[];
  /** The components inside the content region, if there is one. */
  body: string[];
}

/**
 * How each region is named, across both families of framework.
 *
 * Matched on the name with separators and case removed, so `PageHeader`,
 * `page-header`, `app-page-header` and `<header>` are all one thing. Anything
 * unrecognised is left out — a region guessed wrong would be compared against
 * every other page and be wrong about all of them.
 */
const NAMES: { region: Region; pattern: RegExp }[] = [
  { region: 'breadcrumbs', pattern: /(breadcrumb)/ },
  // `appheader` and `apptoolbar` were dead here: `normalise` strips a leading
  // `app`, so they arrive as `header` and `toolbar`. `bar` is MUI's `AppBar`
  // arriving the same way — the header component of a MUI project, previously
  // matching nothing at all.
  { region: 'header', pattern: /(pageheader|^header$|^bar$|masthead|topbar)/ },
  { region: 'nav', pattern: /(sidenav|sidebar|^nav$|navigation|navmenu|navrail)/ },
  { region: 'footer', pattern: /(pagefooter|appfooter|^footer$)/ },
  { region: 'actions', pattern: /(pageactions|actionbar|toolbar|actionsbar)/ },
  { region: 'content', pattern: /(pagecontent|^content$|^main$|maincontent|pagebody|^body$)/ },
];

function bareName(name: string): string {
  return name.replace(/[-_.]/g, '').toLowerCase();
}

function normalise(name: string): string {
  // `app-page-header` and `PageHeader` are the same region written two ways.
  const bare = bareName(name);
  return bare.startsWith('app') ? bare.slice(3) : bare;
}

/**
 * The prefix a design system puts on every component it exports.
 *
 * `IonPage` holding `IonHeader` and `IonContent` is a page layout as plain as
 * any, and none of it matched anything: `ionheader` is not `header`. Measured
 * on a real Ionic app — 17 screens read, zero layouts — which meant nothing
 * was derived about pages and the digest reported none, for every project of
 * that shape.
 *
 * Derived from the two names rather than from a list of libraries, because a
 * list is a thing to keep up to date and always missing somebody's. Three
 * conditions, and each one is there to stop a specific wrong answer:
 *
 * - **2 to 4 characters.** `Dialog` shared by `DialogShell` and `DialogTitle`
 *   is a component family, not a vendor prefix.
 * - **the holder must be longer than the prefix.** `Card` and `CardHeader`
 *   share `Card` — and a card's header is emphatically not a page's. This is
 *   the condition that keeps `CardHeader`, `TableHeader` and `ListSubheader`
 *   out, which is what the whole check depends on.
 * - **the name must be longer than the prefix**, or there is nothing left to
 *   read as a region.
 */
function vendorPrefix(holder: string, name: string): string | null {
  const a = bareName(holder);
  const b = bareName(name);

  let shared = 0;
  while (shared < a.length && shared < b.length && a[shared] === b[shared]) shared++;
  if (shared < 2 || shared > 4) return null;
  if (shared === a.length || shared === b.length) return null;
  return a.slice(0, shared);
}

export function regionOf(name: string, holder?: string): Region | null {
  const bare = normalise(name);
  const found = NAMES.find((entry) => entry.pattern.test(bare))?.region;
  if (found !== undefined) return found;

  // Only after the plain reading has failed. `Container` holding `Content`
  // shares `Con`, and stripping it first would turn a content region into
  // `tent` and lose it.
  if (holder === undefined) return null;
  const prefix = vendorPrefix(holder, name);
  if (prefix === null) return null;

  const stripped = bareName(name).slice(prefix.length);
  return NAMES.find((entry) => entry.pattern.test(stripped))?.region ?? null;
}

export interface OrderComparison {
  /** The page's own regions, each once, in the order they first appear. */
  present: Region[];
  /** Stated regions the page does not have at all. */
  missing: Region[];
  /** The shared regions as the page holds them, and as they were stated. */
  actual: Region[];
  expected: Region[];
  inOrder: boolean;
}

/**
 * A page's regions against the ones something states it should have.
 *
 * One implementation, because both callers had to learn the same two lessons
 * and only one of them had:
 *
 * - **First occurrence only.** A page with two content regions, or with a
 *   header written as `{flag ? <PageHeader/> : <Masthead/>}` — which is the
 *   commonest shape in React — has *one* of each region as far as an order is
 *   concerned. Counting them twice invents an ordering violation on a page
 *   whose order is right.
 * - **Order is compared over the regions the page actually has.** A missing
 *   region is reported as missing; saying it is also out of order is two
 *   findings about one fact.
 */
export function compareOrder(filled: Region[], stated: Region[]): OrderComparison {
  const present = [...new Set(filled)];
  const missing = stated.filter((region) => !present.includes(region));
  const expected = stated.filter((region) => present.includes(region));
  const actual = present.filter((region) => expected.includes(region));
  return { present, missing, actual, expected, inOrder: actual.join('>') === expected.join('>') };
}

/**
 * The elements a child position actually renders.
 *
 * `{showCrumbs && <Breadcrumbs />}` renders a breadcrumbs region; so does a
 * ternary between two headers, and so does a fragment. Reading only bare
 * `JSXElement` children reported every one of those as missing, on pages that
 * have them — the commonest shape in React, and the worst kind of finding
 * this tool can produce.
 */
const renderedElements = (child: Node): JSXElement[] => {
  if (child.type === 'JSXElement') return [child as JSXElement];
  if (child.type !== 'JSXExpressionContainer' && child.type !== 'JSXFragment') return [];

  const found: JSXElement[] = [];
  walk(child, (node) => {
    if (node.type === 'JSXElement') found.push(node as JSXElement);
  });
  // Only the outermost of whatever the expression produces: a header inside a
  // conditional is one header, not one per nested element.
  return found.filter(
    (candidate) =>
      !found.some(
        (other) =>
          other !== candidate &&
          (other.start ?? -1) < (candidate.start ?? -1) &&
          (other.end ?? -1) > (candidate.start ?? -1),
      ),
  );
};

function fromJsx(source: string): PageRegions | null {
  const ast = parseModule(source);
  if (ast === null) return null;

  const root = screenRoot(ast.program);
  if (root === null) return null;

  const holder = jsxNameOf(root);
  if (holder === null) return null;

  const order: FilledRegion[] = [];
  const body: string[] = [];

  for (const child of root.children) {
    for (const element of renderedElements(child as Node)) {
      const name = jsxNameOf(element);
      if (name === null) continue;
      // With the holder, so a design system that prefixes every component —
      // `IonPage` holding `IonHeader` — is read as the layout it plainly is.
      const region = regionOf(name, holder);
      if (region === null) continue;
      order.push({ region, component: name });

      if (region === 'content') {
        walk(element as Node, (node) => {
          if (node.type !== 'JSXElement' || node === element) return;
          const inner = jsxNameOf(node as JSXElement);
          if (inner !== null && !body.includes(inner)) body.push(inner);
        });
      }
    }
  }

  return { holder, order, body };
}

/**
 * Elements that are not a level of structure.
 *
 * `<ng-container *ngIf>` is how Angular writes a conditional, and counting it
 * as nesting pushed every region beneath it out of view — a page with a
 * content region was reported as having none.
 */
const TRANSPARENT = new Set(['ng-container', 'ng-template', 'template', 'svelte:fragment']);

function fromTemplate(source: string, kind: TemplateKind): PageRegions | null {
  const nodes = parseTemplate(source, kind);
  const rootAt = nodes.findIndex((node) => node.depth === 0);
  if (rootAt < 0) return null;
  const root = nodes[rootAt]!;

  // Only this root's subtree. A second top-level element is a different tree,
  // and its children were being read as regions of the first.
  const end = nodes.findIndex((node, index) => index > rootAt && node.depth === 0);
  const subtree = nodes.slice(rootAt + 1, end < 0 ? undefined : end);

  const order: FilledRegion[] = [];
  const body: string[] = [];
  /**
   * The depths of the transparent wrappers this node is currently inside.
   *
   * A stack, not a set. As a set the depths were only ever added, so one
   * `<ng-container>` anywhere shifted the arithmetic for the whole rest of the
   * page — including branches nested inside a *real* element, which were then
   * read as top-level regions. A page with a wrapper and a page without one
   * reported different structures for the same markup (#151).
   *
   * `subtree` is pre-order, so a node at or above a wrapper's depth is past
   * that wrapper's subtree and it can be dropped.
   */
  const transparent: number[] = [];
  let contentDepth: number | null = null;

  for (const node of subtree) {
    while (transparent.length > 0 && node.depth <= transparent[transparent.length - 1]!) {
      transparent.pop();
    }
    const effective = node.depth - transparent.length;

    if (TRANSPARENT.has(node.name.toLowerCase())) {
      transparent.push(node.depth);
      continue;
    }

    if (contentDepth !== null && effective > contentDepth) {
      if (!body.includes(node.name)) body.push(node.name);
      continue;
    }

    if (effective !== 1) continue;
    const region = regionOf(node.name, root.name);
    contentDepth = region === 'content' ? effective : null;
    if (region === null) continue;
    order.push({ region, component: node.name });
  }

  return { holder: root.name, order, body };
}

/**
 * The structure of a page: its holder, its regions in order, and what its
 * content holds.
 *
 * The flat `pattern` this sits beside is a *set* — it cannot say that a header
 * appears below the content, or that a footer is missing, because it de-duplicates
 * and discards order. Those are the two things that actually go wrong with a
 * page, so they need a model that keeps both.
 */
export function regionsOf(source: string, kind?: TemplateKind): PageRegions | null {
  return kind === undefined ? fromJsx(source) : fromTemplate(source, kind);
}

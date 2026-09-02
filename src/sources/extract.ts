import type { JSXElement, Node } from '@babel/types';
import { parseModule, walk } from '../parse/parse.js';
import {
  isTemplateComponent,
  parseTemplate,
  type TemplateKind,
  type TemplateNode,
} from '../parse/template.js';
import type { PropConventions } from '../types.js';

export interface ScreenShape {
  /** Every component rendered, in first-seen order. */
  components: string[];
  /**
   * The layout skeleton: containers breadth-first, to a fixed depth.
   *
   * Not the same thing as `PageRegions` in `regions.ts`, and deliberately not
   * derived from it. Regions are a *typed* reading — header, content, footer —
   * and a screen whose parts none of those names fit has no regions at all.
   * This is the untyped skeleton, and it exists for exactly those screens: the
   * neighbour cross-section and the advisory context need something to compare
   * on a page that is `<Shell><Widgetry/><Doodad/></Shell>`.
   *
   * The two now read the same root element (`screenRoot`), which is what they
   * actually disagreed about.
   */
  pattern: string[];
  /** Literal prop values, per component. */
  props: PropConventions;
  /**
   * What holds this screen, which is what kind of screen it is.
   *
   * Read from the structure and never from a list of component names. That
   * list — `Table|DataGrid|DataTable|List|VirtualList` and two more like it —
   * came back `unknown` on every real repository tested, because a project's
   * grids are called `CustomerInvoicesGrid` and `ServiceAccountsGrid` (#226).
   * `pattern.ts` had already reached this conclusion and this is the same
   * reading: screens of one kind are the ones that sit in the same holder.
   *
   * Feeds the source adapters and the advisory context. The page-pattern
   * *check* reads `src/sources/regions.ts` instead, which keeps the order this
   * shape discards.
   */
  holder: string | null;
  /**
   * The component children the holder holds directly.
   *
   * One level, not the chain: *what this kind of screen puts inside its
   * holder* is a convention where a project keeps its chrome in the holder's
   * props and has no region components to compare (#228). Computed here
   * because the parse is already in hand.
   */
  body: string[];
}

/**
 * The name of a JSX element, including a compound one.
 *
 * Shared because `regions.ts` had a byte-identical copy (and `archetype.ts`
 * did too, until #226 deleted it). Distinct from `nameOf` below, which is deliberately stricter — it
 * takes only capitalised plain identifiers, because a raw `<div>` is not part
 * of a screen's vocabulary.
 */
export function jsxNameOf(element: JSXElement): string | null {
  const name = element.openingElement.name;
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression' && name.property.type === 'JSXIdentifier') {
    return name.property.name;
  }
  return null;
}

/**
 * The screen in a file — which is not always the first thing in it.
 *
 * One definition, shared, because there were three. A small helper declared
 * above the screen (`const Row = () => <TableRow…>`) is positionally first,
 * and two of the three readings took it: `shapeOf` described the helper's tree
 * as the page's layout, and the archetype reading called a dialog a list because the
 * helper rendered a table row. Both feed the advisory context, so the advice
 * described a helper function instead of the screen.
 *
 * The screen is the largest top-level element. A screen is big; a helper is
 * not. When a file holds only helpers, the largest of those is what there is
 * — nothing to find is not an error.
 */
export function screenRoot(program: Node): JSXElement | null {
  const tops: JSXElement[] = [];
  walk(program, (node) => {
    if (node.type !== 'JSXElement') return;
    const element = node as JSXElement;
    const start = element.start ?? -1;
    const end = element.end ?? -1;
    const nested = tops.some((other) => (other.start ?? -1) < start && (other.end ?? -1) > end);
    if (!nested) tops.push(element);
  });

  const outermost = tops.filter(
    (candidate) =>
      !tops.some(
        (other) =>
          other !== candidate &&
          (other.start ?? -1) < (candidate.start ?? -1) &&
          (other.end ?? -1) > (candidate.end ?? -1),
      ),
  );
  if (outermost.length === 0) return null;

  return outermost.reduce((largest, candidate) =>
    (candidate.end ?? 0) - (candidate.start ?? 0) > (largest.end ?? 0) - (largest.start ?? 0)
      ? candidate
      : largest,
  );
}

function nameOf(element: JSXElement): string | null {
  const name = element.openingElement.name;
  if (name.type !== 'JSXIdentifier') return null;
  // Only a component. A raw `<div>` is not vocabulary.
  return /^[A-Z]/.test(name.name) ? name.name : null;
}

/**
 * How deep the layout skeleton goes.
 *
 * Two levels was too shallow to see the thing it was for. A holder usually
 * sits under a wrapper — `<Page><Content><FormLayout>` — so at two levels a
 * form inside its holder and a form hand-arranged in a bare `<Stack>` both
 * read as "Page, PageHeader, Content" and are indistinguishable (#67).
 *
 * Not the whole tree, either: the old comment's warning holds. Compare the
 * contents of every card and every screen becomes unique, which says nothing
 * about any of them.
 */
const PATTERN_DEPTH = 4;

/**
 * The same shape, read from a template's nodes.
 *
 * They arrive flat with a depth each, and pre-order — so grouping by depth and
 * emitting depth by depth *is* the breadth-first walk `patternOf` does over
 * JSX, without a second traversal. `props` stays empty: `usage.ts` owns how a
 * component is written and reads templates itself, and a second reading here
 * would be the same knowledge twice.
 */
function templateShape(source: string, kind: TemplateKind): ScreenShape | null {
  const nodes = parseTemplate(source, kind);
  if (nodes.length === 0) return null;

  const components = [...new Set(nodes.map((node) => node.name).filter(isTemplateComponent))];
  if (components.length === 0) return null;

  const holder = nodes.find((node) => isTemplateComponent(node.name)) ?? null;

  const pattern: string[] = [];
  for (let depth = 0; depth < PATTERN_DEPTH; depth++) {
    for (const node of nodes) {
      if (node.depth !== depth || !isTemplateComponent(node.name)) continue;
      if (!pattern.includes(node.name)) pattern.push(node.name);
    }
  }

  return {
    components,
    pattern,
    props: {},
    holder: holder === null ? null : holder.name,
    body: holder === null ? [] : bodyAt(nodes, holder),
  };
}

/** The components a template node holds directly. Depths, not a second parse. */
function bodyAt(nodes: TemplateNode[], holder: TemplateNode): string[] {
  const at = nodes.indexOf(holder);
  const body: string[] = [];
  for (const node of nodes.slice(at + 1)) {
    if (node.depth <= holder.depth) break;
    if (node.depth === holder.depth + 1 && isTemplateComponent(node.name)) body.push(node.name);
  }
  return body;
}

/**
 * The layout skeleton: the containers, breadth-first, to a fixed depth.
 *
 * "A detail screen is a `DetailLayout` holding a `DetailHeader` and cards" is
 * a pattern. What is inside the cards is the screen's own business.
 */
function patternOf(root: JSXElement): string[] {
  const skeleton: string[] = [];
  let level: JSXElement[] = [root];

  for (let depth = 0; depth < PATTERN_DEPTH && level.length > 0; depth++) {
    const next: JSXElement[] = [];
    for (const element of level) {
      const name = nameOf(element);
      if (name !== null && !skeleton.includes(name)) skeleton.push(name);
      for (const child of element.children) {
        if (child.type === 'JSXElement') next.push(child);
      }
    }
    level = next;
  }

  return skeleton;
}

/**
 * What a screen is made of, read from its source.
 *
 * Shared by the reference and neighbour adapters: what makes them different
 * sources is whose intent they carry, not how a file is read.
 */
export function shapeOf(source: string, kind?: TemplateKind): ScreenShape | null {
  // A template is not JavaScript, so the parser below reads nothing out of it
  // and every caller got `null`. `neighbourSource` dropped each such sibling
  // *before* counting one, so its quorum was never reached and the whole
  // "what the screens beside it look like" half was absent on every template
  // dialect (#251).
  //
  // The dispatch mirrors `regionsOf`, `writtenIn` and `rawMarkupOf`, which take
  // the kind the same way. This one did not, and nothing said so — which is
  // exactly how #149 happened one function over.
  if (kind !== undefined) return templateShape(source, kind);

  const ast = parseModule(source);
  if (ast === null) return null;

  const components: string[] = [];
  const props: PropConventions = {};
  const outermost = screenRoot(ast.program);

  walk(ast.program, (node) => {
    if (node.type !== 'JSXElement') return;
    const name = nameOf(node);
    if (name === null) return;
    if (!components.includes(name)) components.push(name);

    for (const attribute of node.openingElement.attributes) {
      if (attribute.type !== 'JSXAttribute') continue;
      if (attribute.name.type !== 'JSXIdentifier') continue;
      // An expression's value is not knowable from here, and a guess about it
      // would become an enforced rule.
      if (attribute.value?.type !== 'StringLiteral') continue;
      const forComponent = (props[name] ??= {});
      const values = (forComponent[attribute.name.name] ??= []);
      if (!values.includes(attribute.value.value)) values.push(attribute.value.value);
    }
  });

  if (components.length === 0) return null;
  return {
    components,
    pattern: outermost === null ? [] : patternOf(outermost),
    props,
    holder: outermost === null ? null : jsxNameOf(outermost),
    body:
      outermost === null
        ? []
        : outermost.children.flatMap((child) =>
            child.type === 'JSXElement' ? ([nameOf(child)] as const).filter(
              (name): name is string => name !== null,
            ) : [],
          ),
  };
}

/**
 * How much raw markup to *name*. Enough to recognise the screen, not a dump.
 *
 * A budget for describing a screen to a reader, and it belongs to the caller
 * that describes one. It used to be applied inside `rawMarkupOf`, where the
 * contract check read the same truncated list — so a screen rendering nine or
 * more distinct raw elements could push the forbidden one past the cut and be
 * reported as matching (#155). A plain `div`/`span`/`p`/`h1`/`ul`/`li`/`img`
 * page reaches nine easily, and is exactly the screen most likely to have been
 * written without the design system.
 */
export const MAX_RAW = 8;

/**
 * The plain HTML elements a file renders, when it renders no components at all.
 *
 * `shapeOf` returns null for such a file, because a screen's *vocabulary* is
 * its components and a raw `<div>` is not part of one. That is right for the
 * sources of truth, and it was wrong for the advisory: a screen written out of
 * raw markup is the one most likely to have been generated without the design
 * system, and it was the only one guaranteed to be told nothing.
 *
 * Null when the file renders nothing at all — a hook, a constants module, a
 * barrel. Those are not screens that got it wrong.
 */
export function rawMarkupOf(source: string, kind?: TemplateKind): string[] | null {
  // A template is not JavaScript, so the parser below reads nothing out of it
  // and every caller got an empty list. The contract's `avoids` check is one of
  // them, and an empty list there does not report less — it reports *success*
  // on a screen rendering exactly the element the contract forbids (#149).
  //
  // The dispatch mirrors `regionsOf` and `writtenIn`, which take the kind the
  // same way. This one did not, and nothing said so.
  if (kind !== undefined) {
    const nodes = parseTemplate(source, kind);
    if (nodes.length === 0) return null;

    const tags: string[] = [];
    for (const node of nodes) {
      if (isTemplateComponent(node.name)) continue;
      if (!tags.includes(node.name)) tags.push(node.name);
    }
    return tags;
  }

  const ast = parseModule(source);
  if (ast === null) return null;

  // Collected with a position, then sorted, because `walk` is a stack and
  // returns siblings in *reverse* document order. Unsorted, a caller taking the
  // first eight to describe a screen named the elements at the end of the file,
  // backwards — which is not "enough to recognise the screen", it is the
  // opposite of it (#161).
  //
  // Sorted here rather than in `walk`, whose order thirteen modules depend on.
  // Keyed by name, keeping the *earliest* position. `walk` runs backwards, so
  // the first occurrence it hands back is the last one in the file — taking it
  // would order the tags by where each one stops appearing.
  const found = new Map<string, number>();
  let renders = false;
  walk(ast.program, (node) => {
    if (node.type !== 'JSXElement') return;
    renders = true;
    const name = node.openingElement.name;
    // Lowercase identifiers only: an intrinsic element. A capitalised one would
    // have given `shapeOf` something to describe, so by construction there is
    // none here.
    if (name.type !== 'JSXIdentifier' || !/^[a-z]/.test(name.name)) return;
    const at = node.start ?? 0;
    const first = found.get(name.name);
    if (first === undefined || at < first) found.set(name.name, at);
  });

  const tags = [...found.entries()].sort((a, b) => a[1] - b[1]).map(([name]) => name);

  if (!renders) return null;
  return tags;
}

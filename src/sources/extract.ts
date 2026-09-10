import type { JSXElement, Node } from '@babel/types';
import { parseModule, walk, childNodes } from '../parse/parse.js';
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
 * ~~The screen is the largest top-level element. A screen is big; a helper is
 * not.~~ **Size is the wrong question, and it read three of four real screens
 * wrong (#31).** The commonest detail pattern on a real repository builds its
 * tabs as objects before returning, and the JSX in a `content:` property is far
 * bigger than the four lines the component actually returns:
 *
 * ```tsx
 * const generalTab = { label, content: (<LoadingBox>…twenty lines…</LoadingBox>) };
 * return <PageShell title={…}><SectionTabs tabs={tabs} /></PageShell>;
 * ```
 *
 * The answer was `LoadingBox`, and `PageShell` — the holder, the kind, the
 * thing every level above this is derived from — did not appear at all. Every
 * screen of that pattern was invisible.
 *
 * **The screen is what a component returns.** That is what makes it the screen,
 * and it needs no size heuristic: JSX sitting in an object property is data the
 * screen passes, not the screen. Size still settles a tie between several
 * components in one file, and the old reading remains the fallback for a file
 * that returns no JSX from anywhere — a helper is still better than nothing to
 * find.
 */
export function screenRoot(program: Node): JSXElement | null {
  const returned = returnedRoots(program);
  // Exported first, and only then largest. A screen is exported and a helper
  // usually is not, and without this the original defect comes back through the
  // new door: `const Row = () => <TableRow>…twenty lines…</TableRow>` beside a
  // four-line exported page would take the row, which is the mistake the note
  // above records from the other direction.
  const exported = returned.filter((one) => one.exported);
  const among = exported.length > 0 ? exported : returned;
  if (among.length > 0) return largest(among.map((one) => one.root));
  return positionalRoot(program);
}

/**
 * The JSX each top-level component returns.
 *
 * **Top-level, so a render prop does not outrank the component.** A callback
 * passed to `.map` returns JSX too, and it is as much part of the screen's
 * inside as a child element is — reading it as the root would put a table row
 * where the page should be, which is the mistake the old note above describes
 * from the other direction.
 *
 * `React.memo(…)` and `forwardRef(…)` wrap the function without changing what
 * it returns, so they are unwrapped rather than making the component invisible.
 */
function returnedRoots(program: Node): { root: JSXElement; exported: boolean }[] {
  const body = (program as { body?: unknown }).body;
  if (!Array.isArray(body)) return [];

  const roots: { root: JSXElement; exported: boolean }[] = [];
  for (const statement of body as Node[]) {
    const exported =
      statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration';
    for (const fn of componentsIn(statement)) {
      const root = returnsJsx(fn);
      if (root !== null) roots.push({ root, exported });
    }
  }
  return roots;
}

/** The function-shaped things one top-level statement declares. */
function componentsIn(statement: Node): Node[] {
  const node =
    statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
      ? ((statement as { declaration?: Node | null }).declaration ?? null)
      : statement;
  if (node === null) return [];

  if (node.type === 'FunctionDeclaration') return [node];
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') return [node];

  if (node.type !== 'VariableDeclaration') return [];
  const out: Node[] = [];
  for (const declarator of node.declarations) {
    const init = unwrapComponent((declarator as { init?: Node | null }).init ?? null);
    if (init !== null) out.push(init);
  }
  return out;
}

/** Through `memo(…)`, `forwardRef(…)`, `observer(…)` — one function, wrapped. */
function unwrapComponent(node: Node | null): Node | null {
  let current = node;
  for (let hop = 0; current !== null && hop < 4; hop++) {
    if (current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression') {
      return current;
    }
    if (current.type !== 'CallExpression' || current.arguments.length === 0) return null;
    current = current.arguments[0] as Node;
  }
  return null;
}

/**
 * What this function returns, without descending into a function inside it.
 *
 * An arrow's expression body is a return. Otherwise every `return` in the
 * body counts, and where a component returns different JSX down two branches
 * the larger one is taken — the same tie-break as between two components.
 */
function returnsJsx(fn: Node): JSXElement | null {
  const body = (fn as { body?: Node | null }).body ?? null;
  if (body === null) return null;
  if (body.type === 'JSXElement') return body as JSXElement;

  const found: JSXElement[] = [];
  const visit = (node: Node): void => {
    if (node !== body && isFunction(node)) return;
    if (node.type === 'ReturnStatement') {
      const argument = (node as { argument?: Node | null }).argument ?? null;
      for (const element of jsxIn(argument)) found.push(element);
      return;
    }
    for (const child of childNodes(node)) visit(child);
  };
  visit(body);
  return found.length === 0 ? null : largest(found);
}

const isFunction = (node: Node): boolean =>
  node.type === 'ArrowFunctionExpression' ||
  node.type === 'FunctionExpression' ||
  node.type === 'FunctionDeclaration';

/** The JSX a returned expression can produce: itself, or either branch of a `?:`. */
function jsxIn(node: Node | null): JSXElement[] {
  if (node === null) return [];
  if (node.type === 'JSXElement') return [node as JSXElement];
  if (node.type === 'ConditionalExpression') {
    return [...jsxIn(node.consequent as Node), ...jsxIn(node.alternate as Node)];
  }
  if (node.type === 'LogicalExpression') return jsxIn(node.right as Node);
  if (node.type === 'JSXFragment') {
    return node.children.filter((one): one is JSXElement => one.type === 'JSXElement');
  }
  return [];
}

const largest = (elements: JSXElement[]): JSXElement =>
  elements.reduce((biggest, candidate) =>
    (candidate.end ?? 0) - (candidate.start ?? 0) > (biggest.end ?? 0) - (biggest.start ?? 0)
      ? candidate
      : biggest,
  );

/** The old reading, kept for a file that returns no JSX from anywhere. */
function positionalRoot(program: Node): JSXElement | null {
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
  return largest(outermost);
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
    body: outermost === null ? [] : heldBy(outermost),
  };
}

/**
 * The components an element holds directly, through the expressions real
 * screens wrap them in.
 *
 * ~~Its JSX element children.~~ **A child inside an expression was missed
 * entirely (#31)**, and `{cond && <X/>}` is how most real screens gate on data
 * or a permission — so a page whose whole content is behind one was reported as
 * holding nothing. `{cond ? <A/> : <B/>}`, `{items.map(…)}` and a fragment are
 * the same shape and were missed the same way.
 *
 * A fragment is transparent: it holds no place in a layout and its children are
 * the holder's own. A `.map` callback contributes what it returns, once —
 * fifteen rows are one kind of child, not fifteen children.
 */
function heldBy(element: JSXElement): string[] {
  const names: string[] = [];

  const take = (node: Node | null | undefined): void => {
    if (node === null || node === undefined) return;
    switch (node.type) {
      case 'JSXElement': {
        const name = nameOf(node as JSXElement);
        if (name !== null) names.push(name);
        return;
      }
      // Transparent: a fragment is not a component and holds no place.
      case 'JSXFragment':
        for (const child of node.children) take(child as Node);
        return;
      case 'JSXExpressionContainer':
        take(node.expression as Node);
        return;
      case 'LogicalExpression':
        take(node.right as Node);
        return;
      case 'ConditionalExpression':
        take(node.consequent as Node);
        take(node.alternate as Node);
        return;
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        // The callback of a `.map`, and what it returns is the child.
        take((node as { body?: Node | null }).body ?? null);
        return;
      case 'CallExpression':
        for (const argument of node.arguments) take(argument as Node);
        return;
      case 'ParenthesizedExpression':
        take((node as { expression?: Node | null }).expression ?? null);
        return;
      default:
        return;
    }
  };

  for (const child of element.children) take(child as Node);
  return names;
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

/** A component reached through a prop rather than through a child position. */
export interface PassedContent {
  /** The component's name, as written. */
  name: string;
  /** The child element it was passed to, and the prop it arrived on. */
  to: string;
  via: string;
}

/**
 * Content a screen passes as data, which the walk could not see at all.
 *
 * The commonest detail pattern on one real repository declares its tabs as
 * objects and passes them: `<SectionTabs tabs={tabs} />` is a leaf to a walk
 * that follows children, and the accordions, the forms and the save bar are all
 * inside `tabs[].content`. It is not an edge case there — all three of that
 * project's menu surfaces declare their contents as data too, one of them in
 * 103 files (#31).
 *
 * **Resolved in this file and nowhere else.** A binding this file declares can
 * be read; one it imports cannot, and following it would be a second walk with
 * a second budget. What cannot be resolved is reported as unresolved rather
 * than left looking like a leaf — but only for an element that has no children
 * from anywhere, because a prop nobody can read on an element that already
 * holds something says nothing worth a line.
 */
export function passedContent(source: string): { passed: PassedContent[]; unresolved: string[] } {
  const ast = parseModule(source);
  if (ast === null) return { passed: [], unresolved: [] };

  const root = screenRoot(ast.program);
  if (root === null) return { passed: [], unresolved: [] };

  const declared = jsxBindings(ast.program);
  const passed: PassedContent[] = [];
  const unresolved: string[] = [];

  for (const child of root.children) {
    if (child.type !== 'JSXElement') continue;
    const to = nameOf(child);
    if (to === null) continue;

    let found = 0;
    let opaque: string | null = null;
    for (const attribute of child.openingElement.attributes) {
      if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier') continue;
      const value = attribute.value;
      if (value?.type !== 'JSXExpressionContainer') continue;

      const names = jsxNamesIn(value.expression as Node, declared, new Set());
      for (const name of names) {
        passed.push({ name, to, via: attribute.name.name });
        found++;
      }
      // Worth naming only where nothing else was found: an expression that is a
      // call or an import is unreadable here, and most of them are not content.
      if (names.length === 0 && opaque === null && CONTENTISH.test(attribute.name.name)) {
        opaque = attribute.name.name;
      }
    }

    if (found === 0 && opaque !== null && heldBy(child).length === 0) {
      unresolved.push(`${to}.${opaque}`);
    }
  }

  return { passed, unresolved };
}

/**
 * Prop names that carry content often enough to be worth a line when unreadable.
 *
 * Not a vocabulary of components — those are the project's own and must never
 * be hardcoded. These are the words React itself and every library spell the
 * same, about the *shape of a prop* rather than about any project's names.
 */
const CONTENTISH = /^(?:children|content|items|tabs|panels|sections|render|body|slots?|actions)$/i;

/** Every name this file binds to JSX, directly or inside data it declares. */
function jsxBindings(program: Node): Map<string, Node> {
  const found = new Map<string, Node>();
  walk(program, (node) => {
    if (node.type !== 'VariableDeclarator') return;
    const id = (node as { id?: Node }).id;
    const init = (node as { init?: Node | null }).init ?? null;
    if (id === undefined || id.type !== 'Identifier' || init === null) return;
    found.set(id.name, init);
  });
  return found;
}

/**
 * The component names an expression can be seen to produce.
 *
 * Through the shapes content-as-data is actually written in: an element, an
 * array of them, an object whose properties hold them, and an identifier this
 * file bound to any of those. `seen` guards a binding that refers to itself.
 */
function jsxNamesIn(node: Node | null, declared: Map<string, Node>, seen: Set<string>): string[] {
  if (node === null) return [];
  switch (node.type) {
    case 'JSXElement': {
      const name = nameOf(node as JSXElement);
      return name === null ? [] : [name];
    }
    case 'JSXFragment':
      return node.children.flatMap((one) => jsxNamesIn(one as Node, declared, seen));
    case 'Identifier': {
      if (seen.has(node.name)) return [];
      const bound = declared.get(node.name);
      return bound === undefined ? [] : jsxNamesIn(bound, declared, new Set(seen).add(node.name));
    }
    case 'ArrayExpression':
      return node.elements.flatMap((one) =>
        one === null ? [] : jsxNamesIn(one as Node, declared, seen),
      );
    case 'ObjectExpression':
      return node.properties.flatMap((property) =>
        property.type === 'ObjectProperty' ? jsxNamesIn(property.value as Node, declared, seen) : [],
      );
    case 'ConditionalExpression':
      return [
        ...jsxNamesIn(node.consequent as Node, declared, seen),
        ...jsxNamesIn(node.alternate as Node, declared, seen),
      ];
    case 'LogicalExpression':
      return jsxNamesIn(node.right as Node, declared, seen);
    case 'TSAsExpression':
      return jsxNamesIn(node.expression as Node, declared, seen);
    default:
      return [];
  }
}

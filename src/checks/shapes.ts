import type { JSXElement, Node } from '@babel/types';
import { parseModule, walk } from '../parse/parse.js';

export interface Shape {
  /** The tree, canonicalised: element names and nesting, nothing else. */
  hash: string;
  file: string;
  /** 1-indexed, where the outermost element of the shape starts. */
  line: number;
  /** How many elements it covers — bigger repeats are worth more. */
  size: number;
}

export interface HandRolled {
  file: string;
  line: number;
  /** The component this shape already exists as. */
  component: string;
  /** Where that component lives. */
  definedIn: string;
}

export interface Repeated {
  hash: string;
  files: string[];
  size: number;
  /**
   * The component that already has this shape, when one does.
   *
   * The issue calls this the guard that makes the report usable: a repeat that
   * is also in the shared vocabulary is a strong candidate — there is
   * something concrete to switch to. One that repeats only among screens is a
   * suspect, and nothing more.
   */
  existsAs: { component: string; definedIn: string } | null;
}

export interface ShapeReport {
  /** Shapes an existing component already has. */
  handRolled: HandRolled[];
  /** Shapes nothing has, repeated often enough to be worth extracting. */
  repeated: Repeated[];
}

/**
 * Trees smaller than this are not evidence of anything.
 *
 * `<Box><span/></Box>` repeats in every codebase ever written. A report that
 * includes it is a wall nobody reads, which is the same as no report.
 *
 * Re-derived against a real repository after the switch to counting subtrees:
 * at four, 1126 files produce ten clusters, and the four-element ones are
 * genuine — one card shape shared by `ConsumedApisCard`, `HasApisCard`,
 * `ProvidedApisCard` and `ConsumingComponentsCard`. Raising it would drop
 * those without removing anything false.
 */
const MIN_SIZE = 4;

/**
 * How many files must share a shape before it is a pattern.
 *
 * Two can be a copy-paste or a coincidence; three is the smallest number that
 * says something. The same quorum the neighbour source uses, for the same
 * reason.
 */
const QUORUM = 3;

function elementName(element: JSXElement): string | null {
  const name = element.openingElement.name;
  if (name.type === 'JSXIdentifier') return name.name;
  // `<Card.Header>` is the shape of a compound component, which is most of
  // what a design system wrapping MUI actually looks like. Returning null here
  // made the entire subtree vanish, silently.
  if (name.type === 'JSXMemberExpression') {
    const parts: string[] = [];
    let current: typeof name.object | typeof name = name;
    while (current.type === 'JSXMemberExpression') {
      parts.unshift(current.property.name);
      current = current.object;
    }
    if (current.type === 'JSXIdentifier') parts.unshift(current.name);
    return parts.join('.');
  }
  if (name.type === 'JSXNamespacedName') return `${name.namespace.name}:${name.name.name}`;
  return null;
}

/** The canonical form of a tree: names and nesting, never props or text. */
function canonical(element: JSXElement): { text: string; size: number } | null {
  const name = elementName(element);
  if (name === null) return null;

  const children: string[] = [];
  let size = 1;
  for (const inner of canonicalChildren(element.children)) {
    children.push(inner.text);
    size += inner.size;
  }

  return {
    text: children.length === 0 ? name : `${name}(${children.join(',')})`,
    size,
  };
}

/**
 * The children that count, flattened.
 *
 * A fragment is not a level of structure — `<><Row/><Row/></>` renders exactly
 * as its children do, so its children belong to the parent. And a list built
 * with `.map()` or a conditional branch is still structure: dropping those
 * left `<Table>{rows.map(...)}</Table>` looking like a childless `Table`,
 * which is not the shape anybody sees.
 */
function canonicalChildren(nodes: JSXElement['children']): { text: string; size: number }[] {
  const found: { text: string; size: number }[] = [];

  for (const child of nodes) {
    if (child.type === 'JSXElement') {
      const inner = canonical(child);
      if (inner !== null) found.push(inner);
      continue;
    }
    if (child.type === 'JSXFragment') {
      found.push(...canonicalChildren(child.children));
      continue;
    }
    if (child.type === 'JSXExpressionContainer') {
      // Whatever elements the expression produces, wherever they sit in it.
      const nested: JSXElement[] = [];
      walk(child.expression as Node, (node) => {
        if (node.type === 'JSXElement') nested.push(node as JSXElement);
      });
      const outermost = nested.filter(
        (candidate) => !nested.some((other) => other !== candidate && contains(other, candidate)),
      );
      for (const element of outermost) {
        const inner = canonical(element);
        if (inner !== null) found.push(inner);
      }
    }
  }

  return found;
}

/** Is `inner` inside `outer`, by source position? */
function contains(outer: JSXElement, inner: JSXElement): boolean {
  const outerStart = outer.start ?? -1;
  const outerEnd = outer.end ?? -1;
  const innerStart = inner.start ?? -1;
  return innerStart > outerStart && innerStart < outerEnd;
}

/**
 * Every JSX tree in a file, canonicalised — including subtrees.
 *
 * Outermost trees alone are nearly unique: on a real repository 1126 files
 * produced 490 of them and only two were shared by three files, which cannot
 * answer "does this shape repeat". A repeated pattern lives inside a screen,
 * not around it.
 */
export function shapesOf(file: string, source: string): Shape[] {
  const ast = parseModule(source, file);
  if (ast === null) return [];

  const shapes: Shape[] = [];

  walk(ast.program, (node) => {
    if (node.type !== 'JSXElement') return;

    const shape = canonical(node as JSXElement);
    if (shape === null || shape.size < MIN_SIZE) return;

    shapes.push({
      hash: shape.text,
      file,
      line: node.loc?.start.line ?? 1,
      size: shape.size,
    });
  });

  return shapes;
}

export interface ShapeCorpora {
  /** The components the design system already offers. */
  library: { component: string; file: string; source: string }[];
  /** The screens to audit. */
  app: { file: string; source: string }[];
}

/**
 * The duplicate-shape audit.
 *
 * Two questions over two corpora: *have you rebuilt something that exists*,
 * and *does this shape repeat often enough to be worth extracting*.
 *
 * **Never in the per-file gate, only here.** From an AST a propagated mistake
 * and a shared pattern look identical, so a repeated shape is evidence that
 * something is worth a person's attention and never evidence that a file is
 * wrong. Firing this on an edit would enforce whatever is most common — the
 * inference this project exists to refuse.
 */
export function shapeReport(corpora: ShapeCorpora): ShapeReport {
  const known = new Map<string, { component: string; file: string }>();
  for (const entry of corpora.library) {
    for (const shape of shapesOf(entry.file, entry.source)) {
      if (!known.has(shape.hash)) known.set(shape.hash, { component: entry.component, file: entry.file });
    }
  }

  const handRolled: HandRolled[] = [];
  const seen = new Set<string>();
  const byHash = new Map<string, Shape[]>();

  for (const entry of corpora.app) {
    for (const shape of shapesOf(entry.file, entry.source)) {
      const existing = known.get(shape.hash);
      // The file that defines the component is not rebuilding it.
      if (existing !== undefined && existing.file !== shape.file) {
        // One site, one finding. A duplicated tree matches at every nesting
        // level that clears the minimum, and reporting each of them counted
        // levels rather than places.
        const at = `${shape.file}:${shape.line}`;
        if (!seen.has(at)) {
          seen.add(at);
          handRolled.push({
            file: shape.file,
            line: shape.line,
            component: existing.component,
            definedIn: existing.file,
          });
        }
      }

      // Counted either way. A shape that matches the library is still a repeat
      // — swallowing it here left the "does this repeat" question with nothing
      // to look at on a monorepo where most packages are shared.
      const group = byHash.get(shape.hash) ?? [];
      group.push(shape);
      byHash.set(shape.hash, group);
    }
  }

  const repeated: Repeated[] = [];
  for (const [hash, group] of byHash) {
    const files = [...new Set(group.map((shape) => shape.file))].sort();
    if (files.length < QUORUM) continue;
    const existing = known.get(hash);
    repeated.push({
      hash,
      files,
      size: group[0]!.size,
      existsAs:
        existing === undefined
          ? null
          : { component: existing.component, definedIn: existing.file },
    });
  }
  // Biggest repeats first: a nine-element tree repeated three times is worth
  // more of somebody's attention than a four-element one repeated four.
  repeated.sort((a, b) => b.size * b.files.length - a.size * a.files.length);

  return { handRolled, repeated };
}

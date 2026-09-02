import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { findProjectRoot } from '../layers/detect.js';
import type { JSXAttribute, JSXElement, Node } from '@babel/types';
import { parseModule, walk } from '../parse/parse.js';
import { parseTemplate, templateKind } from '../parse/template.js';

import { MAJORITY, MAX_FAMILY, QUORUM, siblingScreens } from './siblings.js';
import { markupOf, pairOf } from './pair.js';

/**
 * How a component is written on the screens beside this one.
 *
 * The half of "consistent with its neighbours" that did not exist. Everything
 * else observed about a sibling screen is a *name* — `ScreenShape.pattern` is
 * a chain of them, `FilledRegion` is one — so a convention carried by how a
 * component is configured was invisible. The content holder that has to carry
 * the classes that make it expand, the grid that carries the scroll, the
 * refresh action written the same way on every page: all of that is props,
 * and props were never read.
 */
export interface ComponentUsage {
  component: string;
  /** Props the siblings agree on, with the value they agree on. */
  props: { name: string; value: string; bare: boolean }[];
  /**
   * Props every screen of the kind writes, whatever value each one chooses.
   *
   * A different claim from the one above, and the one a developer wants held:
   * *"every screen of this kind writes `dataTestId`; this one does not"* is a
   * fact about the family, not an opinion. Dropping it along with the value was
   * what left the contract nearly empty on real code (#227).
   *
   * `shape` is stated only where every screen writes the same shape of value,
   * and `writtenBy` carries how many of `seenIn` write it at all.
   *
   * ~~Unanimity, because "a prop three of four write is that fourth screen's own
   * decision".~~ **Widened to the same majority the rest of this file uses,
   * with the count on the claim (#257).** Under unanimity the more drift a
   * family already had the *less* the tool said about it — one screen omitting a
   * prop silenced it for the whole kind, so the signal was weakest exactly where
   * a consistency tool is needed most, and one drifted screen granted every
   * future screen permission to drift the same way. Measured on a real
   * route-derived family of 8: `title` and `breadcrumbs` at 8 of 8 were kept,
   * `dataTestId` at **7 of 8** was dropped.
   *
   * The original argument is answered rather than overridden: at 3 of 4 the
   * fourth screen's own decision is visible *in the sentence*. Dropping the fact
   * hands the reader nothing to judge with.
   */
  written: { name: string; shape: ValueShape | null; writtenBy: number }[];
  /** Class tokens present on most of the uses. */
  classes: string[];
  /**
   * The attribute those tokens were written on, as the siblings write it.
   *
   * `className` in JSX and `class` in a template. Rendering the observation
   * with the wrong one hands the agent a dialect nobody in the project uses,
   * and in JSX it is not merely odd — it is invalid.
   */
  classAttribute: string;
  /** How many sibling screens use it. */
  seenIn: number;
  /**
   * How many of them write the weakest thing reported here.
   *
   * Never above `seenIn`, and usually equal to it. It exists because the line
   * this ends up on names one number for a whole cross-section: a component
   * used on ten screens whose classes only six of them write plainly must not
   * be reported as ten screens agreeing.
   */
  agreedBy: number;
}

/** Screens, in every dialect the hook accepts — an Angular page has neighbours too. */
const CHECKABLE = /\.(?:[jt]sx|html|vue|svelte)$/;
/** The half of a pair that carries the identity, whose markup is elsewhere (#229). */
const PAIRED = /\.component\.[jt]s$/;
/**
 * Fixtures and stories, in the same dialects.
 *
 * Anchored to `[jt]sx` while `CHECKABLE` read every dialect, `Button.stories.svelte`
 * — which is the standard Svelte CSF name — counted as a sibling screen, and a
 * folder could reach quorum on nothing but stories and specs.
 */
const GENERATED = /\.(?:test|spec|stories|story)\.(?:[jt]sx?|html|vue|svelte)$/;

/**
 * How many siblings must agree before their agreement means anything.
 *
 * The same number `neighbours.ts` uses, for the same reason: two files can
 * match because one was copied from the other.
 */

/**
 * However strong the share, this many files must actually do it.
 *
 * Three, not two, and Backstage is why: at two, `<WarningPanel severity="error">`
 * and `<CodeSnippet language="text">` were reported as conventions on the
 * strength of one file and its copy. The same number as the quorum, for the
 * same reason — a pair is a copy, not an agreement.
 */
const MIN_FILES = 3;

/** Kept small on purpose: this rides in a hook response with a hard cap. */
const MAX_COMPONENTS = 8;
const MAX_PROPS = 6;
const MAX_CLASSES = 8;

/**
 * Props whose value says nothing about the design system.
 *
 * A `key` or a `data-testid` repeated across pages is an artefact of the
 * files, not a convention anyone chose to follow.
 *
 * Anchored where it has to be. As a bare prefix this ate `refreshInterval`,
 * `keyboardNavigation` and `idPrefix` — real props, and the first of those is
 * exactly the kind this was built to see.
 */
const NOISE = /^(?:key|ref|id)$|^(?:data-|aria-describedby)/;

/**
 * Attribute names that hold an expression rather than a value.
 *
 * `[data]="items"`, `:rows="rows"`, `@click`, `*ngIf`. A template attribute
 * has no types, so what is written is a string either way — and reporting
 * `data="items"` as a convention is reporting the name of somebody's variable.
 * JSX gets this for free, because a non-literal expression is refused there.
 */
const BINDING = /^[[(:@#*]|^v-/;

/**
 * Where a class list is written plainly.
 *
 * `[ngClass]` and `:class` are deliberately absent: they hold an object or a
 * ternary, and splitting `{'active': isActive}` on whitespace produces
 * `{'active':` and `isActive}` as class names.
 */
const CLASS_ATTRS = new Set(['class', 'classname']);

/**
 * A template value that is an expression rather than a literal.
 *
 * `BINDING` guards the attribute *name*, which catches `[rows]` and `:rows`
 * and `@click`. It does not catch an ordinarily-named attribute holding an
 * interpolation — `rows="{{items}}"` in Angular, `value={count}` in Svelte,
 * both of which reach here as the written text, braces and all. Reporting
 * those as an agreed value is handing the agent somebody's variable name.
 */
const EXPRESSION = /[{}]/;

/**
 * What kind of thing is written, where the value itself is not knowable.
 *
 * Syntax, not meaning: a call is a call whatever it is called. That is what
 * makes it deterministic and free of any vocabulary — and it is enough for the
 * commonest real mistake, a raw string where every sibling writes a call.
 */
export type ValueShape = 'literal' | 'call' | 'expression';

/** One attribute as one file writes it. */
interface Value {
  /** The value where the file states one outright, and null where it does not. */
  value: string | null;
  /** `<Grid scrollable>`, not `scrollable="true"` — the two are written differently. */
  bare: boolean;
  shape: ValueShape;
}

/** One component as one file writes it. */
export interface Written {
  component: string;
  attributes: Map<string, Value>;
  classes: Set<string> | null;
  /** How this file spelled the class attribute, when it wrote one. */
  classAttribute: string | null;
}

/** Only vocabulary: a capitalised component, or a custom element. */
const isComponent = (name: string): boolean => /^[A-Z]/.test(name) || name.includes('-');

const attributeValue = (attribute: JSXAttribute): Value => {
  const value = attribute.value;
  const literal = (text: string, bare = false): Value => ({ value: text, bare, shape: 'literal' });
  // `<Grid scrollable>` — the bare form is how most layout switches are written.
  if (value === null || value === undefined) return literal('true', true);
  if (value.type === 'StringLiteral') return literal(value.value);
  if (value.type === 'JSXExpressionContainer') {
    const inner = value.expression;
    if (inner.type === 'BooleanLiteral') return literal(String(inner.value));
    if (inner.type === 'NumericLiteral') return literal(String(inner.value));
    if (inner.type === 'StringLiteral') return literal(inner.value);
    // The value is this screen's own business and a guess about it would be
    // handed over as though it were observed — but *that it is written at all*
    // is a fact about the family, and it used to be thrown away with the value
    // (#227). So is its shape, which is syntax and needs no vocabulary.
    return { value: null, bare: false, shape: inner.type === 'CallExpression' ? 'call' : 'expression' };
  }
  return { value: null, bare: false, shape: 'expression' };
};

/**
 * What a JSX element is called, keeping the namespace.
 *
 * Local, and deliberately not `jsxNameOf`: that returns `Item` for
 * `<Grid.Item>` and its callers depend on that. Here it collapsed `<Grid.Item>`
 * and a separate `<Item>` into one bucket, whose attributes were then
 * intersected as though one component had been written two ways — deleting
 * both real conventions instead of reporting either.
 */
const usageNameOf = (element: JSXElement): string | null => {
  const name = element.openingElement.name;
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression' && name.property.type === 'JSXIdentifier') {
    const object = name.object;
    if (object.type !== 'JSXIdentifier') return null;
    return `${object.name}.${name.property.name}`;
  }
  return null;
};

const tokens = (value: string): Set<string> =>
  new Set(value.split(/\s+/).filter((token) => token !== ''));

const fromJsx = (source: string): Written[] => {
  const ast = parseModule(source);
  if (ast === null) return [];

  const written: Written[] = [];
  walk(ast.program, (node: Node) => {
    if (node.type !== 'JSXElement') return;
    const name = usageNameOf(node as JSXElement);
    if (name === null || !isComponent(name)) return;

    const attributes = new Map<string, Value>();
    let classes: Set<string> | null = null;
    let classAttribute: string | null = null;

    for (const attribute of (node as JSXElement).openingElement.attributes) {
      if (attribute.type !== 'JSXAttribute') continue;
      if (attribute.name.type !== 'JSXIdentifier') continue;
      const key = attribute.name.name;
      const value = attributeValue(attribute);

      if (CLASS_ATTRS.has(key.toLowerCase())) {
        // A class attribute written as an expression states no tokens.
        if (value.value === null) continue;
        const found = tokens(value.value);
        classes = classes === null ? found : intersect(classes, found);
        classAttribute ??= key;
        continue;
      }
      if (NOISE.test(key)) continue;
      attributes.set(key, value);
    }

    written.push({ component: name, attributes, classes, classAttribute });
  });
  return written;
};

const fromTemplate = (source: string, path: string): Written[] => {
  const kind = templateKind(path);
  if (kind === null) return [];

  const written: Written[] = [];
  for (const node of parseTemplate(source, kind)) {
    if (!isComponent(node.name)) continue;

    const attributes = new Map<string, Value>();
    let classes: Set<string> | null = null;
    let classAttribute: string | null = null;

    for (const [key, value] of Object.entries(node.attributes)) {
      if (CLASS_ATTRS.has(key.toLowerCase())) {
        // `class="flex-1 {extra}"` — the plainly written tokens are still an
        // observation; the interpolated one is a variable, and not a class.
        const found = new Set([...tokens(value)].filter((token) => !EXPRESSION.test(token)));
        classes = classes === null ? found : intersect(classes, found);
        classAttribute ??= key;
        continue;
      }
      if (BINDING.test(key) || NOISE.test(key)) continue;
      if (EXPRESSION.test(value)) continue;
      // A bare attribute is the template form of `<Grid scrollable>`.
      attributes.set(
        key,
        value === ''
          ? { value: 'true', bare: true, shape: 'literal' }
          : { value, bare: false, shape: 'literal' },
      );
    }

    written.push({ component: node.name, attributes, classes, classAttribute });
  }
  return written;
};

const intersect = (left: Set<string>, right: Set<string>): Set<string> =>
  new Set([...left].filter((item) => right.has(item)));

/**
 * What one file says about each component it uses.
 *
 * Collapsed per file before anything is compared across files, so a page that
 * writes the same component two different ways contributes disagreement rather
 * than two votes. A prop written inconsistently *within* one screen is not a
 * convention of the project.
 */
const perFile = (written: Written[]): Map<string, Written> => {
  const byComponent = new Map<string, Written>();
  for (const one of written) {
    const existing = byComponent.get(one.component);
    if (existing === undefined) {
      byComponent.set(one.component, one);
      continue;
    }
    for (const [key, written] of existing.attributes) {
      const other = one.attributes.get(key);
      // On `.value`, never on the record: two identical values are two objects.
      // Two unknown values are not known to be the same, so a component written
      // twice in one file with an expression each time agrees about nothing
      // beyond the shape — and disagreeing shapes are not agreement either.
      if (
        other === undefined ||
        other.shape !== written.shape ||
        other.value !== written.value ||
        (other.value === null && written.value === null && other !== written)
      ) {
        existing.attributes.delete(key);
        continue;
      }
      // Written bare on one and spelled out on the other is still agreement
      // about the value, but not about the form. The stricter form wins.
      if (!other.bare) written.bare = false;
    }
    existing.classes =
      existing.classes === null || one.classes === null
        ? null
        : intersect(existing.classes, one.classes);
    existing.classAttribute ??= one.classAttribute;
  }
  return byComponent;
};

/**
 * How one screen writes the components it renders, in whichever dialect.
 *
 * The dispatch itself, rather than its two halves: publishing `fromJsx` and
 * `fromTemplate` separately would hand every caller the job of choosing
 * between them, and one of them would choose wrong — as the first version of
 * `pattern.ts` did, admitting four dialects and reading one.
 */
export const writtenIn = (path: string, source: string): Written[] =>
  templateKind(path) === null ? fromJsx(source) : fromTemplate(source, path);

export interface UsageOptions {
  /** For tests, and for reading a directory that is not the target's own. */
  readDir?: (dir: string) => Promise<string[]>;
  readSource?: (path: string) => Promise<string | null>;
  /**
   * The screens to measure, when the caller has already chosen them.
   *
   * Without this, a caller that has just selected a family gets a *second*
   * selection here — with a different quorum, so `siblingScreens` can settle on
   * a different scope entirely. Measured: one caller reported one folder's
   * screens while the usage came from three other folders, disjoint from it.
   */
  family?: string[];
}

/**
 * How the screens beside this one write the components they share.
 *
 * Null when there is nothing that deserves the name of agreement. This is a
 * heuristic and it stays on the advisory path — `statedConventions` takes prop
 * conventions only from a reference or from curated knowledge, and nothing
 * here can fail a check. "Curated, never inferred" governs what may gate; this
 * is an observation handed to a reader, in the same class as the component
 * list and the archetype that have always been offered.
 */
export const observeUsage = async (
  target: string,
  options: UsageOptions = {},
): Promise<ComponentUsage[] | null> => {
  const read =
    options.readSource ?? ((path: string) => readFile(path, 'utf8').catch(() => null));

  // Which files are beside this one is a question about the repository's
  // layout, not about props, and `neighbours.ts` had to answer it too — badly,
  // because it never got this fallback. It is one function now, in `siblings.ts`.
  // Never outside the project: with repositories checked out side by side the
  // walk otherwise reads a neighbour's screens as if they were this one's.
  const root = options.readDir === undefined ? await findProjectRoot(dirname(target)) : null;

  const siblings =
    options.family ??
    (
      await siblingScreens(target, {
      ...(options.readDir === undefined ? {} : { readDir: options.readDir }),
      ...(root === null ? {} : { root }),
      isScreen: (name) => (CHECKABLE.test(name) || PAIRED.test(name)) && !GENERATED.test(name),
        maxSiblings: MAX_FAMILY,
        quorum: QUORUM,
      })
    ).screens;
  if (siblings.length < QUORUM) return null;

  const files: Map<string, Written>[] = [];
  const seen = new Set<string>();
  for (const path of siblings) {
    const source = await read(path);
    if (source === null) continue;
    // A screen may be written as a pair, and its markup then lives in the other
    // half. Reading the class as if it were the screen finds no components at
    // all, which is why an Angular family agreed about nothing (#229).
    const pair = options.readSource === undefined ? await pairOf(path) : null;
    if (pair !== null && seen.has(pair.identity)) continue;
    if (pair !== null) seen.add(pair.identity);
    const markup =
      pair === null ? { path, source } : await markupOf(pair.identity, source);
    const written = writtenIn(markup.path, markup.source);
    if (written.length === 0) continue;
    files.push(perFile(written));
  }
  if (files.length < QUORUM) return null;

  const usages: ComponentUsage[] = [];
  const components = new Set(files.flatMap((file) => [...file.keys()]));

  for (const component of components) {
    const uses = files.map((file) => file.get(component)).filter((one) => one !== undefined);
    if (uses.length < MIN_FILES || uses.length / files.length < MAJORITY) continue;

    // A prop counts only where every file that writes it writes the same value,
    // and enough of them write it. The same prop with three different values is
    // what a screen decides for itself, and reporting it as a convention is how
    // advice turns into noise.
    const values = new Map<
      string,
      { seen: Set<string>; shapes: Set<ValueShape>; bare: boolean; unknown: number }
    >();
    for (const use of uses) {
      for (const [key, written] of use.attributes) {
        const entry = values.get(key) ?? {
          seen: new Set<string>(),
          shapes: new Set<ValueShape>(),
          bare: true,
          unknown: 0,
        };
        if (written.value === null) entry.unknown++;
        else entry.seen.add(written.value);
        entry.shapes.add(written.shape);
        // Bare only where every file that writes it writes it bare.
        entry.bare = entry.bare && written.bare;
        values.set(key, entry);
      }
    }

    // The weakest thing this component's line will claim. It starts at the
    // number of files that use the component and drops to whatever the least
    // widely written prop or class token is actually supported by.
    let agreedBy = uses.length;

    const agreed: { name: string; value: string; bare: boolean; writtenBy: number }[] = [];
    // Props most screens write, whatever value each chooses, with how many.
    const always: { name: string; shape: ValueShape | null; writtenBy: number }[] = [];

    for (const [name, entry] of values) {
      const writtenBy = uses.filter((use) => use.attributes.has(name)).length;
      // A value nobody states is not a value agreed on, and one file writing
      // `title="Orders"` while three write `title={t(…)}` is not agreement
      // either — before this, those three were simply not recorded.
      if (entry.seen.size === 1 && entry.unknown === 0) {
        if (writtenBy < MIN_FILES || writtenBy / uses.length < MAJORITY) continue;
        agreed.push({ name, value: [...entry.seen][0]!, bare: entry.bare, writtenBy });
        continue;
      }
      if (writtenBy < MIN_FILES || writtenBy / uses.length < MAJORITY) continue;
      always.push({
        name,
        // The shape is a claim about the screens that write it at all, so it is
        // read over those and not over the whole family.
        shape: entry.shapes.size === 1 ? [...entry.shapes][0]! : null,
        writtenBy,
      });
    }
    // Sliced before the support is measured: a prop that does not appear in the
    // advice must not lower the number the advice prints.
    const props = agreed.sort((a, b) => b.writtenBy - a.writtenBy).slice(0, MAX_PROPS);
    for (const prop of props) agreedBy = Math.min(agreedBy, prop.writtenBy);

    // Against every use, not against the files that happen to write classes
    // plainly. Three siblings writing `className="flex-1 overflow-hidden"` and
    // seven writing `className={cn(...)}` is not ten screens agreeing on
    // anything — and in a Tailwind or clsx codebase the dynamic form is the
    // majority, so measuring against the plain ones was the normal path.
    const counted = new Map<string, number>();
    for (const use of uses) {
      for (const token of use.classes ?? []) counted.set(token, (counted.get(token) ?? 0) + 1);
    }
    const classes = [...counted.entries()]
      .filter(([, count]) => count / uses.length >= MAJORITY && count >= MIN_FILES)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_CLASSES);
    for (const [, count] of classes) agreedBy = Math.min(agreedBy, count);
    // As the siblings spell it. Falling back to `class` would be a guess, and
    // in JSX a wrong one, so a component with no observed classes reports the
    // template spelling only because nothing is rendered with it.
    const classAttribute = uses.find((use) => use.classAttribute !== null)?.classAttribute ?? 'class';

    const written = always
      .sort((a, b) => b.writtenBy - a.writtenBy || a.name.localeCompare(b.name))
      .slice(0, MAX_PROPS);

    if (props.length === 0 && classes.length === 0 && written.length === 0) continue;
    usages.push({
      component,
      props: props.map(({ name, value, bare }) => ({ name, value, bare })),
      written,
      classes: classes.map(([token]) => token),
      classAttribute,
      seenIn: uses.length,
      agreedBy,
    });
  }

  if (usages.length === 0) return null;
  return usages.sort((a, b) => b.seenIn - a.seenIn).slice(0, MAX_COMPONENTS);
};

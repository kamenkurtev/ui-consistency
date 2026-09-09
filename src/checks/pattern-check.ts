import { trailingWord } from '../sources/names.js';
import { writtenIn } from '../sources/usage.js';
import { quoted } from '../core/quote.js';
import type { Deviation } from './contract.js';
import type { PatternFile, StructureLine } from '../knowledge/pattern-file.js';
import { flatLines } from '../sources/tree.js';
import type { ScreenTree } from '../sources/tree.js';

/**
 * What a screen was measured against, and what nobody measured.
 *
 * The second half is not a courtesy. A pattern file states sentences no program
 * can evaluate — *actions are always rendered; gating toggles `disabled` only* —
 * and a verifier that printed nothing for them would let a screen pass against
 * rules nobody checked. Handing them over is what the advisory half of this tool
 * already does; the new part is that the verifier says which is which.
 */
export interface PatternReport {
  deviations: Deviation[];
  /** Stated by the pattern, evaluated by nothing here. Reported as such. */
  handedOver: string[];
}

/** A strength the pattern wrote as `N of M`, where it did. */
const counted = (strength: string | null): { of: number; by: number } | null => {
  const match = /^(\d+)\s+of\s+(\d+)\b/.exec(strength ?? '');
  return match === null ? null : { by: Number(match[1]), of: Number(match[2]) };
};

/**
 * Is this line something every screen of the kind has?
 *
 * Only where the pattern says so in a form that means it: no strength at all, or
 * a count that is unanimous. `5 of 9` is a fact about the family and not a
 * requirement, and treating it as one would fail four screens the pattern itself
 * describes.
 */
const required = (line: StructureLine): boolean => {
  const count = counted(line.strength);
  return line.strength === null || (count !== null && count.by === count.of);
};

/** Does the screen's component fill what the pattern's line names? */
const matches = (line: string, rendered: string): boolean => {
  if (line.startsWith('*')) return trailingWord(rendered) === line.slice(1);
  return line === rendered;
};

/** A slot written for a person — `<content>` — which nothing here evaluates. */
const isProse = (name: string): boolean => name.startsWith('<') && name.endsWith('>');

/**
 * Where a screen leaves the pattern its project wrote down.
 *
 * The step that replaces a person opening thirty pages and comparing them, and
 * the narrowest part of the loop until now: it compared against a JSON object
 * describing one holder, while the pattern states nesting, alternatives, props
 * per component and rules in prose.
 *
 * Every dimension it cannot evaluate is **said**, never passed. A screen that
 * matches everything checkable and has three unevaluated rules over it is not
 * the same result as a screen with nothing said about it, and a verifier that
 * printed the same thing for both would be the silent-pass this repository keeps
 * finding.
 */
export function patternDeviations(
  file: string,
  source: string,
  pattern: PatternFile,
  tree: ScreenTree | null,
): PatternReport {
  const deviations: Deviation[] = [];
  const say = (message: string): void => {
    deviations.push({ file, message });
  };

  if (tree !== null) checkStructure(pattern, tree, say);
  checkProps(file, source, pattern, say);

  return { deviations, handedOver: handOver(pattern) };
}

/**
 * The nesting: what the pattern says is always there, and in what order.
 *
 * Only two things are faulted, and both are what #11 names: a level the pattern
 * says every screen has and this one omits, and an order the screen inverts.
 * Everything else the structure block says — a child five of nine screens have,
 * a slot written in prose — is evidence rather than a requirement, and failing a
 * screen on it would fail screens the pattern itself describes.
 */
function checkStructure(
  pattern: PatternFile,
  tree: ScreenTree,
  say: (message: string) => void,
): void {
  const [root, ...rest] = pattern.structure;
  if (root === undefined) return;

  if (!isProse(root.name) && !matches(root.name, tree.root.name)) {
    say(`sits in <${tree.root.name}>; screens of this kind sit in <${root.name}>`);
    return;
  }

  const rendered = flatLines(tree.root);
  for (const line of rest) {
    if (isProse(line.name) || !required(line)) continue;
    const found = rendered.some(
      (one) => one.indent === line.indent && matches(line.name, one.name),
    );
    if (!found) {
      const anywhere = rendered.some((one) => matches(line.name, one.name));
      say(
        anywhere
          ? `renders <${line.name}> somewhere else; screens of this kind hold it ${where(line.indent)}`
          : `does not render <${line.name}>, which every screen of this kind has`,
      );
    }
  }

  const order = rest.filter((line) => line.indent === 1 && !isProse(line.name) && required(line));
  const at = (name: string): number =>
    rendered.findIndex((one) => one.indent === 1 && matches(name, one.name));
  const places = order.map((line) => at(line.name));
  if (places.every((one) => one >= 0)) {
    for (let i = 1; i < places.length; i++) {
      if (places[i]! < places[i - 1]!) {
        say(
          `renders <${order[i]!.name}> before <${order[i - 1]!.name}>; ` +
            'screens of this kind write them the other way round',
        );
        break;
      }
    }
  }
}

/** How deep, in the words a reader of the structure block already has. */
const where = (indent: number): string =>
  indent === 1 ? 'directly inside the holder' : `${indent} levels in`;


/**
 * The props, with the strength the pattern states.
 *
 * The same sentence the contract check already produces, from a different
 * source: *"writes the table without `density`, which 5 of the 6 screens of this
 * kind write."* A strength the pattern wrote as a sentence rather than a count
 * is repeated as that sentence — it is what somebody meant, and turning it into
 * a number here would state a count nobody counted.
 */
function checkProps(
  file: string,
  source: string,
  pattern: PatternFile,
  say: (message: string) => void,
): void {
  if (pattern.props.length === 0) return;
  const written = writtenIn(file, source, { all: true });

  for (const component of pattern.props) {
    const uses = written.filter((one) => matches(component.component, one.component));
    if (uses.length === 0) continue;
    // The screen's own word. Told "writes `<*Grid>` without `density`" a reader
    // goes looking for a component called `*Grid`.
    const spelt = uses[0]?.component ?? component.component;

    for (const prop of component.props) {
      const strength =
        prop.writtenBy !== null && prop.of !== null
          ? prop.writtenBy >= prop.of
            ? 'which every screen of this kind writes'
            : `which ${prop.writtenBy} of the ${prop.of} screens of this kind write`
          : prop.strength === null
            ? 'which this kind of screen writes'
            : `which the pattern states as: ${prop.strength}`;

      const values = uses.map((use) => use.attributes.get(prop.name));
      if (values.every((value) => value === undefined)) {
        say(`writes <${spelt}> without ${prop.name}, ${strength}`);
        continue;
      }
      if (prop.value === null) continue;
      // Written as an expression is a value this cannot read, not a wrong one.
      const stated = values.map((value) => value?.value);
      if (stated.some((value) => value === null)) continue;
      if (stated.every((value) => value === undefined || value === prop.value)) continue;
      const other = stated.find((value) => value !== undefined && value !== prop.value)!;
      say(
        `writes <${spelt} ${prop.name}="${quoted(other)}">, ` +
          `where this kind writes ${prop.name}="${quoted(prop.value)}" — ${strength}`,
      );
    }
  }
}

/**
 * What the pattern states and nothing here evaluated.
 *
 * The rules verbatim, and every slot written for a person to read. Both are
 * things a screen could be wrong about with no finding to show for it, and the
 * reader has to know that rather than infer it from silence.
 */
function handOver(pattern: PatternFile): string[] {
  const slots = pattern.structure
    .filter((line) => isProse(line.name))
    .map((line) => `${line.name}${line.strength === null ? '' : ` — ${line.strength}`}`);

  return [
    ...pattern.rules,
    ...(slots.length === 0 ? [] : [`slots nothing here reads: ${slots.join(', ')}`]),
  ];
}

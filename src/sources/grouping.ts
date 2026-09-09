import { relative } from 'node:path';
import { screenTree, type TreeNode } from './tree.js';
import { trailingWord } from './pattern.js';

export interface Group {
  /** The shared structure, one line per level, already indented. */
  signature: string[];
  /** Project-relative, in the order they were given. */
  members: string[];
}

export interface Grouping {
  depth: number;
  /** Largest first. */
  groups: Group[];
  /** Read and not a screen — no component in them at all. Never silently dropped. */
  notScreens: string[];
  /**
   * Screens whose shape matched nothing anybody else renders.
   *
   * Not a group, and reported as its own thing. Every name in their signature
   * was a placeholder, so what they had in common was *nothing* — and on a real
   * repository seven unrelated screens were being presented as one pattern,
   * the largest entry after the real one and the first place a reader's eye
   * lands. Over-splitting sends somebody to look at two entries; this asserted
   * a pattern that does not exist.
   */
  ungrouped: string[];
}

/**
 * A set of screens, grouped by what they are composed of.
 *
 * The scan that answers *"what patterns does this project have"*, which was
 * written by hand from scratch every session and thrown away. Its whole
 * difficulty is that grouping by the names as written gives one group per
 * screen: nine list screens agree on their holder and their filter bar and
 * differ on the grid, because the grid is called `OrdersGrid` in one and
 * `InvoicesGrid` in the next.
 *
 * **So a name only survives into a signature if more than one screen renders
 * it.** A name rendered by exactly one screen is that screen's own business and
 * becomes a placeholder — `*Grid` where the singletons share a trailing word,
 * `<one>` where they do not. That is derived from the set in hand and from
 * nothing else: no list of layout components, no idea what a grid is.
 *
 * The failure direction is over-splitting. Two screens that really share a
 * pattern but whose middles have nothing in common land in two groups, which is
 * a reader looking at two entries instead of one — not a wrong answer presented
 * as a right one.
 */
export async function groupScreens(
  rootDir: string,
  files: string[],
  depth?: number,
): Promise<Grouping> {
  const read: { file: string; lines: { indent: number; name: string }[] }[] = [];
  const notScreens: string[] = [];
  let applied = 0;

  for (const file of files) {
    const tree = await screenTree(rootDir, file, depth === undefined ? {} : { depth });
    if (tree === null) {
      notScreens.push(relative(rootDir, file));
      continue;
    }
    applied = tree.depth;
    read.push({ file: relative(rootDir, file), lines: flatten(tree.root, 0) });
  }

  // How many *screens* render each name, which is the question. Counting
  // usages would let one screen rendering a component twice look like two
  // screens agreeing about it.
  const screensWith = new Map<string, number>();
  for (const one of read) {
    for (const name of new Set(one.lines.map((line) => line.name))) {
      screensWith.set(name, (screensWith.get(name) ?? 0) + 1);
    }
  }

  // A shared trailing word is evidence too: `OrdersGrid` and `InvoicesGrid` are
  // one slot even though no name is repeated. Counted over the singletons only,
  // because a word shared by names several screens write is already carried by
  // the names themselves.
  const singletonSuffixes = new Map<string, number>();
  for (const [name, count] of screensWith) {
    if (count > 1) continue;
    const word = trailingWord(name);
    if (word !== null) singletonSuffixes.set(word, (singletonSuffixes.get(word) ?? 0) + 1);
  }

  const groups = new Map<string, Group & { concrete: string[] }>();
  const ungrouped: string[] = [];
  for (const one of read) {
    const concrete = one.lines.map((line) => `${'  '.repeat(line.indent)}${line.name}`);
    const abstracted = one.lines.map((line) =>
      abstract(line.name, screensWith, singletonSuffixes),
    );

    // A signature is evidence only where something in it came from more than one
    // screen. `<one>` is the token for *nobody else renders this*, and a
    // signature made entirely of them says these screens have nothing in common
    // — which is the opposite of what a group claims. A shared trailing word is
    // weaker evidence than a shared name and is still evidence, so `*Grid`
    // counts.
    if (abstracted.every((name) => name === '<one>')) {
      ungrouped.push(one.file);
      continue;
    }

    const signature = one.lines.map(
      (line, at) => `${'  '.repeat(line.indent)}${abstracted[at]!}`,
    );
    const key = signature.join('\n');
    const group = groups.get(key) ?? { signature, members: [], concrete };
    group.members.push(one.file);
    groups.set(key, group);
  }

  return {
    depth: applied,
    // **A group of one is shown as it is written.** The placeholders exist to
    // merge screens whose middles differ, and a group that merged nothing has
    // nothing to hide behind them — `<one>` above `<one>` tells the reader less
    // than `Dialog` above `DialogContent`, which is what the file says.
    groups: [...groups.values()]
      .sort((a, b) => b.members.length - a.members.length)
      .map(({ signature, members, concrete }) => ({
        signature: members.length === 1 ? concrete : signature,
        members,
      })),
    notScreens,
    ungrouped,
  };
}

/** What this name stands for, once the set has said how common it is. */
function abstract(
  name: string,
  screensWith: Map<string, number>,
  singletonSuffixes: Map<string, number>,
): string {
  if ((screensWith.get(name) ?? 0) > 1) return name;
  const word = trailingWord(name);
  if (word !== null && (singletonSuffixes.get(word) ?? 0) > 1) return `*${word}`;
  return '<one>';
}

/** The tree as indented lines, which is both the signature and what is printed. */
function flatten(node: TreeNode, indent: number): { indent: number; name: string }[] {
  return [
    { indent, name: node.name },
    ...node.children.flatMap((child) => flatten(child, indent + 1)),
  ];
}

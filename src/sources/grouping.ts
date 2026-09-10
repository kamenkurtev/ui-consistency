import { relative } from 'node:path';
import { flatLines, screenTree } from './tree.js';
import { trailingWord } from './names.js';
import { importedBy, isScreenFile } from './siblings.js';

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
  /**
   * Read and not a screen. Never silently dropped, and never counted as one.
   *
   * Three reasons, and all three were being counted as screens: a file with no
   * component in it at all; a file whose name says what it is — a test, a
   * story, a hook, a `.helpers.`; and **a file another file in the set
   * imports**, which is a part of that screen rather than a peer of it. A grid
   * component and a row renderer are parts of a screen, and reporting them as
   * screens both inflated the group count and put a component's shape beside a
   * screen's as if they were comparable (#32).
   */
  notScreens: string[];
  /** How many files were given, so a few groups over many files cannot read as agreement. */
  given: number;
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

  // A file another file in the set imports is a part of that screen, not a
  // screen beside it — the same rule the family search obeys, decided from the
  // set in hand and from no list of component names. `OrderTotalRow` is a
  // row renderer, and nothing but its name says so; that it is imported by the
  // screen above it is structural.
  // A set, not `includes`: this command is handed whole `pages/` trees — 1 674
  // files on one repository — and a linear scan per import is that squared.
  const given = new Set(files);
  const parts = new Set<string>();
  for (const file of files) {
    // One extra parse per file, on a command that is deliberately not on the
    // edit path. Said here rather than left to be measured by somebody else.
    for (const imported of await importedBy(file)) {
      if (given.has(imported)) parts.add(imported);
    }
  }

  for (const file of files) {
    // What the naming enforces, which is not a vocabulary: `.test.`, `.stories.`
    // and `use` followed by a capital are conventions the ecosystem itself
    // fixes, and a `.helpers.`/`.utils.` segment is a word about the file's
    // role rather than about any project's components.
    if (!isScreenFile(file) || ROLE_FILE.test(file) || parts.has(file)) {
      notScreens.push(relative(rootDir, file));
      continue;
    }
    const tree = await screenTree(rootDir, file, depth === undefined ? {} : { depth });
    if (tree === null) {
      notScreens.push(relative(rootDir, file));
      continue;
    }
    applied = tree.depth;
    read.push({ file: relative(rootDir, file), lines: flatLines(tree.root) });
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

  // **A group differing only by an element some members render is one pattern.**
  // Two groups of two — `FeaturedPage > Header > Text` and the same plus a
  // footer — is not what a person would call two patterns, and splitting them
  // is the fragmentation this command exists to prevent: 13 screens answered
  // 10 groups on a real repository (#32). Merged where one signature is a
  // subsequence of another, and the optional lines then carry the strength the
  // props matrix already prints.
  const merged = mergeOptional([...groups.values()]);

  return {
    depth: applied,
    // **A group of one is shown as it is written.** The placeholders exist to
    // merge screens whose middles differ, and a group that merged nothing has
    // nothing to hide behind them — `<one>` above `<one>` tells the reader less
    // than `Dialog` above `DialogContent`, which is what the file says.
    groups: merged
      .sort((a, b) => b.members.length - a.members.length)
      .map(({ signature, members, concrete }) => ({
        signature: members.length === 1 ? concrete : signature,
        members,
      })),
    notScreens,
    ungrouped,
    given: files.length,
  };
}

/** A compound segment stating the file's role. Not a component name anywhere. */
const ROLE_FILE = /\.(?:helpers?|utils?|constants?|types?|styles?|mocks?|fixtures?)\.[jt]sx?$/i;

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



/** A candidate group, before the optional levels are folded together. */
interface Candidate {
  signature: string[];
  members: string[];
  concrete: string[];
}

/**
 * Fold a group into a larger one it is a subsequence of.
 *
 * The **subsequence** relation and not a similarity score: it says exactly
 * *"these screens render everything those render, and those render more"*,
 * which is what an optional element is. A score would need a threshold nobody
 * can defend, and would merge two patterns that happen to look alike.
 *
 * Largest signature first, so a chain of three strengths folds into the
 * fullest one rather than into whichever was seen first. The lines the smaller
 * group lacks are then marked with how many members render them — the same
 * *N of M* the props matrix prints, and the reason a merged group does not
 * claim more agreement than it has.
 */
function mergeOptional(candidates: Candidate[]): Candidate[] {
  const order = [...candidates].sort((a, b) => b.signature.length - a.signature.length);
  const kept: { host: Candidate; folded: Candidate[] }[] = [];

  for (const candidate of order) {
    // The **smallest** difference, not the first host that contains it. Sorted
    // by length, the longest host matches first, and a screen differing by one
    // optional footer was folded into an unrelated group that merely happened
    // to render more — two patterns reported as one, which is worse than the
    // over-splitting this merge exists to fix.
    const into = kept
      .filter((one) => subsequence(candidate.signature, one.host.signature))
      .map((one) => ({ one, extra: one.host.signature.length - candidate.signature.length }))
      // *Differs only by* an element: the shared part has to dominate. A host
      // with more extra lines than the candidate has lines of its own is a
      // different shape, however neatly the smaller one nests inside it.
      .filter(({ extra }) => extra < candidate.signature.length)
      .sort((a, b) => a.extra - b.extra)[0]?.one;

    if (into === undefined) {
      kept.push({ host: candidate, folded: [] });
      continue;
    }
    into.folded.push(candidate);
    into.host.members.push(...candidate.members);
  }

  return kept.map(({ host, folded }) => {
    if (folded.length === 0) return host;
    const total = host.members.length;
    // Every line the host has, and how many of the folded groups also had it.
    const signature = host.signature.map((line) => {
      const has =
        total -
        folded
          .filter((one) => !one.signature.includes(line))
          .reduce((sum, one) => sum + one.members.length, 0);
      return has === total ? line : `${line}  ${has} of ${total}`;
    });
    return { ...host, signature };
  });
}

/** Whether every line of `small` appears in `whole`, in order. */
function subsequence(small: string[], whole: string[]): boolean {
  if (small.length >= whole.length) return false;
  let at = 0;
  for (const line of whole) {
    if (at < small.length && small[at] === line) at++;
  }
  return at === small.length;
}

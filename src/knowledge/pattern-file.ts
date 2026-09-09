import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { knowledgeDir } from './paths.js';

/** One line of the structure block: how deep it sits, what it is, what was said about it. */
export interface StructureLine {
  indent: number;
  /** `PageShell`, or `<content>` for a slot. */
  name: string;
  /** `9 of 9`, `exactly one`, or nothing. Never parsed into a number. */
  strength: string | null;
}

/**
 * A pattern as a project has written it down.
 *
 * Deliberately half-structured. The frontmatter, the structure block and the
 * member list are read, because the verifier and the selection need them. The
 * slots, the props and the rules are kept as the prose they are and handed
 * over, because they say things no program can evaluate — *actions are always
 * rendered; permission toggles `disabled` only* — and a checker that parsed
 * that into a boolean would report a screen as matching a sentence it never
 * read.
 */
/** One prop, as a pattern file states it. */
export interface PatternProp {
  name: string;
  /** The value the pattern states, where it states one. */
  value: string | null;
  /** As written — `9 of 9`, `most screens`. Kept whether or not it is arithmetic. */
  strength: string | null;
  /** The two numbers, where the strength was written as a count. */
  writtenBy: number | null;
  of: number | null;
}

/** The props a pattern states for one component or slot. */
export interface PatternComponent {
  /** `PageShell`, or `*Grid` for a role the family fills under a different name. */
  component: string;
  props: PatternProp[];
}

export interface PatternFile {
  /** Where it was read from, project-relative. */
  file: string;
  /** The slug in the frontmatter, or the file's own name. */
  name: string;
  /** `screen`, `dialog`, `menu`, … whatever the project wrote. Never validated. */
  surface: string | null;
  holder: string | null;
  /** The date the counts in it were observed, as written. */
  observed: string | null;
  structure: StructureLine[];
  /** The files it says it describes, project-relative as written. */
  members: string[];
  /** Section title → its prose, in the order they appear. */
  sections: Map<string, string>;
  /** The bullets under `## Rules`, each as written. */
  rules: string[];
  /**
   * The props the pattern states, per component.
   *
   * The one section with a grammar, and it earns one: *"writes the table
   * without `density`, which 5 of the 6 screens of this kind write"* is the
   * sentence the verifier exists to produce, and it cannot be produced from
   * prose nobody agreed the shape of. Everything around the list stays prose
   * and is handed over with the rest.
   */
  props: PatternComponent[];
}

/** `## Where it is used`, and the two other spellings a person will write. */
const MEMBERS = /^where it is used$|^used (?:by|in)$/i;
const RULES = /^rules?$/i;
const STRUCTURE = /^structure$/i;
const PROPS = /^props$/i;

/**
 * Every pattern a project has written down.
 *
 * Empty is a real answer and the commonest one — a project that has written
 * nothing has written nothing, and that is not an error. `legacy` says the old
 * knowledge directory was the one read, which is reported rather than silently
 * accepted forever.
 */
export async function patternFiles(
  rootDir: string,
): Promise<{ patterns: PatternFile[]; legacy: boolean }> {
  const { dir, legacy } = await knowledgeDir(rootDir, 'patterns');
  const entries = await readdir(dir).catch(() => null);
  if (entries === null) return { patterns: [], legacy };

  const patterns: PatternFile[] = [];
  for (const entry of entries.filter((name) => name.endsWith('.md')).sort()) {
    const raw = await readFile(join(dir, entry), 'utf8').catch(() => null);
    if (raw === null) continue;
    patterns.push(parsePattern(entry, raw));
  }
  return { patterns, legacy };
}

/**
 * One pattern file, read.
 *
 * Tolerant on purpose. A file missing a section is a file that says less, not a
 * file that is invalid — this is a document a person writes and reviews, and
 * refusing to read one because a heading is spelled differently would be a
 * format that fights its author.
 */
export function parsePattern(file: string, raw: string): PatternFile {
  const { front, body } = splitFrontmatter(raw);

  const sections = new Map<string, string>();
  let current: string | null = null;
  let lines: string[] = [];
  const keep = (): void => {
    if (current !== null) sections.set(current, lines.join('\n').trim());
  };
  for (const line of body.split('\n')) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading !== null) {
      keep();
      current = heading[1] ?? '';
      lines = [];
      continue;
    }
    lines.push(line);
  }
  keep();

  const named = (test: RegExp): string | null => {
    for (const [title, text] of sections) if (test.test(title)) return text;
    return null;
  };

  return {
    file,
    name: front.get('pattern') ?? file.replace(/\.md$/, ''),
    surface: front.get('surface') ?? null,
    holder: front.get('holder') ?? null,
    observed: front.get('observed') ?? null,
    structure: parseStructure(named(STRUCTURE)),
    props: parseProps(named(PROPS)),
    members: parseMembers(named(MEMBERS)),
    sections,
    rules: (named(RULES) ?? '')
      .split('\n')
      .flatMap((line) => {
        const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
        return bullet === null ? [] : [bullet[1]!.trim()];
      })
      .filter((rule) => rule.length > 0),
  };
}

function splitFrontmatter(raw: string): { front: Map<string, string>; body: string } {
  const front = new Map<string, string>();
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (match === null) return { front, body: raw };

  for (const line of (match[1] ?? '').split('\n')) {
    const pair = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
    if (pair !== null) front.set(pair[1]!, pair[2]!.trim());
  }
  return { front, body: raw.slice(match[0].length) };
}

/**
 * The structure block, which is the shape `uic tree` prints.
 *
 * Read out of the first fenced block in the section, so the prose around it is
 * free to explain itself. A line is a name and, after two or more spaces,
 * whatever the author said about how many screens do it — kept as written and
 * never parsed into a number, because `9 of 9` and `exactly one` and `optional`
 * are all things a person writes and only the first is arithmetic.
 */
function parseStructure(text: string | null): StructureLine[] {
  if (text === null) return [];
  const fenced = /```[^\n]*\n([\s\S]*?)```/.exec(text);
  const block = fenced?.[1] ?? text;

  return block.split('\n').flatMap((line) => {
    if (line.trim().length === 0) return [];
    const indent = Math.floor((/^ */.exec(line)?.[0].length ?? 0) / 2);
    const [name, ...rest] = line.trim().split(/\s{2,}/);
    if (name === undefined || name.length === 0) return [];
    const strength = rest.join('  ').trim();
    return [{ indent, name, strength: strength.length === 0 ? null : strength }];
  });
}

/** Paths out of a list or a sentence, in either spelling and however punctuated. */
function parseMembers(text: string | null): string[] {
  if (text === null) return [];
  const found = new Set<string>();
  for (const match of text.matchAll(/`([^`]+)`|(?:^|[\s,])([\w./-]+\.\w+)(?=[\s,.]|$)/gm)) {
    const path = (match[1] ?? match[2] ?? '').trim();
    if (path.includes('.') && !path.startsWith('#')) found.add(path);
  }
  return [...found];
}

/**
 * Which pattern describes this screen.
 *
 * A file the pattern names wins over one whose holder merely matches: naming a
 * file is a person saying so, and a holder match is an inference. Where several
 * patterns claim the same holder and none names the file, the answer is none —
 * the same rule the contract check follows, and for the same reason: the honest
 * answer to an ambiguous question is nothing rather than the nearest guess.
 */
export function patternForScreen(
  patterns: PatternFile[],
  file: string,
  holder: string | null,
): PatternFile | null {
  const named = patterns.filter((one) => one.members.includes(file));
  if (named.length === 1) return named[0]!;
  if (named.length > 1) return null;

  if (holder === null) return null;
  const byHolder = patterns.filter((one) => one.holder === holder);
  return byHolder.length === 1 ? byHolder[0]! : null;
}

/**
 * Which of the files a pattern was read from have changed since it was read.
 *
 * The counts in a pattern file are evidence as at a date, and a stored copy of
 * what the code says can only be wrong — every staleness problem in this
 * repository came from such a copy. So the file states when it was observed and
 * this says what has moved since, at the point the pattern is used, rather than
 * by an audit somebody has to remember to run.
 *
 * A file that no longer exists is reported too: a pattern naming a screen that
 * was deleted is stale in the way that matters most.
 */
export async function staleIn(rootDir: string, pattern: PatternFile): Promise<Stale[]> {
  if (pattern.observed === null) return [];
  const observed = Date.parse(pattern.observed);
  if (Number.isNaN(observed)) return [];

  // The date is a day, not an instant. Anything written during that day is not
  // evidence of drift, so the comparison is against its end.
  const until = observed + 24 * 60 * 60 * 1000;

  const moved: Stale[] = [];
  for (const member of pattern.members) {
    const info = await stat(join(rootDir, member)).catch(() => null);
    // Gone and changed are different things to do about it, and one sentence
    // covering both sends a reader to look at a file that is not there.
    if (info === null) moved.push({ file: member, why: 'gone' });
    else if (info.mtimeMs > until) moved.push({ file: member, why: 'changed' });
  }
  return moved;
}

export interface Stale {
  file: string;
  why: 'changed' | 'gone';
}

/**
 * The `## Props` section, which is the one part of a pattern file with a
 * grammar.
 *
 * ```
 * ### `PageShell`
 * - `title` — 9 of 9
 * - `data-testid` — 9 of 9
 * - `density` = "compact" — 5 of 6
 * ```
 *
 * A `###` per component or slot, a bullet per prop. Prose above and below the
 * bullets is kept in the section and handed over like every other sentence in
 * the file — the grammar is a way in, not a way of forbidding anything.
 *
 * The strength is kept as written *and* parsed where it is a count, because
 * `5 of 6` is arithmetic a verifier can state and `most screens` is a sentence
 * a person wrote. Refusing the second would make the format fight its author;
 * pretending to have parsed it would make the verifier invent a number.
 */
function parseProps(text: string | null): PatternComponent[] {
  if (text === null) return [];

  const found: PatternComponent[] = [];
  let current: PatternComponent | null = null;

  for (const line of text.split('\n')) {
    const heading = /^###\s+`?([^`\s]+)`?\s*$/.exec(line);
    if (heading !== null) {
      current = { component: heading[1]!, props: [] };
      found.push(current);
      continue;
    }
    if (current === null) continue;

    const bullet = /^\s*[-*]\s+`([^`]+)`\s*(.*)$/.exec(line);
    if (bullet === null) continue;

    const rest = bullet[2] ?? '';
    const value = /^=\s*"([^"]*)"/.exec(rest.trim())?.[1] ?? null;
    const strength = rest.replace(/^=\s*"[^"]*"/, '').replace(/^\s*[—-]\s*/, '').trim();
    const counted = /^(\d+)\s+of\s+(\d+)$/.exec(strength);

    current.props.push({
      name: bullet[1]!,
      value,
      strength: strength.length === 0 ? null : strength,
      writtenBy: counted === null ? null : Number(counted[1]),
      of: counted === null ? null : Number(counted[2]),
    });
  }
  return found;
}

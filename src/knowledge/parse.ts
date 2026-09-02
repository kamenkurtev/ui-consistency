import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Knowledge, KnowledgeFragment } from '../types.js';

/**
 * Words that match every file and would therefore rank every fragment.
 *
 * Short and English-only on purpose: this is not a stemmer or a language
 * model, it is a list of the words that would otherwise make retrieval return
 * the whole knowledge base. A rule written in another language keeps its own
 * nouns as keywords, which is what actually does the matching.
 */
export const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'do',
  'does',
  'every',
  'for',
  'from',
  'has',
  'have',
  'in',
  'into',
  'is',
  'it',
  'its',
  'never',
  'no',
  'not',
  'of',
  'on',
  'only',
  'or',
  'own',
  'so',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'they',
  'this',
  'to',
  'use',
  'used',
  'was',
  'which',
  'will',
  'with',
]);

/** `## Heading` → level 2. Not a heading → 0. */
function headingLevel(line: string): number {
  const match = /^(#{1,6})\s+/.exec(line);
  return match === null ? 0 : match[1]!.length;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * The terms a fragment can be found by.
 *
 * Three sources, in the order they carry weight: the heading, whatever is
 * written in `code spans` (which is where component and package names live in
 * a rule), and **emphasised** terms. Prose words are included too but they are
 * what the stopword list exists to thin out.
 */
function keywordsOf(heading: string, body: string): string[] {
  const found = new Set<string>();

  const add = (raw: string): void => {
    const term = raw.toLowerCase();
    if (term.length < 2 || STOPWORDS.has(term)) return;
    found.add(term);
  };

  // A package name survives whole — `@fixture/icons` is one term, not two.
  const packages = /@[\w.-]+\/[\w.-]+/g;
  for (const match of `${heading}\n${body}`.matchAll(packages)) add(match[0]);

  for (const match of body.matchAll(/`([^`]+)`/g)) {
    for (const word of match[1]!.split(/[^\w@/.-]+/)) {
      if (word.includes('/') && !word.startsWith('@')) continue;
      add(word);
    }
  }

  for (const match of body.matchAll(/\*\*([^*]+)\*\*|\*([^*]+)\*/g)) {
    for (const word of (match[1] ?? match[2] ?? '').split(/[^\w-]+/)) add(word);
  }

  for (const word of heading.split(/[^\w@/-]+/)) add(word);

  return [...found];
}

/**
 * The marker a generated file carries: `<!-- uic:generated v=0.13.0 at=… -->`.
 *
 * Read leniently on purpose. The file is written by a model, which may emit a
 * BOM, a blank first line or CRLF, and the dangerous direction is a generated
 * file whose marker went unrecognised — that file would gate. A curated file
 * has no marker and keeps working exactly as before.
 */
const MARKER = /<!--\s*uic:generated\b[^>]*-->/i;

/** How far into the file the marker may be and still count. */
const MARKER_WINDOW = 512;

export function isGenerated(source: string): boolean {
  return MARKER.test(source.slice(0, MARKER_WINDOW));
}

/** The plugin version a generated file records, or null. */
export function generatedVersion(source: string): string | null {
  const marker = MARKER.exec(source.slice(0, MARKER_WINDOW));
  if (marker === null) return null;
  return /\bv=([\w.-]+)/.exec(marker[0])?.[1] ?? null;
}

/**
 * An HTML comment states nothing, and must not be read as if it did.
 *
 * This is not tidiness. `uic init` wrote its instructions to the reader as a
 * comment under the H1 — and those files are still in repositories, because
 * deleting the command did not delete what it wrote. The instructions contain
 * the example sentence
 * "A page of actions uses `<ActionGrid>`, never a raw `<Grid>`" — which
 * `substitutionRules` read as a real prohibition about components the project
 * may not even have. A comment is addressed to the person editing the file,
 * never to the checker.
 */
function withoutComments(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/g, '');
}

function fragmentsFromFile(fileName: string, source: string): KnowledgeFragment[] {
  const kind = basename(fileName).replace(/\.md$/i, '');
  const generated = isGenerated(source);
  const lines = withoutComments(source).split('\n');

  const fragments: KnowledgeFragment[] = [];
  let subject: string | null = null;
  let body: string[] = [];

  const flush = (): void => {
    if (subject === null) return;
    const text = body.join('\n').trim();
    fragments.push({
      id: `${kind}#${slug(subject)}`,
      kind,
      subject,
      body: text,
      keywords: keywordsOf(subject, text),
      ...(generated ? { generated: true as const } : {}),
    });
    body = [];
  };

  for (const line of lines) {
    const level = headingLevel(line);
    if (level === 0) {
      body.push(line);
      continue;
    }
    // Any heading ends the rule above it, including the file's own H1: the
    // preamble under it is a fragment too, because it usually carries the one
    // sentence saying why the rules below exist.
    flush();
    subject = line.slice(level).trim();
  }
  flush();

  // A heading with nothing under it states no rule.
  return fragments.filter((fragment) => fragment.body !== '');
}

/**
 * Read the curated knowledge base: plain Markdown, one rule per heading.
 *
 * Deliberately a small reader rather than a Markdown library. What is needed
 * is headings, code spans and emphasis; a full parser would be a dependency
 * and a startup cost on a path that runs inside an edit.
 *
 * A missing directory is not an error. Most projects will not have one yet,
 * and the tool stays silent rather than inventing a pattern.
 */
export async function parseKnowledge(dir: string): Promise<Knowledge> {
  const entries = await readdir(dir).catch(() => null);
  if (entries === null) return { fragments: [] };

  const fragments: KnowledgeFragment[] = [];
  for (const entry of entries.filter((name) => /\.md$/i.test(name)).sort()) {
    const source = await readFile(join(dir, entry), 'utf8').catch(() => null);
    if (source === null) continue;
    fragments.push(...fragmentsFromFile(entry, source));
  }

  return { fragments };
}

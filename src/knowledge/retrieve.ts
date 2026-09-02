import { parseModule, walk } from '../parse/parse.js';
import { STOPWORDS } from './parse.js';
import type { Knowledge, KnowledgeFragment } from '../types.js';

/**
 * Words that name no particular thing in a UI codebase.
 *
 * Every rule is about a "component" and every file imports from somewhere
 * called `components/`, so a subject hit on that word said nothing — on
 * Backstage it pulled the `Link component` and `Table component` rules into
 * 70% of all files. A word here can still appear in a rule; it just cannot be
 * what makes the rule relevant.
 */
const GENERIC = new Set([
  'component',
  'components',
  'element',
  'index',
  'src',
  'lib',
  'ui',
  'common',
  'shared',
  'utils',
  'helper',
  'helpers',
  'view',
  'app',
  'core',
]);

function isDistinctive(term: string): boolean {
  return term.length > 1 && !STOPWORDS.has(term) && !GENERIC.has(term);
}

export interface RetrieveOptions {
  /** How many fragments may come back. */
  maxFragments?: number;
  /** How many characters of rule body may come back, in total. */
  maxChars?: number;
  /**
   * The file's own name, as a signal about what it is.
   *
   * `RevenueWidget.tsx` is a widget even when the component inside it is
   * called `P`. Only the basename: a directory called `components/` says
   * where a file sits, not what it is, which is the same reason relative
   * import paths contribute nothing.
   */
  filePath?: string;
  /**
   * Terms the caller already knows, for source this cannot parse.
   *
   * A template is not JavaScript. The AST walk returns nothing for one, so
   * without this every curated rule was silent on Angular, Vue and Svelte
   * even once their markup could be read.
   */
  terms?: string[];
}

/**
 * The default budget.
 *
 * This is the cost guarantee in two numbers: whatever the knowledge base
 * grows to, an edit sends at most four rules and about 2000 characters — a few
 * hundred tokens — to the model. A base of a hundred rules costs the same as a
 * base of five.
 */
const DEFAULTS: Required<Omit<RetrieveOptions, 'filePath' | 'terms'>> = {
  maxFragments: 4,
  maxChars: 2000,
};

/** A hit on what a rule is *about* — its kind or its subject. */
const SUBJECT_WEIGHT = 3;
const KIND_WEIGHT = 4;
/** A hit on a word inside the rule. Never enough on its own. */
const BODY_WEIGHT = 1;

/**
 * A rule is relevant when the thing it is about appears in the code — not when
 * it happens to share a word with it. Every fragment mentioning "title" would
 * otherwise come back for every file with a title.
 */
const RELEVANCE_FLOOR = SUBJECT_WEIGHT;

/** `RevenueWidget` → `revenuewidget`, `revenue`, `widget`. */
function termsOfIdentifier(identifier: string): string[] {
  const terms = [identifier.toLowerCase()];
  for (const part of identifier.split(/(?=[A-Z])|[^A-Za-z0-9]+/)) {
    if (part.length > 1) terms.push(part.toLowerCase());
  }
  return terms;
}

/** Crude singular/plural folding: `widgets.md` must match a `Widget`. */
function fold(term: string): string {
  return term.length > 3 && term.endsWith('s') ? term.slice(0, -1) : term;
}

/**
 * What this file is made of: the components it renders, the packages and
 * symbols it imports, and the names it declares.
 *
 * Deliberately not every identifier in the file. A local `total` or `index`
 * says nothing about which design-system rules apply, and including them is
 * how a lexical scorer starts matching everything.
 */
function termsOfSource(source: string): Set<string> {
  const ast = parseModule(source);
  if (ast === null) return new Set();

  const terms = new Set<string>();
  const add = (raw: string): void => {
    for (const term of termsOfIdentifier(raw)) terms.add(fold(term));
  };

  for (const statement of ast.program.body) {
    if (statement.type === 'ImportDeclaration') {
      const specifier = statement.source.value;
      terms.add(specifier.toLowerCase());
      // Only a package name describes the file. A relative path's directories
      // are where the file happens to sit, which is not the same thing — and
      // `../../components/Avatar` would otherwise say this file is about
      // "components".
      if (!specifier.startsWith('.')) {
        for (const segment of specifier.split('/')) add(segment);
      }
      for (const binding of statement.specifiers) add(binding.local.name);
      continue;
    }
    // A declaration's name is where the screen kind usually is: the file that
    // exports `RevenueWidget` is a widget whatever else it contains.
    const declaration =
      statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
        ? statement.declaration
        : statement;
    if (declaration === null || declaration === undefined) continue;
    // `export default function () {}` has no name to take.
    if (declaration.type === 'FunctionDeclaration' && declaration.id != null) {
      add(declaration.id.name);
    }
    if (declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === 'Identifier') add(declarator.id.name);
      }
    }
  }

  walk(ast.program, (node) => {
    if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier') {
      add(node.name.name);
    }
  });

  return terms;
}

function score(fragment: KnowledgeFragment, terms: ReadonlySet<string>): number {
  let aboutness = 0;
  let incidental = 0;

  for (const part of termsOfIdentifier(fragment.kind)) {
    if (isDistinctive(part) && terms.has(fold(part))) aboutness += KIND_WEIGHT;
  }
  for (const word of fragment.subject.split(/[^\w@/-]+/)) {
    const term = word.toLowerCase();
    if (isDistinctive(term) && terms.has(fold(term))) aboutness += SUBJECT_WEIGHT;
  }
  for (const keyword of fragment.keywords) {
    if (terms.has(fold(keyword))) incidental += BODY_WEIGHT;
  }

  // Aboutness is the gate; the body words only order what got through it.
  return aboutness >= RELEVANCE_FLOOR ? aboutness + incidental : 0;
}

/**
 * The fragments of the knowledge base that bear on this edit, ranked and
 * capped.
 *
 * Lexical, in-process, no embeddings and no network — a deliberate constraint,
 * not a limitation to be lifted. The cap is what makes the model call
 * affordable, so it is enforced here rather than trusted to the caller: a
 * fragment that does not fit is dropped, never truncated, because half a rule
 * is a rule that says something else.
 */
export function retrieve(
  source: string,
  knowledge: Knowledge,
  options: RetrieveOptions = {},
): KnowledgeFragment[] {
  const { maxFragments, maxChars } = { ...DEFAULTS, ...options };
  if (knowledge.fragments.length === 0) return [];

  const terms = termsOfSource(source);
  for (const term of options.terms ?? []) {
    for (const part of termsOfIdentifier(term)) terms.add(fold(part));
  }
  if (options.filePath !== undefined) {
    const base = options.filePath.split('/').pop() ?? '';
    for (const term of termsOfIdentifier(base.replace(/\.[jt]sx?$/, ''))) terms.add(fold(term));
  }
  if (terms.size === 0) return [];

  const ranked = knowledge.fragments
    .map((fragment) => ({ fragment, score: score(fragment, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const chosen: KnowledgeFragment[] = [];
  let used = 0;
  for (const { fragment } of ranked) {
    if (chosen.length >= maxFragments) break;
    if (used + fragment.body.length > maxChars) continue;
    chosen.push(fragment);
    used += fragment.body.length;
  }

  return chosen;
}

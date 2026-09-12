import { readFile } from 'node:fs/promises';
import { parseModule, walk } from '../parse/parse.js';

/**
 * Which files are screens, and what each one imports.
 *
 * Both halves lived in `siblings.ts`, which derived a screen's family and is
 * gone (#77). Neither is derivation: one is a question about a *file name*, the
 * other reads the import statements a file actually contains. `uic group` needs
 * both and nothing else from those 463 lines, so they are here rather than
 * keeping the file that held them — or being copied a third time, which is what
 * the docblock below was written to stop.
 */

/**
 * What counts as a screen file.
 *
 * ~~`usage.ts` still builds its own from local constants and `neighbours.ts`
 * still uses a narrower JSX-only variant — they have not been moved onto
 * these, and the copies are still copies.~~ **Both of those files are gone
 * (#77), so this is now the only copy** — which is the outcome that paragraph
 * wanted and could not have while three callers needed three answers.
 */
export const isScreenFile = (name: string): boolean =>
  // `.component.ts` is half of an Angular screen — the half that carries the
  // identity — and without it the family of an Angular screen was its templates
  // alone, each with no imports and no name a route could use (#229). Both
  // halves are candidates; `patternOf` folds them back into one screen.
  (/\.(?:[jt]sx|html|vue|svelte)$/.test(name) || /\.component\.[jt]s$/.test(name)) &&
  !/\.(?:test|spec|stories|story)\.(?:[jt]sx?|html|vue|svelte)$/.test(name) &&
  !HOOK_FILE.test(name);

/**
 * A hook, which returns behaviour and is not a screen.
 *
 * Measured: a dialog's family came back as four files, one of them
 * `useGetColumns.tsx` (#5). A hook that builds a column definition renders JSX
 * and parses as a screen, and then a family of real screens is measured partly
 * against something that has no screen in it.
 *
 * `use` followed by a capital is not a guess about this project's vocabulary —
 * it is the naming React itself enforces, in the same class as `.test.` above
 * and unlike any list of component names. A project whose hooks are named
 * otherwise simply keeps the behaviour it has today.
 */
const HOOK_FILE = /^use[A-Z]/;

/**
 * Every specifier a file imports, as written, resolved by nobody.
 *
 * ~~Split out of {@link importedBy} because the two callers need different
 * resolution and only one of them can have it.~~ **One caller left (#77): the
 * family search that needed relative-only reach is gone.** Resolution still
 * belongs to the caller, because `uic group` has to follow a specifier written
 * as a package name or through a `tsconfig` alias, which is how the monorepo
 * shape this plugin is built for writes the components a screen renders (#62).
 *
 * Static `import` and dynamic `import()`; a lazily imported screen is imported.
 */
export async function specifiersOf(target: string): Promise<string[]> {
  const source = await readFile(target, 'utf8').catch(() => null);
  if (source === null) return [];

  const ast = parseModule(source, target);
  if (ast === null) return [];

  const specifiers: string[] = [];
  walk(ast.program, (node) => {
    if (node.type === 'ImportDeclaration') specifiers.push(node.source.value);
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Import' &&
      node.arguments[0]?.type === 'StringLiteral'
    ) {
      specifiers.push(node.arguments[0].value);
    }
  });
  return specifiers;
}

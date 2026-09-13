import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { File, Statement } from '@babel/types';
import { parseModule } from '../parse/parse.js';

/**
 * The names a single export statement introduces, types and `default`
 * excluded. Shared so that the export reader and the deprecation reader agree
 * on what counts as an exported symbol.
 */
export function exportedNamesOf(statement: Statement): string[] {
  if (statement.type !== 'ExportNamedDeclaration') return [];
  // `export type { X }` and `export type X = ...` describe nothing renderable.
  if (statement.exportKind === 'type') return [];

  const declaration = statement.declaration;
  if (declaration !== null && declaration !== undefined) {
    switch (declaration.type) {
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        return declaration.id === null || declaration.id === undefined ? [] : [declaration.id.name];
      case 'VariableDeclaration':
        return declaration.declarations.flatMap((d) =>
          d.id.type === 'Identifier' ? [d.id.name] : [],
        );
      case 'TSEnumDeclaration':
        return [declaration.id.name];
      default:
        // Interfaces and type aliases are types, whatever `exportKind` says.
        return [];
    }
  }

  return statement.specifiers.flatMap((specifier) => {
    if (specifier.type !== 'ExportSpecifier') return [];
    if (specifier.exportKind === 'type') return [];
    const exported = specifier.exported;
    return exported.type === 'Identifier' && exported.name !== 'default' ? [exported.name] : [];
  });
}

/**
 * Every name this source exports under an importable identifier.
 *
 * Types are excluded along with `default`. A default export carries no name at
 * the import site, and a type cannot be the wrong component.
 */
export function exportedSymbolsOf(ast: File): Set<string> {
  const names = new Set<string>();
  for (const statement of ast.program.body) {
    for (const name of exportedNamesOf(statement)) names.add(name);
  }
  return names;
}

/**
 * The same, for a caller holding only the text.
 *
 * Prefer `exportedSymbolsOf` wherever the AST is already in hand: this parses,
 * and two callers on the per-edit path were parsing a file they had parsed
 * themselves a line earlier (#177).
 */
export function exportedSymbolsFromSource(source: string): Set<string> {
  const ast = parseModule(source);
  return ast === null ? new Set<string>() : exportedSymbolsOf(ast);
}

/**
 * The specifiers of this module's `export * from '...'` statements.
 *
 * A real barrel is almost always written this way and names nothing, so
 * without following the star one hop the inventory of a typical package comes
 * back empty and the check silently finds nothing.
 */
export function starReexportsFromSource(source: string): string[] {
  const ast = parseModule(source);
  if (ast === null) return [];

  return ast.program.body.flatMap((statement) =>
    statement.type === 'ExportAllDeclaration' && statement.exportKind !== 'type'
      ? [statement.source.value]
      : [],
  );
}

const ENTRY_CANDIDATES = [
  'src/index.ts',
  'src/index.tsx',
  'index.ts',
  'index.tsx',
  'src/index.js',
  'index.js',
];

/**
 * The entry file a package's exports are read from, or null when there is none.
 *
 * `source` is consulted before `module` and `main` because a workspace package
 * usually points those at build output that may not exist yet.
 *
 * **And a declared entry is taken only if it is there** (#70). This knew the
 * fields point at build output and then returned one without looking, so a
 * package declaring `"main": "./index.js"` — the file the build emits, absent
 * in the checkout this plugin runs in — answered a path nothing could read, and
 * the conventional candidates beneath were never tried. On one real React
 * monorepo that was **15 of 15 workspace packages**: no chain readable for any
 * file, so the three checks that need one — imports, deprecated usage, and the
 * layer half of substitutions — could not fire at all. `uic check` returned 31
 * findings over 1 961 files, none of them import findings, and nothing said the
 * three were dead. The same binary on a workspace bound by `tsconfig` aliases
 * returned 81 import findings over 1 606 files; the difference was not the
 * code.
 *
 * Falling through is the whole point of having a second mechanism, and
 * `CLAUDE.md` describes exactly two — a declared package taken at its word, and
 * aliases filling in what no manifest describes. A manifest describing an entry
 * that only exists after a build is a third case, and it belongs to the
 * fallback rather than to the word.
 */
export async function entryFileFor(packageRoot: string): Promise<string | null> {
  const readable = async (path: string): Promise<boolean> =>
    (await readFile(path, 'utf8').catch(() => null)) !== null;

  const raw = await readFile(join(packageRoot, 'package.json'), 'utf8').catch(() => null);
  if (raw !== null) {
    try {
      const pkg = JSON.parse(raw) as { source?: unknown; main?: unknown; module?: unknown };
      for (const field of [pkg.source, pkg.module, pkg.main]) {
        if (typeof field !== 'string') continue;
        const declared = join(packageRoot, field);
        if (await readable(declared)) return declared;
        // A declared entry with no extension resolves the way a bundler would,
        // which is also how a `source` field is usually written.
        for (const suffix of ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']) {
          if (await readable(`${declared}${suffix}`)) return `${declared}${suffix}`;
        }
      }
    } catch {
      // Fall through to the conventional candidates.
    }
  }

  for (const candidate of ENTRY_CANDIDATES) {
    const path = join(packageRoot, candidate);
    if (await readable(path)) return path;
  }
  return null;
}

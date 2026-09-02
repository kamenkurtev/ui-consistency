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
 */
export async function entryFileFor(packageRoot: string): Promise<string | null> {
  const raw = await readFile(join(packageRoot, 'package.json'), 'utf8').catch(() => null);
  if (raw !== null) {
    try {
      const pkg = JSON.parse(raw) as { source?: unknown; main?: unknown; module?: unknown };
      for (const field of [pkg.source, pkg.module, pkg.main]) {
        if (typeof field === 'string') return join(packageRoot, field);
      }
    } catch {
      // Fall through to the conventional candidates.
    }
  }

  for (const candidate of ENTRY_CANDIDATES) {
    const path = join(packageRoot, candidate);
    if ((await readFile(path, 'utf8').catch(() => null)) !== null) return path;
  }
  return null;
}

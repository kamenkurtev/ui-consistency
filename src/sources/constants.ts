import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseModule } from '../parse/parse.js';
import type { Node } from '@babel/types';

/**
 * String constants a file can see, by the name a route table would write.
 *
 * `RoutePaths.Dashboard` for an enum member or a property of a frozen object,
 * `DASHBOARD` for a plain exported string. The key is what appears at the use
 * site, so resolution is a lookup and never a second interpretation of the
 * expression.
 */
export type Constants = Map<string, string>;

/**
 * Why this exists.
 *
 * `uic place` reads the **literal** in `path:`, and a project that keeps its
 * paths as constants — an enum, a frozen object, a module of exported strings —
 * answers `path: null` for every screen it registers. That is a common React
 * convention, and on one real application it was every route in the app: the
 * registration was found and the path was null 117 times (#36).
 *
 * **By value, never by name.** Nothing here infers that `RoutePaths.Dashboard`
 * is `'dashboard'` from the member's spelling. Where the declaration cannot be
 * read the name is simply absent from the map and the caller answers `null`, so
 * the failure direction stays a miss rather than an invented path — the rule
 * `src/layers/cache.ts` states and the one a router reader has already broken
 * once, by borrowing a neighbouring entry's path.
 */
export async function constantsFor(
  file: string,
  source: string,
  moduleAt: (base: string) => Promise<string | null>,
  wanted: Set<string>,
): Promise<Constants> {
  const found: Constants = new Map();
  // Nothing in this table is written as a name, so there is nothing to resolve
  // and nothing to read. This is the common case and it must cost nothing: a
  // route table imports every screen it registers, and following those to look
  // for constants would read and parse the whole application on every edit.
  if (wanted.size === 0) return found;

  const ast = parseModule(source, file);
  if (ast === null) return found;
  const program = ast.program as Node;

  declaredIn(program, found);

  // One hop, and only what this file actually imports. A route table imports
  // its paths module directly — that is the whole point of keeping them in one
  // place — and walking further would read a graph to answer a question about
  // one file.
  for (const [spec, names] of importedNames(program)) {
    if (!spec.startsWith('.')) continue;
    // Only a module that brings in a name a path is written with. Everything
    // else this table imports is a screen, a guard or a layout.
    if (!names.some(([local]) => wanted.has(local))) continue;
    const path = await moduleAt(join(dirname(file), spec));
    if (path === null) continue;
    const text = await readFile(path, 'utf8').catch(() => null);
    if (text === null || text.length > MAX_MODULE_BYTES) continue;
    const module = parseModule(text, path);
    if (module === null) continue;

    const theirs: Constants = new Map();
    declaredIn(module.program as Node, theirs);

    for (const [local, exported] of names) {
      if (exported === NAMESPACE) {
        // `import * as Paths` — everything of theirs under the local alias, so
        // both `Paths.DASHBOARD` and `Paths.RoutePaths.Dashboard` resolve.
        for (const [key, value] of theirs) found.set(`${local}.${key}`, value);
        continue;
      }
      // A plain string keeps its own name; a container carries its members.
      const own = theirs.get(exported);
      if (own !== undefined) found.set(local, own);
      for (const [key, value] of theirs) {
        if (key.startsWith(`${exported}.`)) found.set(`${local}.${key.slice(exported.length + 1)}`, value);
      }
    }
  }

  return found;
}

/** Big enough for a module of paths, small enough that this is never a scan. */
const MAX_MODULE_BYTES = 200_000;

/** The marker for `import * as X`, which cannot collide with an export name. */
const NAMESPACE = '*';

/**
 * The string constants one program declares, whether or not it exports them.
 *
 * Three shapes, because all three are written in the wild and a reader that
 * knows one of them is silent on the projects using the others:
 *
 * - `enum RoutePaths { Dashboard = 'dashboard' }` — and `const enum`, which is
 *   the same declaration to Babel.
 * - `const RoutePaths = { Dashboard: 'dashboard' } as const` — and the
 *   `Object.freeze({…})` spelling of it.
 * - `const DASHBOARD = 'dashboard'` — a module of exported strings.
 *
 * Only string values. A member computed from another member is not resolved:
 * it would need evaluation, and a wrong path is worse than none.
 */
function declaredIn(program: Node, into: Constants): void {
  for (const node of statementsOf(program)) {
    const declaration = node.type === 'ExportNamedDeclaration' ? (node.declaration as Node | null) : node;
    if (declaration === null || declaration === undefined) continue;

    if (declaration.type === 'TSEnumDeclaration') {
      const name = declaration.id.name;
      // Babel moved the members inside a `TSEnumBody`. Both shapes are read
      // rather than one being assumed: a version bump that silently returned
      // nothing here would look exactly like a project with no enums.
      const holder = declaration as unknown as {
        members?: unknown;
        body?: { members?: unknown };
      };
      const members = (
        Array.isArray(holder.body?.members) ? holder.body.members : holder.members
      ) as { id: Node; initializer?: Node | null }[] | undefined;
      for (const member of members ?? []) {
        const key =
          member.id.type === 'Identifier'
            ? member.id.name
            : member.id.type === 'StringLiteral'
              ? member.id.value
              : null;
        const value = plainString(member.initializer as Node | null | undefined);
        if (key !== null && value !== null) into.set(`${name}.${key}`, value);
      }
      continue;
    }

    if (declaration.type !== 'VariableDeclaration') continue;
    for (const declarator of declaration.declarations) {
      if (declarator.id.type !== 'Identifier') continue;
      const name = declarator.id.name;
      const init = unwrap(declarator.init as Node | null | undefined);
      if (init === null) continue;

      const plain = plainString(init);
      if (plain !== null) {
        into.set(name, plain);
        continue;
      }
      if (init.type !== 'ObjectExpression') continue;
      for (const property of init.properties) {
        if (property.type !== 'ObjectProperty') continue;
        const key =
          property.key.type === 'Identifier'
            ? property.key.name
            : property.key.type === 'StringLiteral'
              ? property.key.value
              : null;
        const value = plainString(property.value as Node);
        if (key !== null && value !== null) into.set(`${name}.${key}`, value);
      }
    }
  }
}

/** `as const`, `satisfies`, and `Object.freeze({…})` — wrappers, not values. */
function unwrap(node: Node | null | undefined): Node | null {
  let current = node ?? null;
  for (let hop = 0; current !== null && hop < 4; hop++) {
    if (current.type === 'TSAsExpression' || current.type === 'TSSatisfiesExpression') {
      current = current.expression as Node;
      continue;
    }
    if (
      current.type === 'CallExpression' &&
      current.callee.type === 'MemberExpression' &&
      current.callee.property.type === 'Identifier' &&
      current.callee.property.name === 'freeze' &&
      current.arguments.length === 1
    ) {
      current = current.arguments[0] as Node;
      continue;
    }
    return current;
  }
  return current;
}

/**
 * A string the node writes outright — a literal, or a template with nothing in
 * it. Exported because `routes.ts` asks the same question of a `path:` before
 * it tries to resolve anything, and a second copy of four lines is the shape
 * `tests/core/duplicates.test.ts` exists to refuse.
 */
export const plainString = (node: Node | null | undefined): string | null => {
  if (node === null || node === undefined) return null;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? null;
  }
  return null;
};

/** Statements at the top of the program, and inside a module block. */
function statementsOf(program: Node): Node[] {
  const out: Node[] = [];
  const body = (program as { body?: unknown }).body;
  if (!Array.isArray(body)) return out;
  for (const statement of body as Node[]) {
    out.push(statement);
    // `declare module` and `namespace Foo { … }` wrap their declarations.
    const inner = (statement as { body?: unknown }).body;
    if (inner !== null && typeof inner === 'object' && Array.isArray((inner as { body?: unknown }).body)) {
      out.push(...((inner as { body: Node[] }).body));
    }
  }
  return out;
}

/** Specifier → the local names it brings in, each with what it was exported as. */
function importedNames(program: Node): Map<string, [local: string, exported: string][]> {
  const out = new Map<string, [string, string][]>();
  for (const statement of statementsOf(program)) {
    if (statement.type !== 'ImportDeclaration') continue;
    const spec = statement.source.value;
    const names = out.get(spec) ?? [];
    for (const one of statement.specifiers) {
      if (one.type === 'ImportSpecifier') {
        const exported =
          one.imported.type === 'Identifier' ? one.imported.name : one.imported.value;
        names.push([one.local.name, exported]);
      } else if (one.type === 'ImportDefaultSpecifier') {
        names.push([one.local.name, 'default']);
      } else if (one.type === 'ImportNamespaceSpecifier') {
        names.push([one.local.name, NAMESPACE]);
      }
    }
    out.set(spec, names);
  }
  return out;
}

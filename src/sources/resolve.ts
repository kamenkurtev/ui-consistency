import { dirname, join, resolve, sep } from 'node:path';
import { moduleAt, resolveRelative } from './routes.js';
import { insideProject } from '../layers/tsconfig.js';
import { tsconfigPaths, type TsconfigPaths } from '../layers/tsconfig.js';
import { cachedPackages } from '../layers/cache.js';
import { entryFileFor } from '../inventory/exports.js';
import { contains } from '../layers/chain.js';
import type { PackageInfo } from '../types.js';

/**
 * Where a specifier written in one file leads, when it leads inside the project.
 *
 * The one thing every reader that wants to follow a screen into its children
 * needs, and the one thing this repository did not have. `resolveRelative`
 * answers for `./OrdersGrid` and says so in its own comment: an aliased
 * specifier needs the project's `tsconfig`, and guessing at it would invent a
 * file. That was the right refusal for the family — a wrong sibling is a wrong
 * contract — and it is the wrong refusal here, because on a real repository
 * most children are imported through an alias and refusing them means reading
 * depth 1 and calling it the screen.
 *
 * **Outside the project is a leaf, never a step.** A component from an external
 * library has internals this tool has no business walking and no ability to
 * judge: `react`, `@mui/material`, anything under `node_modules`. `null` here
 * means *not ours*, and the caller says which of the two it is.
 *
 * The trust boundary is the same one #174 established for alias targets, and
 * through the same function: an alias may point outside the project — a
 * `tsconfig.json` arriving in a pull request is enough — and a lexical test on
 * the written path passes where a symlink does not.
 */
export interface Resolver {
  /** The file inside the project this specifier leads to, or `null`. */
  find(fromFile: string, specifier: string): Promise<string | null>;
  /**
   * How the specifier was written, before anything is read from disk.
   *
   * `null` from `find` has two meanings a caller must not merge: a package the
   * project depends on is a **leaf by design**, and a relative or aliased path
   * that did not resolve is something we could not follow. Reporting the second
   * as the first is a walk claiming it reached the bottom of a screen it lost
   * its way in.
   */
  shape(specifier: string): 'relative' | 'aliased' | 'workspace' | 'package';
  /**
   * The workspace package a file belongs to, where one does.
   *
   * A caller needs it to tell *this package's own component* from *another
   * package of the same project*. The second is the design system on the
   * repository shape this plugin is built for, and walking into it describes
   * the library rather than the screen.
   */
  packageOf(file: string): string | null;
}

/**
 * A resolver for one project, with its aliases read once.
 *
 * Read once because a walk resolves every import of every file it touches, and
 * re-reading `tsconfig.json` per specifier is the shape of cost that gets a
 * feature switched off. Absent aliases are a fact, not a failure: a repository
 * with none resolves relative specifiers and reports the rest unresolved.
 */
export async function resolverFor(rootDir: string): Promise<Resolver> {
  const aliases = await tsconfigPaths(rootDir).catch(() => null);
  // The packages the project declares. Without these a bare specifier is
  // indistinguishable from a dependency, and on a workspace monorepo — which is
  // the shape this plugin is built for — that is every child a screen renders:
  // measured on a real repository, 53 of 62 children resolved as `external`
  // while every one of them was a package of the same repository.
  const packages = await cachedPackages(rootDir).catch(() => []);
  const byLongestName = [...packages].sort((a, b) => b.name.length - a.name.length);

  return {
    find: (fromFile, specifier) =>
      resolveIn(rootDir, aliases, byLongestName, fromFile, specifier),
    shape: (specifier) => {
      if (specifier.startsWith('.')) return 'relative';
      if (Object.keys(aliases?.paths ?? {}).some((p) => matchAlias(p, specifier) !== null)) {
        return 'aliased';
      }
      return packageFor(byLongestName, specifier) === null ? 'package' : 'workspace';
    },
    packageOf: (file) => {
      // Longest root first: a package nested inside another's directory is the
      // more specific answer, and the outer one would swallow it.
      const owning = [...packages]
        .sort((a, b) => b.root.length - a.root.length)
        .find((one) => contains(one.root, file));
      return owning?.name ?? null;
    },
  };
}

async function resolveIn(
  rootDir: string,
  aliases: TsconfigPaths | null,
  packages: PackageInfo[],
  fromFile: string,
  specifier: string,
): Promise<string | null> {
  const found = specifier.startsWith('.')
    ? await resolveRelative(dirname(fromFile), specifier)
    : ((await throughAliases(aliases, specifier)) ?? (await throughPackages(packages, specifier)));

  if (found === null) return null;
  // A `paths` entry may name a package's types inside `node_modules`, which is
  // a dependency however it was reached.
  if (found.split(sep).includes('node_modules')) return null;
  return (await insideProject(rootDir, found)) ? found : null;
}

/**
 * The alias that matches, longest prefix first.
 *
 * TypeScript prefers the most specific pattern, so `@acme/core/testing/*` wins
 * over `@acme/*` for a specifier both match — and a resolver that took the
 * first entry in the file would answer differently depending on how somebody
 * had ordered their `tsconfig`.
 *
 * Every target of the winning alias is tried, in order, because `paths` values
 * are a fallback list and a monorepo commonly names both the source and its
 * built output.
 */
async function throughAliases(
  aliases: TsconfigPaths | null,
  specifier: string,
): Promise<string | null> {
  if (aliases === null) return null;

  const matches = Object.keys(aliases.paths)
    .filter((pattern) => matchAlias(pattern, specifier) !== null)
    .sort((a, b) => b.length - a.length);

  for (const pattern of matches) {
    const rest = matchAlias(pattern, specifier);
    if (rest === null) continue;
    for (const target of aliases.paths[pattern] ?? []) {
      const found = await moduleAt(resolve(aliases.baseUrl, target.replace('*', rest)));
      if (found !== null) return found;
    }
  }
  return null;
}

/**
 * What a pattern's `*` stood for, or the empty string for an exact alias.
 *
 * `null` means this pattern does not match at all, which is why the empty
 * string cannot be used for it: `@acme/core` matching `@acme/core` captures
 * nothing and still matched.
 */
function matchAlias(pattern: string, specifier: string): string | null {
  const star = pattern.indexOf('*');
  if (star === -1) return pattern === specifier ? '' : null;

  const before = pattern.slice(0, star);
  const after = pattern.slice(star + 1);
  if (!specifier.startsWith(before) || !specifier.endsWith(after)) return null;
  if (specifier.length < before.length + after.length) return null;
  return specifier.slice(before.length, specifier.length - after.length);
}

/**
 * A specifier that names a package of this workspace.
 *
 * Tried after the aliases, because an alias is a project saying explicitly
 * where a name points and a package name is a convention resolved by a tool.
 * Where both could answer, what the project wrote wins.
 *
 * A subpath — `@acme/core/testing` — is resolved inside the package root. The
 * bare name goes through the package's own entry point, which is the reader
 * every other part of this tool already uses for that question.
 */
async function throughPackages(
  packages: PackageInfo[],
  specifier: string,
): Promise<string | null> {
  const owning = packageFor(packages, specifier);
  if (owning === null) return null;

  const rest = specifier.slice(owning.name.length).replace(/^\//, '');
  if (rest.length > 0) return moduleAt(join(owning.root, rest));
  return entryFileFor(owning.root).catch(() => null);
}

/** Longest name first, so `@acme/core-testing` is not read as `@acme/core`. */
function packageFor(packages: PackageInfo[], specifier: string): PackageInfo | null {
  return (
    packages.find(
      (one) => specifier === one.name || specifier.startsWith(`${one.name}/`),
    ) ?? null
  );
}

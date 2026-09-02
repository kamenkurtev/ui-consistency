import { relative, isAbsolute } from 'node:path';
import type { Layer, PackageInfo } from '../types.js';

/**
 * Is `filePath` inside `root`?
 *
 * Through `relative`, not through string prefixes. `uic shapes` compared
 * `absolute.startsWith(`${pkg.root}/`)` and hardcoded the separator, so on a
 * platform where `resolve()` yields backslashes no file was attributed to any
 * package, `dependedOn` never matched, and the library half of the report was
 * silently always empty (#154).
 */
export function contains(root: string, filePath: string): boolean {
  const rel = relative(root, filePath);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

/** The package whose root is the deepest one containing the file. */
function owningPackage(filePath: string, packages: PackageInfo[]): PackageInfo | null {
  let best: PackageInfo | null = null;
  for (const pkg of packages) {
    if (!contains(pkg.root, filePath)) continue;
    if (best === null || pkg.root.length > best.root.length) best = pkg;
  }
  return best;
}

/**
 * The ordered layer chain for a file, nearest first.
 *
 * The order is topological over the dependency graph, not breadth-first. A
 * package is nearer than everything it depends on, however many hops away that
 * is: if `core` wraps the external UI library, `core` must outrank the library
 * even when a page depends on both directly. Ordering by hop count would let a
 * page import from the library while the wrapper sits unused.
 *
 * Derived from the project's own `package.json` dependencies, so no repository
 * has to declare its layering by hand.
 *
 * `prefer` names layers that outrank the graph. A project migrating from one
 * package to its replacement keeps a dependency from the old on the new, so
 * the graph calls the old one nearer and the check would recommend the
 * direction the project is moving away from. Which of two packages is the
 * destination cannot be read off the graph — it has to be said — so this is
 * the one place a repository's own intent overrides what was detected.
 */
export function resolveChain(
  filePath: string,
  packages: PackageInfo[],
  prefer: readonly string[] = [],
): Layer[] {
  const owner = owningPackage(filePath, packages);
  if (owner === null) return [];

  const byName = new Map(packages.map((p) => [p.name, p]));
  const ordered: Layer[] = [];
  const done = new Set<string>();
  const onStack = new Set<string>();

  // Post-order DFS: a package is emitted only after everything it depends on,
  // then the whole list is reversed. `onStack` makes a dependency cycle
  // terminate — a cycle is the user's repo, not an error worth reporting.
  const visit = (name: string): void => {
    if (done.has(name) || onStack.has(name)) return;
    onStack.add(name);

    const pkg = byName.get(name);
    for (const dep of pkg?.dependencies ?? []) visit(dep);

    onStack.delete(name);
    done.add(name);
    ordered.push({ name, root: pkg?.root ?? null, dependencies: pkg?.dependencies ?? [] });
  };

  visit(owner.name);
  ordered.reverse();

  if (prefer.length === 0) return ordered;

  // A stable partition: preferred layers first in the order they were named,
  // everything else untouched behind them. The file's own package is never
  // demoted — it is where the file lives, not a candidate to be ranked.
  const rank = (layer: Layer): number => {
    if (layer.name === owner.name) return -1;
    const index = prefer.indexOf(layer.name);
    return index === -1 ? prefer.length : index;
  };
  return ordered
    .map((layer, index) => ({ layer, index }))
    .sort((a, b) => rank(a.layer) - rank(b.layer) || a.index - b.index)
    .map(({ layer }) => layer);
}

/**
 * The layer a specifier was imported from, longest matching name winning.
 *
 * `@acme/ui/Button` belongs to `@acme/ui`, and where two layers could both
 * claim a specifier the more specific name is the honest answer. This is the
 * nearest-layer rule the import check turns on, and it was written out twice —
 * byte for byte, in `core/check.ts` and `checks/deprecated-usage.ts` (#148).
 */
export function layerFor(specifier: string, chain: Layer[]): Layer | null {
  if (specifier.startsWith('.')) return null;
  let best: Layer | null = null;
  for (const layer of chain) {
    if (specifier !== layer.name && !specifier.startsWith(`${layer.name}/`)) continue;
    if (best === null || layer.name.length > best.name.length) best = layer;
  }
  return best;
}

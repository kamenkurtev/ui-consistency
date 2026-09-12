import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';
import type { PackageInfo } from '../types.js';
import { derivedDependencies, packagesFromTsconfigPaths, tsconfigPaths } from './tsconfig.js';

/** Read a JSON file, returning null when it is missing or malformed. */
async function readJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Directories one level down, minus the ones no workspace member lives in. */
async function childDirectories(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .map((e) => join(dir, e.name));
}

/** How deep `**` is followed. Deeper than any workspace layout in practice. */
const MAX_GLOBSTAR_DEPTH = 6;

/**
 * Every directory below one, itself included.
 *
 * `packages/**` is ordinary npm and yarn. Matched as a literal directory name
 * it finds nothing, every workspace member disappears, and the tool reports a
 * clean repository — the failure this whole change exists to close, reached
 * through a different door.
 */
async function descendantDirectories(dir: string, depth = 0): Promise<string[]> {
  if (depth >= MAX_GLOBSTAR_DEPTH) return [dir];
  const children = await childDirectories(dir);
  const below = await Promise.all(children.map((child) => descendantDirectories(child, depth + 1)));
  return [dir, ...below.flat()];
}

/**
 * Expand a workspace pattern to directories.
 *
 * A wildcard is matched one path segment at a time, because real workspaces
 * nest: `libs/*` and `libs/*​/*` sit side by side in an Nx repository, and an
 * expander that stopped at the first `*` returned the grouping directories for
 * both — which have no manifest, so every library was dropped and the tool
 * detected the applications alone.
 *
 * Still not a glob library: `*` matches one segment, and nothing else is
 * special, which is the whole of what workspace files use.
 */
async function expandPattern(rootDir: string, pattern: string): Promise<string[]> {
  const segments = pattern.split('/').filter((s) => s !== '' && s !== '.');
  let current = [resolve(rootDir)];

  for (const segment of segments) {
    if (segment !== '*' && segment !== '**') {
      current = current.map((dir) => join(dir, segment));
      continue;
    }
    const expanded = await Promise.all(
      current.map((dir) => (segment === '*' ? childDirectories(dir) : descendantDirectories(dir))),
    );
    current = expanded.flat();
  }

  return current;
}

/**
 * Does this directory declare a workspace, rather than being one application?
 *
 * The distinction the holder channel's bound turns on (#66). A `package.json`
 * at the root of a single-package app **is** the application, and bounding a
 * holder search there is right. A root that declares `workspaces` — or a
 * `pnpm-workspace.yaml` — is not an application: it is several, and a search
 * bounded there puts one application's screens into another's family.
 */
export async function declaresWorkspaces(rootDir: string): Promise<boolean> {
  return (await workspacePatterns(rootDir)).length > 0;
}

/** The workspace patterns this project declares, from whichever tool declares them. */
async function workspacePatterns(rootDir: string): Promise<string[]> {
  const yaml = await readFile(join(rootDir, 'pnpm-workspace.yaml'), 'utf8').catch(() => null);
  if (yaml !== null) {
    return [...yaml.matchAll(/^\s*-\s*['"]?([^'"\n]+)['"]?\s*$/gm)].map((m) => m[1]!.trim());
  }

  const pkg = await readJson(join(rootDir, 'package.json'));
  const workspaces = pkg?.['workspaces'];
  if (Array.isArray(workspaces)) {
    return workspaces.filter((w): w is string => typeof w === 'string');
  }
  if (workspaces !== null && typeof workspaces === 'object') {
    const nested = (workspaces as { packages?: unknown }).packages;
    if (Array.isArray(nested)) return nested.filter((w): w is string => typeof w === 'string');
  }
  return [];
}

async function toPackageInfo(dir: string): Promise<PackageInfo | null> {
  const pkg = await readJson(join(dir, 'package.json'));
  if (pkg === null) return null;

  const name = pkg['name'];
  if (typeof name !== 'string') return null;

  // Every field that records an edge, not just `dependencies`. Nothing about
  // a dependency being for development makes it a different edge in the import
  // graph, and an Nx workspace records its siblings there as a matter of
  // course — read narrowly, every library in such a repository looks as though
  // it depends on nothing and every chain collapses to one layer.
  const dependencies = ['dependencies', 'devDependencies', 'peerDependencies'].flatMap((field) => {
    const value = pkg[field];
    return value !== null && typeof value === 'object'
      ? Object.keys(value as Record<string, unknown>)
      : [];
  });
  return { name, root: dir, dependencies: [...new Set(dependencies)] };
}

/**
 * Walk up from a directory to the project root, or null if there is none.
 *
 * The nearest enclosing directory that declares workspaces, since that is the
 * boundary of the workspace the file belongs to and every layer above the
 * file's own package lives inside it. Failing that — a project with no
 * workspaces at all — the nearest directory holding a `package.json`.
 *
 * Nearest rather than outermost in both cases: a checkout inside another
 * JavaScript project must not be swallowed by it.
 *
 * A hook is handed a file, not a project, and the session's working directory
 * need not be either, so the file's own location has to be enough.
 */
async function declaresWorkspaceAliases(dir: string): Promise<boolean> {
  const aliases = await tsconfigPaths(dir);
  if (aliases === null || dirname(aliases.file) !== dir) return false;
  return (await packagesFromTsconfigPaths(dir)).length > 0;
}

export async function findProjectRoot(startDir: string): Promise<string | null> {
  let current = resolve(startDir);
  let nearestPackage: string | null = null;

  for (;;) {
    if ((await workspacePatterns(current)).length > 0) return current;
    // Path aliases bound a workspace exactly as a workspaces field does, and
    // in an Nx repository they are the only thing that does. Without this, a
    // library that happens to carry a package.json ends the walk inside
    // itself and every layer it should be checked against goes unseen.
    //
    // Two conditions, because either alone gets it wrong. The aliases must be
    // declared *here* rather than inherited, or an app extending the root
    // config ends the walk at the app. And they must actually name packages:
    // a Next.js app declares `"@/*": ["./src/*"]` for itself, which is a
    // convenience inside one package and not a description of a workspace. Get
    // this wrong and the hook roots itself inside the app, sees none of the
    // layers, and says nothing — while the CLI, run from the real root, reports
    // the violation. Two surfaces disagreeing about one file is worse than
    // either being wrong.
    if (await declaresWorkspaceAliases(current)) return current;
    if (nearestPackage === null && (await readJson(join(current, 'package.json'))) !== null) {
      nearestPackage = current;
    }

    const parent = dirname(current);
    if (parent === current) return nearestPackage;
    current = parent;
  }
}

/**
 * Discover every package in the project.
 *
 * Layout is read from the project's own workspace files rather than required
 * as configuration; a project declaring none is a single package. Nothing here
 * knows about any particular repository's directory names.
 */
export async function detectPackages(rootDir: string): Promise<PackageInfo[]> {
  return (await detectPackagesDetailed(rootDir)).packages;
}

/**
 * Detection, plus whether it had to read the source to get there.
 *
 * The scan is what the graph cache exists to amortise, and it is triggered by
 * a manifest that declares no dependencies — which has nothing to do with
 * whether the workspace has aliases. Only the detection knows whether it paid
 * that cost, so only it can say whether the answer is worth keeping.
 */
export async function detectPackagesDetailed(
  rootDir: string,
): Promise<{ packages: PackageInfo[]; derived: boolean }> {
  const declared = await declaredPackages(rootDir);
  const aliased = await ownLayersAmong(rootDir, await packagesFromTsconfigPaths(rootDir));

  if (declared.length === 0 && aliased.length === 0) {
    const single = await toPackageInfo(rootDir);
    return { packages: single === null ? [] : [single], derived: false };
  }

  // Deduped by directory as well as by name. An alias that calls a package
  // something other than its manifest does produced two layers over one
  // directory, and an `ignore` or `prefer` keyed on either name left the other
  // one on the chain.
  const byName = new Set(declared.map((p) => p.name));
  const byRoot = new Set(declared.map((p) => p.root));
  const missing = aliased.filter((p) => !byName.has(p.name) && !byRoot.has(p.root));
  const roots = [...declared, ...missing].map((p) => p.root);

  // Every layer name detection knows about, so a derived edge can name the
  // layer it actually points at rather than a truncation of it.
  const names = [...declared.map((p) => p.name), ...missing.map((p) => p.name)];

  const withDerivedEdges = async (pkg: PackageInfo | { name: string; root: string }) => {
    const nested = new Set(roots.filter((r) => r !== pkg.root && r.startsWith(`${pkg.root}${sep}`)));
    const edges = await derivedDependencies(pkg.root, nested, names);
    // A file reaching for its own package's alias instead of a relative path
    // resolves to the package's own name. The cycle guard in `resolveChain`
    // makes that harmless, but a layer depending on itself is nonsense in the
    // graph, confusing in `uic scan`, and a trap for anything that later trusts
    // this list.
    return { ...pkg, dependencies: edges.filter((edge) => edge !== pkg.name) };
  };

  // A manifest that names dependencies is taken at its word. One that names
  // none is not evidence of a package that depends on nothing: an Nx library's
  // manifest is routinely a name and a version, because siblings resolve
  // through the aliases or through `exports` conditions rather than through
  // node_modules. Believing it would collapse the chain to the file's own
  // layer and produce the same silence in a second form.
  //
  // This holds whether or not the workspace declares aliases, because the two
  // are independent: a repository can have manifests, no aliases, and still
  // declare nothing between its libraries.
  const undeclared = declared.filter((pkg) => pkg.dependencies.length === 0);
  const filled = await Promise.all(
    declared.map(async (pkg) => (pkg.dependencies.length === 0 ? withDerivedEdges(pkg) : pkg)),
  );
  const added = await Promise.all(missing.map(withDerivedEdges));

  // The workspace root is scaffolding once the aliases have named the real
  // packages; rooted at everything, it would sit on every file's chain.
  return {
    packages: [...filled, ...added],
    derived: undeclared.length > 0 || missing.length > 0,
  };
}

/**
 * The files that told us where the packages are, in the words of the files.
 *
 * A repository has no way of knowing which of the two mechanisms applies to
 * it, and when the answer turns out to be "neither" the silence is
 * indistinguishable from a clean result. Naming what was consulted is what
 * turns that into a bug report instead of a user concluding the tool is broken
 * — which is precisely how it went unnoticed.
 */
export async function detectionSources(rootDir: string): Promise<string[]> {
  const sources: string[] = [];

  if ((await workspacePatterns(rootDir)).length > 0) {
    const yaml = await readFile(join(rootDir, 'pnpm-workspace.yaml'), 'utf8').catch(() => null);
    sources.push(yaml === null ? 'package.json workspaces' : 'pnpm-workspace.yaml');
  }

  const aliases = await tsconfigPaths(rootDir);
  if (aliases !== null) sources.push(`${basename(aliases.file)} paths`);

  return sources;
}

/**
 * The directory the root package keeps its own sources in, if it has one.
 *
 * Read from the manifest first, since a package that says where its source is
 * is more reliable than the convention, and `src` only as a fallback.
 */
async function sourceDirOf(rootDir: string): Promise<string | null> {
  const pkg = await readJson(join(rootDir, 'package.json'));
  if (pkg === null) return null;

  for (const field of ['source', 'module', 'main']) {
    const value = pkg[field];
    if (typeof value !== 'string') continue;
    const dir = dirname(resolve(rootDir, value));
    if (dir !== resolve(rootDir)) return dir;
  }

  const conventional = join(rootDir, 'src');
  const found = await stat(conventional).catch(() => null);
  return found?.isDirectory() === true ? conventional : null;
}

/**
 * The aliases that name layers, discarding the ones that name a convenience.
 *
 * A single-package application routinely aliases into its own source —
 * `"@/*": ["src/*"]`, `"@aria": ["src/ui-v2/aria/index.ts"]`. The second has
 * no wildcard, so it was taken as a package: the repository's *only* package,
 * rooted at one folder. Every file outside that folder then had no owning
 * package, an empty chain, and went unchecked — an entire application, silently
 * (#38).
 *
 * A directory inside another package's own sources is part of that package. It
 * is not a layer, whatever the tsconfig calls it. Nothing is discarded in a
 * workspace, where the aliases point at siblings rather than inwards.
 */
async function ownLayersAmong(
  rootDir: string,
  aliased: { name: string; root: string }[],
): Promise<{ name: string; root: string }[]> {
  const sourceDir = await sourceDirOf(rootDir);
  if (sourceDir === null) return aliased;
  return aliased.filter((pkg) => pkg.root !== sourceDir && !pkg.root.startsWith(`${sourceDir}${sep}`));
}

/** The packages the workspace's own manifests describe. */
async function declaredPackages(rootDir: string): Promise<PackageInfo[]> {
  const patterns = await workspacePatterns(rootDir);
  if (patterns.length === 0) return [];

  const dirs = (await Promise.all(patterns.map((p) => expandPattern(rootDir, p)))).flat();
  const found = await Promise.all(
    dirs.map(async (dir) => {
      const s = await stat(dir).catch(() => null);
      return s?.isDirectory() === true ? toPackageInfo(dir) : null;
    }),
  );

  // A workspace root is usually private scaffolding with no exports; treating
  // it as a layer would put it on every file's chain.
  return found.filter((p): p is PackageInfo => p !== null);
}

import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { parseModule } from '../parse/parse.js';
import { contains } from './chain.js';
import { realpath } from 'node:fs/promises';

/** The files a workspace declares its path aliases in, nearest convention first. */
const TSCONFIG_CANDIDATES = ['tsconfig.base.json', 'tsconfig.json'];

/**
 * Parse a `tsconfig`, which is JSON with comments and trailing commas.
 *
 * `JSON.parse` rejects both, and real `tsconfig.base.json` files are full of
 * them. Failing to read one would put us back where this started — silence
 * that looks like a clean repository — so the tolerance is worth the code.
 */
export function parseTsconfig(raw: string): Record<string, unknown> | null {
  const withoutComments = raw
    .replace(/"(?:[^"\\]|\\.)*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (match) =>
      match.startsWith('"') ? match : '',
    )
    .replace(/,(\s*[}\]])/g, '$1');
  try {
    return JSON.parse(withoutComments) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** The `compilerOptions.paths` map a directory declares, if it declares one. */
export async function tsconfigPaths(rootDir: string): Promise<TsconfigPaths | null> {
  for (const candidate of TSCONFIG_CANDIDATES) {
    const found = await pathsIn(join(rootDir, candidate), 0);
    if (found !== null) return found;
  }
  return null;
}

export interface TsconfigPaths {
  paths: Record<string, string[]>;
  /** Absolute, already resolved against the file that declared it. */
  baseUrl: string;
  /** The file whose mtime the derived graph is cached against. */
  file: string;
}

/** `extends` chains are short in practice, and this stops a cyclic one. */
const MAX_EXTENDS_DEPTH = 8;

/**
 * The paths a tsconfig declares, following `extends` when it declares none.
 *
 * Splitting the aliases into a file the base config extends is a common
 * layout, and a reader that stops at the first tsconfig it can parse finds
 * nothing there and goes silent — the same defect through a different door.
 *
 * `baseUrl` is resolved against the file that declared it, which is what
 * TypeScript does and the only reading that makes an extended config portable.
 */
async function pathsIn(file: string, depth: number): Promise<TsconfigPaths | null> {
  const raw = await readFile(file, 'utf8').catch(() => null);
  if (raw === null) return null;

  const config = parseTsconfig(raw);
  if (config === null) return null;

  const options = config['compilerOptions'];
  const paths =
    options !== null && typeof options === 'object' ? (options as { paths?: unknown }).paths : null;

  if (paths !== null && paths !== undefined && typeof paths === 'object') {
    const entries = Object.entries(paths as Record<string, unknown>).flatMap(([key, value]) =>
      Array.isArray(value) && value.every((v): v is string => typeof v === 'string')
        ? [[key, value] as [string, string[]]]
        : [],
    );
    if (entries.length > 0) {
      const declaredBase = (options as { baseUrl?: unknown }).baseUrl;
      const baseUrl = resolve(dirname(file), typeof declaredBase === 'string' ? declaredBase : '.');
      return { paths: Object.fromEntries(entries), baseUrl, file };
    }
  }

  if (depth >= MAX_EXTENDS_DEPTH) return null;

  const extended = config['extends'];
  // A bare specifier extends a package in node_modules, which is a shared
  // preset rather than a description of this repository's own layout.
  if (typeof extended !== 'string' || !extended.startsWith('.')) return null;

  const target = resolve(dirname(file), extended);
  for (const suffix of ['', '.json']) {
    const found = await pathsIn(`${target}${suffix}`, depth + 1);
    if (found !== null) return found;
  }
  return null;
}

/**
 * The directory a path alias names as a package.
 *
 * An alias points at an entry file — `libs/core/src/index.ts` — but a layer is
 * the directory that owns it, since that is what has to contain a file for the
 * file to belong to the layer. The conventional `src` wrapper is not part of
 * the package's identity, so it is stripped.
 */
async function packageRootFor(target: string): Promise<string> {
  // TypeScript allows a directory target, and taking its parent lands on the
  // grouping folder — which then contains every sibling library, builds its
  // inventory from the wrong place, and gets walked whole when edges are
  // derived.
  const isDirectory = await stat(target).then(
    (s) => s.isDirectory(),
    () => false,
  );
  const dir = isDirectory ? target : dirname(target);
  return basename(dir) === 'src' ? dirname(dir) : dir;
}

/**
 * Directories that hold generated output rather than a package's source.
 *
 * The named ones are conventions of the ecosystem, and the hidden-directory
 * rule is the general case: a framework that caches or generates into the
 * repository puts it in a dot-directory — `.contentlayer`, `.next`,
 * `.svelte-kit`, `.astro`, `.angular`, `.vercel`. None of those is somebody's
 * design-system layer, and treating one as a package is worse than ignoring a
 * real package would be: it displaces the manifest that describes the project.
 */
const GENERATED_DIRECTORY = new Set(['dist', 'build', 'out', 'coverage', 'generated']);

/**
 * Judged on the path *below the workspace*, never the absolute one. A
 * repository that lives under a dotted directory — `~/.dev/app` is somebody's
 * layout — would otherwise have every one of its aliases discarded, which is
 * the same silence this function exists to prevent, one level up.
 */
function isGenerated(base: string, resolved: string): boolean {
  const inside = relative(base, resolved);
  // Outside the workspace entirely. Not this function's business to judge.
  if (inside.startsWith('..')) return false;
  return inside
    .split(sep)
    .some((segment) => GENERATED_DIRECTORY.has(segment) || /^\.[^.]/.test(segment));
}


/**
 * Is this target really inside the project?
 *
 * Both sides resolved, because the question is about what will be *read*, not
 * about what was typed. A path that does not exist cannot be read either, so it
 * falls back to the lexical test rather than being accepted.
 */
export async function insideProject(rootDir: string, target: string): Promise<boolean> {
  const real = await realpath(target).catch(() => null);
  if (real === null) return contains(rootDir, target);

  const root = await realpath(rootDir).catch(() => rootDir);
  return contains(root, real);
}

/**
 * Packages declared as `tsconfig` path aliases.
 *
 * An Nx workspace gives its libraries no `package.json` at all: the alias in
 * `tsconfig.base.json` is the whole of a library's public identity. A tool
 * that insists on a manifest detects nothing there and, being silent by
 * design, reports a clean repository — which is what it did.
 *
 * Wildcard aliases are skipped. `@acme/core/*` is a way of reaching inside the
 * package `@acme/core` already names; taking it as a package of its own would
 * put a layer called `@acme/core/*` on the chain.
 */
export async function packagesFromTsconfigPaths(
  rootDir: string,
): Promise<{ name: string; root: string }[]> {
  const declared = await tsconfigPaths(rootDir);
  if (declared === null) return [];

  const base = declared.baseUrl;
  const found = new Map<string, string>();

  for (const [alias, targets] of Object.entries(declared.paths)) {
    if (alias.includes('*')) continue;
    const target = targets[0];
    if (target === undefined || target.includes('*')) continue;
    if (found.has(alias)) continue;

    const resolved = resolve(base, target);
    // Pinning an external package's type entry point through `paths` is a
    // common trick and names a dependency, never a first-party layer. Taken as
    // one, it builds a phantom layer whose inventory is parsed out of
    // node_modules — work spent to describe something the project does not own.
    if (resolved.split(sep).includes('node_modules')) continue;
    // Generated output is not a package either, and this one costs more. On a
    // real Next.js repository the alias `contentlayer/generated` →
    // `.contentlayer/generated` became the *only* package: nothing else was
    // declared, so the root manifest never got its turn, no file in the
    // repository resolved to a chain, and every deterministic check was
    // skipped for the whole application without a word.
    if (isGenerated(base, resolved)) continue;
    // An alias target that leaves the project is not a layer of it. `resolve`
    // ignores `base` entirely for an absolute target, so no `../` is needed:
    // one line in a committed `tsconfig.json` — from a clone, or added in a
    // pull request — made the tool walk and parse an arbitrary directory the
    // running user can read, and write the identifiers it found into the cache
    // (#174).
    //
    // Through the *real* path, not the written one. `contains` compares strings
    // via `relative`, which is right for its own job — attributing a file that
    // is already inside — and wrong as a trust boundary: an alias naming
    // `lib/link/index.ts`, where `lib/link` is a symlink out of the project,
    // passes the lexical test and is then read from wherever it points.
    // Reproduced before this line was written.
    if (!(await insideProject(rootDir, resolved))) continue;

    found.set(alias, await packageRootFor(resolved));
  }

  return [...found].map(([name, root]) => ({ name, root }));
}

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'];
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.git',
  '.next',
  '.nx',
  '.cache',
]);

/** The package a bare module specifier belongs to: `@acme/core/x` is `@acme/core`. */
function packageNameOf(specifier: string): string {
  const segments = specifier.split('/');
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]!;
}

/**
 * The layer an import names, or the package it belongs to when it names none.
 *
 * A scope and a name is what a published package looks like, so that is where
 * the two-segment collapse comes from — and it is right for anything resolved
 * through `node_modules`. It is wrong for an alias, which is a name the
 * repository chose for itself and is routinely deeper:
 * `@acme/client-ui/customers/invoices` is one layer, not a subpath of a layer
 * called `@acme/client-ui`.
 *
 * Collapsing it produced edges pointing at names no layer had. Detection
 * looked perfect — every package found, every inventory right — and the check
 * went quiet across an entire repository, because `reaches` could not connect
 * two layers through a name that did not exist (#32).
 *
 * Longest match wins, so a deep alias beats the shallower one it sits under.
 */
function edgeFor(specifier: string, layers: readonly string[]): string {
  let best: string | null = null;
  for (const name of layers) {
    if (specifier !== name && !specifier.startsWith(`${name}/`)) continue;
    if (best === null || name.length > best.length) best = name;
  }
  return best ?? packageNameOf(specifier);
}

async function collectSourceFiles(dir: string, stopAt: Set<string>, into: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => null);
  if (entries === null) return;

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name) || stopAt.has(path)) continue;
      await collectSourceFiles(path, stopAt, into);
      continue;
    }
    if (SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) into.push(path);
  }
}

/**
 * The packages a directory's own source imports from.
 *
 * Where nothing declares dependencies there is no graph to read, so the graph
 * is read off the imports instead. This is closer to the rule than the
 * manifest was: layering is derived from what the code actually does, never
 * declared. Nx derives its own project graph the same way.
 *
 * `stopAt` holds the roots of packages nested inside this one, whose files
 * belong to them and whose imports are their edges, not this package's.
 */
export async function derivedDependencies(
  root: string,
  stopAt: Set<string>,
  layers: readonly string[] = [],
): Promise<string[]> {
  const files: string[] = [];
  await collectSourceFiles(root, stopAt, files);

  const dependencies = new Set<string>();
  for (const file of files) {
    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null) continue;
    const ast = parseModule(source, file);
    if (ast === null) continue;

    for (const statement of ast.program.body) {
      const specifier =
        statement.type === 'ImportDeclaration' ||
        statement.type === 'ExportAllDeclaration' ||
        (statement.type === 'ExportNamedDeclaration' && statement.source !== null)
          ? statement.source?.value
          : undefined;
      if (specifier === undefined || specifier === null) continue;
      if (specifier.startsWith('.') || specifier.startsWith('/')) continue;
      dependencies.add(edgeFor(specifier, layers));
    }
  }

  return [...dependencies].sort();
}

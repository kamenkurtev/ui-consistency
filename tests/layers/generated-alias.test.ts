import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectPackages } from '../../src/layers/detect.js';
import { clearPackageCache } from '../../src/layers/cache.js';

let root: string;

const write = async (path: string, body: string): Promise<void> => {
  await mkdir(join(root, path, '..'), { recursive: true });
  await writeFile(join(root, path), body, 'utf8');
};

const tsconfig = (paths: Record<string, string[]>): string =>
  JSON.stringify({ compilerOptions: { baseUrl: '.', paths } });

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-alias-'));
});

afterEach(async () => {
  await clearPackageCache(root).catch(() => undefined);
  await rm(root, { recursive: true, force: true });
});

describe('an alias pointing at generated output', () => {
  // Measured on shadcn-ui/taxonomy: `contentlayer/generated` →
  // `.contentlayer/generated` became the only package in the repository. The
  // root manifest never got its turn, no file resolved to a chain, and every
  // deterministic check was skipped for the whole application — with a green
  // exit code and nothing said.
  it('does not become the project’s only package', async () => {
    await write('package.json', JSON.stringify({ name: 'taxonomy' }));
    await write('tsconfig.json', tsconfig({ 'contentlayer/generated': ['./.contentlayer/generated'] }));
    await write('.contentlayer/generated/index.d.ts', 'export {};\n');
    await write('app/page.tsx', 'export default () => <div />;\n');

    const packages = await detectPackages(root);
    expect(packages.map((p) => p.name)).toEqual(['taxonomy']);
    expect(packages[0]!.root).toBe(root);
  });

  it('is discarded whatever the framework calls its output directory', async () => {
    await write('package.json', JSON.stringify({ name: 'app' }));
    await write(
      'tsconfig.json',
      tsconfig({
        built: ['./dist/index.d.ts'],
        cached: ['./.next/types/index.d.ts'],
        made: ['./generated/api.ts'],
      }),
    );
    for (const path of ['dist/index.d.ts', '.next/types/index.d.ts', 'generated/api.ts']) {
      await write(path, 'export {};\n');
    }

    expect((await detectPackages(root)).map((p) => p.name)).toEqual(['app']);
  });

  it('still reads the aliases of a workspace that lives under a dotted directory', async () => {
    // The trap in the fix itself: judging the absolute path would discard every
    // alias of a repository checked out into `~/.dev/app`, which is the same
    // silence one level up.
    const hidden = join(root, '.work', 'repo');
    await mkdir(hidden, { recursive: true });
    await writeFile(join(hidden, 'package.json'), JSON.stringify({ name: 'root' }), 'utf8');
    await writeFile(
      join(hidden, 'tsconfig.json'),
      tsconfig({ '@acme/core': ['libs/core/src/index.ts'] }),
      'utf8',
    );
    await mkdir(join(hidden, 'libs/core/src'), { recursive: true });
    await writeFile(join(hidden, 'libs/core/src/index.ts'), 'export const a = 1;\n', 'utf8');

    const names = (await detectPackages(hidden)).map((p) => p.name);
    expect(names).toContain('@acme/core');
  });

  it('leaves an alias-only workspace exactly as it was', async () => {
    // The shape alias detection exists for (#51): libraries with no manifest of
    // their own, named only by the tsconfig. Nothing here may narrow that.
    await write('package.json', JSON.stringify({ name: 'workspace' }));
    await write(
      'tsconfig.base.json',
      tsconfig({
        '@acme/core': ['libs/core/src/index.ts'],
        '@acme/ui': ['libs/ui/src/index.ts'],
      }),
    );
    await write('libs/core/src/index.ts', 'export const Button = () => null;\n');
    await write('libs/ui/src/index.ts', "import { Button } from '@acme/core';\nexport { Button };\n");

    const names = (await detectPackages(root)).map((p) => p.name);
    expect(names).toContain('@acme/core');
    expect(names).toContain('@acme/ui');
  });
});

/**
 * An alias decides which directories get walked and parsed, and it comes out of
 * a file committed in the repository being analysed — a clone, or a pull
 * request. `resolve(base, target)` ignores `base` entirely for an absolute
 * target, so no `../` is needed (#174).
 */
describe('an alias pointing outside the project', () => {
  it('is not a layer of it, when it escapes with ..', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'uic-outside-'));
    await writeFile(join(outside, 'index.ts'), 'export const Leaked = 1;\n', 'utf8');
    await write('package.json', JSON.stringify({ name: 'app', version: '1.0.0' }));
    await write('tsconfig.json', tsconfig({ '@outside': [`${outside}/index.ts`] }));

    const packages = await detectPackages(root);

    expect(packages.map((one) => one.name)).not.toContain('@outside');
    await rm(outside, { recursive: true, force: true });
  });

  it('is not a layer of it, when the target is absolute', async () => {
    await write('package.json', JSON.stringify({ name: 'app', version: '1.0.0' }));
    await write('tsconfig.json', tsconfig({ '@root': ['/etc'] }));

    const packages = await detectPackages(root);

    expect(packages.map((one) => one.name)).not.toContain('@root');
  });

  it('still takes one that stays inside', async () => {
    await write('package.json', JSON.stringify({ name: 'app', version: '1.0.0' }));
    await write('lib/index.ts', 'export const Inside = 1;\n');
    await write('tsconfig.json', tsconfig({ '@inside': ['lib/index.ts'] }));

    const packages = await detectPackages(root);

    expect(packages.map((one) => one.name)).toContain('@inside');
  });

  /**
   * `contains` compares strings through `relative`. That is right for its own
   * job — attributing a file already inside — and wrong as a trust boundary: an
   * alias naming a path inside the project, where a segment of it is a symlink
   * out, passes the lexical test and is then read from wherever it points.
   *
   * Reproduced against the shipped bundle before the fix: `@via-link: 2 exports`.
   */
  it('is not a layer of it, when a symlink inside the project points out', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'uic-linked-'));
    await writeFile(join(outside, 'index.ts'), 'export const Leaked = 1;\n', 'utf8');
    await write('package.json', JSON.stringify({ name: 'app', version: '1.0.0' }));
    await mkdir(join(root, 'lib'), { recursive: true });
    await symlink(outside, join(root, 'lib/link'));
    await write('tsconfig.json', tsconfig({ '@via-link': ['lib/link/index.ts'] }));

    const packages = await detectPackages(root);

    expect(packages.map((one) => one.name)).not.toContain('@via-link');
    await rm(outside, { recursive: true, force: true });
  });
});

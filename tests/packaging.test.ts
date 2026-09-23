import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = async (path: string): Promise<Record<string, unknown>> =>
  JSON.parse(await readFile(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8'));

/**
 * The files Gemini CLI loads: the one its manifest names, and every file that
 * one includes with a line of the form `@./<path>`.
 */
async function contextFiles(): Promise<string[]> {
  const first = String((await read('gemini-extension.json'))['contextFileName']);
  const text = readFileSync(fileURLToPath(new URL(`../${first}`, import.meta.url)), 'utf8');
  const included = [...text.matchAll(/^@\.\/(\S+)$/gm)].map((m) => m[1]!);
  return [first, ...included];
}

/**
 * The version is carried by every file `npm run bump` moves, and only one of
 * them is the one that matters: a git-distributed plugin ships every commit, and
 * an installed copy updates when `plugin.json` says a new version exists — not
 * when the code changes. The others drift because nothing reads them at install
 * time, so nothing complains.
 */
describe('the shipped version', () => {
  it('is the same in the manifest, the marketplace entry, package.json and the lockfile', async () => {
    const plugin = await read('.claude-plugin/plugin.json');
    const marketplace = (await read('.claude-plugin/marketplace.json')) as {
      plugins: { name: string; version?: string }[];
    };
    const npm = await read('package.json');
    const lock = (await read('package-lock.json')) as { version?: string; packages: Record<string, { version?: string }> };

    expect(plugin['version']).toMatch(/^\d+\.\d+\.\d+$/);
    const entry = marketplace.plugins.find((p) => p.name === plugin['name']);
    expect(entry?.version).toBe(plugin['version']);
    expect(npm['version']).toBe(plugin['version']);
    // Twice in the lockfile: its own field, and the root package's entry.
    expect([lock.version, lock.packages['']?.version]).toEqual([plugin['version'], plugin['version']]);
  });

  it('describes the plugin the same way everywhere it is listed', async () => {
    // Each place is read by a different harness's installer, and nothing reads
    // more than one of them at a time.
    const plugin = await read('.claude-plugin/plugin.json');
    const marketplace = (await read('.claude-plugin/marketplace.json')) as {
      plugins: { name: string; description?: string }[];
    };

    const described = String(plugin['description']);
    expect(marketplace.plugins.find((p) => p.name === plugin['name'])?.description).toBe(described);
    for (const path of ['.codex-plugin/plugin.json', '.cursor-plugin/plugin.json', 'gemini-extension.json', 'hooks/hooks.json']) {
      expect([path, (await read(path))['description']]).toEqual([path, described]);
    }
  });
});

describe('the hooks the plugin registers', () => {
  it('says one line at session start, and registers nothing else', async () => {
    const hooks = (await read('hooks/hooks.json')) as {
      hooks: Record<string, { hooks: { command: string; timeout?: number }[] }[]>;
    };

    expect(Object.keys(hooks.hooks)).toEqual(['SessionStart']);

    const session = hooks.hooks['SessionStart']?.[0]?.hooks[0];
    expect(session?.command).toContain('uic.mjs" session');
    // Short on purpose: it lists two directories, and it runs before anybody
    // has asked for anything.
    expect(session?.timeout).toBeLessThanOrEqual(5);
  });
});

describe('the other harnesses', () => {
  const manifests = ['.codex-plugin/plugin.json', '.cursor-plugin/plugin.json', 'gemini-extension.json'];

  it('all carry the same version as the Claude manifest', async () => {
    const plugin = await read('.claude-plugin/plugin.json');
    for (const path of manifests) {
      expect((await read(path))['version']).toBe(plugin['version']);
    }
  });

  it('all declare the licence LICENSE grants', async () => {
    // Each installer reads only its own manifest, so a manifest without the
    // field is a copy of the plugin whose terms depend on which file was opened.
    const licence = readFileSync(fileURLToPath(new URL('../LICENSE', import.meta.url)), 'utf8');
    expect(licence.startsWith('MIT License')).toBe(true);
    for (const path of ['package.json', '.claude-plugin/plugin.json', ...manifests]) {
      expect([path, (await read(path))['license']]).toEqual([path, 'MIT']);
    }
  });

  it('point every harness at the same skills', async () => {
    for (const path of ['.codex-plugin/plugin.json', '.cursor-plugin/plugin.json']) {
      expect((await read(path))['skills']).toBe('./skills/');
    }
  });

  it('ships the context file the non-Claude harnesses read', async () => {
    const files = await contextFiles();
    // Not AGENTS.md: that is where an agent working in this repository looks for
    // the repository's own rules.
    expect(files).not.toContain('AGENTS.md');
    const loaded = files.map((file) => readFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), 'utf8'));
    // What a non-Claude harness loads must carry the skills and the order they
    // fire in.
    expect(loaded.join('\n')).toContain('ui-consistency:finding-patterns');
  });
});

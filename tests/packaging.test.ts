import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

const read = async (path: string): Promise<Record<string, unknown>> =>
  JSON.parse(await readFile(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8'));

/**
 * The version lives in three files, and only one of them is the one that
 * matters: a git-distributed plugin ships every commit, and an installed copy
 * updates when `plugin.json` says a new version exists — not when the code
 * changes. A fix that forgets the bump reaches nobody, silently, which is the
 * same failure shape as everything else in this repository.
 *
 * The other two drift because nothing reads them at install time, so nothing
 * complains.
 */
describe('the shipped version', () => {
  it('is the same in the manifest, the marketplace entry and package.json', async () => {
    const plugin = await read('.claude-plugin/plugin.json');
    const marketplace = (await read('.claude-plugin/marketplace.json')) as {
      plugins: { name: string; version?: string }[];
    };
    const npm = await read('package.json');

    const entry = marketplace.plugins.find((p) => p.name === plugin['name']);
    expect(entry?.version).toBe(plugin['version']);
    expect(npm['version']).toBe(plugin['version']);
  });

  it('is set explicitly, since without it every commit reads as a new version', async () => {
    const plugin = await read('.claude-plugin/plugin.json');
    expect(plugin['version']).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('is the same in the source the bundle carries', async () => {
    // The fourth place, and the only one that is code. `bin/uic.mjs` runs from
    // wherever it was installed, so it cannot read a package.json at runtime —
    // it stamps this constant into every file it generates. Wrong here means
    // wrong in every user's corpus, with a green suite in the clone.
    const plugin = await read('.claude-plugin/plugin.json');
    const { VERSION } = await import('../src/version.js');
    expect(VERSION).toBe(plugin['version']);
  });
});

describe('the hooks the plugin registers', () => {
  it('runs the checker after an edit and says one line at session start', async () => {
    const hooks = (await read('hooks/hooks.json')) as {
      hooks: Record<string, { hooks: { command: string; timeout?: number }[] }[]>;
    };

    expect(Object.keys(hooks.hooks)).toContain('PostToolUse');
    expect(Object.keys(hooks.hooks)).toContain('SessionStart');

    const session = hooks.hooks['SessionStart']?.[0]?.hooks[0];
    expect(session?.command).toContain('uic.mjs" session');
    // Short on purpose: it is a stat and a few 512-byte reads, and it runs
    // before anybody has asked for anything.
    expect(session?.timeout).toBeLessThanOrEqual(5);
  });
});

describe('the skills', () => {
  const dir = fileURLToPath(new URL('../skills', import.meta.url));

  async function frontmatter(skill: string): Promise<Record<string, string>> {
    const text = await readFile(`${dir}/${skill}/SKILL.md`, 'utf8');
    const match = /^---\n([\s\S]*?)\n---/.exec(text);
    if (match === null) return {};
    const fields: Record<string, string> = {};
    for (const line of match[1]!.split('\n')) {
      const at = line.indexOf(':');
      if (at > 0) fields[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
    return fields;
  }

  // Read from disk rather than listed here: a skill added without the checks
  // below is a skill that never fires, and a hardcoded list is how that goes
  // unnoticed.
  const skills = readdirSync(dir).filter((name) => !name.startsWith('.'));

  for (const skill of skills) {
    it(`${skill} names itself`, async () => {
      expect((await frontmatter(skill))['name']).toBe(skill);
    });

    it(`${skill} says when to use it, not just what it is`, async () => {
      // A skill fires on the model's own judgement about relevance. A
      // description that only says what the skill *is* never fires, and a
      // skill that never fires does nothing at all.
      const description = (await frontmatter(skill))['description'] ?? '';
      expect(description.length).toBeGreaterThan(40);
      expect(description.toLowerCase()).toMatch(/\buse (this )?when\b|\bwhen the user\b/);
    });

    it(`${skill} tells the agent to run the command rather than guess`, async () => {
      const text = await readFile(`${dir}/${skill}/SKILL.md`, 'utf8');
      expect(text).toContain('uic.mjs');
    });
  }
});

describe('what the shipped bundle does not carry', () => {
  it('has no model client in it at all', async () => {
    // The plugin is free and asks for no credentials: the judging happens in
    // the agent that is already reading the file. A bundled SDK was half of
    // `bin/uic.mjs`, loaded by a hook on every edit, for a path nobody runs.
    const bundle = await readFile(fileURLToPath(new URL('../bin/uic.mjs', import.meta.url)), 'utf8');
    expect(bundle).not.toContain('anthropic-ai/sdk');
    expect(bundle).not.toContain('api.anthropic.com');
  });

  it('declares no model SDK as a dependency', async () => {
    const npm = (await read('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(npm.dependencies?.['@anthropic-ai/sdk']).toBeUndefined();
    expect(npm.devDependencies?.['@anthropic-ai/sdk']).toBeUndefined();
  });
});

describe('the batch driver command', () => {
  const path = fileURLToPath(new URL('../commands/uic-fix.md', import.meta.url));

  it('exists and declares itself', async () => {
    const text = await readFile(path, 'utf8');
    expect(text).toMatch(/^---\n[\s\S]*name:\s*uic-fix/);
    expect(text.toLowerCase()).toMatch(/\buse when\b/);
  });

  it('gates on the checker, never on what the subagent claims', async () => {
    // Without this the command is a suggestion with extra steps. The project
    // has shipped a clean-looking result that checked nothing three times.
    const text = await readFile(path, 'utf8');
    expect(text).toContain('Believe neither');
    expect(text).toContain('exit 0');
  });

  it('bounds the retries and names what it parked', async () => {
    const text = await readFile(path, 'utf8');
    expect(text).toMatch(/two further attempts/i);
    expect(text).toMatch(/by name/i);
  });

  it('builds its queue with --list, not by reading every finding', async () => {
    const text = await readFile(path, 'utf8');
    expect(text).toContain('check --list');
  });

  it('gives a subagent one file and forbids the rest', async () => {
    const text = await readFile(path, 'utf8');
    expect(text).toContain('One file path');
    expect(text).toMatch(/edit only this file/i);
  });
});

describe('how the skills are named', () => {
  it('never repeats the plugin name inside a skill name', async () => {
    // `superpowers` names its skills `brainstorming` and invokes them as
    // `superpowers:brainstorming` — the plugin is a namespace, not a prefix.
    // Ours carried it twice: `ui-consistency-init` inside `ui-consistency`.
    const dir = fileURLToPath(new URL('../skills', import.meta.url));
    const { readdir } = await import('node:fs/promises');

    for (const skill of await readdir(dir)) {
      expect(skill.startsWith('ui-consistency')).toBe(false);
    }
  });
});

describe('what the checks are allowed to know', () => {
  it('hardcodes no component name anywhere a finding can come from', async () => {
    // The first thing the owner noticed about this plugin, and the right thing
    // to notice: `Button`, `TextField`, `MenuItem`, `DataGrid` are one library's
    // names. Every team names its own components, and every framework has its
    // own pseudo-HTML elements — a project whose input is `Textbox` matched none
    // of it and got silence, which is indistinguishable from a clean result.
    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = fileURLToPath(new URL('../src/checks', import.meta.url));

    const named: string[] = [];
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.ts'))) {
      const source = readFileSync(`${dir}/${file}`, 'utf8')
        // Comments may discuss the names; only code may not carry them.
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        // The parser's own node types are not a design system's vocabulary.
        .replace(/\.type\s*[!=]==?\s*'[A-Za-z]+'/g, '')
        .replace(/case\s+'[A-Za-z]+':/g, '');

      for (const match of source.matchAll(/['"]([A-Z][a-z]+[A-Za-z]*)['"]/g)) {
        named.push(`${file}: ${match[1]!}`);
      }
    }

    expect(named).toEqual([]);
  });

  /**
   * The same argument, for prop names, which the rule above does not cover.
   *
   * `Button` and `DataGrid` are one library's component names. `sx`, `mt` and
   * `px` are one library's *prop* names, and the reasoning is identical: every
   * team names its own, and a built-in lexicon matched nothing on a project that
   * spells things differently.
   *
   * This does not forbid them. It requires each to be listed here with a reason,
   * so a vendor's vocabulary cannot enter by nobody looking — which is how
   * fifteen MUI shorthand keys ended up in the module both dialects share (#200,
   * #195).
   *
   * The list is meant to shrink. #203 measures what these are buying; whether
   * they stay is that answer, not this test's.
   */
  it('carries no vendor prop vocabulary that has not been declared here', async () => {
    const declared: Record<string, string> = {
      sx: "MUI, Chakra and Theme UI spell the system prop identically — an ecosystem convention rather than one product's, and `style` beside it is the DOM's own",
      m: 'MUI spacing shorthand — undefended, kept only until #203 says what it buys',
      mt: 'MUI spacing shorthand',
      mr: 'MUI spacing shorthand',
      mb: 'MUI spacing shorthand',
      ml: 'MUI spacing shorthand',
      mx: 'MUI spacing shorthand',
      my: 'MUI spacing shorthand',
      p: 'MUI spacing shorthand',
      pt: 'MUI spacing shorthand',
      pr: 'MUI spacing shorthand',
      pb: 'MUI spacing shorthand',
      pl: 'MUI spacing shorthand',
      px: 'MUI spacing shorthand',
      py: 'MUI spacing shorthand',
      spacing: 'MUI spacing shorthand',
    };

    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = fileURLToPath(new URL('../src/checks', import.meta.url));

    const found: string[] = [];
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.ts'))) {
      const source = readFileSync(`${dir}/${file}`, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');

      // Short lowercase string literals are what a prop shorthand looks like.
      // CSS property names are not vendor vocabulary and are spelled with a
      // hyphen or in full, so they do not match.
      for (const match of source.matchAll(/'([a-z]{1,2}|spacing|sx)'/g)) {
        const name = match[1]!;
        if (declared[name] === undefined) found.push(`${file}: '${name}'`);
      }
    }

    expect(found).toEqual([]);
  });

  /**
   * The same argument again, one level out: the rules are instructions an agent
   * acts on, and a vendor's component name in one of them is a vocabulary
   * shipped as prose (#232).
   *
   * A denylist rather than the pattern match used on `src/checks` above, because
   * Markdown has no literals to isolate and a rule legitimately writes
   * `PageLayout` and `OrdersPage` in a worked example — invented names, which is
   * the point. Its failure mode is a name nobody thought of, which is a missed
   * catch and never a wrong one.
   */
  it('names no library component in the rules', async () => {
    const vendor = [
      'Button',
      'TextField',
      'MenuItem',
      'DataGrid',
      'DataTable',
      'VirtualList',
      'Autocomplete',
      'DatePicker',
      'FormControl',
      'Chakra',
      'Drawer',
      'Popover',
      'Snackbar',
      'Alert',
      'Chip',
      'Modal',
    ];

    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = fileURLToPath(new URL('../rules', import.meta.url));

    const found: string[] = [];
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
      const text = readFileSync(`${dir}/${file}`, 'utf8');
      for (const name of vendor) {
        if (new RegExp(`\\b${name}\\b`).test(text)) found.push(`${file}: ${name}`);
      }
    }

    expect(found).toEqual([]);
  });
});

describe('the other harnesses', () => {
  const manifests = ['.codex-plugin/plugin.json', '.cursor-plugin/plugin.json', 'gemini-extension.json'];

  it('all carry the same version as the Claude manifest', async () => {
    // Four places now. `npm run bump` moves them together, and this is what
    // notices when one is added and forgotten — which is exactly how the two
    // original copies drifted.
    const plugin = await read('.claude-plugin/plugin.json');
    for (const path of manifests) {
      expect((await read(path))['version']).toBe(plugin['version']);
    }
  });

  it('point every harness at the same skills', async () => {
    for (const path of ['.codex-plugin/plugin.json', '.cursor-plugin/plugin.json']) {
      expect((await read(path))['skills']).toBe('./skills/');
    }
  });

  it('ships the context file the non-Claude harnesses read', async () => {
    const { readFileSync } = await import('node:fs');
    const agents = readFileSync(fileURLToPath(new URL('../AGENTS.md', import.meta.url)), 'utf8');
    expect(agents).toContain('uic pattern');
    expect((await read('gemini-extension.json'))['contextFileName']).toBe('AGENTS.md');
  });
});

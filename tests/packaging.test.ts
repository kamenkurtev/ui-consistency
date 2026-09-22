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

  it('describes the plugin the same way everywhere it is listed', async () => {
    // Five places say what this is, and each is read by a different harness's
    // installer. They drifted once already; nothing complains, because nothing
    // reads more than one of them at a time.
    const plugin = await read('.claude-plugin/plugin.json');
    const marketplace = (await read('.claude-plugin/marketplace.json')) as {
      plugins: { name: string; description?: string }[];
    };

    const described = String(plugin['description']);
    expect(described).toContain('Design-Driven Development');
    expect(marketplace.plugins.find((p) => p.name === plugin['name'])?.description).toBe(described);
    for (const path of ['.codex-plugin/plugin.json', '.cursor-plugin/plugin.json', 'gemini-extension.json']) {
      expect((await read(path))['description']).toBe(described);
    }
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
  /**
   * `SessionStart` alone. A hook on every edit would have nothing to say but
   * *"remember to read the rules"*, which gets ignored. At session start it
   * tells an agent which skills exist and in what order they fire, and an
   * installed plugin has no other way to say that.
   */
  it('says one line at session start, and registers nothing else', async () => {
    const hooks = (await read('hooks/hooks.json')) as {
      hooks: Record<string, { hooks: { command: string; timeout?: number }[] }[]>;
    };

    expect(Object.keys(hooks.hooks)).toEqual(['SessionStart']);

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

    it(`${skill} keeps its description to when, short enough not to retell the skill`, async () => {
      // A description that summarises the steps is followed instead of the skill
      // body. superpowers' descriptions run 79–234 characters; the four here
      // were 407–476 and retold every step.
      const description = (await frontmatter(skill))['description'] ?? '';
      expect(description.length).toBeLessThanOrEqual(250);
    });

  }

  /**
   * The session text is the one place that says which skill fires for which
   * job. A skill it does not name only fires if a description happens to match;
   * a name it carries with no skill behind it sends the agent looking for
   * something that is not there.
   */
  it('are exactly the skills the session text names', async () => {
    const session = await readFile(fileURLToPath(new URL('../src/cli/session.ts', import.meta.url)), 'utf8');
    const named = new Set([...session.matchAll(/\bui-consistency:([a-z][\w-]*)/g)].map((m) => m[1]!));

    expect([...named].sort()).toEqual([...skills].sort());
  });
});

describe('what a task leaves behind', () => {
  /**
   * The counts are true of the code as it was read. Written to a document per
   * kind of page they become a thing to review, keep in step between branches
   * and find stale — and a file nobody notices has gone stale is worse than no
   * file. A task carries a checklist and leaves nothing.
   *
   * This is the guard on that decision: a path under the knowledge directory is
   * how the document would come back.
   */
  it('writes no document per kind of page', async () => {
    const { readdirSync, readFileSync, existsSync } = await import('node:fs');
    const dir = fileURLToPath(new URL('../skills', import.meta.url));

    expect(existsSync(`${dir}/finding-patterns/checklist.md`)).toBe(true);

    const carries: string[] = [];
    for (const skill of readdirSync(dir).filter((name) => !name.startsWith('.'))) {
      for (const file of readdirSync(`${dir}/${skill}`).filter((f) => f.endsWith('.md'))) {
        const text = readFileSync(`${dir}/${skill}/${file}`, 'utf8');
        if (text.includes('.ui-consistency/patterns')) carries.push(`${skill}/${file}`);
      }
    }

    expect(carries).toEqual([]);
  });

  it('has every section the skills send an agent to read', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = fileURLToPath(new URL('../skills', import.meta.url));

    const files = readdirSync(dir)
      .filter((name) => !name.startsWith('.'))
      .flatMap((skill) =>
        readdirSync(`${dir}/${skill}`)
          .filter((file) => file.endsWith('.md'))
          .map((file) => ({ where: `${skill}/${file}`, text: readFileSync(`${dir}/${skill}/${file}`, 'utf8') })),
      );

    const sections = new Set<string>();
    for (const { text } of files) {
      for (const block of text.matchAll(/````markdown\n([\s\S]*?)\n````/g)) {
        for (const heading of block[1]!.matchAll(/^## (.+)$/gm)) sections.add(heading[1]!.trim());
      }
    }
    expect(sections.size).toBeGreaterThan(1);

    const missing: string[] = [];
    for (const { where, text } of files) {
      for (const named of text.matchAll(/`## ([^`]+)`/g)) {
        // A reference can wrap across lines; the heading it names cannot.
        const section = named[1]!.replace(/\s+/g, ' ').trim();
        if (!sections.has(section)) missing.push(`${where}: ## ${section}`);
      }
    }

    expect(missing).toEqual([]);
  });
});

describe('implementing and verifying', () => {
  /**
   * The verifier reports against the page the builder wrote. A concern the
   * verifier checks and the builder was never told about is a finding
   * manufactured by the plugin itself — which is what happened when spacing,
   * contrast and theme entries reached verifying and not implementing.
   */
  it('name the same concerns, so nothing is checked that was never asked for', async () => {
    const read = (skill: string) =>
      readFile(fileURLToPath(new URL(`../skills/${skill}/SKILL.md`, import.meta.url)), 'utf8');
    const implementing = await read('implementing');
    const verifying = await read('verifying');

    const concerns = [
      /reuse/i,
      /validation/i,
      /theme that applies/i,
      /shared layer/i,
      /spacing/i,
      /contrast/i,
      /every scheme/i,
      /particular to the reference/i,
    ];
    const missing = concerns.filter((c) => c.test(verifying) && !c.test(implementing)).map(String);

    expect(missing).toEqual([]);
  });
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

describe('how the skills are named', () => {
  it('never repeats the plugin name inside a skill name', async () => {
    // `superpowers` names its skills `brainstorming` and invokes them as
    // `superpowers:brainstorming` — the plugin is a namespace, not a prefix.
    const dir = fileURLToPath(new URL('../skills', import.meta.url));
    const { readdir } = await import('node:fs/promises');

    for (const skill of await readdir(dir)) {
      expect(skill.startsWith('ui-consistency')).toBe(false);
    }
  });
});

/** Every `.ts` under a directory, recursively. */
function sourcesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) found.push(...sourcesUnder(path));
    else if (entry.name.endsWith('.ts')) found.push(path);
  }
  return found;
}

describe('what the program is allowed to know', () => {
  it('hardcodes no component name anywhere a finding can come from', async () => {
    // The first thing the owner noticed about this plugin, and the right thing
    // to notice: `Button`, `TextField`, `MenuItem`, `DataGrid` are one library's
    // names. Every team names its own components, and every framework has its
    // own pseudo-HTML elements — a project whose input is `Textbox` matched none
    // of it and got silence, which is indistinguishable from a clean result.
    // It stays because the day somebody adds a list of component names back,
    // this is what says no.
    const { readFileSync } = await import('node:fs');
    const dir = fileURLToPath(new URL('../src', import.meta.url));

    const named: string[] = [];
    for (const file of sourcesUnder(dir)) {
      const source = readFileSync(file, 'utf8')
        // Comments may discuss the names; only code may not carry them.
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        // The parser's own node types are not a design system's vocabulary.
        .replace(/\.type\s*[!=]==?\s*'[A-Za-z]+'/g, '')
        .replace(/case\s+'[A-Za-z]+':/g, '')
        // Nor are the **harness's** own names. `SessionStart` is a field value
        // Claude Code reads back; spelling it differently means the hook says
        // nothing. Exempt by exact name rather than by shape, so a component
        // name cannot enter by looking like a protocol one.
        .replace(/'(?:SessionStart|PostToolUse|UserPromptSubmit)'/g, '');

      for (const match of source.matchAll(/['"]([A-Z][a-z]+[A-Za-z]*)['"]/g)) {
        named.push(`${file}: ${match[1]!}`);
      }
    }

    expect(named).toEqual([]);
  });

  /**
   * The same argument again, one level out: the skills are instructions an
   * agent acts on, and one technology's component name in one of them is a
   * vocabulary shipped as prose. Every technology builds a page differently, so
   * the skills name roles.
   *
   * A denylist rather than the pattern match used on `src/` above, because
   * Markdown has no literals to isolate. Its failure mode is a name nobody
   * thought of, which is a missed catch and never a wrong one.
   */
  it('names no library component in the skills or the user-facing instructions', async () => {
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
      'IonButton',
      'IonPage',
      'mat-button',
      'v-btn',
      'react-hook-form',
      'formik',
      'yup',
      'zod',
    ];

    const { readdirSync, readFileSync } = await import('node:fs');
    const skills = fileURLToPath(new URL('../skills', import.meta.url));
    // Every Markdown file of every skill: a supporting file is read by the same
    // agent as the SKILL.md that links it.
    const files = [
      ...readdirSync(skills)
        .filter((name) => !name.startsWith('.'))
        .flatMap((name) =>
          readdirSync(`${skills}/${name}`)
            .filter((file) => file.endsWith('.md'))
            .map((file) => `${skills}/${name}/${file}`),
        ),
      // Whichever file the non-Claude harnesses load, read from the manifest
      // that names it rather than by a name that can move out from under it.
      fileURLToPath(new URL(`../${String((await read('gemini-extension.json'))['contextFileName'])}`, import.meta.url)),
    ];
    expect(files.length).toBeGreaterThanOrEqual(5);

    const found: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
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

  it('all declare the licence LICENSE grants', async () => {
    // Each installer reads only its own manifest, so a manifest without the
    // field is a copy of the plugin whose terms depend on which file was opened.
    const { readFileSync } = await import('node:fs');
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
    const { readFileSync } = await import('node:fs');
    const context = String((await read('gemini-extension.json'))['contextFileName']);
    // Not AGENTS.md: that is where an agent working in this repository looks for
    // the repository's own rules, and the bootstrap there told it to run the UI
    // phases on a repository with no UI.
    expect(context).not.toBe('AGENTS.md');
    const using = readFileSync(fileURLToPath(new URL(`../${context}`, import.meta.url)), 'utf8');
    // The file a non-Claude harness loads must carry the surface: the skills and
    // the order they fire in.
    expect(using).toContain('ui-consistency:finding-patterns');
  });

  it('gives an agent working in this repository its rules, where it looks for them', async () => {
    // A harness that reads AGENTS.md and not CLAUDE.md must still be told the
    // rules that do damage when missed — above all the private-names rule, whose
    // whole purpose is to stop a leak by the agent that never read it.
    const { readFileSync } = await import('node:fs');
    const agents = readFileSync(fileURLToPath(new URL('../AGENTS.md', import.meta.url)), 'utf8');
    for (const rule of [
      'Never commit to `main`',
      'npm run gate',
      'npm run bump',
      'uic-pr.md',
      'the names may not',
      'uic-docs.md',
    ]) {
      expect([rule, agents.includes(rule)]).toEqual([rule, true]);
    }
    expect(agents).not.toContain('ui-consistency:finding-patterns');
  });
});

describe('the pull request template', () => {
  it('keeps the items that ask for evidence, in their own words', async () => {
    // Asking who made a change was added beside these, never instead of them:
    // they are what makes a green check mean something here.
    const { readFileSync } = await import('node:fs');
    const template = readFileSync(
      fileURLToPath(new URL('../.github/pull_request_template.md', import.meta.url)),
      'utf8',
    );
    for (const item of [
      '**The test fails against the unfixed code** — run both ways, and say so',
      'Anything user-facing was run from the **shipped artifact**: `bin/uic.mjs`\n      copied alone into an empty directory',
      'There is no "not applicable".',
      '**"Read, nothing false" is a result.**',
      'A person read the complete diff',
      'open **and closed** pull requests',
      '*What this is not*',
      'split, not reviewed',
      '**transcript**',
    ]) {
      expect([item, template.includes(item)]).toEqual([item, true]);
    }
  });
});

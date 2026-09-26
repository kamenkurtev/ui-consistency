import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The skills' structure: what the platform requires of a skill, and that what a
 * skill points at exists. Their wording is not tested — it changes as real work
 * shows what to change, and real work is what checks it.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const skillsDir = join(root, 'skills');
const skills = readdirSync(skillsDir).filter((name) => !name.startsWith('.'));
const files = skills.flatMap((skill) =>
  readdirSync(join(skillsDir, skill))
    .filter((file) => file.endsWith('.md'))
    .map((file) => join(skillsDir, skill, file)),
);
const read = (path: string): string => readFileSync(path, 'utf8');
const where = (path: string): string => path.slice(root.length);

function frontmatter(text: string): { fields: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  const fields: Record<string, string> = {};
  if (match === null) return { fields, body: text };
  for (const line of match[1]!.split('\n')) {
    const at = line.indexOf(':');
    if (at > 0) fields[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return { fields, body: text.slice(match[0].length) };
}

// Anthropic's limits for a skill: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
describe('each skill, within the platform limits', () => {
  for (const skill of skills) {
    const text = read(join(skillsDir, skill, 'SKILL.md'));
    const { fields, body } = frontmatter(text);

    it(`${skill}: name is its directory, at most 64 lowercase letters, digits and hyphens`, () => {
      const name = fields['name'] ?? '';
      expect(name).toBe(skill);
      expect(name).toMatch(/^[a-z0-9-]{1,64}$/);
      expect(name).not.toMatch(/anthropic|claude/);
    });

    it(`${skill}: description is at most 1,024 characters, no XML, and says when to use it`, () => {
      const description = fields['description'] ?? '';
      expect(description.length).toBeGreaterThan(0);
      expect(description.length).toBeLessThanOrEqual(1024);
      expect(description).not.toMatch(/<[^>]+>/);
      expect(description).toMatch(/\bUse when\b/i);
    });

    it(`${skill}: SKILL.md body is under 500 lines`, () => {
      expect(body.split('\n').length).toBeLessThan(500);
    });

    // After compaction Claude Code re-attaches only the first 5,000 tokens of a
    // skill: https://code.claude.com/docs/en/skills. 16,000 characters is 5,000
    // tokens at 3.2 characters a token, a low rate for English prose.
    it(`${skill}: SKILL.md is at most 16,000 characters`, () => {
      expect(text.length).toBeLessThanOrEqual(16_000);
    });
  }
});

describe('what the skills point at', () => {
  it('every linked file exists', () => {
    const broken: string[] = [];
    for (const file of files) {
      for (const link of read(file).matchAll(/\]\(([^)#\s]+\.md)(?:#[^)]*)?\)/g)) {
        if (/^[a-z]+:/.test(link[1]!)) continue;
        if (!existsSync(resolve(dirname(file), link[1]!))) broken.push(`${where(file)}: ${link[1]}`);
      }
    }
    expect(broken).toEqual([]);
  });

  // An invoked skill is re-attached after compaction; a file read with a tool is
  // not. The skills a phase calls are reached by name, their own files included.
  it('no other skill links into values, conventions or decisions', () => {
    const called = ['values', 'conventions', 'decisions'];
    const linked: string[] = [];
    for (const file of files) {
      const from = where(dirname(file)).split('/').pop()!;
      for (const link of read(file).matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
        const to = where(resolve(dirname(file), link[1]!)).split('/')[1];
        if (to !== undefined && to !== from && called.includes(to)) linked.push(`${where(file)}: ${link[1]}`);
      }
    }
    expect(linked).toEqual([]);
  });

  it('every named section exists in the template that defines it', () => {
    // A section is named as `## <heading>` and defined inside a ````markdown
    // template; a reference can wrap across lines, the heading cannot.
    const sections = new Set<string>();
    for (const file of files) {
      for (const block of read(file).matchAll(/````markdown\n([\s\S]*?)\n````/g)) {
        for (const heading of block[1]!.matchAll(/^## (.+)$/gm)) sections.add(heading[1]!.trim());
      }
    }
    const missing: string[] = [];
    for (const file of files) {
      for (const named of read(file).matchAll(/`## ([^`]+)`/g)) {
        const section = named[1]!.replace(/\s+/g, ' ').trim();
        if (!sections.has(section)) missing.push(`${where(file)}: ## ${section}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every skill named exists, and the session text names exactly these', () => {
    const named = (text: string) => [...text.matchAll(/\bui-consistency:([a-z][\w-]*)/g)].map((m) => m[1]!);
    const dangling: string[] = [];
    for (const file of [...files, join(root, 'USING.md')]) {
      for (const skill of named(read(file))) if (!skills.includes(skill)) dangling.push(`${where(file)}: ${skill}`);
    }
    expect(dangling).toEqual([]);

    const session = new Set(named(read(join(root, 'src/cli/session.ts'))));
    expect([...session].sort()).toEqual([...skills].sort());
  });
});

/**
 * Skills and examples name roles, never one library's components: every
 * technology builds a page differently. A denylist, because Markdown has no
 * literals to isolate; a name nobody thought of is a missed catch, never a
 * wrong one.
 */
describe('the vocabulary', () => {
  it('names no library component in the skills or USING.md', () => {
    const vendor = [
      'Button', 'TextField', 'MenuItem', 'DataGrid', 'DataTable', 'VirtualList', 'Autocomplete',
      'DatePicker', 'FormControl', 'Chakra', 'Drawer', 'Popover', 'Snackbar', 'Alert', 'Chip',
      'Modal', 'IonButton', 'IonPage', 'mat-button', 'v-btn', 'react-hook-form', 'formik', 'yup', 'zod',
    ];
    const found: string[] = [];
    for (const file of [...files, join(root, 'USING.md')]) {
      const text = read(file);
      for (const name of vendor) if (new RegExp(`\\b${name}\\b`).test(text)) found.push(`${where(file)}: ${name}`);
    }
    expect(found).toEqual([]);
  });
});

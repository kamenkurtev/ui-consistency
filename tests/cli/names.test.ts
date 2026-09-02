import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseModule, walk } from '../../src/parse/parse.js';
import { LEGACY_KNOWLEDGE_DIR } from '../../src/knowledge/paths.js';

/**
 * Nothing the program can print may name a command or a skill that was deleted.
 *
 * Three releases removed `uic init`, `uic audit`, `ui-consistency:init` and
 * `ui-consistency:audit`, and four places went on telling people to run them —
 * one of them from the `SessionStart` hook, into every session (#150). The
 * documentation made the same mistake, from #123 on 16 August until #143 (#183).
 *
 * Comments are deliberately not checked. A comment recording that `uic init`
 * was deleted is correct and useful; a string offering it to a user is not, and
 * that distinction is exactly why greping the files would not do.
 */

const ROOT = new URL('../../', import.meta.url).pathname;

/** Every `.ts` under a directory, recursively. */
async function sources(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const found: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await sources(path)));
    else if (entry.name.endsWith('.ts')) found.push(path);
  }
  return found;
}

/** The text of every string and template literal in one module. */
function literals(source: string, path: string): string[] {
  const ast = parseModule(source, path);
  if (ast === null) return [];

  const found: string[] = [];
  walk(ast.program, (node) => {
    if (node.type === 'StringLiteral') found.push(node.value);
    if (node.type === 'TemplateElement') found.push(node.value.cooked ?? node.value.raw);
  });
  return found;
}

const COMMAND = /\buic ([a-z][\w-]*)/g;
const SKILL = /\bui-consistency:([a-z][\w-]*)/g;

function named(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(new RegExp(pattern.source, 'g'))].map((match) => match[1] ?? '');
}

describe('what the program offers to run', () => {
  it('names only commands that exist', async () => {
    const real = new Set(
      (await readFile(join(ROOT, 'src/cli/index.ts'), 'utf8'))
        .match(/case '([a-z-]+)':/g)
        ?.map((one) => one.slice(6, -2)) ?? [],
    );
    expect(real.size).toBeGreaterThan(5);

    const offered: string[] = [];
    for (const path of await sources(join(ROOT, 'src'))) {
      const source = await readFile(path, 'utf8');
      for (const text of literals(source, path)) {
        for (const command of named(text, COMMAND)) {
          if (!real.has(command)) offered.push(`${path.slice(ROOT.length)}: uic ${command}`);
        }
      }
    }

    expect(offered).toEqual([]);
  });

  it('names only skills that exist', async () => {
    const real = new Set(await readdir(join(ROOT, 'skills')));
    expect(real.size).toBeGreaterThan(3);

    const offered: string[] = [];
    for (const path of await sources(join(ROOT, 'src'))) {
      const source = await readFile(path, 'utf8');
      for (const text of literals(source, path)) {
        for (const skill of named(text, SKILL)) {
          if (!real.has(skill)) offered.push(`${path.slice(ROOT.length)}: ui-consistency:${skill}`);
        }
      }
    }

    expect(offered).toEqual([]);
  });

  /**
   * A skill is prose the agent reads and acts on, so a dangling name there is
   * an instruction to run something that does not exist. Markdown has no
   * literals to isolate, so the whole file is read — which is right here,
   * because a skill has no reason to mention a deleted skill at all.
   */
  it('the skills and the rules name only commands and skills that exist', async () => {
    const skills = new Set(await readdir(join(ROOT, 'skills')));
    const commands = new Set(
      (await readFile(join(ROOT, 'src/cli/index.ts'), 'utf8'))
        .match(/case '([a-z-]+)':/g)
        ?.map((one) => one.slice(6, -2)) ?? [],
    );

    // The rules are read the same way and for the same reason: they are prose an
    // agent acts on, so a dangling name there is an instruction to run something
    // that does not exist. They are also the half a non-Claude harness reads
    // (#232), where there is no hook to notice.
    const prose: { where: string; text: string }[] = [];
    for (const name of skills) {
      const text = await readFile(join(ROOT, 'skills', name, 'SKILL.md'), 'utf8').catch(() => null);
      if (text !== null) prose.push({ where: `skills/${name}`, text });
    }
    for (const name of await readdir(join(ROOT, 'rules'))) {
      if (!name.endsWith('.md')) continue;
      const text = await readFile(join(ROOT, 'rules', name), 'utf8').catch(() => null);
      if (text !== null) prose.push({ where: `rules/${name}`, text });
    }
    expect(prose.length).toBeGreaterThan(8);

    const offered: string[] = [];
    for (const { where, text } of prose) {
      for (const skill of named(text, SKILL)) {
        if (!skills.has(skill)) offered.push(`${where}: ui-consistency:${skill}`);
      }
      for (const command of named(text, COMMAND)) {
        if (!commands.has(command)) offered.push(`${where}: uic ${command}`);
      }
    }

    expect(offered).toEqual([]);
  });
});

/**
 * Nothing the program prints may send somebody to the deprecated directory.
 *
 * `.claude/ui-consistency/` is still *read*, and that fallback is load-bearing —
 * but a message that tells a user to *create* a file there undoes the rename it
 * survives (#145: a Codex user committing their team's design decisions into a
 * directory named after a different vendor's tool). `uic pattern --kind` did
 * exactly that, and so did the log's advice on where to write a heading (#230).
 *
 * String literals again, not file text: `src/knowledge/paths.ts` holds the
 * constant and the notice built from it, and both are correct.
 */
describe('where the program sends people to write', () => {
  it('names the current knowledge directory, never the legacy one', async () => {
    const authority = join(ROOT, 'src/knowledge/paths.ts');
    // Pinned, not just imported: the guard is only worth anything while the
    // constant still holds the path people actually have in their repositories.
    expect(LEGACY_KNOWLEDGE_DIR).toBe('.claude/ui-consistency');

    const offered: string[] = [];
    for (const path of await sources(join(ROOT, 'src'))) {
      if (path === authority) continue;
      const source = await readFile(path, 'utf8');
      for (const text of literals(source, path)) {
        if (text.includes(LEGACY_KNOWLEDGE_DIR)) offered.push(`${path.slice(ROOT.length)}: ${text.trim()}`);
      }
    }

    expect(offered).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Nothing this plugin ships may name a command or a skill that was deleted.
 *
 * The skills *are* the product, so a dangling name in one of them
 * is an instruction to run something that does not exist, handed to an agent
 * that will try.
 */

const ROOT = new URL('../', import.meta.url).pathname;

/**
 * Two spellings: `uic check` is how prose names a command, and
 * `node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" check` is how a skill invokes one.
 */
const COMMAND = /\buic(?:\.mjs"?)? ([a-z][\w-]*)/g;
const SKILL = /\bui-consistency:([a-z][\w-]*)/g;

function named(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(new RegExp(pattern.source, 'g'))].map((match) => match[1] ?? '');
}

describe('what the skills offer to run', () => {
  it('names only commands and skills that exist', async () => {
    const skills = new Set(await readdir(join(ROOT, 'skills')));

    // Read off the binary's own usage line, so a command added and never
    // exercised here fails rather than escaping. One command, and the day it
    // becomes two this needs nothing.
    const usage = await readFile(join(ROOT, 'src/cli/main.ts'), 'utf8');
    const commands = new Set(named(usage, /Usage: uic ([a-z][\w-]*)/gu));
    expect(commands.size).toBeGreaterThan(0);

    // Markdown has no literals to isolate, so the whole file is read — which is
    // right here, because a skill has no reason to mention a deleted skill at
    // all.
    const prose: { where: string; text: string }[] = [];
    for (const name of skills) {
      // A supporting file is read by the same agent as the SKILL.md that links it.
      const files = await readdir(join(ROOT, 'skills', name)).catch(() => [] as string[]);
      for (const file of files.filter((f) => f.endsWith('.md'))) {
        const text = await readFile(join(ROOT, 'skills', name, file), 'utf8').catch(() => null);
        if (text !== null) prose.push({ where: `skills/${name}/${file}`, text });
      }
    }
    expect(prose.length).toBeGreaterThanOrEqual(4);

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

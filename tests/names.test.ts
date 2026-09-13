import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Nothing this plugin ships may name a command or a skill that was deleted.
 *
 * Three releases removed `uic init`, `uic audit`, `ui-consistency:init` and
 * `ui-consistency:audit`, and four places went on telling people to run them —
 * one of them from the `SessionStart` hook, into every session (#150). The
 * documentation made the same mistake, from #123 on 16 August until #143.
 *
 * **It caught something in every one of #79, #77, #78 and #81**, which is why
 * it survives the change that deleted most of the suite around it. Its module
 * half is gone with the modules — the program is 419 lines and prints one
 * usage line — and its prose half is now the **whole** point: the skills and
 * the rules *are* the product, so a dangling name in one of them is an
 * instruction to run something that does not exist, handed to an agent that
 * will try.
 *
 * The tension this rule lives with is worth keeping written down.
 * `.claude/rules/uic-docs.md` says to strike a withdrawn statement through
 * rather than replace it silently. In `skills/` and `rules/` those two
 * collide, and **this guard wins**: a struck-through command in a file an agent
 * acts on is still a name it can read and run. So there the withdrawal stays
 * and the dead name goes — *"a command did this and is gone (#78)"*. In
 * `CLAUDE.md`, `README.md`, `AGENTS.md` and `docs/concept.md`, which are prose
 * *about* the project rather than instructions *to* an agent, the names are
 * struck in place as that rule requires.
 */

const ROOT = new URL('../', import.meta.url).pathname;

/**
 * Two spellings, and the second was a hole in this guard until #89.
 *
 * `uic check` is how prose names a command. `node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" check`
 * is how a skill actually **invokes** one, and it is the spelling an agent
 * copies and runs — and it was matched by nothing here, because the text
 * between `uic` and the command is `.mjs"`. Four skills were still invoking a
 * removed command with this file green.
 */
const COMMAND = /\buic(?:\.mjs"?)? ([a-z][\w-]*)/g;
const SKILL = /\bui-consistency:([a-z][\w-]*)/g;

function named(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(new RegExp(pattern.source, 'g'))].map((match) => match[1] ?? '');
}

describe('what the skills and the rules offer to run', () => {
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

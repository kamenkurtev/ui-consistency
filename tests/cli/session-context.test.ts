import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sessionContext } from '../../src/cli/session.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-session-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('what a session is told', () => {
  it('names every skill and the order between them', async () => {
    // It once named one skill of several and left the rest to whatever the
    // harness happened to match on.
    const said = (await sessionContext(root)) ?? '';

    for (const skill of [
      'finding-patterns',
      'planning',
      'implementing',
      'verifying',
    ]) {
      expect(said).toContain(`ui-consistency:${skill}`);
    }
  });

  it('joins a process already running instead of competing with it', async () => {
    // A second standing instruction that claims the start of every task fights
    // whichever planning process is installed beside it. The skills add to a
    // spec or plan that exists, and run the phases themselves when none does.
    const said = (await sessionContext(root)) ?? '';

    expect(said).not.toContain('until somebody asks');
    expect(said).toContain('already exists');
    expect(said).toContain('only about contradictions and proposals');
  });

  it('says it whether or not the project has written anything down', async () => {
    // The instruction is about how to work here, not about what this project
    // happens to have. A project with nothing written down is the one that most
    // needs to be told what to do first.
    const bare = await sessionContext(root);

    await mkdir(join(root, '.ui-consistency'), { recursive: true });
    await writeFile(join(root, '.ui-consistency/rules.md'), '# Rules\n\nSomething.\n');
    const withKnowledge = await sessionContext(root);

    expect(bare).toContain('ui-consistency:finding-patterns');
    expect(withKnowledge).toContain('ui-consistency:finding-patterns');
  });

  it('still reports the old knowledge directory, beside the instruction', async () => {
    // A rename whose fallback works silently leaves people on the old path
    // forever, and this is where they already look.
    await mkdir(join(root, '.claude/ui-consistency'), { recursive: true });
    await writeFile(join(root, '.claude/ui-consistency/rules.md'), '# Rules\n');

    const said = (await sessionContext(root)) ?? '';

    expect(said).toContain('ui-consistency:finding-patterns');
    expect(said).toContain('is the old location');
  });

  it('is short, because it is paid for on every session', async () => {
    // The cost promise is the reason this is fixed text rather than a scan. A
    // standing instruction that grows without anybody noticing is the same
    // failure as a scan.
    const said = (await sessionContext(root)) ?? '';

    expect(said.length).toBeLessThan(1400);
  });
});

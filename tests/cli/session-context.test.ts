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
      'accessibility',
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
  });

  it('says a decision is reported, and asking is the exception', async () => {
    // A session told only which skills exist will still stop and ask, which is
    // the hand-work the plugin exists to remove. The standing text carries the
    // shape of the answer: decide, say what settled it, ask only where the
    // order ties and the change reaches outside the task.
    const said = (await sessionContext(root)) ?? '';

    expect(said).toContain('Decide by the order');
    expect(said).toContain('ask only where it ties');
  });

  it('says a directory an older version wrote is left behind and can go', async () => {
    // Nothing writes into a project's repository any more. A directory an older
    // version wrote is said once, beside the instruction, so it does not sit in
    // every branch looking like something the plugin still reads.
    for (const dir of ['.ui-consistency', '.claude/ui-consistency']) {
      await rm(join(root, '.ui-consistency'), { recursive: true, force: true });
      await rm(join(root, '.claude'), { recursive: true, force: true });
      await mkdir(join(root, dir), { recursive: true });
      await writeFile(join(root, dir, 'rules.md'), '# Rules\n');

      const said = (await sessionContext(root)) ?? '';

      expect(said).toContain('ui-consistency:finding-patterns');
      expect(said).toContain(`${dir}/ was written by an older version`);
      expect(said).toContain('can be deleted');
    }
  });

  it('says nothing more where nothing was left behind', async () => {
    const said = (await sessionContext(root)) ?? '';
    expect(said).not.toContain('older version');
  });

  it('is short, because it is paid for on every session', async () => {
    // The cost promise is the reason this is fixed text rather than a scan. A
    // standing instruction that grows without anybody noticing is the same
    // failure as a scan.
    const said = (await sessionContext(root)) ?? '';

    expect(said.length).toBeLessThan(1400);
  });
});

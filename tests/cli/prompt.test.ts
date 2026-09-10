import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promptContext, promptResponse } from '../../src/cli/prompt.js';

let root: string;

const pattern = async (name: string, body: string): Promise<void> => {
  await mkdir(join(root, '.ui-consistency/patterns'), { recursive: true });
  await writeFile(join(root, `.ui-consistency/patterns/${name}.md`), body);
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-prompt-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('what reaches the agent before it writes', () => {
  it('says nothing at all about a prompt that is not UI work', async () => {
    // The cost promise. A prompt about anything else must not read a file, and
    // the not-UI exit is the first thing that happens.
    expect(await promptContext(root, 'why is the build slow')).toBeNull();
    expect(await promptContext(root, 'bump the dependency and run the tests')).toBeNull();
  });

  it('names the patterns the project has written down', async () => {
    await pattern(
      'list-screen',
      '---\npattern: list-screen\nsurface: screen\nholder: PageShell\n---\n\n# List screen\n',
    );

    const said = (await promptContext(root, 'add a new orders page like the others')) ?? '';

    expect(said).toContain('list-screen');
    expect(said).toContain('PageShell');
    expect(said).toContain('before you write');
  });

  it('says plainly when the project has written none, rather than nothing', async () => {
    // Silence here is the failure the whole level exists for: a project that had
    // written nothing down got, in effect, an import checker.
    const said = (await promptContext(root, 'build a settings dialog')) ?? '';

    expect(said).toContain('written no patterns down');
    expect(said).toContain('ui-consistency:pattern');
  });

  /**
   * The half of the moment that #27 did not carry. A channel that only reports
   * what a project has written down opens onto nothing on a fresh install, and
   * the instruction there used to be a command to run and a question to answer
   * — which is how an installation stays silent through a full day of real UI
   * work.
   */
  it('instructs the agent to establish the pattern, not to ask for one', async () => {
    const said = (await promptContext(root, 'build a settings dialog')) ?? '';

    expect(said).toContain('Establish it first');
    expect(said).toContain('Find a screen of that kind that already exists here');
    expect(said).toContain('Do not ask the user for a reference');
    // The flag, not just the skill name: without it an agent that does not load
    // the skill runs `uic pattern <screen>`, which prints JSON and writes
    // nothing — the channel opens and still nothing lands.
    expect(said).toContain('--establish');
  });

  it('names the decide path for a kind with too few screens to derive from', async () => {
    // The commonest answer this tool gives, and a dead end until it named one.
    const said = (await promptContext(root, 'build a settings dialog')) ?? '';

    expect(said).toContain('fewer than three screens');
    expect(said).toContain('ui-consistency:decide');
  });

  it('says the same where patterns exist but none covers the kind', async () => {
    // A project with one pattern file and a second kind of screen is the same
    // situation as a fresh install, for that kind.
    await pattern('list-screen', '---\npattern: list-screen\nholder: PageShell\n---\n');

    const said = (await promptContext(root, 'add a new orders page like the others')) ?? '';

    expect(said).toContain('Where none of them covers that kind');
    expect(said).toContain('Establish it first');
  });

  it('warns where a pattern was read from screens that have since changed', async () => {
    // The moment it matters. A pattern derived from screens that have moved is
    // the one thing worse than no pattern, and this is the moment before the
    // next screen is written from it.
    await mkdir(join(root, 'src'), { recursive: true });
    const screen = join(root, 'src/OrdersPage.tsx');
    await writeFile(screen, 'export const P = () => <X />;\n');
    const later = new Date('2026-09-11T09:00:00Z');
    await utimes(screen, later, later);
    await pattern(
      'list-screen',
      '---\npattern: list-screen\nholder: PageShell\nobserved: 2026-09-09\n---\n\n' +
        '## Where it is used\n\n`src/OrdersPage.tsx`\n',
    );

    const said = (await promptContext(root, 'change the orders screen')) ?? '';

    expect(said).toContain('changed since it was read');
  });

  /**
   * "Re-derive before trusting it" named no way to do either, which an agent
   * can only act on by ignoring the pattern or by rewriting somebody's file by
   * hand. What it says now depends on which kind of file it is (#28).
   */
  it('names the refresh for a file it derived, and not for one a person wrote', async () => {
    const screen = join(root, 'src/OrdersPage.tsx');
    await mkdir(dirname(screen), { recursive: true });
    await writeFile(screen, 'export const OrdersPage = () => <PageShell />;');
    const later = new Date('2026-09-11T09:00:00Z');
    await utimes(screen, later, later);
    const front = 'holder: PageShell\nobserved: 2026-09-09';
    const used = '## Where it is used\n\n`src/OrdersPage.tsx`\n';

    await pattern('derived-one', `---\npattern: derived-one\n${front}\nderived: true\n---\n\n${used}`);
    await pattern('written-one', `---\npattern: written-one\n${front}\n---\n\n${used}`);

    const said = (await promptContext(root, 'change the orders screen')) ?? '';

    expect(said).toContain('--refresh` first');
    expect(said).toContain('a person wrote it, so read it against');
  });

  /**
   * Half of #28: the loop starts because the work is that shape. Named and not
   * begun — a hook writing a queue to disk off a regular expression over
   * English would start a process nobody asked for, before a file had been read.
   */
  it('names the rollout loop where the prompt is a set, and not where it is one screen', async () => {
    const many = (await promptContext(root, 'add a density toggle to all the list pages')) ?? '';
    expect(many).toContain('ui-consistency:rollout');
    expect(many).toContain('names a set, not one screen');

    const one = (await promptContext(root, 'add a density toggle to the orders page')) ?? '';
    expect(one).not.toContain('ui-consistency:rollout');

    // Not about screens at all still reads no file and says nothing.
    expect(await promptContext(root, 'update all the database migrations')).toBeNull();
  });
});

describe('the UserPromptSubmit adapter', () => {
  it('reads either spelling of the field', async () => {
    // The field has been `prompt` and `user_input`. Reading one is a hook that
    // is silent on the harness that writes the other.
    for (const key of ['prompt', 'user_input']) {
      const said = await promptResponse(JSON.stringify({ cwd: root, [key]: 'a new dialog' }));
      expect(said).toContain('written no patterns down');
    }
  });

  it('says nothing on rubbish rather than throwing', async () => {
    expect(await promptResponse('not json')).toBeNull();
    expect(await promptResponse('{}')).toBeNull();
    expect(await promptResponse(JSON.stringify({ cwd: root, prompt: '' }))).toBeNull();
  });

  it('returns text and never a decision', async () => {
    // This event's decision fields are how a prompt gets blocked. Nothing in
    // this tool blocks anything, so what it returns is context or nothing.
    const said = await promptResponse(JSON.stringify({ cwd: root, prompt: 'a new screen' }));

    expect(typeof said).toBe('string');
    expect(said).not.toContain('permissionDecision');
    expect(said).not.toContain('blockReason');
  });
});

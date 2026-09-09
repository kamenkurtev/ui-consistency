import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const script = fileURLToPath(new URL('../../scripts/version-check.sh', import.meta.url));

let repo: string;

const run = (args: string[], cwd = repo): Promise<{ code: number; out: string }> =>
  new Promise((done) => {
    execFile(args[0]!, args.slice(1), { cwd }, (error, stdout, stderr) => {
      const code = error === null ? 0 : Number(error.code ?? 1);
      done({ code, out: `${stdout}${stderr}` });
    });
  });

const git = (...args: string[]): Promise<{ code: number; out: string }> => run(['git', ...args]);

const manifest = (version: string): string => `{ "name": "uic", "version": "${version}" }\n`;

beforeEach(async () => {
  repo = await mkdtemp(join(tmpdir(), 'uic-gate-'));
  await mkdir(join(repo, '.claude-plugin'), { recursive: true });
  await mkdir(join(repo, 'src'), { recursive: true });
  await writeFile(join(repo, '.claude-plugin/plugin.json'), manifest('1.0.0'));
  await writeFile(join(repo, 'src/index.ts'), 'export const a = 1;\n');

  await git('init', '-q', '-b', 'main');
  await git('config', 'user.email', 'test@example.com');
  await git('config', 'user.name', 'test');
  await git('add', '-A');
  await git('commit', '-qm', 'first');
  // A remote-tracking ref without a remote: the check reads `origin/main`, and
  // what it is pointed at is the whole of what it compares against.
  const head = await git('rev-parse', 'HEAD');
  await git('update-ref', 'refs/remotes/origin/main', head.out.trim());
});

afterEach(async () => {
  await rm(repo, { recursive: true, force: true });
});

describe('the version check', () => {
  it('fails on a shipped change that is not committed yet', async () => {
    // The defect. `HEAD` is `origin/main` on a branch nobody has committed to,
    // and the check skipped itself entirely — while `uic-pr.md` step 1 is *run
    // the gate*, which is the run most likely to happen on an uncommitted tree.
    await writeFile(join(repo, 'src/index.ts'), 'export const a = 2;\n');

    const { code, out } = await run(['bash', script]);

    expect(code).toBe(1);
    expect(out).toContain('leaves the version at');
  });

  it('fails on a shipped change that is committed', async () => {
    await writeFile(join(repo, 'src/index.ts'), 'export const a = 2;\n');
    await git('checkout', '-qb', 'branch');
    await git('commit', '-qam', 'change');

    expect((await run(['bash', script])).code).toBe(1);
  });

  it('passes once the version moves, before the bump is committed', async () => {
    // A bump made and not yet committed is a bump. The first version of this
    // check read HEAD on one side and sent people round a loop over exactly it.
    await writeFile(join(repo, 'src/index.ts'), 'export const a = 2;\n');
    await writeFile(join(repo, '.claude-plugin/plugin.json'), manifest('1.0.1'));

    const { code, out } = await run(['bash', script]);

    expect(code).toBe(0);
    expect(out).toContain('version moved');
  });

  it('says nothing needs a bump when only unshipped files changed', async () => {
    await writeFile(join(repo, 'README.md'), 'docs only\n');

    const { code, out } = await run(['bash', script]);

    expect(code).toBe(0);
    expect(out).toContain('no bump needed');
  });

  it('skips itself where there is no origin/main, rather than failing', async () => {
    // A gate that cannot run offline is a gate that gets skipped.
    await git('update-ref', '-d', 'refs/remotes/origin/main');
    await writeFile(join(repo, 'src/index.ts'), 'export const a = 2;\n');

    const { code, out } = await run(['bash', script]);

    expect(code).toBe(0);
    expect(out).toContain('skipping the version check');
  });
});

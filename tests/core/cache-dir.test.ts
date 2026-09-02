import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, readdir, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cacheRoot, ownedDir, projectKey } from '../../src/core/cache-dir.js';

/**
 * `os.tmpdir()` is `/tmp` on Linux — shared and world-writable — and the
 * per-project name is an unsalted hash of the repository path (#172).
 */
describe('the directory this tool caches into', () => {
  const original = process.env['TMPDIR'];
  let fake: string;

  beforeEach(async () => {
    fake = await mkdtemp(join(tmpdir(), 'uic-cachedir-'));
    process.env['TMPDIR'] = fake;
  });
  afterEach(async () => {
    if (original === undefined) delete process.env['TMPDIR'];
    else process.env['TMPDIR'] = original;
    await rm(fake, { recursive: true, force: true });
  });

  it('is named for the user, not for the project alone', () => {
    expect(cacheRoot()).toContain(`uic-cache-${process.getuid?.() ?? 'shared'}`);
  });

  it('is created owner-only', async () => {
    const dir = await ownedDir(projectKey('/some/project'));

    expect(dir).not.toBeNull();
    const found = await lstat(dir!);
    expect(found.mode & 0o777).toBe(0o700);
  });

  /**
   * `mkdir(recursive: true)` does not fail when the final segment is already a
   * symlink to a real directory — it stats through it and treats the path as
   * present, so every later write follows it somewhere else. Planted once,
   * before the first run; not a race.
   */
  it('refuses a name something else has already claimed with a symlink', async () => {
    const elsewhere = join(fake, 'attacker');
    await mkdir(elsewhere, { recursive: true });
    await mkdir(cacheRoot(), { recursive: true });
    await symlink(elsewhere, join(cacheRoot(), projectKey('/some/project')));

    expect(await ownedDir(projectKey('/some/project'))).toBeNull();
    expect(await readdir(elsewhere)).toEqual([]);
  });

  it('gives the same project the same name twice', () => {
    expect(projectKey('/a/b')).toBe(projectKey('/a/b'));
    expect(projectKey('/a/b')).not.toBe(projectKey('/a/c'));
  });

  /**
   * Checking only the per-project directory is not enough, and the first
   * version of this fix did exactly that.
   *
   * `mkdir(recursive)` creates the project directory *inside* whatever the
   * parent points at, and the `lstat` then finds a real directory the victim
   * has just made and owns. It passes, and the log lands in the attacker's
   * directory. Reproduced against the built bundle.
   */
  it('refuses a symlink planted one level up, at the root itself', async () => {
    const elsewhere = join(fake, 'attacker');
    await mkdir(elsewhere, { recursive: true });
    await symlink(elsewhere, cacheRoot());

    expect(await ownedDir(projectKey('/some/project'))).toBeNull();
    expect(await readdir(elsewhere)).toEqual([]);
  });
});

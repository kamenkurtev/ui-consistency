import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The first-run acceptance harness, checked.
 *
 * **What this proves and what it cannot.** It proves the harness works — that
 * its guards bite and that it classifies what a command said. It proves nothing
 * whatever about whether the tool is blind on a real repository, because the
 * repositories it runs against here are fixtures, and *"fixtures here have
 * never caught a real defect"* is the standing rule. The claim about real
 * repositories comes from running `npm run first-run <paths>` by hand, and the
 * numbers from that run are recorded in `CLAUDE.md`.
 *
 * Keeping those two apart is the point. A suite that appeared to assert the
 * second would be the defect #39 exists to catch, one level out.
 */
const harness = fileURLToPath(new URL('../../scripts/first-run.mjs', import.meta.url));

interface Run {
  code: number;
  stdout: string;
  stderr: string;
}

const runHarness = (args: string[]): Promise<Run> =>
  new Promise((done) => {
    execFile(
      process.execPath,
      [harness, ...args],
      { maxBuffer: 32 * 1024 * 1024, timeout: 300_000 },
      (error, stdout, stderr) => {
        done({
          code: error === null ? 0 : typeof error.code === 'number' ? error.code : 1,
          stdout,
          stderr,
        });
      },
    );
  });

describe('the first-run acceptance harness', () => {
  /**
   * The one assertion that cannot be satisfied by accident, and the reason it
   * exists: a first-run acceptance test that goes green with no repository
   * present *is* "nothing, everywhere, called success" — the exact defect it is
   * there to catch. A clone with no monorepo on it must fail this, loudly.
   */
  it('fails when given no repository, rather than passing over nothing', async () => {
    const run = await runHarness([]);

    expect(run.code).toBe(1);
    expect(run.stderr).toContain('no repository given');
    expect(run.stderr).toContain('passing here would be the failure it exists to catch');
    expect(run.stdout.trim()).toBe('');
  });

  it('fails on a path that is not a directory', async () => {
    const run = await runHarness([join(tmpdir(), 'uic-not-there-at-all')]);
    expect(run.code).toBe(1);
    expect(run.stderr).toContain('is not a directory');
  });

  /**
   * The harness reads the command list off the binary's own usage line, so a
   * command added to the CLI and not exercised here fails instead of quietly
   * escaping. Checked against the real binary: every command it admits to
   * having is either run or named as not runnable this way.
   */
  it('covers every command the binary says it has', async () => {
    const root = await mkdtemp(join(tmpdir(), 'uic-firstrun-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"tiny"}');
    await writeFile(join(root, 'src/OnePage.tsx'), 'export const OnePage = () => <Shell><div /></Shell>;');

    const run = await runHarness([root]);

    // The completeness check runs before any classification, so a gap in it
    // would surface here whatever the repository answered.
    expect(run.stderr).not.toContain('command(s) this harness does not run');
    await rm(root, { recursive: true, force: true });
  });

  /**
   * A repository with one screen file and nothing written down: the shape of a
   * fresh install. Every command must land in one of the three answers, and
   * none may be silent — and the classification has to be visible per command
   * rather than as one verdict, because *which* level went quiet is the whole
   * information.
   */
  it('classifies every command, and reports the answers per command', async () => {
    const root = await mkdtemp(join(tmpdir(), 'uic-firstrun-one-'));
    await mkdir(join(root, 'src/pages'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"one"}');
    await writeFile(
      join(root, 'src/pages/OnePage.tsx'),
      'export const OnePage = () => <PageShell title="one"><div /></PageShell>;',
    );

    const run = await runHarness([root]);

    expect(run.code).toBe(0);
    expect(run.stdout).toContain('No level answered with empty output and exit 0');
    // Every command named, so a level that was not run cannot hide in a verdict.
    for (const command of ['scan', 'check', 'inventory', 'place', 'pattern', 'patterns', 'tree', 'group', 'log']) {
      expect(run.stdout).toContain(command);
    }
    // Which files the per-file answers are about, because one file's luck is
    // not a fact about the tool.
    expect(run.stdout).toContain('per-file commands asked about');

    await rm(root, { recursive: true, force: true });
  });

  /**
   * A directory with no source in it at all. Still not licence to be silent:
   * the commands that take no file still run, and the ones that take files must
   * say they were given none.
   */
  it('is not silent on a directory with nothing in it', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'uic-firstrun-empty-'));

    const run = await runHarness([empty]);

    expect(run.stdout).toContain('0 screen-ish file(s) found');
    expect(run.stdout).not.toContain('SILENT');
    expect(run.code).toBe(0);

    await rm(empty, { recursive: true, force: true });
  });

  it('emits machine-readable rows, so a run can be recorded rather than retyped', async () => {
    const root = await mkdtemp(join(tmpdir(), 'uic-firstrun-json-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"json"}');
    await writeFile(join(root, 'src/OnePage.tsx'), 'export const OnePage = () => <Shell><div /></Shell>;');

    const run = await runHarness([root, '--json']);
    const reports = JSON.parse(run.stdout) as {
      root: string;
      screens: number;
      about: string[];
      rows: { command: string; answer: string; tally: Record<string, number> }[];
    }[];

    expect(reports).toHaveLength(1);
    expect(reports[0]!.rows.length).toBeGreaterThan(8);
    // Counts and classifications, never the source it read — the same rule the
    // log keeps, and this output is meant to be pasted into a record.
    expect(run.stdout).not.toContain('export const OnePage');

    await rm(root, { recursive: true, force: true });
  });
});

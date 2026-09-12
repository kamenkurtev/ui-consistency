import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The with/without benchmark scorer, checked.
 *
 * **What this proves and what it cannot.** It proves the scorer reads a drift
 * curve that is *planted* — an OFF arm built to degrade with position and an ON
 * arm built to match — and that its guards bite. It proves nothing whatever
 * about whether an agent writes a better screen with the pattern in front of
 * it, because no agent wrote any of these files. That claim needs the runs, and
 * two of the issue's four numbers cannot come from files on disk at all.
 *
 * Keeping those apart is the same discipline as `first-run.test.ts`: a suite
 * that appeared to assert the outcome would be the anecdote with a table that
 * #34 was filed against.
 */
const harness = fileURLToPath(new URL('../../scripts/bench.mjs', import.meta.url));

interface Run {
  code: number;
  stdout: string;
  stderr: string;
}

const bench = (args: string[], cwd: string): Promise<Run> =>
  new Promise((done) => {
    execFile(
      process.execPath,
      [harness, ...args],
      { cwd, maxBuffer: 32 * 1024 * 1024, timeout: 300_000 },
      (error, stdout, stderr) => {
        done({
          code: error === null ? 0 : typeof error.code === 'number' ? error.code : 1,
          stdout,
          stderr,
        });
      },
    );
  });

const git = (args: string[], cwd: string): Promise<Run> =>
  new Promise((done) => {
    execFile('git', args, { cwd }, (error, stdout, stderr) => {
      done({ code: error === null ? 0 : 1, stdout, stderr });
    });
  });

const PATTERN = [
  '---',
  'pattern: list',
  'holder: PageShell',
  'read: 6 files',
  'from: pattern',
  'observed: 2026-09-01',
  'derived: true',
  '---',
  '',
  '# List',
  '',
  '## Structure',
  '',
  '```',
  'PageShell                           6 of 6',
  '  DataGrid                          6 of 6',
  '```',
  '',
  '## Props',
  '',
  '### `PageShell`',
  '',
  '- `title` — 6 of 6',
  '- `data-testid` — 6 of 6',
  '- `density` = "compact" — 6 of 6',
  '',
  '## Rules',
  '',
  '- The title is a sentence, never a noun phrase.',
  '',
  '## Where it is used',
  '',
  '`on/01.tsx`',
].join('\n');

/** Matches the pattern exactly. */
const matching = (n: string): string =>
  [
    "import { PageShell } from '../src/ui/PageShell';",
    "import { DataGrid } from '../src/ui/DataGrid';",
    `export function S${n}() {`,
    `  return <PageShell title="t${n}" data-testid="t-${n}" density="compact"><DataGrid /></PageShell>;`,
    '}',
  ].join('\n');

/** One prop short. */
const oneOff = (n: string): string => matching(n).replace(' density="compact"', '');

/** Two props short, and the child the pattern says every screen has. */
const threeOff = (n: string): string =>
  [
    "import { PageShell } from '../src/ui/PageShell';",
    `export function S${n}() {`,
    `  return <PageShell title="t${n}"><div /></PageShell>;`,
    '}',
  ].join('\n');

let root: string;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-bench-'));
  await mkdir(join(root, '.ui-consistency/patterns'), { recursive: true });
  await mkdir(join(root, 'src/ui'), { recursive: true });
  await mkdir(join(root, 'on'), { recursive: true });
  await mkdir(join(root, 'off'), { recursive: true });
  await writeFile(join(root, 'package.json'), '{"name":"bench-fixture"}');
  await writeFile(join(root, 'src/ui/PageShell.tsx'), 'export const PageShell = (p: any) => <div {...p} />;');
  await writeFile(join(root, 'src/ui/DataGrid.tsx'), 'export const DataGrid = () => <table />;');
  await writeFile(join(root, '.ui-consistency/patterns/list.md'), PATTERN);

  // Eighteen apiece. ON matches throughout; OFF is planted to degrade with
  // position — clean, then one prop short, then three. That is the shape the
  // claim predicts, and the scorer has to be able to read it.
  const numbers = Array.from({ length: 18 }, (_, at) => String(at + 1).padStart(2, '0'));
  for (const [at, n] of numbers.entries()) {
    await writeFile(join(root, `on/${n}.tsx`), matching(n));
    await writeFile(join(root, `off/${n}.tsx`), at < 6 ? matching(n) : at < 12 ? oneOff(n) : threeOff(n));
  }

  // What was live while each arm was written. Required since #71, because an
  // arm that does not say cannot be told from a contaminated one.
  await writeFile(join(root, 'off/arm.json'), JSON.stringify({ plugin: 'none' }));
  await writeFile(join(root, 'on/arm.json'), JSON.stringify({ plugin: '0.14.107' }));

  // The pre-run guard reads git, so the fixture is a repository and the pattern
  // is committed in it — which is what the guard exists to require.
  await git(['init', '-q'], root);
  await git(['add', '-A'], root);
  await git(['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'arms and the pattern'], root);
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('the with/without benchmark scorer', () => {
  it('reads a planted drift curve: flat on one arm, bending on the other', async () => {
    const run = await bench(
      ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'off', '--on', 'on', '--json'],
      root,
    );
    const report = JSON.parse(run.stdout) as {
      conformance: { off: { mean: number; measured: number }; on: { mean: number } };
      drift: { off: { early: number; late: number; drift: number }; on: { drift: number } };
      perPosition: { position: number; off: number; on: number }[];
      batch: { comparable: boolean };
    };

    expect(report.batch.comparable).toBe(true);
    expect(report.conformance.on.mean).toBe(0);
    expect(report.conformance.off.mean).toBeGreaterThan(0);
    expect(report.conformance.off.measured).toBe(18);

    // The claim's own shape: the arm without the pattern gets worse later in
    // the batch, and the arm with it does not.
    expect(report.drift.on.drift).toBe(0);
    expect(report.drift.off.early).toBe(0);
    expect(report.drift.off.late).toBeGreaterThan(report.drift.off.early);
    expect(report.drift.off.drift).toBeGreaterThan(0);

    // Per position, because a mean cannot tell *consistently mediocre* from
    // *fine at first and drifting*, and the second is the whole subject.
    expect(report.perPosition).toHaveLength(18);
    expect(report.perPosition[0]!.off).toBe(0);
    expect(report.perPosition[17]!.off).toBeGreaterThan(0);
  });

  it('names what it did not score rather than folding it into the numbers', async () => {
    const run = await bench(
      ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'off', '--on', 'on', '--json'],
      root,
    );
    const report = JSON.parse(run.stdout) as {
      handedOverAndNotScored: string[];
      notMeasuredHere: string[];
    };

    // A pattern states sentences no program evaluates. A conformance number
    // that quietly ignored them would overstate itself.
    expect(report.handedOverAndNotScored.join(' ')).toContain('The title is a sentence');
    // And the two numbers the issue asks for that no reading of files produces.
    expect(report.notMeasuredHere.join(' ')).toContain('cost');
    expect(report.notMeasuredHere.join(' ')).toContain('false findings');
  });

  describe('the guard that makes the numbers mean anything', () => {
    it('refuses a pattern with uncommitted changes', async () => {
      await writeFile(join(root, '.ui-consistency/patterns/list.md'), `${PATTERN}\n\n<!-- edited -->\n`);

      const run = await bench(
        ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'off', '--on', 'on'],
        root,
      );

      expect(run.code).toBe(1);
      expect(run.stderr).toContain('uncommitted changes');
      expect(run.stderr).toContain('measures nothing');
      expect(run.stdout.trim()).toBe('');

      await writeFile(join(root, '.ui-consistency/patterns/list.md'), PATTERN);
    });

    it('refuses a pattern git has never seen', async () => {
      const loose = join(root, 'loose.md');
      await writeFile(loose, PATTERN);
      // Untracked: nothing says it predates the arms, and a pattern authored
      // from an arm's own output is the failure this guard is for.
      const run = await bench(['--pattern', 'loose.md', '--off', 'off', '--on', 'on'], root);

      expect(run.code).toBe(1);
      expect(run.stderr).toContain('not tracked by git');

      await rm(loose, { force: true });
    });

    it('says so in the report when the guard was overridden', async () => {
      await writeFile(join(root, '.ui-consistency/patterns/list.md'), `${PATTERN}\n\n<!-- dry run -->\n`);

      const run = await bench(
        ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'off', '--on', 'on', '--i-know'],
        root,
      );

      // A dry run is allowed and is never silently a real one.
      expect(run.stdout).toContain('OVERRIDDEN');

      await writeFile(join(root, '.ui-consistency/patterns/list.md'), PATTERN);
    });

    it('refuses arms of different lengths rather than comparing two experiments', async () => {
      const short = join(root, 'short');
      await mkdir(short, { recursive: true });
      await writeFile(join(short, 'arm.json'), JSON.stringify({ plugin: 'none' }));
      await writeFile(join(short, '01.tsx'), matching('01'));

      const run = await bench(
        ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'short', '--on', 'on'],
        root,
      );

      expect(run.code).toBe(1);
      expect(run.stdout).toContain('NOT COMPARABLE');
      // And a batch too short to bend is said to be, because the drift curve is
      // the measurement and a three-file curve cannot show one.
      expect(run.stdout).toContain('cannot bend');

      await rm(short, { recursive: true, force: true });
    });

    it('needs both arms and a pattern, and says what it does not measure when it refuses', async () => {
      const run = await bench([], root);
      expect(run.code).toBe(1);
      expect(run.stderr).toContain('required');
      expect(run.stderr).toContain('It does not run the arms');
    });
  });

  describe('the second axis, because a flat count has two readings', () => {
    /**
     * An arm that misses the same one thing on every screen and an arm whose
     * grip is slipping produce the same mean and the same flat count curve, and
     * only the second is drift (#63). So: how many deviation kinds each screen
     * introduced that no earlier screen had.
     *
     * Three fixtures, because one proves nothing: an arm that degrades, an arm
     * that is uniformly wrong, and an arm whose count is flat while the kind
     * keeps changing. The axis has to separate the second from the third, which
     * is the reading a flat count cannot give.
     */
    it('bends on both axes where the arm actually degrades', async () => {
      // The standing fixture: clean, then one prop short, then three. New kinds
      // appear at 7 and at 13, so both axes see it.
      const run = await bench(
        ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'off', '--on', 'on', '--json'],
        root,
      );
      const report = JSON.parse(run.stdout) as {
        drift: { off: { drift: number } };
        novelty: { off: { kinds: number; early: number; late: number; firstSeen: { position: number }[] } };
      };

      expect(report.drift.off.drift).toBeGreaterThan(0);
      expect(report.novelty.off.late).toBeGreaterThan(report.novelty.off.early);
      // And where each kind entered, which is what makes a curve readable.
      expect(Math.max(...report.novelty.off.firstSeen.map((one) => one.position))).toBeGreaterThan(6);
    });

    it('reports a uniformly wrong arm as uniform, not as drifting', async () => {
      const uniform = join(root, 'uniform');
      await mkdir(uniform, { recursive: true });
      await writeFile(join(uniform, 'arm.json'), JSON.stringify({ plugin: 'none' }));
      for (const n of Array.from({ length: 18 }, (_, at) => String(at + 1).padStart(2, '0'))) {
        // The same one prop missing on every screen, from the first.
        await writeFile(join(uniform, `${n}.tsx`), oneOff(n));
      }

      const run = await bench(
        ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'uniform', '--on', 'on', '--json'],
        root,
      );
      const report = JSON.parse(run.stdout) as {
        conformance: { off: { mean: number } };
        drift: { off: { drift: number } };
        novelty: { off: { kinds: number; early: number; late: number } };
      };

      // Wrong throughout, and the count curve is flat — which on its own reads
      // the same as an arm that never drifted.
      expect(report.conformance.off.mean).toBeGreaterThan(0);
      expect(report.drift.off.drift).toBe(0);
      // The second axis says which of the two it is.
      expect(report.novelty.off.kinds).toBe(1);
      expect(report.novelty.off.late).toBe(0);
      expect(run.stdout).not.toContain('still appearing late');

      await rm(uniform, { recursive: true, force: true });
    });

    /**
     * And the axis has to be able to bend, or it says nothing either. A planted
     * arm that introduces a *different* deviation every few screens is what
     * drift would actually look like, and the count curve can be flat through
     * it — which is the whole reason this exists.
     */
    it('reports new kinds appearing late, where an arm keeps inventing them', async () => {
      const drifting = join(root, 'drifting');
      await mkdir(drifting, { recursive: true });
      await writeFile(join(drifting, 'arm.json'), JSON.stringify({ plugin: 'none' }));
      const numbers = Array.from({ length: 18 }, (_, at) => String(at + 1).padStart(2, '0'));
      for (const [at, n] of numbers.entries()) {
        // One deviation each, and a *different* one as the batch goes on: the
        // count is 1 throughout — a perfectly flat curve — while the kind keeps
        // changing.
        const which = Math.floor(at / 6);
        const source =
          which === 0
            ? matching(n).replace(' density="compact"', '')
            : which === 1
              ? matching(n).replace(` data-testid="t-${n}"`, '')
              : matching(n).replace('<DataGrid />', '<div />');
        await writeFile(join(drifting, `${n}.tsx`), source);
      }

      const run = await bench(
        ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'drifting', '--on', 'on', '--json'],
        root,
      );
      const report = JSON.parse(run.stdout) as {
        drift: { off: { drift: number } };
        novelty: { off: { kinds: number; early: number; late: number } };
      };

      // The count curve is flat — one deviation per screen from first to last.
      expect(report.drift.off.drift).toBe(0);
      // And the novelty axis is not, which is the point.
      expect(report.novelty.off.kinds).toBeGreaterThan(1);
      expect(report.novelty.off.late).toBeGreaterThan(0);

      await rm(drifting, { recursive: true, force: true });
    });
  });

  /**
   * A file nothing could read must come back as *not measured*. Reported as
   * zero deviations it is *not looked at* presented as *matched* — and it
   * happened: the harness ran the CLI from the pattern's own directory, every
   * arm file resolved to nothing, and a planted 18-screen drift curve scored a
   * flat zero on both arms and looked like a result.
   */
  it('counts a path it could not read as unmeasured, never as a match', async () => {
    const run = await bench(
      ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'off', '--on', 'on', '--json'],
      root,
    );
    const report = JSON.parse(run.stdout) as {
      conformance: { off: { measured: number; unmeasured: number } };
    };
    // The fixture is all readable, so this pins the shape the bug produced:
    // eighteen measured and none quietly averaged in as zero.
    expect(report.conformance.off.measured).toBe(18);
    expect(report.conformance.off.unmeasured).toBe(0);
  });
});

describe('what was live while an arm was written', () => {
  /**
   * The OFF arm is written inside a harness that has the plugin installed, so
   * its `PostToolUse` hook fires on every write it makes and hands it the
   * derived contract — the treatment, through a door neither prompt closes
   * (#71). Two runs were scored before this was noticed, and the second arm's
   * conformance reached the treatment's exactly.
   *
   * The scorer cannot verify it after the fact: the files are on disk and the
   * session is gone. So it is declared — and an arm that declares nothing is
   * refused, because a contaminated arm that looks clean is the defect.
   */
  it('refuses an arm that does not say what was live while it was written', async () => {
    const undeclared = join(root, 'undeclared');
    await mkdir(undeclared, { recursive: true });
    await writeFile(join(undeclared, '01.tsx'), matching('01'));

    const run = await bench(
      ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'undeclared', '--on', 'on'],
      root,
    );

    expect(run.code).toBe(1);
    expect(run.stderr).toContain('arm.json is missing');
    expect(run.stderr).toContain('not close that door');
    expect(run.stdout.trim()).toBe('');

    await rm(undeclared, { recursive: true, force: true });
  });

  it('refuses an OFF arm written with the plugin live', async () => {
    await writeFile(join(root, 'off/arm.json'), JSON.stringify({ plugin: '0.14.107' }));

    const run = await bench(
      ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'off', '--on', 'on'],
      root,
    );

    expect(run.code).toBe(1);
    expect(run.stderr).toContain('written with the plugin live');
    expect(run.stderr).toContain('no baseline');

    await writeFile(join(root, 'off/arm.json'), JSON.stringify({ plugin: 'none' }));
  });

  it('scores, and prints what each arm was written with, once both declare', async () => {
    await writeFile(join(root, 'off/arm.json'), JSON.stringify({ plugin: 'none' }));
    await writeFile(join(root, 'on/arm.json'), JSON.stringify({ plugin: '0.14.107' }));

    const run = await bench(
      ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'off', '--on', 'on'],
      root,
    );

    expect(run.code).toBe(0);
    // Printed on every run: "none" is a meaningful value, and two runs differed
    // by it without anybody being able to see that they had.
    expect(run.stdout).toContain('written with:');
    expect(run.stdout).toContain('"plugin":"none"');

    // An OFF arm that could not have the plugin uninstalled declares the switch.
    await writeFile(join(root, 'off/arm.json'), JSON.stringify({ plugin: '0.14.107', silenced: true }));
    const silenced = await bench(
      ['--pattern', '.ui-consistency/patterns/list.md', '--off', 'off', '--on', 'on'],
      root,
    );
    expect(silenced.code).toBe(0);

    await writeFile(join(root, 'off/arm.json'), JSON.stringify({ plugin: 'none' }));
  });
});

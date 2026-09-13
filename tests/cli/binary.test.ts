import { describe, it, expect, beforeAll } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile, mkdir, access, cp, readFile, chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createReadStream } from 'node:fs';

/**
 * The built binary, exercised as a subprocess.
 *
 * Everything else in this suite imports the TypeScript directly, which leaves
 * the bundle, the argument parsing and the exit codes untested. That is the
 * shape of gap that let a parser incapable of reading JSX ship green: the
 * units were fine and the tool returned nothing.
 */
const binary = fileURLToPath(new URL('../../bin/uic.mjs', import.meta.url));
const fixture = fileURLToPath(new URL('../fixtures/e2e', import.meta.url));

interface Run {
  code: number;
  stdout: string;
  stderr: string;
}

function uic(args: string[], cwd: string, stdin?: string): Promise<Run> {
  return new Promise((done) => {
    const child = execFile(
      process.execPath,
      [binary, ...args],
      { cwd },
      (error, stdout, stderr) => {
        const code =
          error === null ? 0 : typeof error.code === 'number' ? error.code : Number(error.code ?? 1);
        done({ code, stdout, stderr });
      },
    );
    child.stdin?.end(stdin ?? '');
  });
}

beforeAll(async () => {
  // A missing bundle must fail loudly rather than quietly testing nothing.
  await access(binary).catch(() => {
    throw new Error(`${binary} is missing — run \`npm run build\` before the tests.`);
  });
});

describe('the built binary', () => {
  it('reports the fixture violations and exits 1', async () => {
    const run = await uic(['check', 'apps/orders/src/List.tsx'], fixture);
    expect(run.code).toBe(1);
    // ~~An import violation and a deprecated import.~~ **Both checks are gone
    // (#79, #81)**; the fixture trips the one check left, which is the
    // project's own written-down substitution.
    expect(run.stdout).toContain('apps/orders/src/List.tsx:3');
    expect(run.stdout).toContain('"Action grids" says to use ActionGrid');
  });

  it('exits 0 on a file with nothing to say about it', async () => {
    const run = await uic(['check', 'apps/orders/src/index.ts'], fixture);
    expect(run.code).toBe(0);
    expect(run.stdout.trim()).toBe('');
  });

  it('refuses an unknown option rather than guessing', async () => {
    const run = await uic(['check', '--within-layers', 'apps/orders/src/List.tsx'], fixture);
    expect(run.code).toBe(1);
    expect(run.stderr).toContain('Unknown option: --within-layers');
  });

  it('refuses an unknown subcommand', async () => {
    const run = await uic(['frobnicate'], fixture);
    expect(run.code).toBe(1);
    expect(run.stderr).toContain('Usage: uic <check|shapes|log>');
  });

  it('says what to do when given no files', async () => {
    const run = await uic(['check'], fixture);
    expect(run.code).toBe(1);
    expect(run.stderr).toContain('Usage: uic check [--list] <file...>');
  });

  describe('hook', () => {
    const payload = (over: Record<string, unknown> = {}): string =>
      JSON.stringify({
        hook_event_name: 'PostToolUse',
        tool_name: 'Edit',
        tool_input: { file_path: join(fixture, 'apps/orders/src/List.tsx') },
        cwd: fixture,
        ...over,
      });

    it('answers on stdout in the shape Claude Code reads back', async () => {
      const run = await uic(['hook'], fixture, payload());
      expect(run.code).toBe(0);

      const parsed = JSON.parse(run.stdout);
      expect(parsed.hookSpecificOutput.hookEventName).toBe('PostToolUse');
      expect(parsed.hookSpecificOutput.additionalContext).toContain(
        'ActionGrid',
      );
    });

    it('prints nothing at all for a clean file', async () => {
      const run = await uic(
        ['hook'],
        fixture,
        payload({ tool_input: { file_path: join(fixture, 'apps/orders/src/index.ts') } }),
      );
      expect(run.code).toBe(0);
      expect(run.stdout).toBe('');
    });

    it('exits 0 on rubbish input rather than interrupting the edit', async () => {
      for (const bad of ['', 'not json', '{}', '[]']) {
        const run = await uic(['hook'], fixture, bad);
        expect(run.code, bad).toBe(0);
        expect(run.stdout, bad).toBe('');
      }
    });
  });

});

describe('the queue the batch driver builds', () => {
  it('prints paths and nothing else', async () => {
    // The driver must not pull thirty files' findings into its own context —
    // accumulating them is the degradation the whole design avoids.
    const run = await uic(['check', '--list', 'apps/orders/src/List.tsx'], fixture);
    expect(run.code).toBe(1);
    expect(run.stdout.trim()).toBe('apps/orders/src/List.tsx');
    expect(run.stdout).not.toContain('is imported from');
  });

  it('names a file once, however many findings it has', async () => {
    const run = await uic(['check', '--list', 'apps/orders/src/List.tsx'], fixture);
    const lines = run.stdout.trim().split('\n').filter(Boolean);
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('prints nothing and exits 0 on a clean queue', async () => {
    const run = await uic(['check', '--list', 'packages/core/src/index.ts'], fixture);
    expect(run.code).toBe(0);
    expect(run.stdout.trim()).toBe('');
  });
});

describe('the built binary > an argument that names no file', () => {
  /**
   * The failure this guards is a CI line that is green forever.
   *
   * `uic check "src/**\/*.tsx"` is what a person copies into a pipeline. The
   * shell does not expand a quoted pattern, so it arrives as one literal
   * string, matches nothing, and used to check nothing and exit 0 (#144).
   */
  it('refuses a quoted glob instead of checking nothing and passing', async () => {
    const run = await uic(['check', 'src/**/*.tsx'], fixture);

    expect(run.code).toBe(1);
    expect(run.stderr).toContain('matched no file');
    expect(run.stderr).toContain('expanded by your shell');
  });

  it('refuses a directory instead of accepting and ignoring it', async () => {
    const run = await uic(['check', 'apps'], fixture);

    expect(run.code).toBe(1);
    expect(run.stderr).toContain('is a directory');
  });

  it('refuses a path that simply is not there', async () => {
    const run = await uic(['check', 'src/NoSuchScreen.tsx'], fixture);

    expect(run.code).toBe(1);
    expect(run.stderr).toContain('does not exist');
  });

  it('says the same about shapes, which takes files the same way', async () => {
    const run = await uic(['shapes', 'src/**/*.tsx'], fixture);

    expect(run.code).toBe(1);
    expect(run.stderr).toContain('matched no file');
  });
});

describe('the built binary > a repository with no package it can detect', () => {
  let workspace: string;

  beforeAll(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'uic-nodetect-'));
    await mkdir(join(workspace, 'src'), { recursive: true });
    await writeFile(
      join(workspace, 'src/W.tsx'),
      'export const W = () => (\n' +
        '  <div style={{ fontSize: 12, color: "#f00" }}>\n' +
        '    <span>🔔</span>\n' +
        '  </div>\n' +
        ');\n',
    );
  });

  /**
   * The case a fresh install is judged on.
   *
   * Nothing here names a package, so the import checks cannot run — and until
   * #166 that meant the whole file was skipped and the tool exited 0. A
   * repository it cannot read is exactly where it has to show it does
   * something, and this project has already been through one round of being
   * silent on every repository's first day.
   */
  /**
   * ~~It reported the raw values and the emoji.~~ **Since #79 those are a rule
   * and the program has nothing to say about this file** — no package, nothing
   * written down, so none of the four remaining checks can fire. That is the
   * trade #76 took knowingly, and it is exactly the case #37 exists for: the
   * answer must be *what was read and which checks could not run*, never an
   * empty stdout and exit 0.
   *
   * So what is asserted is the property this test was written for, which is
   * not about any particular finding: **a fresh install is not silent.**
   */
  it('says what it read and what could not run, rather than being silent', async () => {
    const run = await uic(['check', 'src/W.tsx'], workspace);

    // On stderr, where every coverage answer in this tool goes: stdout is for
    // findings, and there are none to print.
    expect(run.stderr).toContain('1 of 1 file(s) read');
    // ~~The import check could not run; a detection gap and not a clean
    // result.~~ **There is no chain to be missing (#81)**, so the honest
    // coverage answer is smaller and is the one this asserts: what was read,
    // and that the project has written nothing down for the one check left.
    expect(run.stderr).toContain('Nothing is written down');
    expect(run.stderr).toContain('the design rather than a fault');
  });

});

describe('the built binary > under a different name', () => {
  /**
   * The entry-point guard used to be `argv[1].endsWith('uic.mjs')`, so a copy
   * of the bundle under any other name exited 0 having done nothing (#189).
   *
   * Every other test in this file invokes `bin/uic.mjs` by its own path — the
   * one case that passed. This one copies it, which is what a wrapper, a
   * symlink or a CI step does.
   */
  it('still runs, because the guard tests identity and not a filename', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'uic-renamed-'));
    await writeFile(
      join(workspace, 'package.json'),
      JSON.stringify({ name: 'renamed', version: '1.0.0' }),
    );
    await writeFile(join(workspace, 'A.tsx'), 'export const A = () => <div />;\n');
    const copy = join(workspace, 'tools-check.mjs');
    await cp(binary, copy);

    // Driven through `check` since `scan` went with the package graph (#81).
    // What this asserts is the entry-point guard, not any command.
    const run = await new Promise<{ code: number; stdout: string; stderr: string }>((done) => {
      execFile(process.execPath, [copy, 'check', 'A.tsx'], { cwd: workspace }, (error, stdout, stderr) => {
        done({
          code: error === null ? 0 : Number((error as { code?: number }).code ?? 1),
          stdout,
          stderr,
        });
      });
    });

    expect(run.stderr).toContain('No findings');
    expect(run.code).toBe(0);

    await rm(workspace, { recursive: true, force: true });
  });

  /**
   * `argv[1]` is `-` when a script is piped in on stdin. Resolving that threw
   * out of the module's top level — a crash instead of silence, which is louder
   * and still wrong. Anything that is not a resolvable path is simply not the
   * entry point.
   */
  it('does not throw when argv[1] is not a resolvable path', async () => {
    const run = await new Promise<{ code: number; stderr: string }>((done) => {
      const child = execFile(
        process.execPath,
        ['-'],
        { cwd: fixture },
        (error, _stdout, stderr) => {
          done({
            code: error === null ? 0 : Number((error as { code?: number }).code ?? 1),
            stderr,
          });
        },
      );
      createReadStream(binary).pipe(child.stdin!);
    });

    expect(run.stderr).not.toContain('ENOENT');
    expect(run.code).toBe(0);
  });
});

/**
 * A run that reports nothing is either a clean project or a blind tool, and
 * from outside they look identical. On one real repository that was 400 screen
 * files reported as success in silence, with nothing looked at (#37) — the
 * failure `skills/reach` exists to prevent, happening inside the CLI.
 */
describe('what a check that found nothing says about itself', () => {
  const project = async (files: Record<string, string>): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), 'uic-cover-'));
    for (const [path, body] of Object.entries(files)) {
      await mkdir(dirname(join(dir, path)), { recursive: true });
      await writeFile(join(dir, path), body, 'utf8');
    }
    return dir;
  };

  it('says what it read rather than printing nothing', async () => {
    const dir = await project({
      'package.json': '{"name":"clean"}',
      'src/A.tsx': 'export const A = () => <Button sx={{ p: 2 }} />;\n',
    });

    const run = await uic(['check', 'src/A.tsx'], dir);

    expect(run.stdout.trim()).toBe('');
    expect(run.stderr).toContain('No findings. 1 of 1 file(s) read.');
    // ~~The style check saw this project's dialect and had nothing to say.~~ —
    // the style check is `rules/raw-values.md` now (#79) and a coverage report
    // has nothing truthful to say about whether an agent read a rule.
    expect(run.stderr).toContain('Nothing is written down');
    // And it is not called clean because it produced no findings.
    expect(run.stderr).not.toContain('clean');
    expect(run.code).toBe(0);

    await rm(dir, { recursive: true, force: true });
  });

  /**
   * ~~The one thing that is legitimately silent and must say so. Class- and
   * template-based systems are out of reach of a per-file AST check **by
   * construction**, which is a correct answer and a very different one from a
   * clean report.~~
   *
   * **The check whose reach this described is gone (#79)**, so there is no
   * longer a coverage sentence to assert. The limit itself is unchanged and is
   * stated in `rules/raw-values.md`, in the place the agent reads it — which is
   * where the rule can also say what to do about it, and a coverage line never
   * could. Asserted as text there rather than as behaviour here, because a
   * rule's content is all a rule has.
   */
  it('states its own limit in the rule, since no check speaks for it any more', async () => {
    const rule = await readFile(
      fileURLToPath(new URL('../../rules/raw-values.md', import.meta.url)),
      'utf8',
    );

    expect(rule).toContain('out of reach');
    expect(rule).toMatch(/Tailwind|CSS modules/u);
    expect(rule).toContain('not that the screen is clean');
  });

  /**
   * The analogue of what `diff` already does where none of the paths it was
   * given was a screen. A project no package was detected in is **not** this
   * case: every check needing no chain ran on every file, and failing those
   * would be the gate `CLAUDE.md` forbids.
   */
  it('exits non-zero where not one of the files could be read', async () => {
    const dir = await project({
      'package.json': '{"name":"gone"}',
      'src/B.tsx': 'export const B = () => <Button />;\n',
    });
    // Named and matched, and then not readable. A directory in its place is
    // refused earlier and by name, which is a different answer.
    await chmod(join(dir, 'src/B.tsx'), 0o000);

    const run = await uic(['check', 'src/B.tsx'], dir);
    await chmod(join(dir, 'src/B.tsx'), 0o600);

    expect(run.code).toBe(1);
    expect(run.stderr).toContain('None of them could be read');

    await rm(dir, { recursive: true, force: true });
  });

  it('a project that has written nothing down is told which checks that silences', async () => {
    const dir = await project({
      'package.json': '{"name":"quiet"}',
      'src/A.tsx': 'export const A = () => <Button />;\n',
    });

    const run = await uic(['check', 'src/A.tsx'], dir);

    expect(run.stderr).toContain('.ui-consistency/');
    expect(run.stderr).toContain('had nothing to apply');

    await rm(dir, { recursive: true, force: true });
  });
});

describe('an empty queue from the batch driver', () => {
  it('says on stderr why, and keeps stdout the queue', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'uic-list-'));
    await writeFile(join(dir, 'package.json'), '{"name":"q"}', 'utf8');
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src/A.tsx'), 'export const A = () => <Button />;\n', 'utf8');

    const run = await uic(['check', '--list', 'src/A.tsx'], dir);

    // The queue itself stays exactly as the driver reads it.
    expect(run.stdout.trim()).toBe('');
    expect(run.code).toBe(0);
    // And the reason is on the other stream.
    expect(run.stderr).toContain('No findings. 1 of 1 file(s) read.');

    await rm(dir, { recursive: true, force: true });
  });
});

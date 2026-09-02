import { describe, it, expect, beforeAll } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile, mkdir, access, cp } from 'node:fs/promises';
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
    expect(run.stdout).toContain('apps/orders/src/List.tsx:1');
    expect(run.stdout).toContain("→ import { Button } from '@fixture/core'");
    expect(run.stdout).toContain('LegacyButton is deprecated in @fixture/core.');
  });

  it('exits 0 on a file with nothing to say about it', async () => {
    const run = await uic(['check', 'apps/orders/src/index.ts'], fixture);
    expect(run.code).toBe(0);
    expect(run.stdout.trim()).toBe('');
  });

  it('includes own-layer findings only when asked', async () => {
    const dialog = 'packages/core/src/components/Dialog.tsx';
    expect((await uic(['check', dialog], fixture)).code).toBe(0);

    const asked = await uic(['check', '--within-layer', dialog], fixture);
    expect(asked.code).toBe(1);
    expect(asked.stdout).toContain("this file is in @fixture/core; use the layer's own Button.");
  });

  it('refuses an unknown option rather than guessing', async () => {
    const run = await uic(['check', '--within-layers', 'apps/orders/src/List.tsx'], fixture);
    expect(run.code).toBe(1);
    expect(run.stderr).toContain('Unknown option: --within-layers');
  });

  it('refuses an unknown subcommand', async () => {
    const run = await uic(['frobnicate'], fixture);
    expect(run.code).toBe(1);
    expect(run.stderr).toContain('Usage: uic <pattern|diff|place|scan|check|review|shapes|inventory|log>');
  });

  it('says what to do when given no files', async () => {
    const run = await uic(['check'], fixture);
    expect(run.code).toBe(1);
    expect(run.stderr).toContain('Usage: uic check [--within-layer] <file...>');
  });

  it('prints per-layer export counts on scan', async () => {
    const run = await uic(['scan'], fixture);
    expect(run.code).toBe(0);
    expect(run.stdout).toMatch(/@fixture\/core: 3 exports, 1 deprecated/);
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
        "→ import { Button } from '@fixture/core'",
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

  describe('scan', () => {
    let workspace: string;

    beforeAll(async () => {
      // A throwaway copy: init writes a file, and the shared fixture must not
      // gain one that later runs would then read as configuration.
      workspace = await mkdtemp(join(tmpdir(), 'uic-init-'));
      await mkdir(join(workspace, 'packages/core/src'), { recursive: true });
      await writeFile(
        join(workspace, 'package.json'),
        JSON.stringify({ name: 'root', private: true, workspaces: ['packages/*'] }),
      );
      await writeFile(
        join(workspace, 'packages/core/package.json'),
        JSON.stringify({ name: '@t/core', source: 'src/index.ts' }),
      );
      await writeFile(join(workspace, 'packages/core/src/index.ts'), 'export const A = 1;\n');
    });



    it('says so rather than writing anything when there is no project', async () => {
      const empty = await mkdtemp(join(tmpdir(), 'uic-empty-'));
      const run = await uic(['scan'], empty);
      expect(run.code).toBe(1);
      expect(run.stderr).toContain('No packages detected');
      await rm(empty, { recursive: true, force: true });
    });

    // There are two ways packages get found and a repository has no idea which
    // one applies to it. When the answer is "none", naming what was looked for
    // is the difference between a bug report and a user concluding the tool is
    // broken — which is how this defect was found in the first place.
    it('names the mechanism that found the packages', async () => {
      const run = await uic(['scan'], workspace);
      expect(run.stdout).toContain('package.json workspaces');
    });

    it('names the aliases when that is what found them', async () => {
      const aliased = await mkdtemp(join(tmpdir(), 'uic-alias-'));
      await cp(fileURLToPath(new URL('../fixtures/nx-ws', import.meta.url)), aliased, {
        recursive: true,
      });
      const run = await uic(['scan'], aliased);
      expect(run.stdout).toContain('tsconfig.base.json');
      expect(run.stdout).toContain('@fixture/core');
      await rm(aliased, { recursive: true, force: true });
    });

    it('names both mechanisms it looked for when it finds none', async () => {
      const empty = await mkdtemp(join(tmpdir(), 'uic-empty2-'));
      const run = await uic(['scan'], empty);
      expect(run.stderr).toContain('workspaces');
      expect(run.stderr).toContain('compilerOptions.paths');
      await rm(empty, { recursive: true, force: true });
    });
  });
});

describe('scan on a project with no workspace of any kind', () => {
  it('names the root manifest rather than trailing off', async () => {
    const solo = await mkdtemp(join(tmpdir(), 'uic-solo-'));
    await mkdir(join(solo, 'src'), { recursive: true });
    await writeFile(join(solo, 'package.json'), JSON.stringify({ name: 'solo', version: '1.0.0' }));
    await writeFile(join(solo, 'src/index.ts'), 'export const A = 1;\n');

    const run = await uic(['scan'], solo);
    expect(run.stdout).not.toMatch(/via\s*:/);
    expect(run.stdout).toContain('package.json');
    await rm(solo, { recursive: true, force: true });
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

describe('what a subagent is told about a file', () => {
  it('prints the file’s chain, nearest first', async () => {
    const run = await uic(['inventory', 'apps/orders/src/List.tsx'], fixture);
    expect(run.code).toBe(0);
    const chain = run.stdout
      .split('\n')
      .filter((line) => line.startsWith('#'))
      .map((line) => line.slice(1).trim());
    expect(chain.length).toBeGreaterThan(1);
    expect(chain[0]).toContain('orders');
  });

  it('prints what the layers on that chain export', async () => {
    const run = await uic(['inventory', 'apps/orders/src/List.tsx'], fixture);
    expect(run.stdout).toContain('Button');
  });

  it('leaves out the hundreds of layers that export nothing readable', async () => {
    // On Backstage one file's chain is 476 layers, of which 399 are external
    // packages with no source to read. Handing all of that to a subagent is
    // the context flood the whole driver exists to avoid.
    const run = await uic(['inventory', 'apps/orders/src/List.tsx'], fixture);
    expect(run.stdout).not.toContain('exports nothing');
    for (const line of run.stdout.split('\n').filter((l) => l.startsWith('#'))) {
      expect(line).not.toContain('react');
    }
  });

  it('is silent about a file on no chain, rather than failing', async () => {
    const run = await uic(['inventory', 'nowhere/X.tsx'], fixture);
    expect(run.code).toBe(0);
    expect(run.stdout.trim()).toBe('');
  });
});

describe('pattern takes its reference without a flag', () => {
  it('does not swallow the first argument when no --kind is given', async () => {
    // `args.indexOf('--kind')` is -1 with no flag, and `index !== at + 1` then
    // excludes index 0 — so the file was dropped and the command printed its
    // own usage. Found by running it against a real repository, not here.
    const dir = await mkdtemp(join(tmpdir(), 'uic-pattern-'));
    for (const name of ['One', 'Two', 'Three']) {
      await mkdir(join(dir, `pages/${name}`), { recursive: true });
      await writeFile(
        join(dir, `pages/${name}/${name}.tsx`),
        `export const P = () => (<PageLayout><PageHeader /><Content /></PageLayout>);\n`,
      );
    }

    const run = await uic(['pattern', 'pages/One/One.tsx'], dir);
    expect(run.stderr).not.toContain('Usage');
    expect(run.stdout).toContain('PageLayout');
    await rm(dir, { recursive: true, force: true });
  });
});

describe('a project with too few screens to derive anything', () => {
  /**
   * The commonest answer on a real project, and it used to be a dead end (#233).
   *
   * Two screens are a copy, not an agreement, so nothing can be derived — and
   * every new area and every new project starts here. The answer has to point
   * at what to do about it, or the honest half is all the user ever gets.
   */
  it('says so, and names where the deciding happens', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'uic-first-'));
    await writeFile(join(dir, 'package.json'), '{"name":"first"}', 'utf8');
    for (const name of ['One', 'Two']) {
      await mkdir(join(dir, 'pages'), { recursive: true });
      await writeFile(
        join(dir, `pages/${name}.tsx`),
        'export const P = () => (<PageLayout><PageHeader /></PageLayout>);\n',
        'utf8',
      );
    }

    const run = await uic(['pattern', 'pages/One.tsx'], dir);
    expect(run.stderr).toContain('fewer than three screens of this kind');
    expect(run.stderr).toContain('ui-consistency:decide');
    // Advice, never a gate: this is not a failure of anything.
    expect(run.code).toBe(0);
    await rm(dir, { recursive: true, force: true });
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
  it('still reports what needs no package, rather than exiting 0', async () => {
    const run = await uic(['check', 'src/W.tsx'], workspace);

    expect(run.code).toBe(1);
    expect(run.stdout).toContain('fontSize: 12 is a hardcoded value');
    expect(run.stdout).toContain("color: '#f00' is a hardcoded colour");
    expect(run.stdout).toContain('emoji used as an icon');
  });

  it('says which checks did not run, rather than that nothing was checked', async () => {
    const run = await uic(['check', 'src/W.tsx'], workspace);

    expect(run.stderr).toContain('The checks that read one — imports, deprecated usage — did not run.');
    expect(run.stderr).toContain('detection gap, not a clean result');
    expect(run.stderr).not.toContain('nothing was checked');
  });
});

describe('the three silences a user has to be able to tell apart', () => {
  /**
   * A user cannot tell "my project is clean" from "this tool is blind here"
   * (#234), and every command's silence looks the same as its success. The
   * whole repository is organised around those being different, so the answers
   * a reader is pointed at have to be **distinguishable** on the three shapes.
   *
   * One fixture per outcome, driven through the built binary. This is not a
   * test of the skill's prose — it is a test that the evidence the skill reads
   * says three different things.
   */
  const project = async (
    files: Record<string, string>,
  ): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), 'uic-reach-'));
    for (const [path, body] of Object.entries(files)) {
      await mkdir(dirname(join(dir, path)), { recursive: true });
      await writeFile(join(dir, path), body, 'utf8');
    }
    return dir;
  };

  const page = (name: string): string =>
    `export const ${name}Page = () => (<PageLayout title="x"><${name}Grid /></PageLayout>);\n`;

  it('works: the family and the route are both there, and it says what it read', async () => {
    const dir = await project({
      'package.json': '{"name":"works"}',
      'src/Routes.tsx': [
        "import { OrdersPage } from './pages/OrdersPage';",
        "import { InvoicesPage } from './pages/InvoicesPage';",
        "import { ReportsPage } from './pages/ReportsPage';",
        "export const routes = [{ path: 'orders', element: <OrdersPage /> },",
        "  { path: 'invoices', element: <InvoicesPage /> },",
        "  { path: 'reports', element: <ReportsPage /> }];",
      ].join('\n'),
      'src/pages/OrdersPage.tsx': page('Orders'),
      'src/pages/InvoicesPage.tsx': page('Invoices'),
      'src/pages/ReportsPage.tsx': page('Reports'),
    });

    const scanned = await uic(['scan'], dir);
    expect(scanned.stdout).toContain('Detected packages');

    const placed = await uic(['place', 'src/pages/OrdersPage.tsx'], dir);
    expect(placed.stdout).toContain('"declared"');

    const found = await uic(['pattern', 'src/pages/OrdersPage.tsx'], dir);
    expect(found.stdout).toContain('"holder": "PageLayout"');

    await rm(dir, { recursive: true, force: true });
  });

  it('stated nothing: too few screens of the kind, which is the design', async () => {
    const dir = await project({
      'package.json': '{"name":"quiet"}',
      'src/pages/OrdersPage.tsx': page('Orders'),
      'src/pages/InvoicesPage.tsx': page('Invoices'),
    });

    const found = await uic(['pattern', 'src/pages/OrdersPage.tsx'], dir);
    expect(found.stderr).toContain('fewer than three screens of this kind');
    // Distinguishable from the blind answer below, and it names what to do.
    expect(found.stderr).toContain('ui-consistency:decide');
    expect(found.code).toBe(0);

    await rm(dir, { recursive: true, force: true });
  });

  it('blind: nothing routes the screen, and it says that rather than a path', async () => {
    const dir = await project({
      'package.json': '{"name":"blind"}',
      'src/widgets/Chart.tsx': 'export const Chart = () => null;\n',
    });

    const placed = await uic(['place', 'src/widgets/Chart.tsx'], dir);
    expect(placed.stderr).toContain('Nothing routes');
    // Never a guessed path from the folder name, which would be the one answer
    // worse than silence.
    expect(placed.stdout).not.toContain('"path"');

    await rm(dir, { recursive: true, force: true });
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
    const copy = join(workspace, 'tools-check.mjs');
    await cp(binary, copy);

    const run = await new Promise<{ code: number; stdout: string }>((done) => {
      execFile(process.execPath, [copy, 'scan'], { cwd: workspace }, (error, stdout) => {
        done({
          code: error === null ? 0 : Number((error as { code?: number }).code ?? 1),
          stdout,
        });
      });
    });

    expect(run.stdout).toContain('Detected packages');
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

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
    expect(run.stdout).toContain('apps/orders/src/List.tsx:1');
    expect(run.stdout).toContain("→ import { Button } from '@fixture/core'");
    expect(run.stdout).toContain('LegacyButton is deprecated in @fixture/core.');
  });

  it('prints the tree of a screen, and exits 0 whatever it finds', async () => {
    // A fact supplier, never a gate: the exit code says the command ran, not
    // that the screen is good. Run against the shipped bundle because that is
    // where argument parsing and exit codes actually live.
    const root = await mkdtemp(join(tmpdir(), 'uic-tree-bin-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    await writeFile(
      join(root, 'src/OrdersPage.tsx'),
      "import { OrdersGrid } from './OrdersGrid';\n" +
        "import { Button } from '@acme/design';\n" +
        'export const OrdersPage = () => (\n  <PageLayout>\n    <OrdersGrid />\n' +
        '    <Button />\n  </PageLayout>\n);\n',
    );
    await writeFile(join(root, 'src/OrdersGrid.tsx'), 'export const OrdersGrid = () => <DataGrid />;\n');

    const run = await uic(['tree', 'src/OrdersPage.tsx'], root);

    expect(run.code).toBe(0);
    expect(run.stdout).toContain('2 levels');
    expect(run.stdout).toContain('OrdersGrid  src/OrdersGrid.tsx');
    // The whole point of the walk: what the screen file names is not what it is
    // made of, and the grid's own root is a level down.
    expect(run.stdout).toContain('DataGrid');
    expect(run.stdout).toContain('Button  (external)');
    await rm(root, { recursive: true, force: true });
  });

  it('groups screens that differ only in the name of their grid', async () => {
    // And reads every file it was given: the first path was being dropped by
    // the flag filter, which a fixture would not have shown.
    const root = await mkdtemp(join(tmpdir(), 'uic-group-bin-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    for (const grid of ['Orders', 'Invoices', 'Customers']) {
      await writeFile(
        join(root, `src/${grid}Page.tsx`),
        `export const P = () => (\n  <PageShell>\n    <FilterBar />\n    <${grid}Grid />\n  </PageShell>\n);\n`,
      );
    }

    const run = await uic(
      ['group', 'src/OrdersPage.tsx', 'src/InvoicesPage.tsx', 'src/CustomersPage.tsx'],
      root,
    );

    expect(run.code).toBe(0);
    expect(run.stdout).toContain('3 screens');
    expect(run.stdout).toContain('1 group');
    expect(run.stdout).toContain('*Grid');
    await rm(root, { recursive: true, force: true });
  });

  it('refuses a file that renders nothing rather than printing an empty tree', async () => {
    // An empty answer and "this is not a screen" are different facts, and the
    // second must not arrive as a clean-looking blank.
    const root = await mkdtemp(join(tmpdir(), 'uic-tree-none-'));
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    await writeFile(join(root, 'notes.ts'), 'export const x = 1;\n');

    const run = await uic(['tree', 'notes.ts'], root);

    expect(run.code).toBe(0);
    expect(run.stderr).toContain('Nothing to read');
    expect(run.stdout).toBe('');
    await rm(root, { recursive: true, force: true });
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
    expect(run.stderr).toContain('Usage: uic <place|tree|group|scan|check|shapes|inventory|log>');
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

  /**
   * ~~Is silent about a file on no chain, rather than failing.~~
   *
   * **Withdrawn (#37).** That was written as a courtesy and it is the exact
   * failure the tool is organised against: empty output with exit 0 says
   * *nothing to report* where the truth is *this file belongs to nothing I
   * detected*, and a user cannot tell those apart. On one real repository it
   * was 400 screen files reported as success without one of them being looked
   * at. It still prints no inventory — there is none — but it says why, and the
   * exit code no longer claims a result.
   */
  it('says a file on no chain belongs to no package, rather than nothing', async () => {
    const run = await uic(['inventory', 'nowhere/X.tsx'], fixture);

    expect(run.stdout.trim()).toBe('');
    expect(run.stderr).toContain('belongs to no detected package');
    expect(run.stderr).toContain('detection gap and not a clean result');
    expect(run.code).toBe(1);
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
    expect(run.stderr).toContain('the import check did not run');
    expect(run.stderr).toContain('detection gap, not a clean result');
    expect(run.stderr).toContain('Nothing is written down');
  });

  it('says which checks did not run, rather than that nothing was checked', async () => {
    const run = await uic(['check', 'src/W.tsx'], workspace);

    expect(run.stderr).toContain(
      'The checks that read one — the import check, and the layer half of substitutions — did not run.',
    );
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

  /**
   * A workspace package whose manifest names a **built** entry point — the file
   * the build emits, absent in the checkout this plugin runs in. The declared
   * entry was taken without looking, so the path answered nothing and the
   * conventional candidates beneath it were never tried. On one real React
   * monorepo that was 15 of 15 workspace packages: no chain readable anywhere,
   * so the three checks that need one could not fire at all (#70).
   */
  it('reads a package whose manifest names a built entry point that is not there', async () => {
    const dir = await project({
      'package.json': '{"name":"root","workspaces":["packages/*"]}',
      // `index.js` and `index.d.ts` are what the build emits. Neither exists.
      'packages/widgets/package.json': '{"name":"@ws/widgets","main":"./index.js","types":"./index.d.ts"}',
      'packages/widgets/src/index.ts':
        'export const Button = () => null;\n' +
        '/** @deprecated Use {@link Button} instead. */\n' +
        'export const OldButton = () => null;\n',
      'packages/app/package.json': '{"name":"@ws/app","dependencies":{"@ws/widgets":"*"}}',
      'packages/app/src/Page.tsx':
        'import { OldButton } from "@ws/widgets";\nexport const P = () => <OldButton />;\n',
    });

    const listed = await uic(['inventory', 'packages/app/src/Page.tsx'], dir);
    expect(listed.stdout).toContain('OldButton');
    expect(listed.stdout).toContain('@ws/widgets');

    // And the chain checks fire, which is the whole point: falling back is why
    // there are two detection mechanisms.
    const run = await uic(['check', 'packages/app/src/Page.tsx'], dir);
    expect(run.stdout).toContain('OldButton is deprecated');

    await rm(dir, { recursive: true, force: true });
  });

  /**
   * Coverage is paid for only where there are no findings, which leaves a hole
   * one level below the one #37 closed: a command that finds *something* said
   * nothing about which of its checks ran. 31 findings from four checks read as
   * a working tool while three were dead (#70).
   */
  it('says a chain check could not run even when another check found something', async () => {
    // The chainless check is a **stated page rule** since #79 — the style check
    // it used to be is `rules/raw-values.md` now. Which check speaks is not the
    // point; that one does, while the chain checks say they could not, is.
    const dir = await project({
      'package.json': '{"name":"root","workspaces":["packages/*"]}',
      // Nothing readable under any name: no entry, built or conventional.
      'packages/widgets/package.json': '{"name":"@ws/widgets","main":"./index.js"}',
      'packages/widgets/src/entry.ts': 'export const Button = () => null;\n',
      'packages/app/package.json': '{"name":"@ws/app","dependencies":{"@ws/widgets":"*"}}',
      '.ui-consistency/pages.md':
        '# Pages\n\n## Page structure\n\n' +
        'A page is `<PageLayout>` holding, in order: `<PageHeader>`, `<PageBody>`.\n',
      'packages/app/src/Page.tsx':
        'import { Button } from "@ws/widgets";\n' +
        'export const P = () => (\n  <PageLayout>\n    <PageBody><Button /></PageBody>\n' +
        '    <PageHeader />\n  </PageLayout>\n);\n',
    });

    const run = await uic(['check', 'packages/app/src/Page.tsx'], dir);

    // A check that needs no chain still found something…
    expect(run.stdout).toContain('"Page structure" says the order is header, content.');
    // …and the ones that need one say they did not run, rather than their
    // silence reading as a clean result.
    expect(run.stderr).toContain('did not run');
    expect(run.stderr).toContain('the import check');

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

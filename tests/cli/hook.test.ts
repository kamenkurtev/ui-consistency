import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { hookResponse } from '../../src/cli/hook.js';

const root = fileURLToPath(new URL('../fixtures/e2e', import.meta.url));
const offending = join(root, 'apps/orders/src/List.tsx');
const clean = join(root, 'apps/orders/src/index.ts');

const payload = (over: Record<string, unknown> = {}): string =>
  JSON.stringify({
    hook_event_name: 'PostToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: offending },
    cwd: root,
    ...over,
  });

describe('hookResponse', () => {
  it('returns the violations as additional context', async () => {
    const response = await hookResponse(payload());
    expect(response?.hookSpecificOutput.hookEventName).toBe('PostToolUse');
    const context = response?.hookSpecificOutput.additionalContext ?? '';
    expect(context).toContain("→ import { Button } from '@fixture/core'");
    expect(context).toContain('LegacyButton is deprecated');
  });

  it('says nothing at all when the file is clean', async () => {
    // Silence is the correct output for the overwhelming majority of edits.
    // A hook that speaks every time is a hook that gets turned off.
    expect(await hookResponse(payload({ tool_input: { file_path: clean } }))).toBeNull();
  });

  it('reports paths relative to the project, not the machine', async () => {
    const response = await hookResponse(payload());
    const context = response?.hookSpecificOutput.additionalContext ?? '';
    expect(context).toContain('apps/orders/src/List.tsx:1');
    expect(context).not.toContain(root);
  });

  it('leaves files it has nothing to say about alone', async () => {
    for (const file of ['README.md', 'styles.css', 'data.json', 'script.py']) {
      expect(await hookResponse(payload({ tool_input: { file_path: join(root, file) } }))).toBeNull();
    }
  });

  it('ignores tools that do not write files', async () => {
    expect(await hookResponse(payload({ tool_name: 'Read' }))).toBeNull();
    expect(await hookResponse(payload({ tool_name: 'Bash' }))).toBeNull();
  });

  it('handles every write tool, including the multi-edit one', async () => {
    for (const tool of ['Write', 'Edit', 'MultiEdit']) {
      const response = await hookResponse(payload({ tool_name: tool }));
      expect(response, tool).not.toBeNull();
    }
  });

  it('stays quiet rather than failing on input it cannot use', async () => {
    // Anything here that threw would surface as a hook error on the user's
    // edit. Being wrong about an edit is bad; interrupting one is worse.
    for (const bad of [
      '',
      'not json at all',
      '{}',
      '{"tool_name":"Edit"}',
      '{"tool_name":"Edit","tool_input":{}}',
      '{"tool_name":"Edit","tool_input":{"file_path":42}}',
      '{"tool_name":"Edit","tool_input":{"file_path":"/nowhere/x.tsx"}}',
      'null',
      '[]',
    ]) {
      expect(await hookResponse(bad), bad).toBeNull();
    }
  });

  it('falls back to the file when no working directory is given', async () => {
    // The project root is found from the file itself, so a payload without
    // `cwd` still works rather than silently checking nothing.
    const response = await hookResponse(payload({ cwd: undefined }));
    expect(response).not.toBeNull();
  });
});

describe('advisory context on a clean file', () => {
  it('is offered when the project has rules that bear on the file', async () => {
    const { adviseProject } = await import('../../src/cli/index.js');
    const root = await mkdtemp(join(tmpdir(), 'uic-advice-'));
    await mkdir(join(root, '.claude/ui-consistency'), { recursive: true });
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(
      join(root, '.claude/ui-consistency/detail-screens.md'),
      '# Detail screens\n\n## Detail screen archetype\n\nA detail screen is a routed page on `<DetailLayout>`.\n',
    );
    const file = join(root, 'src/OrderDetail.tsx');
    await writeFile(
      file,
      'export function OrderDetail() {\n  return <Dialog open><DetailHeader /></Dialog>;\n}\n',
    );

    const advice = await adviseProject(root, file);
    expect(advice).not.toBeNull();
    expect(advice!).toContain('Detail screen archetype');
    await rm(root, { recursive: true, force: true });
  });

  it('is null when the project has written no rules', async () => {
    const { adviseProject } = await import('../../src/cli/index.js');
    const root = await mkdtemp(join(tmpdir(), 'uic-advice-none-'));
    await mkdir(join(root, 'src'), { recursive: true });
    const file = join(root, 'src/OrderDetail.tsx');
    await writeFile(file, 'export const X = () => <Dialog open><A /></Dialog>;\n');

    expect(await adviseProject(root, file)).toBeNull();
    await rm(root, { recursive: true, force: true });
  });
});

describe('what the log records about an advisory', () => {
  it('does not read a component out of a curated rule as something the neighbours agreed', async () => {
    // The rule bodies are appended after the observation section, and a rule
    // whose Markdown holds a bullet like ``- `<Button variant="ghost">` …``
    // was logged as a component the neighbours were found to agree about. A
    // wrong entry in the log is worse than a missing one: the log is what is
    // read to answer "why did it not tell me".
    const advice = [
      '# What this file is (read from its code)',
      '- kind of screen: detail',
      '- layout: PageLayout > PageContent',
      '',
      '# How the screens beside it write those components (observed, not a rule)',
      '- `<PageContent scrollable class="flex-1">` — on 5 of the screens beside it',
      '',
      "# The project's own rules that bear on this file",
      '',
      '## Buttons',
      '- `<Button variant="ghost">` is for toolbars only.',
    ].join('\n');

    const { summariseAdvice } = await import('../../src/cli/hook.js');
    const summary = summariseAdvice(advice);
    expect(summary.observed).toEqual(['PageContent']);
    expect(summary.rules).toEqual(['Buttons']);
  });

  it('still records an observation whose support is reported as two numbers', async () => {
    const advice =
      '- `<Panel tone="quiet" class="flex-1">` — used on 10 of the screens beside it, written this way on 7';
    const { summariseAdvice } = await import('../../src/cli/hook.js');
    expect(summariseAdvice(advice).observed).toEqual(['Panel']);
  });
});

describe('what the hook says on an edit now', () => {
  const screen = (holder: string, header = 'PageHeader'): string =>
    `export const P = () => (\n  <${holder}>\n    <${header} />\n    <Content />\n  </${holder}>\n);\n`;

  const contract = {
    skeleton: { holder: 'PageLayout', regions: ['header', 'content'] },
    vocabulary: [{ role: 'header', component: 'PageHeader' }],
    configuration: [],
    particulars: { roles: [], components: [] },
    wiring: [],
    chrome: null,
    avoids: [],
    built: 'components',
    family: [],
    kind: 'list',
  };

  const project = async (): Promise<string> => {
    const root = await mkdtemp(join(tmpdir(), 'uic-hook-contract-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    const { contractPathFor } = await import('../../src/cli/log.js');
    const path = contractPathFor(root, 'list');
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, JSON.stringify(contract));
    return root;
  };

  it('names what has left the contract somebody approved', async () => {
    // The one thing worth saying on an edit: not an opinion about what a screen
    // usually looks like, but a fact about an artefact a person accepted.
    //
    // The screen is of the contract's kind — it sits in the holder — and departs
    // inside it. Measuring one that sits somewhere else against this contract is
    // what #3 withdrew.
    const root = await project();
    const file = join(root, 'src/Orders.tsx');
    await writeFile(file, screen('PageLayout', 'Banner'));

    const response = await hookResponse(
      JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: file }, cwd: root }),
    );

    expect(response?.hookSpecificOutput.additionalContext).toContain('has no header');
    await rm(root, { recursive: true, force: true });
  });

  it('says nothing about a screen of a kind the only contract is not for (#3)', async () => {
    // Saving one contract is `skills/pattern` step 2, so this is the state every
    // project is in on its first day with the tool. Before the save the dialog
    // was silent; the save is the only thing that changed, and it must stay
    // silent — the alternative is every dialog, panel and tile in the repository
    // told it should be a page, in the approved imperative.
    const root = await project();
    await mkdir(join(root, 'src/pages'), { recursive: true });
    await mkdir(join(root, 'src/parts'), { recursive: true });
    for (const name of ['Orders', 'Invoices', 'Customers']) {
      await writeFile(join(root, `src/pages/${name}.tsx`), screen('PageLayout'));
    }
    const file = join(root, 'src/parts/ConfirmDialog.tsx');
    await writeFile(file, screen('Dialog', 'DialogButtons'));

    const response = await hookResponse(
      JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: file }, cwd: root }),
    );

    expect(response).toBeNull();
    await rm(root, { recursive: true, force: true });
  });

  it('says nothing about a screen that matches it', async () => {
    const root = await project();
    const file = join(root, 'src/Orders.tsx');
    await writeFile(file, screen('PageLayout'));

    const response = await hookResponse(
      JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: file }, cwd: root }),
    );

    expect(response).toBeNull();
    await rm(root, { recursive: true, force: true });
  });

  it('says nothing about a screen that matches the ones beside it', async () => {
    // ~1 KB of observation on every settled edit was injected here once and
    // ignored — the failure recorded as P4 — and the answer was to say nothing
    // at all without an approved contract. That went too far (#231): it left
    // the pattern half reachable only by running a command per kind. What is
    // injected now is a *deviation* and only when there is one, so a screen
    // written like its siblings is still silent, which is the property that
    // mattered.
    const root = await mkdtemp(join(tmpdir(), 'uic-hook-bare-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    for (const name of ['A', 'B', 'C']) {
      await writeFile(join(root, `src/${name}.tsx`), screen('PageLayout'));
    }

    const response = await hookResponse(
      JSON.stringify({
        tool_name: 'Edit',
        tool_input: { file_path: join(root, 'src/A.tsx') },
        cwd: root,
      }),
    );

    expect(response).toBeNull();
    await rm(root, { recursive: true, force: true });
  });
});

/**
 * Nobody has to run anything for the tool to know what a kind of screen looks
 * like here (#231).
 *
 * The pattern half used to reach a project only if somebody ran a command per
 * kind and saved the result — which nobody was going to do thirty times, so on
 * a project that had written nothing down the tool was 93% an import checker.
 * The facts are derived on the edit already being made, and said to be derived.
 */
describe('what the hook derives when nobody has approved anything', () => {
  const page = (name: string, testId: boolean): string =>
    `export const ${name}Page = () => (\n  <PageLayout title="${name}" ${
      testId ? `dataTestId="acme-${name.toLowerCase()}-page" ` : ''
    }scrollable={false}>\n    <${name}Grid />\n  </PageLayout>\n);\n`;

  const family = async (testIdOnTarget: boolean): Promise<{ root: string; file: string }> => {
    const root = await mkdtemp(join(tmpdir(), 'uic-hook-derived-'));
    await mkdir(join(root, 'src/pages'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"app"}');
    for (const name of ['Invoices', 'Customers', 'Reports']) {
      await writeFile(join(root, `src/pages/${name}Page.tsx`), page(name, true));
    }
    const file = join(root, 'src/pages/OrdersPage.tsx');
    await writeFile(file, page('Orders', testIdOnTarget));
    return { root, file };
  };

  const ask = (root: string, file: string): Promise<unknown> =>
    hookResponse(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: file }, cwd: root }));

  it('names the deviation with no command run and nothing saved', async () => {
    const { root, file } = await family(false);

    const response = (await ask(root, file)) as {
      hookSpecificOutput: { additionalContext: string };
    } | null;
    const context = response?.hookSpecificOutput.additionalContext ?? '';

    expect(context).toContain('without dataTestId, which every screen of this kind writes');
    await rm(root, { recursive: true, force: true });
  });

  it('says it derived it, and that it fails nothing', async () => {
    // Approval belongs at the one place derived material can fail something —
    // a person putting `uic diff --contract` in a build gate. Here it cannot,
    // and the wording must not imply somebody signed this.
    const { root, file } = await family(false);

    const response = (await ask(root, file)) as {
      hookSpecificOutput: { additionalContext: string };
    } | null;
    const context = response?.hookSpecificOutput.additionalContext ?? '';

    expect(context).toContain('derived just now');
    expect(context).toContain('nobody approved it');
    expect(context).toContain('fails nothing');
    expect(context).not.toContain('has left the contract');
    // Where the family came from is part of the sentence (#255): these four
    // screens are what the folder holds, and saying so is what lets an agent
    // judge the family rather than take the claim on trust.
    expect(context).toContain('files in its folder');
    expect(context).toContain('InvoicesPage.tsx');
    await rm(root, { recursive: true, force: true });
  });

  it('is silent about a screen written like its siblings', async () => {
    const { root, file } = await family(true);

    expect(await ask(root, file)).toBeNull();
    await rm(root, { recursive: true, force: true });
  });
});

/**
 * The hook speaks about the edit; the log keeps the file (#256).
 *
 * Every check ran over the whole file and everything found was injected with
 * *"Fix them in this turn."*, so an agent editing line 40 for one reason was
 * told to fix line 121 for another. Obeying means unrelated churn in an
 * unrelated change, so a disciplined agent skips it — and every such event
 * teaches that the hook's imperative is skippable, which is P4 reproduced.
 *
 * The dogfood log's only finding from real work was a `fontSize` on a line
 * written a year before the edit that triggered it. It was ignored, and the
 * ignore was correct scope discipline.
 */
describe('which findings the hook interrupts for', () => {
  const OLD_LINE = "    <span style={{ color: '#ff0000' }}>written a year ago</span>";

  const project = async (): Promise<{ root: string; file: string }> => {
    const root = await mkdtemp(join(tmpdir(), 'uic-scope-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"scope"}');
    const file = join(root, 'src/Widget.tsx');
    await writeFile(
      file,
      [
        'export const Widget = () => (',
        '  <div>',
        OLD_LINE,
        '    <p>the line the edit touched!</p>',
        '  </div>',
        ');',
      ].join('\n'),
    );
    return { root, file };
  };

  const ask = (root: string, file: string, input: Record<string, unknown>): Promise<unknown> =>
    hookResponse(
      JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: file, ...input }, cwd: root }),
    );

  it('says nothing about a line the edit never touched', async () => {
    const { root, file } = await project();

    const response = await ask(root, file, {
      old_string: '<p>the line the edit touched</p>',
      new_string: '<p>the line the edit touched!</p>',
    });

    expect(response).toBeNull();
    await rm(root, { recursive: true, force: true });
  });

  it('still reports what the edit itself wrote', async () => {
    const { root, file } = await project();

    const response = (await ask(root, file, {
      old_string: 'old',
      new_string: OLD_LINE,
    })) as { hookSpecificOutput: { additionalContext: string } } | null;

    expect(response?.hookSpecificOutput.additionalContext).toContain('#ff0000');
    await rm(root, { recursive: true, force: true });
  });

  it('logs the whole file even where it says nothing', async () => {
    // The record keeps the whole truth; only the interruption is narrowed.
    const { root, file } = await project();
    await ask(root, file, {
      old_string: '<p>the line the edit touched</p>',
      new_string: '<p>the line the edit touched!</p>',
    });

    const { readLog } = await import('../../src/cli/log.js');
    const entries = await readLog(root);
    expect(entries.some((one) => one.message.includes('#ff0000'))).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it('says everything about a Write, since all of it is new', async () => {
    const { root, file } = await project();

    const response = (await hookResponse(
      JSON.stringify({ tool_name: 'Write', tool_input: { file_path: file }, cwd: root }),
    )) as { hookSpecificOutput: { additionalContext: string } } | null;

    expect(response?.hookSpecificOutput.additionalContext).toContain('#ff0000');
    await rm(root, { recursive: true, force: true });
  });

  it('takes the union of a MultiEdit’s hunks', async () => {
    const { root, file } = await project();

    const response = (await hookResponse(
      JSON.stringify({
        tool_name: 'MultiEdit',
        tool_input: {
          file_path: file,
          edits: [
            { old_string: 'a', new_string: '<div>' },
            { old_string: 'b', new_string: OLD_LINE },
          ],
        },
        cwd: root,
      }),
    )) as { hookSpecificOutput: { additionalContext: string } } | null;

    expect(response?.hookSpecificOutput.additionalContext).toContain('#ff0000');
    await rm(root, { recursive: true, force: true });
  });

  it('says everything when it cannot locate what was written', async () => {
    // Narrowing is only allowed where it is sure. A payload that locates
    // nothing must never turn into a silence.
    const { root, file } = await project();

    const response = await ask(root, file, {
      old_string: 'x',
      new_string: 'text that is nowhere in the file',
    });

    expect(response).not.toBeNull();
    await rm(root, { recursive: true, force: true });
  });
});

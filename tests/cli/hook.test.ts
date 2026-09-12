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

/**
 * ~~Advisory context on a clean file; what the log records about an advisory;
 * what the hook says on an edit now; what the hook derives when nobody has
 * approved anything.~~
 *
 * **Four blocks, and the channel all four tested is gone (#77).** The hook no
 * longer derives a pattern on the edit being made, nor measures the file
 * against an approved contract, nor assembles evidence for a second opinion —
 * that work is `ui-consistency:pattern`, reached before the write rather than
 * after it. What is left below is what the hook still does: report the
 * deterministic checks, about the lines the edit wrote, and log the rest.
 */
describe('which findings the hook interrupts for', () => {
  // ~~A style literal.~~ **Observed through a curated substitution rule since
  // #79**, the style check having become `rules/raw-values.md`. What is
  // asserted here is which *lines* the hook speaks about, which is not about
  // any one check — so the observable moved and the property did not. The
  // template path is what carries a per-line finding needing no package chain,
  // which is what the old observable had going for it.
  const OLD_LINE = '  <app-legacy-grid>written a year ago</app-legacy-grid>';

  const project = async (): Promise<{ root: string; file: string }> => {
    const root = await mkdtemp(join(tmpdir(), 'uic-scope-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await mkdir(join(root, '.ui-consistency'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"name":"scope"}');
    await writeFile(
      join(root, '.ui-consistency/pages.md'),
      [
        '# Pages',
        '',
        '## Action grids',
        '',
        'A page of actions uses `<app-action-grid>`, never a raw `<app-legacy-grid>`.',
        '',
      ].join('\n'),
    );
    const file = join(root, 'src/widget.component.html');
    await writeFile(
      file,
      ['<div>', OLD_LINE, '  <p>the line the edit touched!</p>', '</div>'].join('\n'),
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

    expect(response?.hookSpecificOutput.additionalContext).toContain('app-legacy-grid');
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
    expect(entries.some((one) => one.message.includes('app-legacy-grid'))).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it('says everything about a Write, since all of it is new', async () => {
    const { root, file } = await project();

    const response = (await hookResponse(
      JSON.stringify({ tool_name: 'Write', tool_input: { file_path: file }, cwd: root }),
    )) as { hookSpecificOutput: { additionalContext: string } } | null;

    expect(response?.hookSpecificOutput.additionalContext).toContain('app-legacy-grid');
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

    expect(response?.hookSpecificOutput.additionalContext).toContain('app-legacy-grid');
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

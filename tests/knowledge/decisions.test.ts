import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readDecisions } from '../../src/knowledge/decisions.js';

let root: string;

const decisions = async (name: string, body: string): Promise<void> => {
  const dir = join(root, '.claude/ui-consistency/decisions');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), body, 'utf8');
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-decisions-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('the decisions a project has written down', () => {
  it('is nothing at all for a project that has written none', async () => {
    expect(await readDecisions(root)).toEqual([]);
  });

  it('reads the canonical screen a kind points at', async () => {
    await mkdir(join(root, 'src/orders'), { recursive: true });
    await writeFile(join(root, 'src/orders/Detail.tsx'), 'export const D = () => null;\n', 'utf8');
    await decisions(
      'detail.md',
      ['# Detail screens', '', 'canon: src/orders/Detail.tsx', '', '- The breadcrumb comes from the route, not the title.'].join(
        '\n',
      ),
    );

    const [detail] = await readDecisions(root);
    expect(detail?.kind).toBe('detail');
    expect(detail?.canon).toBe(join(root, 'src/orders/Detail.tsx'));
    expect(detail?.statements).toEqual(['The breadcrumb comes from the route, not the title.']);
  });

  it('says when the canon it points at is gone', async () => {
    // The one staleness a decisions file can have, and it is mechanical: the
    // file it names either exists or it does not. Checked at the moment the
    // decision is used, so it cannot rot unnoticed.
    await decisions('detail.md', ['# Detail', '', 'canon: src/orders/Gone.tsx'].join('\n'));

    const [detail] = await readDecisions(root);
    expect(detail?.canon).toBeNull();
    expect(detail?.stale).toContain('src/orders/Gone.tsx');
  });

  it('keeps statements that cannot be derived from the code at all', async () => {
    // The whole reason anything is stored. Extraction can say what repeats; it
    // cannot say which of two competing patterns the team is moving towards,
    // because the older one is always the more common.
    await decisions(
      'list.md',
      [
        '# List screens',
        '',
        '- We are migrating from `@acme/legacy` to `@acme/ui`; prefer `@acme/ui`.',
        '- An empty state is required.',
      ].join('\n'),
    );

    const [list] = await readDecisions(root);
    expect(list?.statements).toHaveLength(2);
    expect(list?.canon).toBeNull();
    expect(list?.stale).toBeNull();
  });

  it('ignores prose that is neither a pointer nor a statement', async () => {
    await decisions(
      'detail.md',
      ['# Detail screens', '', 'Some background nobody has to act on.', '', '- Do this.'].join('\n'),
    );

    expect((await readDecisions(root))[0]?.statements).toEqual(['Do this.']);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { groupScreens } from '../../src/sources/grouping.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-group-'));
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(join(root, 'package.json'), '{"name":"app"}');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const write = async (name: string, source: string): Promise<string> => {
  const path = join(root, `src/${name}.tsx`);
  await writeFile(path, source);
  return path;
};

const listScreen = (grid: string): string =>
  `export const P = () => (\n  <PageShell>\n    <FilterBar />\n    <${grid} />\n  </PageShell>\n);\n`;

describe('screens grouped by what they are composed of', () => {
  it('puts screens that differ only in the name of their grid in one group', async () => {
    // The whole difficulty: grouping by the names as written gives one group per
    // screen, because the grid is called `OrdersGrid` in one file and
    // `InvoicesGrid` in the next.
    const files = [
      await write('A', listScreen('OrdersGrid')),
      await write('B', listScreen('InvoicesGrid')),
      await write('C', listScreen('CustomersGrid')),
    ];

    const grouped = await groupScreens(root, files, 1);

    expect(grouped.groups).toHaveLength(1);
    expect(grouped.groups[0]!.members).toHaveLength(3);
    expect(grouped.groups[0]!.signature).toEqual(['PageShell', '  FilterBar', '  *Grid']);
  });

  it('keeps a name more than one screen renders, and abstracts one only it renders', async () => {
    // The abstraction is derived from the set in hand and from nothing else.
    // `FilterBar` survives because three screens write it; each grid does not.
    const files = [
      await write('A', listScreen('OrdersGrid')),
      await write('B', listScreen('InvoicesGrid')),
    ];

    const grouped = await groupScreens(root, files, 1);

    expect(grouped.groups[0]!.signature).toContain('  FilterBar');
  });

  it('falls back to <one> where the singletons share no trailing word', async () => {
    const files = [
      await write('A', 'export const P = () => (\n  <Shell>\n    <Alpha />\n  </Shell>\n);\n'),
      await write('B', 'export const P = () => (\n  <Shell>\n    <Beta />\n  </Shell>\n);\n'),
    ];

    const grouped = await groupScreens(root, files, 1);

    expect(grouped.groups).toHaveLength(1);
    expect(grouped.groups[0]!.signature).toEqual(['Shell', '  <one>']);
  });

  it('shows a group of one as it is written', async () => {
    // The placeholders exist to merge screens whose middles differ. A group that
    // merged nothing has nothing to hide behind them, and `<one>` above `<one>`
    // tells a reader less than what the file actually says.
    //
    // A group of one still has to *be* a group: it shares `PageShell` with the
    // other two and nothing else. A screen sharing nothing at all is ungrouped
    // now, which is the case below this one.
    const files = [
      await write('A', listScreen('OrdersGrid')),
      await write('B', listScreen('InvoicesGrid')),
      await write(
        'D',
        'export const P = () => (\n  <PageShell>\n    <SummaryBand />\n  </PageShell>\n);\n',
      ),
    ];

    const grouped = await groupScreens(root, files, 1);

    const alone = grouped.groups.find((one) => one.members.length === 1);
    expect(alone?.signature).toEqual(['PageShell', '  SummaryBand']);
  });

  it('does not make a group out of screens that share nothing', async () => {
    // Measured on a real repository: seven unrelated screens, each rendering one
    // component nobody else renders, every name became `<one>` and the
    // signatures matched — reported as one pattern, and the largest entry after
    // the real one. Over-splitting sends a reader to look at two entries; this
    // asserted a pattern that does not exist.
    const files = [
      await write('A', 'export const P = () => <Alpha />;\n'),
      await write('B', 'export const P = () => <Beta />;\n'),
      await write('C', 'export const P = () => <Gamma />;\n'),
    ];

    const grouped = await groupScreens(root, files, 1);

    expect(grouped.groups).toEqual([]);
    expect(grouped.ungrouped).toHaveLength(3);
  });

  it('still groups on a shared trailing word, which is weaker evidence and is evidence', async () => {
    const files = [
      await write('A', 'export const P = () => <AlphaGrid />;\n'),
      await write('B', 'export const P = () => <BetaGrid />;\n'),
    ];

    const grouped = await groupScreens(root, files, 1);

    expect(grouped.ungrouped).toEqual([]);
    expect(grouped.groups[0]!.signature).toEqual(['*Grid']);
  });

  it('names a file that is not a screen rather than dropping it', async () => {
    const files = [
      await write('A', listScreen('OrdersGrid')),
      await write('notes', 'export const x = 1;\n'),
    ];

    const grouped = await groupScreens(root, files, 1);

    expect(grouped.notScreens).toEqual(['src/notes.tsx']);
  });
});

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

/**
 * First run on a real React monorepo: 11 files answered **9 groups**, and on a
 * second, 14 files answered 10. The fragmentation had two causes and neither
 * was a project's conventions (#32).
 */
describe('what uic group counts, and what it folds', () => {
  /** A holder and the components it holds directly, as a screen writes them. */
  const held = (holder: string, children: string[]): string =>
    `export const P = () => (\n  <${holder}>\n${children
      .map((one) => `    <${one} />`)
      .join('\n')}\n  </${holder}>\n);\n`;

  it('does not count a file whose name says what it is', async () => {
    const a = await write('A', held('FeaturedPage', ['Header']));
    const b = await write('B', held('FeaturedPage', ['Header']));
    const c = await write('C', held('FeaturedPage', ['Header']));
    // A helper exporting a navigation link was given its own group.
    const helper = await write('nav.helpers', 'export const L = () => <div><Link /></div>;\n');

    const grouped = await groupScreens(root, [a, b, c, helper]);

    expect(grouped.notScreens).toContain('src/nav.helpers.tsx');
    expect(grouped.groups.flatMap((one) => one.members)).not.toContain('src/nav.helpers.tsx');
    expect(grouped.given).toBe(4);
  });

  /**
   * A grid component and a row renderer are parts of a screen, and nothing but
   * their names says so. That another file in the set imports them is
   * structural — the same rule the family search obeys.
   */
  it('does not count a file another of the given files imports', async () => {
    const a = await write(
      'A',
      "import { OrderTotalRow } from './OrderTotalRow';\n" +
        held('FeaturedPage', ['Header', 'OrderTotalRow']),
    );
    const row = await write('OrderTotalRow', held('Box', ['Cell']));
    const b = await write('B', held('FeaturedPage', ['Header']));

    const grouped = await groupScreens(root, [a, row, b]);

    expect(grouped.notScreens).toContain('src/OrderTotalRow.tsx');
  });

  /**
   * `FeaturedPage > Header` and the same plus a footer were two groups of two,
   * where a person would call them one pattern with an optional footer.
   */
  it('folds a group that differs only by an element some members render', async () => {
    const a = await write('A', held('FeaturedPage', ['Header']));
    const b = await write('B', held('FeaturedPage', ['Header', 'Footer']));
    const c = await write('C', held('FeaturedPage', ['Header', 'Footer']));

    const grouped = await groupScreens(root, [a, b, c]);

    expect(grouped.groups.length).toBe(1);
    expect(grouped.groups[0]?.members.length).toBe(3);
    // The optional line carries the strength, the same *N of M* the props
    // matrix prints — so a folded group claims no more agreement than it has.
    expect(grouped.groups[0]?.signature.join('\n')).toContain('Footer  2 of 3');
  });

  /**
   * The fold takes the **smallest** difference. Sorted by length the longest
   * host matches first, so a screen differing by one optional footer was folded
   * into an unrelated group that merely rendered more — two patterns reported
   * as one, which is worse than the over-splitting the fold exists to fix.
   */
  it('does not fold into a host that merely renders more', async () => {
    const a = await write('A', held('FeaturedPage', ['Header']));
    const b = await write('B', held('FeaturedPage', ['Header', 'Footer']));
    const c = await write('C', held('FeaturedPage', ['Header', 'Footer']));
    const d = await write('D', held('FeaturedPage', ['Header', 'Wide', 'Deep', 'Extra']));

    const grouped = await groupScreens(root, [a, b, c, d]);

    const withA = grouped.groups.find((one) => one.members.includes('src/A.tsx'));
    expect(withA?.members).toContain('src/B.tsx');
    expect(withA?.members).not.toContain('src/D.tsx');
  });
});

describe('a signature that carries no shape', () => {
  /**
   * The largest "pattern" in a real 1 955-file monorepo was `div`, at 27
   * screens — ranked above a modal with a header, content and footer at 7 of 8
   * and a page holder with an optional footer at 2 of 7, which are what this
   * command exists to find (#58).
   *
   * A tree of one node carries no holder-and-child relationship, no order and
   * no role. It is the same non-answer as a signature made entirely of
   * placeholders, arriving by a different route — and the optional-group fold
   * makes it worse, because one node is a subsequence of very nearly
   * everything, so it attracts members instead of being absorbed.
   */
  it('does not report a one-node signature as a group', async () => {
    // The shape the real repository had, and it takes two files to build: a
    // leaf whose whole output is one component, whose own output is raw
    // elements. A file rendering only `<div />` never reaches grouping at all —
    // it is already *not a screen* — so that cannot be the fixture, and the
    // rule is about the shape rather than about the spelling of the node.
    await write('Dot', 'export const Dot = () => (\n  <div>\n    <svg />\n  </div>\n);\n');
    const leaf = `import { Dot } from './Dot';\nexport const P = () => <Dot />;\n`;
    const files = [
      await write('IconA', leaf),
      await write('IconB', leaf),
      await write('IconC', leaf),
      // And a real pattern beside them, which must survive and must rank above.
      await write('PageA', listScreen('OrdersGrid')),
      await write('PageB', listScreen('InvoicesGrid')),
    ];

    const grouped = await groupScreens(root, files, 2);

    // The three leaves are named as having no shape, not grouped.
    expect(grouped.shapeless).toHaveLength(3);
    expect(grouped.shapeless.join(' ')).toContain('IconA');
    for (const one of grouped.groups) {
      expect(one.signature.length, 'a group with a one-line signature').toBeGreaterThan(1);
    }
    // And the real pattern is still there, and is now the largest.
    expect(grouped.groups[0]?.members).toHaveLength(2);
    expect(grouped.groups[0]?.signature.join(' ')).toContain('PageShell');
  });

  /**
   * One generic name is the same non-answer as one raw element: what made `div`
   * wrong is the shape, not the spelling, and a rule that only excluded raw
   * elements would be a hardcoded vocabulary — which nothing here may have.
   */
  it('applies to a component name as much as to a raw element', async () => {
    const files = [
      await write('ProviderA', 'export const P = () => <Provider />;\n'),
      await write('ProviderB', 'export const P = () => <Provider />;\n'),
    ];

    const grouped = await groupScreens(root, files, 1);

    expect(grouped.groups).toHaveLength(0);
    expect(grouped.shapeless).toHaveLength(2);
  });

  /** Never silently dropped: every file given comes back in exactly one bucket. */
  it('accounts for every file it was given', async () => {
    const files = [
      await write('IconA', 'export const P = () => <Provider />;\n'),
      await write('PageA', listScreen('OrdersGrid')),
      await write('PageB', listScreen('InvoicesGrid')),
      await write('notes.helpers', 'export const x = 1;\n'),
    ];

    const grouped = await groupScreens(root, files, 1);

    const accounted =
      grouped.groups.reduce((count, one) => count + one.members.length, 0) +
      grouped.ungrouped.length +
      grouped.shapeless.length +
      grouped.notScreens.length;
    expect(accounted).toBe(grouped.given);
    expect(grouped.given).toBe(4);
  });
});

describe('what counts as a part, and how far the chain reaches', () => {
  /**
   * The chain broke at the first import not written relatively (#62).
   *
   * `importedBy` resolves `./Grid` and returns null for everything else, which
   * is right for the family search — a screen's own parts sit beside it — and
   * wrong here. On the monorepo shape this plugin is built for, a screen
   * renders components imported by package name or through a `tsconfig` alias,
   * so the chain ended at that import and every component below it survived as
   * a screen of its own. Two comparable React monorepos then disagreed by a
   * factor of three about what proportion of their files were screens: 224 of
   * 1 606 against 833 of 1 955.
   */
  it('excludes a part imported through a tsconfig alias, not only a relative one', async () => {
    await writeFile(
      join(root, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@app/ui/*': ['src/ui/*'] } } }),
    );
    await mkdir(join(root, 'src/ui'), { recursive: true });
    await mkdir(join(root, 'src/pages'), { recursive: true });

    const at = async (name: string, source: string): Promise<string> => {
      const path = join(root, `src/${name}.tsx`);
      await writeFile(path, source);
      return path;
    };

    // `Grid` has to render a **component**, or it is excluded as *not a screen*
    // whatever the import rule does — which is what made the first version of
    // this test pass against the unfixed code.
    await at('ui/Dot', 'export const Dot = () => (\n  <div>\n    <svg />\n  </div>\n);\n');
    const grid = await at(
      'ui/Grid',
      'import { Dot } from "./Dot";\nexport const Grid = () => (\n  <table>\n    <Dot />\n  </table>\n);\n',
    );
    const shell = await at('ui/Shell', 'export const Shell = (p: any) => <section {...p} />;\n');
    const screen = (name: string): Promise<string> =>
      at(
        `pages/${name}`,
        'import { Shell } from "@app/ui/Shell";\nimport { Grid } from "@app/ui/Grid";\n' +
          'export const P = () => (\n  <Shell>\n    <Grid />\n  </Shell>\n);\n',
      );

    const files = [await screen('OrdersPage'), await screen('InvoicesPage'), await screen('CustomersPage'), grid, shell];

    const grouped = await groupScreens(root, files, 2);

    // Both parts are parts, whichever way the specifier was written.
    expect(grouped.notScreens.join(' ')).toContain('Grid');
    expect(grouped.notScreens.join(' ')).toContain('Shell');
    // And neither leaks into the screen count or into a group of its own.
    expect(grouped.ungrouped).toEqual([]);
    expect(grouped.groups).toHaveLength(1);
    expect(grouped.groups[0]!.members).toHaveLength(3);
  });

  /**
   * ~~The family search must keep its old reach. It is bounded by relative
   * imports deliberately — a page and its grid are one screen, and a component
   * the whole workspace shares is not that page's own business.~~
   *
   * **The family search is gone (#77)**, so there is no second caller to keep
   * apart from this one. What survives is `specifiersOf`, which resolves
   * nothing and leaves resolution to its caller — asserted by the cases above,
   * which are about `uic group` following a specifier written as a package name
   * or through a `tsconfig` alias (#62). That was the half this case existed to
   * protect from the other one.
   */
});

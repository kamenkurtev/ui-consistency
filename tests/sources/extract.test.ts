import { describe, it, expect } from 'vitest';
import { rawMarkupOf, shapeOf } from '../../src/sources/extract.js';

/**
 * The order matters because a caller truncates it.
 *
 * `buildAdvice` takes the first `MAX_RAW` to tell the agent what a screen is
 * made of. `walk` is a stack and returns siblings in reverse document order, so
 * unsorted that description named the elements at the *end* of the file,
 * backwards — the opposite of "enough to recognise the screen" (#161).
 */
describe('the raw markup a screen renders', () => {
  const page =
    'export const P = () => (' +
    '<div><table><tbody /></table><span /><p /><h1 /><h2 /><ul /><li /><img /><section /><nav /></div>' +
    ');';

  it('comes back in the order the file writes it', () => {
    expect(rawMarkupOf(page)).toEqual([
      'div',
      'table',
      'tbody',
      'span',
      'p',
      'h1',
      'h2',
      'ul',
      'li',
      'img',
      'section',
      'nav',
    ]);
  });

  it('places a repeated element where it first appears, not where it last does', () => {
    const twice =
      'export const P = () => (<div><span /><p /><h1 /><span /></div>);';

    expect(rawMarkupOf(twice)).toEqual(['div', 'span', 'p', 'h1']);
  });

  it('reads a template in its own order too', () => {
    const angular = '<div><table><tbody></tbody></table><span></span><nav></nav></div>';

    expect(rawMarkupOf(angular, 'angular')).toEqual(['div', 'table', 'tbody', 'span', 'nav']);
  });

  it('is null for a file that renders nothing', () => {
    expect(rawMarkupOf('export const total = 1 + 1;')).toBeNull();
  });
});

/**
 * The kind of screen, without a vendor's spelling (#226).
 *
 * `archetypeOf` decided what a screen was from hardcoded component names —
 * `Table|DataGrid|DataTable|List|VirtualList` and two more lists like it. On a
 * real React monorepo of 20 sampled pages, 12 of the 13 that produced an
 * advisory reported *"not readable from the code"*; the repository's most
 * frequent element is `<CoreGridV…>` and its grids are `CustomerInvoicesGrid`,
 * `ServiceAccountsGrid`, `DeliveryNotesGrid`. Not one starts with a name on the list.
 *
 * `pattern.ts` had already abandoned it and said why: screens of one kind are
 * the ones that sit in the same holder, which is structural and needs no
 * vocabulary.
 */
describe('what kind of screen this is', () => {
  const page = (grid: string): string => `
export const OrdersPage = () => (
  <PageLayout title="x" scrollable={false}>
    <${grid} rows={rows} />
  </PageLayout>
);
`;

  it('is the holder, so a vendor renaming one component changes nothing', () => {
    // The screen does not change. Only the spelling of one component does, and
    // that used to flip the answer between `list` and `not readable`.
    expect(shapeOf(page('OrdersGrid'))?.holder).toBe('PageLayout');
    expect(shapeOf(page('DataGrid'))?.holder).toBe('PageLayout');
  });

  it('is null where no holder can be read, rather than a guess', () => {
    expect(shapeOf('export const A = () => null;\n')).toBeNull();
  });
});

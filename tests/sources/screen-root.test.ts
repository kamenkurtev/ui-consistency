import { describe, it, expect } from 'vitest';
import { shapeOf } from '../../src/sources/extract.js';
import { regionsOf } from '../../src/sources/regions.js';

/** The shape that broke all three: a small helper declared above the screen. */
const withHelper = (screen: string): string =>
  `const Row = ({ x }) => <TableRow><TableCell>{x}</TableCell></TableRow>;\n\n${screen}`;

const dialog = `
export function OrderDetail() {
  return (
    <Dialog open>
      <DetailHeader title="Order" />
    </Dialog>
  );
}`;

const page = `
export function OrdersPage() {
  return (
    <PageLayout>
      <PageHeader title="Orders" />
      <Content><DataGrid /></Content>
    </PageLayout>
  );
}`;

describe('all three readings agree on which element is the screen', () => {
  it('the holder is the screen’s, not a helper’s', () => {
    // A single helper above the page flipped the old archetype reading from
    // `dialog` to `list`, and the wrong answer went straight into the advisory
    // context. That reading is gone (#226) and the kind is now the holder —
    // which has to survive the same helper.
    expect(shapeOf(withHelper(dialog))!.holder).toBe('Dialog');
    expect(shapeOf(dialog)!.holder).toBe('Dialog');
  });

  it('the pattern is the screen’s, not a helper’s', () => {
    expect(shapeOf(withHelper(page))!.pattern[0]).toBe('PageLayout');
  });

  it('the regions are the screen’s, as they already were', () => {
    expect(regionsOf(withHelper(page))!.holder).toBe('PageLayout');
  });

  it('they agree with each other on the same file', () => {
    const source = withHelper(page);
    expect(shapeOf(source)!.pattern[0]).toBe(regionsOf(source)!.holder);
  });

  it('a file that is only helpers still reads as something', () => {
    // No screen to find is not an error; the largest thing in the file is
    // what there is.
    const only = 'const Row = ({ x }) => <TableRow><TableCell>{x}</TableCell></TableRow>;\n';
    expect(shapeOf(only)!.pattern[0]).toBe('TableRow');
  });
});

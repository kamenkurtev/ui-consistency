import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { propsMatrix } from '../../src/sources/matrix.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-matrix-'));
  await mkdir(join(root, 'src'), { recursive: true });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const screen = async (name: string, grid: string): Promise<string> => {
  const path = join(root, `src/${name}.tsx`);
  await writeFile(path, `export const P = () => (\n  <PageShell>\n    ${grid}\n  </PageShell>\n);\n`);
  return path;
};

describe('which props a set of files writes on one component', () => {
  it('separates what they all write from where they diverge, and names who is missing', async () => {
    // The measured case: six sibling screens agree on thirteen props and then
    // one of them leaves `density` off, so its rows are a different height from
    // every other table in the product.
    const files = [
      await screen('A', '<OrdersGrid columns={c} rows={r} density="compact" />'),
      await screen('B', '<OrdersGrid columns={c} rows={r} density="compact" />'),
      await screen('C', '<OrdersGrid columns={c} rows={r} />'),
    ];

    const matrix = await propsMatrix(root, 'OrdersGrid', files);

    expect(matrix.renders).toHaveLength(3);
    expect(matrix.rows.find((row) => row.name === 'columns')?.written).toHaveLength(3);
    const density = matrix.rows.find((row) => row.name === 'density');
    expect(density?.written).toEqual(['src/A.tsx', 'src/B.tsx']);
    expect(density?.value).toBe('compact');
  });

  it('counts a test id, which the whole family writes and nothing could see', async () => {
    // `data-*` was filtered as noise, and half of that was right: the *value* of
    // a test id is an artefact of the page. That one is written at all is a
    // convention teams have — 190 of 209 dialog usages — and the screen that
    // forgot it was the one thing the family agreed about that nothing reported.
    const files = [
      await screen('A', '<OrdersGrid data-testid="orders-grid" />'),
      await screen('B', '<OrdersGrid data-testid="invoices-grid" />'),
      await screen('C', '<OrdersGrid />'),
    ];

    const matrix = await propsMatrix(root, 'OrdersGrid', files);

    const testId = matrix.rows.find((row) => row.name === 'data-testid');
    expect(testId?.written).toEqual(['src/A.tsx', 'src/B.tsx']);
    // Written by both and written differently by both: presence is the fact,
    // the value is not a convention here and is not claimed to be one.
    expect(testId?.value).toBeNull();
  });

  it('lists the files that do not render it rather than leaving them out', async () => {
    // A file that renders nothing of the component is not a file that writes no
    // props on it, and a count over the wrong denominator is the whole finding
    // wrong.
    const files = [
      await screen('A', '<OrdersGrid rows={r} />'),
      await screen('B', '<Nothing />'),
    ];

    const matrix = await propsMatrix(root, 'OrdersGrid', files);

    expect(matrix.renders).toEqual(['src/A.tsx']);
    expect(matrix.absent).toEqual(['src/B.tsx']);
  });

  it('reads an Angular screen through its template, not its class', async () => {
    // The `.component.ts` has no markup, and answering nothing there is
    // indistinguishable from a screen that writes no props.
    await writeFile(
      join(root, 'src/orders.component.ts'),
      "@Component({ selector: 'app-orders', templateUrl: './orders.component.html' })\n" +
        'export class OrdersComponent {}\n',
    );
    await writeFile(
      join(root, 'src/orders.component.html'),
      '<app-orders-grid density="compact"></app-orders-grid>\n',
    );

    const matrix = await propsMatrix(root, 'app-orders-grid', [
      join(root, 'src/orders.component.ts'),
    ]);

    expect(matrix.renders).toEqual(['src/orders.component.ts']);
    expect(matrix.rows.find((row) => row.name === 'density')?.value).toBe('compact');
  });
});

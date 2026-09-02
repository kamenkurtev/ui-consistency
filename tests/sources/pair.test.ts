import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { markupOf, pairOf } from '../../src/sources/pair.js';

let root: string;

const file = async (path: string, body: string): Promise<string> => {
  const full = join(root, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, body, 'utf8');
  return full;
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-pair-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const CLASS = [
  "import { Component } from '@angular/core';",
  "@Component({ selector: 'app-orders', templateUrl: './orders.component.html' })",
  'export class OrdersComponent {}',
].join('\n');

/**
 * A screen is a pair, and either half resolves to the same screen (#229).
 *
 * On a real Angular monorepo — 179 components, 176 templates — every command
 * above the layer check produced nothing, because the `.ts` had no markup to
 * compare and the `.html` had no identity beyond its own tags.
 */
describe('a screen written as two files', () => {
  it('resolves from the class to the template beside it', async () => {
    const cls = await file('src/app/orders/orders.component.ts', CLASS);
    const html = await file('src/app/orders/orders.component.html', '<mat-card></mat-card>\n');

    expect(await pairOf(cls)).toEqual({ identity: cls, markup: html, inline: null });
  });

  it('resolves from the template back to the same screen', async () => {
    const cls = await file('src/app/orders/orders.component.ts', CLASS);
    const html = await file('src/app/orders/orders.component.html', '<mat-card></mat-card>\n');

    expect(await pairOf(html)).toEqual({ identity: cls, markup: html, inline: null });
  });

  it('reads markup written inside the class', async () => {
    const cls = await file(
      'src/app/orders/orders.component.ts',
      [
        "import { Component } from '@angular/core';",
        '@Component({',
        "  selector: 'app-orders',",
        '  template: `<mat-card><app-orders-grid></app-orders-grid></mat-card>`,',
        '})',
        'export class OrdersComponent {}',
      ].join('\n'),
    );

    const pair = await pairOf(cls);
    expect(pair?.markup).toBeNull();
    expect(pair?.inline).toContain('<app-orders-grid>');
    expect((await markupOf(cls, '')).source).toContain('<mat-card>');
  });

  it('is not a screen when the class carries neither', async () => {
    const cls = await file(
      'src/app/orders/orders.component.ts',
      "import { Component } from '@angular/core';\n@Component({ selector: 'app-orders' })\nexport class OrdersComponent {}\n",
    );
    expect(await pairOf(cls)).toBeNull();
  });

  it('is not a screen when the class is not decorated', async () => {
    // A file named like one is not one. The decorator is what makes it a screen.
    const cls = await file('src/app/orders/orders.component.ts', 'export class OrdersComponent {}\n');
    expect(await pairOf(cls)).toBeNull();
  });

  it('leaves a template nothing claims alone', async () => {
    const html = await file('src/app/orders/partial.html', '<div></div>\n');
    expect(await pairOf(html)).toBeNull();
  });

  it('leaves a single-file dialect alone', async () => {
    const jsx = await file('src/pages/Orders.tsx', 'export const P = () => null;\n');
    expect(await pairOf(jsx)).toBeNull();
    expect(await markupOf(jsx, 'source')).toEqual({ path: jsx, source: 'source' });
  });

  it('hands back the template’s own text and path, for the parser to dispatch on', async () => {
    const cls = await file('src/app/orders/orders.component.ts', CLASS);
    const html = await file('src/app/orders/orders.component.html', '<mat-card>x</mat-card>\n');

    expect(await markupOf(cls, '')).toEqual({ path: html, source: '<mat-card>x</mat-card>\n' });
  });
});

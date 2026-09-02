import { describe, it, expect } from 'vitest';
import { exportedSymbolsFromSource } from '../../src/inventory/exports.js';

describe('exportedSymbolsFromSource', () => {
  it('reads named export declarations', () => {
    const symbols = exportedSymbolsFromSource(`
      export const Button = () => null;
      export function Card() { return null; }
      export class Table {}
    `);
    expect([...symbols].sort()).toEqual(['Button', 'Card', 'Table']);
  });

  it('reads export lists', () => {
    const symbols = exportedSymbolsFromSource(`
      const Button = () => null;
      const Card = () => null;
      export { Button, Card };
    `);
    expect([...symbols].sort()).toEqual(['Button', 'Card']);
  });

  it('reads re-exports and honours renaming', () => {
    const symbols = exportedSymbolsFromSource(`
      export { Button as AcmeButton } from 'some-ui-lib';
    `);
    expect([...symbols]).toEqual(['AcmeButton']);
  });

  it('ignores default exports, which have no importable name', () => {
    const symbols = exportedSymbolsFromSource(`export default function Page() {}`);
    expect([...symbols]).toEqual([]);
  });

  it('reads exports from TSX with generics', () => {
    const symbols = exportedSymbolsFromSource(`
      export const Table = <T,>(props: { rows: T[] }) => null;
    `);
    expect([...symbols]).toEqual(['Table']);
  });

  it('returns nothing for unparseable input rather than throwing', () => {
    expect([...exportedSymbolsFromSource('const = = =')]).toEqual([]);
  });
});

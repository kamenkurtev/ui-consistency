import { describe, it, expect } from 'vitest';
import { deprecationsFromSource } from '../../src/inventory/deprecated.js';

describe('deprecationsFromSource', () => {
  it('finds a deprecated symbol and its {@link} replacement', () => {
    const found = deprecationsFromSource(`
      /** @deprecated use {@link NewButton} instead */
      export const OldButton = () => null;
    `);
    expect(found.get('OldButton')).toBe('NewButton');
  });

  it('records a deprecated symbol with no replacement as null', () => {
    const found = deprecationsFromSource(`
      /** @deprecated do not use */
      export const OldButton = () => null;
    `);
    expect(found.has('OldButton')).toBe(true);
    expect(found.get('OldButton')).toBeNull();
  });

  it('does not report symbols with no @deprecated tag', () => {
    const found = deprecationsFromSource(`
      /** A perfectly good button. */
      export const Button = () => null;
    `);
    expect(found.has('Button')).toBe(false);
  });

  it('handles deprecated function and class declarations', () => {
    const found = deprecationsFromSource(`
      /** @deprecated use {@link Card} */
      export function Panel() { return null; }

      /** @deprecated use {@link DataGrid} */
      export class Table {}
    `);
    expect(found.get('Panel')).toBe('Card');
    expect(found.get('Table')).toBe('DataGrid');
  });

  it('handles a multi-line JSDoc block', () => {
    const found = deprecationsFromSource(`
      /**
       * The old button.
       *
       * @deprecated use {@link NewButton} instead
       */
      export const OldButton = () => null;
    `);
    expect(found.get('OldButton')).toBe('NewButton');
  });

  it('does not attach a comment separated from the export by other code', () => {
    const found = deprecationsFromSource(`
      /** @deprecated use {@link NewButton} */
      const internal = 1;

      export const Button = () => null;
    `);
    expect(found.has('Button')).toBe(false);
  });

  it('ignores a line comment mentioning deprecated', () => {
    const found = deprecationsFromSource(`
      // @deprecated use {@link NewButton}
      export const Button = () => null;
    `);
    expect(found.has('Button')).toBe(false);
  });

  it('reports nothing for unparseable input', () => {
    expect(deprecationsFromSource('const = = =').size).toBe(0);
  });
});

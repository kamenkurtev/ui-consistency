import { describe, it, expect } from 'vitest';
import { parseModule } from '../../src/parse/parse.js';
import { exportedSymbolsFromSource } from '../../src/inventory/exports.js';

/**
 * A decorated class is every Angular component (#253).
 *
 * The parser ran with `plugins: ['typescript', 'jsx']` and no decorators
 * plugin, so a decorated class was a syntax error, `parseModule` returned
 * `null`, and **every module-level reading of the file returned nothing** —
 * `src/sources/pair.ts` says as much about what a `.component.ts` is, and the
 * one line above it made the file unreadable.
 *
 * Measured before the fix, on a package whose one component file is decorated:
 * `2 exports, 1 deprecated` against `4 exports, 2 deprecated` for the identical
 * file with the decorator removed. The inventory is what the import and
 * deprecated checks are built on, so v1's whole subject was blind to Angular —
 * wider than the routing case the issue established, and silent, which is why
 * nothing reported it.
 */
describe('a decorated class', () => {
  const ANGULAR = [
    "import { Component, Input } from '@angular/core';",
    "@Component({ selector: 'app-reporting', templateUrl: './reporting.component.html' })",
    'export class ReportingComponent {',
    '  @Input() value = 1;',
    '  constructor(@Inject(TOKEN) private readonly service: Service) {}',
    '}',
  ].join('\n');

  it('parses, decorator and all', () => {
    expect(parseModule(ANGULAR, 'reporting.component.ts')).not.toBeNull();
  });

  it('gives up its exported name, which is what a route entry names', () => {
    expect([...exportedSymbolsFromSource(ANGULAR)]).toEqual(['ReportingComponent']);
  });

  it('reads a parameter decorator, which only the legacy spelling allows', () => {
    // `['decorators', {…}]` — the current proposal — rejects `constructor(@Inject(T) x)`
    // outright. The two spellings are not interchangeable and cannot both be
    // enabled: Babel refuses the pair.
    expect(parseModule('class A { constructor(@Inject(T) private x: string) {} }')).not.toBeNull();
  });

  it('reads the current proposal too, which the legacy spelling rejects', () => {
    // Rare, and it costs nothing: the second attempt only runs where the first
    // failed, which is where the answer used to be `null` anyway.
    expect(parseModule('class A { @logged accessor value = 1; }')).not.toBeNull();
  });

  it('still refuses a file that is genuinely broken', () => {
    // `errorRecovery` stays off. A partially recovered AST can carry a
    // truncated import list, and a false positive costs more than a miss.
    expect(parseModule('export const = ;')).toBeNull();
  });
});

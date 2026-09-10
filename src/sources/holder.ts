import { readFile } from 'node:fs/promises';
import { markupOf, pairOf } from './pair.js';
import { regionsOf } from './regions.js';
import { templateKind } from '../parse/template.js';

/**
 * The holder a screen sits in, or null where nothing readable holds it.
 *
 * **The kind of a screen is its holder** — structural, and the reason the
 * archetype classifier was deleted: a project's grids are called
 * `CustomerInvoicesGrid`, so a list of names said *not readable from the code*
 * about 12 of 13 real pages.
 *
 * Either half of a pair answers, which is why this is not two lines: on Angular
 * the markup is in a sibling `.html` and reading the `.component.ts` alone
 * finds no elements at all.
 *
 * Shared because three surfaces ask it — `uic patterns <screen>`, the refresh,
 * and the MCP `pattern` tool — and `tests/core/duplicates.test.ts` caught the
 * third copy the hour it was written.
 */
export async function holderOf(screen: string): Promise<string | null> {
  const pair = await pairOf(screen);
  const identity = pair?.identity ?? screen;
  const own = await readFile(identity, 'utf8').catch(() => null);
  if (own === null) return null;
  const markup = pair === null ? { path: screen, source: own } : await markupOf(identity, own);
  if (markup === null) return null;
  return regionsOf(markup.source, templateKind(markup.path) ?? undefined)?.holder ?? null;
}

import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { findProjectRoot } from '../layers/detect.js';
import { shapeOf } from './extract.js';
import { MAJORITY, MAX_FAMILY, QUORUM, siblingScreens } from './siblings.js';
import type { SourceModel, SourceOfTruth } from './adapter.js';
import { templateKind } from '../parse/template.js';
import { markupOf, pairOf } from './pair.js';

/**
 * Screens, in every dialect the hook accepts.
 *
 * JSX alone until #251, which is a gate *earlier* than the one that issue
 * named: a `.html`, `.vue` or `.svelte` sibling was not even a candidate, so
 * this whole source was absent on every template dialect however well the
 * readers below coped. `usage.ts` has read all four since it was written, and
 * these two modules walk the same families.
 */
const CHECKABLE = /\.(?:[jt]sx|html|vue|svelte)$/;
/** The half of a pair that carries the identity, whose markup is elsewhere (#229). */
const PAIRED = /\.component\.[jt]s$/;
/** Fixtures and stories, in the same dialects — anchored to `[jt]sx` missed three. */
const GENERATED = /\.(?:test|spec|stories|story)\.(?:[jt]sx?|html|vue|svelte)$/;

/**
 * How many siblings must agree before their agreement means anything.
 *
 * Two files can match by accident, or because one was copied from the other.
 * Three is the smallest number that is a pattern rather than a coincidence,
 * and this source is ranked last precisely because that is still thin.
 */

export function neighbourSource(): SourceOfTruth {
  return {
    kind: 'neighbours',
    async describe(target: string): Promise<SourceModel | null> {
      // The same walk `observeUsage` uses. This source used to read only the
      // file's own directory, which in a router-shaped project means it read
      // nothing that could ever reach quorum: in the Next.js app router every
      // screen is `page.tsx` alone with its layout, forever, by design. On a
      // real app-router repository that was 0 of 14 screens.
      const root = await findProjectRoot(dirname(target));
      const family = await siblingScreens(target, {
        ...(root === null ? {} : { root }),
        isScreen: (name) => (CHECKABLE.test(name) || PAIRED.test(name)) && !GENERATED.test(name),
        maxSiblings: MAX_FAMILY,
        quorum: QUORUM,
      });
      const siblings = family.screens;
      if (siblings.length < QUORUM) return null;

      const seen = new Map<string, number>();
      const patterns: string[][] = [];
      const holders = new Map<string, number>();
      let read = 0;

      const seenPairs = new Set<string>();
      for (const path of siblings) {
        const own = await readFile(path, 'utf8').catch(() => null);
        if (own === null) continue;

        // A screen may be written as a pair, and its markup then lives in the
        // other half (#229). Both halves are candidates, so it is counted once.
        const pair = await pairOf(path).catch(() => null);
        if (pair !== null && seenPairs.has(pair.identity)) continue;
        if (pair !== null) seenPairs.add(pair.identity);
        const markup = pair === null ? { path, source: own } : await markupOf(pair.identity, own);

        // Dispatched on the dialect, as every other reader here does. Without
        // it a `.vue` or `.html` sibling went down the JSX path, returned null
        // and was dropped *before* `read` counted it — so the quorum four lines
        // down was never reached and this whole source was absent on every
        // template dialect (#251).
        const shape = shapeOf(markup.source, templateKind(markup.path) ?? undefined);
        if (shape === null) continue;
        read++;
        for (const component of new Set(shape.components)) {
          seen.set(component, (seen.get(component) ?? 0) + 1);
        }
        if (shape.pattern.length > 0) patterns.push(shape.pattern);
        if (shape.holder !== null) holders.set(shape.holder, (holders.get(shape.holder) ?? 0) + 1);
      }

      if (read < QUORUM) return null;

      const components = [...seen.entries()]
        .filter(([, count]) => count / read >= MAJORITY)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);
      if (components.length === 0) return null;

      // The commonest opening chain, and only when most siblings share it.
      const counted = new Map<string, number>();
      for (const pattern of patterns) {
        const key = pattern.join('>');
        counted.set(key, (counted.get(key) ?? 0) + 1);
      }
      const [best] = [...counted.entries()].sort((a, b) => b[1] - a[1]);
      const pattern = best !== undefined && best[1] / read >= MAJORITY ? best[0].split('>') : [];

      // What kind of screen the files next door are, when they agree — which is
      // what holds them. Read from the structure and never from a list of
      // component names, because such a list came back `unknown` on every real
      // repository (#226). Like everything else here it is a heuristic.
      const [commonest] = [...holders.entries()].sort((a, b) => b[1] - a[1]);
      const holder =
        commonest !== undefined && commonest[1] / read >= MAJORITY ? commonest[0] : undefined;

      return {
        kind: 'neighbours',
        components,
        pattern,
        ...(holder === undefined ? {} : { holder }),
        // Never prop conventions. What the siblings pass is what happens to be
        // there, and a value repeated by copy-paste is not a rule — this is
        // exactly the inference the project refuses to make.
        props: {},
        heuristic: true,
      };
    },
  };
}

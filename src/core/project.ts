import { readFile } from 'node:fs/promises';

import { cachedPackages } from '../layers/cache.js';
import { readConfig, applyConfig } from '../layers/config.js';
import { resolveChain } from '../layers/chain.js';
import { cachedInventory } from '../inventory/cache.js';
import { checkSource } from './check.js';
import { runEngine } from './engine.js';
import { parseKnowledge } from '../knowledge/parse.js';
import { knowledgeDir } from '../knowledge/paths.js';
import type { Finding, Inventory, Layer, Violation } from '../types.js';

/**
 * The core over a set of files, with no surface attached.
 *
 * These three were in `src/cli/index.ts`, which made every other adapter that
 * wanted them import the CLI. Static cycles esbuild resolves; a **dynamic**
 * import into one does not settle, and the MCP server exited 13 with
 * *"unsettled top-level await"* from the shipped bundle before this was pulled
 * apart (#33). They were always core rather than CLI — nothing here prints,
 * which is also what makes them safe to call from a stdio server, where a
 * stray `console.log` corrupts the protocol stream.
 *
 * `src/cli/index.ts` re-exports all three, so every existing caller and every
 * test that imports them from there is unaffected.
 */

export interface CheckOptions {
  /**
   * Include findings whose expected layer is the file's own.
   *
   * Off by default. On a real repository this class was 94 of 253 findings and
   * mostly noise — a design system's own components reaching for the headless
   * primitives they are built from, which is what that layer is for. The
   * findings are still produced, so an audit can ask for them.
   */
  withinLayer?: boolean;
}

/**
 * One inventory per chain, for the length of a run.
 *
 * A batch of thirty files in one package resolves to the same chain thirty
 * times, and building the inventory reads and parses every barrel on it. Both
 * `checkProject` and `analyzeProject` need this and each had its own copy.
 */
function inventoryReader(rootDir: string): (chain: Layer[]) => Promise<Inventory> {
  const inventories = new Map<string, Inventory>();
  return async (chain) => {
    const key = chain.map((layer) => layer.name).join('>');
    let inventory = inventories.get(key);
    if (inventory === undefined) {
      inventory = await cachedInventory(rootDir, chain);
      inventories.set(key, inventory);
    }
    return inventory;
  };
}

/**
 * Check the given files against the project's own layer chain.
 *
 * Files in the same package share a chain and therefore an inventory, so it is
 * built once per distinct chain rather than once per file, and kept on disk
 * between runs against the mtimes of everything it was built from.
 *
 * What counts as a violation is the check's business; which violations are
 * worth showing is policy, and lives here.
 */
export async function checkProject(
  rootDir: string,
  files: string[],
  options: CheckOptions = {},
): Promise<Violation[]> {
  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  if (packages.length === 0) return [];
  const prefer = config?.prefer ?? [];

  const inventoryFor = inventoryReader(rootDir);

  const violations: Violation[] = [];
  for (const file of files) {
    const chain = resolveChain(file, packages, prefer);
    if (chain.length === 0) continue;

    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null) continue;

    violations.push(...checkSource(file, source, chain, await inventoryFor(chain)));
  }

  if (options.withinLayer === true) return violations;
  return violations.filter((violation) => violation.withinOwnLayer !== true);
}

/**
 * Every check v2 has, over the given files.
 *
 * The same shape as {@link checkProject}, which stays as it was: v1's import
 * check is one of the things this runs, not something it replaces.
 *
 * Tier 2 is not started here. It needs a model client and a budget, which is
 * #26 — until then the engine is offered no reviewer and stays silent about
 * everything it cannot prove.
 */
export async function analyzeProject(
  rootDir: string,
  files: string[],
  options: CheckOptions = {},
): Promise<Finding[]> {
  const config = await readConfig(rootDir);
  // No early return on an empty package set, for the reason given at the loop
  // below: most of what Tier 1 checks does not need one (#166).
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const prefer = config?.prefer ?? [];

  // Read once for the whole run: a batch of thirty files in one package would
  // otherwise re-read and re-parse the same Markdown thirty times.
  const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir);

  const inventoryFor = inventoryReader(rootDir);

  const findings: Finding[] = [];
  for (const file of files) {
    // No skip on an empty chain. Only two checks read one — imports and the
    // layer half of substitutions — and they return nothing without it on
    // their own. A stated page rule and a written-down substitution need no
    // package to have been detected at all.
    //
    // Skipping was already wrong for templates, and the comment that used to
    // sit here said so: requiring a chain kept an Angular repository silent
    // even after its templates could be read. The same argument applies to a
    // `.tsx` outside every detected package, and a repository the tool cannot
    // otherwise read is exactly where a fresh install has to show it does
    // something (#166).
    const chain = resolveChain(file, packages, prefer);

    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null) continue;

    // ~~The cascade decides what "correct" is for this file~~ — **there is no
    // cascade (#77).** The prop check took its allowed set from a reference
    // screen, a Storybook story or the neighbouring files, and all three of
    // those readers were the derivation this removed. What survives is what a
    // person wrote down.
    const result = await runEngine(file, source, {
      chain,
      inventory: await inventoryFor(chain),
      knowledge,
      withinLayer: options.withinLayer === true,
    });
    findings.push(...result.tier1);
  }

  return findings;
}

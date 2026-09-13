import { readFile } from 'node:fs/promises';
import { runEngine } from './engine.js';
import { parseKnowledge } from '../knowledge/parse.js';
import { knowledgeDir } from '../knowledge/paths.js';
import type { Finding } from '../types.js';

/**
 * The core over a set of files, with no surface attached.
 *
 * It was in `src/cli/index.ts`, which made every other adapter that wanted it
 * import the CLI — and everything in that file prints, which is fatal on a
 * stdio server. Nothing here prints. ~~These three~~ **one function**: `#81`
 * removed `checkProject` with the package graph it read, and `adviseProject`
 * went with Tier 2 in #77.
 */

/**
 * Every deterministic check this tool has, over the given files.
 *
 * ~~Files in the same package share a chain and therefore an inventory, so it
 * is built once per distinct chain.~~ **There is no chain (#81)**, so there is
 * nothing to cache per chain and nothing to skip a file for. What is read once
 * for the whole run is the project's knowledge directory: a batch of thirty
 * files would otherwise re-read and re-parse the same Markdown thirty times.
 */
export async function analyzeProject(rootDir: string, files: string[]): Promise<Finding[]> {
  const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir);

  const findings: Finding[] = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null) continue;

    const result = await runEngine(file, source, { knowledge });
    findings.push(...result.tier1);
  }

  return findings;
}

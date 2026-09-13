import { readFile } from 'node:fs/promises';
import { parseKnowledge } from '../knowledge/parse.js';
import { knowledgeDir, KNOWLEDGE_DIR } from '../knowledge/paths.js';

/**
 * What a run was able to look at, so *clean* and *blind* are different answers.
 *
 * A command answering with empty output and exit 0 makes those the same answer,
 * which is how 400 screen files were reported as success on a repository where
 * nothing had been looked at (#37).
 *
 * **It has almost nothing left to report, and that is the point (#81).** It
 * used to say which of seven checks could not run and why — a package chain
 * unreadable, a style dialect out of reach of a per-file AST check. Six of
 * those checks are rules now, and a rule has no coverage to report: whether an
 * agent read one is not a fact this program can observe, and answering anyway
 * would be the invented reassurance this file exists to prevent. Each rule
 * states its own limit in the place the agent reads it, which is also where it
 * can say what to do about it.
 *
 * So two facts remain, and both are about *this* run: how many of the files
 * named could be read, and whether the project has written anything down for
 * the one check that is left.
 */
export interface Coverage {
  /** Files named, and files whose contents could actually be read. */
  given: number;
  read: number;
  /** Whether the project has written anything down for the curated check. */
  stated: number;
}

/** What the run was able to look at, read once over the files it was given. */
export async function coverageOf(rootDir: string, files: string[]): Promise<Coverage> {
  const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir).catch(() => null);

  const found: Coverage = {
    given: files.length,
    read: 0,
    stated: knowledge?.fragments.length ?? 0,
  };

  for (const file of files) {
    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null) continue;
    found.read++;
  }

  return found;
}

/**
 * The three answers, for a run that found nothing.
 *
 * *It works and here is what it read*, *it is quiet because the project has
 * stated nothing*, or *it is blind here, and here is why* — the same three
 * `skills/reach` is built on. Never a score, and never a level called working
 * because it produced no findings.
 */
export function sayCoverage(found: Coverage): string[] {
  const said: string[] = [];

  said.push(`No findings. ${found.read} of ${found.given} file(s) read.`);

  if (found.read === 0) {
    said.push('None of them could be read, so nothing was checked at all.');
    return said;
  }

  if (found.stated === 0) {
    said.push(
      `Nothing is written down in ${KNOWLEDGE_DIR}/, so the substitution check had nothing to apply.`,
    );
    said.push('That is the design rather than a fault — and it is most of what this tool is:');
    said.push('the rules and the skills are read by your agent before it writes, not by this.');
  } else {
    said.push(
      `${found.stated} rule(s) written down in ${KNOWLEDGE_DIR}/, and none of them applied here.`,
    );
  }

  return said;
}

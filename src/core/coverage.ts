import { readFile } from 'node:fs/promises';
import { cachedPackages } from '../layers/cache.js';
import { readConfig, applyConfig } from '../layers/config.js';
import { resolveChain } from '../layers/chain.js';
import { knowledgeDir, KNOWLEDGE_DIR } from '../knowledge/paths.js';
import { parseKnowledge } from '../knowledge/parse.js';

/**
 * What a run could see, said out loud when it found nothing.
 *
 * A run that reports nothing is either a clean project or a blind tool, and
 * from outside they are identical — which is what `skills/reach` exists to
 * prevent and what happened inside the CLI: 400 screen files reported as
 * success, in silence, on a repository where nothing had been looked at (#37).
 *
 * This is paid for **only where there are no findings**, which is exactly when
 * it is worth knowing and the one time nobody is waiting on a list. A run with
 * findings has already said what it saw.
 */
export interface Coverage {
  /** Files named, and files whose contents could actually be read. */
  given: number;
  read: number;
  /** Files a detected package owns, so the three chain checks could run. */
  onAChain: number;
  /** Packages detection found at all. */
  packages: number;
  /**
   * The style dialects the files actually use.
   *
   * The style check reads `sx` and inline `style` objects, and nothing else can
   * be read from one file's AST. A project that styles with class strings or
   * CSS-in-template is outside it **by construction**, and saying so is a
   * different answer from a clean report.
   */
  styledWith: { sx: number; style: number; classes: number; template: number };
  /** Whether the project has written anything down for the curated checks. */
  stated: number;
}

const SX = /\bsx=\{/;
const INLINE = /\bstyle=\{\{/;
const CLASSES = /\b(?:className|class)=["'{]/;
// `styled.div\``, `css\``, `createGlobalStyle\`` — a tagged template holding CSS.
const TEMPLATE = /\b(?:styled|css|createGlobalStyle|keyframes)\b[\s\S]{0,40}?`/;

/** What the run was able to look at, read once over the files it was given. */
export async function coverageOf(rootDir: string, files: string[]): Promise<Coverage> {
  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const prefer = config?.prefer ?? [];

  const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir).catch(() => null);

  const found: Coverage = {
    given: files.length,
    read: 0,
    onAChain: 0,
    packages: packages.length,
    styledWith: { sx: 0, style: 0, classes: 0, template: 0 },
    stated: knowledge?.fragments.length ?? 0,
  };

  for (const file of files) {
    if (resolveChain(file, packages, prefer).length > 0) found.onAChain++;
    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null) continue;
    found.read++;
    if (SX.test(source)) found.styledWith.sx++;
    if (INLINE.test(source)) found.styledWith.style++;
    if (CLASSES.test(source)) found.styledWith.classes++;
    if (TEMPLATE.test(source)) found.styledWith.template++;
  }

  return found;
}

/**
 * The three answers, for a run that found nothing.
 *
 * *It works and here is what it read*, *it is quiet because the project has
 * stated nothing*, or *it is blind here, and here is why* — the same three
 * `skills/reach` is built on, available from the CLI rather than only from a
 * skill. Never a score, and never a level called working because it produced no
 * findings.
 */
export function sayCoverage(found: Coverage): string[] {
  const said: string[] = [];
  const { styledWith: styled } = found;

  said.push(`No findings. ${found.read} of ${found.given} file(s) read.`);

  if (found.read === 0) {
    said.push('None of them could be read, so nothing was checked at all.');
    return said;
  }

  // The three that need to know which layer a file belongs to. Everything else
  // ran on every file, whatever detection found.
  if (found.onAChain === 0) {
    said.push(
      found.packages === 0
        ? 'No package was detected, so imports and deprecated usage did not run.'
        : `No file belongs to any of the ${found.packages} detected package(s), so imports and deprecated usage did not run.`,
    );
    said.push('That is a detection gap, not a clean result — `uic scan` shows what was looked for.');
  } else if (found.onAChain < found.read) {
    said.push(
      `${found.onAChain} of them belong to a detected package; imports and deprecated usage did not run on the other ${found.read - found.onAChain}.`,
    );
  }

  // What the style check can see, and what it cannot see by construction.
  const seen = styled.sx + styled.style;
  if (seen === 0 && (styled.classes > 0 || styled.template > 0)) {
    const how = [
      ...(styled.classes > 0 ? [`${styled.classes} with class strings`] : []),
      ...(styled.template > 0 ? [`${styled.template} with CSS in template literals`] : []),
    ].join(' and ');
    said.push(
      `The style check reads \`sx\` and inline \`style\` objects, and no file uses either — ${how}.`,
    );
    said.push('Those are out of reach of a per-file AST check by construction, not clean.');
  } else if (seen > 0) {
    const how = [
      ...(styled.sx > 0 ? [`${styled.sx} with \`sx\``] : []),
      ...(styled.style > 0 ? [`${styled.style} with inline \`style\``] : []),
    ].join(' and ');
    said.push(`The style check read ${how}, and found no hardcoded value in them.`);
  }

  // The curated half, which is silent until somebody writes something down.
  if (found.stated === 0) {
    said.push(
      `Nothing is written down in ${KNOWLEDGE_DIR}/, so the page rules and substitution checks had nothing to apply.`,
    );
  }

  return said;
}

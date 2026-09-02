import type { Finding, Violation } from '../types.js';

/**
 * A violation stated as a fact with the fix attached.
 *
 * Not an opinion and not a severity: the check is binary, so the wording never
 * hedges. A message without an actionable fix is not worth emitting.
 */
export function formatViolation(v: Violation): string {
  const lines = [`${v.file}:${v.line}`];

  if (v.reason === 'nearer-layer') {
    lines.push(`${v.symbol} is imported from ${v.importedFrom}.`);
    lines.push(`${v.expectedFrom} exports ${v.symbol} and is nearer on this file's chain.`);
    if (v.withinOwnLayer === true) {
      lines.push(`→ this file is in ${v.expectedFrom}; use the layer's own ${v.symbol}.`);
    } else {
      lines.push(`→ import { ${v.symbol} } from '${v.expectedFrom}'`);
    }
    return lines.join('\n');
  }

  lines.push(`${v.symbol} is deprecated in ${v.importedFrom}.`);
  if (v.replacement !== undefined) {
    lines.push(`→ import { ${v.replacement} } from '${v.expectedFrom}'`);
  }
  return lines.join('\n');
}

/**
 * A finding of any level, stated the same way: where, what, and — where one
 * exists — the fix.
 *
 * An import-level finding is still formatted by {@link formatViolation}: v1's
 * wording names the layer that should have been imported from and the exact
 * line to write, which no generic message would.
 */
export function formatFinding(finding: Finding): string {
  if (
    (finding.level === 'import' || finding.level === 'deprecated') &&
    finding.reason !== undefined &&
    finding.symbol !== undefined &&
    finding.importedFrom !== undefined &&
    finding.expectedFrom !== undefined
  ) {
    return formatViolation(finding as Violation);
  }

  const lines = [`${finding.file}:${finding.line}`, finding.message];
  if (finding.advisory === true && finding.source !== undefined) {
    // Tier 2 never states a fact it cannot support, so it names where the
    // expectation came from and stays advice.
    lines.push(`(advisory, from ${finding.source})`);
  }
  return lines.join('\n');
}

/**
 * The one-line form of a nearer-layer import, and its inverse.
 *
 * Written and read in one place so they cannot drift. The report needs the
 * inverse because the log keeps five fields and no sixth (#173): a finding
 * carries its sentence, never the parts it was built from, so folding four
 * symbols on one import statement back into one line (#222) has to read the
 * sentence back.
 */
export function importSentence(
  symbols: string[],
  importedFrom: string,
  expectedFrom: string,
): string {
  const named =
    symbols.length < 2
      ? (symbols[0] ?? '')
      : `${symbols.slice(0, -1).join(', ')} and ${symbols[symbols.length - 1]!}`;
  return `${named} ${symbols.length < 2 ? 'is' : 'are'} imported from ${importedFrom}; ${expectedFrom} is nearer.`;
}

const IMPORT_SENTENCE = /^(.+?) (?:is|are) imported from (.+?); (.+?) is nearer\.$/;

/** The parts back out, or `null` where the message is about something else. */
export function readImportSentence(
  message: string,
): { symbols: string[]; importedFrom: string; expectedFrom: string } | null {
  const match = IMPORT_SENTENCE.exec(message);
  if (match === null) return null;
  return {
    symbols: match[1]!.split(/, | and /),
    importedFrom: match[2]!,
    expectedFrom: match[3]!,
  };
}

/**
 * The same wrong source, said once for however many files reached for it.
 *
 * What repeats across a project is not the sentence — every import finding
 * names its own symbol, so no two files share one — but the source: 84 files
 * reaching for the same package where a nearer one exports the same thing is
 * an opinion the project has not written down (#223).
 */
export const importSourceSentence = (importedFrom: string, expectedFrom: string): string =>
  `${importedFrom} is imported where ${expectedFrom} is nearer.`;

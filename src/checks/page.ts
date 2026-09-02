import { compareOrder, regionsOf } from '../sources/regions.js';
import { templateKind } from '../parse/template.js';
import type { PageRule } from '../knowledge/page-rules.js';
import type { Finding } from '../types.js';

/**
 * Level one of the seven: is this page built the way this project builds pages.
 *
 * The flat component list this replaces could not express either thing that
 * actually goes wrong — a region missing, or a region in the wrong place —
 * because it de-duplicated and discarded order.
 *
 * Deterministic because the order was **declared**. No page rule, no finding.
 */
export const pageFindings = (
  filePath: string,
  source: string,
  rules: PageRule[],
): Finding[] => {
  if (rules.length === 0) return [];

  const kind = templateKind(filePath);
  const regions = kind === null ? regionsOf(source) : regionsOf(source, kind);
  if (regions === null) return [];

  // Exactly one rule may claim this page, and it claims it by naming its
  // holder. Anything looser was guessing which kind of page this is:
  //
  //   - two rules sharing a holder (the normal case — a project has one
  //     layout and several page kinds) resolved to whichever came back first,
  //     and told a correct detail page it was missing the list page's footer;
  //   - matching by "most regions in common" always produced a wrong-holder
  //     finding, because the mismatch is what selected the rule.
  //
  // A wrong holder is only attributable once something else establishes which
  // kind of page the file is, and nothing does. So: silence.
  const claiming = rules.filter((rule) => rule.holder === regions.holder);
  if (claiming.length !== 1) return [];
  const rule = claiming[0]!;

  const compared = compareOrder(
    regions.order.map((entry) => entry.region),
    rule.order,
  );

  const findings: Finding[] = [];
  const say = (message: string): void => {
    findings.push({ file: filePath, line: 1, level: 'page-pattern', source: 'knowledge', message });
  };

  for (const region of compared.missing) {
    say(`This page has no ${region}. "${rule.subject}" says one belongs here.`);
  }

  if (!compared.inOrder) {
    say(
      `This page's regions are in the order ${compared.actual.join(', ')}. "${rule.subject}" says the order is ${compared.expected.join(', ')}.`,
    );
  }

  return findings;
};

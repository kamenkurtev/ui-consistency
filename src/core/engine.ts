import { retrieve } from '../knowledge/retrieve.js';
import { substitutionRules } from '../knowledge/rules.js';
import { substitutionFindings } from '../checks/substitution.js';
import { templateFindings } from '../checks/template.js';
import { templateKind, parseTemplate } from '../parse/template.js';
import type { Finding, Knowledge } from '../types.js';

export interface EngineContext {
  /** Curated rules. Absent or empty means Tier 2 has nothing to judge against. */
  knowledge?: Knowledge;
  /** Judge test and story files too. Off by default; see `GENERATED`. */
  includeTestFiles?: boolean;
}

export interface EngineResult {
  /**
   * Deterministic, complete, and already computed.
   *
   * ~~And `tier2`, the fuzzy review, deferred.~~ **The injection point went with
   * the thing that filled it (#81).** `src/ai/advice.ts` assembled the evidence
   * and handed it to the agent, and #77 removed it because that *is* a skill —
   * but the hook-point stayed, so the engine carried a `review` callback
   * nothing supplied and a branch nothing reached. Dead since #77 and removed
   * here with the rest.
   */
  tier1: Finding[];
}

/**
 * Files where the design system is deliberately bypassed.
 *
 * A test renders `<button>` to assert something about a button, and a story
 * hardcodes a colour to show what the colour does. Against Backstage these
 * were 116 of 149 style findings and most of the reuse findings — all of them
 * correct about the code and wrong about the intent.
 */
const GENERATED = /(\.(?:test|spec|stories|story)\.[jt]sx?$)|(^|\/)__(?:tests|mocks)__\//;

/**
 * Every deterministic check over one file.
 *
 * ~~Then — only if they all passed — the offer of a fuzzy review. The ordering
 * is the cost argument.~~ **There is one tier (#81)**, and the cost argument
 * won everywhere rather than being abandoned: the fuzzy half is the agent
 * reading a rule before it writes, which costs nothing per edit and is the
 * whole of what `rules/` is for.
 */
export async function runEngine(
  filePath: string,
  source: string,
  ctx: EngineContext,
): Promise<EngineResult> {
  if (ctx.includeTestFiles !== true && GENERATED.test(filePath)) return { tier1: [] };

  // A template file has no JavaScript to read, so none of the JSX checks can
  // see it. Before this they all returned nothing and an Angular repository
  // looked clean — which is the failure shape this project has hit before: a
  // tool that is silent about the files it exists to check.
  const kind = templateKind(filePath);
  if (kind !== null) {
    // Retrieval reads JavaScript, and there is none here — so the elements
    // the template actually uses are handed to it directly.
    const elements = parseTemplate(source, kind).map((node) => node.name);
    const retrieved =
      ctx.knowledge === undefined
        ? { fragments: [] }
        : { fragments: retrieve(source, ctx.knowledge, { filePath, terms: elements }) };
    return {
      tier1: templateFindings(filePath, source, substitutionRules(retrieved)).sort(
        (a, b) => a.line - b.line,
      ),
    };
  }

  // ~~The import check ran here first.~~ **It is gone with the package graph
  // (#81)**, which is what it read: the chain was readable on 0 of 15 sampled
  // files on one real `package.json`-workspace monorepo and on near-nothing in
  // an Angular one, so it answered on one repository shape in three. What
  // replaces it is `rules/imports-and-layers.md`, a sentence a person writes
  // once per project.
  //
  // Retrieved once. The JSX path needs no `terms`: it has an AST, and
  // retrieval reads it directly.
  const retrieved =
    ctx.knowledge === undefined
      ? { fragments: [] }
      : { fragments: retrieve(source, ctx.knowledge, { filePath }) };

  const tier1 = [
    // Curated "use X, never Y" rules. Deterministic because the rule is a
    // declaration somebody wrote, not a pattern inferred from the code next
    // door — no rule, no finding.
    //
    // Scoped by retrieval, so a rule only speaks about what it is about. Applied globally, the widget rule told a *form* to use
    // a WidgetCard — a finding citing a rule that does not apply is worse than
    // no finding, because it teaches people to stop reading them.
    ...(ctx.knowledge === undefined
      ? []
      : substitutionFindings(filePath, source, substitutionRules(retrieved))),
  ].sort((a, b) => a.line - b.line);

  return { tier1 };
}

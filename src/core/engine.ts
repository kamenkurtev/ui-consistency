import { importSentence } from './format.js';
import { checkSource } from './check.js';
import { propFindings } from '../checks/props.js';
import { retrieve } from '../knowledge/retrieve.js';
import { substitutionRules } from '../knowledge/rules.js';
import { substitutionFindings } from '../checks/substitution.js';
import { pageRules } from '../knowledge/page-rules.js';
import { pageFindings } from '../checks/page.js';
import { templateFindings } from '../checks/template.js';
import { templateKind, parseTemplate } from '../parse/template.js';
import type {
  SourceKind,
  Finding,
  Inventory,
  Knowledge,
  KnowledgeFragment,
  Layer,
  PropConventions,
  Violation,
} from '../types.js';

/** What Tier 2 is given: the edit, and only the rules that bear on it. */
export interface ReviewRequest {
  filePath: string;
  source: string;
  fragments: KnowledgeFragment[];
}

export interface EngineContext {
  chain: Layer[];
  inventory: Inventory;
  /** Curated rules. Absent or empty means Tier 2 has nothing to judge against. */
  knowledge?: Knowledge;
  /** Allowed prop values, from a source of truth. Never invented here. */
  conventions?: PropConventions;
  /** Which source stated them, so a finding can say where its set came from. */
  conventionsFrom?: SourceKind;
  /**
   * Tier 2, injected. Absent means no fuzzy review exists for this project —
   * the deterministic checks still run, which is the whole point of the tiers.
   */
  review?: (request: ReviewRequest) => Promise<Finding[]>;
  /** Judge test and story files too. Off by default; see `GENERATED`. */
  includeTestFiles?: boolean;
  /** Report findings whose expected layer is the file's own (v1's policy). */
  withinLayer?: boolean;
}

export interface EngineResult {
  /** Deterministic, complete, and already computed. */
  tier1: Finding[];
  /**
   * The fuzzy review, deferred. Present only when Tier 1 is clean, a reviewer
   * exists and a rule applies. Awaiting it is the caller's choice — the edit
   * path never does.
   */
  tier2?: Promise<Finding[]>;
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

function importFinding(violation: Violation): Finding {
  return {
    ...violation,
    level: violation.reason === 'deprecated' ? 'deprecated' : 'import',
    message:
      violation.reason === 'deprecated'
        ? `${violation.symbol} is deprecated in ${violation.importedFrom}.`
        : importSentence([violation.symbol], violation.importedFrom, violation.expectedFrom),
  };
}

/**
 * Every deterministic check over one file, then — only if they all passed —
 * the offer of a fuzzy review.
 *
 * The ordering is the cost argument. Tier 1 is free and certain, so it runs
 * always and first; Tier 2 costs tokens, so it never runs on a file that
 * already has an answer, and never at all where no curated rule applies.
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
    // One retrieval, two readings of it. Retrieval parses; doing it twice on
    // the per-edit path was pure duplicated work.
    const retrieved =
      ctx.knowledge === undefined
        ? { fragments: [] }
        : { fragments: retrieve(source, ctx.knowledge, { filePath, terms: elements }) };
    return {
      tier1: [
        ...templateFindings(filePath, source, substitutionRules(retrieved)),
        ...pageFindings(filePath, source, pageRules(retrieved)),
      ].sort((a, b) => a.line - b.line),
    };
  }

  const imports = checkSource(filePath, source, ctx.chain, ctx.inventory)
    .filter((violation) => ctx.withinLayer === true || violation.withinOwnLayer !== true)
    .map(importFinding);

  // Retrieved once and read by both curated checks below. The JSX path needs
  // no `terms`: it has an AST, and retrieval reads it directly.
  const retrieved =
    ctx.knowledge === undefined
      ? { fragments: [] }
      : { fragments: retrieve(source, ctx.knowledge, { filePath }) };

  const tier1 = [
    ...imports,
    ...(ctx.conventions === undefined
      ? []
      : propFindings(filePath, source, ctx.conventions, ctx.conventionsFrom)),
    // Level one: the page's own structure, against a stated page rule.
    ...pageFindings(filePath, source, pageRules(retrieved)),
    // Curated "use X, never Y" rules. Deterministic because the rule is a
    // declaration somebody wrote, not a pattern inferred from the code next
    // door — no rule, no finding.
    //
    // Scoped by the same retrieval Tier 2 uses, so a rule only speaks about
    // what it is about. Applied globally, the widget rule told a *form* to use
    // a WidgetCard — a finding citing a rule that does not apply is worse than
    // no finding, because it teaches people to stop reading them.
    ...(ctx.knowledge === undefined
      ? []
      : substitutionFindings(
          filePath,
          source,
          substitutionRules(retrieved),
          ctx.chain,
          ctx.inventory,
        )),
  ].sort((a, b) => a.line - b.line);

  if (tier1.length > 0) return { tier1 };
  if (ctx.review === undefined || ctx.knowledge === undefined) return { tier1 };

  const fragments = retrieved.fragments;
  if (fragments.length === 0) return { tier1 };

  const review = ctx.review;
  // Not awaited: the caller decides whether to wait, and the edit path does
  // not. A reviewer that fails is a reviewer that said nothing — a missed
  // fuzzy finding is cheaper than an interrupted edit.
  const tier2 = Promise.resolve()
    .then(() => review({ filePath, source, fragments }))
    .catch(() => []);

  return { tier1, tier2 };
}

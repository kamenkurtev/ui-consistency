import { referenceSource } from './reference.js';
import { knowledgeSource } from './knowledge.js';
import { storybookSource } from './storybook.js';
import { neighbourSource } from './neighbours.js';
import type { Knowledge, PropConventions, SourceKind } from '../types.js';

/**
 * What a source of truth can say about how a screen should be built.
 *
 * The same shape whatever answered, so a project runs whichever source it
 * happens to have and nothing downstream knows the difference — except that
 * `heuristic` marks an answer that was inferred rather than declared.
 */
export interface SourceModel {
  kind: SourceKind;
  /** Components this source treats as the canonical vocabulary. */
  components: string[];
  /** The layout shape, outermost first. */
  pattern: string[];
  /** What kind of screen the source describes, where it is readable. */
  /** What holds a screen of this kind here — the structural reading (#226). */
  holder?: string;
  /** Component -> prop -> the values this source shows. */
  props: PropConventions;
  /** True when the model was inferred from code nobody declared as correct. */
  heuristic?: boolean;
}

export interface SourceOfTruth {
  kind: SourceKind;
  /** Null when this source has nothing to say about the target. */
  describe(target: string): Promise<SourceModel | null>;
}

export interface SourceOptions {
  /** A screen to build like. The developer named it, so it outranks the rest. */
  reference?: string;
  /** The curated Markdown, already parsed. */
  knowledge?: Knowledge;
  /** Where to look for `.stories.tsx`. */
  storybookDir?: string;
}

/**
 * The first source that has something to say about this target.
 *
 * Priority is not a preference, it is a statement about evidence: a reference
 * the developer pointed at is intent, curated Markdown is a declaration, a
 * story is a demonstration, and the files next door are only a pattern that
 * happens to hold. When none of them answers, the result is null and the tool
 * stays quiet — it never invents a pattern to have something to say.
 */
export async function resolveSource(
  target: string,
  options: SourceOptions,
): Promise<SourceModel | null> {
  const cascade: SourceOfTruth[] = [];
  if (options.reference !== undefined) cascade.push(referenceSource(options.reference));
  if (options.knowledge !== undefined) cascade.push(knowledgeSource(options.knowledge));
  if (options.storybookDir !== undefined) cascade.push(storybookSource(options.storybookDir));
  cascade.push(neighbourSource());

  for (const source of cascade) {
    const model = await source.describe(target).catch(() => null);
    if (model !== null) return model;
  }
  return null;
}

/**
 * The prop values a source is entitled to gate on.
 *
 * Only a **declaration** may: a reference someone pointed at, or a curated
 * rule. A story shows the two variants its author felt like showing —
 * Backstage's give `Flex.gap = ["4", "8"]` — and a gap of 2 is not thereby
 * wrong. Neighbours are worse still: repetition by copy-paste is the mistake
 * this project exists to stop, not evidence.
 *
 * The other sources are not wasted; they name the vocabulary the fuzzy review
 * judges against. They just never produce a hard finding on their own.
 */
export function statedConventions(model: SourceModel | null): PropConventions {
  if (model === null || model.heuristic === true) return {};
  return model.kind === 'reference' || model.kind === 'knowledge' ? model.props : {};
}

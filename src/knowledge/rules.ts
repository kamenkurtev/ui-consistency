import type { Knowledge } from '../types.js';

/** One curated "use X, not Y" statement. */
export interface SubstitutionRule {
  /** The component the project wants. */
  canonical: string;
  /** The components it does not want, where the canonical one belongs. */
  forbidden: string[];
  /** The heading it came from, so a finding can cite the rule. */
  subject: string;
  id: string;
}

/**
 * The words that turn a preference into a prohibition.
 *
 * A rule must contain one of these to be enforced. "Widgets are wrapped in
 * `<WidgetCard>`" says what is right and nothing at all about what is wrong,
 * and deriving the second from the first is precisely the inference this
 * project refuses to make: it would fault every file that renders a `Box` for
 * any reason. The team writes the prohibition or there isn't one.
 */
const NEGATION = /\b(never|not|instead of|rather than|avoid|don't|do not)\b/i;

/**
 * How a rule names a component: `<Name>` or `` `Name` ``.
 *
 * Two spellings, because two families of framework. JSX capitalises; Angular
 * and Vue templates use a custom element, which the HTML spec requires to
 * contain a dash — which is also what keeps `<div>` and `<span>` out, so a
 * rule can never forbid a plain tag.
 */
export const COMPONENT = /<([A-Z][\w]*|[a-z][\w]*-[\w-]*)|`<?([A-Z][\w]*|[a-z][\w]*-[\w-]*)>?`/g;

function componentsIn(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(COMPONENT)) {
    const name = match[1] ?? match[2];
    if (name !== undefined && !found.includes(name)) found.push(name);
  }
  return found;
}

/**
 * Read the substitution rules out of a curated knowledge base.
 *
 * The shape it understands is one English sentence: a component, a negation,
 * and the components on the far side of it. "A page of actions uses
 * `<ActionGrid>`, never a raw `<Grid>`." The canonical component may be named
 * in an earlier sentence of the same rule — "A detail screen is a routed page
 * on `<DetailLayout>`. It is not a `Dialog`." — so it carries forward within
 * one fragment and no further.
 */
export function substitutionRules(knowledge: Knowledge): SubstitutionRule[] {
  const rules: SubstitutionRule[] = [];

  for (const fragment of knowledge.fragments) {
    // A generated file may never produce a prohibition. This is the line the
    // marker exists for: without it, a sentence a model wrote containing the
    // word "never" would fail somebody's build, and "conventions are curated,
    // never inferred" would be gone without anyone deciding to give it up.
    if (fragment.generated === true) continue;

    let canonical: string | null = null;
    const forbidden: string[] = [];

    for (const sentence of fragment.body.split(/(?<=[.;:])\s+|\n{2,}/)) {
      const negation = NEGATION.exec(sentence);
      if (negation === null) {
        // No prohibition here — but it may still name the component the next
        // sentence contrasts against.
        const named = componentsIn(sentence);
        if (named.length > 0) canonical = named[0]!;
        continue;
      }

      const before = componentsIn(sentence.slice(0, negation.index));
      const after = componentsIn(sentence.slice(negation.index));
      if (before.length > 0) canonical = before[0]!;
      if (canonical === null) continue;

      for (const name of after) {
        if (name !== canonical && !forbidden.includes(name)) forbidden.push(name);
      }
    }

    if (canonical !== null && forbidden.length > 0) {
      rules.push({ canonical, forbidden, subject: fragment.subject, id: fragment.id });
    }
  }

  return rules;
}

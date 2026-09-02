import type { Knowledge } from '../types.js';
import { regionOf, type Region } from '../sources/regions.js';
// The same spelling in both parsers: a rule written `<PageLayout>` without
// backticks parsed in one file and silently not in the other.
import { COMPONENT } from './rules.js';

/** One curated statement about how a kind of page is built. */
export interface PageRule {
  /** The layout holder the page must sit in. */
  holder: string;
  /** The regions it must hold, in the order stated. */
  order: Region[];
  subject: string;
  id: string;
}

/**
 * The phrase that turns a list of components into a sequence.
 *
 * Required, for the same reason a prohibition is required elsewhere: "pages
 * use `<PageLayout>`, `<PageHeader>` and `<Content>`" names three components
 * and says nothing about their order. Reading an order into it would enforce
 * whichever order the sentence happened to be written in.
 */
const IN_ORDER = /\bin order\b/i;



/**
 * Read the page rules out of the curated Markdown.
 *
 * The shape understood is one sentence naming a holder and then, after the
 * words "in order", the regions in sequence. Everything about it is stated by
 * a person: which component is the holder, which regions belong, and what
 * order they go in. None of it is inferred from what the majority of pages
 * happen to do — eight pages sharing a mistake look exactly like eight pages
 * sharing a convention.
 */
export const pageRules = (knowledge: Knowledge): PageRule[] => {
  const rules: PageRule[] = [];

  for (const fragment of knowledge.fragments) {
    // Generated prose describes the layouts the screens happen to share; a
    // page rule fails a build. Same reason as `substitutionRules`.
    if (fragment.generated === true) continue;

    const marker = IN_ORDER.exec(fragment.body);
    if (marker === null) continue;

    // The last non-region component before the phrase, not the first: a rule
    // that names what it replaces — "Unlike `<LegacyShell>`, a list page is
    // `<PageLayout>` holding, in order: …" — made the deprecated thing the
    // holder, and then told every conforming page to use it.
    const before = [...fragment.body.slice(0, marker.index).matchAll(COMPONENT)].map((m) => (m[1] ?? m[2])!);
    const holder = before.filter((name) => regionOf(name) === null).at(-1);
    if (holder === undefined) continue;

    const order: Region[] = [];
    for (const match of fragment.body.slice(marker.index).matchAll(COMPONENT)) {
      // Against the holder the rule itself names, so a rule can be written
      // about a design system that prefixes its components: "a list screen is
      // `<IonPage>` holding, in order: `<IonHeader>`, `<IonContent>`". Without
      // it the rule parsed to an empty order and quietly enforced nothing.
      const region = regionOf((match[1] ?? match[2])!, holder);
      if (region !== null && !order.includes(region)) order.push(region);
    }
    if (order.length === 0) continue;

    rules.push({ holder, order, subject: fragment.subject, id: fragment.id });
  }

  return rules;
};

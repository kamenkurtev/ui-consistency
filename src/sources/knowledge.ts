import type { Knowledge, PropConventions } from '../types.js';
import type { SourceModel, SourceOfTruth } from './adapter.js';
import { retrieve } from '../knowledge/retrieve.js';
import { readFile } from 'node:fs/promises';

/** `<WidgetCard>` written inside a rule. */
const COMPONENT = /<([A-Z][\w]*)/g;
/** `variant="h6"` written inside a rule. */
const PROP = /<([A-Z][\w]*)\s+([^>]*)>/g;
const ATTRIBUTE = /([a-zA-Z][\w]*)=['"]([^'"]+)['"]/g;

/**
 * The curated Markdown as a source of truth.
 *
 * Second in the cascade and the only one that works for a screen nobody has
 * built yet: the pattern was declared once, for the project, rather than
 * derived from something that already exists.
 */
export function knowledgeSource(knowledge: Knowledge): SourceOfTruth {
  return {
    kind: 'knowledge',
    async describe(target: string): Promise<SourceModel | null> {
      if (knowledge.fragments.length === 0) return null;

      // Rules are selected by the same retrieval the model call uses, so a
      // source of truth and the context sent to the model never disagree.
      const source = await readFile(target, 'utf8').catch(() => null);
      const fragments =
        source === null
          ? knowledge.fragments
          : retrieve(source, knowledge, { maxFragments: 8, maxChars: 8000 });
      if (fragments.length === 0) return null;

      const components: string[] = [];
      const props: PropConventions = {};

      for (const fragment of fragments) {
        for (const match of fragment.body.matchAll(COMPONENT)) {
          const name = match[1]!;
          if (!components.includes(name)) components.push(name);
        }
        // The vocabulary above is advisory — nothing gates on it. The prop
        // values below are not: `statedConventions` lets a knowledge model
        // produce a hard finding, so a generated file listing the values a
        // story happened to show would enforce them. The components survive,
        // the prop set does not.
        if (fragment.generated === true) continue;
        for (const element of fragment.body.matchAll(PROP)) {
          const name = element[1]!;
          for (const attribute of element[2]!.matchAll(ATTRIBUTE)) {
            const forComponent = (props[name] ??= {});
            const values = (forComponent[attribute[1]!] ??= []);
            if (!values.includes(attribute[2]!)) values.push(attribute[2]!);
          }
        }
      }

      if (components.length === 0) return null;
      // A rule states a vocabulary, not a layout: the pattern stays empty
      // rather than being guessed from prose.
      return { kind: 'knowledge', components, pattern: [], props };
    },
  };
}

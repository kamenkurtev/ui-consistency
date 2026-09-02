import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseKnowledge } from '../../src/knowledge/parse.js';

const here = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(here, '../fixtures/knowledge');

describe('parsing the curated knowledge base', () => {
  it('makes one fragment per rule, not one per file', async () => {
    const knowledge = await parseKnowledge(DIR);
    const subjects = knowledge.fragments.map((f) => f.subject);
    expect(subjects).toContain('Widget title');
    expect(subjects).toContain('Widget icons');
    expect(subjects).toContain('Form layout');
    expect(subjects).toContain('Detail screen archetype');
  });

  it('carries the body of the rule and nothing from the next one', async () => {
    const knowledge = await parseKnowledge(DIR);
    const title = knowledge.fragments.find((f) => f.subject === 'Widget title')!;
    expect(title.body).toContain('Typography');
    expect(title.body).not.toContain('Emoji are never icons');
  });

  it('takes its kind from the file, so a rule knows what it is about', async () => {
    const knowledge = await parseKnowledge(DIR);
    const title = knowledge.fragments.find((f) => f.subject === 'Widget title')!;
    expect(title.kind).toBe('widgets');
    expect(title.id).toContain('widgets');
  });

  it('keeps the file preamble as a fragment of its own', async () => {
    // The text under the H1 states what widgets are for; losing it would lose
    // the only sentence that explains why the rules below exist.
    const knowledge = await parseKnowledge(DIR);
    const intro = knowledge.fragments.find((f) => f.subject === 'Dashboard widgets')!;
    expect(intro.body).toContain('dashboard grid');
  });

  it('lifts the component and screen names as keywords', async () => {
    const knowledge = await parseKnowledge(DIR);
    const icons = knowledge.fragments.find((f) => f.subject === 'Widget icons')!;
    // From the heading, from inline code, and from emphasised terms.
    expect(icons.keywords).toContain('widget');
    expect(icons.keywords).toContain('widgeticon');
    expect(icons.keywords).toContain('emoji');
    expect(icons.keywords).toContain('@fixture/icons');
  });

  it('drops words that match everything', async () => {
    const knowledge = await parseKnowledge(DIR);
    for (const fragment of knowledge.fragments) {
      expect(fragment.keywords).not.toContain('the');
      expect(fragment.keywords).not.toContain('and');
      expect(fragment.keywords).not.toContain('never');
    }
  });

  it('returns nothing for a directory that is not there', async () => {
    const knowledge = await parseKnowledge(resolve(DIR, 'absent'));
    expect(knowledge.fragments).toEqual([]);
  });
});

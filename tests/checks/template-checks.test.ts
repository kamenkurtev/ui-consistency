import { describe, it, expect } from 'vitest';
import { templateFindings } from '../../src/checks/template.js';
import { substitutionRules } from '../../src/knowledge/rules.js';
import type { Knowledge } from '../../src/types.js';

const NO_RULES: Knowledge = { fragments: [] };

function find(file: string, source: string, knowledge: Knowledge = NO_RULES) {
  return templateFindings(file, source, substitutionRules(knowledge));
}

/**
 * ~~Hardcoded values in a template, and an emoji standing in for an icon.~~
 *
 * **Both went with the checks (#79)**: they are `rules/raw-values.md` now,
 * obeyed while the line is written. What is left on this path is the half no
 * general instruction could carry, because it names the components this
 * project wrote down.
 */
describe('curated substitution rules apply to templates too', () => {
  const rules: Knowledge = {
    fragments: [
      {
        id: 'pages#grids',
        kind: 'pages',
        subject: 'Action grids',
        body: 'A page of actions uses `<app-action-grid>`, never a raw `<app-grid>`.',
        keywords: ['grid'],
      },
    ],
  };

  it('flags the element the project has written down as the wrong one', () => {
    const findings = find('page.component.html', '<app-grid><button>x</button></app-grid>', rules);
    expect(findings.some((f) => f.message.includes('app-action-grid'))).toBe(true);
  });
});

describe('a Vue and a Svelte file', () => {
  // Observed through the substitution check rather than the style check, which
  // is gone (#79). The property under test is the same one and is the reason
  // these exist: the parser reaches the template block at all. Angular, Vue and
  // Svelte were silent before it did — not clean, silent.
  const rules: Knowledge = {
    fragments: [
      {
        id: 'pages#grids',
        kind: 'pages',
        subject: 'Action grids',
        body: 'A page of actions uses `<app-action-grid>`, never a raw `<app-grid>`.',
        keywords: ['grid'],
      },
    ],
  };

  it('reads the Vue template block', () => {
    const source = [
      '<script setup>const a = 1;</script>',
      '<template>',
      '  <app-grid>Save</app-grid>',
      '</template>',
    ].join('\n');
    const findings = find('Card.vue', source, rules);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.line).toBe(3);
  });

  it('reads a Svelte component', () => {
    const source = '<script>let a;</script>\n<app-grid>Save</app-grid>';
    expect(find('Page.svelte', source, rules)).toHaveLength(1);
  });

  it('says nothing about a file that carries no template', () => {
    expect(find('List.tsx', '<app-grid />', rules)).toEqual([]);
  });
});

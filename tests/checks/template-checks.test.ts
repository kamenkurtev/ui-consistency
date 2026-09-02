import { describe, it, expect } from 'vitest';
import { templateFindings } from '../../src/checks/template.js';
import { substitutionRules } from '../../src/knowledge/rules.js';
import type { Knowledge } from '../../src/types.js';

const NO_RULES: Knowledge = { fragments: [] };

function find(file: string, source: string, knowledge: Knowledge = NO_RULES) {
  return templateFindings(file, source, substitutionRules(knowledge));
}

describe('hardcoded values in a template', () => {
  it('flags a colour in a style attribute', () => {
    const findings = find('a.component.html', '<div style="color: #3366ff">x</div>');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.level).toBe('style');
    expect(findings[0]!.message).toContain('#3366ff');
  });

  it('flags a pixel font size', () => {
    const findings = find('a.component.html', '<span style="font-size: 12px">x</span>');
    expect(findings[0]!.message).toContain('12px');
  });

  it('says nothing about a variable or a token', () => {
    expect(find('a.component.html', '<div style="color: var(--brand)">x</div>')).toEqual([]);
    expect(find('a.component.html', '<div [style.color]="theme.brand">x</div>')).toEqual([]);
  });

  it('says nothing about a relative unit, which is not a raw pixel value', () => {
    expect(find('a.component.html', '<span style="font-size: 1.5rem">x</span>')).toEqual([]);
  });

  it('reports the line in the file', () => {
    const source = '<div>\n  <span style="color: #fff">x</span>\n</div>';
    expect(find('a.component.html', source)[0]!.line).toBe(2);
  });
});

describe('emoji used as an icon in a template', () => {
  it('flags an element whose whole content is an emoji', () => {
    const findings = find('a.component.html', '<span>📈</span>');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.level).toBe('reuse');
  });

  it('says nothing about an emoji inside a sentence', () => {
    expect(find('a.component.html', '<p>All green 🎉 today</p>')).toEqual([]);
  });
});

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
  it('reads the Vue template block', () => {
    const source = [
      '<script setup>const a = 1;</script>',
      '<template>',
      '  <MyButton style="font-size: 12px">Save</MyButton>',
      '</template>',
    ].join('\n');
    const findings = find('Card.vue', source);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.line).toBe(3);
  });

  it('reads a Svelte component', () => {
    const source = '<script>let a;</script>\n<Button style="color: #333">Save</Button>';
    expect(find('Page.svelte', source)).toHaveLength(1);
  });

  it('says nothing about a file that carries no template', () => {
    expect(find('List.tsx', '<div style="color: #333" />')).toEqual([]);
  });
});

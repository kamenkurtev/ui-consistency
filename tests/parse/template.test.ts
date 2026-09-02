import { describe, it, expect } from 'vitest';
import { parseTemplate, templateKind } from '../../src/parse/template.js';

describe('which files carry a template', () => {
  it('knows the three template dialects apart from JSX', () => {
    expect(templateKind('src/app/list.component.html')).toBe('angular');
    expect(templateKind('src/components/Card.vue')).toBe('vue');
    expect(templateKind('src/routes/Page.svelte')).toBe('svelte');
    expect(templateKind('src/List.tsx')).toBeNull();
    expect(templateKind('src/util.ts')).toBeNull();
  });
});

describe('reading an Angular template', () => {
  const source =
    '<div class="card">\n  <button mat-button [disabled]="busy" (click)="save()">Save</button>\n</div>';

  it('finds the elements', () => {
    const tree = parseTemplate(source, 'angular');
    expect(tree.map((node) => node.name)).toEqual(['div', 'button']);
  });

  it('keeps the binding syntax on the attribute, rather than losing the attribute', () => {
    const tree = parseTemplate(source, 'angular');
    const button = tree.find((node) => node.name === 'button')!;
    expect(Object.keys(button.attributes)).toContain('[disabled]');
    expect(Object.keys(button.attributes)).toContain('(click)');
  });

  it('records where each element is', () => {
    const tree = parseTemplate(source, 'angular');
    expect(tree.find((node) => node.name === 'button')!.line).toBe(2);
  });
});

describe('reading a Vue single-file component', () => {
  const source = [
    '<script setup>',
    "import { ref } from 'vue';",
    'const busy = ref(false);',
    '</script>',
    '',
    '<template>',
    '  <MyButton :disabled="busy" style="font-size: 12px">Save</MyButton>',
    '</template>',
    '',
    '<style scoped>.a { color: red }</style>',
  ].join('\n');

  it('reads the template block and not the script or the style', () => {
    const names = parseTemplate(source, 'vue').map((node) => node.name);
    expect(names).toContain('MyButton');
    expect(names).not.toContain('script');
    expect(names).not.toContain('style');
  });

  it('keeps the line numbers of the whole file, not of the block', () => {
    // A finding that points at line 2 of the template block is a finding
    // pointing at the wrong line of the file somebody has open.
    const node = parseTemplate(source, 'vue').find((n) => n.name === 'MyButton')!;
    expect(node.line).toBe(7);
  });

  it('keeps the style attribute, which is where hardcoded values live', () => {
    const node = parseTemplate(source, 'vue').find((n) => n.name === 'MyButton')!;
    expect(node.attributes['style']).toBe('font-size: 12px');
  });
});

describe('reading a Svelte component', () => {
  const source = [
    '<script>let busy = false;</script>',
    '',
    '<div class="card">',
    '  {#if busy}<Spinner />{/if}',
    '  <Button on:click={save} style="color: #333">Save</Button>',
    '</div>',
  ].join('\n');

  it('sees the elements inside a block, which is not HTML at all', () => {
    const names = parseTemplate(source, 'svelte').map((node) => node.name);
    expect(names).toContain('Spinner');
    expect(names).toContain('Button');
  });

  it('leaves the script block out', () => {
    expect(parseTemplate(source, 'svelte').map((node) => node.name)).not.toContain('script');
  });
});

describe('what it does with what it cannot read', () => {
  it('returns nothing rather than throwing', () => {
    expect(parseTemplate('<div><span></div>', 'angular')).toBeInstanceOf(Array);
  });

  it('returns nothing for a Vue file with no template block', () => {
    expect(parseTemplate('<script setup>const a = 1;</script>', 'vue')).toEqual([]);
  });

  it('carries the text of an element, for the checks that read it', () => {
    const tree = parseTemplate('<span>📈</span>', 'angular');
    expect(tree[0]!.text).toBe('📈');
  });
});

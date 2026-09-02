import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseKnowledge } from '../../src/knowledge/parse.js';
import { substitutionRules } from '../../src/knowledge/rules.js';
import { pageRules } from '../../src/knowledge/page-rules.js';
import { retrieve } from '../../src/knowledge/retrieve.js';
import { knowledgeSource } from '../../src/sources/knowledge.js';
import { statedConventions } from '../../src/sources/adapter.js';

let root: string;
let dir: string;

const write = async (name: string, body: string): Promise<void> => {
  await writeFile(join(dir, name), body, 'utf8');
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-generated-'));
  dir = join(root, '.claude/ui-consistency');
  await mkdir(dir, { recursive: true });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('a generated file can never fail a check', () => {
  // This is the test that guards the project's second load-bearing decision —
  // conventions are curated, never inferred. If it is ever deleted, a sentence
  // a model wrote can block somebody's commit.
  it('produces no substitution rule, however plainly it forbids something', async () => {
    await write(
      'components.md',
      [
        '<!-- uic:generated v=0.13.0 at=2026-08-11 -->',
        '# Components',
        '',
        '## Cards',
        '',
        'A widget is wrapped in `<WidgetCard>`, never a raw `<Paper>`.',
      ].join('\n'),
    );

    const knowledge = await parseKnowledge(dir);
    expect(knowledge.fragments.every((fragment) => fragment.generated === true)).toBe(true);
    expect(substitutionRules(knowledge)).toEqual([]);
  });

  it('produces no page rule, however plainly it states an order', async () => {
    await write(
      'pages.md',
      [
        '<!-- uic:generated v=0.13.0 at=2026-08-11 -->',
        '# Pages',
        '',
        '## List screens',
        '',
        'A list screen is `<PageLayout>` holding, in order: `<PageHeader>`, `<Content>`.',
      ].join('\n'),
    );

    expect(pageRules(await parseKnowledge(dir))).toEqual([]);
  });

  it('states no prop set a check may enforce', async () => {
    await write(
      'components.md',
      [
        '<!-- uic:generated v=0.13.0 at=2026-08-11 -->',
        '# Components',
        '',
        '## Button',
        '',
        'The stories show `<Button variant="contained">` and `<Button variant="text">`.',
      ].join('\n'),
    );

    const knowledge = await parseKnowledge(dir);
    const screen = join(root, 'Screen.tsx');
    await writeFile(screen, 'export const Screen = () => <Button variant="ghost" />;\n', 'utf8');

    const model = await knowledgeSource(knowledge).describe(screen);
    // The vocabulary survives — it is advice, and advice is the point of
    // generating anything. The prop values do not, because those gate.
    expect(model?.components).toContain('Button');
    expect(statedConventions(model)).toEqual({});
  });

  it('still reaches the agent as context', async () => {
    await write(
      'components.md',
      [
        '<!-- uic:generated v=0.13.0 at=2026-08-11 -->',
        '# Components',
        '',
        '## WidgetCard',
        '',
        '`<WidgetCard>` is the wrapper every dashboard widget sits in.',
      ].join('\n'),
    );

    const knowledge = await parseKnowledge(dir);
    const found = retrieve('export const W = () => <WidgetCard />;', knowledge, {
      filePath: 'Widget.tsx',
    });
    expect(found.map((fragment) => fragment.subject)).toContain('WidgetCard');
  });

  it('gates again the moment a person removes the marker', async () => {
    await write(
      'components.md',
      ['# Components', '', '## Cards', '', 'A widget uses `<WidgetCard>`, never a raw `<Paper>`.'].join(
        '\n',
      ),
    );

    const rules = substitutionRules(await parseKnowledge(dir));
    expect(rules).toHaveLength(1);
    expect(rules[0]!.canonical).toBe('WidgetCard');
    expect(rules[0]!.forbidden).toContain('Paper');
  });
});

describe('the marker is read leniently, because a model may write the file', () => {
  const cases: [string, string][] = [
    ['a BOM', '﻿<!-- uic:generated v=0.13.0 at=2026-08-11 -->\n# C\n\n## R\n\nNever `<Paper>`; use `<Card>`.'],
    ['CRLF', '<!-- uic:generated v=0.13.0 at=2026-08-11 -->\r\n# C\r\n\r\n## R\r\n\r\nUse `<Card>`, never `<Paper>`.'],
    ['a blank first line', '\n\n<!-- uic:generated v=0.13.0 at=2026-08-11 -->\n# C\n\n## R\n\nUse `<Card>`, never `<Paper>`.'],
    ['odd spacing and case', '<!--uic:generated   V=0.13.0  at=2026-08-11-->\n# C\n\n## R\n\nUse `<Card>`, never `<Paper>`.'],
  ];

  for (const [what, body] of cases) {
    it(`recognises a marker written with ${what}`, async () => {
      await write('components.md', body);
      const knowledge = await parseKnowledge(dir);
      expect(knowledge.fragments.length).toBeGreaterThan(0);
      expect(knowledge.fragments.every((fragment) => fragment.generated === true)).toBe(true);
      expect(substitutionRules(knowledge)).toEqual([]);
    });
  }
});

describe('an HTML comment states nothing', () => {
  // The instructions `uic init` writes to the reader contain the example
  // sentence "A page of actions uses `<ActionGrid>`, never a raw `<Grid>`".
  // Read as prose it was a real prohibition about components the project may
  // not even have — a rule nobody wrote, failing checks.
  it('never becomes a rule', async () => {
    await write(
      'components.md',
      [
        '# Components',
        '',
        '<!--',
        'Turn a line of this into a rule by saying what is forbidden:',
        '    A page of actions uses `<ActionGrid>`, never a raw `<Grid>`.',
        '-->',
        '',
        '## Button',
        '',
        'Used on 4 of the 9 screens read.',
      ].join('\n'),
    );

    const rules = substitutionRules(await parseKnowledge(dir));
    expect(rules).toEqual([]);
  });

});

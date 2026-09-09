import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parsePattern,
  patternFiles,
  patternForScreen,
  staleIn,
} from '../../src/knowledge/pattern-file.js';

const FILE = `---
pattern: list-screen
surface: screen
holder: PageShell
observed: 2026-09-09
---

# List screen

## Structure

\`\`\`
PageShell                  9 of 9
  FilterBar                9 of 9
  <content>                exactly one
\`\`\`

## Slots

### \`<content>\`
One of: a grid named \`*Grid\` (7 of 9), a card list (2 of 9).

## Rules

- The filter's selection descends as props.
- Actions are always rendered; gating toggles \`disabled\` only.

## Where it is used

\`src/pages/OrdersPage.tsx\`, \`src/pages/InvoicesPage.tsx\`
`;

describe('a pattern as a project has written it down', () => {
  const pattern = parsePattern('list-screen.md', FILE);

  it('reads the frontmatter the selection needs', () => {
    expect(pattern.name).toBe('list-screen');
    expect(pattern.holder).toBe('PageShell');
    expect(pattern.surface).toBe('screen');
    expect(pattern.observed).toBe('2026-09-09');
  });

  it('reads the structure block as depth and name, keeping the strength as written', () => {
    // `9 of 9` and `exactly one` are both things a person writes and only the
    // first is arithmetic, so neither is parsed into a number.
    expect(pattern.structure).toEqual([
      { indent: 0, name: 'PageShell', strength: '9 of 9' },
      { indent: 1, name: 'FilterBar', strength: '9 of 9' },
      { indent: 1, name: '<content>', strength: 'exactly one' },
    ]);
  });

  it('keeps the rules as the prose they are', () => {
    // A checker cannot evaluate "actions are always rendered; gating toggles
    // disabled only", and one that parsed it into a boolean would report a
    // screen as matching a sentence it never read.
    expect(pattern.rules).toHaveLength(2);
    expect(pattern.rules[1]).toContain('gating toggles');
  });

  it('reads the files it says it describes', () => {
    expect(pattern.members).toEqual(['src/pages/OrdersPage.tsx', 'src/pages/InvoicesPage.tsx']);
  });

  it('reads a file missing every optional section rather than refusing it', () => {
    // This is a document a person writes and reviews. A format that refuses to
    // read one because a heading is missing is a format that fights its author.
    const bare = parsePattern('bare.md', '# Something\n\nJust prose.\n');
    expect(bare.name).toBe('bare');
    expect(bare.structure).toEqual([]);
    expect(bare.members).toEqual([]);
  });
});

describe('which pattern describes a screen', () => {
  const list = parsePattern('list-screen.md', FILE);
  const other = parsePattern(
    'detail.md',
    '---\npattern: detail\nholder: PageShell\n---\n\n# Detail\n',
  );

  it('prefers the pattern that names the file over one whose holder matches', () => {
    // Naming a file is a person saying so; a holder match is an inference.
    expect(patternForScreen([list, other], 'src/pages/OrdersPage.tsx', 'PageShell')).toBe(list);
  });

  it('answers none where two patterns claim the holder and neither names the file', () => {
    // The honest answer to an ambiguous question is nothing rather than the
    // nearest guess — the same rule the contract check follows.
    expect(patternForScreen([list, other], 'src/pages/NewPage.tsx', 'PageShell')).toBeNull();
  });

  it('answers none where nothing readable holds the screen', () => {
    expect(patternForScreen([list], 'src/pages/NewPage.tsx', null)).toBeNull();
  });

  it('matches on the holder where exactly one pattern claims it', () => {
    expect(patternForScreen([list], 'src/pages/NewPage.tsx', 'PageShell')).toBe(list);
  });
});

describe('what has moved under a pattern', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'uic-pattern-file-'));
    await mkdir(join(root, '.ui-consistency/patterns'), { recursive: true });
    await mkdir(join(root, 'src/pages'), { recursive: true });
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('tells a file that changed from one that is gone', async () => {
    // Two different things to do about it. One sentence covering both sends a
    // reader to look at a file that is not there.
    const path = join(root, 'src/pages/OrdersPage.tsx');
    await writeFile(path, 'export const P = () => <X />;\n');
    // Two days after the pattern was observed. Written explicitly, because a
    // file written *now* is within the observed day and correctly not stale —
    // which is what this test asserted first, and it passed for the wrong reason.
    const after = new Date('2026-09-11T09:00:00Z');
    await utimes(path, after, after);

    const stale = await staleIn(root, parsePattern('list-screen.md', FILE));

    expect(stale).toContainEqual({ file: 'src/pages/OrdersPage.tsx', why: 'changed' });
    expect(stale).toContainEqual({ file: 'src/pages/InvoicesPage.tsx', why: 'gone' });
  });

  it('says nothing about a file untouched since the pattern was observed', async () => {
    // The date is a day, not an instant: a file written during that day is not
    // evidence of drift.
    for (const name of ['OrdersPage', 'InvoicesPage']) {
      const path = join(root, `src/pages/${name}.tsx`);
      await writeFile(path, 'export const P = () => <X />;\n');
      const when = new Date('2026-09-09T09:00:00Z');
      await utimes(path, when, when);
    }

    expect(await staleIn(root, parsePattern('list-screen.md', FILE))).toEqual([]);
  });

  it('reads every pattern file in the directory, and none is not an error', async () => {
    expect((await patternFiles(root)).patterns).toEqual([]);

    await writeFile(join(root, '.ui-consistency/patterns/list-screen.md'), FILE);
    const { patterns } = await patternFiles(root);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]!.name).toBe('list-screen');
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseKnowledge } from '../../src/knowledge/parse.js';
import { retrieve } from '../../src/knowledge/retrieve.js';
import type { Knowledge } from '../../src/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(here, '../fixtures/knowledge');

const WIDGET = `
import { WidgetCard } from '@fixture/widgets';
import { Typography } from '@fixture/core';

export function RevenueWidget({ total }) {
  return (
    <WidgetCard>
      <Typography variant="h6">Revenue</Typography>
      <span>📈</span>
      <p>{total}</p>
    </WidgetCard>
  );
}
`;

const FORM = `
import { FormLayout, FormField } from '@fixture/forms';

export function CustomerForm() {
  return (
    <FormLayout>
      <FormField name="email" />
    </FormLayout>
  );
}
`;

const UNRELATED = `
export function parseTimestamp(value) {
  return new Date(value).toISOString();
}
`;

let knowledge: Knowledge;

beforeAll(async () => {
  knowledge = await parseKnowledge(DIR);
});

describe('lexical retrieval', () => {
  it('returns the rules about what the file is, ranked', () => {
    const fragments = retrieve(WIDGET, knowledge);
    expect(fragments.length).toBeGreaterThan(0);
    expect(fragments.every((f) => f.kind === 'widgets')).toBe(true);
  });

  it('does not return the rules about everything else', () => {
    // The cost guarantee. If unrelated rules come back, every token estimate
    // downstream is fiction.
    const kinds = new Set(retrieve(WIDGET, knowledge).map((f) => f.kind));
    expect(kinds.has('forms')).toBe(false);
    expect(kinds.has('detail-screens')).toBe(false);
  });

  it('picks the form rules for a form, by the same rule', () => {
    const kinds = new Set(retrieve(FORM, knowledge).map((f) => f.kind));
    expect(kinds).toEqual(new Set(['forms']));
  });

  it('returns nothing for code the knowledge base says nothing about', () => {
    expect(retrieve(UNRELATED, knowledge)).toEqual([]);
  });

  it('returns nothing when there is no knowledge base', () => {
    expect(retrieve(WIDGET, { fragments: [] })).toEqual([]);
  });

  it('caps how many fragments come back', () => {
    expect(retrieve(WIDGET, knowledge, { maxFragments: 2 }).length).toBeLessThanOrEqual(2);
    expect(retrieve(WIDGET, knowledge).length).toBeLessThanOrEqual(4);
  });

  it('caps the total size, whatever the count allows', () => {
    const cap = 200;
    const fragments = retrieve(WIDGET, knowledge, { maxChars: cap });
    const total = fragments.reduce((sum, f) => sum + f.body.length, 0);
    expect(total).toBeLessThanOrEqual(cap);
    // A cap that returns nothing at all would be a cap that hides the answer.
    expect(fragments.length).toBeGreaterThan(0);
  });

  it('never lets one enormous rule through the size cap', () => {
    const huge: Knowledge = {
      fragments: [
        {
          id: 'widgets#huge',
          kind: 'widgets',
          subject: 'Widget shell',
          body: 'x'.repeat(50_000),
          keywords: ['widget', 'widgetcard'],
        },
      ],
    };
    expect(retrieve(WIDGET, huge, { maxChars: 1000 })).toEqual([]);
  });

  it('ranks the rule naming a component the file uses above a general one', () => {
    const fragments = retrieve(WIDGET, knowledge);
    const shell = fragments.findIndex((f) => f.subject === 'Widget shell');
    const intro = fragments.findIndex((f) => f.subject === 'Dashboard widgets');
    expect(shell).toBeGreaterThanOrEqual(0);
    // `WidgetCard` is used by this file; the preamble names no component.
    expect(intro === -1 || shell < intro).toBe(true);
  });

  it('says nothing about a file that does not parse', () => {
    expect(retrieve('export function Broken( {', knowledge)).toEqual([]);
  });

  it('does not match a rule on the word "component"', () => {
    // Found on Backstage: `Link component` and `Table component` came back for
    // 70% of all files, because a relative import of `../../components/Avatar`
    // put "component" among the file's terms and a subject hit clears the
    // relevance floor on its own.
    const base: Knowledge = {
      fragments: [
        {
          id: 'links#link-component',
          kind: 'links',
          subject: 'Link component',
          body: 'Navigation is <Link to=...>.',
          keywords: ['link'],
        },
      ],
    };
    const source =
      "import { Avatar } from '../../components/Avatar';\nexport const A = () => <Avatar />;\n";
    expect(retrieve(source, base)).toEqual([]);
  });

  it('still matches when the rule is about something the file imports', () => {
    const base: Knowledge = {
      fragments: [
        {
          id: 'links#link-component',
          kind: 'links',
          subject: 'Link component',
          body: 'Navigation is <Link to=...>.',
          keywords: ['link'],
        },
      ],
    };
    const source = "import { Link } from '@fixture/core';\nexport const A = () => <Link />;\n";
    expect(retrieve(source, base)).toHaveLength(1);
  });
});

describe('the cost guarantee holds as the knowledge base grows', () => {
  /** Thirty kinds, four rules each — a knowledge base nobody would hand-read. */
  function largeBase(): Knowledge {
    const fragments = [];
    for (let kind = 0; kind < 30; kind++) {
      for (let rule = 0; rule < 4; rule++) {
        fragments.push({
          id: `kind${kind}#rule${rule}`,
          kind: `widgets`,
          subject: `Widget rule ${kind}-${rule}`,
          body: `Widgets use <WidgetCard> and <Typography variant="h6">. `.repeat(6),
          keywords: ['widget', 'widgetcard', 'typography'],
        });
      }
    }
    return { fragments };
  }

  it('sends the same small context whether the base has 3 rules or 120', () => {
    const base = largeBase();
    expect(base.fragments.length).toBe(120);

    const fragments = retrieve(WIDGET, base);
    expect(fragments.length).toBeLessThanOrEqual(4);
    const total = fragments.reduce((sum, f) => sum + f.body.length, 0);
    expect(total).toBeLessThanOrEqual(2000);
  });

  it('ranks before it caps, so the cap cannot hide the best rule', () => {
    const base = largeBase();
    base.fragments.push({
      id: 'widgets#best',
      kind: 'widgets',
      subject: 'Widget shell RevenueWidget',
      body: 'The one rule naming what this file actually is.',
      keywords: ['widget', 'widgetcard', 'revenuewidget', 'typography'],
    });
    // Last in the array, first out of the retriever.
    expect(retrieve(WIDGET, base)[0]!.id).toBe('widgets#best');
  });
});

describe('what the file is called counts too', () => {
  const widgets: Knowledge = {
    fragments: [
      {
        id: 'widgets#shell',
        kind: 'widgets',
        subject: 'Widget shell',
        body: 'Every widget is wrapped in <WidgetCard>.',
        keywords: ['widget', 'widgetcard'],
      },
    ],
  };

  it('uses the path when the code inside says nothing about what it is', () => {
    // A file called RevenueWidget.tsx is a widget even if its component is
    // called `P` — and the rules about widgets should reach it.
    const anonymous = 'export const P = () => <LegacyCard />;\n';
    expect(retrieve(anonymous, widgets)).toEqual([]);
    expect(retrieve(anonymous, widgets, { filePath: '/repo/src/RevenueWidget.tsx' })).toHaveLength(1);
  });

  it('does not let a directory name drag in every rule', () => {
    const anonymous = 'export const P = () => <LegacyCard />;\n';
    expect(retrieve(anonymous, widgets, { filePath: '/repo/src/components/P.tsx' })).toEqual([]);
  });
});

describe('a caller that already knows what is in the file', () => {
  const pages: Knowledge = {
    fragments: [
      {
        id: 'pages#grids',
        kind: 'pages',
        subject: 'Action grids',
        body: 'A page of actions uses <app-action-grid>.',
        keywords: ['grid', 'app-action-grid'],
      },
    ],
  };

  it('can supply the terms itself, for source it can read and this cannot', () => {
    // A template is not JavaScript: the parser returns nothing for it, so a
    // retrieval that only reads JS found no rules and every curated rule was
    // silent on Angular, Vue and Svelte.
    //
    // Note the binding syntax. A bare HTML fragment happens to be valid JSX
    // and parses by accident; `*ngFor` is what a real template looks like and
    // is what actually fails.
    const html = '<app-grid *ngFor="let r of rows" [row]="r"><button>x</button></app-grid>';
    expect(retrieve(html, pages)).toEqual([]);
    expect(retrieve(html, pages, { terms: ['app-grid', 'page'] })).toHaveLength(1);
  });
});

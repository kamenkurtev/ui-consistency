import { describe, it, expect } from 'vitest';
import { pageRules } from '../../src/knowledge/page-rules.js';
import { pageFindings } from '../../src/checks/page.js';
import type { Knowledge } from '../../src/types.js';

const RULES: Knowledge = {
  fragments: [
    {
      id: 'pages#list',
      kind: 'pages',
      subject: 'List pages',
      body:
        'A list page is `<PageLayout>` holding, in order: `<PageHeader>`, ' +
        '`<Breadcrumbs>`, `<Content>`, then `<PageFooter>`.',
      keywords: ['page', 'list'],
    },
  ],
};

const correct = `
export function OrdersPage() {
  return (
    <PageLayout>
      <PageHeader title="Orders" />
      <Breadcrumbs items={c} />
      <Content><DataGrid /></Content>
      <PageFooter />
    </PageLayout>
  );
}`;

describe('reading a page rule', () => {
  it('reads the holder and the order it names', () => {
    const rules = pageRules(RULES);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.holder).toBe('PageLayout');
    expect(rules[0]!.order).toEqual(['header', 'breadcrumbs', 'content', 'footer']);
  });

  it('needs the words "in order" — a list of components is not a sequence', () => {
    const loose: Knowledge = {
      fragments: [
        {
          id: 'pages#x',
          kind: 'pages',
          subject: 'Pages',
          body: 'Pages use `<PageLayout>`, `<PageHeader>` and `<Content>`.',
          keywords: [],
        },
      ],
    };
    expect(pageRules(loose)).toEqual([]);
  });
});

describe('checking a page against it', () => {
  const rules = pageRules(RULES);

  it('says nothing about a page that follows it', () => {
    expect(pageFindings('OrdersPage.tsx', correct, rules)).toEqual([]);
  });

  it('names a region that is missing', () => {
    const noFooter = correct.replace('      <PageFooter />\n', '');
    const findings = pageFindings('OrdersPage.tsx', noFooter, rules);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.level).toBe('page-pattern');
    expect(findings[0]!.message).toContain('footer');
  });

  it('names a region that is out of order', () => {
    const shuffled = `
      export function InvoicesPage() {
        return (
          <PageLayout>
            <Content><DataGrid /></Content>
            <PageHeader title="Invoices" />
            <Breadcrumbs items={c} />
            <PageFooter />
          </PageLayout>
        );
      }`;
    const findings = pageFindings('InvoicesPage.tsx', shuffled, rules);
    expect(findings.some((f) => f.message.includes('order'))).toBe(true);
  });

  it('says nothing about a page built on a holder no rule names', () => {
    // There is no wrong-holder finding, deliberately. A rule claims a page by
    // naming its holder, so a page with a different holder is claimed by
    // nothing — and "you used the wrong layout" cannot be said until
    // something else establishes which kind of page this is. Nothing does.
    const wrongHolder = correct.replace(/PageLayout/g, 'Box');
    expect(pageFindings('OrdersPage.tsx', wrongHolder, rules)).toEqual([]);
  });

  it('says nothing when the project has written no page rule', () => {
    expect(pageFindings('OrdersPage.tsx', correct, [])).toEqual([]);
  });

  it('says nothing about a file that is not a page at all', () => {
    expect(pageFindings('util.ts', 'export const add = (a, b) => a + b;', rules)).toEqual([]);
  });
});

describe('which rule applies, when a project has several', () => {
  const two: Knowledge = {
    fragments: [
      {
        id: 'pages#list',
        kind: 'pages',
        subject: 'List pages',
        body: 'A list page is `<PageLayout>` holding, in order: `<PageHeader>`, `<Breadcrumbs>`, `<Content>`, then `<PageFooter>`.',
        keywords: [],
      },
      {
        id: 'pages#detail',
        kind: 'pages',
        subject: 'Detail pages',
        body: 'A detail page is `<PageLayout>` holding, in order: `<PageHeader>`, `<Content>`.',
        keywords: [],
      },
    ],
  };

  it('says nothing when two rules claim the same holder', () => {
    // Both page kinds sit in <PageLayout>, which is the normal case — a
    // project usually has one layout. Picking whichever rule came back first
    // told a correct detail page it was missing breadcrumbs and a footer.
    const detail = `
      export const P = () => (
        <PageLayout><PageHeader /><Content><Detail /></Content></PageLayout>
      );`;
    expect(pageFindings('CustomerPage.tsx', detail, pageRules(two))).toEqual([]);
  });

  it('says nothing about a page whose holder no rule names', () => {
    // Guessing by overlap always produced a wrong-holder finding, by
    // construction — the guess is what put the rule there.
    const odd = 'export const P = () => (<Box><PageHeader /><Content><A /></Content></Box>);';
    expect(pageFindings('Odd.tsx', odd, pageRules(two))).toEqual([]);
  });
});

describe('reading the holder out of prose', () => {
  it('takes the holder the rule states, not one it mentions in passing', () => {
    const mentioning: Knowledge = {
      fragments: [
        {
          id: 'pages#list',
          kind: 'pages',
          subject: 'List pages',
          body: 'Unlike `<LegacyShell>`, a list page is `<PageLayout>` holding, in order: `<PageHeader>`, `<Content>`.',
          keywords: [],
        },
      ],
    };
    expect(pageRules(mentioning)[0]!.holder).toBe('PageLayout');
  });
});

describe('a region that appears twice', () => {
  it('is not an ordering violation', () => {
    const twoContents = `
      export const P = () => (
        <PageLayout>
          <PageHeader />
          <Breadcrumbs />
          <Content><A /></Content>
          <Content><B /></Content>
          <PageFooter />
        </PageLayout>
      );`;
    expect(pageFindings('OrdersPage.tsx', twoContents, pageRules(RULES))).toEqual([]);
  });
});

describe('how a rule may spell a component', () => {
  it('reads one written without backticks', () => {
    // `rules.ts` accepts `<Name` bare or backticked; `page-rules.ts` accepted
    // only the backticked form, so the same spelling parsed in one file and
    // silently not in the other.
    const plain: Knowledge = {
      fragments: [
        {
          id: 'pages#list',
          kind: 'pages',
          subject: 'List pages',
          body: 'A list page is <PageLayout> holding, in order: <PageHeader>, <Content>.',
          keywords: [],
        },
      ],
    };
    const rules = pageRules(plain);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.holder).toBe('PageLayout');
    expect(rules[0]!.order).toEqual(['header', 'content']);
  });
});

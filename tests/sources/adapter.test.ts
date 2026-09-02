import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { referenceSource } from '../../src/sources/reference.js';
import { storybookSource } from '../../src/sources/storybook.js';
import { neighbourSource } from '../../src/sources/neighbours.js';
import { knowledgeSource } from '../../src/sources/knowledge.js';
import { resolveSource, statedConventions } from '../../src/sources/adapter.js';
import { parseKnowledge } from '../../src/knowledge/parse.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(here, '../fixtures/sources');
const REFERENCE = resolve(FIXTURES, 'screens/OrderDetail.tsx');
const TARGET = resolve(FIXTURES, 'screens/NewDetail.tsx');

describe('the reference page, the strongest source', () => {
  it('names the components the reference is built from', async () => {
    const model = await referenceSource(REFERENCE).describe(TARGET);
    expect(model!.components).toContain('DetailLayout');
    expect(model!.components).toContain('InfoCard');
    expect(model!.kind).toBe('reference');
    expect(model!.heuristic).not.toBe(true);
  });

  it('reads the layout pattern outermost first', async () => {
    const model = await referenceSource(REFERENCE).describe(TARGET);
    expect(model!.pattern[0]).toBe('DetailLayout');
    expect(model!.pattern).toContain('DetailHeader');
  });

  it('collects the prop values the reference actually uses', async () => {
    const model = await referenceSource(REFERENCE).describe(TARGET);
    expect(model!.props['Button']?.['variant']).toEqual(['contained']);
    expect(model!.props['InfoCard']?.['variant']).toEqual(['outlined']);
  });

  it('is null when the reference is not there', async () => {
    const model = await referenceSource(resolve(FIXTURES, 'absent.tsx')).describe(TARGET);
    expect(model).toBeNull();
  });
});

describe('the knowledge base as a source', () => {
  it('reads the components a curated rule names', async () => {
    const knowledge = await parseKnowledge(resolve(here, '../fixtures/knowledge'));
    const model = await knowledgeSource(knowledge).describe(
      resolve(FIXTURES, 'screens/RevenueWidget.tsx'),
    );
    expect(model!.kind).toBe('knowledge');
    expect(model!.components).toContain('WidgetCard');
    expect(model!.props['Typography']?.['variant']).toEqual(['h6']);
  });

  it('is null when the knowledge base is empty', async () => {
    expect(await knowledgeSource({ fragments: [] }).describe(TARGET)).toBeNull();
  });
});

describe('storybook, read statically', () => {
  it('takes the canonical component and its argument sets from the stories', async () => {
    const model = await storybookSource(FIXTURES).describe(TARGET);
    expect(model!.kind).toBe('storybook');
    expect(model!.components).toContain('Button');
    expect(model!.props['Button']?.['variant']?.sort()).toEqual(['contained', 'outlined']);
    expect(model!.props['Button']?.['size']?.sort()).toEqual(['medium', 'small']);
  });

  it('is null where there are no stories', async () => {
    expect(await storybookSource(resolve(FIXTURES, 'screens')).describe(TARGET)).toBeNull();
  });

  it('does not mistake story content for a set of allowed values', async () => {
    // Backstage's own stories: `title: "This is an alert message"` is the demo
    // text, not an enumeration. Taken as a convention it would fault every
    // other title in the product.
    const model = await storybookSource(FIXTURES).describe(TARGET);
    expect(model!.props['Alert']?.['title']).toBeUndefined();
    expect(model!.props['Alert']?.['severity']?.sort()).toEqual(['error', 'warning']);
  });

  it('does not take a free-text prop as a set, whatever the values look like', async () => {
    // `label: 'Quantity'` is one word and still not an enumeration.
    const model = await storybookSource(FIXTURES).describe(TARGET);
    expect(model!.props['Alert']?.['label']).toBeUndefined();
  });

  it('does not take a single value as a set', async () => {
    // One story showing one value cannot distinguish a closed set from a
    // default, and a set of one faults everything else.
    const model = await storybookSource(FIXTURES).describe(TARGET);
    expect(model!.props['Alert']?.['elevation']).toBeUndefined();
  });
});

describe('neighbours, the weakest source', () => {
  it('derives what the screens beside this one have in common', async () => {
    const model = await neighbourSource().describe(TARGET);
    expect(model!.components).toContain('DetailLayout');
    expect(model!.pattern[0]).toBe('DetailLayout');
  });

  it('is always flagged as a heuristic', async () => {
    const model = await neighbourSource().describe(TARGET);
    expect(model!.heuristic).toBe(true);
    expect(model!.kind).toBe('neighbours');
  });

  it('does not offer prop conventions, which would enforce a common mistake', async () => {
    // Curated, never inferred: what the siblings pass is what happens to be
    // there, and a value repeated by copy-paste is not a rule.
    const model = await neighbourSource().describe(TARGET);
    expect(model!.props).toEqual({});
  });

  it('is null with too few siblings to mean anything', async () => {
    expect(await neighbourSource().describe(resolve(FIXTURES, 'alone/X.tsx'))).toBeNull();
  });
});

describe('the cascade', () => {
  it('prefers the reference over everything else', async () => {
    const resolved = await resolveSource(TARGET, { reference: REFERENCE, storybookDir: FIXTURES });
    expect(resolved!.kind).toBe('reference');
  });

  it('falls to the knowledge base when no reference is named', async () => {
    const knowledge = await parseKnowledge(resolve(here, '../fixtures/knowledge'));
    const resolved = await resolveSource(resolve(FIXTURES, 'screens/RevenueWidget.tsx'), {
      knowledge,
      storybookDir: FIXTURES,
    });
    expect(resolved!.kind).toBe('knowledge');
  });

  it('falls to storybook when there is neither', async () => {
    const resolved = await resolveSource(TARGET, { storybookDir: FIXTURES });
    expect(resolved!.kind).toBe('storybook');
  });

  it('falls to the neighbours last', async () => {
    const resolved = await resolveSource(TARGET, {});
    expect(resolved!.kind).toBe('neighbours');
    expect(resolved!.heuristic).toBe(true);
  });

  it('is null when nothing applies, and the tool then says nothing', async () => {
    const resolved = await resolveSource(resolve(FIXTURES, 'alone/X.tsx'), {});
    expect(resolved).toBeNull();
  });
});

describe('which sources may gate a prop value', () => {
  it('takes conventions from a reference, which someone pointed at', async () => {
    const model = await referenceSource(REFERENCE).describe(TARGET);
    expect(statedConventions(model)['Button']?.['variant']).toEqual(['contained']);
  });

  it('refuses them from storybook, which demonstrates rather than declares', async () => {
    // Backstage's stories give `Flex.gap = ["4", "8"]` — the two gaps someone
    // chose to show. A gap of 2 is not thereby wrong, and gating on the set
    // would fault correct code.
    const model = await storybookSource(FIXTURES).describe(TARGET);
    expect(model!.props['Button']).toBeDefined();
    expect(statedConventions(model)).toEqual({});
  });

  it('refuses them from the neighbours, and from nothing at all', async () => {
    expect(statedConventions(await neighbourSource().describe(TARGET))).toEqual({});
    expect(statedConventions(null)).toEqual({});
  });
});

describe('how deep the storybook scan goes', () => {
  it('does not find stories buried deeper than its budget', async () => {
    // The cascade runs inside an edit, so it looks shallowly on purpose.
    const model = await storybookSource(resolve(FIXTURES, '../..'), { depth: 0 }).describe(TARGET);
    expect(model).toBeNull();
  });

  it('finds them when a caller can afford to look', async () => {
    // `uic init` is a deliberate command where seconds are free — and in
    // Backstage every story is four or more directories down, so a shallow
    // scan drafts nothing at all.
    const model = await storybookSource(resolve(FIXTURES, '../..'), { depth: 8 }).describe(TARGET);
    expect(model!.components).toContain('Button');
  });
});

describe('what kind of screen it is travels with the source model', () => {
  it('a reference screen carries the holder it sits in', async () => {
    const model = await referenceSource(REFERENCE).describe(TARGET);
    expect(model!.holder).toBeDefined();
  });

  it('the neighbours carry the holder their files agree on', async () => {
    // Three sibling detail screens in tests/fixtures/sources/screens, all of
    // them held by `DetailLayout` — a name this tool has never heard of, which
    // is the point of reading the structure instead of a list (#226).
    const model = await neighbourSource().describe(TARGET);
    expect(model!.holder).toBe('DetailLayout');
  });
});

/**
 * The neighbour source, in the dialects the tolerant parser exists to read
 * (#251).
 *
 * `shapeOf` is JSX-only, and `neighbourSource` dropped every sibling it
 * returned null for *before* counting one — so on a template project `read`
 * stayed 0, the quorum guard discarded the whole source, and the "what the
 * screens beside it look like" half of the advisory never appeared. Every
 * dialect the tolerant HTML parser exists for fell out before that parser was
 * reached.
 *
 * The same shape as #149, one function over: a reading dead on every template
 * dialect, arriving as an ordinary empty answer.
 */
describe('what the screens beside a template screen look like', () => {
  const family = async (): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), 'uic-ngneighbours-'));
    await mkdir(join(dir, 'screens'), { recursive: true });
    for (const name of ['orders', 'invoices', 'customers', 'reports']) {
      await writeFile(
        join(dir, `screens/${name}.component.html`),
        `<mat-card appearance="outlined"><app-${name}-grid></app-${name}-grid></mat-card>\n`,
        'utf8',
      );
    }
    return join(dir, 'screens/orders.component.html');
  };

  it('is read, rather than discarded before it is counted', async () => {
    const target = await family();
    const model = await neighbourSource().describe(target);

    expect(model).not.toBeNull();
    expect(model!.components).toContain('mat-card');
    await rm(join(target, '../..'), { recursive: true, force: true });
  });

  it('carries the holder the templates agree on', async () => {
    const target = await family();
    const model = await neighbourSource().describe(target);

    expect(model!.holder).toBe('mat-card');
    await rm(join(target, '../..'), { recursive: true, force: true });
  });

  it('carries the opening chain, which used to be JSX’s alone', async () => {
    // The chain is compared whole, not element by element, so it is reported
    // only where the screens share one — which is why the family above, whose
    // grids differ per screen, correctly agrees on nothing.
    const dir = await mkdtemp(join(tmpdir(), 'uic-ngchain-'));
    await mkdir(join(dir, 'screens'), { recursive: true });
    for (const name of ['orders', 'invoices', 'customers', 'reports']) {
      await writeFile(
        join(dir, `screens/${name}.component.html`),
        '<mat-card appearance="outlined"><app-results-grid></app-results-grid></mat-card>\n',
        'utf8',
      );
    }

    const model = await neighbourSource().describe(join(dir, 'screens/orders.component.html'));
    expect(model!.pattern).toEqual(['mat-card', 'app-results-grid']);
    await rm(dir, { recursive: true, force: true });
  });

  it('reports no chain where the screens do not share one', async () => {
    const target = await family();
    const model = await neighbourSource().describe(target);

    expect(model!.pattern).toEqual([]);
    await rm(join(target, '../..'), { recursive: true, force: true });
  });
});

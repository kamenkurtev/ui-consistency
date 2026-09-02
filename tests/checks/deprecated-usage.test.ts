import { describe, it, expect } from 'vitest';
import { deprecatedUsageFindings } from '../../src/checks/deprecated-usage.js';
import type { Inventory, Layer } from '../../src/types.js';

const FILE = 'apps/orders/widgets/Revenue.tsx';

const CHAIN: Layer[] = [
  { name: '@orders/app', root: '/repo/apps/orders', dependencies: ['@orders/common'] },
  { name: '@orders/common', root: '/repo/packages/common', dependencies: [] },
];

const INVENTORY: Inventory = {
  layers: {
    '@orders/common': {
      LegacyCard: { deprecated: true, replacement: 'SurfaceCard' },
      OldChip: { deprecated: true, replacement: null },
      SurfaceCard: { deprecated: false, replacement: null },
    },
  },
};

function find(source: string) {
  return deprecatedUsageFindings(FILE, source, CHAIN, INVENTORY);
}

describe('usage of a deprecated component', () => {
  it('flags the element and names the replacement', () => {
    const source = "import { LegacyCard } from '@orders/common';\nexport const W = () => <LegacyCard title=\"x\" />;\n";
    const findings = find(source);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.level).toBe('deprecated');
    expect(findings[0]!.line).toBe(2);
    expect(findings[0]!.message).toContain('LegacyCard');
    expect(findings[0]!.message).toContain('SurfaceCard');
    expect(findings[0]!.replacement).toBe('SurfaceCard');
  });

  it('flags each usage, not each import', () => {
    // v1 already catches the import. The point of widening it to usage is the
    // file that imports once and renders in four places.
    const source =
      "import { LegacyCard } from '@orders/common';\nexport const W = () => (<div><LegacyCard /><LegacyCard /></div>);\n";
    expect(find(source)).toHaveLength(2);
  });

  it('flags one with no replacement to name', () => {
    const source = "import { OldChip } from '@orders/common';\nexport const W = () => <OldChip />;\n";
    const findings = find(source);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.replacement).toBeUndefined();
  });

  it('follows the local name of an aliased import', () => {
    const source =
      "import { LegacyCard as Card } from '@orders/common';\nexport const W = () => <Card />;\n";
    const findings = find(source);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('LegacyCard');
  });

  it('is silent on a component that is not deprecated', () => {
    const source = "import { SurfaceCard } from '@orders/common';\nexport const W = () => <SurfaceCard />;\n";
    expect(find(source)).toEqual([]);
  });

  it('is silent on a local component that merely shares the name', () => {
    // Nothing was imported, so the inventory entry is about a different thing.
    expect(find('const LegacyCard = () => null;\nexport const W = () => <LegacyCard />;\n')).toEqual([]);
  });

  it('is silent when the import comes from off the chain', () => {
    const source = "import { LegacyCard } from 'some-other-lib';\nexport const W = () => <LegacyCard />;\n";
    expect(find(source)).toEqual([]);
  });

  it('says nothing about a file that does not parse', () => {
    expect(find('export const W = ( {')).toEqual([]);
  });
});

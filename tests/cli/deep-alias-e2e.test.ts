import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkProject } from '../../src/cli/index.js';
import { clearPackageCache } from '../../src/layers/cache.js';

/**
 * #32. Detection was never the problem here — every package was found and
 * every inventory was right. The edges between them carried names that no
 * layer had, so `reaches` connected nothing and the check went quiet across a
 * whole repository while looking perfectly healthy.
 */
const root = fileURLToPath(new URL('../fixtures/deep-alias', import.meta.url));

describe('checkProject with deep scoped aliases', () => {
  beforeAll(async () => {
    await clearPackageCache(root);
  });

  it('reports the symbol taken from the outer layer when a deeper one exports it', async () => {
    const file = join(root, 'libs/client-ui/customers/invoices/src/InvoicePanel.tsx');
    const violations = await checkProject(root, [file]);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      symbol: 'Drawer',
      importedFrom: '@fixture/ui',
      expectedFrom: '@fixture/client-ui/common',
    });
  });
});

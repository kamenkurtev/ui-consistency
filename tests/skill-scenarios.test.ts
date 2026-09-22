import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The scenarios measure an agent against drift that is known to be there. An
 * edit to the fixture that quietly removes a drift turns a scenario into one the
 * agent passes by finding nothing — the same shape as a check that ran over
 * nothing.
 */
const root = fileURLToPath(new URL('./skill-scenarios/fixture/', import.meta.url));
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('the skill-scenario fixture', () => {
  const shipments = read('src/pages/shipments.js');
  const siblings = ['orders', 'invoices', 'customers'].map((p) => read(`src/pages/${p}.js`));
  const theme = read('src/theme/theme.css');
  const components = read('src/theme/components.css');

  it('still carries every drift DRIFT.md lists', () => {
    expect(read('src/pages/index.js')).toMatch(/import \* as \w+ from '\.\/shipments\.js'/); // D1
    expect(shipments).toContain('btn--large'); // D2
    expect(shipments).toContain("email.includes('@')"); // D3
    expect(shipments).toContain('alert('); // D4
    expect(shipments).toContain('color: #c62828'); // D5
    expect(shipments).toContain('var(--color-accent)'); // D6
    expect(theme).not.toContain('--color-accent'); // D6
    expect(shipments).toContain('margin-top: 13px'); // D7
    expect(components).toMatch(/\.badge--muted \{ color: #b0b0b0/); // D8
    for (const page of [shipments, ...siblings]) {
      expect(page.match(/<label class="field">/g)?.length).toBe(2); // D9
    }
    expect(components).toMatch(/\.btn--large \{ font-size: 18px/); // D10
    expect(shipments).not.toMatch(/elements\.name|name: \{/); // D11
    expect(shipments).toContain("alert('Could not save.')"); // D12
    expect(shipments.match(/style="/g)?.length).toBe(2); // D13
    expect(shipments).toContain('class="badge--muted"'); // D14
    expect(components).not.toMatch(/\.badge \{/); // D14
    expect(shipments).toContain("import { showError }"); // D15
    expect(shipments).not.toContain('showError('); // D15
  });

  it('says nothing inside the copied tree about being a fixture', () => {
    const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((p) => statSync(join(root, p)).isFile());
    expect(files.length).toBeGreaterThan(5);
    for (const path of files) {
      expect(`${path}: ${read(path)}`).not.toMatch(/drift|planted|scenario|answer key|fixture/i);
    }
  });

  it('keeps the three siblings free of that drift, so the family agrees', () => {
    for (const page of siblings) {
      expect(page).toContain('btn--block');
      expect(page).toContain('validateForm');
      expect(page).toContain('showError');
      expect(page).toContain('name: { required: true }');
      expect(page).toContain('Could not save. Try again.');
      expect(page).not.toContain('style=');
      expect(page).not.toMatch(/alert\(|#[0-9a-f]{6}|\d+px|--color-accent/);
    }
  });
});

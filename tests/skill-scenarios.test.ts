import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The scenarios measure an agent against drift that is known to be there. An
 * edit to the fixture that quietly removes a drift turns a scenario into one the
 * agent passes by finding nothing — the same shape as a check that ran over
 * nothing.
 */
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(`./skill-scenarios/fixture/${path}`, import.meta.url)), 'utf8');

describe('the skill-scenario fixture', () => {
  const shipments = read('src/pages/shipments.js');
  const siblings = ['orders', 'invoices', 'customers'].map((p) => read(`src/pages/${p}.js`));
  const theme = read('src/theme/theme.css');

  it('still carries every drift DRIFT.md lists', () => {
    expect(read('src/pages/index.js')).toMatch(/import \* as \w+ from '\.\/shipments\.js'/); // D1
    expect(shipments).toContain('btn--large'); // D2
    expect(shipments).toContain("email.includes('@')"); // D3
    expect(shipments).toContain('alert('); // D4
    expect(shipments).toContain('color: #c62828'); // D5
    expect(shipments).toContain('var(--color-accent)'); // D6
    expect(theme).not.toContain('--color-accent'); // D6
    expect(shipments).toContain('margin-top: 13px'); // D7
    expect(read('src/theme/components.css')).toMatch(/\.badge--muted \{ color: #b0b0b0/); // D8
    for (const page of [shipments, ...siblings]) {
      expect(page.match(/<label class="field">/g)?.length).toBe(2); // D9
    }
  });

  it('keeps the three siblings free of that drift, so the family agrees', () => {
    for (const page of siblings) {
      expect(page).toContain('btn--block');
      expect(page).toContain('validateForm');
      expect(page).toContain('showError');
      expect(page).not.toMatch(/alert\(|#[0-9a-f]{6}|\d+px|--color-accent/);
    }
  });
});

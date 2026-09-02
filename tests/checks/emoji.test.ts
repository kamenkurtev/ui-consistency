import { describe, it, expect } from 'vitest';
import { emojiFindings } from '../../src/checks/emoji.js';

const FILE = 'apps/orders/widgets/Revenue.tsx';

/** A file in @orders/app, which depends on @orders/common, which wraps mui. */

function find(source: string): ReturnType<typeof emojiFindings> {
  return emojiFindings(FILE, source);
}

describe('emoji used as an icon', () => {
  it('flags an emoji-only element child', () => {
    const findings = find('export const W = () => <span>📈</span>;\n');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.level).toBe('reuse');
    expect(findings[0]!.message).toContain('📈');
  });

  it('flags an emoji in an icon slot', () => {
    const findings = find('export const W = () => <Chip icon="🚀" label="Deploy" />;\n');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('🚀');
  });

  it('is silent on an emoji inside a sentence, which is copy', () => {
    expect(find('export const W = () => <p>All deploys are green 🎉 today</p>;\n')).toEqual([]);
  });

  it('is silent on an emoji in a prop that is not an icon slot', () => {
    expect(find('export const W = () => <Chip label="Deploy 🚀" />;\n')).toEqual([]);
  });

  it('is silent on an emoji in a comment', () => {
    expect(find('// ships 🚀\nexport const W = () => <span>hi</span>;\n')).toEqual([]);
  });
});

describe('robustness', () => {
  it('says nothing about a file that does not parse', () => {
    expect(find('export const W = ( {')).toEqual([]);
  });

  /**
   * The check that needs nothing about the project.
   *
   * The message names no component, so a detected package is not a precondition
   * for it — and a repository the tool cannot otherwise read is exactly where a
   * fresh install has to show it does something (#166).
   */
  it('reports an emoji even where no package was detected at all', () => {
    const found = emojiFindings(FILE, 'export const W = () => <span>🔔</span>;\n');

    expect(found).toHaveLength(1);
    expect(found[0]?.message).toContain('emoji used as an icon');
  });

  it('still says nothing about a file with no emoji in it', () => {
    expect(emojiFindings(FILE, 'export const W = () => <button />;\n')).toEqual([]);
  });
});


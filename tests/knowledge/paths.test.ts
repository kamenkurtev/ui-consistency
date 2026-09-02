import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { knowledgeDir, KNOWLEDGE_DIR, LEGACY_KNOWLEDGE_DIR } from '../../src/knowledge/paths.js';
import { readDecisions } from '../../src/knowledge/decisions.js';

/**
 * Renaming a directory people already have is where data goes missing.
 *
 * The failure would be silence — decisions no longer found, nothing said, and a
 * project that has written its intent down looking exactly like one that has
 * not. So the old path is read, and saying so is part of the behaviour rather
 * than a nicety (#145).
 */
describe('where the project keeps what it has written down', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'uic-paths-'));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const write = async (dir: string, name: string, body: string): Promise<void> => {
    await mkdir(join(root, dir), { recursive: true });
    await writeFile(join(root, dir, name), body, 'utf8');
  };

  it('reads the new location', async () => {
    await write(KNOWLEDGE_DIR, 'widgets.md', '# Widgets\n');
    const found = await knowledgeDir(root);

    expect(found.dir).toBe(join(root, KNOWLEDGE_DIR));
    expect(found.legacy).toBe(false);
  });

  it('falls back to the old one, and says that is what it did', async () => {
    await write(LEGACY_KNOWLEDGE_DIR, 'widgets.md', '# Widgets\n');
    const found = await knowledgeDir(root);

    expect(found.dir).toBe(join(root, LEGACY_KNOWLEDGE_DIR));
    expect(found.legacy).toBe(true);
  });

  it('prefers the new one when both exist', async () => {
    await write(KNOWLEDGE_DIR, 'widgets.md', '# New\n');
    await write(LEGACY_KNOWLEDGE_DIR, 'widgets.md', '# Old\n');

    expect((await knowledgeDir(root)).legacy).toBe(false);
  });

  it('names the new one when neither exists, so nothing is written to the old path', async () => {
    const found = await knowledgeDir(root);

    expect(found.dir).toBe(join(root, KNOWLEDGE_DIR));
    expect(found.legacy).toBe(false);
  });

  it('still finds decisions left in the old location', async () => {
    await write(`${LEGACY_KNOWLEDGE_DIR}/decisions`, 'list.md', '# List screens\n\nprefer: @acme/ui\n');
    const decisions = await readDecisions(root);

    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.prefer).toEqual(['@acme/ui']);
  });

  it('finds decisions in the new location', async () => {
    await write(`${KNOWLEDGE_DIR}/decisions`, 'list.md', '# List screens\n\nignore: @acme/scaffolding\n');
    const decisions = await readDecisions(root);

    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.ignore).toEqual(['@acme/scaffolding']);
  });
});

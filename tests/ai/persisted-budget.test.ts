import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { settled } from '../../src/ai/settled.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-settled-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('the advisory debounce, across processes', () => {
  it('allows the first look at a file', async () => {
    expect(await settled(root, '/repo/src/A.tsx', { now: () => 1000 })).toBe(true);
  });

  it('refuses a second look inside the window — from a different process', async () => {
    // The hook is a fresh process on every edit, so an in-memory budget reset
    // every time and the same rules were injected into every keystroke. The
    // state has to outlive the process or it is not a debounce at all.
    await settled(root, '/repo/src/A.tsx', { now: () => 1000 });
    expect(await settled(root, '/repo/src/A.tsx', { now: () => 5000 })).toBe(false);
  });

  it('allows it again once the file has settled', async () => {
    await settled(root, '/repo/src/A.tsx', { now: () => 1000 });
    expect(await settled(root, '/repo/src/A.tsx', { now: () => 1000 + 60_001 })).toBe(true);
  });

  it('debounces per file, not globally', async () => {
    await settled(root, '/repo/src/A.tsx', { now: () => 1000 });
    expect(await settled(root, '/repo/src/B.tsx', { now: () => 1000 })).toBe(true);
  });

  it('allows the edit through when anything at all goes wrong', async () => {
    // Silence is never worth blocking an edit for, so every failure resolves
    // to "advise". Provoked here through the clock, which is the one input a
    // test can reliably make throw — a full disk or a racing process reach the
    // same catch.
    const brokenClock = (): number => {
      throw new Error('no clock');
    };
    expect(await settled(root, '/repo/src/A.tsx', { now: brokenClock })).toBe(true);
  });
});

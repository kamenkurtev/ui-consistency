#!/usr/bin/env node
// Move the shipped version, in every file that carries it.
//
// The version lives in ~~three~~ **seven** places — one manifest per harness,
// plus `package.json` and `src/version.ts` — and only `plugin.json` is read
// when a plugin updates, so the other six drift with nothing to complain.
// Doing it by hand means remembering all of them and remembering to do it at
// all — and the second half failed twice in one day (#36, #43). Three was
// right until the Codex, Cursor and Gemini manifests arrived; the same figure
// was in `.claude/rules/uic-git.md` and is corrected there too.
//
// Usage: npm run bump [patch|minor|major]     (patch by default)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const FILES = [
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.cursor-plugin/plugin.json',
  'gemini-extension.json',
  'package.json',
];

const path = (file) => fileURLToPath(new URL(`../${file}`, import.meta.url));

const kind = process.argv[2] ?? 'patch';
if (!['patch', 'minor', 'major'].includes(kind)) {
  console.error(`Unknown release kind: ${kind}`);
  console.error('Usage: npm run bump [patch|minor|major]');
  process.exit(1);
}

const manifest = JSON.parse(await readFile(path('.claude-plugin/plugin.json'), 'utf8'));
const current = manifest.version;
if (typeof current !== 'string' || !/^\d+\.\d+\.\d+$/.test(current)) {
  console.error(`plugin.json has no usable version: ${String(current)}`);
  process.exit(1);
}

const [major, minor, patch] = current.split('.').map(Number);
const next =
  kind === 'major'
    ? `${major + 1}.0.0`
    : kind === 'minor'
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

for (const file of FILES) {
  const target = path(file);
  const before = await readFile(target, 'utf8');
  // Textual rather than parse-and-serialise: these files are hand-edited and
  // reformatting them into a diff nobody asked for is its own annoyance.
  const after = before.replace(`"version": "${current}"`, `"version": "${next}"`);
  if (after === before) {
    console.error(`${file} does not carry version ${current} — fix it by hand.`);
    process.exit(1);
  }
  await writeFile(target, after, 'utf8');
  console.log(`  ${file}`);
}

// The fourth place, and the only one that is code: the bundle stamps this into
// every file it generates, so a wrong value here is shipped to every user and
// nothing in a clone would notice.
{
  const target = path('src/version.ts');
  const before = await readFile(target, 'utf8');
  const after = before.replace(`'${current}'`, `'${next}'`);
  if (after === before) {
    console.error(`src/version.ts does not carry version ${current} — fix it by hand.`);
    process.exit(1);
  }
  await writeFile(target, after, 'utf8');
  console.log('  src/version.ts');
}

console.log(`\n${current} → ${next}. Commit these with the change they ship.`);

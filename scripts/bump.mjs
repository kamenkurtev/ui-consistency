#!/usr/bin/env node
// Move the shipped version, in every file that carries it.
//
// The version lives in every manifest a harness reads, `package.json` and the
// lockfile, and only `plugin.json` is read when a plugin updates — so the others
// drift with nothing to complain.
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

// The lockfile carries it twice, and a dependency can carry the same string, so
// it is set by field. npm writes this file as two-space JSON, so writing it back
// that way changes the two lines and nothing else.
{
  const target = path('package-lock.json');
  const lock = JSON.parse(await readFile(target, 'utf8'));
  if (lock.version !== current || lock.packages?.['']?.version !== current) {
    console.error(`package-lock.json does not carry version ${current} — fix it by hand.`);
    process.exit(1);
  }
  lock.version = next;
  lock.packages[''].version = next;
  await writeFile(target, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  console.log('  package-lock.json');
}

console.log(`\n${current} → ${next}. Add a "## v${next} (<date>)" entry to RELEASE-NOTES.md, and commit both with the change they ship.`);

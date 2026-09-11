#!/usr/bin/env node
// The first-run acceptance harness (#39).
//
// The problem, stated once: installed on a repository it had not been developed
// against, this tool answered **nothing, everywhere, and called it success.**
// One binary, two real React monorepos, the same day — 132 findings and exit 1
// on one; 0 findings, exit 0, an empty `--list` and an empty inventory on the
// other, over 400 screen files. The second repository was not cleaner. Nothing
// in it was ever looked at, and every surface reported that as a clean result.
//
// **The test is the deliverable; the fixes are how it goes green.** Five issues
// closed the particular holes — #31, #32, #35, #36, #37 — and closing them
// without this would leave the same hole open for the next repository with a
// convention nobody anticipated.
//
// ## What it asserts
//
// One thing, over every command, on a repository with nothing configured and
// nothing written down: **no command may answer with empty output and exit 0.**
// Every command either reports something, or says which of the three it is —
// it works and here is what it read; it is quiet because the project has stated
// nothing; it is blind here, and here is why. Those are the three answers
// `skills/reach` is built on, and this checks them from the CLI itself, which
// is where they were indistinguishable.
//
// ## Why it takes repositories as arguments
//
// Because it cannot carry them. A committed harness and a run against real
// repositories are two different artefacts, and conflating them is how this
// would go green on a clone that has no repository to look at — which is the
// exact defect it exists to catch. So: **no arguments is a failure**, not a
// pass, and the run is performed by hand and its numbers written down.
//
// **Its output is a measurement, and a measurement loses its names before it is
// written down anywhere.** The rows carry counts and classifications, never
// source — but `about` names files and `why` carries the first sentence a
// command printed, and on a private repository both are the provenance
// `.claude/rules/uic-docs.md` exists to strip. Scrub before recording, exactly
// as that rule requires; `tests/private-names.test.ts` only guards what is
// tracked, and a terminal is not.
//
// Usage: node scripts/first-run.mjs <repository...> [--json]

import { execFile } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BINARY = fileURLToPath(new URL('../bin/uic.mjs', import.meta.url));

/** How many files to hand the commands that take a set. Enough to be a real
 *  scan, small enough that this is a check and not a build. */
const SAMPLE = 40;

/** Directories that hold somebody else's code, or this tool's own output. */
const SKIP = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  'ios',
  'android',
  'vendor',
  '.venv',
]);

const SCREENISH = /\.(?:tsx|jsx|vue|svelte|component\.html)$/;

async function screensIn(root) {
  const found = [];
  const queue = [root];
  // Breadth-first and bounded: a scan that walks a whole monorepo to pick
  // forty files costs more than the commands it is preparing for.
  while (queue.length > 0 && found.length < SAMPLE * 8) {
    const dir = queue.shift();
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP.has(entry.name) && !entry.name.startsWith('.')) queue.push(join(dir, entry.name));
        continue;
      }
      if (SCREENISH.test(entry.name) && !/\.(?:test|spec|stories)\./.test(entry.name)) {
        found.push(join(dir, entry.name));
      }
    }
  }
  return found;
}

function run(args, cwd) {
  return new Promise((done) => {
    execFile(
      process.execPath,
      [BINARY, ...args],
      { cwd, maxBuffer: 64 * 1024 * 1024, timeout: 240_000 },
      (error, stdout, stderr) => {
        const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
        done({ code, stdout, stderr, killed: error?.killed === true });
      },
    );
  });
}

/**
 * Which of the four a command's answer was.
 *
 * `silent` is the only failure, and it is the whole subject of #39: empty
 * stdout, nothing on stderr, exit 0. It is indistinguishable from a clean
 * result and it is what 400 unlooked-at files reported.
 *
 * The classification reads what the command *said*. It deliberately has no
 * opinion of its own about what counts as blind — `src/core/coverage.ts` is
 * that opinion, it shipped with #37, and a second copy here would be the
 * duplicate implementation `CLAUDE.md` forbids.
 */
function classify({ code, stdout, stderr, killed }) {
  if (killed) return 'timeout';
  const said = stdout.trim() !== '';
  const explained = stderr.trim() !== '';
  if (said) return 'answered';
  if (code !== 0) return explained ? 'refused' : 'silent';
  return explained ? 'stated' : 'silent';
}

/**
 * Which files the per-file commands are pointed at.
 *
 * **Several, and not one**, and that is the whole value of the run. Pointed at
 * the single file a breadth-first walk reaches first, a real Ionic React app
 * answered *nothing routes it* and *fewer than three screens of this kind* —
 * both true of `src/App.tsx`, which is a wiring file, and both telling you
 * nothing about the tool. The same binary on a page read `/practice` out of a
 * JSX `<Route>` and derived `IonPage / IonHeader / IonContent` from the
 * project's own code.
 *
 * Choosing better is not available to a harness: guessing which file is a
 * screen is what this tool spent an issue deleting (`archetype.ts`, *"not
 * readable from the code"* about 12 of 13 real pages), and a chooser here would
 * be the same guess one level out. So the answer is a **sample**: a few files a
 * project's own directory names suggest, the rest taken in the order found, and
 * the distribution of answers reported. *Placed for 3 of 5* is a fact; *placed*
 * for one hand-picked file is a claim about the picking.
 *
 * Directory words only — never a component name, which is the rule governing
 * anything here that speaks about a project.
 */
const SCREEN_DIR = /(?:^|\/)(?:pages?|screens?|views?|routes?|containers?)(?:\/|$)/;

/** How many files each per-file command is asked about. */
const PER_FILE = 5;

const subjects = (root, screens) => {
  const relatives = screens.map((one) => relative(root, one).replace(/\\/g, '/'));
  const named = relatives.filter((one) => SCREEN_DIR.test(one));
  // Deepest first among those: `pages/Practice/Practice.tsx` over `pages/index.tsx`.
  named.sort((a, b) => b.split('/').length - a.split('/').length);
  const rest = relatives.filter((one) => !named.includes(one));
  return [...new Set([...named, ...rest])].slice(0, PER_FILE);
};

/** The commands, each with the arguments this repository can give it. */
function callsFor(root, screens) {
  const some = screens.slice(0, SAMPLE).map((one) => relative(root, one));
  const perFile = subjects(root, screens);
  const first = perFile[0];

  // `over` is a list of argument sets: one command, asked about each subject in
  // turn, so what is reported is a distribution rather than one file's luck.
  const each = (command, before = []) =>
    perFile.map((file) => [command, ...before, file]);

  const rows = [
    ['scan', [['scan']]],
    ['check', [['check', ...some]]],
    ['check --list', [['check', '--list', ...some]]],
    ['inventory', each('inventory')],
    ['place', each('place')],
    ['pattern', each('pattern')],
    ['patterns', [['patterns']]],
    ['tree', each('tree')],
    // The component to read comes from the repository, never from a list here:
    // no component name may be hardcoded anywhere a finding can come from, and
    // a harness naming one would be measuring its own guess.
    ['props', first === undefined ? [] : [['props', componentIn(first), ...some]]],
    ['group', [['group', ...some]]],
    ['shapes', [['shapes', ...some]]],
    ['review', each('review')],
    ['log', [['log']]],
    // Nothing has been written down on a first run, so this is the refusal
    // path: it must say what it could not read rather than printing nothing.
    ['diff', each('diff', ['--contract', '.ui-consistency/patterns/nothing.md'])],
  ];

  // **Nothing is filtered out.** A row dropped for want of a file is a level
  // nobody ran, reported as a level that does not exist — and on a directory
  // with no source in it that dropped nine of the fourteen and tripped the
  // completeness guard instead of printing the report. A command with no file
  // to be given answers `no file`, which is an answer.
  return rows;
}

/**
 * The commands the binary itself says it has.
 *
 * Read from the usage line rather than listed here, so the two cannot drift: a
 * command added to the CLI and not covered below fails this harness instead of
 * quietly escaping it. That is the same failure this whole script is about —
 * a level nobody ran is a level nobody checked — one level up.
 */
async function commandsOfBinary(cwd) {
  const { stderr } = await run(['--first-run-enumerate'], cwd);
  const listed = /Usage: uic <([^>]+)>/.exec(stderr)?.[1] ?? '';
  return listed.split('|').filter((one) => one !== '');
}

/**
 * `mcp` is a server and not a one-shot: it reads stdin until the client closes
 * it, so it has no output to classify and cannot be run this way. It has its
 * own acceptance suite against the shipped bundle (`tests/mcp/server.test.ts`),
 * which is where the same question — does it answer, or is it silent — is
 * asked of it.
 */
const NOT_ONE_SHOT = new Set(['mcp']);

/** A component this file renders, read off the file name — the repository's own
 *  word for it, and the only source a harness is allowed to take it from. */
const componentIn = (path) => {
  const name = path.split('/').pop() ?? '';
  return name.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9]/g, '') || 'Root';
};

async function measure(root) {
  const screens = await screensIn(root);
  const about = subjects(root, screens);
  const rows = [];

  for (const [label, over] of callsFor(root, screens)) {
    if (over.length === 0) {
      // Said, not skipped. `props` needs a component and the per-file commands
      // need a file; a repository that can supply neither has not been checked
      // at that level, and that is the thing this whole harness is about.
      rows.push({ command: label, answer: 'no file', of: 0, tally: { 'no file': 1 }, exit: 0, why: 'this repository gave it nothing to read' });
      continue;
    }
    const answers = [];
    let why = '';
    let worstExit = 0;
    for (const args of over) {
      const result = await run(args, root);
      const answer = classify(result);
      answers.push(answer);
      worstExit = Math.max(worstExit, result.code);
      // The first sentence of the first run that had one to give, so a row that
      // was quiet says *why* it was quiet.
      if (why === '' && answer !== 'silent') {
        why = (result.stderr.trim().split('\n')[0] ?? '').slice(0, 110);
      }
    }

    const tally = {};
    for (const one of answers) tally[one] = (tally[one] ?? 0) + 1;
    rows.push({
      command: label,
      // Silent anywhere is silent: one file answered nothing with exit 0 is the
      // defect, however many others answered.
      answer: answers.includes('silent') ? 'silent' : answers.includes('timeout') ? 'timeout' : 'ok',
      of: answers.length,
      tally,
      exit: worstExit,
      why,
    });
  }

  return { root, screens: screens.length, about, rows };
}

const asked = process.argv.slice(2);
const wantsJson = asked.includes('--json');
const roots = asked.filter((one) => !one.startsWith('-'));

// **The guard, and the one assertion that cannot be satisfied by accident.** A
// first-run acceptance test that goes green with no repository present is
// itself the defect it exists to catch: nothing, everywhere, called success.
if (roots.length === 0) {
  console.error('first-run: no repository given, so nothing was checked.');
  console.error('');
  console.error('This asserts that no command answers with empty output and exit 0 on a');
  console.error('repository the tool has never seen. It cannot assert that over no');
  console.error('repository, and passing here would be the failure it exists to catch (#39).');
  console.error('');
  console.error('Usage: node scripts/first-run.mjs <repository...> [--json]');
  process.exit(1);
}

const reports = [];
const uncovered = [];
for (const one of roots) {
  const root = resolve(one);
  const found = await stat(root).catch(() => null);
  if (found === null || !found.isDirectory()) {
    console.error(`first-run: ${one} is not a directory.`);
    process.exit(1);
  }
  reports.push(await measure(root));

  // Every command the binary admits to having, covered here or named as not
  // coverable. A new one appearing in the usage line and nowhere below is the
  // one way this harness could go stale without saying so.
  // Against every row the harness defines, including the ones this repository
  // could give no file to — otherwise a repository with no source in it looks
  // like a harness with nine missing commands.
  const covered = new Set(callsFor(root, []).map(([label]) => label.split(' ')[0]));
  for (const command of await commandsOfBinary(root)) {
    if (!covered.has(command) && !NOT_ONE_SHOT.has(command)) uncovered.push(command);
  }
}

if (uncovered.length > 0) {
  console.error(`first-run: the binary has command(s) this harness does not run: ${[...new Set(uncovered)].join(', ')}`);
  console.error('Add them to callsFor, or to NOT_ONE_SHOT with the reason.');
  process.exit(1);
}

if (wantsJson) {
  console.log(JSON.stringify(reports, null, 2));
} else {
  for (const report of reports) {
    console.log(`\n${report.root}  —  ${report.screens} screen-ish file(s) found`);
    console.log(`  per-file commands asked about ${report.about.length}: ${report.about.join(', ') || '(none found)'}\n`);
    const width = Math.max(...report.rows.map((one) => one.command.length));
    for (const row of report.rows) {
      const spread =
        row.of === 0
          ? 'no file'
          : `${Object.entries(row.tally)
              .map(([answer, count]) => `${count} ${answer}`)
              .join(', ')} of ${row.of}`;
      console.log(
        `  ${row.command.padEnd(width)}  ${(row.answer === 'silent' ? 'SILENT' : '').padEnd(7)}` +
          `${spread.padEnd(28)}${row.why === '' ? '' : `  ${row.why}`}`,
      );
    }
  }
}

const silent = reports.flatMap((one) => one.rows.filter((row) => row.answer === 'silent').map((row) => `${one.root}: ${row.command}`));
const timedOut = reports.flatMap((one) => one.rows.filter((row) => row.answer === 'timeout').map((row) => `${one.root}: ${row.command}`));

if (silent.length > 0) {
  console.error(`\n${silent.length} level(s) answered with empty output and exit 0:`);
  for (const one of silent) console.error(`  ${one}`);
  console.error('\nThat is indistinguishable from a clean result, which is the whole of #39.');
  process.exit(1);
}
if (timedOut.length > 0) {
  console.error(`\n${timedOut.length} level(s) did not finish:`);
  for (const one of timedOut) console.error(`  ${one}`);
  process.exit(1);
}

// On stderr under `--json`: stdout is then the record, and a sentence after
// the closing bracket is a file nobody can parse.
const closing = `\nNo level answered with empty output and exit 0, over ${reports.length} repositor${reports.length === 1 ? 'y' : 'ies'}.`;
if (wantsJson) console.error(closing);
else console.log(closing);

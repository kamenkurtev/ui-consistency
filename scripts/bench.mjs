#!/usr/bin/env node
// The with/without benchmark (#34): the scorer, the drift curve, and the guards.
//
// This project's claim is one sentence: **a screen written with the pattern in
// front of the agent comes out matching its neighbours, and one written without
// it drifts** — and by file twenty the difference is the whole problem. Nothing
// measured so far says that. 37 ms cold, 108 of 117 routes, 13 props agreed by
// 6 of 6 — every one of those says the fact supplier is accurate, and none of
// them says the agent wrote a better screen.
//
// ## What this is, and what it is not
//
// It is the half that is arithmetic: given two arms' worth of written screens
// and the pattern for their kind, it produces **conformance** and **the drift
// curve** — deviations per screen, and deviations as a function of position in
// the batch. It scores through `uic diff --contract --json`, which is
// `patternDeviations` and nothing else; a scorer with its own notion of
// conformance would be the second implementation this repository forbids.
//
// It is **not** the runs. Two of the issue's four numbers cannot be computed
// from files on disk at all: **cost** (tokens and wall clock per screen) has
// nothing to record when no agent ran, and the **false-finding rate** is
// defined as findings a judge rules wrong, which is a judgement and not a
// computation. Those arrive with the runs, and the runs are agent time somebody
// has to decide to spend.
//
// ## The guard that makes the numbers mean anything
//
// **The pattern must be committed before the arm was written.** The issue says
// the pattern is fixed before the run; the mechanical form is that a pattern
// file with uncommitted changes, or none in git at all, is refused — otherwise
// a run is scored against something authored from its own output, which
// measures nothing and looks like a result. `--i-know` overrides it for a dry
// run on a scratch tree, and the override is printed in the report.
//
// ## Evidence keeps its numbers and loses its names
//
// The report carries counts, positions and the pattern's own name. It prints no
// source. The paths it is given are echoed in `--json` because a drift curve
// without the file order cannot be read, so the same rule applies as to
// `first-run.mjs`: scrub before recording.
//
// Usage:
//   node scripts/bench.mjs --pattern <pattern.md> --off <dir> --on <dir> [--json] [--i-know]
//
// `<dir>` is a directory of the screens one arm wrote, named so they sort into
// the batch order — `01-*.tsx`, `02-*.tsx` — because position is the measurement.

import { execFile } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BINARY = fileURLToPath(new URL('../bin/uic.mjs', import.meta.url));
const TASKS = fileURLToPath(new URL('../bench/tasks.json', import.meta.url));

const run = (command, args, cwd) =>
  new Promise((done) => {
    execFile(command, args, { cwd, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      done({ code: error === null ? 0 : typeof error.code === 'number' ? error.code : 1, stdout, stderr });
    });
  });

/** The flag's value, or null. Long form only: this is run by hand, rarely. */
function valueOf(argv, flag) {
  const at = argv.indexOf(flag);
  if (at === -1) return null;
  const value = argv[at + 1];
  return value === undefined || value.startsWith('-') ? null : value;
}

/**
 * Is this pattern file committed, and unmodified since?
 *
 * Both halves matter. A file git has never seen could have been written from
 * the arm's own output five seconds ago; a tracked file with local changes
 * could have been *edited* from it, which is the same thing wearing a hat.
 */
async function fixedBeforeTheRun(patternPath) {
  const dir = dirname(resolve(patternPath));
  const tracked = await run('git', ['ls-files', '--error-unmatch', resolve(patternPath)], dir);
  if (tracked.code !== 0) return { ok: false, why: 'it is not tracked by git, so nothing says it predates the run' };
  const dirty = await run('git', ['status', '--porcelain', '--', resolve(patternPath)], dir);
  if (dirty.stdout.trim() !== '') return { ok: false, why: 'it has uncommitted changes' };
  const when = await run('git', ['log', '-1', '--format=%cI', '--', resolve(patternPath)], dir);
  return { ok: true, committed: when.stdout.trim() || null };
}

/**
 * What was live while this arm was written, as the arm itself records it.
 *
 * **Required, and an arm without it is refused** (#71). The OFF arm is written
 * inside a harness that has the plugin installed, so its `PostToolUse` hook
 * fires on every write it makes and hands it the derived contract — the
 * treatment, through a door nothing in either prompt closes. Deleting the
 * pattern file does not help: since #38 a pattern is derived on the edit
 * already being made where no approved one covers the kind.
 *
 * Two runs were performed with no valid OFF arm before this was noticed, and
 * the second arm's conformance was indistinguishable from the treatment's on
 * the one prop that separated them.
 *
 * So it is declared rather than assumed, and the declaration is what the scorer
 * reads. `{"plugin": "none"}` on an OFF arm, or the version string with
 * `"silenced": true` where the harness could not have it uninstalled — which
 * `UIC_OFF` makes possible and `bench.mjs` cannot verify after the fact, so it
 * is recorded and printed rather than checked.
 */
async function armWasWrittenWith(dir) {
  const raw = await readFile(join(dir, 'arm.json'), 'utf8').catch(() => null);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** The screens one arm wrote, in batch order. */
async function screensOf(dir) {
  const entries = await readdir(dir).catch(() => null);
  if (entries === null) return null;
  return entries
    .filter((one) => /\.(?:tsx|jsx|vue|svelte|html)$/.test(one))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map((one) => join(dir, one));
}

/**
 * One arm, scored.
 *
 * `uic diff --contract <pattern> --json` over the whole arm at once: it applies
 * the pattern per file and names the paths of another kind rather than
 * measuring them, which is what keeps *not looked at* out of the average.
 */
async function scoreArm(patternPath, files, cwd) {
  if (files.length === 0) return { screens: [], measured: 0, unmeasured: 0 };
  const { stdout } = await run(
    process.execPath,
    [BINARY, 'diff', '--contract', resolve(patternPath), '--json', ...files],
    cwd,
  );
  const start = stdout.indexOf('{');
  if (start === -1) throw new Error('uic diff --json printed no object');
  const report = JSON.parse(stdout.slice(start));

  const screens = report.files.map((one, index) => ({
    // Position in the batch, which is the whole point: file 1 against file 18.
    position: index + 1,
    file: basename(one.file),
    deviations: one.deviations,
    messages: one.messages ?? [],
  }));

  // **What the deviations were, not only how many** (#57). One prop missing on
  // seven screens and seven different props missing on one screen are the same
  // mean and are not the same result — and on the first real run the entire
  // measured difference between the arms was a single boolean prop, which a
  // mean of 0.39 against 0 does not convey at all.
  const kinds = new Map();
  for (const screen of screens) {
    for (const message of screen.messages) {
      const entry = kinds.get(message) ?? { message, screens: 0 };
      entry.screens++;
      kinds.set(message, entry);
    }
  }

  return {
    screens,
    measured: screens.filter((one) => one.deviations !== null).length,
    unmeasured: screens.filter((one) => one.deviations === null).length,
    kinds: [...kinds.values()].sort((a, b) => b.screens - a.screens),
    handedOver: report.handedOver ?? [],
    pattern: report.name ?? null,
  };
}

const mean = (numbers) =>
  numbers.length === 0 ? null : Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;

/**
 * **Where a deviation kind was first seen, and how many were new late on.**
 *
 * The count-based curve came back flat over 18 screens, and a flat count has
 * two very different readings that call for opposite responses (#63): the batch
 * is too short, or drift is not positional at all — in which case the loop in
 * `skills/rollout`, whose whole shape assumes attention thinning within a
 * session, is built on a mechanism that does not exist.
 *
 * A count cannot separate them, and this is the axis that might. *Consistently
 * missing one prop* and *inventing a new mistake every few screens* are the
 * same mean and the same flat curve, and only the second is drift. So: for each
 * screen, how many of its deviation kinds had never appeared in any earlier
 * screen of the batch. An arm that is merely uniform answers 1 at the start and
 * 0 after; an arm whose grip is slipping keeps introducing new kinds late.
 *
 * It is not a verdict either. It is one more axis, and the run is what decides.
 */
function novelty(screens) {
  const seen = new Set();
  const perScreen = [];
  const firstSeen = [];
  for (const screen of screens) {
    if (screen.deviations === null) {
      perScreen.push({ position: screen.position, novel: null });
      continue;
    }
    let novel = 0;
    for (const message of screen.messages ?? []) {
      if (seen.has(message)) continue;
      seen.add(message);
      novel++;
      firstSeen.push({ position: screen.position, message });
    }
    perScreen.push({ position: screen.position, novel });
  }

  const counted = perScreen.filter((one) => one.novel !== null);
  const third = Math.max(1, Math.floor(counted.length / 3));
  return {
    perScreen,
    firstSeen,
    kinds: seen.size,
    // The same thirds as the count curve, so the two are read side by side.
    early: counted.length < 3 ? null : mean(counted.slice(0, third).map((one) => one.novel)),
    late: counted.length < 3 ? null : mean(counted.slice(-third).map((one) => one.novel)),
  };
}

/**
 * The drift curve, as the two numbers that answer the claim.
 *
 * A mean over the whole batch cannot distinguish *consistently mediocre* from
 * *fine at first and drifting badly*, and the second is the thing this project
 * exists for. So: the first third against the last third, which is the
 * comparison the claim makes, and it is reported even when it is flat.
 *
 * **Flat here is not an answer on its own** — see {@link novelty}.
 */
function curve(screens) {
  const counted = screens.filter((one) => one.deviations !== null);
  if (counted.length < 3) return { early: null, late: null, drift: null, of: counted.length };
  const third = Math.max(1, Math.floor(counted.length / 3));
  const early = mean(counted.slice(0, third).map((one) => one.deviations));
  const late = mean(counted.slice(-third).map((one) => one.deviations));
  return { early, late, drift: Math.round((late - early) * 100) / 100, of: counted.length };
}

const argv = process.argv.slice(2);
const wantsJson = argv.includes('--json');
const override = argv.includes('--i-know');
const patternPath = valueOf(argv, '--pattern');
const arms = { off: valueOf(argv, '--off'), on: valueOf(argv, '--on') };

if (patternPath === null || arms.off === null || arms.on === null) {
  console.error('bench: --pattern, --off and --on are all required.');
  console.error('');
  console.error('This measures conformance and the drift curve over screens two arms already wrote.');
  console.error('It does not run the arms: cost per screen has nothing to record when no agent ran,');
  console.error('and the false-finding rate is a judgement rather than a computation (#34).');
  console.error('');
  console.error('Usage: node scripts/bench.mjs --pattern <pattern.md> --off <dir> --on <dir> [--json] [--i-know]');
  process.exit(1);
}

const pattern = await stat(patternPath).catch(() => null);
if (pattern === null || !pattern.isFile()) {
  console.error(`bench: ${patternPath} is not a file.`);
  process.exit(1);
}

const fixed = await fixedBeforeTheRun(patternPath);
if (!fixed.ok && !override) {
  console.error(`bench: refusing to score against ${basename(patternPath)} — ${fixed.why}.`);
  console.error('');
  console.error('The pattern has to be fixed before the arms are written. Scored against one');
  console.error('authored from an arm’s own output, every number here measures nothing and');
  console.error('still looks like a result. Commit it first, or pass --i-know for a dry run.');
  process.exit(1);
}

const tasks = JSON.parse(await (await import('node:fs/promises')).readFile(TASKS, 'utf8'));

const scored = {};
const wrote = {};
for (const [arm, dir] of Object.entries(arms)) {
  const files = await screensOf(dir);
  if (files === null) {
    console.error(`bench: ${dir} is not a readable directory.`);
    process.exit(1);
  }

  // **Refused, not assumed.** An arm that does not say what was live while it
  // was written cannot be told from a contaminated one, and a contaminated arm
  // that looks clean is the whole of #71.
  const declared = await armWasWrittenWith(dir);
  if (declared === null) {
    console.error(`bench: ${dir}/arm.json is missing or unreadable.`);
    console.error('');
    console.error('Each arm records what was live while it was written — the plugin version, or');
    console.error('"none" — because the OFF arm is written in a harness that has the plugin and its');
    console.error('hook feeds it the derived contract on every write. Deleting the pattern file does');
    console.error('not close that door. Two runs were scored before this was noticed (#71).');
    console.error('');
    console.error('  {"plugin": "none"}                      the plugin was not installed');
    console.error('  {"plugin": "0.14.107", "silenced": true} installed, UIC_OFF set for that session');
    process.exit(1);
  }
  if (arm === 'off' && declared.plugin !== 'none' && declared.silenced !== true) {
    console.error(`bench: the OFF arm at ${dir} was written with the plugin live (${declared.plugin}).`);
    console.error('That is the treatment, so there is no baseline to compare against. Re-run the');
    console.error('arm with the plugin uninstalled, or with UIC_OFF set for its session.');
    process.exit(1);
  }
  wrote[arm] = declared;
  // From the working directory, not from the pattern's own folder: the arm's
  // paths are given relative to where this was invoked, and resolving them
  // against `.ui-consistency/patterns/` made every file unreadable — which
  // `uic diff --json` then reported as zero deviations, so a planted drift
  // curve of 18 screens scored a flat zero and looked like a result.
  scored[arm] = { dir, ...(await scoreArm(patternPath, files, process.cwd())) };
}

// **The arms must be comparable, and a mismatch is not a detail.** Same tasks,
// same order, same count is the design constraint the issue states first; two
// arms of different lengths are two different experiments.
const sameSize = scored.off.screens.length === scored.on.screens.length;
const short = Math.min(scored.off.screens.length, scored.on.screens.length);

const report = {
  // Printed on every run, because "none" is a meaningful value and two runs
  // differed by it without anybody being able to see that they had.
  writtenWith: wrote,
  pattern: { file: basename(patternPath), name: scored.on.pattern ?? scored.off.pattern, committed: fixed.committed ?? null, guardOverridden: override },
  batch: { off: scored.off.screens.length, on: scored.on.screens.length, comparable: sameSize, minimumBatch: tasks.minimumBatch },
  conformance: {
    off: { mean: mean(scored.off.screens.filter((o) => o.deviations !== null).map((o) => o.deviations)), measured: scored.off.measured, unmeasured: scored.off.unmeasured },
    on: { mean: mean(scored.on.screens.filter((o) => o.deviations !== null).map((o) => o.deviations)), measured: scored.on.measured, unmeasured: scored.on.unmeasured },
  },
  drift: { off: curve(scored.off.screens), on: curve(scored.on.screens) },
  // The second axis, because a flat count has two readings (#63).
  novelty: { off: novelty(scored.off.screens), on: novelty(scored.on.screens) },
  // Distinct deviations and how many screens carried each. A mean hides whether
  // an arm missed one thing everywhere or everything once.
  whatWasWrong: { off: scored.off.kinds ?? [], on: scored.on.kinds ?? [] },
  perPosition: Array.from({ length: short }, (_, at) => ({
    position: at + 1,
    off: scored.off.screens[at]?.deviations ?? null,
    on: scored.on.screens[at]?.deviations ?? null,
  })),
  // Named, never scored: a pattern states sentences no program evaluates, and
  // a conformance number that quietly ignored them would overstate itself.
  handedOverAndNotScored: [...new Set([...(scored.off.handedOver ?? []), ...(scored.on.handedOver ?? [])])],
  // The two the issue asks for that no amount of reading files can produce.
  notMeasuredHere: [
    'cost — tokens and wall clock per screen, which only the runs can record',
    'false findings — findings a judge rules wrong, which is a judgement and not a computation',
  ],
};

if (wantsJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(
    `\nwritten with: off = ${JSON.stringify(report.writtenWith.off)}, on = ${JSON.stringify(report.writtenWith.on)}`,
  );
  console.log(`\npattern: ${report.pattern.name ?? report.pattern.file}${report.pattern.guardOverridden ? '  (pre-run guard OVERRIDDEN with --i-know)' : `  committed ${report.pattern.committed ?? 'unknown'}`}`);
  console.log(`batch:   off ${report.batch.off}, on ${report.batch.on}${sameSize ? '' : '  — NOT COMPARABLE, the arms differ in length'}`);
  if (short < tasks.minimumBatch) {
    console.log(`         ${short} screens is below the stated minimum of ${tasks.minimumBatch}: a curve this short cannot bend.`);
  } else if (report.drift.off.drift === 0 && report.drift.on.drift === 0) {
    // **A flat curve at or above the minimum is not a result yet**, because the
    // minimum itself is unmeasured: 15 came out of the issue body and nothing
    // has established where the effect would begin. Said here rather than left
    // for a reader to assume the question was settled (#63).
    console.log(
      `         both curves are flat at ${short} screens, and ${tasks.minimumBatch} is a guess — nothing has\n` +
        '         established where drift would begin, so this does not yet mean it is not positional.',
    );
  }
  console.log('\nconformance — mean deviations per screen (lower is better)');
  for (const arm of ['off', 'on']) {
    const one = report.conformance[arm];
    console.log(`  ${arm.padEnd(4)} ${String(one.mean ?? '—').padEnd(7)} over ${one.measured} measured${one.unmeasured > 0 ? `, ${one.unmeasured} of another kind and not measured` : ''}`);
  }
  console.log('\ndrift — first third against last third');
  for (const arm of ['off', 'on']) {
    const one = report.drift[arm];
    console.log(`  ${arm.padEnd(4)} early ${String(one.early ?? '—').padEnd(6)} late ${String(one.late ?? '—').padEnd(6)} drift ${one.drift === null ? '—' : one.drift > 0 ? `+${one.drift}` : one.drift}`);
  }
  console.log('\nnew kinds of deviation — a flat count above has two readings, and this is the other axis');
  for (const arm of ['off', 'on']) {
    const one = report.novelty[arm];
    console.log(
      `  ${arm.padEnd(4)} ${one.kinds} distinct kind(s)` +
        `   early ${String(one.early ?? '—').padEnd(6)} late ${String(one.late ?? '—')}` +
        (one.early !== null && one.late !== null && one.late > one.early
          ? '  — new kinds are still appearing late, which is what drift would look like'
          : one.kinds === 0
            ? ''
            : '  — no new kinds late: uniform, not drifting'),
    );
    for (const first of one.firstSeen) {
      console.log(`       first at ${String(first.position).padStart(3)}  ${first.message}`);
    }
  }

  console.log('\nper position');
  for (const row of report.perPosition) {
    console.log(`  ${String(row.position).padStart(3)}  off ${String(row.off ?? '—').padStart(3)}   on ${String(row.on ?? '—').padStart(3)}`);
  }
  for (const arm of ['off', 'on']) {
    const kinds = report.whatWasWrong[arm];
    if (kinds.length === 0) continue;
    console.log(`\nwhat was wrong — ${arm}`);
    for (const one of kinds) {
      console.log(`  ${String(one.screens).padStart(3)} screen(s)  ${one.message}`);
    }
  }
  if (report.handedOverAndNotScored.length > 0) {
    console.log('\nstated by the pattern and scored by nothing here:');
    for (const one of report.handedOverAndNotScored) console.log(`  - ${one}`);
  }
  console.log('\nnot measured here, and not measurable from files on disk:');
  for (const one of report.notMeasuredHere) console.log(`  - ${one}`);
  console.log('');
}

// **No verdict.** Whether a difference is a result is a reading of the spread
// across runs, and one pair of arms cannot separate the tool from the weather —
// the issue says so, and a script printing "ON wins" from a single pair would
// be exactly the anecdote with a table it forbids.
process.exit(sameSize ? 0 : 1);

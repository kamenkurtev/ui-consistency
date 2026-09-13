import { readFile, realpath, stat } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { exportedSymbolsFromSource } from '../parse/exports.js';
import { readLog, readSeen, summarise, logPath } from './log.js';
import { shapeReport } from '../checks/shapes.js';
import { formatFinding } from '../core/format.js';
import { coverageOf, sayCoverage, type Coverage } from '../core/coverage.js';
import { hookResponse } from './hook.js';
import { sessionResponse } from './session.js';
import { KNOWLEDGE_DIR } from '../knowledge/paths.js';
import { pathToFileURL } from 'node:url';

export { analyzeProject } from '../core/project.js';
import { analyzeProject } from '../core/project.js';

/**
 *
 * Four decisions spread across four files that no per-file check can see, and
 * the breadcrumb is the one got wrong nearly every time — because the trail
 * lives in the router, not in the file being edited.
 */

/** Shell metacharacters, so an unexpanded pattern can be named as one. */
const GLOB = /[*?[\]{}]/;

/**
 * The files an argument list actually names, or what is wrong with it.
 *
 * A path that matches nothing is an error, not an empty result.
 * `uic check "src/**\/*.tsx"` — the quoted form a person copies into CI —
 * arrives here as one literal string, matched no file, checked nothing and
 * **exited 0**. A gate whose failure mode is passing silently is worse than no
 * gate at all, and it is the failure this project keeps having to design
 * against (#144).
 *
 * A directory was accepted and ignored the same way.
 */
async function givenFiles(
  rootDir: string,
  files: string[],
): Promise<{ absolute: string[]; problems: string[] }> {
  const absolute: string[] = [];
  const problems: string[] = [];

  for (const file of files) {
    const path = resolve(rootDir, file);
    const found = await stat(path).catch(() => null);

    if (found === null) {
      problems.push(
        GLOB.test(file)
          ? `${file} matched no file. Globs are expanded by your shell, so a quoted pattern arrives here literally.`
          : `${file} does not exist.`,
      );
      continue;
    }
    if (found.isDirectory()) {
      problems.push(`${file} is a directory, and this takes files.`);
      continue;
    }
    absolute.push(path);
  }

  return { absolute, problems };
}

/** The same advice both callers give, in one place. */
function sayHowToNameFiles(problems: string[]): void {
  for (const problem of problems) console.error(problem);
  console.error("Name the files, or let the shell name them: $(git ls-files '*.tsx')");
}

async function check(rootDir: string, args: string[]): Promise<number> {
  const flags = args.filter((arg) => arg.startsWith('-'));
  const unknown = flags.filter((flag) => flag !== '--list');
  if (unknown.length > 0) {
    // Silently ignoring a misspelt flag would run the opposite of what was
    // asked for and say nothing about it.
    console.error(`Unknown option: ${unknown.join(', ')}`);
    console.error('Usage: uic check [--list] <file...>');
    return 1;
  }

  const listOnly = flags.includes('--list');
  const files = args.filter((arg) => !arg.startsWith('-'));
  if (files.length === 0) {
    console.error('Usage: uic check [--list] <file...>');
    return 1;
  }
  const { absolute, problems } = await givenFiles(rootDir, files);
  if (problems.length > 0) {
    sayHowToNameFiles(problems);
    return 1;
  }

  const findings = await analyzeProject(rootDir, absolute);

  // ~~**A check that could not run says so whether or not the others found
  // something** (#70).~~ **There is no longer a check that can fail to run
  // (#81).** That warning was about the package chain: on one real monorepo 31
  // findings read as a working tool while three checks were dead, because every
  // workspace package named a built entry point and no chain was readable
  // anywhere. With the graph gone, the one check left needs nothing detected —
  // it either has a rule to apply or the project has written none, and the
  // coverage line below says which.

  // A run that reports nothing is either a clean project or a blind tool, and
  // from outside they look identical — which is how 400 screen files were
  // reported as success on a repository where nothing had been looked at (#37).
  // Paid for only here, where there is nothing else to say and nobody waiting
  // on a list.
  let coverage: Coverage | null = null;
  if (findings.length === 0) {
    coverage = await coverageOf(rootDir, absolute).catch(() => null);
    if (coverage !== null && !listOnly) {
      for (const line of sayCoverage(coverage)) console.error(line);
    }
  }

  // None of them could be read, so nothing was checked and exit 0 would say
  // "nothing wrong" about work nobody did. The same answer `diff` gives where
  // none of the paths it was handed was a screen. A project no package was
  // detected in is **not** this case: every check that needs no chain ran on
  // every file, and failing those would be the gate `CLAUDE.md` forbids.
  if (coverage !== null && coverage.given > 0 && coverage.read === 0) {
    if (listOnly) console.error(`None of the ${coverage.given} file(s) given could be read.`);
    return 1;
  }

  if (listOnly) {
    // Paths and nothing else. The batch driver builds its queue from this, and
    // it must not pull every file's findings into its own context on the way —
    // that accumulation is the failure the driver exists to avoid.
    const seen = new Set<string>();
    for (const finding of findings) {
      const path = relative(rootDir, finding.file);
      if (seen.has(path)) continue;
      seen.add(path);
      console.log(path);
    }
    // An empty queue is the answer a driver acts on, so it has to be able to
    // tell a clean set from a set nothing looked at. On **stderr**, because
    // stdout is the queue and pulling anything else into it is the context
    // flood the driver exists to avoid.
    if (seen.size === 0 && coverage !== null) {
      for (const line of sayCoverage(coverage)) console.error(line);
    }
    return seen.size > 0 ? 1 : 0;
  }

  for (const finding of findings) {
    // Absolute paths are right for a caller; a reader wants them repo-relative.
    console.log(`${formatFinding({ ...finding, file: relative(rootDir, finding.file) })}\n`);
  }

  // **A check that could not run says so whether or not the others found
  // something** (#70). Coverage is paid for only where there are no findings,
  // which is the right cost decision and leaves a hole one level below the one
  // #37 closed: #37 made a *command* that finds nothing say what it read, and a
  // command that finds something still said nothing about which of its seven
  // checks ran. On one real monorepo 31 findings from four checks read as a
  // working tool while three were dead — every workspace package named a built
  // entry point, so no chain was readable anywhere.
  //
  // Not a coverage report on every run: one line, after the findings, and only
  // where a chain could be read for **no file in the set**, which is a fact
  // about the run rather than about any file in it.
  return findings.length > 0 ? 1 : 0;
}

/**
 * The `PostToolUse` adapter: a tool-call payload on stdin, findings on stdout.
 *
 * Always exits 0. A hook that fails is a hook that interrupts the person's
 * work, and no finding is worth that.
 */
async function hook(): Promise<number> {
  const response = await hookResponse(await readStdin()).catch(() => null);
  if (response !== null) console.log(JSON.stringify(response));
  return 0;
}

/**
 * Everything a harness sends a hook, as one string.
 *
 * Written out once. Three adapters read stdin the same way, and the third copy
 * is what `tests/core/duplicates.test.ts` exists to refuse.
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * The `SessionStart` adapter: says at most one line, and only when it is news.
 *
 * Always exits 0, like the other hook, and for the same reason: a hook that
 * fails is a hook that interrupts somebody's work.
 */
async function session(): Promise<number> {
  const response = await sessionResponse(await readStdin()).catch(() => null);
  if (response !== null) console.log(JSON.stringify(response));
  return 0;
}

/**
 * The duplicate-shape audit — deliberately a separate mode of a read-only
 * command, and never part of the per-file gate.
 *
 * From an AST a propagated mistake and a shared pattern look identical. A
 * repeated shape is therefore evidence that something deserves a person's
 * attention, never evidence that a file is wrong; firing it on an edit would
 * enforce whatever is most common, which is the inference this project exists
 * to refuse.
 */
async function auditShapes(rootDir: string, args: string[]): Promise<number> {
  const given = args.filter((arg) => !arg.startsWith('-'));
  if (given.length === 0) {
    console.error('Usage: uic shapes <file...>');
    return 1;
  }

  const { absolute: named, problems } = await givenFiles(rootDir, given);
  if (problems.length > 0) {
    sayHowToNameFiles(problems);
    return 1;
  }
  const files = named;

  // ~~A package nothing depends on is a leaf — an app. A package other packages
  // depend on is the shared vocabulary this audit compares against.~~
  //
  // **The package graph is gone (#81), so there is no dependency direction to
  // ask** — and the comment below already said the dichotomy was not real: on
  // one real monorepo 960 of 990 files fell on the library side of it, which
  // left the repeated-shape question with almost nothing to look at. A file
  // with exactly one export is a candidate for naming a shape wherever it
  // sits; the split only ever decided which files were *also* eligible for
  // that, and dropping it makes more of them eligible rather than fewer.
  const library: { component: string; file: string; source: string }[] = [];
  const app: { file: string; source: string }[] = [];

  for (const file of files) {
    const absolute = resolve(rootDir, file);
    const source = await readFile(absolute, 'utf8').catch(() => null);
    if (source === null) continue;

    // Only a file with exactly one export can be named with confidence. Taking
    // the first of several attributed every shape in the file to whichever
    // symbol happened to be declared first, which is a guess presented as a
    // fact.
    const exported = [...exportedSymbolsFromSource(source)];
    if (exported.length === 1) {
      library.push({ component: exported[0]!, file: relative(rootDir, absolute), source });
    }
    // Every file is audited either way.
    app.push({ file: relative(rootDir, absolute), source });
  }

  const report = shapeReport({ library, app });

  // Grouped by the component whose shape it is. On Backstage one drawer shape
  // turned up 24 times across the kubernetes plugin; printing 24 lines that
  // each name the same component is a list, not a report.
  const byComponent = new Map<string, { definedIn: string; places: string[] }>();
  for (const entry of report.handRolled) {
    const group = byComponent.get(entry.component) ?? { definedIn: entry.definedIn, places: [] };
    group.places.push(`${entry.file}:${entry.line}`);
    byComponent.set(entry.component, group);
  }
  for (const [component, group] of [...byComponent].sort(
    (a, b) => b[1].places.length - a[1].places.length,
  )) {
    console.log(
      `shape of ${component} (${group.definedIn})\n  appears in ${group.places.length} other place(s):`,
    );
    for (const place of group.places.slice(0, 5)) console.log(`    ${place}`);
    if (group.places.length > 5) console.log(`    … and ${group.places.length - 5} more`);
  }
  for (const entry of report.repeated) {
    const backing =
      entry.existsAs === null
        ? 'nothing exports this shape — a candidate for extraction'
        : `${entry.existsAs.component} already has this shape (${entry.existsAs.definedIn})`;
    console.log(`${entry.files.length} files share a ${entry.size}-element shape — ${backing}:`);
    for (const file of entry.files.slice(0, 5)) console.log(`    ${file}`);
    if (entry.files.length > 5) console.log(`    … and ${entry.files.length - 5} more`);
  }

  if (report.handRolled.length === 0 && report.repeated.length === 0) {
    console.log('No repeated shapes worth extracting, and nothing rebuilt.');
  } else {
    console.log('\nSuspects, not findings. A shape that repeats may be a shared pattern');
    console.log('worth extracting, a component somebody rebuilt by hand, or the same');
    console.log('mistake copied. From the AST those look identical — read them before');
    console.log('acting on any of them. This is why it is a separate command and never');
    console.log('part of the per-file check.');
  }
  // Read-only, and never a gate.
  return 0;
}

async function showLog(rootDir: string): Promise<number> {
  const entries = await readLog(rootDir);
  if (entries.length === 0) {
    console.log('Nothing logged yet for this project.');
    console.log(`It is written to ${logPath(rootDir)} as you work, unless UIC_LOG=off.`);
    return 0;
  }

  console.log(`Project: ${rootDir}`);
  const summary = summarise(entries, await readSeen(rootDir));
  const days =
    summary.from === null || summary.to === null
      ? ''
      : ` over ${Math.max(1, Math.round((summary.to - summary.from) / 86_400_000))} day(s)`;
  console.log(`${summary.total} finding(s), ${summary.advice} advisory${days}\n`);

  if (summary.advice > 0) {
    const advisories = entries.filter((entry) => entry.kind === 'advice');
    console.log('Advice handed to the agent — a judgement, so worth checking by hand:');
    for (const entry of advisories.slice(-5)) {
      console.log(`  ${entry.file}`);
      console.log(`    ${entry.message}`);
    }
    if (advisories.length > 5) console.log(`  … and ${advisories.length - 5} more`);
    console.log('');
  }

  if (summary.total === 0) {
    console.log(`Full log: ${logPath(rootDir)}`);
    return 0;
  }

  console.log('By kind:');
  for (const [level, count] of Object.entries(summary.byLevel).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${level}`);
  }

  console.log('\nFiles that produce the most:');
  for (const entry of summary.byFile.slice(0, 10)) {
    console.log(`  ${String(entry.count).padStart(5)}  ${entry.file}`);
  }

  if (summary.spread.length > 0) {
    // The one thing in this project measured from real work rather than from a
    // fixture. A finding on a dozen files is not twelve accidents; it is
    // something the team has an opinion about and has not written down.
    console.log('\nSaid about many different files:');
    for (const entry of summary.spread.slice(0, 10)) {
      console.log(`  ${String(entry.files).padStart(5)} files  ${entry.message}`);
    }
    // Two readings, and the log cannot tell them apart — which is fine, because
    // both are worth a person's attention and neither is worth a finding. One
    // of them is the maintenance signal #99 wanted; the other is the more
    // uncomfortable one, and saying only the first would be flattering.
    console.log('\nEither the project has an opinion here it has not written down —');
    console.log(`one heading in ${KNOWLEDGE_DIR}/ is enough — or it has written`);
    console.log('one and nothing is following it. Both are worth reading; neither is');
    console.log('a failure.');
  }

  if (summary.repeated.length > 0) {
    console.log('\nSaid more than once — told, and not acted on:');
    for (const entry of summary.repeated.slice(0, 10)) {
      console.log(`  ${String(entry.times).padStart(5)}x ${entry.file}:${entry.line}`);
      console.log(`         ${entry.message}`);
    }
    console.log('\nThese are the ones worth reading: either the finding is wrong,');
    console.log('or it is right and nothing is acting on it. Both are worth knowing.');
  }

  // What an absence of repeats means, and what it does not (#221).
  //
  // This used to read "nothing came back" as "everything was acted on". A
  // finding only had the chance to come back if its file was checked a second
  // time, and over sixty files edited once each, none of them were — so the
  // log reported a clean bill of health on evidence it did not have. The two
  // causes are distinguishable from timestamps it already keeps, and saying
  // which one this is beats a sentence that congratulates the reader.
  if (summary.acted + summary.unknown > 0) {
    console.log('\nFindings that did not come back:');
    console.log(`  ${String(summary.acted).padStart(5)}  acted on — the file was checked again and this was gone`);
    console.log(`  ${String(summary.unknown).padStart(5)}  not known — the file was never checked again`);
    console.log('\nOnly the first is evidence. A file edited once has had no chance to');
    console.log('show whether it was told and did nothing.');
  }

  console.log(`\nFull log: ${logPath(rootDir)}`);
  return 0;
}

export async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  const rootDir = process.cwd();

  switch (command) {
    case 'check':
      return check(rootDir, rest);
    case 'shapes':
      return auditShapes(rootDir, rest);
    case 'log':
      return showLog(rootDir);
    case 'hook':
      return hook();
    case 'session':
      return session();
    default:
      console.error('Usage: uic <check|shapes|log>');
      return 1;
  }
}

// Only run when executed, not when imported by a test.
//
// By identity, not by name. This used to be `argv[1].endsWith('uic.mjs')`, so a
// copy of the bundle under any other name exited 0 having done nothing — a
// wrapper, a symlink called `uic`, a CI step copying it to `tools/check.mjs`,
// all silent and all successful (#189).
//
// The one fact that matters if this is ever tidied: **`import.meta.url` comes
// back with symlinks already followed, and `process.argv[1]` is whatever was
// typed.** Compare them as written and the guard fails wherever a real path
// differs from the typed one — which on macOS is anything under `/tmp` or
// `/var`.
//
// Anything that is not a resolvable path is simply not the entry point.
// `argv[1]` is `-` when a script is piped in on stdin, and resolving that threw
// out of the module's top level: a crash rather than silence, which is louder
// and still wrong.
if (process.argv[1] !== undefined) {
  const entry = await realpath(process.argv[1])
    .then((real) => pathToFileURL(real).href)
    .catch(() => null);
  if (entry === import.meta.url) process.exit(await main(process.argv.slice(2)));
}

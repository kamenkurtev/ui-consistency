import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { detectionSources } from '../layers/detect.js';
import { cachedPackages, clearPackageCache } from '../layers/cache.js';
import { resolveChain, contains } from '../layers/chain.js';
import { readConfig, applyConfig } from '../layers/config.js';
import { buildInventory } from '../inventory/build.js';
import { exportedSymbolsFromSource } from '../inventory/exports.js';
import { placementOf } from '../sources/routes.js';
import { screenTree, DEFAULT_DEPTH, MAX_DEPTH, type TreeNode } from '../sources/tree.js';
import { groupScreens } from '../sources/grouping.js';
import { findProjectRoot } from '../layers/detect.js';
import { readLog, readSeen, summarise, logPath } from './log.js';
import { shapeReport } from '../checks/shapes.js';
import { formatFinding } from '../core/format.js';
import { coverageOf, sayCoverage, type Coverage } from '../core/coverage.js';
import { hookResponse } from './hook.js';
import { sessionResponse } from './session.js';
import { cachedInventory } from '../inventory/cache.js';
import { KNOWLEDGE_DIR } from '../knowledge/paths.js';
import { pathToFileURL } from 'node:url';

export { checkProject, analyzeProject, type CheckOptions } from '../core/project.js';
import { analyzeProject } from '../core/project.js';

/**
 * Where a screen belongs: its route, the trail it implies, and where that is
 * registered.
 *
 * Four decisions spread across four files that no per-file check can see, and
 * the breadcrumb is the one got wrong nearly every time — because the trail
 * lives in the router, not in the file being edited.
 */
/**
 * What one screen renders, resolved through the repository.
 *
 * A fact supplier and nothing else: no verdict, no advice, exit 0 whatever it
 * finds. It exists because answering *"what is this screen actually made of"*
 * needed a script written from scratch every session and thrown away — and
 * because the answer is not in the screen's own file. Reading the file alone
 * put 11 of 132 screens in one bucket; following one hop put 26 there.
 *
 * Every leaf says why it is one. `external` is where the walk is meant to stop,
 * `beyond` is the depth bound, `local` is declared in the file that uses it,
 * and `unresolved` is a specifier that led nowhere — which is a gap in the
 * reading and must never be mistaken for the bottom of the screen.
 */
async function tree(rootDir: string, args: string[]): Promise<number> {
  const file = pathsIn(args)[0];
  if (file === undefined) {
    console.error(`Usage: uic tree <screen> [--depth N]   (1-${MAX_DEPTH}, default ${DEFAULT_DEPTH})`);
    return 1;
  }

  const depth = depthIn(args);

  const absolute = resolve(rootDir, file);
  const root = (await findProjectRoot(dirname(absolute))) ?? rootDir;
  const walked = await screenTree(root, absolute, depth === undefined ? {} : { depth });

  if (walked === null) {
    // Not a green result. A file with no component in it is not a screen, and
    // saying nothing about it would read as a screen with nothing in it.
    console.error(`Nothing to read in ${relative(rootDir, absolute)}.`);
    console.error('Either it renders no component, or it is not a screen file.');
    return 0;
  }

  console.log(
    `${relative(root, absolute)} — ${walked.depth} ${walked.depth === 1 ? 'level' : 'levels'}, ` +
      `${walked.read.length} ${walked.read.length === 1 ? 'file' : 'files'} read` +
      `${walked.truncated ? ', stopped by the depth' : ''}`,
  );
  for (const line of branch(walked.root, 0, null)) console.log(line);
  return 0;
}

/**
 * One node per line, indented by its depth. Stable, so a diff of two runs is a
 * diff of two screens.
 *
 * **A file is printed only where the walk moved to one**, which is the whole
 * readability of this output. Every node carries the file it was read from, so
 * printing it on all of them repeats the parent's path on the element that
 * parent renders — `DataGrid  src/grids/OrdersGrid.tsx` reads as *DataGrid
 * lives here*, which is not what it says. Printed on the hop alone, the column
 * means one thing: this is where the walk went next.
 */
function branch(node: TreeNode, indent: number, from: string | null): string[] {
  const moved = node.file !== null && node.file !== from;
  const where = node.at === 'project' ? (moved ? `  ${node.file}` : '') : `  (${node.at})`;
  // Said on the node it is about rather than as a child of the same name.
  const stopped = node.holderAt === undefined ? '' : `  (holder in a ${node.holderAt})`;
  // Passed as data, not held. Said, because a tree that prints it as a child
  // claims a shape the file does not have.
  const through = node.via === undefined ? '' : `  ← ${node.via}`;
  return [
    `${'  '.repeat(indent)}${node.name}${where}${stopped}${through}`,
    ...node.children.flatMap((child) => branch(child, indent + 1, node.file)),
  ];
}

/**
 * A set of screens, grouped by what they are composed of.
 *
 * The third of the scans that were rewritten by hand every session. A name
 * survives into a signature only where more than one screen renders it, so nine
 * list screens that differ on the name of their grid are one group and not nine
 * — derived from the set in hand, never from a list of layout components.
 */
async function group(rootDir: string, args: string[]): Promise<number> {
  const files = pathsIn(args);
  if (files.length === 0) {
    console.error(`Usage: uic group <file...> [--depth N]   (1-${MAX_DEPTH}, default ${DEFAULT_DEPTH})`);
    return 1;
  }

  const { absolute, problems } = await givenFiles(rootDir, files);
  for (const problem of problems) console.error(problem);
  if (absolute.length === 0) {
    console.error('No file to read, so there is nothing to group.');
    return 1;
  }

  const grouped = await groupScreens(rootDir, absolute, depthIn(args));
  const inGroups = grouped.groups.reduce((count, one) => count + one.members.length, 0);
  const screens = inGroups + grouped.ungrouped.length + grouped.shapeless.length;
  // Both counts, because a few groups over many files reads as agreement and a
  // few groups over a few screens is a small answer (#32).
  const skipped = grouped.notScreens.length;
  console.log(
    `${grouped.given} ${grouped.given === 1 ? 'file' : 'files'}, ` +
      `${screens} ${screens === 1 ? 'screen' : 'screens'}` +
      `${grouped.given === 0 ? '' : ` (${Math.round((screens / grouped.given) * 100)}% of what was given)`}` +
      `${skipped === 0 ? '' : `, ${skipped} not a screen`}, read ${grouped.depth} ` +
      `${grouped.depth === 1 ? 'level' : 'levels'} — ${grouped.groups.length} ` +
      `${grouped.groups.length === 1 ? 'group' : 'groups'}`,
  );

  // **A reader has to be able to tell a pattern from a list** (#58). 527 groups
  // over 833 screens is not 527 findings; it is a grouping that found nothing,
  // and printed as a ranked list it reads as the opposite. So the ratio is
  // stated, and where it is near one the answer is said in words.
  //
  // The proportion of files called screens is in the heading for the same
  // reason: two real React monorepos of comparable size disagreed by a factor
  // of three — 14% against 43% — and a number nobody can see is a disagreement
  // nobody can find.
  if (grouped.groups.length > 0 && inGroups > 0) {
    const per = inGroups / grouped.groups.length;
    console.log(
      `${per.toFixed(1)} screens per group` +
        (per < 2.5
          ? ' — that is a list and not a grouping: these screens mostly share nothing.'
          : ''),
    );
  }

  for (const one of grouped.groups) {
    console.log(`\n${one.members.length} ${one.members.length === 1 ? 'screen' : 'screens'}`);
    for (const line of one.signature) console.log(`  ${line}`);
    console.log(`  e.g. ${one.members[0]}`);
  }
  if (grouped.ungrouped.length > 0) {
    const n = grouped.ungrouped.length;
    console.log(
      `\n${n} ${n === 1 ? 'screen shares' : 'screens share'} nothing with any of these\n  ` +
        grouped.ungrouped.join('\n  '),
    );
  }
  if (grouped.shapeless.length > 0) {
    const n = grouped.shapeless.length;
    console.log(
      `\n${n} ${n === 1 ? 'screen renders' : 'screens render'} one node and nothing under it, so` +
        ` there is no shape to group by — a leaf, or a holder whose children could not be read\n  ` +
        grouped.shapeless.join('\n  '),
    );
  }
  if (grouped.notScreens.length > 0) {
    console.log(
      `\nnot screens — nothing rendered in them, a name saying what they are,` +
        ` or a part another of these files imports\n  ${grouped.notScreens.join('\n  ')}`,
    );
  }
  return 0;
}

/**
 * The paths in an argument list, with the flags and their values removed.
 *
 * `--depth`'s value is a bare word and would otherwise be taken as a file:
 * `uic tree --depth 3 src/OrdersPage.tsx` read `3`. Written once because both
 * commands that take a depth have the same hole.
 */
function pathsIn(args: string[]): string[] {
  const at = args.findIndex((arg) => arg === '--depth');
  const value = at === -1 ? -1 : at + 1;
  return args.filter((arg, index) => !arg.startsWith('-') && index !== value);
}

/** `--depth 3` or `--depth=3`, and nothing where it was not asked for. */
function depthIn(args: string[]): number | undefined {
  const at = args.findIndex((arg) => arg === '--depth' || arg.startsWith('--depth='));
  if (at === -1) return undefined;
  const depth = Number.parseInt(args[at]?.split('=')[1] ?? args[at + 1] ?? '', 10);
  return Number.isNaN(depth) ? undefined : depth;
}

async function place(rootDir: string, args: string[]): Promise<number> {
  const file = args.find((arg) => !arg.startsWith('-'));
  if (file === undefined) {
    console.error('Usage: uic place <screen>');
    return 1;
  }

  const absolute = resolve(rootDir, file);
  const root = (await findProjectRoot(dirname(absolute))) ?? rootDir;
  const placed = await placementOf(absolute, root);

  if (placed.style === null) {
    console.error(`Nothing routes ${relative(rootDir, absolute)}.`);
    console.error('Either it is not a screen, or its route is registered somewhere this cannot');
    console.error('read. Say where, rather than letting a path be guessed from the folder.');
    return 0;
  }

  console.log(
    JSON.stringify(
      {
        ...placed,
        ...(placed.declaredIn === null
          ? {}
          : {
              declaredIn: {
                ...placed.declaredIn,
                file: relative(rootDir, placed.declaredIn.file),
              },
            }),
      },
      null,
      2,
    ),
  );
  return 0;
}

async function scan(rootDir: string): Promise<number> {
  // What `init` used to print, kept because it is the only way a repository
  // learns which of the two detection mechanisms applied to it — and when the
  // answer is "neither", the difference between a bug report and a user
  // concluding the tool is broken.
  const sources = await detectionSources(rootDir);
  const detected = await cachedPackages(rootDir);
  if (detected.length === 0) {
    console.error('No packages detected.');
    console.error('\nLooked for:');
    console.error('  pnpm-workspace.yaml, or package.json workspaces — the package set');
    console.error('  each package.json dependencies — the order between them');
    console.error('  compilerOptions.paths in tsconfig.base.json or tsconfig.json — packages');
    console.error('  that have no manifest at all, as an Nx workspace does');
    console.error('\nNone of them matched here. That is a gap in detection rather than');
    console.error('something for you to configure — please report what this repository');
    console.error('looks like: https://github.com/kamenkurtev/ui-consistency/issues');
    return 1;
  }

  // A single-package project matches neither mechanism and is still detected,
  // from the root manifest — saying "via :" would read as a bug.
  console.log(`Detected packages, via ${sources.length > 0 ? sources.join(' and ') : 'the root package.json'}:`);
  for (const pkg of detected) {
    console.log(`  ${pkg.name} → ${pkg.dependencies.join(', ') || '(no dependencies)'}`);
  }
  console.log('');

  // `scan` is the refresh command, so it is also how a derived graph gone
  // stale is put right — the one thing the hook cannot notice for itself.
  await clearPackageCache(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), await readConfig(rootDir));
  const layers = packages.map((pkg) => ({
    name: pkg.name,
    root: pkg.root,
    dependencies: pkg.dependencies,
  }));
  const inventory = await buildInventory(layers);
  for (const [name, symbols] of Object.entries(inventory.layers)) {
    const total = Object.keys(symbols).length;
    const deprecated = Object.values(symbols).filter((s) => s.deprecated).length;
    console.log(`${name}: ${total} exports${deprecated > 0 ? `, ${deprecated} deprecated` : ''}`);
  }
  return 0;
}

/**
 * Say so when not one of the files given was on any layer chain.
 *
 * Stderr and never an exit code: it is a report about detection, not a finding
 * about the code, and a pipeline that fails on it would fail on every
 * repository this tool has nothing to say about. But it has to be *said*.
 */
async function warnIfNothingWasChecked(rootDir: string, files: string[]): Promise<void> {
  if (files.length === 0) return;

  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const prefer = config?.prefer ?? [];

  const onAChain = files.filter((file) => resolveChain(file, packages, prefer).length > 0);
  if (onAChain.length > 0) return;

  // Not "nothing was checked" any more: style, emoji, page rules and curated
  // substitutions all ran. What could not run is everything that needs to know
  // which layer a file belongs to, and saying so precisely is the difference
  // between a warning somebody acts on and one they learn to skip.
  console.error(`\nNone of the ${files.length} file(s) given belongs to a detected package.`);
  console.error('The checks that read one — the import check, and the layer half of substitutions — did not run.');
  console.error('This is a detection gap, not a clean result.');
  if (packages.length === 0) {
    console.error('No packages were detected at all — run `uic scan` to see what was looked for.');
  } else {
    console.error('Detected packages, and where they are rooted:');
    for (const pkg of packages.slice(0, 10)) {
      console.error(`  ${pkg.name} → ${relative(rootDir, pkg.root) || '.'}`);
    }
    console.error('If none of those is where your application lives, that is the bug —');
    console.error('please report it: https://github.com/kamenkurtev/ui-consistency/issues');
  }
}

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

/**
 * Could a chain be read for any of these files?
 *
 * Not *is any file on a chain* — a package whose entry point names build output
 * absent from a checkout resolves a chain of layers and reads nothing from any
 * of them, which is the case #70 is about. So the question is asked of the
 * inventory, which is what the three chain checks actually consume.
 *
 * Stops at the first yes: on a set where everything works this costs one
 * inventory read, and that one is already cached from the run above.
 */
async function someFileIsOnAChain(rootDir: string, files: string[]): Promise<boolean> {
  const config = await readConfig(rootDir).catch(() => null);
  const packages = applyConfig(await cachedPackages(rootDir).catch(() => []), config);
  if (packages.length === 0) return false;
  const prefer = config?.prefer ?? [];

  for (const file of files) {
    const chain = resolveChain(file, packages, prefer);
    if (chain.length === 0) continue;
    const inventory = await cachedInventory(rootDir, chain).catch(() => null);
    // A layer with no symbols read is a layer that answered nothing, and a
    // chain of those is what a built entry point produces.
    if (inventory !== null && Object.values(inventory.layers).some((one) => Object.keys(one).length > 0)) {
      return true;
    }
  }
  return false;
}

/** The same advice both callers give, in one place. */
function sayHowToNameFiles(problems: string[]): void {
  for (const problem of problems) console.error(problem);
  console.error("Name the files, or let the shell name them: $(git ls-files '*.tsx')");
}

async function check(rootDir: string, args: string[]): Promise<number> {
  const flags = args.filter((arg) => arg.startsWith('-'));
  const unknown = flags.filter((flag) => flag !== '--within-layer' && flag !== '--list');
  if (unknown.length > 0) {
    // Silently ignoring a misspelt flag would run the opposite of what was
    // asked for and say nothing about it.
    console.error(`Unknown option: ${unknown.join(', ')}`);
    console.error('Usage: uic check [--within-layer] [--list] <file...>');
    return 1;
  }

  const withinLayer = flags.includes('--within-layer');
  const listOnly = flags.includes('--list');
  const files = args.filter((arg) => !arg.startsWith('-'));
  if (files.length === 0) {
    console.error('Usage: uic check [--within-layer] <file...>');
    return 1;
  }
  const { absolute, problems } = await givenFiles(rootDir, files);
  if (problems.length > 0) {
    sayHowToNameFiles(problems);
    return 1;
  }

  const findings = await analyzeProject(rootDir, absolute, { withinLayer });

  // **A check that could not run says so whether or not the others found
  // something** (#70). Coverage is paid for only where there are no findings,
  // which is the right cost decision and leaves a hole one level below the one
  // #37 closed: #37 made a *command* that finds nothing say what it read, and a
  // command that finds something still said nothing about which of its seven
  // checks ran. On one real monorepo 31 findings from four checks read as a
  // working tool while three were dead — every workspace package named a built
  // entry point, so no chain was readable anywhere.
  //
  // Not a coverage report on every run: one line, and only where a chain could
  // be read for **no file in the set**, which is a fact about the run rather
  // than about any file in it.
  // A file on no chain is skipped, silently and by design — most of what a
  // repository holds is not UI. Every file skipped is a different matter: it
  // means detection found no package that owns any of them, and an exit code of
  // 0 then says "nothing wrong" about work that was never done. That is exactly
  // how a whole application went unchecked with a green result (#110).
  if (!listOnly) await warnIfNothingWasChecked(rootDir, absolute);

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
  if (findings.length > 0 && !(await someFileIsOnAChain(rootDir, absolute))) {
    console.error('Note: no file in this set belongs to a package whose entry point could be read,');
    console.error('so the import check and the layer half of substitutions did not run.');
    console.error('`uic inventory <file>` says which layers were tried. What is above is the four');
    console.error('checks that need no chain.');
  }

  return findings.length > 0 ? 1 : 0;
}

/**
 * What one file's chain exports — the third of the four things a subagent is
 * given, and the only one nothing printed before.
 *
 * `scan` is the wrong shape for this: it reports every layer in the repository,
 * which is both far more than a subagent should see and not organised by the
 * chain that actually applies to its file.
 */
async function inventory(rootDir: string, args: string[]): Promise<number> {
  const file = args.find((arg) => !arg.startsWith('-'));
  if (file === undefined) {
    console.error('Usage: uic inventory <file>');
    return 1;
  }

  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const chain = resolveChain(resolve(rootDir, file), packages, config?.prefer ?? []);
  // ~~Silence rather than an error, as everywhere else: a file on no chain is a
  // file this tool has nothing to say about.~~ **Silence here is the failure**
  // (#37): a command answering with empty output and exit 0 says "nothing to
  // report" where the truth is "this file belongs to nothing I detected", and
  // those are the two answers a user must never have to guess between.
  const named = relative(rootDir, resolve(rootDir, file));
  if (chain.length === 0) {
    console.error(`${named} belongs to no detected package.`);
    console.error(
      packages.length === 0
        ? 'No package was detected at all — `uic scan` shows what was looked for.'
        : `${packages.length} package(s) were detected, and none of them owns this file.`,
    );
    console.error('There is no inventory to print, which is a detection gap and not a clean result.');
    return 1;
  }

  const built = await cachedInventory(rootDir, chain);
  let printed = 0;
  for (const layer of chain) {
    const symbols = built.layers[layer.name] ?? {};
    const names = Object.keys(symbols).sort();
    // A layer with nothing readable is almost always an external package with
    // no source here. On Backstage that is 399 of one file's 476 layers, and
    // printing them buries the 77 that matter under a wall the subagent has to
    // read past — the exact context flood the driver is built to avoid.
    if (names.length === 0) continue;
    printed++;
    console.log(`# ${layer.name}`);
    for (const name of names) {
      const entry = symbols[name]!;
      const note = entry.deprecated
        ? ` — deprecated${entry.replacement === null ? '' : `, use ${entry.replacement}`}`
        : '';
      console.log(`  ${name}${note}`);
    }
  }
  // A chain of layers this tool cannot read the source of — every one external,
  // or every barrel unreadable. An answer, and not the same answer as a file
  // with nothing exported near it.
  if (printed === 0) {
    console.error(`Nothing readable on the ${chain.length} layer(s) ${named} sits on:`);
    for (const layer of chain.slice(0, 10)) console.error(`  ${layer.name}`);
    console.error('Every one of them is external, or its entry point could not be read.');
    // **Two answers that need different actions** (#70). A third-party package
    // has no source here and never will; a workspace package whose manifest
    // names build output has source right there, under a name nothing looked
    // for. Saying only "external" sends a reader to the wrong one.
    console.error('A workspace package naming a built entry — `"main": "./index.js"` in a checkout —');
    console.error('is the second case, and `src/index.ts` beside it is what would be read instead.');
    return 1;
  }
  return 0;
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

  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  // A package nothing depends on is a leaf — an app. A package other packages
  // depend on is the shared vocabulary this audit compares against.
  const dependedOn = new Set(packages.flatMap((pkg) => pkg.dependencies));

  const library: { component: string; file: string; source: string }[] = [];
  const app: { file: string; source: string }[] = [];

  for (const file of files) {
    const absolute = resolve(rootDir, file);
    const source = await readFile(absolute, 'utf8').catch(() => null);
    if (source === null) continue;

    const owner = packages.find((pkg) => contains(pkg.root, absolute));
    const shared = owner !== undefined && dependedOn.has(owner.name);
    if (shared) {
      // Only a file with exactly one export can be named with confidence.
      // Taking the first of several attributed every shape in the file to
      // whichever symbol happened to be declared first, which is a guess
      // presented as a fact.
      const exported = [...exportedSymbolsFromSource(source)];
      if (exported.length === 1) {
        library.push({ component: exported[0]!, file: relative(rootDir, absolute), source });
      }
    }
    // Every file is audited, shared or not. "The library" and "the app" is not
    // a real dichotomy in a monorepo — on Backstage 960 of 990 files were on
    // the library side of it, which left the repeated-shape question with
    // almost nothing to look at.
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
    case 'place':
      return place(rootDir, rest);
    case 'tree':
      return tree(rootDir, rest);
    case 'group':
      return group(rootDir, rest);
    case 'scan':
      return scan(rootDir);
    case 'check':
      return check(rootDir, rest);
    case 'shapes':
      return auditShapes(rootDir, rest);
    case 'inventory':
      return inventory(rootDir, rest);
    case 'log':
      return showLog(rootDir);
    case 'hook':
      return hook();
    case 'session':
      return session();
    default:
      console.error('Usage: uic <place|tree|group|scan|check|shapes|inventory|log>');
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

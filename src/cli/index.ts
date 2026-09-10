import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { detectionSources } from '../layers/detect.js';
import { cachedPackages, clearPackageCache } from '../layers/cache.js';
import { resolveChain, contains } from '../layers/chain.js';
import { readConfig, applyConfig } from '../layers/config.js';
import { buildInventory } from '../inventory/build.js';
import { cachedInventory } from '../inventory/cache.js';
import { checkSource } from '../core/check.js';
import { exportedSymbolsFromSource } from '../inventory/exports.js';
import { runEngine } from '../core/engine.js';
import { parseKnowledge } from '../knowledge/parse.js';
import { buildAdvice } from '../ai/advice.js';
import { neighbourSource } from '../sources/neighbours.js';
import { observeUsage } from '../sources/usage.js';
import { patternOf } from '../sources/pattern.js';
import { readDecisions } from '../knowledge/decisions.js';
import { placementOf } from '../sources/routes.js';
import { markupOf, pairOf } from '../sources/pair.js';
import { screenTree, DEFAULT_DEPTH, MAX_DEPTH, type TreeNode } from '../sources/tree.js';
import { propsMatrix } from '../sources/matrix.js';
import { groupScreens } from '../sources/grouping.js';
import {
  patternFiles,
  patternForScreen,
  staleIn,
  type PatternFile,
  type Stale,
} from '../knowledge/pattern-file.js';
import { regionsOf } from '../sources/regions.js';
import { templateKind } from '../parse/template.js';
import { findProjectRoot } from '../layers/detect.js';
import {
  contractDeviations,
  contractsForScreen,
  isContract,
  type Deviation,
} from '../checks/contract.js';
import { patternDeviations } from '../checks/pattern-check.js';
import { renderPattern } from '../knowledge/pattern-write.js';
import type { ScreenPattern } from '../sources/pattern.js';
import { parsePattern } from '../knowledge/pattern-file.js';
import { contractPathFor, readLog, readSeen, summarise, logPath } from './log.js';
import { shapeReport } from '../checks/shapes.js';
import { resolveSource, statedConventions } from '../sources/adapter.js';
import type { SourceModel } from '../sources/adapter.js';
import { formatFinding } from '../core/format.js';
import { hookResponse } from './hook.js';
import { sessionResponse } from './session.js';
import { promptResponse } from './prompt.js';
import type { Finding, Inventory, Layer, Violation } from '../types.js';
import { KNOWLEDGE_DIR, MOVED, knowledgeDir } from '../knowledge/paths.js';
import { ownedDir, projectKey } from '../core/cache-dir.js';
import { pathToFileURL } from 'node:url';

export interface CheckOptions {
  /**
   * Include findings whose expected layer is the file's own.
   *
   * Off by default. On a real repository this class was 94 of 253 findings and
   * mostly noise — a design system's own components reaching for the headless
   * primitives they are built from, which is what that layer is for. The
   * findings are still produced, so an audit can ask for them.
   */
  withinLayer?: boolean;
}

/**
 * One inventory per chain, for the length of a run.
 *
 * A batch of thirty files in one package resolves to the same chain thirty
 * times, and building the inventory reads and parses every barrel on it. Both
 * `checkProject` and `analyzeProject` need this and each had its own copy.
 */
function inventoryReader(rootDir: string): (chain: Layer[]) => Promise<Inventory> {
  const inventories = new Map<string, Inventory>();
  return async (chain) => {
    const key = chain.map((layer) => layer.name).join('>');
    let inventory = inventories.get(key);
    if (inventory === undefined) {
      inventory = await cachedInventory(rootDir, chain);
      inventories.set(key, inventory);
    }
    return inventory;
  };
}

/**
 * Check the given files against the project's own layer chain.
 *
 * Files in the same package share a chain and therefore an inventory, so it is
 * built once per distinct chain rather than once per file, and kept on disk
 * between runs against the mtimes of everything it was built from.
 *
 * What counts as a violation is the check's business; which violations are
 * worth showing is policy, and lives here.
 */
export async function checkProject(
  rootDir: string,
  files: string[],
  options: CheckOptions = {},
): Promise<Violation[]> {
  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  if (packages.length === 0) return [];
  const prefer = config?.prefer ?? [];

  const inventoryFor = inventoryReader(rootDir);

  const violations: Violation[] = [];
  for (const file of files) {
    const chain = resolveChain(file, packages, prefer);
    if (chain.length === 0) continue;

    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null) continue;

    violations.push(...checkSource(file, source, chain, await inventoryFor(chain)));
  }

  if (options.withinLayer === true) return violations;
  return violations.filter((violation) => violation.withinOwnLayer !== true);
}

/**
 * Every check v2 has, over the given files.
 *
 * The same shape as {@link checkProject}, which stays as it was: v1's import
 * check is one of the things this runs, not something it replaces.
 *
 * Tier 2 is not started here. It needs a model client and a budget, which is
 * #26 — until then the engine is offered no reviewer and stays silent about
 * everything it cannot prove.
 */
export async function analyzeProject(
  rootDir: string,
  files: string[],
  options: CheckOptions = {},
): Promise<Finding[]> {
  const config = await readConfig(rootDir);
  // No early return on an empty package set, for the reason given at the loop
  // below: most of what Tier 1 checks does not need one (#166).
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const prefer = config?.prefer ?? [];

  // Read once for the whole run: a batch of thirty files in one package would
  // otherwise re-read and re-parse the same Markdown thirty times.
  const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir);

  const inventoryFor = inventoryReader(rootDir);

  const models = new Map<string, SourceModel | null>();
  const sourceFor = async (dir: string, file: string): Promise<SourceModel | null> => {
    if (models.has(dir)) return models.get(dir) ?? null;
    const model = await resolveSource(file, { knowledge, storybookDir: rootDir }).catch(() => null);
    models.set(dir, model);
    return model;
  };

  const findings: Finding[] = [];
  for (const file of files) {
    // No skip on an empty chain. Only three checks read one — imports, deprecated
    // usage, and the layer half of substitutions — and they return nothing
    // without it on their own. Style literals, an emoji standing in for an
    // icon, a stated page rule and a written-down substitution need no package
    // to have been detected at all.
    //
    // Skipping was already wrong for templates, and the comment that used to
    // sit here said so: requiring a chain kept an Angular repository silent
    // even after its templates could be read. The same argument applies to a
    // `.tsx` outside every detected package, and a repository the tool cannot
    // otherwise read is exactly where a fresh install has to show it does
    // something (#166).
    const chain = resolveChain(file, packages, prefer);

    const source = await readFile(file, 'utf8').catch(() => null);
    if (source === null) continue;

    // The cascade decides what "correct" is for this file; `statedConventions`
    // decides which of its answers may produce a hard finding.
    //
    // Cached per directory: the neighbour adapter reads every sibling, so a
    // batch over one directory would otherwise be quadratic — 300 real files
    // went from 3.7 ms each to 10 ms before this.
    const model = await sourceFor(dirname(file), file);

    const result = await runEngine(file, source, {
      chain,
      inventory: await inventoryFor(chain),
      knowledge,
      conventions: statedConventions(model),
      ...(model === null ? {} : { conventionsFrom: model.kind }),
      withinLayer: options.withinLayer === true,
    });
    findings.push(...result.tier1);
  }

  return findings;
}

/**
 * The advisory context for one file, or null.
 *
 * The harness path, and the reason this plugin needs no credentials: a hook
 * cannot call a model without a key nobody configured, so it does not try. It
 * hands the agent already reading the code the project's own rules and what
 * the file structurally is, and asks for a judgement.
 *
 * Only ever offered on a file the deterministic checks passed — the caller
 * enforces that, because something certainly wrong does not need an opinion
 * about whether it feels right.
 */
export async function adviseProject(rootDir: string, file: string): Promise<string | null> {
  // No early return on an empty knowledge base any more. What the screens
  // beside this one are made of, and how they write it, needs nothing declared
  // — and refusing to say it until somebody had written rules is why a fresh
  // install looked like it did nothing at all.
  const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir);

  const source = await readFile(file, 'utf8').catch(() => null);
  if (source === null) return null;

  const neighbours = await neighbourSource()
    .describe(file)
    .catch(() => null);

  const usage = await observeUsage(file).catch(() => null);

  // A screen written as a pair: the class was handed in, the markup is beside
  // it, and reading only the class found no structure at all (#229).
  const pair = await pairOf(file).catch(() => null);
  const markup = pair === null ? null : await markupOf(pair.identity, source).catch(() => null);

  return buildAdvice({
    filePath: file,
    source,
    ...(markup === null ? {} : { markup }),
    knowledge,
    ...(usage === null ? {} : { usage }),
    ...(neighbours === null
      ? {}
      : {
          neighbours: {
            ...(neighbours.holder === undefined ? {} : { holder: neighbours.holder }),
            components: neighbours.components,
          },
        }),
  });
}

async function review(rootDir: string, args: string[]): Promise<number> {
  const files = args.filter((arg) => !arg.startsWith('-'));
  if (files.length === 0) {
    console.error('Usage: uic review <file...>');
    return 1;
  }

  const absolute = files.map((file) => resolve(rootDir, file));
  const tier1 = await analyzeProject(rootDir, absolute);
  for (const finding of tier1) {
    console.log(`${formatFinding({ ...finding, file: relative(rootDir, finding.file) })}\n`);
  }

  // The deterministic answer wins: a file with something certain wrong about
  // it does not need an opinion on whether it feels right.
  if (tier1.length > 0) return 1;

  // No model is called from here, and none is called from anywhere in this
  // tool. The judging happens in the agent that reads the file, which is why
  // the plugin needs no credentials and costs nothing to run. What this shows
  // is exactly what the hook hands that agent — useful when you want to see
  // what the plugin knows about a screen without editing it.
  let said = false;
  for (const file of absolute) {
    const advice = await adviseProject(rootDir, file);
    if (advice === null) continue;
    said = true;
    console.log(advice);
  }

  // Only when there was nothing at all to say. Curated rules are no longer the
  // precondition — what the neighbouring screens do is observed without them —
  // so naming them is help rather than the explanation it used to be.
  if (!said) {
    const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir);
    if (knowledge.fragments.length === 0) {
      console.error(`Nothing to say: no rules in ${KNOWLEDGE_DIR}/, and the screens beside`);
      console.error('this one do not agree on enough to be worth reporting.');
      console.error('Write one Markdown file per part of the design system, one rule per heading.');
    }
  }
  // Advice, never a gate.
  return 0;
}

async function pattern(rootDir: string, args: string[]): Promise<number> {
  const save = args.includes('--save');
  const establish = args.includes('--establish');
  const at = args.indexOf('--kind');
  const wanted = at < 0 ? undefined : args[at + 1];
  // `at < 0` guarded explicitly: without it `at + 1` is 0 and the *first*
  // argument is discarded as if it were the flag's value, so `uic pattern
  // <file>` printed its own usage. The same slip the review caught in `diff`.
  const file = args.find((arg, index) => !arg.startsWith('-') && (at < 0 || index !== at + 1));

  const decisions = await readDecisions(rootDir);
  const decided = wanted === undefined ? undefined : decisions.find((one) => one.kind === wanted);

  if (wanted !== undefined && decided === undefined) {
    console.error(`Nothing is written down about "${wanted}".`);
    console.error(`Add ${KNOWLEDGE_DIR}/decisions/${wanted}.md naming the canonical screen.`);
    return 1;
  }
  // A pointer that no longer resolves is the one staleness a decisions file can
  // have, and it is checked here — where the decision is used — rather than by
  // a command somebody has to remember to run.
  if (decided?.stale != null) {
    console.error(`${relative(rootDir, decided.file)} points at ${decided.stale}, which is gone.`);
    return 1;
  }

  const reference = decided?.canon ?? (file === undefined ? undefined : resolve(rootDir, file));
  if (reference === undefined) {
    console.error('Usage: uic pattern <reference-screen> [--save]');
    console.error('   or: uic pattern --kind <kind> [--save]   (from a decisions file)');
    return 1;
  }

  // The holder channel is asked for here and nowhere else. It reads files
  // rather than directories and costs 376 ms on an 808-screen application,
  // which is fine inside a command somebody invoked and is not fine on an edit.
  const found = await patternOf(reference, { byHolder: true });
  if (found === null) {
    // The honest answer, and a useful one: it means this screen is the first of
    // its kind, and what is decided about it becomes the pattern for the next.
    console.error('No pattern found: fewer than three screens of this kind to compare.');
    console.error('Decide it here, and this screen becomes the first of its kind.');
    // A dead end until #233: the honest answer, and then nothing to act on. The
    // skill walks the anatomy as questions and writes down only what was said.
    console.error('ui-consistency:decide walks the anatomy and records the decision.');
    // Asked to *write* a file, nothing was written, and a caller that reads the
    // exit code has to be able to tell that apart from a file it can now read.
    // The other two forms print an answer either way, so they stay at 0.
    return establish ? 1 : 0;
  }

  // The statements a person wrote and no extraction could produce, carried
  // into the contract beside the derived material rather than instead of it.
  const stated = decided ?? decisions.find((one) => one.kind === found.kind);
  const digest = {
    ...found,
    family: found.family.map((path) => relative(rootDir, path)),
    ...(stated === undefined || stated.statements.length === 0
      ? {}
      : { decided: { kind: stated.kind, from: relative(rootDir, stated.file), statements: stated.statements } }),
  };

  if (establish) return establishPattern(rootDir, found, reference, decided?.kind);

  if (!save) {
    console.log(JSON.stringify(digest, null, 2));
    return 0;
  }

  // A fixed place, outside the repository, keyed by it — the same cache the log
  // uses. The contract is re-read once per file while a batch runs, and by
  // subagents that start cold, so a path invented afresh each turn would defeat
  // the whole point of writing it down. It is ephemeral by design: never
  // committed, so it can never go stale.
  const path = contractPathFor(rootDir, decided?.kind ?? found.kind ?? 'screens');
  if ((await ownedDir(projectKey(rootDir))) === null) {
    console.error('Cannot write the contract: the cache directory is not one this user owns.');
    return 1;
  }
  await writeFile(path, `${JSON.stringify(digest, null, 2)}\n`, 'utf8');
  console.log(path);
  return 0;
}

/**
 * Write the pattern down, in the project, as the artifact a person approves.
 *
 * The other half of the channel #27 opened. On a fresh install there is no
 * pattern file for any kind, so a channel that only *reports* what has been
 * written down opens onto nothing — and the user was being asked to run a
 * command and answer questions before the tool said anything at all, which is
 * how an installation stays silent through a full day of real UI work.
 *
 * So the facts are derived and written here, marked as derived and dated, and
 * the prose the extraction cannot produce is named as missing. Nothing is
 * approved by this: the file is a draft in the project's own directory, and
 * the one place derived material may fail anything is still a person putting
 * `uic diff --contract` in a build gate.
 *
 * **An existing file is never overwritten.** A pattern already committed has
 * been through a pull request, and replacing a reviewed sentence with a derived
 * one would be the tool overruling the person it works for.
 */
async function establishPattern(
  rootDir: string,
  found: ScreenPattern,
  reference: string,
  decidedKind: string | undefined,
): Promise<number> {
  const name = slug(decidedKind ?? found.kind ?? 'screens');

  // Written to the current directory always. `knowledgeDir` answers the *old*
  // one where that is what holds the files, which is right for reading and
  // wrong here: the legacy path is still read and never written, and a fallback
  // that also wrote would leave everybody on it forever. Existence is still
  // checked in whichever directory is being read, or a project on the old path
  // would get a second pattern for a kind that already has one.
  const path = join(rootDir, KNOWLEDGE_DIR, 'patterns', `${name}.md`);
  const { dir: reading, legacy } = await knowledgeDir(rootDir, 'patterns');
  const existing = [path, join(reading, `${name}.md`)];

  // Said, because writing somewhere other than where the rest of the knowledge
  // lives is exactly the moment a project ends up with two directories and no
  // reason to notice. The old path is read and never written, and a fallback
  // nobody is told about leaves everybody on it forever.
  if (legacy) console.error(`ui-consistency: ${MOVED}`);

  for (const each of existing) {
    if ((await stat(each).catch(() => null)) === null) continue;
    console.error(`${relative(rootDir, each)} already exists, and was not overwritten.`);
    console.error('Read it, and re-derive with `uic pattern <screen>` if it looks stale.');
    return 1;
  }

  const rendered = renderPattern(found, {
    name,
    observed: new Date().toISOString().slice(0, 10),
    files: found.family.map((one) => relative(rootDir, one)),
    reference: relative(rootDir, reference),
  });

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, rendered, 'utf8');
  console.log(relative(rootDir, path));
  return 0;
}

/** `PageShell` → `page-shell`; a kind already written in words is left alone. */
const slug = (kind: string): string =>
  kind
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'screens';

/**
 * Where a set of screens departs from the contract agreed for their kind.
 *
 * The end of the loop: the comparison a person makes today by opening every
 * page and looking. It measures against something somebody approved, which is
 * why it may fail a build where nothing derived ever could.
 */
async function diff(rootDir: string, args: string[]): Promise<number> {
  const at = args.indexOf('--contract');
  const contractPath = at < 0 ? undefined : args[at + 1];
  const files = args.filter((arg, index) => !arg.startsWith('-') && index !== at + 1);

  // Every flag named, as `check` does: silently ignoring a misspelt one runs
  // something other than what was asked for and says nothing about it.
  const unknown = args.filter((arg) => arg.startsWith('-') && arg !== '--contract');
  if (contractPath === undefined || contractPath.startsWith('-') || files.length === 0 || unknown.length > 0) {
    if (unknown.length > 0) console.error(`Unknown option: ${unknown.join(', ')}`);
    console.error('Usage: uic diff --contract <contract.json> <file...>');
    return 1;
  }

  const raw = await readFile(resolve(rootDir, contractPath), 'utf8').catch(() => null);
  if (raw === null) {
    console.error(`Cannot read the contract: ${contractPath}`);
    return 1;
  }

  // Two forms, and **which one was read is said out loud.** A JSON contract
  // keeps working — people have them saved — and silently accepting both
  // forever is how everybody stays on the old one, which is the lesson
  // `src/knowledge/paths.ts` already carries about the old knowledge directory.
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Not JSON. A pattern file, or nothing.
  }

  const pattern = isContract(parsed) ? null : parsePattern(basename(contractPath), raw);
  if (pattern !== null && pattern.structure.length === 0 && pattern.props.length === 0) {
    console.error(
      `${contractPath} is neither the JSON \`uic pattern\` emits nor a pattern file with a` +
        ' `## Structure` or `## Props` section.',
    );
    return 1;
  }
  console.error(
    pattern === null
      ? `Read as a saved JSON contract. The pattern file is the form this is moving to.`
      : `Read as a pattern file: ${pattern.name}.`,
  );

  // Grouped by screen, because the question being answered is "which pages did
  // I get wrong", not "how many deviations exist".
  const byFile = new Map<string, Deviation[]>();
  let measured = 0;
  let unread = 0;

  const handedOver = new Set<string>();
  const otherKind: string[] = [];

  for (const file of files) {
    const absolute = resolve(rootDir, file);
    const where = relative(rootDir, absolute);
    const pair = await pairOf(absolute);
    const identity = pair?.identity ?? absolute;
    const source = await readFile(identity, 'utf8').catch(() => null);
    if (source === null) {
      unread++;
      continue;
    }
    const markup = pair === null ? { path: absolute, source } : await markupOf(identity, source);
    const holder =
      regionsOf(markup.source, templateKind(markup.path) ?? undefined)?.holder ?? null;

    if (pattern === null) {
      // Per file, not per run. A set of thirty screens is not guaranteed to be
      // one kind, and reporting every dialog in it against a page contract is
      // the defect #3 fixed on the hook path and left standing here.
      if (contractsForScreen([parsed as ScreenPattern], holder).length === 0) {
        otherKind.push(where);
        continue;
      }
      const deviations = contractDeviations(where, markup.source, parsed as ScreenPattern);
      // Null means "not a screen": not measured, and so not a match either.
      if (deviations === null) continue;
      measured++;
      if (deviations.length > 0) byFile.set(deviations[0]!.file, deviations);
      continue;
    }

    if (patternForScreen([pattern], where, holder) === null) {
      otherKind.push(where);
      continue;
    }

    // As deep as the pattern speaks, and no deeper. A pattern that states two
    // levels is not a reason to read four.
    const deep = Math.max(...pattern.structure.map((line) => line.indent), 0) + 1;
    const tree = await screenTree(rootDir, identity, { depth: deep }).catch(() => null);
    const report = patternDeviations(where, markup.source, pattern, tree);
    measured++;
    for (const one of report.handedOver) handedOver.add(one);
    if (report.deviations.length > 0) byFile.set(where, report.deviations);
  }

  const SHOWN = 20;
  for (const [file, deviations] of [...byFile].slice(0, SHOWN)) {
    console.log(file);
    for (const deviation of deviations) console.log(`  ${deviation.message}`);
  }
  if (byFile.size > SHOWN) console.log(`… and ${byFile.size - SHOWN} more screen(s)`);

  if (unread > 0) console.error(`${unread} path(s) could not be read.`);
  if (otherKind.length > 0) {
    console.error(
      `${otherKind.length} path(s) are of another kind and were not compared: ` +
        `${otherKind.slice(0, 5).join(', ')}${otherKind.length > 5 ? ', …' : ''}`,
    );
  }

  // **Said, never passed.** A pattern states sentences no program evaluates, and
  // printing nothing for them lets a screen pass against rules nobody checked.
  if (handedOver.size > 0) {
    console.log('\nStated by the pattern and evaluated by nothing here — read them:');
    for (const one of handedOver) console.log(`  - ${one}`);
  }

  // Never "they all match" about files nothing looked at. A green result over
  // unmeasured work is the failure this repository keeps meeting (#110).
  if (measured === 0) {
    console.error(`None of the ${files.length} path(s) given is a screen, so nothing was compared.`);
    return 1;
  }

  if (byFile.size === 0) console.log(`${measured} screen(s) match everything checked here.`);
  return byFile.size > 0 || unread > 0 ? 1 : 0;
}

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
  return [
    `${'  '.repeat(indent)}${node.name}${where}`,
    ...node.children.flatMap((child) => branch(child, indent + 1, node.file)),
  ];
}

/**
 * Which props each of a set of files writes on one component.
 *
 * A fact supplier: no verdict, no advice, exit 0 whatever it finds. Props are
 * where a family actually drifts — two screens can both sit in the right holder
 * and differ because one left a prop off — and answering *"which"* needed a
 * script written from scratch every session.
 *
 * The counts are evidence handed over, never a rule. A screen that legitimately
 * differs must read as information, and several of the divergences this was
 * measured against were deliberate.
 */
async function props(rootDir: string, args: string[]): Promise<number> {
  const [component, ...rest] = args.filter((arg) => !arg.startsWith('-'));
  if (component === undefined || rest.length === 0) {
    console.error('Usage: uic props <Component> <file...>');
    return 1;
  }

  const { absolute, problems } = await givenFiles(rootDir, rest);
  for (const problem of problems) console.error(problem);
  if (absolute.length === 0) {
    console.error(`No file to read, so nothing is known about <${component}>.`);
    return 1;
  }

  const matrix = await propsMatrix(rootDir, component, absolute);
  const total = matrix.renders.length;
  console.log(
    `${component} — rendered by ${total} of ${absolute.length} ${absolute.length === 1 ? 'file' : 'files'} read`,
  );
  if (total === 0) return 0;

  const all = matrix.rows.filter((row) => row.written.length === total);
  const some = matrix.rows.filter((row) => row.written.length < total);

  if (all.length > 0) {
    console.log(`\nwritten by all ${total}`);
    for (const row of all) console.log(`  ${row.name}${row.value === null ? '' : ` = ${JSON.stringify(row.value)}`}`);
  }
  if (some.length > 0) {
    console.log('\nwritten by some');
    for (const row of some) {
      const missing = matrix.renders.filter((file) => !row.written.includes(file));
      console.log(
        `  ${row.name}${row.value === null ? '' : ` = ${JSON.stringify(row.value)}`}` +
          `  —  ${row.written.length} of ${total}, not in ${missing.join(', ')}`,
      );
    }
  }
  if (matrix.absent.length > 0) {
    console.log(`\ndoes not render it\n  ${matrix.absent.join('\n  ')}`);
  }
  if (matrix.unreadable.length > 0) {
    console.log(`\ncould not be read\n  ${matrix.unreadable.join('\n  ')}`);
  }
  return 0;
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
  const screens =
    grouped.groups.reduce((count, one) => count + one.members.length, 0) +
    grouped.ungrouped.length;
  console.log(
    `${screens} ${screens === 1 ? 'screen' : 'screens'}, read ${grouped.depth} ` +
      `${grouped.depth === 1 ? 'level' : 'levels'} — ${grouped.groups.length} ` +
      `${grouped.groups.length === 1 ? 'group' : 'groups'}`,
  );

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
  if (grouped.notScreens.length > 0) {
    console.log(`\nnot screens — nothing rendered in them\n  ${grouped.notScreens.join('\n  ')}`);
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

/**
 * What the project has written down about its own patterns, and whether it is
 * still true.
 *
 * Two questions, and the second is the one somebody asks in the middle of
 * work: *which pattern is this screen of?* Answering "none" is a real answer
 * and the useful one — it is the signal that a pattern has not been written
 * yet, and it must not look like a screen that matches.
 *
 * The counts in a pattern file are evidence as at a date. Staleness is reported
 * here, where the pattern is used, and never by an audit somebody has to
 * remember to run.
 */
async function patterns(rootDir: string, args: string[]): Promise<number> {
  const { patterns: found, legacy } = await patternFiles(rootDir);
  if (legacy) console.error(MOVED);

  const target = pathsIn(args)[0];
  if (target !== undefined) return coveringOne(rootDir, found, target);

  if (found.length === 0) {
    console.log(`No pattern files in ${KNOWLEDGE_DIR}/patterns.`);
    console.log('That is a project that has written nothing down, not a project with no patterns.');
    return 0;
  }

  console.log(`${found.length} ${found.length === 1 ? 'pattern' : 'patterns'} in ${KNOWLEDGE_DIR}/patterns\n`);
  for (const one of found) {
    const members = one.members.length;
    console.log(
      `${one.name}  ${one.surface ?? '—'}  ${one.holder ?? '—'}  ` +
        `${members} ${members === 1 ? 'file' : 'files'}` +
        `${one.observed === null ? '' : `  observed ${one.observed}`}`,
    );
    for (const line of staleness(await staleIn(rootDir, one))) console.log(`  ${line}`);
  }
  return 0;
}

/** Which pattern covers one screen, and why it is that one or none. */
async function coveringOne(
  rootDir: string,
  found: PatternFile[],
  target: string,
): Promise<number> {
  const absolute = resolve(rootDir, target);
  const where = relative(rootDir, absolute);
  const pair = await pairOf(absolute);
  const identity = pair?.identity ?? absolute;
  const own = await readFile(identity, 'utf8').catch(() => null);
  const markup = own === null ? null : pair === null ? { path: absolute, source: own } : await markupOf(identity, own);
  const holder =
    markup === null
      ? null
      : (regionsOf(markup.source, templateKind(markup.path) ?? undefined)?.holder ?? null);

  const covering = patternForScreen(found, where, holder);
  if (covering === null) {
    console.log(`${where} — no pattern covers it.`);
    console.log(
      holder === null
        ? '  Nothing readable holds it, so there is nothing to match a pattern on.'
        : `  It sits in <${holder}>, and no pattern file names that holder or names this file.`,
    );
    return 0;
  }

  console.log(`${where} — ${covering.name} (${KNOWLEDGE_DIR}/patterns/${covering.file})`);
  console.log(
    covering.members.includes(where)
      ? '  named by the pattern itself'
      : `  sits in <${holder}>, which is the pattern's holder`,
  );
  for (const line of staleness(await staleIn(rootDir, covering))) console.log(`  ${line}`);
  return 0;
}

/** What has moved under a pattern, said as the two different things it is. */
function staleness(stale: Stale[]): string[] {
  const say = (why: Stale['why'], text: string): string[] => {
    const files = stale.filter((one) => one.why === why).map((one) => one.file);
    return files.length === 0 ? [] : [`${text}: ${files.join(', ')}`];
  };
  return [...say('changed', 'changed since it was read'), ...say('gone', 'no longer there')];
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
  console.error('The checks that read one — imports, deprecated usage — did not run.');
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

  // A file on no chain is skipped, silently and by design — most of what a
  // repository holds is not UI. Every file skipped is a different matter: it
  // means detection found no package that owns any of them, and an exit code of
  // 0 then says "nothing wrong" about work that was never done. That is exactly
  // how a whole application went unchecked with a green result (#110).
  if (!listOnly) await warnIfNothingWasChecked(rootDir, absolute);

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
    return seen.size > 0 ? 1 : 0;
  }

  for (const finding of findings) {
    // Absolute paths are right for a caller; a reader wants them repo-relative.
    console.log(`${formatFinding({ ...finding, file: relative(rootDir, finding.file) })}\n`);
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
  // Silence rather than an error, as everywhere else: a file on no chain is a
  // file this tool has nothing to say about.
  if (chain.length === 0) return 0;

  const built = await cachedInventory(rootDir, chain);
  for (const layer of chain) {
    const symbols = built.layers[layer.name] ?? {};
    const names = Object.keys(symbols).sort();
    // A layer with nothing readable is almost always an external package with
    // no source here. On Backstage that is 399 of one file's 476 layers, and
    // printing them buries the 77 that matter under a wall the subagent has to
    // read past — the exact context flood the driver is built to avoid.
    if (names.length === 0) continue;
    console.log(`# ${layer.name}`);
    for (const name of names) {
      const entry = symbols[name]!;
      const note = entry.deprecated
        ? ` — deprecated${entry.replacement === null ? '' : `, use ${entry.replacement}`}`
        : '';
      console.log(`  ${name}${note}`);
    }
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
 * The `UserPromptSubmit` adapter, as a subcommand.
 *
 * Plain text on stdout, because that is what this event turns into context.
 * Silence and exit 0 everywhere else: a prompt that is not about screens must
 * cost nothing, and a hook that cannot decide must never be the reason a prompt
 * does not go through.
 */
async function prompt(): Promise<number> {
  const said = await promptResponse(await readStdin()).catch(() => null);
  if (said !== null) console.log(said);
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
    case 'pattern':
      return pattern(rootDir, rest);
    case 'diff':
      return diff(rootDir, rest);
    case 'place':
      return place(rootDir, rest);
    case 'tree':
      return tree(rootDir, rest);
    case 'props':
      return props(rootDir, rest);
    case 'group':
      return group(rootDir, rest);
    case 'patterns':
      return patterns(rootDir, rest);
    case 'scan':
      return scan(rootDir);
    case 'check':
      return check(rootDir, rest);
    case 'review':
      return review(rootDir, rest);
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
    case 'prompt':
      return prompt();
    default:
      console.error('Usage: uic <pattern|patterns|diff|place|tree|props|group|scan|check|review|shapes|inventory|log>');
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

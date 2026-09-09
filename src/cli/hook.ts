import { dirname, relative, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { analyzeProject } from './index.js';
import { settled } from '../ai/settled.js';
import { record } from './log.js';
import { contractDeviations, contractsForScreen, isContract } from '../checks/contract.js';
import { regionsOf } from '../sources/regions.js';
import { templateKind } from '../parse/template.js';
import type { ScreenPattern } from '../sources/pattern.js';
import { contractsFor } from './log.js';
import { cachedPattern } from '../sources/pattern-cache.js';
import { formatFinding } from '../core/format.js';
import { findProjectRoot } from '../layers/detect.js';
import { touchedBy, within } from './touched.js';

/** The shape Claude Code accepts back from a `PostToolUse` hook. */
export interface HookResponse {
  hookSpecificOutput: {
    hookEventName: 'PostToolUse';
    additionalContext: string;
  };
}

/**
 * The one-line shape of an advisory, for the log.
 *
 * Read back out of the text that was handed over, rather than threaded through
 * as data: the advice is assembled for a reader, and a second representation
 * of it would be a second thing to keep in step.
 *
 * Exported for its own test: reading structure back out of prose is exactly
 * the kind of thing that goes wrong quietly, and the log is what answers
 * "why did it not tell me".
 */
export function summariseAdvice(advice: string): {
  kind: string | null;
  layout: string;
  rules: string[];
  observed: string[];
} {
  // Null where the advice carried no such line, which is now what happens when
  // the holder cannot be read — rather than the word `unknown`, which read as a
  // judgement about the screen (#226).
  const kind = /kind of screen: (.+)/.exec(advice)?.[1]?.trim() ?? null;
  const layout = /layout: (.+)/.exec(advice)?.[1]?.trim() ?? '';
  const rules = [...advice.matchAll(/^## (.+)$/gm)].map((match) => match[1]!.trim());
  // Which components the neighbours were found to agree about. Without this
  // the log cannot distinguish advice that carried an observation from advice
  // that carried only rules — and the observation is the half that answers
  // "why did it not tell me the layout was wrong".
  // Anchored on the whole line, not just its opening: the rule bodies are
  // appended after this section, and a rule whose Markdown holds a bullet like
  // ``- `<Button variant="ghost">` …`` was logged as something the neighbours
  // were found to agree about. The log is what answers "why did it not tell
  // me", so a wrong entry in it is worse than a missing one.
  const observed = [...advice.matchAll(/^- `<([A-Za-z][\w.-]*)[^\n]*screens beside it/gm)].map(
    (match) => match[1]!,
  );
  return { kind, layout, rules, observed };
}

/** Tools that put source on disk. Anything else cannot have broken anything. */
const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);

// Templates too: an Angular component's markup lives in its own file, and a
// hook that ignores it says nothing about most of the UI in such a project.
const CHECKABLE = /\.(?:tsx?|jsx?|mts|cts|html|vue|svelte)$/;

interface Payload {
  tool_name?: unknown;
  tool_input?: { file_path?: unknown };
  cwd?: unknown;
}

function filePathFrom(payload: Payload): string | null {
  if (typeof payload.tool_name !== 'string' || !WRITE_TOOLS.has(payload.tool_name)) return null;
  const path = payload.tool_input?.file_path;
  if (typeof path !== 'string' || path === '') return null;
  return CHECKABLE.test(path) ? path : null;
}

/**
 * What the hook should say about one tool call, or null for silence.
 *
 * Silence is the answer for the overwhelming majority of edits, and it is the
 * answer for everything unexpected. Being wrong about an edit is bad;
 * interrupting one is worse, so no input reaches this function that can make
 * it throw.
 */
export async function hookResponse(stdin: string): Promise<HookResponse | null> {
  let payload: Payload;
  try {
    const parsed: unknown = JSON.parse(stdin);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    payload = parsed as Payload;
  } catch {
    return null;
  }

  const filePath = filePathFrom(payload);
  if (filePath === null) return null;

  const absolute = resolve(typeof payload.cwd === 'string' ? payload.cwd : '.', filePath);

  // The working directory of the session need not be the project root — the
  // file's own location is the more reliable starting point.
  const root = (await findProjectRoot(dirname(absolute))) ?? (
    typeof payload.cwd === 'string' ? payload.cwd : null
  );
  if (root === null) return null;

  const findings = await analyzeProject(root, [absolute]).catch(() => []);

  // Written before anything is returned, and never allowed to change what is:
  // the record of an edit must not affect the edit.
  //
  // **Everything is logged; only what the edit wrote is said.** The record keeps
  // the whole truth about the file; the interruption is reserved for what the
  // agent just did (#256).
  await record(root, findings, { rootDir: root });

  const touched = await touchedBy(
    payload.tool_name as string,
    payload.tool_input,
    absolute,
  ).catch(() => null);
  const said = findings.filter((finding) => within(touched, finding.line));

  if (said.length === 0) {
    // Nothing certain is wrong. The other thing worth saying on an edit is that
    // this screen differs from the other screens of its kind — from a contract
    // somebody approved where one exists, and otherwise from one derived here.
    //
    // ~1 KB of *observation* about neighbouring screens was injected here once
    // and ignored (P4 in `docs/findings/2026-08-14-problems.md`), and the answer
    // was to say nothing at all without an approved contract. That went too far
    // (#231): it left the pattern half reachable only by running a command per
    // kind and saving the result, which nobody does thirty times — so on a
    // project that had written nothing down the tool was 93% an import checker.
    //
    // What is injected now is a **deviation**, and only where there is one. A
    // screen written like its siblings is still silent, which is the property
    // P4 was about. Nothing derived fails anything here; approval belongs at the
    // one place it can, which is `uic diff --contract` in a build gate (#209).
    //
    // Debounced per file: during active development most edits are
    // intermediate, and repeating the same line on every keystroke is how
    // anything becomes noise.
    if (!(await settled(root, absolute))) return null;

    const { said: deviations, derived } = await deviationsFromContract(root, absolute).catch(
      () => ({ said: [] as string[], derived: null as ScreenPattern | null }),
    );
    if (deviations.length === 0) return null;

    await record(
      root,
      deviations.map((one) => ({
        file: absolute,
        line: 1,
        level: 'page-pattern' as const,
        message: one,
      })),
      { rootDir: root },
    );

    return {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: [
          derived === null
            ? 'ui-consistency: this screen has left the contract for its kind:'
            : 'ui-consistency: this screen differs from the other screens of its kind here',
          // Where the family came from, and the names. An agent handed a family
          // it can see is nonsense will say so; one handed a bare assertion
          // cannot (#255).
          ...(derived === null ? [] : [`(${provenance(root, derived)}, and it fails nothing):`]),
          '',
          ...deviations.map((one) => `- ${one}`),
          '',
          derived === null
            ? 'Fix them in this turn, or say which are deliberate.'
            : 'Follow them where they fit, and say so where this screen is deliberately different.',
        ].join('\n'),
      },
    };
  }

  const text = said
    .map((finding) => formatFinding({ ...finding, file: relative(root, finding.file) }))
    .join('\n\n');

  return {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `ui-consistency found code that does not match this project's own design system:\n\n${text}\n\nFix them in this turn.`,
    },
  };
}

/**
 * Where a derived contract came from, said so the agent can judge it.
 *
 * *"derived from the 8 screens registered beside it"* and *"derived from files
 * in its folder"* are not equally trustworthy, and the second names the files
 * because that is what makes a nonsense family visible on sight.
 */
function provenance(root: string, contract: ScreenPattern): string {
  const names = contract.family.map((one) => relative(root, one));
  // A pattern file is a person's sentence, reviewed in a pull request, so the
  // "nobody approved it" that belongs on the other two would be false here —
  // the *shape* was approved even though the reading of the code is fresh.
  if (contract.from === 'pattern') {
    return `read just now from the ${names.length} screens the project's pattern file names`;
  }
  return contract.from === 'routes'
    ? `derived just now from the ${names.length} screens the route table registers beside it — nobody approved it`
    : `derived just now from files in its folder — ${names.join(', ')} — nobody approved it`;
}

/**
 * What this screen has done that the contract for its kind does not.
 *
 * ~~Only against a contract a person approved. Nothing derived is checked here:
 * an observation nobody accepted has no business failing an edit.~~
 *
 * **The premise was withdrawn, and by then it was doing the opposite of its
 * job** (#231). Nothing here fails an edit — the hook returns context, never a
 * block — so a derived contract was being withheld from a path it could not
 * gate. The effect was that a project got the pattern half only if somebody had
 * run a command per kind and saved the result, which nobody was going to do
 * thirty times.
 *
 * So: an approved contract wins where one exists, and where none does the
 * pattern is derived here and said to be derived. Approval still belongs at the
 * one place derived material *can* fail something — a person putting
 * `uic diff --contract` in a build gate (#209).
 */
async function deviationsFromContract(
  root: string,
  file: string,
): Promise<{ said: string[]; derived: ScreenPattern | null }> {
  const nothing = { said: [], derived: null };

  const source = await readFile(file, 'utf8').catch(() => null);
  if (source === null) return nothing;

  const approved: ScreenPattern[] = [];
  for (const path of await contractsFor(root)) {
    const raw = await readFile(path, 'utf8').catch(() => null);
    if (raw === null) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (isContract(parsed)) approved.push(parsed);
  }

  // Which contract this screen is *of*, before asking how it departs from one.
  // Asking every contract and keeping every answer is what made a second
  // contract worse than one (#152).
  const holder = regionsOf(source, templateKind(file) ?? undefined)?.holder ?? null;
  const matching = contractsForScreen(approved, holder);

  // Nobody has to run anything. Where no approved contract covers this kind,
  // what screens of it look like is derived on the edit already being made —
  // once per kind and area, from a cache keyed by the files it came from.
  const fresh =
    matching.length === 0 && holder !== null
      ? await cachedPattern(root, file, holder).catch(() => null)
      : null;
  const contracts = fresh === null ? matching : [fresh];

  const said: string[] = [];
  for (const contract of contracts) {
    const deviations = contractDeviations(relative(root, file), source, contract);
    // Null means the file is not a screen at all — a test, a story. An empty
    // list means it was measured and matched. The caller must be able to tell
    // those apart, so neither is a deviation.
    if (deviations === null) return nothing;
    if (deviations.length === 0) return nothing;
    said.push(...deviations.map((one) => one.message));
  }

  return { said, derived: fresh };
}

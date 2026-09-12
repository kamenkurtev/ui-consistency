import { dirname, relative, resolve } from 'node:path';
import { analyzeProject } from './index.js';
import { SILENCED } from '../core/off.js';
import { record } from './log.js';
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
  // Silenced, and silently: a hook that announced it was off would itself be a
  // line in the arm's context (#71).
  if (SILENCED()) return null;

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

  // ~~Nothing certain is wrong. The other thing worth saying on an edit is
  // that this screen differs from the other screens of its kind — from a
  // contract somebody approved where one exists, and otherwise from one derived
  // here.~~
  //
  // **That whole channel is gone (#77), and it is the largest single thing #76
  // gives up.** It derived the pattern on the edit already being made, so
  // nobody had to run anything for the tool to know — #38's claim, and the
  // answer to the 93%-an-import-checker problem #231 was about. What replaced
  // it is `ui-consistency:pattern`, reached by its own description before the
  // write rather than after it, which is where the pattern was always worth
  // more: an agent told the pattern first writes the right screen once, and one
  // told afterwards has to be persuaded to change working code.
  //
  // What is **not** given up is the property that made it safe: nothing derived
  // ever failed an edit here, and nothing does now. The only place derived
  // material may fail anything was a person putting a contract check in a build
  // gate, and that is #76's open question rather than this file's.
  //
  // So a file the deterministic checks pass is silent — which was already the
  // rule for a screen written like its siblings.
  if (said.length === 0) return null;

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

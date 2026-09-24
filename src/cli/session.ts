import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The shape a harness accepts back from a session hook.
 *
 * Three of them, because three conventions exist and a hook that prints the
 * wrong one is a hook that says nothing at all. Only the field the current
 * platform reads is emitted: Claude Code reads both `additional_context` and
 * `hookSpecificOutput` without deduplicating, so printing both says everything
 * twice.
 */
export type SessionResponse =
  | { hookSpecificOutput: { hookEventName: 'SessionStart'; additionalContext: string } }
  | { additional_context: string }
  | { additionalContext: string };

/** Which shape this harness expects, from what it puts in the environment. */
export function shapeFor(env: NodeJS.ProcessEnv, context: string): SessionResponse {
  if (env['CURSOR_PLUGIN_ROOT'] !== undefined) return { additional_context: context };
  if (env['CLAUDE_PLUGIN_ROOT'] !== undefined && env['COPILOT_CLI'] === undefined) {
    return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context } };
  }
  // The SDK's own shape: Copilot CLI, and anything that has not said otherwise.
  return { additionalContext: context };
}

/**
 * The standing instruction: which skills a job takes, and in what order.
 *
 * Each `SKILL.md` description says when it applies; this adds the order, and
 * says the skills join a process that is already running rather than claiming
 * the start of every task. A second standing instruction that competes with an
 * installed planning process is what this replaced.
 *
 * Fixed text. It is not a scan, it parses nothing and it calls no model, so the
 * session costs what it always cost: two directory listings.
 *
 * The same words are in `USING.md`, because the harnesses without a session
 * hook read that file instead.
 */
const STANDING = [
  'ui-consistency — for anything the end user will see, these join the phases of',
  'whatever process is already running, and run the phases themselves when none is.',
  'Use them without being asked.',
  '',
  '- A new page or feature, or a refactor across pages:',
  '  ui-consistency:finding-patterns → ui-consistency:planning',
  '  → ui-consistency:implementing → ui-consistency:verifying',
  '- A small change to one page: finding-patterns, its reduced branch',
  '  → implementing → verifying. The check is never the part that gets dropped.',
  '- Checking code already written: verifying — after finding-patterns where no',
  '  checklist exists yet.',
  '- Only when asked, or when the project states a requirement — measuring against',
  '  an accessibility standard (contrast, focus, keyboard, labels, text',
  '  alternatives, target size): ui-consistency:accessibility. Not by default.',
  '',
  'If a spec or plan for this work already exists, add to it instead of starting',
  'another. Decide by the order the skills carry and report what settled each',
  'decision; ask only where it ties and the change reaches outside the task, or',
  'before a component is created or code is extracted into one.',
].join('\n');

/**
 * Where older versions of this plugin wrote into a project's repository. Nothing
 * writes there any more, and nothing reads what is there.
 */
const LEFT_BEHIND = ['.ui-consistency', '.claude/ui-consistency'];

/**
 * The standing instruction, and one line more only when a project still carries
 * a directory an older version wrote.
 *
 * Everything else is silence. A message on every session that is not news is
 * how a plugin trains people to skip its output. The budget is a directory
 * listing per path: nothing is opened, parsed or generated.
 */
export async function sessionContext(rootDir: string): Promise<string | null> {
  const said = [STANDING];

  const found: string[] = [];
  for (const dir of LEFT_BEHIND) {
    const entries = await readdir(join(rootDir, dir)).catch(() => null);
    if (entries !== null && entries.length > 0) found.push(`${dir}/`);
  }

  if (found.length > 0) {
    said.push(
      [
        `ui-consistency: ${found.join(' and ')} ${found.length > 1 ? 'were' : 'was'} written by an older version`,
        'of this plugin, which no longer writes into the repository and reads nothing',
        'there. It can be deleted. A decision a person recorded in it belongs wherever',
        'the process you are running records decisions.',
      ].join(' '),
    );
  }

  return said.join('\n\n');
}

interface Payload {
  cwd?: unknown;
}

/**
 * The `SessionStart` adapter. Never throws. A harness disables the plugin its
 * own way; this has no switch of its own, because a switch here could only ever
 * silence the hook, never the skills, and would be believed to do more.
 */
export async function sessionResponse(stdin: string): Promise<SessionResponse | null> {
  let cwd = process.cwd();
  try {
    const parsed: unknown = JSON.parse(stdin);
    const payload = parsed as Payload;
    if (typeof payload?.cwd === 'string' && payload.cwd !== '') cwd = payload.cwd;
  } catch {
    // A payload that will not parse is not a reason to say nothing — the
    // project is still there, and the working directory is still readable.
  }

  const context = await sessionContext(cwd).catch(() => null);
  if (context === null) return null;

  return shapeFor(process.env, context);
}

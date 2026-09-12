import { SILENCED } from '../core/off.js';
import { readdir, open } from 'node:fs/promises';
import { join } from 'node:path';
import { generatedVersion } from '../knowledge/parse.js';
import { VERSION } from '../version.js';
import { KNOWLEDGE_DIR as DIR, knowledgeDir, MOVED } from './../knowledge/paths.js';

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

/** Enough of a file to hold the marker; never the whole knowledge base. */
const HEAD = 512;

/**
 * How many files to look at.
 *
 * This runs on every session start, before anybody has asked for anything, so
 * its whole budget is a directory listing and a few short reads. It builds
 * nothing, parses nothing, and calls no model: generation costs tokens and
 * spending somebody's tokens because they opened a terminal is not a thing a
 * plugin may do.
 */
const MAX_FILES = 12;

async function firstBytes(path: string): Promise<string | null> {
  const handle = await open(path, 'r').catch(() => null);
  if (handle === null) return null;
  try {
    const buffer = Buffer.alloc(HEAD);
    const { bytesRead } = await handle.read(buffer, 0, HEAD, 0);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } catch {
    return null;
  } finally {
    await handle.close().catch(() => undefined);
  }
}

/**
 * The standing instruction: when each skill fires, and the order between them.
 *
 * ~~"Nothing is generated and nothing is spent until somebody asks."~~ That
 * sentence was written to promise a cost, and it **reads to an agent as *do not
 * act unless asked*** — the opposite of the behaviour wanted. The promise is
 * kept and stated as what it is: nothing is spent until UI work starts.
 *
 * It named **one** of the seven skills and left the other six to whatever the
 * harness happened to match on. Every `SKILL.md` here already opens with *"Use
 * when…"* and lists the sentences a person actually types, so the trigger half
 * needs no change; what was missing is the rule and the ordering, which is the
 * shape the reference implementation of a skills library uses on this same
 * harness.
 *
 * Fixed text. It is not a scan, it parses nothing and it calls no model, so the
 * session costs what it always cost: a directory listing and at most twelve
 * short reads.
 *
 * The same words are in `AGENTS.md`, because three of the four supported
 * harnesses have no hook and that file is how they reach it.
 */
const STANDING = [
  'ui-consistency — when the work is about screens, this is the order. Do not wait to be asked.',
  '',
  '1. ui-consistency:pattern — BEFORE writing or changing a screen. It reads what',
  '   screens of that kind already look like here and writes it down. A screen',
  '   written first and corrected after is a screen somebody has to be persuaded',
  '   to change.',
  '2. ui-consistency:decide — where pattern finds fewer than three screens of the',
  '   kind. It asks; it does not draft. The first screen of a kind is a decision,',
  '   not a derivation.',
  '3. ui-consistency:screen — writing one screen against what pattern established.',
  '   ui-consistency:rollout — the same change across many; it queues them and',
  '   verifies the whole set rather than trusting thirty separate turns.',
  '4. ui-consistency:verify — before handing the work over.',
  '   ui-consistency:review — a second opinion on one screen, when asked.',
  '5. ui-consistency:reach — when you cannot tell whether this project is clean or',
  '   this tool is blind here. Those look identical and are not.',
  '',
  'Nothing is spent until UI work starts. This message is the whole of what a',
  'session costs.',
].join('\n');

/**
 * The one line a session may be told about this project's knowledge base.
 *
 * Two states are worth saying something about, and no others:
 *
 * - there is no knowledge base, and nobody knows the command that builds one.
 *   The setup step has existed since v1 and the complaint behind #99 is that
 *   people never learn it exists.
 * - the corpus was generated by an older plugin than the one now running, so
 *   what it says may no longer be what this version would say.
 *
 * Everything else is silence. A message on every session that is not news is
 * how a plugin trains people to skip its output.
 */
export async function sessionContext(rootDir: string): Promise<string | null> {
  // The old location is read, and saying so is the point: a rename whose
  // fallback works silently leaves people on the old path forever, and the
  // session hook is where they already look (#145).
  const { dir, legacy } = await knowledgeDir(rootDir);
  const entries = await readdir(dir).catch(() => null);
  const files = (entries ?? []).filter((name) => /\.md$/i.test(name)).sort();

  const said = [STANDING];

  const versions = new Set<string>();
  for (const name of files.slice(0, MAX_FILES)) {
    const head = await firstBytes(join(dir, name));
    if (head === null) continue;
    const version = generatedVersion(head);
    if (version !== null && version !== VERSION) versions.add(version);
  }

  if (legacy) said.push(`ui-consistency: ${MOVED}`);

  if (versions.size > 0) {
    said.push(
      [
        `ui-consistency: the generated part of ${DIR}/ was written by`,
        `plugin ${[...versions].sort().join(', ')}; this is ${VERSION}.`,
        'Nothing generates those files any more. They are a stored copy of what the',
        `code says, which is the thing that goes stale — keep whatever in them was`,
        `intent, in ${DIR}/decisions/, and delete the rest.`,
      ].join(' '),
    );
  }

  return said.join('\n\n');
}

interface Payload {
  cwd?: unknown;
}

/**
 * The `SessionStart` adapter. Never throws, and says nothing by default.
 */
export async function sessionResponse(stdin: string): Promise<SessionResponse | null> {
  if (SILENCED()) return null;
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

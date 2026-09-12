import { patternFiles, staleIn, type PatternFile } from '../knowledge/pattern-file.js';
import { KNOWLEDGE_DIR } from '../knowledge/paths.js';
import { SILENCED } from '../core/off.js';

/**
 * Words that mean the work is about screens.
 *
 * **This is a list about English, not about the project.** The rule that no
 * component name may be hardcoded is about the *project's* vocabulary — its
 * grids are called `CustomerInvoicesGrid` and a built-in list of names is
 * silent on every project that names things differently. `dialog` here is not a
 * claim about what this project calls anything; it is a claim about what a
 * person types when they want one.
 *
 * It will miss and it will over-fire, and both are cheap: a miss is a prompt
 * that gets no patterns and the standing instruction still applies, and an
 * over-fire is a few lines about patterns on a prompt that was not about
 * screens. Neither writes anything and neither blocks anything.
 */
const ABOUT_SCREENS =
  /\b(screens?|pages?|dialogs?|modals?|drawers?|panels?|widgets?|forms?|grids?|tables?|layouts?|components?|views?|ui)\b/i;

/**
 * Words that mean the work is a set rather than one screen.
 *
 * **The loop is named, and it is not started** (#28). The queue-on-disk,
 * one-file-per-turn, verify-the-whole-set loop exists as `skills/rollout`, and
 * what was missing is that it begins because the work is that shape rather than
 * because somebody typed a command. Naming it here is the whole of what a
 * `UserPromptSubmit` adapter can honestly do: its output is context, and a hook
 * that wrote a queue to disk off a regular expression over English would be
 * starting a process nobody asked for, on a guess, before a single file had
 * been read. The agent starts it, at the moment it can already see whether the
 * set is real.
 *
 * The same list-about-English defence as `ABOUT_SCREENS`, and the same failure
 * directions: a miss is a prompt that gets one fewer line, an over-fire is a
 * pointer to a skill on a prompt that turns out to touch one file. Neither
 * writes anything.
 */
const A_WHOLE_SET =
  /\b(all (?:the |of )?|every|each of|the rest|remaining|across (?:the|all|every)|throughout|everywhere|one by one|in bulk|consistent(?:ly)? across|\d{2,})\b/i;

/**
 * What to put in front of the agent before it writes a screen.
 *
 * The moment this exists for is **before the write**. An agent told what the
 * pattern is before it starts writes the right screen once; an agent told
 * afterwards has to be persuaded to change working code, and every report it
 * declines to act on teaches that the whole channel is skippable.
 *
 * `PreToolUse` would be the obvious event and it cannot carry this: its output
 * accepts a permission decision and nothing else, so the only way to be heard
 * there is to interrupt the write — which is the failure with an extra step.
 * `UserPromptSubmit` fires earlier still, and its plain output is context.
 *
 * `null` is the common case and costs one regular-expression test: a prompt
 * that is not about screens reads no file at all.
 */
export async function promptContext(rootDir: string, text: string): Promise<string | null> {
  if (SILENCED()) return null;
  if (!ABOUT_SCREENS.test(text)) return null;

  const { patterns } = await patternFiles(rootDir).catch(() => ({ patterns: [] }));

  if (patterns.length === 0) {
    return [
      `ui-consistency: this project has written no patterns down (${KNOWLEDGE_DIR}/patterns/).`,
      '',
      ...ESTABLISH_IT,
      ...manyOfThem(text),
    ].join('\n');
  }

  const said = [`ui-consistency: what this project has written down, before you write.`, ''];
  for (const one of patterns.slice(0, MAX_PATTERNS)) {
    said.push(`  ${describe(one)}${await freshness(rootDir, one)}`);
  }
  if (patterns.length > MAX_PATTERNS) {
    said.push(`  … and ${patterns.length - MAX_PATTERNS} more in ${KNOWLEDGE_DIR}/patterns/`);
  }
  said.push(
    '',
    'Read the one for the kind you are about to touch before writing anything.',
    'Where none of them covers that kind:',
    '',
    ...ESTABLISH_IT,
    ...manyOfThem(text),
  );
  return said.join('\n');
}

/**
 * What to do where nothing has been written down about the kind being touched.
 *
 * **The instruction is to establish it, not to ask for it.** A channel that
 * reports what a project has written down opens onto nothing on a fresh
 * install, and the first move used to be a command somebody had to run and a
 * question somebody had to answer — which is how an installation stayed silent
 * through a full day of real UI work. The agent is already reading the code
 * this would be derived from, so it derives it and writes it down, and nothing
 * is asked of the user.
 *
 * Two steps and not one, because at this moment there is no file yet: the
 * prompt has been submitted and nothing has been opened. A command that needs
 * a reference screen cannot be handed over without saying how to find one.
 *
 * The flag is named here and not left to the skill. Without it an agent that
 * does not load the skill runs `uic pattern <screen>`, which prints JSON and
 * writes nothing — the channel opens, the instruction is followed, and still
 * nothing lands.
 *
 * The refusal is part of the instruction. `--establish` writes nothing where
 * there are fewer than three screens to compare, and a pattern derived from one
 * screen is that screen's particulars promoted to a rule for every screen after
 * it. The decide path is the honest answer there, and it is the commonest
 * answer this tool gives.
 */
const ESTABLISH_IT = [
  'Establish it first, from the code you are about to read anyway:',
  '',
  '  1. Find a screen of that kind that already exists here.',
  '  2. ui-consistency:pattern — derive what that family agrees on and write it',
  '     down: `uic pattern <that screen> --establish`.',
  '     Do not ask the user for a reference; take the screen from step 1.',
  '  3. Fill in the parts the file says are still to be written, then build from it.',
  '',
  'Where there are fewer than three screens of the kind, nothing is derived and',
  'ui-consistency:decide records what is decided instead — a pattern of one is',
  "that screen's particulars turned into a rule for every screen after it.",
  '',
  'Doing any of this afterwards means arguing with code that already works.',
];

/**
 * The loop, where the work is a set — named as the shape it is, never begun.
 *
 * The reason it says *the set makes this a rollout* rather than *run the
 * rollout*: what makes the loop worth entering is that the same contract
 * reaches file thirty as file one, and an agent that has read nothing yet
 * cannot know there are thirty. So this states the shape and the two things
 * that go wrong without it, which is what a reader can act on once it has
 * opened the files.
 */
const manyOfThem = (text: string): string[] =>
  A_WHOLE_SET.test(text)
    ? [
        '',
        'This prompt names a set, not one screen. If it is more than two or three files,',
        'that is a rollout: ui-consistency:rollout. It keeps the queue on disk, works one',
        'file per turn against the contract re-read each time, and verifies the whole set',
        'at the end — which is what stops file thirty drifting toward the last file you',
        'looked at instead of the pattern, and what makes "27 of 30" auditable.',
      ]
    : [];

/**
 * How many to name.
 *
 * This is paid for on every prompt that mentions a screen, so it is a list of
 * what exists rather than a summary of what each says — the file is one command
 * away and the agent can read the one it needs.
 */
const MAX_PATTERNS = 12;

const describe = (one: PatternFile): string =>
  [one.name, one.surface ?? '—', one.holder ?? '—', `${one.members.length} files`].join('  ');

/**
 * Whether what it was read from has moved since.
 *
 * Said here rather than left for somebody to check, because this is the moment
 * it matters: a pattern derived from screens that have since changed is the one
 * thing worse than no pattern, and it is the moment before the next screen is
 * written from it.
 */
async function freshness(rootDir: string, one: PatternFile): Promise<string> {
  const stale = await staleIn(rootDir, one).catch(() => []);
  if (stale.length === 0) return '';
  const gone = stale.filter((each) => each.why === 'gone').length;
  const changed = stale.length - gone;
  const parts = [
    ...(changed > 0 ? [`${changed} changed`] : []),
    ...(gone > 0 ? [`${gone} gone`] : []),
  ];
  // What to do about it, and only where it can be done: a file the tool
  // established can have its counts regenerated in place, and one a person
  // wrote cannot. "Re-derive before trusting it" named no way to do either,
  // which is an instruction an agent can only act on by ignoring the pattern
  // or by rewriting somebody's file by hand (#28).
  const what = one.derived
    ? 'run `uic pattern <one of them> --refresh` first'
    : 'a person wrote it, so read it against `uic pattern <one of them>` before trusting it';
  return `  (${parts.join(', ')} since it was read — ${what})`;
}

interface Payload {
  cwd?: unknown;
  prompt?: unknown;
  user_input?: unknown;
}

/**
 * The `UserPromptSubmit` adapter. Never throws, and says nothing by default.
 *
 * Plain text rather than a JSON decision: for this event the documented
 * behaviour is that stdout becomes context the agent can see, and a decision
 * field here is how a prompt gets blocked. Nothing in this tool blocks anything.
 */
export async function promptResponse(stdin: string): Promise<string | null> {
  let cwd = process.cwd();
  let text = '';
  try {
    const parsed: unknown = JSON.parse(stdin);
    const payload = parsed as Payload;
    if (typeof payload?.cwd === 'string' && payload.cwd !== '') cwd = payload.cwd;
    // Both spellings: the field has been `prompt` and `user_input`, and reading
    // one of them is a hook that is silent on the harness that writes the other.
    for (const key of ['prompt', 'user_input'] as const) {
      const value = payload?.[key];
      if (typeof value === 'string' && value !== '') text = value;
    }
  } catch {
    return null;
  }
  if (text === '') return null;

  return promptContext(cwd, text).catch(() => null);
}

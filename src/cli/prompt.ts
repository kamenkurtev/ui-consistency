import { patternFiles, staleIn, type PatternFile } from '../knowledge/pattern-file.js';
import { KNOWLEDGE_DIR } from '../knowledge/paths.js';

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
  if (!ABOUT_SCREENS.test(text)) return null;

  const { patterns } = await patternFiles(rootDir).catch(() => ({ patterns: [] }));

  if (patterns.length === 0) {
    return [
      `ui-consistency: this project has written no patterns down (${KNOWLEDGE_DIR}/patterns/).`,
      '',
      'Before writing or changing a screen, establish what screens of that kind',
      'already look like here — ui-consistency:pattern reads them and writes it',
      'down. Doing it afterwards means arguing with code that already works.',
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
    'Where none covers it, ui-consistency:pattern establishes it first.',
  );
  return said.join('\n');
}

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
  return `  (${parts.join(', ')} since it was read — re-derive before trusting it)`;
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

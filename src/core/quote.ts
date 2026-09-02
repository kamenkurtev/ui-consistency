/**
 * How much of a value to show. Enough to recognise it, never a payload.
 *
 * Counted in code points, not UTF-16 units: eighty units can land inside an
 * astral character and emit a lone surrogate, which Node's encoder cannot
 * represent and a terminal shows as mojibake.
 */
const MAX_QUOTED = 80;

/**
 * Everything invisible: whitespace, controls, and the format characters.
 *
 * `\s` is narrower than its name. It does not match U+0085 NEL, U+200B zero
 * width space or U+2060 word joiner — all of which survived a "collapse" that
 * only used `\s`, and the second could be dropped inside `ui-consistency:` to
 * walk straight past the check below. `\p{Cc}` and `\p{Cf}` close that.
 */
const INVISIBLE = /[\p{Cc}\p{Cf}]/gu;

/** Anything that renders as a colon. Ends the tool's own prefix. */
const COLON = '[:\\uFF1A\\uA789\\u2236\\u02D0\\u0589\\u05C3\\uFE13\\uFE55]';

/** How this tool introduces itself, in any spelling that still reads as it. */
const OWN_VOICE = new RegExp(`ui-consistency\\s*${COLON}`, 'giu');

/**
 * A value taken out of somebody's repository, made safe to put in prose an
 * agent reads.
 *
 * The hook hands its text to a coding agent and ends it with "Fix them in this
 * turn." Values were interpolated raw, so a string literal in ordinary
 * application code could fabricate what looked like a second message from the
 * tool — newlines and all — and put a shell command beside a real instruction
 * (#171).
 *
 * Three steps, in this order, and the order matters:
 *
 * 1. **Invisibles are removed, not collapsed.** A character with no width
 *    cannot be seen to be there, so leaving one in a sentence is the same as
 *    leaving a hole in it.
 * 2. **Whitespace collapses to single spaces.** A fabricated paragraph needs
 *    line breaks; without them the value stays inside the sentence quoting it.
 * 3. **The tool's own prefix is broken**, in any colon that renders as one.
 *
 * Then a cap, by code point.
 *
 * **What this does not claim.** It is not general escaping and it cannot make
 * an agent treat hook text as data rather than instruction — that judgement
 * belongs to the harness. Bidirectional overrides still pass through; they can
 * reorder what a reader sees but cannot manufacture the tool's voice. What this
 * stops is the tool handing over text built to be mistaken for its own.
 */
export function quoted(value: string): string {
  const visible = value.replace(INVISIBLE, '');
  const flat = visible.replace(/\s+/gu, ' ').trim();
  // Split rather than delete: the reader still sees what was written, and it
  // can no longer introduce itself as this tool.
  const defanged = flat.replace(OWN_VOICE, (match) => `${match.slice(0, -1)}⁠ `);

  const points = [...defanged];
  return points.length > MAX_QUOTED ? `${points.slice(0, MAX_QUOTED).join('')}…` : defanged;
}

import { readFile } from 'node:fs/promises';

/**
 * The lines a tool call actually wrote.
 *
 * The hook runs every check over the **whole file** and used to inject
 * everything it found with *"Fix them in this turn."* — so an agent editing
 * line 40 for one reason was told to fix line 121 for another. Obeying means
 * unrelated churn in an unrelated change, so a disciplined agent skips it, and
 * every such event teaches that the hook's imperative is skippable (#256).
 *
 * The tool's own dogfood log holds one finding from real work: a `fontSize: 16`
 * on a line a teammate wrote a year before the edit that triggered it, during a
 * router change. It was ignored, the ignore was **correct scope discipline**,
 * and the product is what was wrong.
 *
 * `null` means *everything* — a `Write` replaces the file, so all of it is new,
 * and an unreadable payload must never narrow anything.
 */
export type Touched = { from: number; to: number }[] | null;

interface Edit {
  old_string?: unknown;
  new_string?: unknown;
}

interface ToolInput {
  content?: unknown;
  old_string?: unknown;
  new_string?: unknown;
  edits?: unknown;
}

/**
 * Where a piece of text sits in a file, as a line range, for every occurrence.
 *
 * **No slack, and that is measured rather than assumed.** The issue expected
 * some, for line numbers shifting — but `PostToolUse` runs after the write, so
 * the checks and this reader see the *same* content and their line numbers are
 * on the same coordinate system. There is nothing to compensate for, and two
 * lines of slack makes the case this exists for — an untouched line directly
 * above the edited one — indistinguishable from the edited one.
 *
 * What it costs: a finding reported at an element's *opening* line while the
 * edit wrote an attribute further inside it is not said. That is a miss, which
 * is the allowed direction, and the log keeps it either way.
 */
function rangesOf(source: string, text: string): { from: number; to: number }[] {
  if (text === '') return [];

  const found: { from: number; to: number }[] = [];
  const height = text.split('\n').length - 1;
  let at = source.indexOf(text);
  while (at >= 0 && found.length < 64) {
    const line = source.slice(0, at).split('\n').length;
    found.push({ from: line, to: line + height });
    at = source.indexOf(text, at + 1);
  }
  return found;
}

/**
 * The line ranges this tool call wrote, or `null` for the whole file.
 *
 * `PostToolUse` runs *after* the write, so what is on disk is the **new** text —
 * which is why `new_string` is what is located, not `old_string`.
 */
export async function touchedBy(
  toolName: string,
  input: unknown,
  filePath: string,
): Promise<Touched> {
  if (toolName === 'Write' || toolName === 'NotebookEdit') return null;
  if (typeof input !== 'object' || input === null) return null;

  const written: string[] = [];
  const one = input as ToolInput;
  if (typeof one.new_string === 'string') written.push(one.new_string);
  if (Array.isArray(one.edits)) {
    for (const edit of one.edits as Edit[]) {
      if (typeof edit?.new_string === 'string') written.push(edit.new_string);
    }
  }
  if (written.length === 0) return null;

  const source = await readFile(filePath, 'utf8').catch(() => null);
  if (source === null) return null;

  const ranges = written.flatMap((text) => rangesOf(source, text));
  // Located nothing — the file moved under us, or the text was normalised.
  // Saying everything is the safe direction: this may only ever narrow what is
  // said when it is sure, never widen a silence.
  return ranges.length === 0 ? null : ranges;
}

/** Is this line one the edit wrote? `null` ranges mean all of them are. */
export const within = (touched: Touched, line: number): boolean =>
  touched === null || touched.some((range) => line >= range.from && line <= range.to);

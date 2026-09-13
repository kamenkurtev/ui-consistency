/**
 * The marker a generated knowledge file carries, and the version that wrote it.
 *
 * **All that is left of `parse.ts` (#89)**, which read `.ui-consistency/`
 * Markdown into fragments for the checks — and the checks are gone. This half
 * is not about checking anything: `uic init` wrote files into people's
 * repositories and deleting the command did not delete what it wrote, so the
 * session hook still has to be able to say *"this was written by an older
 * plugin than the one running, and nothing generates those files any more"*.
 */

/** `<!-- uic:generated v=0.9.1 -->` under the H1 of a file the tool wrote. */
const MARKER = /<!--\s*uic:generated\b[^>]*-->/i;

/** How far into the file the marker may be and still count. */
const MARKER_WINDOW = 512;

/** The plugin version a generated file records, or null. */
export function generatedVersion(source: string): string | null {
  const marker = MARKER.exec(source.slice(0, MARKER_WINDOW));
  if (marker === null) return null;
  return /\bv=([\w.-]+)/.exec(marker[0])?.[1] ?? null;
}

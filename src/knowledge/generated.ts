/**
 * The marker a generated knowledge file carries, and the version that wrote it.
 *
 * Older plugin versions generated files into `.ui-consistency/`, and those files
 * are still in people's repositories. The session hook uses this to say they
 * were written by an older plugin and nothing generates them any more.
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

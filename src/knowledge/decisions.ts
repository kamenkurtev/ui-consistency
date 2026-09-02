import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { knowledgeDir } from './paths.js';

/** What a team has decided about one kind of screen, and could not derive. */
export interface Decision {
  /** The kind of screen, from the file name: `detail.md` → `detail`. */
  kind: string;
  /** The screen this kind is built like, absolute, or null. */
  canon: string | null;
  /** What the canon pointer named, when it no longer resolves. */
  stale: string | null;
  /** Statements no extraction could produce. */
  statements: string[];
  /**
   * Layer intent, for the file that carries decisions about the project as a
   * whole rather than about one kind of screen.
   *
   * The same class of thing: which of two packages a team is moving *towards*
   * cannot be read off a dependency graph, because the old package usually
   * still depends on the new one.
   */
  prefer: string[];
  ignore: string[];
  /** The file this came from, so a person can be sent to it. */
  file: string;
}


/**
 * The only thing this tool stores about a project.
 *
 * Facts about the code are derived every time and never kept: a stored copy of
 * what the code says can only be wrong, and every staleness problem this
 * repository has had came from such a copy. What cannot be derived is
 * **intent** — which screen is the canon, which of two competing patterns the
 * team is moving *towards* (extraction picks the older one, because it is the
 * more common), that a breadcrumb comes from the route rather than the title.
 *
 * So: five to twenty lines per kind of screen, mostly pointers. Committed,
 * reviewed in a pull request, shared through git like the code — which is also
 * what makes it curated rather than inferred behind somebody's back.
 */
export async function readDecisions(rootDir: string): Promise<Decision[]> {
  const { dir } = await knowledgeDir(rootDir, 'decisions');
  const entries = await readdir(dir).catch(() => null);
  if (entries === null) return [];

  const decisions: Decision[] = [];
  for (const entry of entries.filter((name) => /\.md$/i.test(name)).sort()) {
    const path = join(dir, entry);
    const source = await readFile(path, 'utf8').catch(() => null);
    if (source === null) continue;

    let named: string | null = null;
    const statements: string[] = [];
    const listed: Record<string, string[]> = { prefer: [], ignore: [] };

    for (const line of source.split('\n')) {
      const pointer = /^\s*canon\s*:\s*(.+?)\s*$/i.exec(line);
      if (pointer !== null) {
        named = pointer[1]!;
        continue;
      }
      const list = /^\s*(prefer|ignore)\s*:\s*(.+?)\s*$/i.exec(line);
      if (list !== null) {
        listed[list[1]!.toLowerCase()] = list[2]!
          .split(',')
          .map((name) => name.trim())
          .filter((name) => name !== '');
        continue;
      }
      // Bullets are the statements. Prose without one is background: something
      // a person wrote to explain the file, not something to act on.
      const statement = /^\s*[-*]\s+(.+?)\s*$/.exec(line);
      if (statement !== null) statements.push(statement[1]!);
    }

    // Checked here, at the moment the decision is read, rather than by a command
    // somebody has to remember to run. A check that fires on use cannot rot.
    const resolved = named === null ? null : resolve(rootDir, named);
    const exists = resolved === null ? false : await stat(resolved).then(() => true, () => false);

    decisions.push({
      kind: basename(entry).replace(/\.md$/i, ''),
      canon: exists ? resolved : null,
      stale: named !== null && !exists ? named : null,
      statements,
      prefer: listed['prefer'] ?? [],
      ignore: listed['ignore'] ?? [],
      file: path,
    });
  }

  return decisions;
}

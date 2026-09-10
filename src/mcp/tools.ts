import { readFile, realpath, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { patternOf } from '../sources/pattern.js';
import { screenTree, DEFAULT_DEPTH, MAX_DEPTH } from '../sources/tree.js';
import { propsMatrix } from '../sources/matrix.js';
import { groupScreens } from '../sources/grouping.js';
import { patternDeviations } from '../checks/pattern-check.js';
import { patternFiles, patternForScreen, staleIn } from '../knowledge/pattern-file.js';
import { holderOf } from '../sources/holder.js';
import { formatFinding } from '../core/format.js';
import { analyzeProject } from '../core/project.js';
import { KNOWLEDGE_DIR, knowledgeDir } from '../knowledge/paths.js';

/**
 * One tool: what the agent sees of it, and the core function behind it.
 *
 * `description` is one line on purpose. Every schema here sits in every session
 * whether or not any UI work happens, which is against the rule that a session
 * doing no UI work costs nothing — so the count stays at six and the prose
 * stays out. What the surface as a whole is for is said once, in the server's
 * `instructions`.
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: unknown;
  run: (rootDir: string, args: Record<string, unknown>) => Promise<Answer>;
}

/**
 * What a tool answers.
 *
 * `failed` is *the tool ran and has nothing to say for a reason you can act
 * on*, not *the server is broken* — a path outside the project, a screen with
 * fewer than three siblings of its kind. That is the distinction the CLI makes
 * with an exit code and a sentence on stderr, and collapsing it would turn the
 * commonest honest answer in this tool into an apparent malfunction.
 */
interface Answer {
  text: string;
  failed?: boolean;
}

/** The array parameter that removes a whole class of wrong call. */
const FILES = {
  type: 'array',
  items: { type: 'string' },
  description: 'Project-relative paths. Not globs.',
} as const;

const DEPTH = {
  type: 'integer',
  minimum: 1,
  maximum: MAX_DEPTH,
  description: `File hops to follow (default ${DEFAULT_DEPTH}).`,
} as const;

const schema = (
  properties: Record<string, unknown>,
  required: string[],
): unknown => ({ type: 'object', properties, required, additionalProperties: false });

export const TOOLS: Tool[] = [
  {
    name: 'pattern',
    description:
      'What screens of this screen\'s kind look like in this project, and the pattern file for it if one exists.',
    inputSchema: schema({ screen: { type: 'string' } }, ['screen']),
    async run(rootDir, args) {
      const screen = await fileIn(rootDir, args.screen);
      if (typeof screen !== 'string') return screen;

      // The holder channel is asked for, as `uic pattern` asks for it: 376 ms
      // on an 808-screen application, which is fine inside a call somebody
      // made and is not fine on an edit path. This is never on that path.
      const derived = await patternOf(screen, { byHolder: true });

      const { patterns } = await patternFiles(rootDir).catch(() => ({ patterns: [] }));
      const covering = patternForScreen(patterns, relative(rootDir, screen), await holderOf(screen));
      const stale = covering === null ? [] : await staleIn(rootDir, covering).catch(() => []);

      if (derived === null && covering === null) {
        // The honest answer and the commonest one. Said as a fact about the
        // code rather than as a failure, because *this is the first screen of
        // its kind* is what a caller has to act on.
        return {
          text:
            `No pattern for ${relative(rootDir, screen)}: fewer than three screens of its kind to ` +
            `compare, and nothing in ${KNOWLEDGE_DIR}/patterns covers it. It is the first of its kind here.`,
          failed: true,
        };
      }

      return {
        text: JSON.stringify(
          {
            derived:
              derived === null
                ? null
                : { ...derived, family: derived.family.map((one) => relative(rootDir, one)) },
            // The file wins where one exists, and says so: a pattern file is a
            // person's statement reviewed in a pull request, and nothing read
            // off the code outranks it.
            stated:
              covering === null
                ? null
                : {
                    name: covering.name,
                    file: `${KNOWLEDGE_DIR}/patterns/${covering.file}`,
                    derivedByTool: covering.derived,
                    observed: covering.observed,
                    movedSince: stale,
                  },
          },
          null,
          2,
        ),
      };
    },
  },
  {
    name: 'deviations',
    description: 'Where the given screens depart from a pattern file, per file.',
    inputSchema: schema({ files: FILES, pattern: { type: 'string' } }, ['files', 'pattern']),
    async run(rootDir, args) {
      const files = await filesIn(rootDir, args.files);
      if (!Array.isArray(files)) return files;

      const named = typeof args.pattern === 'string' ? args.pattern : '';
      const { patterns } = await patternFiles(rootDir).catch(() => ({ patterns: [] }));
      const pattern = patterns.find((one) => one.name === named || one.file === named);
      if (pattern === undefined) {
        return {
          text: `No pattern called "${named}". The resources of this server list what there is.`,
          failed: true,
        };
      }

      const said: string[] = [];
      const handedOver = new Set<string>();
      for (const file of files) {
        const source = await readFile(file, 'utf8').catch(() => null);
        if (source === null) continue;
        const where = relative(rootDir, file);
        // The structure half needs the tree, and a pattern naming a level the
        // file does not render cannot be judged without one.
        const tree = await screenTree(rootDir, file).catch(() => null);
        // Applied **per file**, and a file of another kind is named rather
        // than measured — measuring it is the defect `uic diff` already fixed.
        const report = patternDeviations(where, source, pattern, tree);
        for (const one of report.handedOver) handedOver.add(one);
        said.push(
          report.deviations.length === 0
            ? `${where}: matches everything checkable.`
            : report.deviations.map((one) => `${where}: ${one.message}`).join('\n'),
        );
      }

      // Handed over rather than evaluated. Printing nothing for the prose would
      // let a screen pass against rules nobody checked.
      return {
        text: [
          said.length === 0 ? 'None of those files could be read.' : said.join('\n'),
          ...(handedOver.size === 0
            ? []
            : ['', 'Stated in the pattern and evaluable by nothing here — judge these yourself:', ...handedOver]),
        ].join('\n'),
      };
    },
  },
  {
    name: 'tree',
    description: 'What one screen renders, resolved through the files it imports.',
    inputSchema: schema({ screen: { type: 'string' }, depth: DEPTH }, ['screen']),
    async run(rootDir, args) {
      const screen = await fileIn(rootDir, args.screen);
      if (typeof screen !== 'string') return screen;
      const depth = typeof args.depth === 'number' ? args.depth : undefined;
      const tree = await screenTree(rootDir, screen, depth === undefined ? {} : { depth });
      if (tree === null) return { text: `${relative(rootDir, screen)} renders nothing this can read.`, failed: true };
      // Project-relative. The walk records what it read as absolute paths,
      // which puts this machine's directory layout into the agent's context to
      // answer a question about one screen.
      return {
        text: JSON.stringify({ ...tree, read: tree.read.map((one) => relative(rootDir, one)) }, null, 2),
      };
    },
  },
  {
    name: 'props',
    description: 'Which props each of the given files writes on one component, and where they diverge.',
    inputSchema: schema({ component: { type: 'string' }, files: FILES }, ['component', 'files']),
    async run(rootDir, args) {
      const files = await filesIn(rootDir, args.files);
      if (!Array.isArray(files)) return files;
      const component = typeof args.component === 'string' ? args.component : '';
      if (component === '') return { text: 'Name the component to read.', failed: true };
      const matrix = await propsMatrix(rootDir, component, files);
      return { text: JSON.stringify({ ...matrix, component }, null, 2) };
    },
  },
  {
    name: 'group',
    description: 'The given screens grouped by what they are composed of.',
    inputSchema: schema({ files: FILES, depth: DEPTH }, ['files']),
    async run(rootDir, args) {
      const files = await filesIn(rootDir, args.files);
      if (!Array.isArray(files)) return files;
      const depth = typeof args.depth === 'number' ? args.depth : undefined;
      const grouped = await groupScreens(rootDir, files, depth);
      return { text: JSON.stringify(grouped, null, 2) };
    },
  },
  {
    name: 'findings',
    description: 'The deterministic findings for the given files: imports, style literals, deprecated usage, stated rules.',
    inputSchema: schema({ files: FILES }, ['files']),
    async run(rootDir, args) {
      const files = await filesIn(rootDir, args.files);
      if (!Array.isArray(files)) return files;
      const findings = await analyzeProject(rootDir, files);
      // Empty is a real answer, and it is not the same as *clean* — which is
      // why it says what it read rather than nothing at all.
      if (findings.length === 0) {
        return { text: `No findings in ${files.length} file(s). That is what was read, not a grade.` };
      }
      return { text: findings.map((one) => formatFinding(one)).join('\n') };
    },
  },
];

/**
 * The pattern files, as resources.
 *
 * The half a CLI cannot offer: the agent lists and reads them without knowing a
 * path convention, and anything else with an MCP client — a CI job, a review
 * bot — gets the same access.
 */
export async function listResources(rootDir: string): Promise<unknown[]> {
  const { patterns } = await patternFiles(rootDir).catch(() => ({ patterns: [] }));
  return patterns.map((one) => ({
    uri: `${SCHEME}${one.file}`,
    name: one.name,
    description: `${one.holder ?? 'no holder stated'} · ${one.members.length} files${one.derived ? ' · derived, not yet approved' : ''}`,
    mimeType: 'text/markdown',
  }));
}

/**
 * One pattern file, read.
 *
 * **Enumerated, never joined.** `join(dir, name)` with a name from the client
 * is the traversal shape this repository has already tested for: a
 * `../../../../etc/x` in a URI would read outside the knowledge directory, and
 * the defence that held in #28's refresh was that the path came from `readdir`
 * rather than from content. Same here — the requested URI has to be one this
 * server listed, or there is nothing to read.
 */
export async function readResource(
  rootDir: string,
  uri: string,
): Promise<{ uri: string; mimeType: string; text: string }> {
  const listed = await listResources(rootDir);
  const found = listed.find((one) => (one as { uri: string }).uri === uri);
  if (found === undefined) throw new Error(`No such resource: ${uri}`);

  // Read from the directory this listed, under the name it listed. `readdir`
  // is what produced that name, so nothing a caller wrote reaches this path —
  // which is the whole of the defence, and the reason there is no sanitising
  // step here to be got wrong.
  const { dir } = await knowledgeDir(rootDir, 'patterns');
  const raw = await readFile(join(dir, uri.slice(SCHEME.length)), 'utf8');
  return { uri, mimeType: 'text/markdown', text: raw };
}

const SCHEME = 'uic://patterns/';

/** The shell metacharacters that mean somebody meant a set of files. */
const GLOB = /[*?[\]{}]/;

/**
 * One path the client named, resolved and confined to this project.
 *
 * **Both sides are resolved before comparing.** `realpath` on one side only is
 * the mistake that broke three passing tests once: a temporary directory on
 * macOS is a symlink, so a resolved file path does not begin with an unresolved
 * root and every file looks foreign.
 *
 * The confinement is not the CLI's behaviour and is deliberate here. A person
 * running `uic check ../other-repo/x.tsx` meant it; a model calling a tool did
 * not necessarily, and this server answers about the project it was started in.
 */
async function fileIn(rootDir: string, given: unknown): Promise<string | Answer> {
  if (typeof given !== 'string' || given === '') return { text: 'Name a file.', failed: true };

  const path = resolve(rootDir, given);

  // **Confinement first, existence second.** The other order answers *does not
  // exist* about a path outside the project — which is the wrong reason, and
  // it means the boundary is only ever reached for paths that happen to be
  // there. `realpath` on a path that is not there falls back to the resolved
  // one, which is what makes the check work before the file is known.
  const inside = await realpath(rootDir).catch(() => rootDir);
  const real = await realpath(path).catch(() => path);
  if (real !== inside && !real.startsWith(inside.endsWith(sep) ? inside : `${inside}${sep}`)) {
    return {
      text: `${given} is outside ${rootDir}, and this server answers about that project only.`,
      failed: true,
    };
  }

  const found = await stat(path).catch(() => null);
  if (found === null) {
    // Named as what it is. Removing this class of call is one of the three
    // reasons this surface exists — over MCP the parameter is an array, so
    // there is no shell to expand a pattern and nothing to expand it into.
    return {
      text: GLOB.test(given)
        ? `${given} is a glob. These parameters take one path per array entry; expand it yourself.`
        : `${given} does not exist.`,
      failed: true,
    };
  }
  if (found.isDirectory()) return { text: `${given} is a directory, and this takes files.`, failed: true };

  return real;
}

/** The same, for the array parameter — and it says which paths were refused. */
async function filesIn(rootDir: string, given: unknown): Promise<string[] | Answer> {
  if (!Array.isArray(given) || given.length === 0) {
    return { text: 'Name at least one file. This takes an array of paths, not a glob.', failed: true };
  }
  const absolute: string[] = [];
  const refused: string[] = [];
  for (const one of given) {
    const path = await fileIn(rootDir, one);
    if (typeof path === 'string') absolute.push(path);
    else refused.push(path.text);
  }
  // Every refusal named, and none of them silently dropped: a tool that
  // measured four of the five files it was given and said so about none of
  // them is the shape of a wrong answer, not a partial one.
  if (refused.length > 0) return { text: refused.join('\n'), failed: true };
  return absolute;
}

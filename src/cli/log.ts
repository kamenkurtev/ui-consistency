import { appendFile, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { Finding, Level } from '../types.js';
import { importSentence, importSourceSentence, readImportSentence } from '../core/format.js';
import { cacheRoot, ownedDir, projectKey } from '../core/cache-dir.js';

/**
 * One finding, as it is kept.
 *
 * No file contents, no surrounding lines, no AST.
 *
 * **It is not free of your code, and it used to say it was.** `message` is the
 * finding's own sentence, and a finding quotes what it found — `color: '#ff0000'
 * is a hardcoded colour`. That is a literal out of the file. The shape here
 * constrains the *keys*; it cannot constrain what a check writes into a
 * sentence, so the old claim that this was "a property of the format" was
 * exactly the care-when-adding-a-field it said it was not (#173).
 *
 * What is true: values are quoted through `quoted()` (#171), so each is one
 * line and at most eighty characters, and there is never more of a file than
 * the finding needed to name.
 *
 * What protects it is the directory, not the format — owner-only, refused if
 * anything else owns the name (#172).
 */
export interface LogEntry {
  at: number;
  file: string;
  line: number;
  level: Level;
  message: string;
  /**
   * A deterministic finding, or the advisory context handed to the agent.
   *
   * They are counted apart because they are judged apart: a hardcoded colour
   * is obviously right or wrong, while "this page has content above its
   * header" is a judgement whose relevance only a person looking at the file
   * can settle.
   */
  kind: 'finding' | 'advice';
}

export interface RecordOptions {
  now?: () => number;
  /** Paths are logged relative to this, so the log carries no machine layout. */
  rootDir?: string;
  /** `UIC_LOG=off` turns it off; on otherwise. */
  enabled?: boolean;
}

/** Kept beside the inventory cache — outside the repository, so nothing to gitignore. */
export const logPath = (rootDir: string): string =>
  join(cacheRoot(), projectKey(rootDir), 'findings.jsonl');

/**
 * Where the contract for one kind of screen is kept while a task runs.
 *
 * Beside the log, outside the repository, keyed by it. Ephemeral on purpose:
 * it is assembled from a pointer, the decisions and fresh derivation, re-read
 * once per file, and discarded — so it is never committed and can never go
 * stale. A path invented afresh each turn would defeat the reason for writing
 * it down at all, which is that a cold subagent can read it.
 */
export const contractPathFor = (rootDir: string, kind: string): string =>
  join(logPath(rootDir), '..', `contract-${kind.replace(/[^\w.-]+/g, '-')}.json`);

/** Every contract written for this project, newest first. */
export const contractsFor = async (rootDir: string): Promise<string[]> => {
  // Through the guard, because reading is not the harmless half. A contract
  // decides what the hook says about a screen, so a planted one is a way to put
  // text in front of the agent — the same directory, the same symlink, and the
  // write path refusing is no help if the read path does not (#172).
  const dir = await ownedDir(projectKey(rootDir));
  if (dir === null) return [];

  const entries = await readdir(dir).catch(() => null);
  return (entries ?? [])
    .filter((name) => /^contract-.*\.json$/.test(name))
    .sort()
    .map((name) => join(dir, name));
};

/** Rotate rather than grow forever. One previous file is kept. */
const MAX_BYTES = 4_000_000;

/**
 * What has already been recorded, and how often it has come back.
 *
 * Beside the log rather than inside it, because the log is an append-only file
 * of small atomic writes and that is what keeps it safe with several editors
 * running at once. Rewriting a line to bump a counter would give that up.
 */
export const statePath = (rootDir: string): string => join(logPath(rootDir), '..', 'seen.jsonl');

export interface SeenEntry {
  /** When this finding was first recorded. */
  first: number;
  /** When it was last produced — the recurrence, not the log line. */
  last: number;
  /** How many times it has been produced, including the first. */
  times: number;
}

/**
 * Rotate this one sooner than the log.
 *
 * It is folded on every edit to decide whether a finding is new, so its size is
 * a per-edit cost rather than a disk one. At roughly 100 bytes a line this is
 * some thousands of occurrences, which is a long working history.
 */
const MAX_STATE_BYTES = 512_000;

const keyOf = (entry: { file: string; line: number; level: Level; message: string }): string =>
  `${entry.file}|${entry.line}|${entry.level}|${entry.message}`;

/**
 * Every occurrence, folded into one entry per distinct finding.
 *
 * Append-only, exactly like the log beside it, and for exactly the same reason:
 * read-modify-write on a shared file loses whichever writer finished first.
 * With two editors saving at once, a state object read, mutated and renamed
 * into place drops the other one's increments — and a reader that catches a
 * half-written file would rewrite the whole history as a single entry. One
 * small append per occurrence cannot do either.
 */
export const readSeen = async (rootDir: string): Promise<Record<string, SeenEntry>> => {
  const raw = await readFile(statePath(rootDir), 'utf8').catch(() => null);
  if (raw === null) return {};

  const folded: Record<string, SeenEntry> = {};
  for (const line of raw.split('\n')) {
    if (line.trim() === '') continue;
    try {
      const parsed = JSON.parse(line) as { k?: unknown; at?: unknown };
      if (typeof parsed.k !== 'string' || typeof parsed.at !== 'number') continue;
      const existing = folded[parsed.k];
      folded[parsed.k] =
        existing === undefined
          ? { first: parsed.at, last: parsed.at, times: 1 }
          : {
              first: Math.min(existing.first, parsed.at),
              last: Math.max(existing.last, parsed.at),
              times: existing.times + 1,
            };
    } catch {
      // A torn line loses one occurrence, not the history.
    }
  }
  return folded;
};

const isOn = (options: RecordOptions): boolean =>
  options.enabled ?? process.env['UIC_LOG']?.toLowerCase() !== 'off';

/**
 * Append what was found, if anything.
 *
 * Best effort in every direction: an unwritable log is a log that silently
 * does not happen. The hook's answer must never change because of it, and an
 * edit must never be interrupted for the sake of a record of it.
 */
export const record = async (
  rootDir: string,
  findings: Finding[],
  options: RecordOptions = {},
  kind: 'finding' | 'advice' = 'finding',
): Promise<void> => {
  if (findings.length === 0 || !isOn(options)) return;

  try {
    const now = options.now ?? (() => Date.now());
    const at = now();
    const base = options.rootDir ?? rootDir;

    const path = logPath(rootDir);
    // Owner-only, and refused outright if something else already owns that name.
    // `mkdir(recursive)` does not fail on a pre-planted symlink — it stats
    // through it and every write follows it somewhere else (#172).
    const dir = await ownedDir(projectKey(rootDir));
    if (dir === null) return;

    // Which project this log is of. Four instances means four logs, and a
    // file handed to somebody else does not otherwise say where it came from
    // — its paths are relative on purpose.
    await writeFile(join(dir, 'repo.txt'), `${base}\n`, 'utf8').catch(() => undefined);

    const size = await stat(path).then(
      (info) => info.size,
      () => 0,
    );
    if (size > MAX_BYTES) await rename(path, `${path}.1`).catch(() => undefined);

    // What has been recorded before. Every save of a file re-runs every check,
    // so without this the log fills with the same finding: on a real project
    // it was the identical line two and three times per file, and the counts
    // meant "how often somebody pressed save" rather than what was found.
    const seen = await readSeen(rootDir);

    const state = statePath(rootDir);
    const stateSize = await stat(state).then(
      (info) => info.size,
      () => 0,
    );
    if (stateSize > MAX_STATE_BYTES) await rename(state, `${state}.1`).catch(() => undefined);

    // One entry per write, never a batch.
    //
    // An append is atomic only while it stays under the pipe buffer — about
    // 4 KB. A file with forty findings exceeds that, and with several editors
    // running at once two writes can land inside each other and corrupt both
    // lines. A single entry is always small enough.
    for (const finding of findings) {
      const entry: LogEntry = {
        at,
        file: relative(base, finding.file) || finding.file,
        line: finding.line,
        level: finding.level,
        message: finding.message,
        kind,
      };

      const key = `${kind}|${keyOf(entry)}`;
      // One small append per occurrence, whether or not it is new.
      await appendFile(state, `${JSON.stringify({ k: key, at })}\n`, 'utf8');

      // The log line is written once. Coming back is a fact about the finding,
      // and it is recorded beside the log rather than as another copy of it.
      if (seen[key] === undefined) {
        await appendFile(path, `${JSON.stringify(entry)}\n`, 'utf8');
      }
    }
  } catch {
    // Deliberate. See above.
  }
};

export interface AdviceSummary {
  /** What holds a screen of this kind, or null where it could not be read. */
  kind: string | null;
  layout: string;
  /** The curated rules that were offered with it. */
  rules: string[];
  /** Components the neighbouring screens were found to agree about. */
  observed?: string[];
}

/**
 * Record that advice was given, and what it said about the screen.
 *
 * The half most worth having afterwards, and the half that was never written
 * down: `record` ran before the advisory branch and only ever saw Tier 1. In a
 * project with no page rules yet — which is every project on day one — the log
 * showed style, reuse and imports, and nothing at all about layout.
 */
export const recordAdvice = async (
  rootDir: string,
  filePath: string,
  advice: AdviceSummary,
  options: RecordOptions = {},
): Promise<void> => {
  if (!isOn(options)) return;

  const observed = advice.observed ?? [];
  const summary =
    `advisory —${advice.kind === null ? '' : ` kind: ${advice.kind};`} layout: ${advice.layout || 'none read'}` +
    (observed.length > 0 ? `; neighbours agree on: ${observed.join(', ')}` : '') +
    (advice.rules.length > 0 ? `; rules offered: ${advice.rules.join(', ')}` : '');

  await record(
    rootDir,
    [{ file: filePath, line: 1, level: 'page-pattern', message: summary }],
    options,
    'advice',
  );
};

/**
 * Everything recorded for this repository, oldest first and once each.
 *
 * Folded on the way out as well as deduplicated on the way in. Deciding
 * whether a finding is new means reading the state and then appending, and two
 * processes that do both at the same instant — the same file open in two
 * editors, or a batch run beside a hook — can each conclude it is new. That
 * race cannot be closed without a lock, and a lock on the edit path is a worse
 * thing than a duplicated line. Folding here closes it where it is cheap:
 * whatever landed in the file, what is read back is one entry per finding,
 * keeping the first time it was seen.
 */
export const readLog = async (rootDir: string): Promise<LogEntry[]> => {
  const raw = await readFile(logPath(rootDir), 'utf8').catch(() => null);
  if (raw === null) return [];

  const entries = new Map<string, LogEntry>();
  for (const line of raw.split('\n')) {
    if (line.trim() === '') continue;
    try {
      const parsed: unknown = JSON.parse(line);
      if (typeof parsed !== 'object' || parsed === null || !('level' in parsed)) continue;
      const entry = parsed as LogEntry;
      const key = `${entry.kind}|${keyOf(entry)}`;
      const existing = entries.get(key);
      if (existing === undefined) entries.set(key, entry);
      else if (entry.at < existing.at) entries.set(key, entry);
    } catch {
      // A truncated write or a line somebody pasted in. One bad line is not a
      // reason to lose the rest.
    }
  }
  return [...entries.values()].sort((a, b) => a.at - b.at);
};

export interface Summary {
  /** Deterministic findings. Advice is counted separately. */
  total: number;
  /** How many times advice was handed to the agent. */
  advice: number;
  byLevel: Record<string, number>;
  byFile: { file: string; count: number }[];
  /**
   * Findings that came back after an edit.
   *
   * The number that actually matters. A finding read and fixed is the plugin
   * working; the same finding on the same file an hour later means the agent
   * was told and did nothing — which is the only measure of whether any of
   * this changes behaviour.
   */
  repeated: { file: string; line: number; message: string; times: number }[];
  /**
   * The same finding on many different files.
   *
   * The maintenance signal the log was never used for: something the checker
   * reports across a dozen files is a thing the project has an opinion about
   * and has not written down. It is evidence from real work, which is the one
   * kind of evidence the fixtures in this repository cannot provide.
   */
  spread: { level: Level; message: string; files: number }[];
  /**
   * Findings that did not come back although their file was checked again.
   *
   * The only evidence the log can offer that anything was done. A finding is
   * counted here when its file produced something *later* than this finding
   * last appeared: the file was read again, this was not among what came out.
   */
  acted: number;
  /**
   * Findings whose file was never checked again, so nothing was learned.
   *
   * Most of a normal session, and the honest answer where the log used to
   * report an absence of repeats as an absence of problems (#221).
   */
  unknown: number;
  from: number | null;
  to: number | null;
}

/** How many files a finding must touch before it suggests a missing rule. */
const WORTH_A_RULE = 3;

/**
 * What one line of one file is about — the unit a person acts on.
 *
 * The hook reports one finding per symbol, because each symbol resolves
 * separately and that is right for the check. On one `import` statement naming
 * four symbols from the wrong package it is four findings, one fix — and the
 * report is where somebody reads it, so there they are one entry (#222). Four
 * of them on `plugins/home/src/alpha.tsx:29` also ranked that file first in
 * "files that produce the most", on a single line.
 *
 * Anything that is not a nearer-layer import keeps its own sentence as its
 * identity: those findings are already one per thing to do.
 */
type Imported = NonNullable<ReturnType<typeof readImportSentence>>;

const groupOf = (entry: LogEntry, imported: Imported | null): string =>
  imported === null
    ? `${entry.file}|${entry.line}|${entry.level}|${entry.message}`
    : `${entry.file}|${entry.line}|${entry.level}|${imported.importedFrom}|${imported.expectedFrom}`;

interface Grouped {
  entry: LogEntry;
  /** The symbols this line names and where they came from, or `null`. */
  imported: Imported | null;
  /** How often the *line* was produced, not how many symbols it carries. */
  times: number;
  last: number | undefined;
}

export const summarise = (
  entries: LogEntry[],
  seenState: Record<string, SeenEntry> = {},
): Summary => {
  const groups = new Map<string, Grouped>();
  /** The last moment anything at all was produced for a file. */
  const lastOnFile = new Map<string, number>();
  let advice = 0;

  for (const entry of entries) {
    if (entry.kind === 'advice') {
      advice++;
      continue;
    }

    // How often it actually came back, from the state kept beside the log. The
    // log itself holds one line per finding now, so counting lines would say
    // every finding was seen exactly once — which is the opposite of what this
    // number is for.
    const state = seenState[`finding|${keyOf(entry)}`];
    const times = state?.times ?? 1;
    // Two different questions, and only one of them tolerates a fallback.
    // *When did this file last produce anything* is answered by the log line
    // itself — writing it down is a moment the file was read. *When was this
    // finding last produced* is not: with no state beside the log, the line
    // says when it was first written and nothing about since. Reading the
    // first as the second would call the older of two findings on one file
    // acted on while it is still sitting there.
    const last = state?.last;
    lastOnFile.set(entry.file, Math.max(lastOnFile.get(entry.file) ?? 0, last ?? entry.at));

    const imported = readImportSentence(entry.message);
    const key = groupOf(entry, imported);
    const existing = groups.get(key);
    if (existing === undefined) {
      groups.set(key, { entry, imported, times, last });
      continue;
    }
    for (const symbol of imported?.symbols ?? []) {
      if (existing.imported !== null && !existing.imported.symbols.includes(symbol)) {
        existing.imported.symbols.push(symbol);
      }
    }
    // The line was produced as often as its busiest member, never the sum:
    // four symbols over three edits is three occurrences of one thing to do.
    existing.times = Math.max(existing.times, times);
    existing.last =
      existing.last === undefined || last === undefined
        ? undefined
        : Math.max(existing.last, last);
  }

  const said = (group: Grouped): string =>
    group.imported === null
      ? group.entry.message
      : importSentence(
          group.imported.symbols,
          group.imported.importedFrom,
          group.imported.expectedFrom,
        );

  const byLevel: Record<string, number> = {};
  const perFile = new Map<string, number>();
  const across = new Map<string, { level: Level; message: string; files: Set<string> }>();
  // A finding that came back is already accounted for by `repeated`. The rest
  // divide by whether the file was ever read again: only then did the finding
  // have a chance to reappear, and only then does its absence mean anything.
  let acted = 0;
  let unknown = 0;

  for (const group of groups.values()) {
    const { entry } = group;
    byLevel[entry.level] = (byLevel[entry.level] ?? 0) + 1;
    perFile.set(entry.file, (perFile.get(entry.file) ?? 0) + 1);

    // What repeats across files, which for an import is not its sentence.
    //
    // Every import finding names its own symbol, so two files taking different
    // things from the same wrong package never share a message and this half
    // stayed silent about 93% of what the tool produces. The source is what
    // repeats, and it is the shape the claim was always about: *the project has
    // an opinion here it has not written down*.
    const spoken =
      group.imported === null
        ? said(group)
        : importSourceSentence(group.imported.importedFrom, group.imported.expectedFrom);
    const shape = `${entry.level}|${spoken}`;
    const spread = across.get(shape) ?? {
      level: entry.level,
      message: spoken,
      files: new Set<string>(),
    };
    spread.files.add(entry.file);
    across.set(shape, spread);

    if (group.times > 1) continue;
    const activity = lastOnFile.get(entry.file);
    if (group.last !== undefined && activity !== undefined && group.last < activity) acted++;
    else unknown++;
  }

  return {
    total: groups.size,
    acted,
    unknown,
    advice,
    byLevel,
    byFile: [...perFile.entries()]
      .map(([file, count]) => ({ file, count }))
      .sort((a, b) => b.count - a.count),
    repeated: [...groups.values()]
      .filter((group) => group.times > 1)
      .map((group) => ({
        file: group.entry.file,
        line: group.entry.line,
        message: said(group),
        times: group.times,
      }))
      .sort((a, b) => b.times - a.times),
    spread: [...across.values()]
      .filter((group) => group.files.size >= WORTH_A_RULE)
      .map((group) => ({ level: group.level, message: group.message, files: group.files.size }))
      .sort((a, b) => b.files - a.files),
    from: entries[0]?.at ?? null,
    to: entries[entries.length - 1]?.at ?? null,
  };
};

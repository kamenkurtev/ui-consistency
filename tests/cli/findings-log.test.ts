import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { record, recordAdvice, readLog, readSeen, summarise, logPath } from '../../src/cli/log.js';
import type { Finding } from '../../src/types.js';

let root: string;

const finding = (over: Partial<Finding> = {}): Finding => ({
  file: '/repo/apps/orders/src/List.tsx',
  line: 12,
  level: 'style',
  message: "color: '#333' is a hardcoded colour, not a design-system token.",
  ...over,
});

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-log-'));
  await rm(logPath(root), { force: true });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(logPath(root), { force: true });
});

describe('what gets written', () => {
  it('records a finding', async () => {
    await record(root, [finding()], { now: () => 1_000 });
    const entries = await readLog(root);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.level).toBe('style');
    expect(entries[0]!.at).toBe(1_000);
  });

  it('records the path relative to the repository, not the machine', async () => {
    await record(root, [finding()], { now: () => 1_000, rootDir: '/repo' });
    expect((await readLog(root))[0]!.file).toBe('apps/orders/src/List.tsx');
  });

  it('never writes source code', async () => {
    // The log has to be something you can hand to somebody without handing
    // them your codebase. Nothing here carries a snippet, and the test says so
    // rather than trusting that nobody adds one later.
    await record(root, [finding()], { now: () => 1_000 });
    const raw = await readFile(logPath(root), 'utf8');
    const entry = JSON.parse(raw.trim()) as Record<string, unknown>;
    expect(Object.keys(entry).sort()).toEqual(['at', 'file', 'kind', 'level', 'line', 'message']);
  });

  it('marks a finding as a finding', async () => {
    await record(root, [finding()], { now: () => 1_000 });
    expect((await readLog(root))[0]!.kind).toBe('finding');
  });

  it('writes outside the repository', () => {
    expect(logPath(root).startsWith(root)).toBe(false);
  });

  it('writes nothing when there is nothing to say', async () => {
    await record(root, [], { now: () => 1_000 });
    expect(await readLog(root)).toEqual([]);
  });

  it('is silent when switched off', async () => {
    await record(root, [finding()], { now: () => 1_000, enabled: false });
    expect(await readLog(root)).toEqual([]);
  });
});

describe('what the summary says', () => {
  it('counts by level and by file', async () => {
    await record(root, [finding(), finding({ level: 'import' })], { now: () => 1_000 });
    await record(root, [finding({ file: '/repo/apps/orders/src/Detail.tsx' })], { now: () => 2_000 });

    const summary = summarise(await readLog(root));
    expect(summary.total).toBe(3);
    expect(summary.byLevel['style']).toBe(2);
    expect(summary.byLevel['import']).toBe(1);
    expect(summary.byFile[0]!.count).toBe(2);
  });

  it('counts the ones that came back', async () => {
    // The number that matters: the same finding on the same file, again,
    // after an edit. It means the agent was told and did nothing — which is
    // the only measure of whether any of this changes behaviour.
    await record(root, [finding()], { now: () => 1_000 });
    await record(root, [finding()], { now: () => 2_000 });
    await record(root, [finding()], { now: () => 3_000 });

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.repeated).toHaveLength(1);
    expect(summary.repeated[0]!.times).toBe(3);
  });

  it('writes the line once, however many times the file is saved', async () => {
    // Observed on a real project: every save re-runs every check, so the log
    // filled with the identical line two and three times per file, and the
    // counts meant "how often somebody pressed save".
    await record(root, [finding()], { now: () => 1_000 });
    await record(root, [finding()], { now: () => 2_000 });
    await record(root, [finding()], { now: () => 3_000 });

    const entries = await readLog(root);
    expect(entries).toHaveLength(1);
    expect(summarise(entries, await readSeen(root)).total).toBe(1);
  });

  it('keeps when a finding first appeared and when it last came back', async () => {
    await record(root, [finding()], { now: () => 1_000 });
    await record(root, [finding()], { now: () => 5_000 });

    const seen = Object.values(await readSeen(root));
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ first: 1_000, last: 5_000, times: 2 });
  });

  it('reports one entry even when a race wrote the line twice', async () => {
    // Deciding whether a finding is new means reading the state and then
    // appending, and two processes doing both at the same instant can each
    // conclude it is new. Measured: nine concurrent hooks over three files put
    // five lines in the file. A lock on the edit path would be worse than a
    // duplicated line, so the fold happens where it is cheap — on the way out.
    const line = JSON.stringify({
      at: 1_000,
      file: 'apps/orders/src/OrderList.tsx',
      line: 12,
      level: 'style',
      message: 'fontSize: 12 is a hardcoded value',
      kind: 'finding',
    });
    await mkdir(join(logPath(root), '..'), { recursive: true });
    await writeFile(logPath(root), `${line}\n${line}\n${line}\n`, 'utf8');

    expect(await readLog(root)).toHaveLength(1);
  });

  it('keeps every count when several editors record at the same moment', async () => {
    // The failure a state object read, mutated and renamed into place cannot
    // avoid: two writers both read the old value and the second rename wins,
    // so the first one's increments vanish. The log beside it is append-only
    // for this reason and the state has to be too.
    await Promise.all([
      record(root, [finding({ file: '/repo/apps/orders/src/A.tsx' })], { now: () => 1_000 }),
      record(root, [finding({ file: '/repo/apps/orders/src/B.tsx' })], { now: () => 1_000 }),
      record(root, [finding({ file: '/repo/apps/orders/src/C.tsx' })], { now: () => 1_000 }),
      record(root, [finding({ file: '/repo/apps/orders/src/A.tsx' })], { now: () => 2_000 }),
    ]);

    const seen = await readSeen(root);
    expect(Object.keys(seen)).toHaveLength(3);
    expect(Object.values(seen).reduce((sum, entry) => sum + entry.times, 0)).toBe(4);
    expect(await readLog(root)).toHaveLength(3);
  });

  it('names what is said about many files as a candidate for a rule', async () => {
    // The maintenance signal the log was never used for. Something reported
    // across a dozen files is not twelve accidents; it is a thing the project
    // has an opinion about and has not written down.
    for (const name of ['A.tsx', 'B.tsx', 'C.tsx']) {
      await record(root, [finding({ file: `/repo/apps/orders/src/${name}` })], {
        now: () => 1_000,
      });
    }
    await record(root, [finding({ file: '/repo/apps/orders/src/D.tsx', message: 'once only' })], {
      now: () => 1_000,
    });

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.spread).toHaveLength(1);
    expect(summary.spread[0]!.files).toBe(3);
    expect(summary.spread[0]!.message).toBe(finding().message);
  });

  it('does not call two different findings on one file a repeat', async () => {
    await record(root, [finding(), finding({ line: 40, message: 'something else' })], {
      now: () => 1_000,
    });
    expect(summarise(await readLog(root)).repeated).toEqual([]);
  });

  it('says nothing about an empty log', () => {
    const summary = summarise([]);
    expect(summary.total).toBe(0);
    expect(summary.repeated).toEqual([]);
  });
});

describe('when the log itself misbehaves', () => {
  it('survives a corrupt line rather than losing the rest', async () => {
    await record(root, [finding()], { now: () => 1_000 });
    const { appendFile } = await import('node:fs/promises');
    await appendFile(logPath(root), 'not json at all\n', 'utf8');
    await record(root, [finding({ level: 'import' })], { now: () => 2_000 });

    const entries = await readLog(root);
    expect(entries).toHaveLength(2);
  });

  it('never throws, whatever happens', async () => {
    const brokenClock = (): number => {
      throw new Error('no clock');
    };
    await expect(record(root, [finding()], { now: brokenClock })).resolves.toBeUndefined();
  });
});

describe('the advice, which was never recorded at all', () => {
  it('records that advice was given, and what it said about the screen', async () => {
    // The half most worth logging: a hardcoded colour is obviously right or
    // wrong, but "this page has content above its header" is a judgement, and
    // whether it was relevant can only be decided by a person looking at the
    // file afterwards. It was written before the advisory branch even ran.
    await recordAdvice(
      root,
      '/repo/apps/orders/src/OrderDetail.tsx',
      { kind: 'held by Dialog', layout: 'Dialog > DetailHeader', rules: ['Detail screen archetype'] },
      { now: () => 1_000, rootDir: '/repo' },
    );

    const entries = await readLog(root);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.kind).toBe('advice');
    expect(entries[0]!.file).toBe('apps/orders/src/OrderDetail.tsx');
    expect(entries[0]!.message).toContain('kind: held by Dialog');
    expect(entries[0]!.message).toContain('Detail screen archetype');
  });

  it('counts advice apart from findings', async () => {
    await record(root, [finding()], { now: () => 1_000 });
    await recordAdvice(
      root,
      '/repo/a.tsx',
      { kind: 'held by Page', layout: 'Page > Content', rules: ['List pages'] },
      { now: () => 2_000, rootDir: '/repo' },
    );

    const summary = summarise(await readLog(root));
    expect(summary.total).toBe(1);
    expect(summary.advice).toBe(1);
  });

  it('writes no source code for advice either', async () => {
    await recordAdvice(
      root,
      '/repo/a.tsx',
      { kind: 'held by Page', layout: 'Page', rules: [] },
      { now: () => 1_000, rootDir: '/repo' },
    );
    const entry = JSON.parse((await readFile(logPath(root), 'utf8')).trim()) as Record<string, unknown>;
    expect(Object.keys(entry).sort()).toEqual(['at', 'file', 'kind', 'level', 'line', 'message']);
  });
});

describe('four instances writing at once', () => {
  it('writes each finding on its own, so a big batch cannot interleave', async () => {
    // A single write is atomic only while it stays under the pipe buffer —
    // about 4 KB. A file with forty findings exceeds that, and with several
    // Claude instances editing at once two writes can land inside each other
    // and corrupt both lines. One entry per write is always under it.
    const many = Array.from({ length: 60 }, (_, index) =>
      finding({ line: index + 1, message: `finding number ${index} ${'x'.repeat(80)}` }),
    );
    await record(root, many, { now: () => 1_000 });

    const raw = await readFile(logPath(root), 'utf8');
    const lines = raw.split('\n').filter((line) => line.trim() !== '');
    expect(lines).toHaveLength(60);
    for (const line of lines) expect(() => JSON.parse(line)).not.toThrow();
  });

  it('says which project a handed-over log belongs to', async () => {
    // Four instances means four logs. A file on its own does not say which
    // repository it came from, and its paths are relative by design.
    await record(root, [finding()], { now: () => 1_000, rootDir: '/repo/acme-web' });
    const marker = await readFile(join(logPath(root), '..', 'repo.txt'), 'utf8');
    expect(marker.trim()).toBe('/repo/acme-web');
  });
});

/**
 * The log carries literals out of the file, and that is now written down rather
 * than denied.
 *
 * "No source code, ever" claimed the format guaranteed it. The format
 * guarantees the **keys**; `message` is a sentence a check writes, and a check
 * quotes what it found (#173).
 *
 * This pins the honest version. If somebody later makes the log genuinely free
 * of the project's code it fails — which is the point: the claim and the
 * behaviour cannot drift apart again without something saying so.
 */
describe('what an entry actually carries', () => {
  it('carries the literal the finding quoted, which is why it is not safe to hand on unread', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'uic-log-truth-'));
    const root = join(dir, 'repo');
    await mkdir(root, { recursive: true });

    await record(
      root,
      [
        {
          file: join(root, 'src/App.tsx'),
          line: 1,
          level: 'style',
          message: "color: '#ff0000' is a hardcoded colour, not a design-system token.",
        },
      ],
      { rootDir: root },
    );

    const entry = JSON.parse(
      (await readFile(logPath(root), 'utf8')).trim().split('\n')[0]!,
    ) as Record<string, unknown>;

    expect(String(entry['message'])).toContain('#ff0000');
    expect(Object.keys(entry).sort()).toEqual(['at', 'file', 'kind', 'level', 'line', 'message']);

    await rm(dir, { recursive: true, force: true });
  });
});

/**
 * What an absence of repeats actually means (#221).
 *
 * `uic log` used to read "nothing came back" as "every finding was acted on".
 * Ran over 60 Backstage files, one edit each, it congratulated the reader on a
 * clean sheet — when nothing *could* have come back, because no file had been
 * checked a second time. The absence has two causes and the log picked the
 * flattering one.
 *
 * It can tell them apart, from timestamps it already keeps: a finding whose
 * file produced something *later* was present when the file was checked again
 * and did not reappear. A finding whose file was never checked again is not
 * evidence of anything.
 */
describe('acted on, or never asked again', () => {
  it('does not call a finding acted on when the file was never checked again', async () => {
    await record(root, [finding()], { now: () => 1_000 });

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.repeated).toEqual([]);
    expect(summary.acted).toBe(0);
    expect(summary.unknown).toBe(1);
  });

  it('calls a finding acted on when the file was checked again without it', async () => {
    // Two findings on one file; the second save produces only one of them, so
    // the first was present at a later check and did not come back.
    await record(root, [finding(), finding({ line: 40, message: 'something else' })], {
      now: () => 1_000,
    });
    await record(root, [finding({ line: 40, message: 'something else' })], { now: () => 2_000 });

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.acted).toBe(1);
    expect(summary.unknown).toBe(0);
    expect(summary.repeated.map((one) => one.line)).toEqual([40]);
  });

  it('counts a finding produced twice in the same run as neither', async () => {
    // Same timestamp on both, so nothing was learned between them.
    await record(root, [finding(), finding({ line: 40, message: 'something else' })], {
      now: () => 1_000,
    });

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.acted).toBe(0);
    expect(summary.unknown).toBe(2);
  });

  it('says nothing about an empty log', () => {
    const summary = summarise([]);
    expect(summary.acted).toBe(0);
    expect(summary.unknown).toBe(0);
  });
});

describe('what an absence means with no recurrence state beside the log', () => {
  it('calls nothing acted on, however the log lines are dated', async () => {
    // The log line says when a finding was *first* written down and nothing
    // about since. Read as "last produced" it would call the older of two
    // findings on one file acted on while it is still sitting in the file.
    await record(root, [finding()], { now: () => 1_000 });
    await record(root, [finding({ line: 40, message: 'something else' })], { now: () => 2_000 });

    const summary = summarise(await readLog(root));
    expect(summary.acted).toBe(0);
    expect(summary.unknown).toBe(2);
  });
});

/**
 * One import statement is one thing to do, however many symbols it names (#222).
 *
 * From a real Backstage run: four entries on `plugins/home/src/alpha.tsx:29`,
 * one per symbol, one fix. Measured across that run, 15 findings sat on 10
 * distinct lines. The hook reports per symbol because each symbol resolves
 * separately, which is right for the check; the report is where a person reads
 * it, and there the counts and the list should be over places.
 */
describe('one line, one entry', () => {
  const imported = (symbol: string, over: Partial<Finding> = {}): Finding =>
    finding({
      line: 29,
      level: 'import',
      message: `${symbol} is imported from @backstage/frontend-plugin-api; @backstage/core-plugin-api is nearer.`,
      ...over,
    });

  it('reports four symbols on one import as one entry naming all four', async () => {
    await record(
      root,
      ['createRouteRef', 'identityApiRef', 'storageApiRef', 'errorApiRef'].map((one) =>
        imported(one),
      ),
      { now: () => 1_000 },
    );

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.total).toBe(1);
    expect(summary.byLevel['import']).toBe(1);
    expect(summary.byFile[0]!.count).toBe(1);
  });

  it('names the symbols together, in the order they were found', async () => {
    await record(root, [imported('createRouteRef'), imported('identityApiRef')], {
      now: () => 1_000,
    });
    await record(root, [imported('createRouteRef'), imported('identityApiRef')], {
      now: () => 2_000,
    });

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.repeated).toHaveLength(1);
    expect(summary.repeated[0]!.message).toBe(
      'createRouteRef and identityApiRef are imported from @backstage/frontend-plugin-api; ' +
        '@backstage/core-plugin-api is nearer.',
    );
  });

  it('counts the group as coming back once per edit, not once per symbol', async () => {
    // Four symbols seen on three edits is three occurrences of one thing to do,
    // not twelve.
    for (const at of [1_000, 2_000, 3_000]) {
      await record(
        root,
        ['createRouteRef', 'identityApiRef', 'storageApiRef', 'errorApiRef'].map((one) =>
          imported(one),
        ),
        { now: () => at },
      );
    }

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.repeated).toHaveLength(1);
    expect(summary.repeated[0]!.times).toBe(3);
  });

  it('keeps two different destinations on one line apart', async () => {
    await record(
      root,
      [
        imported('createRouteRef'),
        imported('Button', {
          message: 'Button is imported from @mui/material; @acme/core is nearer.',
        }),
      ],
      { now: () => 1_000 },
    );

    expect(summarise(await readLog(root), await readSeen(root)).total).toBe(2);
  });

  it('does not merge a style finding with an import finding on the same line', async () => {
    await record(root, [imported('createRouteRef'), finding({ line: 29 })], { now: () => 1_000 });
    expect(summarise(await readLog(root), await readSeen(root)).total).toBe(2);
  });

  it('leaves findings that are not about an import alone', async () => {
    await record(root, [finding(), finding({ line: 12, message: 'something else' })], {
      now: () => 1_000,
    });
    expect(summarise(await readLog(root), await readSeen(root)).total).toBe(2);
  });
});

/**
 * The half that could not fire for 93% of what the tool produces (#223).
 *
 * `README.md` calls "said about many different files" the more uncomfortable
 * and more useful half. It never appeared on a real run, structurally: a
 * message spans many files only when it is the *same sentence*, and an import
 * finding names the symbol — so two files importing different symbols from the
 * same wrong package never share one. Measured on Backstage, imports are 658 of
 * 705 findings; the half was silent about all of them by construction.
 *
 * What is interesting about imports is not the same sentence in many files but
 * **the same wrong source** in many files.
 */
describe('the same wrong source in many files', () => {
  const from = (file: string, symbol: string, wrong = '@material-ui/core'): Finding =>
    finding({
      file: `/repo/${file}`,
      line: 1,
      level: 'import',
      message: `${symbol} is imported from ${wrong}; @backstage/ui is nearer.`,
    });

  it('fires on three files reaching for the same package, whatever they took from it', async () => {
    await record(
      root,
      [from('A.tsx', 'Button'), from('B.tsx', 'Card'), from('C.tsx', 'Dialog')],
      { now: () => 1_000, rootDir: '/repo' },
    );

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.spread).toHaveLength(1);
    expect(summary.spread[0]!.files).toBe(3);
    expect(summary.spread[0]!.message).toBe(
      '@material-ui/core is imported where @backstage/ui is nearer.',
    );
  });

  it('keeps two different wrong sources apart', async () => {
    await record(
      root,
      [
        from('A.tsx', 'Button'),
        from('B.tsx', 'Card'),
        from('C.tsx', 'Dialog', '@mui/material'),
        from('D.tsx', 'Chip', '@mui/material'),
      ],
      { now: () => 1_000, rootDir: '/repo' },
    );

    expect(summarise(await readLog(root), await readSeen(root)).spread).toEqual([]);
  });

  it('still groups everything else by the sentence it wrote', async () => {
    for (const name of ['A.tsx', 'B.tsx', 'C.tsx']) {
      await record(root, [finding({ file: `/repo/${name}` })], {
        now: () => 1_000,
        rootDir: '/repo',
      });
    }

    const summary = summarise(await readLog(root), await readSeen(root));
    expect(summary.spread).toHaveLength(1);
    expect(summary.spread[0]!.message).toBe(finding().message);
  });

  it('counts one file once, however many lines reach for the package', async () => {
    await record(
      root,
      [
        from('A.tsx', 'Button'),
        finding({ file: '/repo/A.tsx', line: 2, level: 'import', message: 'Card is imported from @material-ui/core; @backstage/ui is nearer.' }),
      ],
      { now: () => 1_000, rootDir: '/repo' },
    );

    expect(summarise(await readLog(root), await readSeen(root)).spread).toEqual([]);
  });
});

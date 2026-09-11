import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * The two arm prompts, checked mechanically.
 *
 * They are committed for one reason: so that *the arms differ only by the
 * plugin* is checkable rather than asserted. That evidence is worth exactly as
 * much as the files being usable unedited — and it was worth nothing, because
 * both named one application and one kind, so a run on any other machine had to
 * begin by hand-editing the very files whose unedited diff is the evidence
 * (#56).
 *
 * Care did not prevent it and would not prevent it again. This is the same
 * lesson `scripts/first-run.mjs` carries one directory over: the guard fails,
 * rather than a reader being trusted to notice.
 */
const read = (name: string): Promise<string> =>
  readFile(fileURLToPath(new URL(`../../bench/${name}`, import.meta.url)), 'utf8');

/** The seed prompt is everything after the first `---` on its own line. */
const seed = (text: string): string => {
  const at = text.indexOf('\n---\n');
  expect(at).toBeGreaterThan(-1);
  return text.slice(at + 5).trim();
};

/** The substitutions a run performs, and the only ones. */
const SUBSTITUTIONS = ['OUTPUT_DIR', 'TASK_LIST', 'PATTERN_PATH'];

describe('the two benchmark arm prompts', () => {
  it('name no repository, framework or kind', async () => {
    for (const name of ['prompt-off.md', 'prompt-on.md']) {
      const prompt = seed(await read(name));

      // A framework, a vendor or a project's own kind in the seed prompt is a
      // repository committed into the harness. The agent is told to look
      // around; the neighbouring screens say what the application is.
      for (const named of [/\bIonic\b/i, /\bion-page\b/i, /\bMUI\b/, /\bChakra\b/i, /\bAngular\b/i, /\bVue\b/i]) {
        expect(prompt, `${name} names ${named}`).not.toMatch(named);
      }
      // And no pattern path written out, which is the same defect spelled
      // differently: the path must come from the `--pattern` the scorer got.
      expect(prompt, `${name} hardcodes a knowledge path`).not.toMatch(/\.ui-consistency\/patterns\/\S+\.md/);
    }
  });

  it('uses only the substitutions the harness performs', async () => {
    // Any other SHOUTING_TOKEN is a placeholder nothing fills in, which is a
    // prompt that reaches an agent with a literal in it.
    for (const name of ['prompt-off.md', 'prompt-on.md']) {
      const prompt = seed(await read(name));
      const tokens = [...prompt.matchAll(/\b[A-Z][A-Z_]{3,}\b/g)].map((one) => one[0]);
      for (const token of new Set(tokens)) {
        expect(SUBSTITUTIONS, `${name} uses ${token}`).toContain(token);
      }
    }
  });

  it('differ by the pattern and by nothing else', async () => {
    const off = seed(await read('prompt-off.md')).split('\n');
    const on = seed(await read('prompt-on.md')).split('\n');

    // Every line one has and the other does not. The claim is that all of them
    // are about the pattern — so any line here that is not is the arms
    // differing by a second thing, which is what would make a result
    // unattributable.
    const onlyOn = on.filter((line) => line.trim() !== '' && !off.includes(line));
    const onlyOff = off.filter((line) => line.trim() !== '' && !on.includes(line));

    for (const line of onlyOn) {
      expect(line, 'a line the ON arm has that is not about the pattern').toMatch(
        /PATTERN_PATH|pattern|holder|regions|props|strength|count|Build from it|diff --contract|Fix what it reports|run anything else/,
      );
    }
    // The OFF arm's only extra is the sentence the ON arm replaced, so the
    // difference is a substitution and never an addition on this side.
    expect(onlyOff.length).toBeLessThanOrEqual(1);
  });

  /**
   * The subtlest way to get a run wrong, and it was got wrong the first time:
   * the ON arm was told to run the scorer's own command against the scorer's
   * own pattern and fix what it reported, so its score was bounded at zero by
   * construction and measured instruction-following (#57).
   */
  it('does not tell the ON arm to run the scoring command', async () => {
    const on = seed(await read('prompt-on.md'));

    expect(on).not.toContain('diff --contract');
    expect(on).not.toMatch(/\buic\b/);
    // And no per-file gate of any spelling: the arms would then differ by two
    // things, and the second alone drives conformance to zero with no
    // pattern-informed authoring at all.
    expect(on).not.toMatch(/\bfix what it reports\b/i);
    expect(on).not.toMatch(/\bcheck it against the pattern\b/i);
  });

  it('names the contamination in the run procedure, so it is not re-invented', async () => {
    const readme = await read('README.md');
    expect(readme).toContain('must not be told to optimise the score');
    expect(readme).toContain('bounded at zero');
  });

  it('the ON arm reads the same pattern the scorer is given', async () => {
    // Two halves of one run disagreeing about which pattern was under test is
    // unfalsifiable rather than merely wrong, so the path is one value.
    const on = seed(await read('prompt-on.md'));
    expect(on).toContain('PATTERN_PATH');
    expect(on.match(/PATTERN_PATH/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it('is documented as a step a run performs, not left to be inferred', async () => {
    const readme = await read('README.md');
    for (const one of SUBSTITUTIONS) expect(readme).toContain(one);
  });
});

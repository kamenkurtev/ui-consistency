import type { ScreenPattern } from '../sources/pattern.js';
import { quoted } from '../core/quote.js';

/**
 * A derived pattern, rendered as the Markdown a project commits.
 *
 * **This is serialization, not knowledge.** The facts are already derived; the
 * rule that keeps a hand-written list out of `src/` is about programs that
 * decide what *ought* to be true — `takesLength`, `SPACING_KEYS` — and nothing
 * here decides anything. It writes down what the family was measured to do, in
 * the format `parsePattern` already reads, so that the half of a pattern file
 * that is arithmetic comes from the extractor rather than from an agent's
 * recollection of it.
 *
 * **What it deliberately does not write is the prose.** A pattern must state
 * three things no extraction can produce — an alternative a slot allows, a rule
 * no checker can evaluate, and the reason one screen is allowed to differ — and
 * inventing any of them here would put a sentence nobody said into a file
 * somebody is about to approve. They are named as missing instead, which is
 * what a reader can act on.
 */
export function renderPattern(pattern: ScreenPattern, options: RenderOptions): string {
  const { name, observed, files } = options;
  const total = pattern.family.length;

  const out: string[] = [
    '---',
    `pattern: ${safe(name)}`,
    ...(pattern.kind === null ? [] : [`holder: ${safe(pattern.kind)}`]),
    `read: ${total} ${total === 1 ? 'file' : 'files'}`,
    `from: ${pattern.from}`,
    `observed: ${observed}`,
    // The field #28's refresh reads. A sentence in the prose would have to be
    // parsed as English to tell a derived file from an approved one.
    'derived: true',
    '---',
    '',
    `# ${title(safe(name))}`,
    '',
    derivedFrom(pattern, total),
    '',
  ];

  const structure = structureBlock(pattern, total);
  if (structure.length > 0) {
    out.push('## Structure', '', '```', ...structure, '```', '');
  }

  // Said, never omitted. An absent `## Props` is indistinguishable from a kind
  // of screen whose family agrees on no props, and this is the one section with
  // a grammar — the level the mistakes actually live at. Approving a silence as
  // a clean result is the failure the whole tool is organised against (#41).
  if (pattern.propsUnmeasured !== null) {
    const { siblings, needed } = pattern.propsUnmeasured;
    out.push('## Props', '', `**Not measured.** ${whyUnmeasured(siblings, needed)}`, '');
  }

  const props = propsBlock(pattern);
  if (props.length > 0) {
    out.push(
      '## Props',
      '',
      // Otherwise `4 of 4` under `read: 5 files` reads as an arithmetic slip.
      // The reference is left out of its own counts on purpose: with a small
      // family the page being asked about would otherwise settle the majority
      // on whether what it does is what everyone does.
      `_Counted over the ${total - 1} screens beside the reference, which is left out of its own counts._`,
      '',
      ...props,
    );
  }

  if (pattern.avoids.length > 0) {
    out.push(
      '## Avoided elements',
      '',
      `No screen of this kind renders ${list(pattern.avoids.map((one) => `\`<${safe(one)}>\``))}.`,
      // The element is named and the replacement is not: what replaces it is
      // this project's own business, and the structure above already says what
      // the family renders instead.
      '',
    );
  }

  if (pattern.wiring.length > 0) {
    out.push(
      '## Wiring',
      '',
      `Most screens of this kind call ${list(pattern.wiring.map((one) => `\`${safe(one)}()\``))}.`,
      '',
      '_Read from JavaScript only: a screen written as a template contributes nothing here._',
      '',
    );
  }

  const particulars = particularsBlock(pattern, options);
  if (particulars.length > 0) out.push('## Particular to one screen', '', ...particulars, '');

  out.push('## Still to be written', '', ...gaps(pattern), '');

  out.push(
    '## Where it is used',
    '',
    files.map((path) => `\`${safe(path)}\``).join(', '),
    '',
  );

  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

export interface RenderOptions {
  /** The file's own slug, which is also the frontmatter `pattern:`. */
  name: string;
  /** The date the counts were observed, `YYYY-MM-DD`. */
  observed: string;
  /** The family, project-relative, as `## Where it is used` should name them. */
  files: string[];
  /** The reference the family was read around, project-relative. */
  reference: string;
}

/**
 * Where the family came from, in the sentence the agent has to be able to judge.
 *
 * *"derived from the 8 screens registered beside it"* and *"derived from files
 * in its folder"* are not equally trustworthy, and a reader handed the second
 * with the names can call the family nonsense on sight.
 */
function derivedFrom(pattern: ScreenPattern, total: number): string {
  const where = {
    pattern: 'named together by a pattern file',
    routes: "registered beside one another in the project's route table",
    folder: 'found in the folders around the reference, which is a guess about which of them are of a kind',
    holder: 'found in this application sitting in the same holder, which is structural but is not a registration anybody wrote',
  }[pattern.from];

  const built =
    pattern.built === 'markup'
      ? ' These screens are built out of markup and classes rather than layout components, so there is no component to name for most roles.'
      : '';

  return `Derived by \`uic pattern\` from ${total} ${total === 1 ? 'screen' : 'screens'} ${where}.${built} Nothing here has been approved by a person; the counts are evidence as at the date above, and \`uic patterns\` says what has moved since.`;
}

/**
 * The structure block, with the strength said as what it is.
 *
 * The holder and its region order clear a **majority**, not unanimity, so a
 * count like `9 of 9` would be a number nobody measured. `majority of 9` is
 * true, and the reader of the file — and `parseStructure`, which keeps a
 * strength as written and never as arithmetic — takes it as written.
 */
function structureBlock(pattern: ScreenPattern, total: number): string[] {
  if (pattern.skeleton === null) return [];

  const width = 36;
  // `parseStructure` splits a line on **two or more** spaces, so the padding is
  // not cosmetic: a name at or past the column would be run straight into its
  // strength, and the line would read back as one long name with no strength at
  // all. `padEnd` alone cannot guarantee the gap, so the gap is guaranteed.
  const line = (indent: number, name: string, strength: string): string => {
    const written = `${'  '.repeat(indent)}${name}`;
    return `${written.padEnd(width - 2)}  ${strength}`;
  };

  const out = [line(0, safe(pattern.skeleton.holder), `majority of ${total}`)];

  for (const region of pattern.skeleton.regions) {
    const filled = pattern.vocabulary.find((one) => one.role === region);
    out.push(
      filled === undefined
        ? line(1, `<${region}>`, `majority of ${total}`)
        : line(1, safe(filled.component), `majority of ${total}`),
    );
  }

  // The commonest real page shape: no named regions at all, the chrome in the
  // holder's props, and one component inside. Two empty arrays there read as
  // "no convention here" when the convention is simply not expressed that way.
  if (pattern.skeleton.regions.length === 0 && pattern.body !== null) {
    const held =
      pattern.body.component === null
        ? pattern.body.suffix === null
          ? '<body>'
          : `*${safe(pattern.body.suffix)}`
        : safe(pattern.body.component);
    const count = pattern.body.children;
    out.push(line(1, held, `exactly ${count === 1 ? 'one' : count}; ${total} of ${total}`));
  }

  return out;
}

/**
 * `### <component>` and a bullet per prop, which is the one section with a
 * grammar and the reason it has one.
 *
 * Two claims, kept apart: a prop the family writes *at all* and a prop they all
 * give the same *value*. Both carry the count they were measured at, because a
 * strength written as a sentence cannot produce *"5 of the 6 screens of this
 * kind write it"*.
 */
function propsBlock(pattern: ScreenPattern): string[] {
  const out: string[] = [];

  for (const usage of pattern.configuration) {
    const bullets: string[] = [];
    const shapes: string[] = [];
    const valued = new Set(usage.props.map((one) => one.name));

    for (const prop of usage.props) {
      bullets.push(`- \`${safe(prop.name)}\`${stated(prop)} — ${usage.agreedBy} of ${usage.seenIn}`);
    }
    for (const written of usage.written) {
      if (valued.has(written.name)) continue;
      bullets.push(`- \`${safe(written.name)}\` — ${written.writtenBy} of ${usage.seenIn}`);
      // Not on the bullet: everything after the dash is the strength, and a
      // strength is arithmetic only when it is exactly `N of M`. A parenthetical
      // in front of the count is how a measured number becomes a sentence.
      if (written.shape !== null) shapes.push(`\`${safe(written.name)}\` ${article(written.shape)}`);
    }
    // Both, and not just the tokens: a class attribute nobody was observed to
    // write has no spelling to state, and inventing one hands the reader a
    // dialect this project does not use (#42).
    if (usage.classes.length > 0 && usage.classAttribute !== null) {
      bullets.push(
        `- \`${safe(usage.classAttribute)}\` = "${safe(usage.classes.join(' '))}" — ${usage.agreedBy} of ${usage.seenIn}`,
      );
    }

    if (bullets.length === 0) continue;
    out.push(`### \`${safe(usage.component)}\``, '', ...bullets, '');
    if (shapes.length > 0) out.push(`Written as: ${list(shapes)}.`, '');
  }

  return out;
}

/**
 * The value, in the one spelling the reader recognises.
 *
 * `= "compact"`, with the quotes, because the value arrives unquoted — a
 * `StringLiteral`'s own content — and a bullet that states `= compact` is read
 * back as a prop with no stated value at all. A bare prop states no value, and
 * a value with a quote inside it cannot be written in this grammar, so it
 * states presence rather than being written as something read back wrong.
 */
const stated = (prop: { value: string; bare: boolean }): string => {
  const value = safe(prop.value);
  return prop.bare || value.includes('"') ? '' : ` = "${value}"`;
};

/**
 * What the reference has and the family does not — the list of things that must
 * **not** be carried into the next screen.
 */
function particularsBlock(pattern: ScreenPattern, options: RenderOptions): string[] {
  const { roles, components } = pattern.particulars;
  if (roles.length === 0 && components.length === 0) return [];

  const has = [
    ...(roles.length > 0 ? [`a ${list(roles.map((one) => `\`${safe(one)}\``))} region`] : []),
    ...(components.length > 0 ? [list(components.map((one) => `\`${safe(one)}\``))] : []),
  ];
  return [
    `\`${options.reference}\` renders ${list(has)}, which no other screen of this kind does.`,
    '',
    '_Whether that is deliberate is not readable from the code. Say which it is._',
  ];
}

/**
 * The three things a pattern must state that no extraction can produce.
 *
 * Named as missing rather than filled with a guess, and named as missing rather
 * than left out — an absent `## Rules` section is indistinguishable from a kind
 * of screen that has no rules, and one of those is a file that still needs
 * work.
 */
function gaps(pattern: ScreenPattern): string[] {
  const slots = pattern.skeleton?.regions.filter(
    (region) => !pattern.vocabulary.some((one) => one.role === region),
  );

  return [
    'Derived facts only, so far. These are the parts of a pattern that no extraction can produce, and the file is not finished until somebody has answered them:',
    '',
    ...(slots !== undefined && slots.length > 0
      ? [
          `- **Slots.** ${list(slots.map((one) => `\`<${safe(one)}>\``))} ${slots.length === 1 ? 'is' : 'are'} filled by a different component on each screen. Which alternatives are allowed there, and what decides between them?`,
        ]
      : []),
    '- **Rules.** What must a screen of this kind do that no checker can evaluate? *(“Actions are always rendered; permission toggles `disabled` only.”)*',
    '- **Exceptions.** Where a screen above departs from the rest, is that deliberate, and why?',
  ];
}

const title = (name: string): string => {
  const words = name.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Why the props level was not measured, and there are two reasons.
 *
 * The family being too small is the common one and the one #41 is about. But
 * the observer also declines where enough screens were named and too few could
 * actually be read — a file that would not parse, or one rendering nothing —
 * and reporting *"leaves 4 here, and 3 are needed"* for that would be a
 * sentence that contradicts itself in its own numbers.
 */
const whyUnmeasured = (siblings: number, needed: number): string =>
  siblings < needed
    ? `The props of a family are counted over the screens *beside* the reference, which leaves ${siblings} here, and ${needed} are needed — below that a pair is a copy rather than an agreement. This is not a family that writes no props; it is a family too small to tell the two apart. One more screen of this kind, and this section answers.`
    : `Of the ${siblings} screens beside the reference, fewer than ${needed} could be read for what they render, so there was nothing to count. This says nothing about what the family writes.`;

/** `an expression`, `a literal` — the counts are read by people before programs. */
const article = (word: string): string => `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;

/**
 * A value out of somebody's repository, made safe to write into a file an agent
 * reads as authority.
 *
 * The same defect as #171 and in a worse place. There, values were interpolated
 * raw into hook text and a string literal in ordinary application code could
 * fabricate what looked like a second message from the tool. Here the file is
 * *the pattern*: a `title` holding a newline and a `## Rules` heading writes a
 * rule nobody agreed into the document the next screen is built from, and
 * `parsePattern` reads it back as one. Reproduced before it was fixed, from the
 * shipped bundle, on a family of five ordinary screens.
 *
 * `quoted` is the existing answer and does exactly what is needed: invisibles
 * removed, whitespace collapsed to single spaces so nothing can start a new
 * line, and the tool's own prefix broken in any colon that renders as one.
 * Markdown's structural characters are all line-anchored — `#`, `-`, ``` — so
 * a value that cannot contain a newline cannot open a section or a fence.
 *
 * Applied to names as well as values. A component name cannot hold a newline
 * today, but which of these fields is an identifier and which is a string is
 * the extractor's business and not this file's, and one exemption is how the
 * next field added here arrives unquoted.
 */
const safe = (value: string): string => quoted(value);

const list = (items: string[]): string =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]!}`;

/**
 * A derived pattern file, brought up to date without touching what anybody
 * decided.
 *
 * **Only what was counted is regenerated** — the frontmatter's `read:` and
 * `observed:`, and the sections that are arithmetic over the family. Every
 * other section is left exactly as found, and the one that makes this rule
 * narrower than "keep the prose" is `## Still to be written`, which the tool
 * wrote *and* invited a person to answer. `derived: true` cannot tell you
 * whether they answered it, so regenerating it would destroy the work the file
 * itself asked for.
 *
 * The counts in a pattern file are evidence as at a date; the intent in it is
 * not. That is the whole of what this may and may not rewrite.
 *
 * **What it cannot tell**, and does not pretend to: a sentence somebody added
 * *inside* a counted section — an element the avoided list is allowed to render
 * in one place — is arithmetic as far as this is concerned and goes. So the
 * refusal to guess is spent elsewhere: every section it rewrote is named in
 * what it returns, the file is committed, and the diff is read in a pull
 * request. A refresh that silently rewrote a file nobody then looked at would
 * be the same defect as a stale one.
 */
export function refreshPattern(
  raw: string,
  pattern: ScreenPattern,
  options: RenderOptions,
): { text: string; changed: string[] } {
  // Rendered once and read back for the sections to splice in. The alternative
  // is a second copy of every block builder above, which is what
  // `tests/core/duplicates.test.ts` exists to refuse.
  const rendered = renderPattern(pattern, options);
  const fresh = sectionsOf(rendered);
  const changed: string[] = [];

  let text = raw;
  for (const heading of COUNTED) {
    const replacement = fresh.get(heading)?.map((one) => one.trim()).join('\n\n') ?? null;
    const existing = sectionsOf(text).get(heading) ?? [];

    if (replacement === null) {
      // The fresh derivation has nothing to say here. Leaving what is there
      // would present an old count as a current one, so it goes.
      if (existing.length === 0) continue;
      for (const one of existing) text = text.replace(one, '');
      changed.push(`${heading} — nothing to state now`);
      continue;
    }
    if (existing.length === 0) {
      // A section the file never had. Appended rather than guessed at a place:
      // order is the author's business, and this is the end of what was counted.
      text = `${text.trimEnd()}\n\n${replacement}\n`;
      changed.push(`${heading} — added`);
      continue;
    }
    // A duplicate heading — two `## Props`, which a hand-edit can leave behind
    // — collapses into the first, so a stale copy cannot survive below a fresh
    // one where a reader would take either for the answer.
    if (existing.length === 1 && existing[0]!.trim() === replacement) continue;
    text = swap(text, existing[0]!, `${replacement}\n\n`);
    for (const one of existing.slice(1)) text = text.replace(one, '');
    changed.push(heading);
  }

  const was = frontLine(raw, 'observed');
  const rewritten = FRONT.reduce((carry, key) => {
    const value = frontLine(rendered, key);
    return value === null ? carry : setFrontLine(carry, key, value);
  }, text);
  if (rewritten !== text) changed.push(`frontmatter${was === null ? '' : ` (observed ${was})`}`);

  return { text: `${rewritten.replace(/\n{3,}/g, '\n\n').trimEnd()}\n`, changed };
}

/**
 * The sections a refresh may rewrite: every one that is arithmetic over the
 * family. `## Still to be written` is not here, and neither is any section a
 * person added — a `## Rules` the extractor never writes survives untouched
 * because nothing on this list names it.
 */
const COUNTED = [
  'Structure',
  'Props',
  'Avoided elements',
  'Wiring',
  'Particular to one screen',
  'Where it is used',
];

/** The frontmatter keys a refresh may rewrite. `pattern:` is the file's name. */
const FRONT = ['holder', 'read', 'from', 'observed'];

/** Each `## ` section of a document, by title, with the text each one spans. */
function sectionsOf(raw: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const heading = /^## +(.+?) *$/gm;
  const starts: { title: string; at: number }[] = [];
  for (let hit = heading.exec(raw); hit !== null; hit = heading.exec(raw)) {
    starts.push({ title: hit[1]!, at: hit.index });
  }
  for (const [at, one] of starts.entries()) {
    const whole = raw.slice(one.at, starts[at + 1]?.at ?? raw.length);
    found.set(one.title, [...(found.get(one.title) ?? []), whole]);
  }
  return found;
}

/**
 * One exact substring for another, with nothing in the replacement read as a
 * reference to the match.
 *
 * `String.replace` with a string replacement interprets `$&`, `$'`, `$\`` and
 * `$1` in it, and a prop value is application data — a currency format, a
 * template placeholder. A pattern whose props carry a `$` would have the match
 * spliced into its own replacement, silently, in the file the project commits.
 * A function replacement is the documented way to switch that off.
 */
const swap = (text: string, from: string, to: string): string => text.replace(from, () => to);

const frontLine = (raw: string, key: string): string | null =>
  new RegExp(`^${key} *: *(.*)$`, 'm').exec(raw.split(/^---$/m)[1] ?? '')?.[1]?.trim() ?? null;

/** Set one frontmatter line, or add it where the block has none. */
function setFrontLine(raw: string, key: string, value: string): string {
  const match = /^(---\n)([\s\S]*?)(\n---\n)/.exec(raw);
  if (match === null) return raw;
  const line = new RegExp(`^${key} *:.*$`, 'm');
  const block = line.test(match[2]!)
    ? match[2]!.replace(line, () => `${key}: ${value}`)
    : `${match[2]!}\n${key}: ${value}`;
  return `${match[1]!}${block}${match[3]!}${raw.slice(match[0].length)}`;
}

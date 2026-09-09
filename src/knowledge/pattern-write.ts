import type { ScreenPattern } from '../sources/pattern.js';

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
    `pattern: ${name}`,
    ...(pattern.kind === null ? [] : [`holder: ${pattern.kind}`]),
    `read: ${total} ${total === 1 ? 'file' : 'files'}`,
    `from: ${pattern.from}`,
    `observed: ${observed}`,
    // The field #28's refresh reads. A sentence in the prose would have to be
    // parsed as English to tell a derived file from an approved one.
    'derived: true',
    '---',
    '',
    `# ${title(name)}`,
    '',
    derivedFrom(pattern, total),
    '',
  ];

  const structure = structureBlock(pattern, total);
  if (structure.length > 0) {
    out.push('## Structure', '', '```', ...structure, '```', '');
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
      `No screen of this kind renders ${list(pattern.avoids.map((one) => `\`<${one}>\``))}.`,
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
      `Most screens of this kind call ${list(pattern.wiring.map((one) => `\`${one}()\``))}.`,
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
    files.map((path) => `\`${path}\``).join(', '),
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
  const line = (indent: number, name: string, strength: string): string =>
    `${'  '.repeat(indent)}${name}`.padEnd(width) + strength;

  const out = [line(0, pattern.skeleton.holder, `majority of ${total}`)];

  for (const region of pattern.skeleton.regions) {
    const filled = pattern.vocabulary.find((one) => one.role === region);
    out.push(
      filled === undefined
        ? line(1, `<${region}>`, `majority of ${total}`)
        : line(1, filled.component, `majority of ${total}`),
    );
  }

  // The commonest real page shape: no named regions at all, the chrome in the
  // holder's props, and one component inside. Two empty arrays there read as
  // "no convention here" when the convention is simply not expressed that way.
  if (pattern.skeleton.regions.length === 0 && pattern.body !== null) {
    const held =
      pattern.body.component ?? (pattern.body.suffix === null ? '<body>' : `*${pattern.body.suffix}`);
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
      bullets.push(`- \`${prop.name}\`${stated(prop)} — ${usage.agreedBy} of ${usage.seenIn}`);
    }
    for (const written of usage.written) {
      if (valued.has(written.name)) continue;
      bullets.push(`- \`${written.name}\` — ${written.writtenBy} of ${usage.seenIn}`);
      // Not on the bullet: everything after the dash is the strength, and a
      // strength is arithmetic only when it is exactly `N of M`. A parenthetical
      // in front of the count is how a measured number becomes a sentence.
      if (written.shape !== null) shapes.push(`\`${written.name}\` ${article(written.shape)}`);
    }
    if (usage.classes.length > 0) {
      bullets.push(
        `- \`${usage.classAttribute}\` = "${usage.classes.join(' ')}" — ${usage.agreedBy} of ${usage.seenIn}`,
      );
    }

    if (bullets.length === 0) continue;
    out.push(`### \`${usage.component}\``, '', ...bullets, '');
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
const stated = (prop: { value: string; bare: boolean }): string =>
  prop.bare || prop.value.includes('"') ? '' : ` = "${prop.value}"`;

/**
 * What the reference has and the family does not — the list of things that must
 * **not** be carried into the next screen.
 */
function particularsBlock(pattern: ScreenPattern, options: RenderOptions): string[] {
  const { roles, components } = pattern.particulars;
  if (roles.length === 0 && components.length === 0) return [];

  const has = [
    ...(roles.length > 0 ? [`a ${list(roles.map((one) => `\`${one}\``))} region`] : []),
    ...(components.length > 0 ? [list(components.map((one) => `\`${one}\``))] : []),
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
          `- **Slots.** ${list(slots.map((one) => `\`<${one}>\``))} ${slots.length === 1 ? 'is' : 'are'} filled by a different component on each screen. Which alternatives are allowed there, and what decides between them?`,
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

/** `an expression`, `a literal` — the counts are read by people before programs. */
const article = (word: string): string => `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;

const list = (items: string[]): string =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]!}`;

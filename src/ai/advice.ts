import { retrieve } from '../knowledge/retrieve.js';
import { MAX_RAW, shapeOf, rawMarkupOf } from '../sources/extract.js';
import { templateKind } from '../parse/template.js';
import type { ComponentUsage, ValueShape } from '../sources/usage.js';

/**
 * How a value is written, in words. Syntax and never meaning — the point is
 * that a raw string where every sibling writes a call is visible without
 * knowing what the call is called.
 */
const SHAPE: Record<ValueShape, string> = {
  literal: 'a literal',
  call: 'a call',
  expression: 'an expression',
};
import type { Knowledge } from '../types.js';
import { quoted } from '../core/quote.js';

/**
 * What a `PostToolUse` hook may return in one value.
 *
 * Documented cap, and not a polite one: a longer value is not truncated, it is
 * simply not delivered. Everything here is budgeted against it.
 */
export const MAX_ADVICE = 10_000;

export interface AdviceInput {
  filePath: string;
  source: string;
  knowledge: Knowledge;
  /** What the files beside this one look like, when they agree. */
  neighbours?: { holder?: string; components: string[] };
  /** How those files write the components they share. */
  usage?: ComponentUsage[];
  /**
   * Where the screen's markup lives, when it is not in `source`.
   *
   * An Angular screen is a pair: the class carries the identity and the imports,
   * the template carries the markup. Reading the class as the whole screen found
   * no structure at all, so the advisory fell out at the raw-markup gate and
   * every Angular screen was told nothing (#229).
   */
  markup?: { path: string; source: string };
}

/** How much of the budget the rules may take, leaving room for the framing. */
const RULES_BUDGET = 6_000;

/**
 * What kind of screen this is: what holds it.
 *
 * Never a name off a list. `Table|DataGrid|DataTable|List|VirtualList` and two
 * lists like it decided this until #226, and on two real repositories they said
 * *"not readable from the code"* about nearly everything — which reads as *this
 * screen is unusual* rather than *this tool does not know your names*.
 */
function describe(holder: string | null | undefined): string | null {
  return holder == null || holder === '' ? null : `held by ${holder}`;
}

/**
 * The evidence a fuzzy review needs, assembled for the agent that is already
 * in the room.
 *
 * This is the answer to the question the v2 spec left open — whether the
 * fuzzy half runs through the harness or a direct API call. It runs through
 * the harness: a hook cannot call a model without credentials the user has
 * not configured, and a free plugin must not require them. So the hook does
 * not judge. It hands Claude the project's own rules, what this file
 * structurally is, and what its neighbours are, and asks for a judgement.
 *
 * Everything it passes is deterministic. The only fuzzy step happens in a
 * model that was going to read the file anyway, at no extra cost and with no
 * key.
 *
 * Null whenever there is nothing to say — no curated rules that bear on this
 * file *and* nothing observed about the screens beside it. The tool never
 * invents a standard, but an observation about the neighbours is not one: it
 * needs no configuration, which is why it is offered on a project that has
 * written nothing down yet. That was previously the silent case, and it is
 * every project on its first day.
 */
export function buildAdvice(input: AdviceInput): string | null {
  // Retrieval reads both halves of a pair: the components are in the template
  // and the imports are in the class, and a rule can be about either.
  const text =
    input.markup === undefined ? input.source : `${input.source}\n${input.markup.source}`;
  const fragments =
    input.knowledge.fragments.length === 0
      ? []
      : retrieve(text, input.knowledge, { filePath: input.filePath });

  const usage = input.usage ?? [];
  // The neighbour cross-section counts as something to say. A page directory
  // whose screens all render `Breadcrumbs` but agree on no props has no usage
  // to report, and excluding it here kept the commonest case of all silent:
  // "every other page has a breadcrumb trail and this one does not".
  if (fragments.length === 0 && usage.length === 0 && input.neighbours === undefined) return null;

  // The markup, wherever it lives. For every single-file dialect this is the
  // file itself.
  const structural = input.markup ?? { path: input.filePath, source: input.source };
  const dialect = templateKind(structural.path);
  // Read in the dialect it is written in, so a template screen gets the opening
  // chain and not only its holder — `- layout: mat-card` where JSX got
  // `- layout: PageLayout > OrdersGrid` (#251).
  const shape = shapeOf(structural.source, dialect ?? undefined);
  const holder = shape?.holder ?? null;

  // A screen with no components in it at all. `shapeOf` cannot describe it —
  // a screen's vocabulary is its components — and until now the whole advisory
  // was discarded because of that, which left the one file most likely to have
  // been generated without the design system as the only file guaranteed to be
  // told nothing. It is exactly the shape of the real cases on record: a detail
  // screen built as a Dialog, a raw grid instead of the shared one.
  //
  // The kind has to be passed for that widening to have reached templates at
  // all. `shapeOf` is JSX-only, so on an Angular, Vue or Svelte screen it is
  // always null — and the advisory then hung on a `rawMarkupOf` that could not
  // read the file either, so every one of them fell out at the `raw === null`
  // gate below. The files most likely to be raw markup were the files it was
  // silent about (#149).
  //
  // The cap is taken here, not inside `rawMarkupOf`. This is the caller that
  // describes a screen to a reader and must not dump it; the contract check
  // reads the same list to decide whether a forbidden element is present, and
  // a truncated list there reports a match that is not one (#155).
  // Only where *nothing* structural was read. `shapeOf` is JSX-only, so a
  // template screen has no shape however many components it renders — and
  // saying "renders no components at all" about a screen whose holder was just
  // named is the confusion this whole file exists to avoid.
  const raw =
    shape === null && holder === null
      ? (rawMarkupOf(structural.source, dialect ?? undefined)?.slice(0, MAX_RAW) ?? null)
      : null;

  // Two gates, and both are needed. The file must render *something* — a hook
  // or a constants module is not a screen that got it wrong — and the screens
  // beside it must actually agree about something, because with no rules and
  // no neighbour agreement there is nothing to compare raw markup against and
  // the advice would be an opinion the tool does not have.
  if (shape === null && holder === null) {
    if (raw === null) return null;
    if (input.neighbours === undefined && usage.length === 0) return null;
  }

  // What the reader is pointed at has to be there. On a fresh install there are
  // no rules — which is the whole case this was widened to cover — and telling
  // the agent to read a section that was never emitted is how advice starts
  // reading like boilerplate.
  const lines: string[] = [
    'ui-consistency: an advisory check on the screen just edited. This is not a',
    'finding and nothing here failed — the deterministic checks passed. Read what',
    fragments.length === 0
      ? 'is below against what the file actually is, and say so only'
      : "the project has written down below against what the file actually is, and say so only",
    'if something genuinely does not fit.',
    '',
    "Do not treat any of this as a rule to enforce, and do not rewrite working code",
    'to satisfy it. If it fits, say nothing.',
    '',
    `# What this file is (read from its code)`,
    // Absent rather than "unknown": an empty answer that reads as a judgement
    // about the screen is worse than no line at all.
    ...(describe(holder) === null ? [] : [`- kind of screen: ${describe(holder)!}`]),
    `- layout: ${shape?.pattern.join(' > ') || (holder ?? 'nothing structural found')}`,
  ];

  if (raw !== null) {
    lines.push(
      `- renders no components at all — only raw markup: ${raw.join(', ') || 'none named'}`,
      '  Worth a look against the list below: a screen built out of plain elements',
      '  is usually one written without the design system rather than a decision.',
    );
  }

  if (input.neighbours !== undefined) {
    const kind = describe(input.neighbours.holder);
    lines.push('', '# What the screens beside it look like (a heuristic, not a rule)');
    if (kind !== null) lines.push(`- kind of screen: ${kind}`);
    if (input.neighbours.components.length > 0) {
      lines.push(`- commonly used: ${input.neighbours.components.slice(0, 12).join(', ')}`);
    }
  }

  if (usage.length > 0) {
    lines.push(
      '',
      '# How the screens beside it write those components (observed, not a rule)',
      'Only where the sibling screens agree. If this file writes one of these',
      'differently on purpose, that is fine — say nothing.',
    );
    for (const one of usage) {
      const written = [
        // `scrollable`, not `scrollable="true"` — the second is not how anyone
        // writes it, and advice written in a dialect nobody uses reads as a
        // machine's guess rather than as what the file next door says. Only
        // where it was written bare, though: `aria-expanded="true"` is a string
        // and rendering it bare suggests writing it a way nobody there does.
        ...one.props.map((prop) => (prop.bare ? prop.name : `${prop.name}="${quoted(prop.value)}"`)),
        // `className` in JSX, `class` in a template, as the siblings wrote it.
        // Hard-coding `class` handed every React project an observation in a
        // dialect nobody there uses — and invalid JSX to copy.
        ...(one.classes.length > 0
          ? [`${one.classAttribute}="${quoted(one.classes.join(' '))}"`]
          : []),
      ].join(' ');
      // Two numbers when they differ, because one number for the whole
      // cross-section overstates whichever half is the weaker.
      const support =
        one.agreedBy === one.seenIn
          ? `on ${one.seenIn} of the screens beside it`
          : `used on ${one.seenIn} of the screens beside it, written this way on ${one.agreedBy}`;
      // No stray space where the component has no agreed props: `<PageLayout >`
      // is a dialect nobody writes, and this is text an agent copies from.
      const opening = written === '' ? one.component : `${one.component} ${written}`;
      lines.push(`- \`<${opening}>\` — ${support}`);
      // A prop every screen writes states something even where each screen
      // chooses its own value, and it used to be dropped along with the value
      // (#227). Omitting it is a deviation from the whole family; the value is
      // that screen's own business.
      if (one.written.length > 0) {
        // With the count, because a prop 7 of 8 screens write is a different
        // claim from one all 8 write, and both are worth saying (#257).
        const named = one.written
          .map((prop) => {
            const how = prop.shape === null ? '' : ` (${SHAPE[prop.shape]})`;
            const many = prop.writtenBy >= one.seenIn ? '' : ` — on ${prop.writtenBy} of them`;
            return `${prop.name}${how}${many}`;
          })
          .join(', ');
        lines.push(`  screens of this kind also write: ${named}`);
      }
    }
  }

  if (fragments.length > 0) {
    lines.push('', "# The project's own rules that bear on this file");
    let spent = 0;
    for (const fragment of fragments) {
      const block = `\n## ${fragment.subject}\n${fragment.body}`;
      if (spent + block.length > RULES_BUDGET) break;
      spent += block.length;
      lines.push(block);
    }
  }

  const advice = lines.join('\n');
  // Belt and braces: whatever the pieces added up to, what leaves here fits.
  return advice.length > MAX_ADVICE ? advice.slice(0, MAX_ADVICE) : advice;
}

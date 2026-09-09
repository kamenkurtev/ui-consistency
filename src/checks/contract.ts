import { basename } from 'node:path';
import { compareOrder, regionsOf } from '../sources/regions.js';
import { isScreenFile } from '../sources/siblings.js';
import { templateKind } from '../parse/template.js';
import { writtenIn, type ValueShape } from '../sources/usage.js';
import { rawMarkupOf } from '../sources/extract.js';
import type { ScreenPattern } from '../sources/pattern.js';
import { quoted } from '../core/quote.js';

/** How a value is written, in words. Syntax, never meaning. */
const SHAPE: Record<ValueShape, string> = {
  literal: 'a literal',
  call: 'a call',
  expression: 'an expression',
};

/** One way a screen departs from what was agreed for its kind. */
export interface Deviation {
  file: string;
  message: string;
}

/** The holder a contract is the contract *of*. */
const holderOf = (contract: ScreenPattern): string | null =>
  contract.skeleton?.holder ?? contract.kind;

/**
 * Which of several approved contracts describes this screen.
 *
 * A project with contracts for two kinds used to report a screen against both.
 * The guard meant to stop that only fired when some contract matched the screen
 * *exactly*, so a detail screen with one real deviation from the detail contract
 * also collected every message from the list contract — the code failed in
 * precisely the case its own comment named, and a second contract made the hook
 * worse than one (#152).
 *
 * The kind is the holder. That is not a new rule invented here: it is how
 * `uic pattern` decides what a family is in the first place, because screens of
 * one kind are the ones that sit in the same holder.
 *
 * ~~With one contract nothing is ambiguous and nothing changes — a screen in
 * the wrong holder is a finding that contract should make.~~
 *
 * **Withdrawn (#3), and it was the commonest state a project is ever in.** One
 * saved contract is what every project has on the day it first follows
 * `skills/pattern`, whose step 2 is `uic pattern <reference> --save`. From that
 * moment the shortcut handed every dialog, panel, tile and card in the
 * repository to the page contract — and handed it the *approved* wording,
 * "has left the contract for its kind… fix them in this turn", which is the one
 * place derived material is allowed to become an imperative. Seen in real work:
 * a dialog nested four directories under a page's form field, told it should be
 * a page. Deriving the pattern for that same file answers correctly, so how
 * many contracts exist was never what made a screen measurable against one —
 * its holder was.
 *
 * A screen whose holder matches no contract is a kind nobody has agreed one
 * for, whether there is one contract or ten, and the honest answer is nothing
 * rather than the nearest guess.
 */
export function contractsForScreen(
  contracts: ScreenPattern[],
  holder: string | null,
): ScreenPattern[] {
  if (holder === null) return [];
  return contracts.filter((contract) => holderOf(contract) === holder);
}

/**
 * Where one screen departs from the contract agreed for its kind.
 *
 * The comparison a person makes today by opening the pages side by side. It
 * measures against something somebody approved, never against something derived
 * behind their back — a contract nobody accepted states nothing, and this
 * returns nothing for it.
 *
 * Absence is not a deviation. A contract says how a component is written where
 * it appears, not that every screen must render it: a detail page without a
 * grid is a detail page, not a mistake.
 *
 * **Null means the file was not measured at all** — a test, a story, something
 * that is not a screen. An empty list means it was measured and matched. The
 * caller has to be able to tell those apart, because counting the first as the
 * second is how a whole application gets a green result while nothing was
 * looked at (#110).
 */
export function contractDeviations(
  file: string,
  source: string,
  contract: ScreenPattern,
): Deviation[] | null {
  // A test renders whatever it needs in order to assert something, and a story
  // shows a component in isolation. Neither is a screen, and holding them to a
  // page contract is noise: measured against a real app, eight of the nine
  // files reported were `.test.tsx`.
  if (!isScreenFile(basename(file))) return null;

  const page = regionsOf(source, templateKind(file) ?? undefined);

  const found: Deviation[] = [];
  const say = (message: string): void => {
    found.push({ file, message });
  };

  const skeleton = contract.skeleton;
  if (skeleton !== null && page !== null) {
    if (page.holder !== skeleton.holder) {
      say(`sits in <${page.holder}>; screens of this kind use <${skeleton.holder}>`);
    }

    const compared = compareOrder(
      page.order.map((one) => one.region),
      skeleton.regions,
    );
    for (const role of compared.missing) {
      say(`has no ${role}; every screen of this kind has one`);
    }
    if (!compared.inOrder) {
      say(`holds ${compared.actual.join(', ')}; this kind holds ${compared.expected.join(', ')}`);
    }
  }

  if (page !== null) {
    for (const { role, component } of contract.vocabulary) {
      const filling = page.order.filter((one) => one.region === role);
      // Any of them: with a conditional the reader sees both branches, and
      // taking the first made the verdict depend on which branch was written
      // first — the same page passed or failed depending on the order of a
      // ternary.
      if (filling.length === 0 || filling.some((one) => one.component === component)) continue;
      const names = [...new Set(filling.map((one) => `<${one.component}>`))].join(' or ');
      say(`fills ${role} with ${names}; this kind uses <${component}>`);
    }
  }

  // Raw elements the screens of this kind do not render. The element is named
  // from the HTML specification and the replacement is not named at all — the
  // contract's own vocabulary already says what this project renders instead,
  // and a built-in list of component names is what made the old check silent on
  // every project that names things differently.
  const avoids = contract.avoids ?? [];
  if (avoids.length > 0) {
    const raw = rawMarkupOf(source, templateKind(file) ?? undefined) ?? [];
    for (const element of avoids) {
      if (!raw.includes(element)) continue;
      say(`renders a raw <${element}>; no screen of this kind does`);
    }
  }

  // Only when there is something to compare: reading how every component is
  // written costs a second parse of the file, and a contract with no stated
  // configuration is an ordinary shape.
  const written = contract.configuration.length === 0 ? [] : writtenIn(file, source);

  for (const configured of contract.configuration) {
    const uses = written.filter((one) => one.component === configured.component);
    if (uses.length === 0) continue;

    // How much of the family actually writes it. The contract carries both
    // numbers precisely so this is not overstated: told "every screen writes
    // this", a reader opens two files, finds it false, and stops reading the
    // rest of the report.
    const support =
      configured.agreedBy >= configured.seenIn
        ? 'which every screen of this kind writes'
        : `which ${configured.agreedBy} of the ${configured.seenIn} screens of this kind write`;

    // Absence *is* a deviation here, and that does not contradict the rule two
    // screens up. A screen that renders no grid is a screen without a grid; a
    // screen that renders `PageLayout` while every sibling's `PageLayout`
    // carries `dataTestId` has written that component incompletely, and the
    // subject of the finding is the component, not the screen (#227).
    for (const always of configured.written ?? []) {
      // The strength is part of the claim (#257). "7 of the 8 screens of this
      // kind write it" is exactly as strong as the evidence, and the reader —
      // agent or person — does the judging. Stating it as "every screen" when
      // one does not is how a reader opens two files, finds it false, and stops
      // reading the rest of the report.
      const strength =
        always.writtenBy >= configured.seenIn
          ? 'which every screen of this kind writes'
          : `which ${always.writtenBy} of the ${configured.seenIn} screens of this kind write`;

      const values = uses.map((use) => use.attributes.get(always.name));
      if (values.every((value) => value === undefined)) {
        say(`writes <${configured.component}> without ${always.name}, ${strength}`);
        continue;
      }
      if (always.shape === null) continue;
      const differs = values.find((value) => value !== undefined && value.shape !== always.shape);
      if (differs === undefined) continue;
      say(
        `writes ${always.name} as ${SHAPE[differs.shape]} on <${configured.component}>, ` +
          `where ${always.writtenBy >= configured.seenIn ? 'every screen of this kind writes' : `${always.writtenBy} of the ${configured.seenIn} write it as`} ${SHAPE[always.shape]}`,
      );
    }

    for (const prop of configured.props) {
      // `undefined` — not written at all. `null` — written as an expression,
      // which is a value this cannot read rather than a wrong one, and used to
      // be indistinguishable from not writing it at all (#227).
      const stated = uses.map((use) => use.attributes.get(prop.name)?.value);
      if (stated.every((value) => value === prop.value)) continue;
      if (stated.some((value) => value === null)) continue;

      const how = prop.bare ? prop.name : `${prop.name}="${quoted(prop.value)}"`;
      const other = stated.filter(
        (value): value is string => typeof value === 'string' && value !== prop.value,
      )[0];
      say(
        other === undefined
          ? `writes <${configured.component}> without ${how}, ${support}`
          : `writes <${configured.component} ${prop.name}="${quoted(other)}">, where this kind writes ${how} — ${support}`,
      );
    }
  }

  return found;
}

/**
 * Is this parsed JSON a contract at all?
 *
 * JSON that parses but states nothing used to get past the friendly error and
 * throw a `TypeError` at the first field access, so the user saw a stack trace
 * instead of the message written two lines above it.
 */
export function isContract(value: unknown): value is ScreenPattern {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Partial<ScreenPattern>;
  return (
    Array.isArray(candidate.vocabulary) &&
    Array.isArray(candidate.configuration) &&
    candidate.skeleton !== undefined
  );
}

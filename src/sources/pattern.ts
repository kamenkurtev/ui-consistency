import { readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { findProjectRoot } from '../layers/detect.js';
import { regionsOf, type PageRegions, type Region } from './regions.js';
import { rawMarkupOf, shapeOf } from './extract.js';
import { parseModule, walk } from '../parse/parse.js';
import { isTemplateComponent, parseTemplate, templateKind, type TemplateNode } from '../parse/template.js';
import { trailingWord } from './names.js';
import { patternFiles } from '../knowledge/pattern-file.js';

import {
  MAJORITY,
  MAX_FAMILY,
  QUORUM,
  isScreenFile,
  siblingScreens,
  holderSiblings,
  type Family,
} from './siblings.js';
import { observeUsage, type ComponentUsage } from './usage.js';
import { markupOf, pairOf } from './pair.js';
import { chromeOf, governingLayout, type Chrome } from './layouts.js';

/** The shape a family of screens shares, at the levels it can be read on. */
export interface ScreenPattern {
  /** The holder and the roles it holds, in the order the family agrees on. */
  skeleton: { holder: string; regions: Region[] } | null;
  /**
   * Which component fills each role, where the family agrees.
   *
   * A role every screen fills differently is left out rather than settled by
   * plurality: four screens with four different headers state no convention
   * about headers, and reporting the commonest would enforce whichever happened
   * to be written first.
   */
  vocabulary: { role: Region; component: string }[];
  /**
   * How the family configures the components it shares.
   *
   * **Not the same question as `vocabulary`, and the difference catches people.**
   * `vocabulary` answers *what fills a region* — header, content, footer — so a
   * component that fills no named region is not in it however often it appears.
   * This answers *how a component is written*, for every component the family
   * shares, region or not.
   *
   * A screen made of fourteen `<Card>`s inside a plain `<div>` therefore has one
   * entry in `vocabulary` and its `Card` here. Reading only the first and
   * concluding the contract had missed the screen is a mistake somebody has
   * already made (#206).
   *
   * The level the mistakes actually live at. A `<Button>` with the right name
   * and no props is the commonest failure there is — the component is correct
   * and the usage is not.
   */
  configuration: ComponentUsage[];
  /**
   * Why the props level says nothing, where it says nothing.
   *
   * `null` means it was measured, whatever it found. Otherwise it was **not
   * measured**, and this says how many sibling screens there were and how many
   * it takes — so a reader can see that one more screen of the kind would
   * answer, rather than reading an empty list as *this family agrees on no
   * props* (#41).
   *
   * The two guards that meet here are each right on their own. The reference is
   * left out of its own counts, so a family of three is measured over two; and
   * two files agreeing is a copy rather than an agreement, so two is refused.
   * The props level therefore needs four screens where the pattern needs three,
   * and nothing said so — on the smallest family that answers at all, `## Props`
   * was simply absent. Neither number moved: what was missing was the sentence.
   */
  propsUnmeasured: { siblings: number; needed: number } | null;
  /**
   * What the reference page has and the family does not.
   *
   * The list of things that must **not** be carried into the next screen. A
   * reference is an example, not a specification: its shape holds the pattern
   * and its own particulars together, and copying it wholesale is exactly what
   * produces a page that is almost right.
   *
   * Measured against the *other* screens, never against a set that includes the
   * reference — otherwise a page votes on whether what it does is what everyone
   * does, and with three screens its own vote carries the majority.
   */
  particulars: { roles: Region[]; components: string[] };
  /**
   * The hooks most of the family calls.
   *
   * The thinnest of the four levels, and the only one bound to a dialect: it is
   * read from JavaScript, so a screen written as a template — `.vue`, `.html`,
   * `.svelte` — contributes nothing here, whatever its `<script>` block calls.
   * Empty is therefore "not read", not "nothing recurs".
   */
  wiring: string[];
  /**
   * The chrome the family sits inside, when a layout file provides it.
   *
   * Every router-based framework separates them: the page file holds the body,
   * and the header, navigation and footer are one level up in `layout.tsx`,
   * `+layout.svelte` or the shell an Angular router renders into. Reading the
   * page alone sees a body and reports no regions — on four public
   * repositories that was the commonest reason the skeleton came back empty.
   *
   * Reported apart from `skeleton` rather than merged into it, because it is a
   * different claim: the chrome is inherited from a shared file, so a screen
   * cannot get it wrong. It is there to be *read* before writing a screen —
   * "your page renders inside this nav; do not add another".
   */
  chrome: Chrome | null;
  /** The screens this was read from — nobody can approve what they cannot check. */
  family: string[];
  /**
   * The plain HTML elements no screen of this kind renders.
   *
   * `<button>` is universal — it is in the specification. What replaces it is
   * this project's own business, and a built-in list of names for it (`Button`,
   * `TextField`, `MenuItem`) is what made the checks silent on every project
   * that names things differently. So the element is named and the replacement
   * is not: the vocabulary above already says what this family renders instead.
   */
  avoids: string[];
  /**
   * What this project builds its screens out of.
   *
   * `markup` means the screens are `div`s and classes, with no layout component
   * to name for any role — measured on the Angular and Vue RealWorld apps and
   * on `vue-element-admin`, where the honest answer is that the vocabulary and
   * skeleton levels have nothing to offer, not that the screens agree on
   * nothing. An empty answer that means "your project is outside what I read"
   * must never look like an empty answer that means "nothing was found".
   */
  built: 'components' | 'markup';
  /**
   * What the family was narrowed by, when it was.
   *
   * Not read from a list of component names any more — that reading came back
   * `unknown` on every real repository tested. Screens of one kind are the ones
   * that sit in the same holder, which is structural and needs no vocabulary.
   */
  kind: string | null;
  /**
   * Where this kind of screen keeps its chrome.
   *
   * `'components'` — in sibling region components inside the holder, which is
   * what `skeleton.regions` and `vocabulary` describe.
   *
   * `'holder'` — in the holder's own props: a `title`, a `breadcrumbs`. This is
   * the commonest real page shape, and it leaves both of those arrays
   * structurally empty — on a real React monorepo and a real Angular one alike.
   * Reported as two blanks it reads as *no convention here*, when the truth is
   * *this project does not express conventions the way that field expects*
   * (#228). What holds the convention instead is `configuration` on the holder
   * (#227) and `body` below.
   *
   * `null` — no holder was agreed, so there is nothing to say either way.
   */
  regionsIn: 'components' | 'holder' | null;
  /**
   * What the holder holds, where the family agrees.
   *
   * `children` — how many components each screen puts inside its holder, where
   * every screen puts the same number. *"Every screen of this kind renders
   * exactly one component inside its holder"* is a real, checkable convention
   * and it needs no vocabulary.
   *
   * `component` — the component itself, where they all hold the same one.
   *
   * `suffix` — the trailing word all of them share, where they share one:
   * `OrdersGrid`, `InvoicesGrid`, `CustomersGrid` state *a `*Grid`*. Derived
   * from the names in front of it, never from a list of names.
   */
  body: { children: number; component: string | null; suffix: string | null } | null;
  /**
   * Where the family came from.
   *
   * `'pattern'` — a pattern file the project has written names this screen.
   * The strongest answer available and the only one that is a *person's*
   * sentence rather than a reading of the code (#5). `'routes'` — the screens
   * the project's own route table registers beside this one. Stated, not
   * inferred. `'folder'` — the files around it, which is a guess about which of
   * them are of a kind.
   *
   * `'holder'` — the screens in this application that sit in the same holder.
   * Structural, and the channel that was missing: where the route table cannot
   * be read and every screen has a folder to itself, the two cheaper channels
   * answer with a set of an entirely different kind (#35).
   *
   * It belongs in the contract because since #231 a derived contract reaches
   * the agent automatically, and *"derived from the 8 screens registered beside
   * it"* and *"derived from files in its folder"* are not equally trustworthy
   * sentences. An agent handed the second, with the names, can judge the family
   * nonsense on sight — which is this tool's own division of labour (#255).
   */
  from: 'pattern' | 'routes' | 'folder' | 'holder';
}

/** Three screens of a kind, the reference among them. Two files are a copy. */
export const MIN_FAMILY = QUORUM;

/** One screen, as everything below needs to see it. */
interface Reading {
  path: string;
  page: PageRegions;
  components: string[];
  /** The plain HTML elements this screen renders, of the replaceable kind. */
  intrinsics: string[];
  hooks: string[];
  /** The component children the holder holds directly. */
  body: string[];
}

const rolesOf = (reading: Reading): Region[] => reading.page.order.map((one) => one.region);

/** The commonest entry, and how many had it. */
function commonest<T>(values: T[]): { value: T; count: number } | null {
  const counted = new Map<T, number>();
  for (const value of values) counted.set(value, (counted.get(value) ?? 0) + 1);
  const [best] = [...counted.entries()].sort((a, b) => b[1] - a[1]);
  return best === undefined ? null : { value: best[0], count: best[1] };
}

/**
 * What enough of the screens have, counted once per screen.
 *
 * The one fold every level here needs: dedupe inside a screen, count across
 * them, keep what clears the majority. A page rendering three content blocks
 * does not agree with itself three times over.
 */
function shared<T>(perScreen: T[][]): T[] {
  const counted = new Map<T, number>();
  for (const screen of perScreen) {
    for (const value of new Set(screen)) counted.set(value, (counted.get(value) ?? 0) + 1);
  }
  return [...counted.entries()]
    .filter(([, count]) => count / perScreen.length >= MAJORITY)
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value);
}

/** Role → the component that fills it, wherever the family agrees on one. */
function vocabularyOf(screens: Reading[]): { role: Region; component: string }[] {
  const byRole = new Map<Region, string[]>();
  for (const screen of screens) {
    const seen = new Set<Region>();
    for (const filled of screen.page.order) {
      if (seen.has(filled.region)) continue;
      seen.add(filled.region);
      byRole.set(filled.region, [...(byRole.get(filled.region) ?? []), filled.component]);
    }
  }

  const vocabulary: { role: Region; component: string }[] = [];
  for (const [role, components] of byRole) {
    const best = commonest(components);
    if (best === null || best.count / screens.length < MAJORITY) continue;
    vocabulary.push({ role, component: best.value });
  }
  return vocabulary;
}

/** `useSomething()` called anywhere in a screen. */
const HOOK = /^use[A-Z]/;

function hooksIn(source: string): string[] {
  const ast = parseModule(source);
  if (ast === null) return [];

  const found = new Set<string>();
  walk(ast.program, (node) => {
    if (node.type !== 'CallExpression') return;
    if (node.callee.type !== 'Identifier') return;
    if (HOOK.test(node.callee.name)) found.add(node.callee.name);
  });
  return [...found];
}

/**
 * Plain elements a design system normally has something of its own for.
 *
 * Every one of these is in the HTML specification, so the list carries no
 * assumption about anybody's naming. Text elements are left out: a screen
 * rendering prose is not bypassing anything.
 */
const REPLACEABLE = new Set([
  'button',
  'input',
  'textarea',
  'select',
  'table',
  'dialog',
  'form',
  'a',
]);

/**
 * One screen read, in whichever dialect it is written — and from however many
 * files it is written in.
 *
 * A React screen is a file. An Angular screen is a **pair**, and either half
 * resolves to the same screen: the class carries the identity and the template
 * carries the markup (#229).
 */
async function readScreen(path: string): Promise<Reading | null> {
  const pair = await pairOf(path);
  const identity = pair?.identity ?? path;

  const own = await readFile(identity, 'utf8').catch(() => null);
  if (own === null) return null;
  const markup = pair === null ? { path, source: own } : await markupOf(identity, own);
  const source = markup.source;

  // Dispatched on the dialect, as every other reader in this repository does.
  // Without it a `.vue` or `.html` screen goes down the JSX path, fails to
  // parse, and is dropped — while still counting towards the family, so a
  // repository full of screens can be told there are too few to compare.
  const kind = templateKind(markup.path);
  const page = kind === null ? regionsOf(source) : regionsOf(source, kind);
  if (page === null) return null;

  if (kind !== null) {
    // Parsed once. It was parsed twice here, for the names and for the
    // intrinsics, which is the cost #153 and #177 were both about.
    const nodes = parseTemplate(source, kind);
    return {
      path: identity,
      page,
      components: [...new Set(nodes.map((node) => node.name).filter(isTemplateComponent))],
      intrinsics: [...new Set(nodes.map((node) => node.name))].filter((name) =>
        REPLACEABLE.has(name),
      ),
      hooks: [],
      body: bodyIn(nodes, page.holder),
    };
  }

  // One parse for the shape. Reading it again cost a whole extra Babel parse
  // per screen — measured at 12 parses where 6 were needed, on a six-screen
  // family.
  const shape = shapeOf(source);
  return {
    path: identity,
    page,
    components: shape?.components ?? [],
    intrinsics: (rawMarkupOf(source) ?? []).filter((name) => REPLACEABLE.has(name)),
    hooks: hooksIn(source),
    body: shape?.body ?? [],
  };
}


/**
 * The components the holder holds directly, out of a flat list of nodes.
 *
 * Each node carries how deeply it is nested and the list is pre-order, so the
 * holder's own children are the nodes at its depth plus one, up to the next
 * node that is not inside it. No second parse and no second traversal.
 */
function bodyIn(nodes: TemplateNode[], holder: string): string[] {
  const at = nodes.findIndex((node) => node.name === holder);
  if (at < 0) return [];

  const depth = nodes[at]!.depth;
  const body: string[] = [];
  for (const node of nodes.slice(at + 1)) {
    if (node.depth <= depth) break;
    if (node.depth === depth + 1 && isTemplateComponent(node.name)) body.push(node.name);
  }
  return body;
}

/**
 * What every screen of the kind puts inside its holder.
 *
 * The convention that replaces the region comparison on a project whose screens
 * are a holder and one child (#228). Every claim here is made only where *all*
 * of them agree: a majority would be inventing the convention rather than
 * reading it.
 */
function bodyOf(
  screens: Reading[],
): { children: number; component: string | null; suffix: string | null } | null {
  const bodies = screens.map((one) => one.body);
  if (bodies.some((body) => body.length === 0)) return null;

  const children = bodies[0]!.length;
  if (!bodies.every((body) => body.length === children)) return null;

  const first = bodies.map((body) => body[0]!);
  const component = first.every((name) => name === first[0]) ? first[0]! : null;
  const words = first.map(trailingWord);
  const shared = words[0] ?? null;
  const suffix =
    shared !== null && words.every((word) => word === shared) && component === null ? shared : null;

  return { children, component, suffix };
}

/** The holder and the region order the family agrees on, or null. */
function skeletonOf(screens: Reading[]): { holder: string; regions: Region[] } | null {
  const holder = commonest(screens.map((one) => one.page.holder));
  if (holder === null || holder.count / screens.length < MAJORITY) return null;

  // The order as the screens that share the holder write it, rather than an
  // order assembled from roles that never appeared together.
  const orders = screens
    .filter((one) => one.page.holder === holder.value)
    .map((one) => rolesOf(one).join('>'));
  const order = commonest(orders);
  // The same majority the holder has to clear. Without it `commonest` returns
  // whichever order came first — and the counting starts with the reference, so
  // on a tie the page decided its own answer, which is the one thing every
  // other level here refuses to allow.
  if (order === null || order.count / orders.length < MAJORITY) return null;

  return {
    holder: holder.value,
    regions: order.value === '' ? [] : (order.value.split('>') as Region[]),
  };
}

export interface PatternOptions {
  /**
   * Search the application for screens sitting in the same holder, where the
   * cheaper channels came back with a family of a different kind.
   *
   * **Off by default, because it is not for the edit path.** Measured on an
   * 808-screen reproduction it costs 376 ms end to end, against the 37 ms cold
   * budget the derived contract is held to — the same measurement that kept
   * `uic tree` off that path at 115 ms. `uic pattern` turns it on, which is
   * where #35's own evidence runs it and, since #38, where the agent is
   * instructed to go before writing a screen.
   */
  byHolder?: boolean;
  /**
   * The name of a pattern file whose own member list must not become the
   * family.
   *
   * **A refresh is otherwise a closed loop, and it was one.** The pattern-file
   * channel outranks everything read off the code, so the moment a file exists
   * naming four screens, re-deriving one of them reads those same four — a
   * fifth screen of the kind joins the family and the refresh cannot ever see
   * it. Measured on the shipped bundle: `read: 4 files` and an unchanged member
   * list after a fifth screen was added, with `from` flipping from `holder` to
   * `pattern` as the tell (#28).
   *
   * Only *this* file is skipped. Another pattern file naming the screen is
   * still somebody stating a kind, and the authority of the channel is not what
   * is in question — the circularity is.
   */
  ignoringPattern?: string;
}

/**
 * What the screens of one kind have in common, read from the code.
 *
 * The reference is one of them, not the authority: its own particulars are
 * exactly what must not be carried into the next screen. What repeats across
 * the family is the pattern; what appears once is that page's own business.
 */
export async function patternOf(
  target: string,
  options: PatternOptions = {},
): Promise<ScreenPattern | null> {
  // The project this file belongs to, so the search cannot climb out of it into
  // whatever repository happens to sit beside this one on disk.
  const root = await findProjectRoot(dirname(target));

  // What the project has *written down* comes first. A route table states which
  // screens are registered beside one another, and a folder states nothing at
  // all — but a pattern file naming this screen is a person saying *these are
  // one kind*, reviewed in a pull request. Nothing read off the code outranks
  // that, and a dialog that no router registers has no other way to have a kind
  // (#5).
  const named =
    root === null ? null : await familyFromPattern(root, target, options.ignoringPattern);

  const family =
    named ??
    (await siblingScreens(target, {
      ...(root === null ? {} : { root }),
      isScreen: isScreenFile,
      maxSiblings: MAX_FAMILY,
      // The reference counts towards the quorum: three screens of a kind is a
      // family, and one of the three is the page being asked about.
      quorum: MIN_FAMILY - 1,
    }));

  // Deduplicated by identity, because both halves of a pair are candidates and
  // they are one screen. Without this an Angular family counts every screen
  // twice and compares a class against a template.
  const readAll = async (paths: string[]): Promise<Reading[]> => {
    const out: Reading[] = [];
    const seen = new Set<string>();
    for (const path of [target, ...paths]) {
      const reading = await readScreen(path);
      if (reading === null || seen.has(reading.path)) continue;
      seen.add(reading.path);
      out.push(reading);
    }
    return out;
  };

  let from = family.from;
  let read = await readAll(family.screens);
  if (read.length < MIN_FAMILY) return null;

  // No answer at all when the page asked about could not be read. Carrying on
  // would describe the screens around it with confidence — a full skeleton,
  // empty particulars that read as "nothing here is unique to you", and a
  // family that does not contain the file the question was about.
  // The identity, not the path handed in: either half of a pair is a way of
  // naming the same screen, and the reference has to be found by what it is.
  const asked = (await pairOf(target))?.identity ?? target;
  const asking = read.find((one) => one.path === asked);
  if (asking === undefined) return null;
  let reference: Reading = asking;

  // Screens of the same kind, where the kind can be read at all. A list screen
  // and the forms beside it share only what every screen has — measured on a
  // real app, that reduced the invariant to `IonPage > header, content` and
  // reported everything list-shaped as the page's own business.
  // Screens of one kind are the ones that sit in the same holder. Structural,
  // and free of any vocabulary: what a screen is *held by* is a fact about this
  // project, while "is this a list or a form" needed a list of component names
  // that matched nothing outside one library.
  let sameHolder = read.filter((one) => one.page.holder === reference.page.holder);

  // Ask the question nothing was asking. The two channels above collect by what
  // a project *states* and by what sits nearby, and where the first is silent
  // the second is proximity — which in a project giving every screen its own
  // folder is alphabetical accident. On a reproduction of that shape the walk
  // returned 12 candidates and all 12 sat in a different holder, so a family of
  // 8 answered "fewer than three screens of this kind" (#35).
  //
  // Only here, and only after everything cheaper has failed: this reads files
  // rather than directories, and the case it runs in is the one where the tool
  // otherwise says nothing at all.
  if (options.byHolder === true && sameHolder.length < MIN_FAMILY && root !== null && named === null) {
    const area = await appRootFor(target, root);
    const byHolder =
      area === null
        ? []
        : await holderSiblings(target, reference.page.holder, area, {
            isScreen: isScreenFile,
            maxSiblings: MAX_FAMILY,
          });
    if (byHolder.length + 1 >= MIN_FAMILY) {
      const again = await readAll(byHolder);
      const held = again.filter((one) => one.page.holder === reference.page.holder);
      // The reference is found again in the new reading, and not carried over
      // from the old one. Everything below compares by **identity** — `others`
      // is `screens.filter((one) => one !== reference)` — so a reference left
      // pointing into the discarded array never matches, and the page being
      // asked about ends up voting on its own pattern: `particulars` came back
      // empty on a screen with a component nothing else renders, and the
      // observer counted 8 siblings where there are 7.
      const still = again.find((one) => one.path === asked);
      if (held.length >= MIN_FAMILY && still !== undefined) {
        read = again;
        sameHolder = held;
        reference = still;
        from = 'holder';
      }
    }
  }

  const narrowed = sameHolder.length >= MIN_FAMILY;

  // **A folder that holds a mixture is not a family** (#5). Where the project
  // *states* the siblinghood — a route table, or a pattern file naming these
  // screens — a set with several holders is still that set, and describing what
  // it has in common is describing something somebody wrote down. Where the only
  // evidence is that the files sit near each other, screens of different kinds
  // in one answer is a family assembled out of whatever was nearby: a dialog was
  // measured against an amount cell, a currency field, an attachments panel and
  // a history tab.
  //
  // The honest answer is then fewer members or none. A miss, never an invention.
  if (!narrowed && from === 'folder') return null;

  const screens = narrowed ? sameHolder : read;
  const kind = narrowed ? reference.page.holder : null;

  const others = screens.filter((one) => one !== reference);
  // What no other screen has — not merely what a majority lacks. A component
  // half the family also renders is unsettled, and listing it as something that
  // must not be copied would tell somebody to avoid what the project plainly
  // uses.
  const elsewhereRoles = new Set(others.flatMap(rolesOf));
  const elsewhereComponents = new Set(others.flatMap((one) => one.components));

  // The family this was measured over, handed to the usage observer rather than
  // letting it choose a second one — two selections with two quorums settled on
  // two different scopes, so the configuration described screens the answer
  // never named. The reference is left out of it: the observer counts *sibling*
  // screens, so including it would both inflate that number and let the page
  // being asked about settle the majority.
  const observed = await observeUsage(target, { family: others.map((one) => one.path) }).catch(
    () => null,
  );

  // A holder that is a plain HTML element is a screen assembled from markup.
  // A custom element counts as a component: `<app-page>` is as much a
  // component as `<PageLayout>`.
  const fromMarkup = screens.filter((one) => /^[a-z][\w]*$/.test(one.page.holder)).length;
  const built = fromMarkup / screens.length >= MAJORITY ? ('markup' as const) : ('components' as const);

  const rendered = new Set(screens.flatMap((one) => one.intrinsics));
  const avoids = [...REPLACEABLE].filter((name) => !rendered.has(name));

  // The chrome, when the family agrees on one. A screen written against a
  // different layout from the rest of its kind is worth not describing as if it
  // shared theirs.
  const layouts = await Promise.all(screens.map((one) => governingLayout(one.path, root)));
  const agreed = commonest<string>(layouts.filter((path): path is string => path !== null));
  const chrome =
    agreed === null || agreed.count / screens.length < MAJORITY
      ? null
      : await chromeOf(agreed.value);

  const skeleton = skeletonOf(screens);

  // A folder guess that contradicts the screen it was derived *for* is not an
  // answer about that screen.
  //
  // Measured: a page whose route did not resolve took its own panels as its
  // family, the derived holder became `Box` while the page itself sits in
  // `PageLayout`, and every screen of that area was then reported as deviating
  // from a contract none of them matches — nine findings, nine false (#255).
  //
  // Scoped to a folder-derived family on purpose. Where the family is what the
  // project *states*, a reference that deviates from its siblings is a correct
  // and valuable answer — it is the thing this tool exists to say — so the
  // self-check must not fire there.
  if (family.from === 'folder' && skeleton !== null && skeleton.holder !== reference.page.holder) {
    return null;
  }

  const vocabulary = vocabularyOf(screens);
  const body = bodyOf(screens);
  // Where the holder is written with props the family agrees about, the chrome
  // is in the holder — which is why there are no regions to compare, and is an
  // answer rather than a blank.
  const holderIsWritten = (observed ?? []).some(
    (one) =>
      one.component === skeleton?.holder &&
      (one.props.length > 0 || one.written.length > 0 || one.classes.length > 0),
  );

  return {
    skeleton,
    vocabulary,
    regionsIn:
      skeleton === null ? null : skeleton.regions.length > 0 ? 'components' : holderIsWritten ? 'holder' : null,
    body,
    configuration: observed ?? [],
    propsUnmeasured: observed === null ? { siblings: others.length, needed: QUORUM } : null,
    particulars: {
      roles: [...new Set(rolesOf(reference))].filter((role) => !elsewhereRoles.has(role)),
      components: reference.components.filter((name) => !elsewhereComponents.has(name)),
    },
    chrome,
    avoids,
    built,
    wiring: shared(screens.map((one) => one.hooks)),
    family: screens.map((one) => one.path),
    kind,
    from,
  };
}

/**
 * The family a pattern file names, where one names this screen.
 *
 * Only the members, and only where there are enough of them to measure
 * agreement. `ignoring` names a file this may not answer from, which is what
 * keeps a refresh from re-deriving a pattern out of its own member list — the pattern file states the shape, and this level's job is still
 * to read what the code does. A pattern with one member is a decision about a
 * screen that does not have siblings yet, and deriving from it would report that
 * one screen's own business as the pattern.
 */
async function familyFromPattern(
  root: string,
  target: string,
  ignoring?: string,
): Promise<Family | null> {
  const { patterns } = await patternFiles(root).catch(() => ({ patterns: [] }));
  if (patterns.length === 0) return null;

  const where = relative(root, target);
  const covering = patterns.find(
    (one) => one.name !== ignoring && one.members.includes(where),
  );
  if (covering === undefined) return null;

  const screens = covering.members
    .filter((member) => member !== where)
    .map((member) => resolve(root, member));
  return screens.length + 1 < MIN_FAMILY ? null : { screens, from: 'pattern' };
}

/**
 * The application the screen belongs to, which is not the workspace.
 *
 * A holder search bounded at the repository root would put one app's screens
 * into another app's family — on a four-app monorepo that is a wrong family,
 * not a slow one. The nearest `package.json` at or above the screen is the
 * boundary a monorepo actually states.
 *
 * `null` where none can be found below the root, and a null answer means the
 * channel does not run: a family assembled across an unknown boundary is worse
 * than no family. That is the Nx shape this plugin calls normal — libraries
 * with no `package.json`, bounded by `tsconfig` aliases — so on those the
 * holder channel is silent. A miss, stated here rather than left to be
 * discovered.
 */
async function appRootFor(screen: string, root: string): Promise<string | null> {
  let current = dirname(screen);
  for (;;) {
    if (await stat(join(current, 'package.json')).then(() => true, () => false)) return current;
    if (current === root) return null;
    const up = dirname(current);
    if (up === current) return null;
    current = up;
  }
}

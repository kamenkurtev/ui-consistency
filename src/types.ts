/** A package discovered in the workspace. */
export interface PackageInfo {
  /** The name it is imported by, e.g. "@acme/core". */
  name: string;
  /** Absolute path to the package root. */
  root: string;
  /** Names of packages this one depends on, workspace-internal or not. */
  dependencies: string[];
}

/** One step on a file's resolution chain. */
export interface Layer {
  name: string;
  /** Null for an external dependency, whose source is not in the workspace. */
  root: string | null;
  /**
   * What this layer depends on directly. Chain position alone cannot tell an
   * ancestor from an unrelated sibling, and only an ancestor may claim that a
   * symbol should have come from it.
   */
  dependencies: string[];
}

/** What the inventory knows about one exported symbol. */
export interface ExportedSymbol {
  deprecated: boolean;
  /** The {@link Target} named by an `@deprecated` tag, if any. */
  replacement: string | null;
}

/** Layer name -> symbol name -> what is known about it. */
export interface Inventory {
  layers: Record<string, Record<string, ExportedSymbol>>;
}

export type ViolationReason = 'nearer-layer' | 'deprecated';

export interface Violation {
  file: string;
  /** 1-indexed. */
  line: number;
  symbol: string;
  /** The module specifier actually imported from. */
  importedFrom: string;
  /** The layer name that should have been imported from. */
  expectedFrom: string;
  reason: ViolationReason;
  /** Only set when reason is 'deprecated'. */
  replacement?: string;
  /**
   * The expected layer is the file's own. There is no import specifier that
   * would be right — the fix is a path inside the layer — so no fix is offered.
   */
  withinOwnLayer?: boolean;
}

/**
 * The seven levels of design-system consistency, most to least abstract.
 * Imports come last on purpose: the wrong import is the symptom, and the
 * levels above it are what a reviewer actually notices about a screen.
 */
export type Level =
  | 'page-pattern'
  | 'layout'
  | 'reuse'
  | 'style'
  | 'props'
  | 'deprecated'
  | 'import';

/** Where the expectation a finding is measured against came from. */
export type SourceKind = 'reference' | 'storybook' | 'knowledge' | 'neighbours';

/**
 * One thing that does not match the project's design system.
 *
 * A v1 {@link Violation} is a `Finding` with `level: 'import'` and a message —
 * every field of the import check survives, so the engine can carry both
 * without a lossy conversion.
 */
export interface Finding extends Partial<Violation> {
  file: string;
  /** 1-indexed. */
  line: number;
  level: Level;
  /** What is wrong, in the developer's terms. */
  message: string;
  /** Named whenever the expectation is not the deterministic import graph. */
  source?: SourceKind;
  /**
   * Tier 2. Advice with its source named, never a gate — the deterministic
   * checks are the only thing allowed to be binary.
   */
  advisory?: boolean;
}

/**
 * Component -> prop -> the values the project allows.
 *
 * Always injected from a source of truth. Nothing derives one of these from
 * the code being checked: a set inferred from neighbours would enforce
 * whatever mistake is most common.
 */
export type PropConventions = Record<string, Record<string, string[]>>;

/** One curated piece of the knowledge base, after parsing. */
export interface KnowledgeFragment {
  id: string;
  kind: string;
  /** What it is about — a component name, a pattern name, a token group. */
  subject: string;
  body: string;
  /** Lowercased terms the lexical retriever matches against. */
  keywords: string[];
  /**
   * Written by a generator rather than by a person.
   *
   * Advisory only, and the flag exists to keep it that way: nothing derived
   * from a generated fragment may fail a check. Set in exactly one place —
   * `parseKnowledge`, from the file's marker — so there is no second way for a
   * fragment to become generated, and absent means curated.
   */
  generated?: true;
}

/** The knowledge base as a whole. */
export interface Knowledge {
  fragments: KnowledgeFragment[];
}

/** What the Tier 2 model call returns about one edited file. */
export interface Verdict {
  fits: boolean;
  note?: string;
  suggestion?: string;
}

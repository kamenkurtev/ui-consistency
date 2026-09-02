import { parse } from 'angular-html-parser';

/** The template dialects, which differ far less than their frameworks do. */
export type TemplateKind = 'angular' | 'vue' | 'svelte';

/**
 * One element, flattened out of whatever dialect it was written in.
 *
 * Deliberately not a tree of framework nodes. Every check needs the same three
 * things — what the element is called, what was passed to it, and what text it
 * holds — and those are the same in all three dialects once the binding syntax
 * is left on the attribute name where it belongs.
 */
export interface TemplateNode {
  name: string;
  /** Attribute name exactly as written: `[disabled]`, `:disabled`, `v-for`. */
  attributes: Record<string, string>;
  /** 1-indexed, in the file — not in the block it was extracted from. */
  line: number;
  /** The element's own text, trimmed. */
  text: string;
  /** How deeply nested it is, outermost being 0. */
  depth: number;
}

const BY_EXTENSION: { pattern: RegExp; kind: TemplateKind }[] = [
  { pattern: /\.html$/i, kind: 'angular' },
  { pattern: /\.vue$/i, kind: 'vue' },
  { pattern: /\.svelte$/i, kind: 'svelte' },
];

/** Which dialect a path holds, or null when it holds none. */
export function templateKind(filePath: string): TemplateKind | null {
  return BY_EXTENSION.find((entry) => entry.pattern.test(filePath))?.kind ?? null;
}

/** Blocks that are code or styling, not markup. */
const NOT_MARKUP = new Set(['script', 'style']);

/**
 * The `<template>` block of a Vue SFC, with the lines above it kept.
 *
 * Kept, not stripped: a finding pointing at line 2 of the block is a finding
 * pointing at the wrong line of the file somebody has open.
 */
function vueTemplate(source: string): string {
  const open = /<template[^>]*>/i.exec(source);
  if (open === null) return '';
  const start = open.index + open[0].length;
  const close = source.lastIndexOf('</template>');
  if (close <= start) return '';

  const before = source.slice(0, start).replace(/[^\n]/g, ' ');
  return before + source.slice(start, close);
}

/**
 * Whether a template element names a component rather than plain markup.
 *
 * `<app-page-header>` and `<PageHeader>` are components; `<div>` and `<table>`
 * are not. The custom-element specification requires the hyphen, which is what
 * makes this decidable without knowing anything about the project.
 *
 * Lives here rather than beside either caller because both `pattern` and
 * `extract` need it and neither can import the other.
 */
export const isTemplateComponent = (name: string): boolean =>
  /^(?:[a-z][\w]*-[\w-]*|[A-Z][\w]*)$/.test(name);

/**
 * Read a template of any of the three dialects.
 *
 * One parser for all of them, which is a decision worth recording. The
 * official compilers were measured: `svelte/compiler` alone bundles to 1.8 MB
 * and `@vue/compiler-sfc` does not bundle at all, against a whole plugin that
 * is loaded by a hook on every edit. A tolerant HTML parser reads all three
 * with no errors — Angular's `*ngFor` and `[prop]`, Vue's `@click` and
 * `v-for`, and Svelte's elements inside `{#if}` blocks — because what the
 * checks need is elements, attributes and text, and those are HTML in every
 * dialect. What is lost is each framework's semantics, which no check reads.
 */
export function parseTemplate(source: string, kind: TemplateKind): TemplateNode[] {
  const markup = kind === 'vue' ? vueTemplate(source) : source;
  if (markup.trim() === '') return [];

  let rootNodes: unknown[];
  try {
    ({ rootNodes } = parse(markup, {
      canSelfClose: true,
      allowHtmComponentClosingTags: true,
      isTagNameCaseSensitive: true,
    }) as { rootNodes: unknown[] });
  } catch {
    // Silence on anything unreadable, as everywhere else.
    return [];
  }

  const found: TemplateNode[] = [];

  const visit = (nodes: unknown[], depth: number): void => {
    for (const node of nodes) {
      const element = node as {
        name?: string;
        attrs?: { name: string; value: string }[];
        children?: unknown[];
        value?: string;
        startSourceSpan?: { start: { line: number } };
      };
      if (typeof element.name !== 'string') continue;
      if (NOT_MARKUP.has(element.name.toLowerCase())) continue;

      const attributes: Record<string, string> = {};
      for (const attribute of element.attrs ?? []) attributes[attribute.name] = attribute.value;

      const text = (element.children ?? [])
        .map((child) => (child as { value?: string }).value ?? '')
        .join('')
        .trim();

      found.push({
        name: element.name,
        attributes,
        // The parser counts from zero; every message in this tool counts from one.
        line: (element.startSourceSpan?.start.line ?? 0) + 1,
        text,
        depth,
      });

      if (element.children !== undefined) visit(element.children, depth + 1);
    }
  };

  visit(rootNodes, 0);
  return found;
}

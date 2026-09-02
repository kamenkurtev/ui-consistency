import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseModule, walk } from '../parse/parse.js';

import type { PropConventions } from '../types.js';
import type { SourceModel, SourceOfTruth } from './adapter.js';

/**
 * Stories, read as files rather than through a running Storybook.
 *
 * Static AST is the default because it always works: offline, in CI, on a
 * machine that has never run `storybook dev`. The MCP server at
 * `localhost:4400` is a richer path for later, behind a flag — never a
 * dependency of the check.
 */
const STORIES = /\.stories\.[jt]sx?$/;

async function storyFiles(dir: string, depth = 2): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => null);
  if (entries === null) return [];

  const found: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (depth > 0) found.push(...(await storyFiles(path, depth - 1)));
      continue;
    }
    if (STORIES.test(entry.name)) found.push(path);
  }
  return found;
}

/** The `component:` of a default export, which names what the stories are of. */
function componentOf(source: string): string | null {
  const ast = parseModule(source);
  if (ast === null) return null;

  let name: string | null = null;
  walk(ast.program, (node) => {
    if (node.type !== 'ObjectProperty' || node.computed) return;
    const key = node.key;
    const keyName = key.type === 'Identifier' ? key.name : null;
    if (keyName !== 'component') return;
    if (node.value.type === 'Identifier') name = node.value.name;
  });
  return name;
}

/** Every `args: { ... }` literal in the file, merged. */
function argsOf(source: string): Record<string, string[]> {
  const ast = parseModule(source);
  if (ast === null) return {};

  const found: Record<string, string[]> = {};
  walk(ast.program, (node) => {
    if (node.type !== 'ObjectProperty' || node.computed) return;
    const key = node.key;
    if ((key.type === 'Identifier' ? key.name : null) !== 'args') return;
    if (node.value.type !== 'ObjectExpression') return;

    for (const property of node.value.properties) {
      if (property.type !== 'ObjectProperty' || property.computed) continue;
      const propertyKey = property.key;
      const propName =
        propertyKey.type === 'Identifier'
          ? propertyKey.name
          : propertyKey.type === 'StringLiteral'
            ? propertyKey.value
            : null;
      if (propName === null) continue;
      // Only a literal is a stated value.
      if (property.value.type !== 'StringLiteral') continue;
      const values = (found[propName] ??= []);
      if (!values.includes(property.value.value)) values.push(property.value.value);
    }
  });
  return found;
}

/** A value that names a variant rather than saying something. */
const TOKEN = /^[a-z0-9][\w-]*$/i;

/**
 * Props that carry content, whatever the value happens to look like.
 *
 * `label: 'Quantity'` passes every shape test and is still not an enumeration
 * — Backstage's stories gave `NumberField.label` three different words. These
 * are properties of the props themselves, not of any one project, so naming
 * them here keeps the tool generic.
 */
const CONTENT_PROPS = new Set([
  'name',
  'label',
  'title',
  'subtitle',
  'description',
  'placeholder',
  'value',
  'defaultValue',
  'text',
  'children',
  'id',
  'key',
  'src',
  'alt',
  'href',
  'to',
  'aria-label',
  'ariaLabel',
  'data-testid',
  'testId',
]);

/**
 * Keep only the props whose story values are a *set*, not content.
 *
 * A story's `args` mixes both: `severity: 'warning'` enumerates, while
 * `title: 'This is an alert message'` is the demo text. Backstage's own
 * stories are full of the second kind, and taken as conventions they would
 * fault every other title in the product. Two tests decide it:
 *
 * - every value is a bare token — no spaces, no sentences, nothing long;
 * - at least two distinct values exist. One value cannot tell a closed set
 *   from a default, and a set of one faults everything else.
 */
function enumerable(byProp: Record<string, string[]>): Record<string, string[]> {
  const kept: Record<string, string[]> = {};
  for (const [prop, values] of Object.entries(byProp)) {
    if (CONTENT_PROPS.has(prop)) continue;
    if (values.length < 2) continue;
    if (!values.every((value) => value.length <= 24 && TOKEN.test(value))) continue;
    kept[prop] = values;
  }
  return kept;
}

export interface StorybookOptions {
  /**
   * How many directories down to look.
   *
   * Two by default, because the cascade runs inside an edit. That is too
   * shallow for a monorepo — every story in Backstage is four or more levels
   * down — so a caller where seconds are free may pass a larger budget.
   *
   * `uic init` was that caller and was deleted in #119. Nothing passes it
   * today, which makes this dead configuration: see #154.
   */
  depth?: number;
}

export function storybookSource(dir: string, options: StorybookOptions = {}): SourceOfTruth {
  return {
    kind: 'storybook',
    async describe(): Promise<SourceModel | null> {
      const files = await storyFiles(dir, options.depth ?? 2);
      if (files.length === 0) return null;

      const components: string[] = [];
      const props: PropConventions = {};

      for (const file of files) {
        const source = await readFile(file, 'utf8').catch(() => null);
        if (source === null) continue;
        const component = componentOf(source);
        if (component === null) continue;
        if (!components.includes(component)) components.push(component);
        const args = argsOf(source);
        if (Object.keys(args).length > 0) props[component] = { ...props[component], ...args };
      }

      if (components.length === 0) return null;
      for (const [component, byProp] of Object.entries(props)) {
        props[component] = enumerable(byProp);
        if (Object.keys(props[component]!).length === 0) delete props[component];
      }
      // Stories demonstrate components, not screens: no layout is claimed.
      return { kind: 'storybook', components, pattern: [], props };
    },
  };
}

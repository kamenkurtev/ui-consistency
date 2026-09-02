import type { JSXElement } from '@babel/types';
import { parseModule, walk } from '../parse/parse.js';
import type { Finding } from '../types.js';
import { quoted } from '../core/quote.js';

/**
 * Emoji, including the pictographs, symbols and dingbats used as icons.
 *
 * One definition. There were two — this regex and the predicate below, written
 * out in `reuse.ts` for JSX and in `template.ts` for Angular, Vue and Svelte —
 * and they hashed identically (#148).
 *
 * That duplication had a cost beyond tidiness. Both are meant to answer the
 * same question about the same kind of text; a codepoint range added to one
 * would have made JSX and templates disagree silently, with every test still
 * green and one dialect quietly no longer reporting emoji.
 */
export const EMOJI =
  /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F0FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F900}-\u{1F9FF}]/u;

/** Is this text an icon rather than copy — emoji and nothing else? */
export function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '' || !EMOJI.test(trimmed)) return false;
  return !/[\p{L}\p{N}]/u.test(trimmed);
}

/** Props whose value stands where an icon would go. */
const ICON_SLOTS = new Set([
  'icon',
  'startIcon',
  'endIcon',
  'avatar',
  'logo',
  'iconName',
  'leftIcon',
  'rightIcon',
]);

function emojiFinding(file: string, line: number, text: string): Finding {
  return {
    file,
    line,
    level: 'reuse',
    message: `${quoted(text)} is an emoji used as an icon. Use the design system's icon component so it matches the others.`,
  };
}

/**
 * Tier 1: an emoji standing where an icon belongs.
 *
 * This was `reuseFindings`, in `checks/reuse.ts`, and it checked reuse — a raw
 * `<button>` where the project exports a `Button`. That half went in #123
 * because it needed a built-in map from element to component name, and on every
 * project naming things differently it matched nothing and said nothing.
 *
 * The name stayed, and three documents went on describing the check it used to
 * be, because nothing in the code contradicted them. #123 removed the half that
 * named a component on 16 August; they were corrected on 18 and 19 (#147).
 *
 * **It needs nothing about the project.** The message names no component, so it
 * does not depend on a package having been detected — and this used to return
 * nothing when none was, which is inherited from the half that did name one.
 *
 * That mattered more than it looks. A project the tool cannot otherwise read is
 * exactly where a fresh install has to show it does something, and this project
 * has already been through one round of being silent on every repository's first
 * day. One true finding there is the difference between "it does not work" and
 * "it works but cannot see my packages" (#166).
 */
export function emojiFindings(filePath: string, source: string): Finding[] {
  const ast = parseModule(source, filePath);
  if (ast === null) return [];

  const findings: Finding[] = [];

  walk(ast.program, (node) => {
    if (node.type === 'JSXElement') {
      const element = node as JSXElement;
      const line = element.openingElement.loc?.start.line ?? 1;

      for (const child of element.children) {
        if (child.type !== 'JSXText') continue;
        if (isEmojiOnly(child.value)) {
          findings.push(emojiFinding(filePath, child.loc?.start.line ?? line, child.value));
        }
      }
      return;
    }

    if (node.type === 'JSXAttribute') {
      if (node.name.type !== 'JSXIdentifier' || !ICON_SLOTS.has(node.name.name)) return;
      const value = node.value;
      if (value?.type === 'StringLiteral' && EMOJI.test(value.value)) {
        findings.push(emojiFinding(filePath, value.loc?.start.line ?? 1, value.value));
      }
    }
  });

  return findings.sort((a, b) => a.line - b.line);
}

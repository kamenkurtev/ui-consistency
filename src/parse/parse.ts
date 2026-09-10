import { parse, type ParserPlugin } from '@babel/parser';
import type { File, Node } from '@babel/types';

/**
 * Parse a TypeScript or TSX module.
 *
 * A JSX-aware parser is not optional for this tool. The first attempt used
 * `es-module-lexer`, which is far smaller but is a JavaScript lexer: it fails
 * on `<div>hi</div>` and so on three quarters of the real `.tsx` files in a
 * production monorepo. A check that silently returns nothing on the files it
 * exists to check is worse than no check.
 *
 * `errorRecovery` is deliberately off. A file that does not parse yields null
 * and therefore no violations — false positives cost more than misses, and a
 * partially recovered AST can carry a truncated import list.
 *
 * **Decorators are two syntaxes and Babel refuses to enable both**, so this
 * tries the common one and falls back. Without either, a decorated class was a
 * syntax error and every module-level reading of the file returned nothing —
 * which is *every Angular component*, and it was silent (#253). Measured on one
 * package whose single component file is decorated: `2 exports, 1 deprecated`
 * against `4 exports, 2 deprecated` for the identical file undecorated. The
 * inventory is what the import and deprecated checks stand on.
 *
 * The order is not preference, it is measured. `decorators-legacy` is what
 * Angular and every `experimentalDecorators` codebase emit, and it is the only
 * spelling that accepts a **parameter** decorator — `constructor(@Inject(T) x)`
 * — which the current proposal rejects outright. The proposal in turn accepts
 * `@logged accessor x`, which legacy rejects. Neither reads both, and the
 * second attempt costs nothing where it matters: it runs only where the first
 * failed, which is where the answer used to be `null`.
 */
const LEGACY: ParserPlugin[] = ['typescript', 'jsx', 'decorators-legacy'];
const PROPOSAL: ParserPlugin[] = [
  'typescript',
  'jsx',
  'decorators',
  'decoratorAutoAccessors',
];

export function parseModule(source: string, fileName = 'input.tsx'): File | null {
  for (const plugins of [LEGACY, PROPOSAL]) {
    try {
      return parse(source, { sourceType: 'module', sourceFilename: fileName, plugins });
    } catch {
      // The next spelling, and after that the file genuinely does not parse.
    }
  }
  return null;
}

/**
 * Every node under `root`, each visited once.
 *
 * One implementation, here, beside the parser that produces the tree. There
 * were seven — five byte-identical, one differing only in a parameter name —
 * and this one was already exported and already imported by six modules. The
 * other six were copies made by whoever did not find it (#148).
 *
 * **A stack, so siblings arrive in reverse document order.** That is not a
 * detail to leave undocumented: `rawMarkupOf` truncates its result to eight and
 * therefore names the *end* of a file rather than its beginning (#161). Any
 * caller that cares about order has to sort, and any change to the traversal
 * order changes what every caller sees first.
 */
export function walk(root: Node, visit: (node: Node) => void): void {
  const stack: Node[] = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    visit(current);
    stack.push(...childNodes(current));
  }
}

/**
 * Every child node of one node, without knowing what kind of node it is.
 *
 * Exported because a caller that must **stop** somewhere cannot use `walk` — a
 * traversal that has to halt at a function boundary, say — and each such caller
 * was writing this out again. `CLAUDE.md` names a fourth copy of `walk` as a
 * live problem in this repository; this is the shared half of it.
 */
export function childNodes(node: Node): Node[] {
  const out: Node[] = [];
  for (const key of Object.keys(node)) {
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item !== null && typeof item === 'object' && 'type' in item) out.push(item as Node);
      }
    } else if (child !== null && typeof child === 'object' && 'type' in child) {
      out.push(child as Node);
    }
  }
  return out;
}

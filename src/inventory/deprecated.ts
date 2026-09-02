import type { Comment } from '@babel/types';
import { parseModule } from '../parse/parse.js';
import { exportedNamesOf } from './exports.js';

/** The name inside the first `{@link Target}` of a doc comment. */
function linkTarget(text: string): string | null {
  const match = /\{@link\s+([A-Za-z_$][\w$]*)/.exec(text);
  return match === null ? null : match[1]!;
}

/** The doc comment attached to a statement, if it carries `@deprecated`. */
function deprecationComment(comments: readonly Comment[] | null | undefined): Comment | null {
  for (const comment of comments ?? []) {
    // Only a block comment is a doc comment; `// @deprecated` is a note.
    if (comment.type !== 'CommentBlock') continue;
    if (/@deprecated\b/.test(comment.value)) return comment;
  }
  return null;
}

/**
 * Deprecated exported symbols, mapped to their replacement or null.
 *
 * Standard JSDoc rather than a custom marker: TypeScript and editors already
 * understand `@deprecated`, so a project adopting this has nothing new to
 * learn and existing annotations count immediately.
 *
 * Attachment is the parser's, not a heuristic of ours — a comment belongs to
 * the statement it leads, so a note on some unrelated internal cannot bleed
 * onto the export below it.
 */
export function deprecationsFromSource(source: string): Map<string, string | null> {
  const found = new Map<string, string | null>();

  const ast = parseModule(source);
  if (ast === null) return found;

  for (const statement of ast.program.body) {
    if (statement.type !== 'ExportNamedDeclaration') continue;
    const comment = deprecationComment(statement.leadingComments);
    if (comment === null) continue;

    const replacement = linkTarget(comment.value);
    for (const name of exportedNamesOf(statement)) found.set(name, replacement);
  }

  return found;
}

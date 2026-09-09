import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { writtenIn } from './usage.js';
import { markupOf, pairOf } from './pair.js';

/** One prop, and which of the files that render the component write it. */
export interface PropRow {
  name: string;
  /** The files that write it, project-relative and in the order they were given. */
  written: string[];
  /**
   * The value every writer writes, where they all write the same literal one.
   *
   * `null` covers two different things on purpose — nobody writes a literal, and
   * they write different ones — because neither is a convention and the
   * difference between them is not this command's business. What is written at
   * all is the fact; the value is a bonus where the set happens to agree.
   */
  value: string | null;
}

export interface PropsMatrix {
  component: string;
  /** Files that render it. */
  renders: string[];
  /** Files that were read, and are screens, and do not render it. */
  absent: string[];
  /** Files that could not be read at all. Never silently dropped. */
  unreadable: string[];
  /** Unanimous first, then by how many write it, then by name. */
  rows: PropRow[];
}

/**
 * Which props each file writes on one component, and where the set diverges.
 *
 * The fact that answers *"is this screen written like its siblings"* at the
 * level a family actually drifts. Two screens can both sit in the right holder
 * and still look different because one of them left a prop off: six sibling
 * screens rendering one table agreed on thirteen props and then diverged on
 * `density`, which five of the six write — so the sixth has rows a different
 * height from every other table in the product.
 *
 * A fact supplier and nothing else. Frequency here is evidence handed over,
 * never a rule: four of the divergences measured were deliberate, and a report
 * that cannot leave room for that is a report that gets switched off.
 */
export async function propsMatrix(
  rootDir: string,
  component: string,
  files: string[],
): Promise<PropsMatrix> {
  const renders: string[] = [];
  const absent: string[] = [];
  const unreadable: string[] = [];
  const written = new Map<string, { files: string[]; values: (string | null)[] }>();

  for (const file of files) {
    const where = relative(rootDir, file);
    const read = await sourceOf(file);
    if (read === null) {
      unreadable.push(where);
      continue;
    }

    // `all`, because this command answers *which props are written*. A screen
    // that forgot the test id its whole family writes is the case it exists for.
    const one = writtenIn(read.path, read.source, { all: true }).find(
      (each) => each.component === component,
    );
    if (one === undefined) {
      absent.push(where);
      continue;
    }

    renders.push(where);
    for (const [name, value] of one.attributes) {
      const row = written.get(name) ?? { files: [], values: [] };
      row.files.push(where);
      row.values.push(value.value);
      written.set(name, row);
    }
  }

  const rows = [...written.entries()]
    .map(([name, row]) => ({
      name,
      written: row.files,
      value: agreed(row.values),
    }))
    .sort((a, b) => b.written.length - a.written.length || a.name.localeCompare(b.name));

  return { component, renders, absent, unreadable, rows };
}

/** The one literal they all wrote, or nothing. */
function agreed(values: (string | null)[]): string | null {
  const first = values[0];
  if (first === null || first === undefined) return null;
  return values.every((value) => value === first) ? first : null;
}

/**
 * A screen's markup, from whichever of its files carries it.
 *
 * The same pair reading every other reader here does. Reading the `.component.ts`
 * for markup answers nothing, and answering nothing is indistinguishable from a
 * screen that writes no props.
 */
async function sourceOf(file: string): Promise<{ path: string; source: string } | null> {
  const pair = await pairOf(file);
  const identity = pair?.identity ?? file;
  const own = await readFile(identity, 'utf8').catch(() => null);
  if (own === null) return null;
  return pair === null ? { path: file, source: own } : markupOf(identity, own);
}

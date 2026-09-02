import { readFile } from 'node:fs/promises';
import { shapeOf } from './extract.js';
import type { SourceModel, SourceOfTruth } from './adapter.js';

/**
 * A screen the developer pointed at: "build one like this".
 *
 * The strongest source there is, because it is the only one carrying stated
 * intent about *this* piece of work. Everything else is a standing rule or a
 * pattern that happens to hold.
 */
export function referenceSource(filePath: string): SourceOfTruth {
  return {
    kind: 'reference',
    async describe(): Promise<SourceModel | null> {
      const source = await readFile(filePath, 'utf8').catch(() => null);
      if (source === null) return null;
      const shape = shapeOf(source);
      if (shape === null) return null;
      const { holder, ...rest } = shape;
      return { kind: 'reference', ...rest, ...(holder === null ? {} : { holder }) };
    },
  };
}

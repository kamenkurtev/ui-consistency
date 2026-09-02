import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ExportedSymbol, Inventory, Layer } from '../types.js';
import { entryFileFor, exportedSymbolsFromSource, starReexportsFromSource } from './exports.js';
import { deprecationsFromSource } from './deprecated.js';

export interface InventoryIO {
  readSource?: (path: string) => Promise<string | null>;
  resolveEntry?: (packageRoot: string) => Promise<string | null>;
}

const readFromDisk = (path: string): Promise<string | null> =>
  readFile(path, 'utf8').catch(() => null);

const MODULE_SUFFIXES = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

/** Barrels nest, so a star chain is followed this far and no further. */
const MAX_STAR_DEPTH = 8;

type ReadSource = (path: string) => Promise<string | null>;

/** The first candidate path for a relative specifier that can actually be read. */
async function readRelative(
  fromFile: string,
  specifier: string,
  readSource: ReadSource,
): Promise<{ path: string; source: string } | null> {
  const base = join(dirname(fromFile), specifier);
  for (const suffix of MODULE_SUFFIXES) {
    const path = `${base}${suffix}`;
    const source = await readSource(path);
    if (source !== null) return { path, source };
  }
  return null;
}

/**
 * Build the inventory for a chain of layers.
 *
 * The inventory records what **exists**, never what is correct. Deriving
 * correctness from the surrounding codebase would enshrine the mistakes
 * already propagated through it.
 *
 * A layer that yields nothing is still recorded, as an empty record. Present
 * but empty means "nothing known here", which the check reads as "no nearer
 * alternative" — quite different from a layer that is missing entirely.
 *
 * Both sides of I/O are injectable so the assembly logic is testable without a
 * fixture tree on disk.
 */
export async function buildInventory(layers: Layer[], io: InventoryIO = {}): Promise<Inventory> {
  const readSource = io.readSource ?? readFromDisk;
  const resolveEntry = io.resolveEntry ?? entryFileFor;
  const inventory: Inventory = { layers: {} };

  for (const layer of layers) {
    const symbols: Record<string, ExportedSymbol> = {};
    inventory.layers[layer.name] = symbols;

    // An external dependency has no source in the workspace to read.
    if (layer.root === null) continue;
    const entry = await resolveEntry(layer.root);
    if (entry === null) continue;
    const source = await readSource(entry);
    if (source === null) continue;

    await collect(entry, source, symbols, readSource, new Set([entry]), 0);
  }

  return inventory;
}

/**
 * Record what a module exports, following `export * from './x'` through the
 * barrels it fans out to.
 *
 * Only relative stars are followed: a star into another package is that
 * package's inventory, not this one's, and re-reading it here would attribute
 * its symbols to the wrong layer.
 */
async function collect(
  file: string,
  source: string,
  symbols: Record<string, ExportedSymbol>,
  readSource: ReadSource,
  seen: Set<string>,
  depth: number,
): Promise<void> {
  const deprecations = deprecationsFromSource(source);
  for (const name of exportedSymbolsFromSource(source)) {
    // The nearest definition of a name wins; a star deeper in must not
    // overwrite what the barrel above it already stated.
    if (symbols[name] !== undefined) continue;
    const deprecated = deprecations.has(name);
    symbols[name] = {
      deprecated,
      replacement: deprecated ? (deprecations.get(name) ?? null) : null,
    };
  }

  if (depth >= MAX_STAR_DEPTH) return;

  for (const specifier of starReexportsFromSource(source)) {
    if (!specifier.startsWith('.')) continue;
    const target = await readRelative(file, specifier, readSource);
    if (target === null || seen.has(target.path)) continue;
    seen.add(target.path);
    await collect(target.path, target.source, symbols, readSource, seen, depth + 1);
  }
}

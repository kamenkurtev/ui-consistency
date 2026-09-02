import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readDecisions } from '../knowledge/decisions.js';
import type { PackageInfo } from '../types.js';

export const CONFIG_FILE = '.uicrc.json';

export interface UicConfig {
  /** Package names to leave off every chain. */
  ignore?: string[];
  /**
   * Package names that outrank the dependency graph, nearest first.
   *
   * For a project migrating from one package to its replacement: the old one
   * usually still depends on the new one, so the graph calls the old one
   * nearer and the check would recommend the direction being migrated away
   * from. Which package is the destination is intent, not structure.
   *
   * Prefer `@deprecated` on the old package's exports where you control it —
   * the check already reads it and can name the replacement. This is for when
   * you do not.
   */
  prefer?: string[];
  /** Per-package overrides of what detection found. */
  packages?: Record<string, { dependencies?: string[] }>;
}

/**
 * The project's intent about its layers, from wherever it is written.
 *
 * Two places, on purpose. `.uicrc.json` is where it has always been and keeps
 * working; a decisions file is where intent lives now, and it is the one place
 * a person is asked to write anything. They are merged rather than one
 * replacing the other, because a config that stops being read is a silent
 * change of behaviour in somebody's repository.
 */
export async function readConfig(rootDir: string): Promise<UicConfig | null> {
  const raw = await readFile(join(rootDir, CONFIG_FILE), 'utf8').catch(() => null);
  let config: UicConfig | null = null;
  if (raw !== null) {
    try {
      config = JSON.parse(raw) as UicConfig;
    } catch {
      config = null;
    }
  }

  const decided = await readDecisions(rootDir).catch(() => []);
  const prefer = decided.flatMap((one) => one.prefer);
  const ignore = decided.flatMap((one) => one.ignore);
  if (prefer.length === 0 && ignore.length === 0) return config;

  return {
    ...config,
    // Written intent first: it is the more recent place to say it.
    prefer: [...prefer, ...(config?.prefer ?? [])],
    ignore: [...ignore, ...(config?.ignore ?? [])],
  };
}

export async function writeConfig(rootDir: string, config: UicConfig): Promise<void> {
  await writeFile(join(rootDir, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/**
 * Config is an override, never a prerequisite. Detection alone must produce a
 * usable result, or the first run demands that someone describe their own repo
 * by hand and the tool never gets adopted.
 *
 * An ignored package is removed from the dependencies of whatever reached it
 * too. Left in place it survives as a rootless layer on every chain through
 * it, and ignoring it would accomplish nothing.
 */
export function applyConfig(detected: PackageInfo[], config: UicConfig | null): PackageInfo[] {
  if (config === null) return detected;

  const ignored = new Set(config.ignore ?? []);
  return detected
    .filter((pkg) => !ignored.has(pkg.name))
    .map((pkg) => {
      const override = config.packages?.[pkg.name];
      const dependencies = override?.dependencies ?? pkg.dependencies;
      return { ...pkg, dependencies: dependencies.filter((dep) => !ignored.has(dep)) };
    });
}

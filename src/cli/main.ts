import { sessionResponse } from './session.js';
import { realpath } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/**
 * The whole of the binary: one hook, one command.
 *
 * ~~`uic <pattern|patterns|diff|place|tree|props|group|scan|check|review|shapes|inventory|log|mcp>`.~~
 * **Fourteen commands went in four changes (#77, #78, #81, #89)**, and what is
 * left is the `SessionStart` adapter — a session being told which skills exist
 * and in what order they fire (#9). That is instructions, not a check, which
 * is the whole of what this plugin is now.
 *
 * It stays a subcommand rather than becoming the default, because
 * `hooks/hooks.json` names it and a harness that calls it by name must keep
 * working across the update that removed everything else.
 */
export async function main(argv: string[]): Promise<number> {
  if (argv[0] !== 'session') {
    console.error('Usage: uic session   (read from a SessionStart hook; see hooks/hooks.json)');
    console.error('Everything else this tool did is a skill or a rule now — see README.md.');
    return 1;
  }

  const response = await sessionResponse(await readStdin()).catch(() => null);
  if (response !== null) console.log(JSON.stringify(response));
  return 0;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

// By identity, not by name. This used to be `argv[1].endsWith('uic.mjs')`, so a
// copy of the bundle under any other name — a wrapper, a symlink, a CI step —
// exited 0 having done nothing (#189). `realpath` comes back with symlinks
// already followed, and `argv[1]` is `-` when a script is piped in on stdin,
// which resolving used to throw on.
if (process.argv[1] !== undefined) {
  const entry = await realpath(process.argv[1])
    .then((real) => pathToFileURL(real).href)
    .catch(() => null);
  if (entry === import.meta.url) process.exit(await main(process.argv.slice(2)));
}

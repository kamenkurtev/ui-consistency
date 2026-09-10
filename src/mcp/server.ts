import { createInterface } from 'node:readline';
import { TOOLS, readResource, listResources, type Tool } from './tools.js';
import { VERSION } from '../version.js';
import { findProjectRoot } from '../layers/detect.js';

/**
 * The fourth adapter, and the only surface every harness has.
 *
 * `CLAUDE.md` states the limitation plainly: Claude Code is the only harness
 * with the `PostToolUse` gate wired, so under Codex, Cursor and Gemini CLI the
 * skills and the CLI are the whole surface and #27 — the pattern reaching the
 * agent *before* the write — has no mechanism at all. An MCP server is the one
 * thing all four have, that the agent can reach on its own initiative, and that
 * needs nobody to run a command (#33).
 *
 * **A thin adapter over the existing core and nothing else.** Every tool calls
 * a function the core already computes and returns what it returned. The moment
 * a threshold or a fact lives here it is a second implementation, which this
 * repository's own rule forbids: where two places would carry the same
 * knowledge, only one may exist.
 *
 * ## Why the protocol is written out by hand
 *
 * `@modelcontextprotocol/sdk` would be a fourth runtime dependency and a second
 * bundle, against a promise this project keeps everywhere else: Node 20, no
 * install, nothing to configure, one file. What is actually needed of the
 * protocol is six methods over newline-delimited JSON, and that is what is
 * here. The server is a subcommand of the same bundle — `uic mcp` — so there is
 * one artifact, one build, and one stale-bundle check.
 *
 * The three core functions the tools reach for used to live in
 * `src/cli/index.ts`, which made this module import the CLI — and that cycle
 * is why they are now in `src/core/project.ts`. Two reasons, and the second was
 * not obvious: a **dynamic** import into a bundled cycle never settles, so the
 * process exited 13 having written nothing; and nothing in that file is safe to
 * call from here anyway, because all of it prints, and a single stray write to
 * stdout corrupts this stream.
 *
 * ## The two rules of stdio, which are easy to break silently
 *
 * **Nothing may be written to stdout that is not a message**, and messages
 * **must not contain embedded newlines** — the spec says both, and either
 * mistake is a server that connects to nothing and reads as a configuration
 * problem. So every write goes through {@link send}, which serializes with
 * `JSON.stringify` and no indentation, and the core functions this calls were
 * checked for printing: the CLI's own commands print, and none of them is
 * called from here. Logging goes to stderr, which the spec allows.
 */
export async function serveMcp(rootDir: string): Promise<number> {
  // **Said once, at startup, on stderr.** The root is the working directory the
  // harness started this in, and a harness that starts it beside the plugin
  // instead of in the project would answer every question about the wrong
  // tree — quietly, and looking exactly like a project that has written
  // nothing down. Stderr is where the spec allows a server to talk, and this
  // is the one thing worth saying there.
  const bounded = await findProjectRoot(rootDir);
  process.stderr.write(
    bounded === null
      ? `ui-consistency: started in ${rootDir}, where no package.json bounds a project. Every answer will be about that directory.\n`
      : `ui-consistency: answering about ${rootDir}\n`,
  );

  const lines = createInterface({ input: process.stdin });

  for await (const line of lines) {
    const text = line.trim();
    if (text === '') continue;

    let message: unknown;
    try {
      message = JSON.parse(text);
    } catch {
      // No id to answer against, so there is nothing to reply to. Said on
      // stderr rather than swallowed: a stream this server cannot read is
      // exactly the failure that otherwise looks like a wedged harness.
      process.stderr.write('ui-consistency: unreadable message on stdin\n');
      continue;
    }

    const request = message as { id?: unknown; method?: unknown; params?: unknown };
    // A notification has no id and takes no reply — `notifications/initialized`
    // is the one that always arrives. Answering it would put an unrequested
    // response on the stream.
    if (request.id === undefined || request.id === null) continue;
    if (typeof request.method !== 'string') {
      send({ jsonrpc: '2.0', id: request.id, error: { code: -32600, message: 'No method' } });
      continue;
    }

    try {
      const result = await answer(rootDir, request.method, request.params);
      if (result === UNKNOWN) {
        send({
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32601, message: `Unknown method: ${request.method}` },
        });
        continue;
      }
      send({ jsonrpc: '2.0', id: request.id, result });
    } catch (error) {
      // **Degrade to silence, never to a wrong answer.** A tool that throws
      // returns an error to the caller, which the agent can read as *this said
      // nothing* — the same failure direction as everything else here, where a
      // miss is acceptable and an invented finding is not.
      send({
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32603, message: reason(error) },
      });
    }
  }

  return 0;
}

/** The marker for a method this server does not implement. */
const UNKNOWN = Symbol('unknown method');

/**
 * The protocol version this was written against.
 *
 * Echoed back only where the client asked for it. The spec requires the server
 * to answer with the *same* version where it supports what was asked and with
 * one of its own otherwise, and hardcoding the answer is how a client on a
 * newer version is told something untrue about what it is talking to.
 */
const PROTOCOL = '2025-06-18';

async function answer(rootDir: string, method: string, params: unknown): Promise<unknown> {
  const args = (params ?? {}) as Record<string, unknown>;

  if (method === 'initialize') {
    const asked = typeof args.protocolVersion === 'string' ? args.protocolVersion : null;
    return {
      // Same version where the client named one; ours where it named nothing.
      // A client that cannot live with the answer disconnects, which is its
      // decision to make and not one to pre-empt by refusing.
      protocolVersion: asked ?? PROTOCOL,
      capabilities: { tools: {}, resources: {} },
      serverInfo: { name: 'ui-consistency', version: VERSION },
      // Where the answers come from, said once rather than in six tool
      // descriptions. The context cost of this surface is every schema in
      // every session, so nothing is repeated that can be said here.
      instructions:
        `Facts about the screens in ${rootDir}, derived from its own code. ` +
        'Nothing here calls a model, writes a file or fails anything. ' +
        'Read the pattern for a kind before writing a screen of it.',
    };
  }
  if (method === 'ping') return {};
  if (method === 'tools/list') {
    return { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) };
  }
  if (method === 'tools/call') {
    const name = typeof args.name === 'string' ? args.name : '';
    const tool = TOOLS.find((one) => one.name === name);
    if (tool === undefined) throw new Error(`No such tool: ${name || '(unnamed)'}`);
    return await callTool(rootDir, tool, (args.arguments ?? {}) as Record<string, unknown>);
  }
  if (method === 'resources/list') return { resources: await listResources(rootDir) };
  if (method === 'resources/read') {
    const uri = typeof args.uri === 'string' ? args.uri : '';
    return { contents: [await readResource(rootDir, uri)] };
  }

  return UNKNOWN;
}

/**
 * One tool call, and its answer as the protocol wants it.
 *
 * `isError` rather than a JSON-RPC error where the tool ran and had nothing to
 * say for a reason the caller can act on — a path that is not in this project,
 * a screen with no family. That distinction is the whole of what the CLI says
 * with an exit code and a sentence on stderr, and losing it here would turn
 * *this project has written nothing down* into *the server is broken*.
 */
async function callTool(
  rootDir: string,
  tool: Tool,
  args: Record<string, unknown>,
): Promise<unknown> {
  const answered = await tool.run(rootDir, args);
  return {
    content: [{ type: 'text', text: answered.text }],
    ...(answered.failed === true ? { isError: true } : {}),
  };
}

/** Serialized on one line, because a message may not contain a newline. */
function send(message: unknown): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

const reason = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong';

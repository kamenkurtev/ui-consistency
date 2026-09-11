import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The MCP server, exercised as the harness starts it: the **built bundle**, as
 * a subprocess, over stdio.
 *
 * Nothing here imports the TypeScript. The two failures this surface can have
 * are both invisible from a unit test — a bundle whose module cycle never
 * settles, and a stray write to stdout that corrupts the stream — and the first
 * of them happened: `uic mcp` exited 13 with *"unsettled top-level await"* the
 * first time it was run from the bundle, while every test passed (#33).
 */
const binary = fileURLToPath(new URL('../../bin/uic.mjs', import.meta.url));

interface Session {
  /** Every reply, in order, parsed. */
  replies: Record<string, unknown>[];
  stderr: string;
  code: number;
}

/** One conversation with the server: send these lines, read what comes back. */
function talk(messages: unknown[], cwd: string): Promise<Session> {
  // A string message is sent **as written**, so a test can put something on
  // the stream that is not JSON at all. Passing it through `JSON.stringify`
  // would quote it into a perfectly valid JSON string, which is the opposite
  // of what such a test is for.
  return new Promise((done) => {
    const child = execFile(process.execPath, [binary, 'mcp'], { cwd }, (error, stdout, stderr) => {
      const code =
        error === null ? 0 : typeof error.code === 'number' ? error.code : Number(error.code ?? 1);
      done({
        replies: stdout
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line) => JSON.parse(line) as Record<string, unknown>),
        stderr,
        code,
      });
    });
    child.stdin?.end(
      `${messages.map((one) => (typeof one === 'string' ? one : JSON.stringify(one))).join('\n')}\n`,
    );
  });
}

const HELLO = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2025-06-18', clientInfo: { name: 'test', version: '1' } },
};

const call = (name: string, args: Record<string, unknown>): unknown => ({
  jsonrpc: '2.0',
  id: 9,
  method: 'tools/call',
  params: { name, arguments: args },
});

/** The text of a `tools/call` reply, and whether the tool said it failed. */
const answered = (session: Session): { text: string; isError: boolean } => {
  const last = session.replies.at(-1) as
    | { result?: { content?: { text?: string }[]; isError?: boolean }; error?: { message: string } }
    | undefined;
  if (last?.error !== undefined) return { text: `RPC ERROR: ${last.error.message}`, isError: true };
  return { text: last?.result?.content?.[0]?.text ?? '', isError: last?.result?.isError === true };
};

/**
 * A holder and a real child, not a holder and a `<div />`.
 *
 * The child has to be a component or the tree is one node — which `uic group`
 * now reports as having no shape to group by (#58), correctly, and which made
 * this fixture exercise the `group` tool over nothing.
 */
const page = (name: string): string =>
  [
    "import { PageShell } from '../ui/PageShell';",
    `import { ${name}Grid } from '../ui/${name}Grid';`,
    `export function ${name}Page() {`,
    `  return <PageShell title="${name}" data-testid="${name.toLowerCase()}-page" density="compact"><${name}Grid /></PageShell>;`,
    '}',
  ].join('\n');

let root: string;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'uic-mcp-'));
  await mkdir(join(root, 'src/pages'), { recursive: true });
  await mkdir(join(root, 'src/ui'), { recursive: true });
  await writeFile(join(root, 'package.json'), '{"name":"mcp-fixture"}');
  await writeFile(join(root, 'src/ui/PageShell.tsx'), 'export const PageShell = (p: any) => <div {...p} />;');
  for (const name of ['Orders', 'Invoices', 'Customers', 'Reports']) {
    await writeFile(join(root, `src/pages/${name}Page.tsx`), page(name));
    await writeFile(join(root, `src/ui/${name}Grid.tsx`), `export const ${name}Grid = () => <table />;`);
  }
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('the MCP server, from the built bundle', () => {
  /**
   * The one that would have caught the first defect. A bundled dynamic import
   * into a module cycle never settles, so the process exits 13 having written
   * nothing — which from a harness is indistinguishable from a server that was
   * never configured.
   */
  it('starts, answers the handshake, and exits 0 when stdin closes', async () => {
    const session = await talk([HELLO, { jsonrpc: '2.0', method: 'notifications/initialized' }], root);

    expect(session.code).toBe(0);
    expect(session.stderr).not.toContain('unsettled');
    // The notification takes no reply. Answering it would put an unrequested
    // response on the stream.
    expect(session.replies).toHaveLength(1);

    const result = session.replies[0]!.result as Record<string, unknown>;
    expect(result.protocolVersion).toBe('2025-06-18');
    expect((result.serverInfo as { name: string }).name).toBe('ui-consistency');
    // Where the answers are about, so a server started in the wrong directory
    // is diagnosable rather than merely wrong.
    expect(session.stderr).toContain(root);
  });

  /**
   * The spec: answer with the version the client asked for where it is
   * supported, and with one of the server's own otherwise. Hardcoding the
   * answer tells a client on another version something untrue.
   */
  it('echoes the version the client asked for', async () => {
    const session = await talk(
      [{ ...HELLO, params: { ...HELLO.params, protocolVersion: '2024-11-05' } }],
      root,
    );
    expect((session.replies[0]!.result as { protocolVersion: string }).protocolVersion).toBe('2024-11-05');
  });

  it('lists exactly the six tools, with one line each', async () => {
    const session = await talk([HELLO, { jsonrpc: '2.0', id: 2, method: 'tools/list' }], root);
    const { tools } = session.replies[1]!.result as {
      tools: { name: string; description: string; inputSchema: { properties: unknown } }[];
    };

    expect(tools.map((one) => one.name)).toEqual([
      'pattern',
      'deviations',
      'tree',
      'props',
      'group',
      'findings',
    ]);
    // The context cost is every schema in every session whether or not any UI
    // work happens, so the descriptions stay one line and the count stays six.
    for (const one of tools) expect(one.description).not.toContain('\n');
    expect(tools.every((one) => one.inputSchema.properties !== undefined)).toBe(true);
  });

  /**
   * Nothing may reach stdout that is not a message, and no message may contain
   * an embedded newline. Both are spec requirements and both are silent
   * failures: the client sees a stream it cannot parse and reports a broken
   * server.
   */
  it('writes nothing to stdout but one-line messages', async () => {
    const session = await talk(
      [
        HELLO,
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
        call('findings', { files: ['src/pages/OrdersPage.tsx'] }),
        call('pattern', { screen: 'src/pages/OrdersPage.tsx' }),
      ],
      root,
    );

    // Every line parsed on the way in, so a stray print would have thrown.
    expect(session.replies).toHaveLength(4);
    for (const reply of session.replies) expect(reply.jsonrpc).toBe('2.0');
  });

  it('answers each of the six over the same project', async () => {
    const files = ['src/pages/OrdersPage.tsx', 'src/pages/InvoicesPage.tsx'];

    const pattern = answered(await talk([HELLO, call('pattern', { screen: files[0]! })], root));
    expect(pattern.isError).toBe(false);
    expect(pattern.text).toContain('"holder": "PageShell"');

    const tree = answered(await talk([HELLO, call('tree', { screen: files[0]! })], root));
    expect(tree.text).toContain('"name": "PageShell"');
    // Project-relative. The walk records absolute paths, which would put this
    // machine's directory layout into the agent's context.
    expect(tree.text).not.toContain(root);

    const props = answered(await talk([HELLO, call('props', { component: 'PageShell', files })], root));
    expect(props.text).toContain('density');

    const group = answered(await talk([HELLO, call('group', { files })], root));
    expect(group.text).toContain('PageShell');

    const findings = answered(await talk([HELLO, call('findings', { files })], root));
    // Empty is a real answer and is not the same as clean, so it says what it
    // read rather than nothing at all.
    expect(findings.text).toContain('That is what was read, not a grade.');
  });

  /**
   * *This project has written nothing down* must not read as *the server is
   * broken*. It is the commonest honest answer the tool gives.
   */
  it('says a screen is the first of its kind rather than failing', async () => {
    const alone = await mkdtemp(join(tmpdir(), 'uic-mcp-alone-'));
    await mkdir(join(alone, 'src'), { recursive: true });
    await writeFile(join(alone, 'package.json'), '{"name":"alone"}');
    await writeFile(join(alone, 'src/OnlyPage.tsx'), page('Only').replace('../ui/', './ui/'));

    const { text, isError } = answered(await talk([HELLO, call('pattern', { screen: 'src/OnlyPage.tsx' })], alone));

    expect(isError).toBe(true);
    expect(text).toContain('first of its kind');
    // A tool result, not a protocol error: the caller has to be able to act on
    // it, and a JSON-RPC error reads as a malfunction.
    expect(text).not.toContain('RPC ERROR');

    await rm(alone, { recursive: true, force: true });
  });

  describe('what it refuses', () => {
    it('refuses a path outside the project, and names the root it answers about', async () => {
      const { text, isError } = answered(
        await talk([HELLO, call('findings', { files: ['../../../etc/hosts'] })], root),
      );
      expect(isError).toBe(true);
      expect(text).toContain('outside');
      expect(text).toContain(root);
    });

    it('refuses an absolute path outside the project', async () => {
      const { isError, text } = answered(await talk([HELLO, call('tree', { screen: '/etc/hosts' })], root));
      expect(isError).toBe(true);
      expect(text).toContain('outside');
    });

    /**
     * The class of wrong call this surface exists to remove. Over the CLI a
     * quoted `"src/**\/*.tsx"` arrives literally and names no file; over MCP the
     * parameter is an array, so a glob is a mistake with a name.
     */
    it('names a glob as a glob rather than as a missing file', async () => {
      const { text, isError } = answered(await talk([HELLO, call('findings', { files: ['src/**/*.tsx'] })], root));
      expect(isError).toBe(true);
      expect(text).toContain('is a glob');
    });

    it('refuses every bad path rather than measuring the rest in silence', async () => {
      const { text, isError } = answered(
        await talk(
          [HELLO, call('findings', { files: ['src/pages/OrdersPage.tsx', 'src/pages/Nope.tsx'] })],
          root,
        ),
      );
      expect(isError).toBe(true);
      expect(text).toContain('Nope.tsx');
    });

    it('refuses an unreadable message without answering it, and keeps serving', async () => {
      const session = await talk([HELLO, 'not json at all', { jsonrpc: '2.0', id: 3, method: 'ping' }], root);
      expect(session.code).toBe(0);
      expect(session.stderr).toContain('unreadable message');
      // The handshake and the ping, and nothing for the rubbish in between.
      expect(session.replies).toHaveLength(2);
      expect(session.replies[1]!.result).toEqual({});
    });

    it('answers an unknown method with an error rather than exiting', async () => {
      const session = await talk([HELLO, { jsonrpc: '2.0', id: 4, method: 'nonsense/here' }], root);
      expect(session.code).toBe(0);
      expect((session.replies[1]!.error as { code: number }).code).toBe(-32601);
    });
  });

  describe('the pattern files, as resources', () => {
    it('lists none where none is written down, which is not an error', async () => {
      const session = await talk([HELLO, { jsonrpc: '2.0', id: 2, method: 'resources/list' }], root);
      expect((session.replies[1]!.result as { resources: unknown[] }).resources).toEqual([]);
    });

    it('lists and reads what the project wrote, and refuses a URI it did not list', async () => {
      const held = await mkdtemp(join(tmpdir(), 'uic-mcp-res-'));
      await mkdir(join(held, '.ui-consistency/patterns'), { recursive: true });
      await writeFile(join(held, 'package.json'), '{"name":"held"}');
      await writeFile(
        join(held, '.ui-consistency/patterns/page-shell.md'),
        '---\npattern: page-shell\nholder: PageShell\nderived: true\n---\n\n' +
          '## Where it is used\n\n`src/pages/OrdersPage.tsx`\n',
      );

      const listed = await talk([HELLO, { jsonrpc: '2.0', id: 2, method: 'resources/list' }], held);
      const { resources } = listed.replies[1]!.result as {
        resources: { uri: string; name: string; description: string }[];
      };
      expect(resources).toHaveLength(1);
      expect(resources[0]!.uri).toBe('uic://patterns/page-shell.md');
      // Whether a person has approved it is the thing a reader needs first.
      expect(resources[0]!.description).toContain('derived, not yet approved');

      const read = await talk(
        [HELLO, { jsonrpc: '2.0', id: 3, method: 'resources/read', params: { uri: resources[0]!.uri } }],
        held,
      );
      const { contents } = read.replies[1]!.result as { contents: { text: string }[] };
      expect(contents[0]!.text).toContain('pattern: page-shell');

      /**
       * Enumerated, never joined. `join(dir, name)` with a name from the client
       * reads outside the knowledge directory, and the defence that held in
       * #28's refresh was that the path came from `readdir` rather than from
       * anything a caller wrote.
       */
      for (const escape of [
        'uic://patterns/../../../../etc/passwd',
        'uic://patterns/..%2F..%2Fetc%2Fpasswd',
        'file:///etc/passwd',
      ]) {
        const out = await talk(
          [HELLO, { jsonrpc: '2.0', id: 4, method: 'resources/read', params: { uri: escape } }],
          held,
        );
        expect((out.replies[1]!.error as { message: string }).message).toContain('No such resource');
      }

      await rm(held, { recursive: true, force: true });
    });
  });
});

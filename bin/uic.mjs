#!/usr/bin/env node

// src/core/off.ts
var SILENCED = () => {
  const value = process.env["UIC_OFF"];
  return value !== void 0 && value !== "" && value.toLowerCase() !== "0" && value.toLowerCase() !== "false";
};

// src/cli/session.ts
import { readdir as readdir2, open } from "node:fs/promises";
import { join } from "node:path";

// src/knowledge/generated.ts
var MARKER = /<!--\s*uic:generated\b[^>]*-->/i;
var MARKER_WINDOW = 512;
function generatedVersion(source) {
  const marker = MARKER.exec(source.slice(0, MARKER_WINDOW));
  if (marker === null) return null;
  return /\bv=([\w.-]+)/.exec(marker[0])?.[1] ?? null;
}

// src/version.ts
var VERSION = "0.21.0";

// src/knowledge/paths.ts
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
var KNOWLEDGE_DIR = ".ui-consistency";
var LEGACY_KNOWLEDGE_DIR = ".claude/ui-consistency";
async function knowledgeDir(rootDir, sub = "") {
  const inside = async (base) => {
    const entries = await readdir(resolve(rootDir, base, sub)).catch(() => null);
    return entries !== null && entries.length > 0;
  };
  if (await inside(KNOWLEDGE_DIR)) {
    return { dir: resolve(rootDir, KNOWLEDGE_DIR, sub), legacy: false };
  }
  if (await inside(LEGACY_KNOWLEDGE_DIR)) {
    return { dir: resolve(rootDir, LEGACY_KNOWLEDGE_DIR, sub), legacy: true };
  }
  return { dir: resolve(rootDir, KNOWLEDGE_DIR, sub), legacy: false };
}
var MOVED = `${LEGACY_KNOWLEDGE_DIR}/ is the old location and is still read. Move it to ${KNOWLEDGE_DIR}/ \u2014 it is your project's intent, not one agent's configuration.`;

// src/cli/session.ts
function shapeFor(env, context) {
  if (env["CURSOR_PLUGIN_ROOT"] !== void 0) return { additional_context: context };
  if (env["CLAUDE_PLUGIN_ROOT"] !== void 0 && env["COPILOT_CLI"] === void 0) {
    return { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } };
  }
  return { additionalContext: context };
}
var HEAD = 512;
var MAX_FILES = 12;
async function firstBytes(path) {
  const handle = await open(path, "r").catch(() => null);
  if (handle === null) return null;
  try {
    const buffer = Buffer.alloc(HEAD);
    const { bytesRead } = await handle.read(buffer, 0, HEAD, 0);
    return buffer.subarray(0, bytesRead).toString("utf8");
  } catch {
    return null;
  } finally {
    await handle.close().catch(() => void 0);
  }
}
var STANDING = [
  "ui-consistency \u2014 for anything the end user will see, these join the phases of",
  "whatever process is already running, and run the phases themselves when none is.",
  "Use them without being asked.",
  "",
  "- A new page or feature, or a refactor across pages:",
  "  ui-consistency:finding-patterns \u2192 ui-consistency:planning",
  "  \u2192 ui-consistency:implementing \u2192 ui-consistency:verifying",
  "- A small change to one page: finding-patterns (only what it touches)",
  "  \u2192 implementing \u2192 verifying.",
  "- Checking code already written: verifying.",
  "- Can it be read, can it be used without a mouse \u2014 contrast, focus, keyboard,",
  "  a field and its label, text alternatives, target size:",
  "  ui-consistency:accessibility, with or without a pattern file.",
  "",
  "If a spec or plan for this work already exists, add to it instead of starting",
  "another. Ask the user once, only about contradictions and proposals."
].join("\n");
async function sessionContext(rootDir) {
  const { dir, legacy } = await knowledgeDir(rootDir);
  const entries = await readdir2(dir).catch(() => null);
  const files = (entries ?? []).filter((name) => /\.md$/i.test(name)).sort();
  const said = [STANDING];
  const versions = /* @__PURE__ */ new Set();
  for (const name of files.slice(0, MAX_FILES)) {
    const head = await firstBytes(join(dir, name));
    if (head === null) continue;
    const version = generatedVersion(head);
    if (version !== null && version !== VERSION) versions.add(version);
  }
  if (legacy) said.push(`ui-consistency: ${MOVED}`);
  if (versions.size > 0) {
    said.push(
      [
        `ui-consistency: the generated part of ${KNOWLEDGE_DIR}/ was written by`,
        `plugin ${[...versions].sort().join(", ")}; this is ${VERSION}.`,
        "Nothing generates those files any more. They are a stored copy of what the",
        `code says, which is the thing that goes stale \u2014 keep whatever in them was`,
        `intent, in ${KNOWLEDGE_DIR}/patterns/, and delete the rest.`
      ].join(" ")
    );
  }
  return said.join("\n\n");
}
async function sessionResponse(stdin) {
  if (SILENCED()) return null;
  let cwd = process.cwd();
  try {
    const parsed = JSON.parse(stdin);
    const payload = parsed;
    if (typeof payload?.cwd === "string" && payload.cwd !== "") cwd = payload.cwd;
  } catch {
  }
  const context = await sessionContext(cwd).catch(() => null);
  if (context === null) return null;
  return shapeFor(process.env, context);
}

// src/cli/main.ts
import { realpath } from "node:fs/promises";
import { pathToFileURL } from "node:url";
async function main(argv) {
  if (argv[0] !== "session") {
    console.error("Usage: uic session   (read from a SessionStart hook; see hooks/hooks.json)");
    console.error("Everything else this tool did is a skill or a rule now \u2014 see README.md.");
    return 1;
  }
  const response = await sessionResponse(await readStdin()).catch(() => null);
  if (response !== null) console.log(JSON.stringify(response));
  return 0;
}
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
if (process.argv[1] !== void 0) {
  const entry = await realpath(process.argv[1]).then((real) => pathToFileURL(real).href).catch(() => null);
  if (entry === import.meta.url) process.exit(await main(process.argv.slice(2)));
}
export {
  main
};

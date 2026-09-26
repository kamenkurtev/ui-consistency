#!/usr/bin/env node

// src/cli/session.ts
import { readdir } from "node:fs/promises";
import { join } from "node:path";
function shapeFor(env, context) {
  if (env["CURSOR_PLUGIN_ROOT"] !== void 0) return { additional_context: context };
  if (env["CLAUDE_PLUGIN_ROOT"] !== void 0 && env["COPILOT_CLI"] === void 0) {
    return { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } };
  }
  return { additionalContext: context };
}
var STANDING = [
  "ui-consistency \u2014 for anything the end user will see, these join the phases of",
  "whatever process is already running, and run the phases themselves when none is.",
  "Use them without being asked.",
  "",
  "- A new page or feature, or a refactor across pages:",
  "  ui-consistency:finding-patterns \u2192 ui-consistency:planning",
  "  \u2192 ui-consistency:implementing \u2192 ui-consistency:verifying",
  "- A small change to one page: ui-consistency:adjusting \u2192 implementing",
  "  \u2192 verifying. The check is never the part that gets dropped.",
  "- Checking code already written: verifying \u2014 after finding-patterns where no",
  "  checklist exists yet.",
  "- A page's design, or one to agree before building: ui-consistency:design.",
  "  It draws only when asked.",
  "- Called by the phases when a step needs them: ui-consistency:values,",
  "  ui-consistency:conventions, ui-consistency:decisions.",
  "- An accessibility standard, only when asked or required by the project:",
  "  ui-consistency:accessibility.",
  "",
  "If a process running this work has a spec or plan, add to it, and run",
  "finding-patterns before its first task that changes what the user sees is",
  "handed to anyone, whichever process wrote it. Decide by the order the skills carry and report",
  "what settled each decision; ask only where it ties and the change reaches",
  "outside the task, or before a component the request did not name is created",
  "or code is extracted into one."
].join("\n");
var LEFT_BEHIND = [".ui-consistency", ".claude/ui-consistency"];
async function sessionContext(rootDir) {
  const said = [STANDING];
  const found = [];
  for (const dir of LEFT_BEHIND) {
    const entries = await readdir(join(rootDir, dir)).catch(() => null);
    if (entries !== null && entries.length > 0) found.push(`${dir}/`);
  }
  if (found.length > 0) {
    said.push(
      [
        `ui-consistency: ${found.join(" and ")} ${found.length > 1 ? "were" : "was"} written by an older version`,
        "of this plugin, which no longer writes into the repository and reads nothing",
        "there. It can be deleted. A decision a person recorded in it belongs wherever",
        "the process you are running records decisions."
      ].join(" ")
    );
  }
  return said.join("\n\n");
}
async function sessionResponse(stdin) {
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
    console.error("Usage: uic session   (run by the plugin's SessionStart hook; see hooks/hooks.json)");
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

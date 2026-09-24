---
name: uic-writing
description: Writes and edits this plugin's skills and documents to Anthropic's skill authoring practices, then finds and fixes the stale references and contradictions the edit left. Use when changing a skill, USING.md, README.md, CLAUDE.md, AGENTS.md, CONTRIBUTING.md, docs/ or .claude/rules/ in this repository.
paths:
  - skills/**
  - USING.md
  - README.md
  - CLAUDE.md
  - AGENTS.md
  - CONTRIBUTING.md
  - docs/**
  - .claude/rules/**
  - .claude/skills/**
---

# Writing the plugin

## Overview

The plugin is Markdown an agent acts on. Judge a change by one thing — whether the plugin gets more effective: fewer words for the agent to carry, clearer steps, better results on real projects.

## While writing

Anthropic's skill authoring guide (https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), applied here.

**What goes in**

- Only what the model does not already know: an instruction, a definition, a template or an example.
- No story of an earlier run, no history of the plugin, no argument for its design, no maxim.
- Keep a clause of why where it changes a judgment.
- Keep a concrete failure where it shows a rule nobody would guess.
- Earlier issues, commits and decisions are not arguments for or against a change; how the plugin behaves now is.

**How a line is written**

- One instruction to a line, in the imperative: what to do, not how it was arrived at.
- Write an exception as its own line, its condition first — *If …, …* — never as a clause inside the rule it limits.

**A `SKILL.md`**

- Frontmatter, title, `## Overview` in one or two sentences, then the steps in order.
- Under 500 lines and 16,000 characters: after compaction Claude Code re-attaches only the first 5,000 tokens of a skill (https://code.claude.com/docs/en/skills, *Skill content lifecycle*).

**A reference file**

- Title, then one line `**Read when:** …`, then `## Contents` when it runs over 100 lines.
- Link it directly from the `SKILL.md` that needs it, never only from another reference file.

**A description**

- Say what the skill does, then *Use when …* with the words a request uses.
- Do not summarise the steps.
- Third person, at most 1,024 characters, no XML tags.
- A shipped skill's description says in its first words that the work is what an end user sees.

**Terms and rules**

- One term per meaning. In a shipped skill, use the terms as `skills/finding-patterns/words.md` defines them.
- Say a rule once inside a skill, where it is first needed, and link it everywhere else in that skill.
- Keep a rule repeated across skills: each skill can be loaded alone.

## After writing

Before the change is done:

1. **Stale references.** Search for every file, section, skill, test and command the changed text names; each must still exist.
2. **Contradictions.** For every rule the change touched, search for its other copies — in other words as well as the same ones — in `skills/`, `USING.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/`, `.claude/rules/` and `.claude/skills/`.
   - Each copy now says the same thing, or the change is not done.
3. **Fix every stale reference and every contradiction in the same change**, and say in the pull request which copies were found.
4. **One fresh read, once — if a skill changed.** Hand a subagent with no other context the diff of the changed skill files, and those files in full as context only — with `skills/finding-patterns/words.md` if a shipped skill changed. Ask it about the **changed lines only**:
   - a changed line that can be read two ways;
   - a changed line that disagrees with any line of the full files;
   - a word a changed line uses in a sense different from its other uses in the full files — or, in a shipped skill, a term `words.md` does not define.

   Ask for at most five items, ranked by how much each changes what an agent does. Then:

   - Fix every item that changes what an agent does. If a changed line disagrees with older wording, fix the pair, as step 2 asks.
   - Say in the pull request what was fixed and name any other item; "nothing" is a result.
   - Leave older wording that no changed line touches or contradicts: reviewing whole files is `/uic-auditing`'s, run by hand.
   - Do the read once. Do not repeat it after the fixes, and never run the skill on a project for it.
   - If the harness has no subagents, skip it and say so.

How a wrong statement is corrected, and what may never be written publicly, is `.claude/rules/uic-docs.md`.

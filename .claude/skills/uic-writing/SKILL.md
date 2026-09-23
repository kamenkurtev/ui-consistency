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

The plugin is Markdown an agent acts on, and a change is judged by one thing: whether the plugin gets more effective — fewer words for the agent to carry, clearer steps, better results on real projects. Earlier issues, commits and concepts are not arguments for or against a change; how the plugin behaves now is.

## While writing

Anthropic's skill authoring guide (https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), applied here:

- **Only what the model does not already know**: an instruction, a definition, a template or an example. No story of an earlier run, no history of the plugin, no argument for its design, no maxim. A clause of why stays where it changes a judgment; a concrete failure stays where it shows a rule nobody would guess.
- **A `SKILL.md`**: frontmatter, title, `## Overview` in one or two sentences, then the steps in order. Under 500 lines.
- **A reference file**: title, then one line `**Read when:** …`, then `## Contents` when it runs over 100 lines. Linked from the `SKILL.md` that needs it, one level deep.
- **A description** says what the skill does, then *Use when …* with the words a request uses, and does not summarise the steps. Third person, at most 1,024 characters, no XML tags. A shipped skill's description says in its first words that the work is what an end user sees.
- **One term per concept**, as `skills/finding-patterns/words.md` defines them.
- **A rule is said once inside a skill**, where it is first needed, and linked everywhere else in that skill. A rule repeated across skills stays: each skill can be loaded alone.

## After writing

Before the change is done:

1. **Stale references.** Every file, section, skill, test and command the changed text names still exists. Search for each one.
2. **Contradictions.** For every rule the change touched, search for its other copies — in other words as well as the same ones — in `skills/`, `USING.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/`, `.claude/rules/` and `.claude/skills/`. Each now says the same thing, or the change is not done.
3. **Fix both in the same change**, and say in the pull request which copies were found.

How a wrong statement is corrected, and what may never be written publicly, is `.claude/rules/uic-docs.md`.

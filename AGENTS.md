# ui-consistency

> **The CLI half of this is being withdrawn (#76).** Decided 2026-09-12: the
> TypeScript goes and the skills library becomes the whole of it. What follows
> describes what exists today and still works — read it as that, never as a
> statement of direction. The rules below are the half that survives.

A skills library plus a small deterministic CLI, for keeping the screens an
agent writes consistent with the ones a project already has.

It does not grade finished code. It establishes what screens of a kind already
look like **here** — the holder and the order of the roles, which component
fills each role, the props most of them are written with and how many, what the
layout already provides, and what belongs to the reference page alone — and
writes that down to build from. Afterwards it compares the screens that changed
against the same thing.

What it writes down is a **pattern file**: one Markdown file per pattern in
`.ui-consistency/patterns/`, committed and reviewed. Where nothing has been
written down about the kind, `ui-consistency:pattern` writes the measured half of
one — marked `derived: true` and dated, with the parts no reading of the code can
produce named as missing. Nobody is asked anything, and nothing about it is
approval. Prose with a structure block, named slots, per-component props with
the strength of each, and rules in sentences. `ui-consistency:verify` reads a
finished set against it and says separately what it could not evaluate.

~~A command wrote that file and another compared against it.~~ **Both are gone
(#77): the agent reads the family's screens and writes the sentences.** 2 839
lines answered *"these 8 share `PageLayout`; 7 of 7 write a test id"*, which is
what opening 8 files answers — and it could never add the two things the file
most needs: **why** a screen differs, and what a slot is allowed to hold
instead.

## The rules

Plain Markdown under `rules/`, and **the portable half of this plugin**. They
carry the knowledge that keeps breaking when it is written as a list in a
program, they need no derived facts, and they work on every harness — including
the three that have no hook.

| Rule | What it settles |
| --- | --- |
| `anatomy.md` | the roles a screen has, in the order they are read, each as a question |
| `what-a-screen-is.md` | how many files a screen is, per framework — Angular's is a pair, and a router's is a folder |
| `family-and-particulars.md` | where a family comes from, and *reference minus invariant*: what must not be copied |
| `roles-and-names.md` | roles are universal, names are local, and an empty answer is not a clean one |
| `routes-and-breadcrumbs.md` | where a route and a trail come from, per router family |
| `what-a-decision-is.md` | what belongs in a decisions file, and the one test for it |
| `pattern-file.md` | what a pattern file states and how — the artifact the work is done from |
| `raw-values.md` | no colour literal, no absolute length, no emoji where an icon belongs — and the four exceptions that stop it flooding |

Read them directly if your harness has no skill mechanism: they are the
instructions, and the CLI below is the fact supplier.

## The skills

| Skill | When |
| --- | --- |
| `pattern` | before writing or changing screens — establishes the contract |
| ~~`place` (via `uic place`)~~ | where a new screen goes: folder, route, trail — **`rules/routes-and-breadcrumbs.md` now (#78)**, which carries what the reader knew and more: what mounts a pathless array, when a path composes and the four times it must not, and paths written as constants |
| `screen` | writing one screen against the contract |
| `rollout` | applying an agreed pattern across many screens |
| `verify` | before handing the work over |
| `review` | a second opinion on one screen |
| `decide` | the first screen of a kind, when there is nothing to derive |
| `reach` | which of three silences you are looking at |

### The order, and it is not conditional

When the work is about screens, this is the order. **Do not wait to be asked.**

1. `pattern` — BEFORE writing or changing a screen. A screen written first and
   corrected after is a screen somebody has to be persuaded to change, and a
   correction declined teaches that the whole channel is skippable. Where the
   project has written nothing down about the kind, **establish it rather than
   asking for it**: take the screen being changed or one beside it and write
   the pattern down first.
2. `decide` — where `pattern` finds fewer than three screens of the kind. It
   asks; it does not draft. The first screen of a kind is a decision, not a
   derivation.
3. `screen` for one, `rollout` for many. `rollout` queues them and verifies the
   whole set rather than trusting thirty separate turns. **Nobody has to ask for
   it**: the shape of the work is what decides, so a prompt naming a set —
   *all the*, *every*, *the rest* — is a rollout whether or not the word was
   typed. ~~Under Claude Code the prompt hook says so; here this line is the
   whole of the trigger.~~ **This line and `rollout`'s own description are the
   whole of the trigger on every harness now (#80)** — the hook that said it
   under Claude Code matched a list of English words, so it said nothing to
   anybody prompting in another language.
4. `verify` before handing the work over. `review` for a second opinion on one
   screen, when asked.
5. `reach` when you cannot tell whether this project is clean or this tool is
   blind here. Those look identical and are not.

Nothing is spent until UI work starts. Under Claude Code the same text arrives
from the session hook; ~~and a prompt about screens also gets the list of
patterns the project has written down before anything is written; here both
arrive from this file and from the command that listed what was written down,
which is the whole difference between the harnesses.~~ **that second channel is gone and the harnesses no
longer differ there (#80).** It fired on a regular expression over English
words, which is a worse copy of the judgement each skill's `description` already
carries. The patterns still reach the agent before anything is written — through
`pattern`, reached by its description, in whatever language the work is being
discussed in.

Each is invocable on its own and none requires another to have run — so an
agent definition can order them by name (`ui-consistency:pattern`, and so on)
beside whatever else it uses.

**Only Claude Code runs the per-edit hook**, and it reports the deterministic
checks and nothing else. Under Codex, Cursor or Gemini CLI you run `uic check`
after each file rather than after the batch.

~~**But every harness has the MCP server** (#33). All four manifests declare it,
so it starts with the plugin and nobody configures anything. Six tools:
`pattern`, `deviations`, `tree`, `props`, `group`, `findings`.~~

**The server is gone (#77), and what it existed for is better served without
it.** Six tools onto functions that no longer exist; its case for existing was
that the three harnesses with no hook had no way to get the pattern before the
write. The rules above and the skills below do that on every harness, with
nothing to configure, no protocol to keep, and no server that can wedge. The
`mcpServers` block is out of all four manifests.

**What to do instead of asking a tool for a fact**: read the files. The family's
screens, the route table, the props each one writes — the skills say which files
and in what order, and reading three of them is cheaper than the 2 839 lines
that used to answer for you and were wrong on the next repository's
convention.

## The CLI

```
uic check <files>                  the deterministic findings; exits 1 on any
uic scan                           the packages detected, and how
uic shapes <files>                 shapes rebuilt or repeated
uic inventory <file>               the layer chain for one file, and what it exports
uic log                            what has been found here while somebody worked
```

**Ten commands went in two changes (#77, #78)**: the ones that derived a
pattern, wrote it down, re-counted it, listed what was written down, compared a
set against it, gathered evidence for a second opinion, served all of that over
a protocol, answered where a screen is routed, walked what a screen renders, and
grouped screens by shape. Every one of them is a skill or a rule now, and both
read the files. If you remember one and it is not above, that is why —
`ui-consistency:pattern` and `ui-consistency:verify` are where that work is, and
`rules/routes-and-breadcrumbs.md` and `rules/anatomy.md` are what they read.

`check` and `shapes` take **files, not glob patterns** — they rely on the
shell to expand. A quoted `"src/**/*.tsx"` names no file, and is refused with
exit 1 rather than checked and passed; use `$(git ls-files '*.tsx')`.

`bin/uic.mjs` is a single bundle: Node 20, no install, no network, no
credentials, no model call anywhere in it.

## What it assumes about your project

Nothing that has to be configured. Package layout is detected from manifests or
`tsconfig` path aliases; screens, roles and routes are read from the code. No
component name is hardcoded anywhere a finding can come from — a test enforces
that — because every team names its own components.

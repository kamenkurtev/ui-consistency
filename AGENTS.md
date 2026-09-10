# ui-consistency

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
written down about the kind, `uic pattern <screen> --establish` writes the
measured half of one — marked `derived: true` and dated, with the parts no
extraction can produce named as missing. Nobody is asked anything, and nothing
about it is approval. Prose with a structure
block, named slots, per-component props with the strength of each, and rules in
sentences. `uic diff --contract <that file> <screens>` verifies a set against
it and prints separately what it could not evaluate.

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

Read them directly if your harness has no skill mechanism: they are the
instructions, and the CLI below is the fact supplier.

## The skills

| Skill | When |
| --- | --- |
| `pattern` | before writing or changing screens — establishes the contract |
| `place` (via `uic place`) | where a new screen goes: folder, route, trail |
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
   typed. Under Claude Code the prompt hook says so; here this line is the
   whole of the trigger.
4. `verify` before handing the work over. `review` for a second opinion on one
   screen, when asked.
5. `reach` when you cannot tell whether this project is clean or this tool is
   blind here. Those look identical and are not.

Nothing is spent until UI work starts. Under Claude Code the same text arrives
from the session hook, and a prompt about screens also gets the list of patterns
the project has written down before anything is written; here both arrive from
this file and from `uic patterns`, which is the whole difference between the
harnesses.

Each is invocable on its own and none requires another to have run — so an
agent definition can order them by name (`ui-consistency:pattern`, and so on)
beside whatever else it uses.

**Only Claude Code runs the per-edit hook.** Under Codex, Cursor or Gemini CLI
the same check is a command you place yourself, after each file rather than
after the batch:

```
uic diff --contract <contract> <the file just written>
``` Where an
input is missing they degrade — deriving instead of refusing — rather than
demanding a pipeline.

## The CLI

```
uic pattern <screen> [--save]      what screens of this kind look like here
uic pattern <screen> --establish   write it down as a pattern file, derived and dated
uic pattern <screen> --refresh     re-count an established one; every sentence in it is kept
uic diff --contract <c> <files>    where the screens you touched left it (a pattern file or a saved contract)
uic place <screen>                 route, trail, and where it is registered
uic tree <screen> [--depth N]      what it renders, resolved through its children
uic props <Component> <files>      which props each file writes on it, and where they diverge
uic group <files> [--depth N]      the screens grouped by what they are composed of
uic patterns [screen]              the patterns written down, and which one covers a screen
uic check <files>                  the deterministic findings; exits 1 on any
uic scan                           the packages detected, and how
uic review <screen>                the findings, plus evidence for a second opinion
uic shapes <files>                 shapes rebuilt or repeated
uic inventory <file>               the layer chain for one file, and what it exports
uic log                            what has been found here while somebody worked
```

`check`, `diff` and `shapes` take **files, not glob patterns** — they rely on the
shell to expand. A quoted `"src/**/*.tsx"` names no file, and is refused with
exit 1 rather than checked and passed; use `$(git ls-files '*.tsx')`.

`bin/uic.mjs` is a single bundle: Node 20, no install, no network, no
credentials, no model call anywhere in it.

## What it assumes about your project

Nothing that has to be configured. Package layout is detected from manifests or
`tsconfig` path aliases; screens, roles and routes are read from the code. No
component name is hardcoded anywhere a finding can come from — a test enforces
that — because every team names its own components.

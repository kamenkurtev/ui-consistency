---
name: reach
description: Use when somebody asks whether this tool is doing anything on their project, or when it has been quiet — "is this even running", "it found nothing, is that good", "does this work with our setup", "why does it never say anything", "we installed it and nothing happened", or on the first day after installing. Reports, level by level, which of three things is true: it works and here is the evidence, it is silent because the project has stated nothing, or it is blind here and here is why. Never a score, never a grade.
---

# Which silence is this?

A user cannot tell **"my project is clean"** from **"this tool is blind here"**,
and the whole tool is organised around those being different:

> a built-in vocabulary made the checks silent on every project that names
> things differently — **silence being indistinguishable from a clean result**

Every command answers for itself, and each one's silence looks the same as
success. This is the surface that says which is which.

## The three answers, and there are only three

Every line you report is exactly one of these. Nothing else is admissible.

1. **Works — and here is the evidence.** Not "found no problems". *"Layers: 11
   packages, from `tsconfig.base.json` paths."* *"Style literals: read on all
   1435 files."* The evidence is what makes it an answer.
2. **Silent because the project has stated nothing.** *"Substitutions, page
   rules, prop values: no rules written down; these can only ever fire on
   something you have said."* This is the design working, and it is the answer
   that should send somebody to `ui-consistency:decide` rather than to a bug
   report.
3. **Blind here — and why.** Not just the outcome: the reason. *"No screen in
   this repository is routed: nothing matches a route table this can read."*
   *"Every screen's family is one file, so nothing can be compared."*

## What to run

Cheap deterministic inspection over a **sample**, never the whole repository.
Five commands and a handful of screens is the whole of it.

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" scan
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" inventory <the nearest shared package>
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" place <three or four real screens>
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" pattern <one of them>
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" check <the same three or four>
```

Pick the screens from different areas of the application, not three files in one
folder. Three files in one folder answer for that folder.

## Reading each level

| Level | Works when | Stated-nothing when | Blind when |
| --- | --- | --- | --- |
| **layers** | `scan` names a mechanism and lists packages with edges | — | `scan` finds no packages: say which two mechanisms were looked for, and that the three checks reading a chain are the only ones affected |
| **imports** | a chain exists and `check` reports or clears real files | — | no chain — and say so, rather than reporting a clean file |
| **style literals** | `check` read the files at all | — | class-based systems (Tailwind, CSS modules, styled-components) are out of reach of a per-file AST check by construction |
| **emoji-as-icon** | `check` read the files | — | never blind; it needs no package |
| **deprecated usage** | `inventory` shows `@deprecated` markers | nothing in the project is marked | no chain |
| **prop values** | a source of truth is injected | no reference and no curated set — the commonest case | — |
| **page rules, substitutions** | a rule file exists and was retrieved | `.ui-consistency/` is empty | a rule exists but names files it does not apply to |
| **placement** | `place` returns a path and where it is declared | — | `place` says nothing routes any of the sample |
| **the family** | `pattern` returns a family of three or more real screens | — | the family is one screen, or is the target's own parts |
| **the contract** | `skeleton`, `configuration` or `body` carry something | fewer than three screens of the kind — this is the design, and `ui-consistency:decide` is the next step | `regionsIn` is `null` with a holder present |
| **the contract's props** | `configuration` carries entries | `configuration` is empty and `propsUnmeasured` is `null` — the family was read and agrees on no props | `propsUnmeasured` is set: three screens, so the props were counted over two and never asked (#41) |

Two readings that are easy to get backwards and are worth stating out loud:

- **An empty `vocabulary` beside `regionsIn: 'holder'` is answer 1, not answer
  3.** It means the project keeps its chrome in the holder's props, which the
  contract states through `configuration` and `body` instead.
- ***"Fewer than three screens of this kind"* is answer 2, not answer 3.** Two
  screens are a copy, not an agreement.

## What this must not do

- **No score, no grade, no percentage.** The subject is this tool's reach on this
  project, not the project's quality. A number invites the wrong reading and
  cannot be honest at this resolution.
- **Never report a level as working because it produced no findings.** That is
  the exact confusion this exists to remove. A level that produced nothing is
  answer 1 only when you can say what it *read*.
- **Not a setup wizard.** Nothing is written. Setting nothing up is the design,
  and it stays that way; where the answer is "the project has stated nothing",
  name `ui-consistency:decide` and stop.
- **Not on the edit path**, and not in `SessionStart`. This is invoked when
  somebody asks *"is this thing doing anything?"*, which is a real question on
  day one.

## The shape of the report

One line per level, in the order above, each tagged with which of the three
answers it is. Then a short paragraph naming the levels that are answer 2 and
what would make them answer 1 — because that is the only part the user can act
on today.

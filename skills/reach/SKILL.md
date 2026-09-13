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
~~Five commands~~ **none** — the derivation became a skill (#77), the route and
anatomy readers became rules (#78), the package graph went with the import
check (#81), and the last check went with the rest (#89). A handful of screens
is still the whole of it, and now it is all reading.

**So the question about each level changed, and that is the substance of this
skill now.** It is no longer *did the command run* — there is no command. It is
**has this project stated what this level needs, and can that be read here**.
Read `${CLAUDE_PLUGIN_ROOT}/rules/` and check each against the project in front
of you.

For every level above those — placement, the family, the pattern, the props —
run `ui-consistency:pattern` on one of the same screens. It reports which of the
three answers applies for itself, in the same three words this skill uses, and
*"fewer than three screens of this kind"* is the design rather than a fault.

**A level that is now a rule is reported differently, and the difference
matters**: there is no command to be silent, so *blind* stops being a thing a
run demonstrates and becomes a thing the rule states — a class-based style
system, a router this project registers some way nothing has written down. Say
which rule was read and what it could not answer about **this** project, and
never that a level worked because nothing was reported.

Pick the screens from different areas of the application, not three files in one
folder. Three files in one folder answer for that folder.

## Reading each level

| Level | Works when | Stated-nothing when | Blind when |
| --- | --- | --- | --- |
| ~~**layers**~~, ~~**imports**~~ | — | — | **Not levels any more (#81).** The package graph answered on one repository shape in three, which is what settled it against the bar rather than the argument. Where a symbol comes from is `rules/imports-and-layers.md`, a sentence the project writes once — so the question here is not *did a chain resolve* but **has this project written that rule**, and if not, say so and offer to help write it. |
| ~~**style literals**~~, ~~**emoji-as-icon**~~ | — | — | **Not levels any more (#79).** They are `rules/raw-values.md`, and this skill has nothing to report about them: whether an agent read a rule is not a coverage fact, and answering anyway would be the invented reassurance this skill exists to prevent. The rule states its own limit — a class-based system (Tailwind, CSS modules, styled-components) is out of reach of anything reading one file — where the agent reads it. |
| ~~**deprecated usage**~~ | — | — | **Gone with them (#79):** the marker is in the imported component's own source, which the agent reads. |
| ~~**prop values**~~ | — | — | **Not a level any more (#78).** Its allowed set came from a reference screen, a story or the neighbouring files, and all three readers were the derivation #77 removed; a prop check with no injected source of truth invents one. Props are read by `ui-consistency:pattern` now, with the strength of each stated as a count. |
| **substitutions** | a rule file exists and was retrieved | `.ui-consistency/` is empty | a rule exists but names files it does not apply to |
| ~~**page rules**~~ | — | — | **Gone with the region reader (#78).** *A page is `<PageLayout>` holding, in order, header then content* is a sentence somebody wrote; `ui-consistency:pattern` reads it and the screen, which is what the check did and can also say why a screen differs. |
| **placement** | the router states a path for the screen, and which table declares it | — | nothing in the project routes any of the sample, or it registers routes some way `routes-and-breadcrumbs.md` does not cover — say which |
| **the family** | three or more real screens of the same kind, and **say which channel found them** — a pattern file, the route table, the same holder, the folders | — | the family is one screen, or is the target's own parts, which is a wrong family rather than a weak one |
| **the pattern** | a holder, a role order, or what the holder holds carries something | fewer than three screens of the kind — this is the design, and `ui-consistency:decide` is the next step | the project has no named regions at all, or is built from raw markup: `anatomy.md` names both shapes, and neither is a clean result |
| **the props** | counted over the family, each with its strength as a count | the family was read and agrees on no props | a family of exactly three: the props are counted over the two beside the reference, below what it takes to tell a convention from a copy — say that rather than *no conventions* |

~~Those four were fields of a JSON contract a command printed.~~ **They are what
`ui-consistency:pattern` reports (#77, #78).** The three answers are unchanged
and so is the rule: never a level called working because nothing was reported.

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

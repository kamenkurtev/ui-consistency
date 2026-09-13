---
name: reach
description: Use when somebody asks whether this tool is doing anything on their project, or when it has been quiet — "is this even running", "it found nothing, is that good", "does this work with our setup", "why does it never say anything", "we installed it and nothing happened", or on the first day after installing. Reports, level by level, which of three things is true: it works and here is the evidence, it is silent because the project has stated nothing, or it is blind here and here is why. Never a score, never a grade.
---

# Which silence is this?

A user cannot tell **"my project is clean"** from **"this tool is blind here"**,
and the whole tool is organised around those being different:

> a built-in vocabulary made the checks silent on every project that names
> things differently — **silence being indistinguishable from a clean result**

Nothing reported looks the same as success. This is the surface that says which
is which.

## The three answers, and there are only three

Every line you report is exactly one of these. Nothing else is admissible.

1. **Works — and here is the evidence.** Not "found no problems". *"The family:
   9 list screens, from the route table in `src/routes.tsx`."* The evidence is
   what makes it an answer.
2. **Silent because the project has stated nothing.** *"Written rules: nothing
   in `.ui-consistency/`; these can only ever apply something you have said."* This is the design working, and it is the answer
   that should send somebody to `ui-consistency:decide` rather than to a bug
   report.
3. **Blind here — and why.** Not just the outcome: the reason. *"No screen in
   this repository is routed: nothing matches a route table this can read."*
   *"Every screen's family is one file, so nothing can be compared."*

## What to read

A **sample**, never the whole repository: a handful of screens from different
areas of the application, not three files in one folder — three files in one
folder answer for that folder.

For each level the question is **has this project stated what this level needs,
and can that be read here**. Read `${CLAUDE_PLUGIN_ROOT}/rules/` and check each
against the project in front of you. For the family, the pattern and the props,
run `ui-consistency:pattern` on one of the sampled screens; it reports which of
the three answers applies in the same words this skill uses.

A level that is a rule is reported as what the rule could not answer about
**this** project — a class-based style system, a router registering routes some
way `routes-and-breadcrumbs.md` does not cover — and never as working because
nothing was reported.

## Reading each level

| Level | Works when | Stated-nothing when | Blind when |
| --- | --- | --- | --- |
| **imports and layers** | `rules/imports-and-layers.md` has a project-specific sentence saying where symbols come from | nothing is written — offer to help write it | — |
| **written rules** | `.ui-consistency/` has rules or decisions that apply to the sample | `.ui-consistency/` is empty | a rule exists but names files it does not apply to |
| **placement** | the router states a path for the screen, and which table declares it | — | nothing in the project routes any of the sample, or it registers routes some way `routes-and-breadcrumbs.md` does not cover — say which |
| **the family** | three or more real screens of the same kind, and **say where they came from** — a pattern file, the route table, the same holder, the folders | — | the family is one screen, or is the target's own parts, which is a wrong family rather than a weak one |
| **the pattern** | a holder, a role order, or what the holder holds carries something | fewer than three screens of the kind — this is the design, and `ui-consistency:decide` is the next step | the project has no named regions at all, or is built from raw markup: `anatomy.md` names both shapes, and neither is a clean result |
| **the props** | counted over the family, each with its strength as a count | the family was read and agrees on no props | a family of exactly three: the props are counted over the two beside the reference, below what it takes to tell a convention from a copy — say that rather than *no conventions* |

Two readings that are easy to get backwards:

- **No components named for the regions, while the holder carries the chrome in
  its props, is answer 1, not answer 3.** The project keeps its header and title
  in the holder's props; the pattern states that under `## Props`.
- ***"Fewer than three screens of this kind"* is answer 2, not answer 3.** Two
  screens are a copy, not an agreement.

## What this must not do

- **No score, no grade, no percentage.** The subject is this tool's reach on this
  project, not the project's quality.
- **Never report a level as working because it produced no findings.** A level
  is answer 1 only when you can say what it *read*.
- **Not a setup wizard.** Nothing is written. Where the answer is "the project
  has stated nothing", name `ui-consistency:decide` and stop.

## The shape of the report

One line per level, in the order above, each tagged with which of the three
answers it is. Then a short paragraph naming the levels that are answer 2 and
what would make them answer 1 — because that is the only part the user can act
on today.

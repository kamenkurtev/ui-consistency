---
name: implementing
description: Use when writing or changing what the end user sees and a pattern file or a UI plan exists — executing that plan page by page, refactoring a set of pages, or making a small change to one page.
---

# Implementing from the pattern

The failure this exists for: the pattern is agreed, and the twenty-seventh page
still does not match the first. Attention thins across a batch and the work
drifts toward the last page seen instead of the one agreed.

## One page per task, in a fresh context

- Where the harness has subagents, **one subagent per page**. It starts cold, so
  the brief names the pattern file, the reference, and what is particular to the
  reference.
- Where it does not, one page per turn, working from the plan on disk — never
  from a list held in the conversation. Its shape is
  [plan-file.md](../planning/plan-file.md): every task carries what it needs, so
  a task is executed from itself and not from what the plan says around it.

If another process is executing the plan, follow its loop; the steps below are
what each page task does inside it.

## For each page

Everything `ui-consistency:verifying` will check is listed here, so nothing is
reported against a page that was never asked to get it right.

1. **Re-read the pattern file.** Every time. Not remembered. Its sections are
   described in [pattern-file.md](../finding-patterns/pattern-file.md).
2. **Write the page region by region**, in the order of the tree: holders, then
   the components in each, then what each comes out as, then how each is
   written, as the counts say. **The element the pattern records at a position
   is the element you write** — including the heading level
   ([elements.md](../finding-patterns/elements.md)). Where the pattern records
   none for a position, say so rather than choosing one.
3. **Use what the project reuses.** The shared component, helper or class named in
   the pattern — never a new one beside it.
4. **What the user sees happen, as the pattern says**: validation, field errors,
   when the submit is enabled, how a failure is caught and shown, loading and
   empty.
5. **Values through the theme that applies**, and only entries that exist in it —
   for a file in a shared layer, every theme that renders it
   ([theme.md](../finding-patterns/theme.md)). A named constant where the
   theme has none. No literal copied from the reference.
6. **Spacing on the base** in `## Spacing`
   ([spacing.md](../finding-patterns/spacing.md)): every value a whole multiple
   of the base the pattern derived, the gaps between roles as the family spaces
   them, owned by the side the pattern names, the line heights it records, and
   the heights of controls, rows and bars as the family writes them. A multiple
   the family has not written yet is allowed — say you used one.
7. **Text as `## Typography` records it**
   ([typography.md](../finding-patterns/typography.md)): the type role the
   family writes at that position, the whole bundle for it — size, weight, line
   height, letter spacing, typeface, case — and **applied the way the family
   applies it**: the shared entry, class or component, never a style written by
   hand beside one that exists.
8. **Contrast as a pair**: every foreground on the surface actually behind it
   meets the threshold in `## Accessibility`, in every scheme the project has
   ([contrast.md](../accessibility/contrast.md)). Prefer the pairings the
   family already uses.
9. **The rest of what a person has to be able to read and use**, as
   `## Accessibility` records it: focus shown the way the family shows it and
   landing where the family puts it, every control reachable without a mouse, a
   field tied to its label the way the shared field does it, text for what has
   none, targets the size the family's are — `ui-consistency:accessibility`
   ([SKILL.md](../accessibility/SKILL.md)).
10. **Do not copy what is particular to the reference.**
11. **Where the pattern is silent, or the region is under `Open questions`**,
    do not invent and do not pick a side. If the page can be written without the
    answer, write the rest and note the gap in the plan; if it cannot, park it.
    **A page parked on a question is named beside that question in the pattern
    file**, so the batch that asks it again says what an answer would release
    ([pattern-file.md](../finding-patterns/pattern-file.md)).
    The gaps go to the user together, once, not page by page.
    **The same when the request asks for what the pattern counts as a
    deviation** — "make it look like" the page that differs. Write that region
    the way the family does, and put the conflict to the user in one sentence
    with the count: *"the family writes the submit button full-width in 3 of 4
    pages; the page you pointed at is the one that differs — which do you want?"*
    Neither copy the deviation nor quietly override the request.
12. **Hand the page to verification** — `ui-consistency:verifying`, run by an
    agent that did not write it.
13. **Fix what it reports**, then verify again.
14. **Mark it** in the plan: ticked for `done`, or left unticked with
    `parked — <why>` ([plan-file.md](../planning/plan-file.md)).

## A small change without a plan

`ui-consistency:finding-patterns` has a reduced branch for it
([small-change.md](../finding-patterns/small-change.md)), which says what is read
and what is deliberately skipped. Take what it produced, re-read that part of the pattern, make the change, and hand
the page to `ui-consistency:verifying`, run by an agent that did not write it,
before calling it done. The check is not the part that gets dropped because the
change was small.

## Then

When every page is `done` or `parked`: `ui-consistency:verifying` over the whole
set.

## Red flags

Words agents used in runs, just before getting it wrong:

| They said | What it means |
|---|---|
| "Verified by diffing each new file against" a sibling — from the agent that wrote them | The author checked its own pages. Hand them to a separate agent, or say plainly that none was available. |
| "the one legitimate mechanism shipments also reaches for" — taking a class from the page the user pointed at | The request asked for the deviation. Build the region like the family and ask. |

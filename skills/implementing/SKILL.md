---
name: implementing
description: Use when writing or changing what the end user sees and a checklist or a UI plan exists — executing that plan page by page, refactoring a set of pages, or making a small change to one page.
---

# Implementing from the pattern

The failure this exists for: the pattern is agreed, and the twenty-seventh page
still does not match the first. Attention thins across a batch and the work
drifts toward the last page seen instead of the one agreed.

## One page per task, in a fresh context

- Where the harness has subagents, **one subagent per page**. It starts cold, so
  the brief carries the checklist itself, the reference, and what is particular
  to the reference.
- Where it does not, one page per turn, working from the plan on disk — never
  from a list held in the conversation. Its shape is
  [plan-file.md](../planning/plan-file.md): every task carries what it needs, so
  a task is executed from itself and not from what the plan says around it.

If another process is executing the plan, follow its loop; the steps below are
what each page task does inside it.

## For each page

Everything `ui-consistency:verifying` will check is listed here, so nothing is
reported against a page that was never asked to get it right.

1. **Re-read the checklist.** Every time. Not remembered. Its shape is
   [checklist.md](../finding-patterns/checklist.md), and its order is the order
   you write the page in.
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
6. **Spacing on the base the list names**
   ([spacing.md](../finding-patterns/spacing.md)): every value a whole multiple
   of the base the pattern derived, the gaps between roles as the family spaces
   them, owned by the side the pattern names, the line heights it records, and
   the heights of controls, rows and bars as the family writes them. A multiple
   the family has not written yet is allowed — say you used one.
7. **Text as the list records it**
   ([typography.md](../finding-patterns/typography.md)): the type role the
   family writes at that position, the whole bundle for it — size, weight, line
   height, letter spacing, typeface, case — and **applied the way the family
   applies it**: the shared entry, class or component, never a style written by
   hand beside one that exists.
8. **Contrast as a pair**: every foreground on the surface actually behind it
   meets the threshold the list names, in every scheme the project has
   ([contrast.md](../accessibility/contrast.md)). Prefer the pairings the
   family already uses.
9. **The rest of what a person has to be able to read and use**, as the list
   records it: focus shown the way the family shows it and
   landing where the family puts it, every control reachable without a mouse, a
   field tied to its label the way the shared field does it, text for what has
   none, targets the size the family's are — `ui-consistency:accessibility`
   ([SKILL.md](../accessibility/SKILL.md)).
10. **Do not copy what is particular to the reference.**
11. **Where the pattern is silent, the order settles it** —
    [deciding.md](../finding-patterns/deciding.md) — and you say which level
    settled it. Do not invent, and do not stop: a decision reported is
    reversible, a question is not free. Park a page only where the order ties
    **and** the decision reaches outside what this task touches; those go to the
    user together, once, not page by page.
    **When the request asks for what the counts call a deviation** — "make it
    look like" the page that differs — **do what was asked**: an explicit
    request is the top of the order. Report in one line what it goes against:
    *"as asked, like <page>; the other 3 of 4 write the submit button
    full-width."* Do not quietly build it the other way.
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
| "the one legitimate mechanism shipments also reaches for" — taking a class from the page the user pointed at | Right outcome, silent reasoning. The request is the top of the order: do it, and report in one line what it goes against. |

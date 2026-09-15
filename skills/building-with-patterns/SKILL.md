---
name: building-with-patterns
description: Use when writing or changing pages from a pattern file or a plan that names one — executing a UI plan, a refactor page by page, or a single small change after the pattern is established. One page per task in a fresh context, re-reading the pattern file every time, taking reused pieces and theme values instead of writing new ones, and handing each page to verifying-against-patterns before marking it done.
---

# Building from the pattern

The failure this exists for: the pattern is agreed, and the twenty-seventh page
still does not match the first. Attention thins across a batch and the work
drifts toward the last page seen instead of the one agreed.

## One page per task, in a fresh context

- Where the harness has subagents, **one subagent per page**. It starts cold, so
  the brief names the pattern file, the reference, and what is particular to the
  reference.
- Where it does not, one page per turn, working from the plan on disk — never
  from a list held in the conversation.

If another process is executing the plan, follow its loop; the steps below are
what each page task does inside it.

## For each page

Everything `ui-consistency:verifying-against-patterns` will check is listed here,
so nothing is reported against a page that was never asked to get it right.

1. **Re-read the pattern file.** Every time. Not remembered.
2. **Write the page region by region**, in the order of the tree: holders, then
   the components in each, then how each is written, as the counts say.
3. **Use what the project reuses.** The shared component, helper or class named in
   the pattern — never a new one beside it.
4. **What the user sees happen, as the pattern says**: validation, field errors,
   when the submit is enabled, how a failure is caught and shown, loading and
   empty.
5. **Values through the theme that applies**, and only entries that exist in it —
   for a file in a shared layer, in every theme that renders it. A named constant
   where the theme has none. No literal copied from the reference.
6. **Spacing on the scale** in `## Spacing`: the gaps between roles as the family
   spaces them, owned by the side the pattern names.
7. **Contrast as a pair**: every foreground on the surface actually behind it
   meets the threshold in `## Contrast`, in every scheme the project has. Prefer
   the pairings the family already uses.
8. **Do not copy what is particular to the reference.**
9. **Where the pattern is silent, or the region is under `Open questions`**, do
   not invent and do not pick a side. If the page can be written without the
   answer, write the rest and note the gap in the plan; if it cannot, park it.
   The gaps go to the user together, once, not page by page.
10. **Hand the page to verification** —
    `ui-consistency:verifying-against-patterns`, run by an agent that did not
    write it.
11. **Fix what it reports**, then verify again.
12. **Mark it** `done`, or `parked — <why>`.

## A small change without a plan

Establish only what the change touches, re-read that part of the pattern, make
the change, and verify the page before calling it done.

## Then

When every page is `done` or `parked`: `ui-consistency:verifying-against-patterns`
over the whole set.

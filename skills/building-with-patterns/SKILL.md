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

1. **Re-read the pattern file.** Every time. Not remembered.
2. **Write the page region by region**, in the order of the tree: holders, then
   the components in each, then how each is written.
3. **Use what the project reuses.** The shared component, helper or class named in
   the pattern — never a new one beside it.
4. **Values through the theme**, or a named constant where the theme has none.
   No literal copied from the reference.
5. **Do not copy what is particular to the reference.**
6. **Where the pattern is silent, or the region is under `Open questions`**, do
   not invent and do not pick a side. If the page can be written
   without the answer, write the rest and note the gap in the plan; if it
   cannot, park it. The gaps go to the user together, once, not page by page.
7. **Hand the page to verification** —
   `ui-consistency:verifying-against-patterns`, run by an agent that did not
   write it.
8. **Fix what it reports**, then verify again.
9. **Mark it** `done`, or `parked — <why>`.

## A small change without a plan

Establish only what the change touches, re-read that part of the pattern, make
the change, and verify the page before calling it done.

## Then

When every page is `done` or `parked`: `ui-consistency:verifying-against-patterns`
over the whole set.

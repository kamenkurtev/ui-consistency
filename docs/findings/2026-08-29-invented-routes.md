# The route reader invented 52 paths out of 117

*2026-08-29, from #254.*

## What was measured

A real React monorepo, `libs/client-ui`, 25 route tables, screens resolved from what
those tables register:

| | |
| --- | ---: |
| screens registered in a route table | 117 |
| of those, registered as `index: true` — **no path of their own** | **72** |
| index screens the tool nevertheless gave a specific path | **52** |
| screens answered `Nothing routes` | 20 |

Eleven different screens — `Vendors`, `VendorAccounts`, `VendorGroups`,
`BusinessUnits`, `Territories`, `Contacts`, `LocalSuppliers`, `GlobalSuppliers`,
`ShipmentProcesses`, `BusinessUnitVendorLinks`, `VendorAccountRequests` — were
each reported as **`/new/*`**, which is the "create" sibling in their table.

## Why

`declaredPath` found the line that binds a screen and then looked for a `path:`
on that line, the one above, the one below, or two above. In a nested table that
window belongs to a **different route**. Two failures, both of them wrong
answers rather than misses:

1. **An index route has no path of its own.** `{ index: true, element: <X /> }`
   inherits its parent's. The line below it is the *sibling's* route.
2. **The parent segment is dropped.** `{ path: ':id/*' }` inside
   `{ path: 'orders', children: [...] }` was reported as `/:id/*`.

This is the standard React Router v6 shape — a guard element wrapping
`children`, with the list screen as `index` — so it is not an edge case.

## Why it mattered beyond breadcrumbs

Since #225 the family comes from the route table, and since #231 the contract is
derived **automatically on the edit being made**. So a wrong route is no longer
an empty answer somebody chose to look at.

Measured on `customers/invoices`, nine routed screens, every one rendering
`<PageLayout>`: `InvoiceTotalsPage` answered `Nothing routes`, its family
became `InvoiceTotalsPanel`, `InvoiceTotalsErrorPanel`,
`InvoiceTotalsProviderHeader` and `SingleTotalRow` — its own parts, all of
which render `<Box>` — the derived holder became `Box`, and `uic diff --contract`
reported **all nine screens** as

```
sits in <PageLayout>; screens of this kind use <Box>
```

Nine findings, nine false, on one real area.

`docs/concept.md`: *"A false positive costs more than a miss. A tool that is
wrong once is a tool somebody argues with. A tool that is wrong twice is a tool
somebody turns off."* And `src/layers/cache.ts` states the invariant it breaks:
*the failure direction is a missed finding, **never an invented one**.*

## What replaced it

The route **object** is the unit, not the line. The table is parsed and walked
depth-first carrying the accumulated path, so a child's path is its parent's plus
its own and an `index` entry is its parent's exactly. Nothing is read from a
neighbouring entry, which was the whole of the defect.

## One correction to the issue's premise, found while fixing it

The issue expected a screen whose path cannot be determined to answer
`Nothing routes`. That would have been worse: **the family comes from *which
table registers the screen*, not from the path**, so refusing the whole placement
for a pathless entry — `{ element: <Layout />, children: [...] }`, a real and
common shape — would push exactly those screens onto their own folder, which is
the failure being fixed.

The two are separate facts and only one of them is missing. `path` is `null`,
`trail` is empty, and `declaredIn` still names the table. No path is invented and
no family is lost.

That also means the nine-false-findings chain above ran through screens that
answered `Nothing routes` **entirely**, not through screens given a wrong path.
The wrong paths are their own defect — 52 of them — and they are what a
breadcrumb is built from.


## The guards that make the next one a miss (#255)

Fixing the route reader removes *this* cause. The nine false findings were
produced by a chain — a route that did not resolve, a family that fell back to a
folder, a folder that held the page's own panels — and any future break anywhere
in it would produce the same shape. So three guards were added that degrade a
wrong derivation into a **miss**, without anyone having to find the specific bug:

1. **Nothing reachable from the screen's own imports may be its family.** The
   page imports its panel, so the panel is part of the page. Applied to every
   family path, route-derived and fallback alike. In the reproduction the family
   then falls below quorum and the honest answer — *no pattern* — comes back.
   If a genuine sibling is ever imported by the reference the family shrinks by
   one: still a miss.
2. **A folder-fallback contract that contradicts its own reference is
   discarded.** A derived holder the reference itself does not sit in is
   self-contradictory. Scoped to folder-derived families deliberately: where the
   family is what the project *states*, a reference that deviates from its
   siblings is the correct and valuable answer.
3. **Provenance in the sentence.** The hook now says *"derived just now from the
   8 screens the route table registers beside it"* or *"derived just now from
   files in its folder — OrdersPanel.tsx, SingleTotalRow.tsx, … "*. An agent
   handed the second, with the names, can judge the family nonsense on sight;
   one handed a bare assertion cannot. That is this tool's own division of
   labour.

Cost of the first guard, which adds one parse of the target: **39 ms** cold and
**0.4 ms** warm, inside the cache #231 already keyed by the files the answer came
from.

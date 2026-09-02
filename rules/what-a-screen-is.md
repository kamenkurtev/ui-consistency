# What a screen is, per framework

A screen is not always a file. Before reading one, know how many files it is —
otherwise half of it is missing and the half that is there looks empty.

| Framework | A screen is |
| --- | --- |
| React, Preact, Solid, Qwik | **one file.** JSX carries the markup, the imports and the identity together. |
| Vue, Svelte | **one SFC.** The markup is in a `<template>` block; the rest of the file is script and style. |
| Angular | **a pair.** The `.component.ts` carries the identity, the imports and the wiring — it is what a route module names. The `.component.html` carries the markup. **Neither is a screen alone.** A component that writes its markup inline instead is one file, and a component with no markup at all is not a screen. |
| Next.js and SvelteKit routers | **a folder plus a fixed file name.** The folder is the route and the file is `page.tsx` or `+page.svelte`, so the *folder* is what names the screen and the file name says nothing. Files beside it — `layout`, `loading`, `error` — are the framework's, not screens. |

## Why this is a rule and not a detail

Read as two unrelated files, an Angular screen produces nothing at either half:
the class has no markup to compare and the template has no identity beyond its
own tags. On a real Angular monorepo of 179 components, everything above the
import check was silent for exactly that reason.

And a folder-routed screen has **no siblings at all, forever, by the
framework's design** — every one of them is `page.tsx` alone with its layout —
so the screens it is comparable with are one level up and one back down. A flat
read of its own directory finds nothing and reports that as disagreement.

## What follows from it

- **Reading the markup means reading the right file.** For a pair, follow the
  `templateUrl` from the class; do not read the class and conclude the screen
  renders nothing.
- **Naming the screen means naming the identity.** A route table, an import and
  a decisions file all name the class, never the template.
- **Counting a family means counting screens, not files.** A pair is one screen.
  Counting both halves inflates every number and compares a class against a
  template.
- **A folder is not always a family.** Where the file name is fixed by the
  router, or where a screen has its own folder of parts, the comparable screens
  are elsewhere. See `family-and-particulars.md`.

Read by: `ui-consistency:pattern`, `ui-consistency:screen`,
`ui-consistency:review`.

# A decorated file was unread, and the silence covered more than routing

*2026-08-29, from #253.*

## What was measured

`src/parse/parse.ts` ran with `plugins: ['typescript', 'jsx']` and no decorators
plugin. A decorated class is a syntax error to that configuration, so
`parseModule` returned `null` and **every module-level reading of the file
returned nothing**.

Every Angular component is a decorated class.

The issue established the routing case: a screen's exported class name is never
read, so a route entry naming the class matches nothing and `uic place` answers
*"Nothing routes …"* for every screen. It also said the sweep was the work,
because `parseModule` is shared, and asked for the result to be recorded here
rather than fixed quietly.

## The sweep

One workspace package, two source files, one of them a component:

```
libs/ui/src/helpers.ts          formatMoney, fmt (@deprecated)
libs/ui/src/button.component.ts AcmeButtonComponent, LegacyButtonComponent (@deprecated)
```

`uic scan`, the same files, the only difference being the `@Component`
decorator:

| | exports | deprecated |
| --- | ---: | ---: |
| `button.component.ts` **decorated** | **2** | **1** |
| the identical file **undecorated** | 4 | 2 |

The decorated file contributed **nothing**. Its two classes — including the one
carrying `@deprecated` — were invisible to the inventory.

## Why that is wider than routing

The inventory is what the **import resolution check** and the **deprecated
usage check** are built on: they ask what a layer exports and which of those
exports are marked. Neither can fire for a symbol that is not in it.

So on an Angular repository, v1's entire subject — *a symbol imported from a
layer less derived than the file's chain allows* — was blind to every component,
every service and every module in every library. Not degraded: absent.

And the failure direction was silence, which is why nothing reported it. This is
the third time that has been the shape of a defect here (#149, #251, this), and
each time the answer was an empty one that reads as a clean result.

## What was not affected

The template half. `.component.html`, `.vue` and `.svelte` go through the
tolerant HTML parser, never through Babel, so everything read from markup —
holder, regions, the components a screen renders, how they are written — was
working. That is why `uic pattern` on a `.component.html` returned a holder while
`uic place` on its `.component.ts` returned nothing: the two halves of one screen
failed differently, and only one of them failed.

## The fix, and why the order in it is not preference

Babel **refuses to enable both decorator plugins at once**, and neither reads
both syntaxes. Measured:

| plugins | Angular (`@Component`, `constructor(@Inject(T) x)`) | proposal (`@logged accessor x`) |
| --- | --- | --- |
| `typescript, jsx` (before) | fails | fails |
| `+ decorators-legacy` | **ok** | fails |
| `+ decorators` (current proposal) | fails — *"Decorators cannot be used to decorate parameters"* | **ok** |
| both together | refused by Babel | refused by Babel |

`decorators-legacy` is tried first because it is what Angular and every
`experimentalDecorators` codebase emit, and it is the only spelling that accepts
a **parameter** decorator. The proposal is the fallback.

The second attempt is free where it matters: it runs only where the first failed,
which is where the answer used to be `null`. Measured at 0.013 ms for a file that
parses and 0.020 ms for one that does not — and `errorRecovery` stays off, so a
file that is genuinely broken still yields nothing rather than a truncated AST.

## What this says about the fixtures

744 tests passed over it. Every Angular fixture in the repository was a bare
class or a template file — written by whoever wrote the rule, encoding the same
assumption — so the suite could not have caught it. That is the standing lesson
of this directory, and this is one more instance of it.

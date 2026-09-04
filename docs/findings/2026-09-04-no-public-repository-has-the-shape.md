# Seventeen repositories, one mount, and a splat nobody was looking for

*2026-09-04, from #1.*

## What was being looked for

#1 asks for a measurement before it allows a change: a table mounted under a
path shifts every entry in it, including the ones that state a path of their
own, and *"a diff of the 67 answers before and after is the evidence"*. Those 67
were counted on a repository that is not on this machine, so the question was
whether any public repository could stand in.

The shape needed is narrow: an array of route objects **exported from one file**
and mounted, under a `path`, **from another**.

## What the search found: nothing, in seventeen places

The qualifier is an AST pass matching exactly what `mountsIn` and `routeParts`
recognise — `children: X`, `children: [...X]`, `children: m.X`, and `routes:` as
the child key. It was run both ways before it was believed: 1 on #1's own
two-file example, 0 on a fixture without it, and parse failures counted rather
than swallowed — zero in fifteen of the seventeen.

| repository | files | nested tables seen | cross-file mounts |
| --- | ---: | ---: | ---: |
| twenty | 24752 | 0 | 0 |
| n8n | 21470 | 13 | 0 |
| medusa | 11730 | 113 | 0 |
| grafana | 9304 | 29 | 0 |
| AFFiNE | 6967 | 0 | 0 |
| refine | 6760 | 0 | 0 |
| strapi | 4929 | 10 | **1** |
| superset | 4042 | 0 | 0 |
| directus | 3904 | 28 | 0 |
| plane | 3286 | 0 | 0 |
| nocodb | 3157 | 0 | 0 |
| vue-vben-admin | 1443 | 0 | 0 |
| vue-pure-admin | 483 | 34 | 0 |
| memos, ant-design-pro, vue-element-admin, vuestic-admin | 1232 | 0 | 0 |

The single hit is refused twice over, and both refusals are the design working:
the mount is written inside `app.router.addRoute({ … })` — a call, not a
top-level array binding, so `tableArrays` never sees it — and the array is
called `routes`, one word, so `isDistinctive` refuses to treat meeting that name
elsewhere as evidence.

**So the diff #1 asks for does not exist publicly.** Not a small diff: no diff.

Why the shape is rare outside the repository it was measured on: the Vue idiom
is one module file exporting a single `{ path, children }` object, collected
into a flat top-level array — no parent path, nothing to compose. The React
repositories here write their nested children inline, in one file.

## What the search found instead

**A public reproduction of the defect**, which is worth more than the fixtures
because it keeps its names. In strapi,
`packages/core/content-manager/admin/src/history/pages/History.tsx` answers
`/:collectionType/:slug/:id/history`; its true path is
`/content-manager/:collectionType/:slug/:id/history`. The tool refuses to
compose it, correctly, for the two reasons above — so it is a miss and not a
wrong answer, and it is the shape #1 is about, in code anybody can clone.

**And a wrong answer nobody had reported.** A path that has children is a
prefix, and a trailing `*` is how a router admits them rather than a segment:

```tsx
{ path: 'settings/*', children: [{ path: 'application-infos', … }] }
```

answered `/settings/*/application-infos`, with a trail carrying `*` as though a
breadcrumb could point at it. This reaches the in-file walk with no mount
involved, so it predates the mount mechanism entirely — and composing onto
stated paths, which is what #1 asks for, would have multiplied it.

## A third thing, which the change itself created

Composing onto stated paths makes an entry's own path matter in a way a pathless
one never could, and one shape of stated path may not be composed onto at all:

```tsx
{ path: 'customers', children: [{ path: '/admin/audit', element: <Audit /> }] }
```

Vue Router reads the leading slash as the root; React Router refuses a nested
absolute path that does not already begin with its parent's. Either way the
answer is `/admin/audit`, and the walk gave `/customers/admin/audit` — before
this change, and without any mount, so it is one more wrong answer that predates
the issue. A path the table wrote absolute is now answered whole, and, since
nothing above it can apply, without sweeping the project to find out what is.

## What it costs

Whether something mounts a table is the question, and it cannot be answered
without looking. So a screen whose registration states a *relative* path now
pays the sweep that only a pathless one used to. Measured on the largest
repository here, 24,752 files, one screen: **0.10 s to 2.8 s**.

Paid by `uic place` alone — the only caller outside the module
(`src/cli/index.ts:445`) — and never by the hook, which asks `declaredSiblings`
for the registration and never for the path. A deliberate command may read a
project. The alternative is the cheaper wrong answer.

## The before/after that could be produced

600 screens across five repositories, the shipped bundle before and after:

| repository | screens | answers changed |
| --- | ---: | ---: |
| strapi | 120 | **1** |
| medusa | 120 | 0 |
| directus | 120 | 0 |
| grafana | 120 | 0 |
| vue-pure-admin | 120 | 0 |

The one change is the splat:

```
old  /settings/*/application-infos   trail ["settings", "*", "application-infos"]
new  /settings/application-infos     trail ["settings", "application-infos"]
```

Right, and checkable against the application rather than against an opinion:
strapi's own navigation links to `/settings/application-infos`
(`packages/core/admin/admin/src/constants.ts`).

Zero of the 600 changed because of the relaxed condition, which is what the
first table predicts. The relaxation is exercised by fixtures and by #1's own
reproduction; the repository that would exercise it at scale is still the one
that is not here.

## Left alone, and said so

JSX `<Route>`s split across files carry the same defect — a child file's
`<Route path="detail/:id">` mounted under `<Route path="orders">` answers
`/detail/:id` — and no relaxation of this condition reaches them: a JSX route
sits in no array binding, so `bindingOf` answers null and the mount mechanism is
never entered at all.

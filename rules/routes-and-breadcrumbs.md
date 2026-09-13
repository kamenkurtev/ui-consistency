# Where a route and a breadcrumb come from

The breadcrumb is the proof case for this whole rule, and it is got wrong nearly
every time — for a structural reason:

> A breadcrumb encodes the **navigation hierarchy**, which is not visible in the
> file being edited. It is in the router.

So is the route, and so is the answer to *which screens are siblings*. A screen
read on its own cannot know any of the three, and inventing them from the folder
name is a confident wrong answer.

## Where the router is, per family

| Router | Where the route is declared |
| --- | --- |
| React Router, and most React applications | a **table** — an array of objects with a `path` and a component, or `<Route path=… element=…>` markup. Usually kept beside the screens it routes, sometimes in a `router/` folder next to them. |
| Angular, module-based | a **routing module** — `*-routing.module.ts` beside the component it routes, naming the component *class*. |
| Angular, standalone | a **routes file** — `*.routes.ts`, the same shape without the module. |
| Vue Router | a **`router/` directory**, usually with lazy `component: () => import(…)` entries rather than named imports. |
| Next.js app router, SvelteKit | **the folder is the route.** There is no table; a segment in parentheses is grouping and not a path segment, and a segment in brackets is a parameter. |

## Reading one

- **Nearest first.** When two tables name the same screen, the near one routes
  it — an application shell mounting a feature is a different statement about a
  different thing.
- **A route entry names the component, not the file.** In Angular that is the
  exported class; the file is named differently on purpose.
- **The path may not be on the same line.** A nested table puts it above the
  component; a flat one puts it below; markup puts it on the same line. Read all
  three, nearest first.
- **The path may not be in the same file either.** A routes array exported from
  one file and mounted under a path in another — `{ path: 'customers', children:
  monitorRoutes }` — is where the path of a pathless entry lives. An `index: true`
  child and a guard wrapper both state no path of their own, and on one real
  repository that was 50 of 117 screens. Find what mounts the array before
  concluding the project states no path.
- **A `redirect` is not a route to a screen**, and a mock or a fixture is not the
  router. Both have produced confident wrong answers.

## A path and a registration are two different facts

Keep them apart. An entry with **no path of its own still names the table**, and
losing that second fact is how a screen falls back onto guessing from its own
folder. *"This table registers this screen and states no path for it"* is a
complete, useful answer: the family is still the screens that table registers,
and only the trail is unknown.

## Composing a path, and the four times you must not

The unit is the route **object**, not the line, and the path composes down the
tree. Reading a table as text gave **52 invented paths out of 117 screens** on
one real repository, each borrowed from a neighbouring entry.

Then compose the mount on top — for **every** entry in the table, not only the
pathless ones. A mount shifts an entry that states a path just as much:
`{ path: 'detail/:id' }` in an array mounted at `orders` is `/orders/detail/:id`,
and answering `/detail/:id` is a partial path presented as a whole one. Find the
mounting file **by content, never by name** — on that repository it is called
`shellConfig.tsx` and matches no routing-file pattern.

Four things never compose:

- **A parent's trailing `*` is how it admits children, not a segment of their
  paths.** `{ path: 'settings/*' }` gives a child `/settings/…` and a trail with
  no `*` in it.
- **A path the table wrote absolute is already whole.** `{ path: '/admin/audit' }`
  takes nothing from above it, in its own table or in the one that mounts it.
- **Two tables mounting the same array** under different paths: answer no path.
- **A search you did not finish**, or an exported name too generic to be
  evidence: answer no path.

In all four, **answer nothing rather than a prefix** — a partial path presented
as a whole one is the worst available answer. And where the entry states a path
of its own, leave it exactly as the table wrote it: refusing to compose is not
refusing to answer.

## The path may not be a literal at all

A project that keeps its paths in an enum, a frozen object or a module of
exported strings writes every `path:` as a **name**. Reading only literals
answered *no path* for every screen in one real application — the registration
found 117 times and the path never.

Resolve a constant **by value**: from the table's own declarations, and one hop
through the imports that bring in a name a path is written with. Never read
`RoutePaths.Dashboard` as `'dashboard'` from the member's spelling — that is
guessing at a project's naming, which is what every rule here exists to stop. A
template literal with one part you cannot resolve answers nothing, not a partial
path.

**Say which it was.** A path resolved from a constant is worth knowing about
before it is repeated back to somebody.

## Where the table is

Walk **outward from the screen**, not down from the repository root. A search
that started at the root and stopped four directories down was silent for every
screen in a monorepo, because a route table in `libs/<area>/<pkg>/src/lib/` is
five deep.

## The breadcrumb, specifically

**Derive it from the route hierarchy, never from the page title.** A title is
what this screen is called; a trail is where it sits. They agree often enough
that using the title looks right until it does not, and then it is wrong on
exactly the screens that matter — the nested ones.

Where a project's own screens build the trail some other way, that is a
statement about the project and belongs in its decisions file. Follow that
instead.

Read by: `ui-consistency:pattern`, `ui-consistency:screen`,
`ui-consistency:decide`.

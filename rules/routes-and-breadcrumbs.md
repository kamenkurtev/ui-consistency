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

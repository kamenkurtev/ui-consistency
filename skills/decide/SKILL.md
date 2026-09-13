---
name: decide
description: Use when there is no pattern to derive — the first screen of a kind, a new project, a new area, or when ui-consistency:pattern answered "fewer than three screens of this kind to compare". Also when the user says "there is nothing to copy", "this is the first one", "we are starting a new section", "what should this look like", "we have not decided yet", or is about to start a refactor from one page outwards. Walks the anatomy of a screen as questions, records only the answers the user actually gives, and writes .ui-consistency/decisions/<kind>.md so the next screen has something to be measured against.
---

# The first screen of a kind

```
No pattern found: fewer than three screens of this kind to compare.
```

That is the honest answer and the commonest one. Two screens are a copy, not an
agreement, so nothing can be derived — and on a small project, a new area, or
the first page of a thirty-page refactor there is nothing to derive *from*.

**This is not a fallback. It is the seed step**, and it is where intent enters:
everything the tool does afterwards measures screens against each other, and
somebody has to say what the first one should be.

## 1. Say what is happening, in one line

> There are no other screens of this kind to read, so there is nothing to
> derive. What we decide here is what the next one gets measured against.

Not an apology and not an error. Then get on with it.

## 2. Read what the project already has — without inferring a pattern from it

Facts to choose *from*, so the answers are the project's own components rather
than invented ones. None of this is a pattern; three files are not an agreement
and two are not either.

```
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" scan
node "${CLAUDE_PLUGIN_ROOT}/bin/uic.mjs" inventory <the nearest shared package>
```

`scan` names the layers and how they were detected. `inventory` lists what a
package exports and what is marked `@deprecated`, so a component nobody should
use any more is not the one that gets chosen here.

If there is even one screen that already exists, read it. One screen is an
example to point at, never a majority.

## 3. Walk the anatomy as questions

`${CLAUDE_PLUGIN_ROOT}/rules/anatomy.md` — the roles a screen has, in the order
they are read. Take them **in that order** and ask about each one.

Every role takes one of exactly three answers, and the third is a real answer:

- **"this project puts X here"** — record it.
- **"not applicable here"** — record that too. An application with no sidebar
  must not be given one because the list has a row for navigation.
- **"undecided — ask later"** — record it as undecided, or record nothing at
  all. Do **not** guess, and do not write a placeholder sentence for somebody
  to fill in later. A decisions file with an unanswered question in it is worse
  than a shorter one.

The breadcrumb is the one to slow down on. It comes from the **route
hierarchy**, not from the page title, which is why it is got wrong nearly every
time. `${CLAUDE_PLUGIN_ROOT}/rules/routes-and-breadcrumbs.md` is how to read the
router for it — where the table is per framework, how a path composes, and the
four times it must not.

`roles-and-names.md` is the one to have read first: a role with no answer is an
answer, and inventing a name to fill a gap is the failure this whole step exists
to prevent.

## 4. Write down only what was said

`${CLAUDE_PLUGIN_ROOT}/rules/what-a-decision-is.md` is the test for whether a
line belongs here: **could this be derived from the code?** If yes, leave it out.

```
.ui-consistency/decisions/<kind>.md
```

Five to twenty lines. The `kind` is the **holder** — what this kind of screen
sits in — and it is a fact about the code, not a label to invent. If the user
cannot say what kind of screen this is, do not write the file.

```markdown
# <kind>

canon: src/pages/OrdersPage.tsx

- The breadcrumb comes from the route, never from the page title.
- Every screen of this kind writes `dataTestId`.
- No footer. Not applicable here.
- Undecided: whether the filters sit above the grid or in a drawer.
```

`canon:` points at this screen. That pointer is the whole of what is stored —
**facts about the code are derived every time**, because a stored copy of what
the code says can only go stale. If the pointer ever stops resolving it is
reported where the decision is used, not by an audit somebody has to remember.

Nothing derived goes in this file. That is what keeps it short.

## 5. Say what happens next

Tell the user, plainly:

- this screen is now the reference for its kind;
- `ui-consistency:pattern` will answer from the family once there are three,
  and until then it answers from this pointer —
  `ui-consistency:pattern` reads it;
- **nothing here gates anything.** Nothing derived may fail an edit, and
  nothing decided here fails one either. The one place derived material could
  ever fail anything was a person choosing to put it in a build gate.

## What this must not do

- **Not draft prose nobody asked for.** A setup command this project once had
  and deleted left a real repository with 285 lines of *"Use `<Alert>`. Say here
  when it applies and what it replaces."* — a skeleton for 700 components with
  no rule in it. Write the answers the user gave and nothing else.
- **Not invent a kind.** The holder is a fact; a label is a guess.
- **Not gate anything**, and not promise that it will.

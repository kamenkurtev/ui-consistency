# What belongs in a decisions file

`.ui-consistency/decisions/<kind>.md`. **Five to twenty lines, mostly pointers**,
committed and reviewed like code.

It is the **only** thing stored. Every fact about the code is derived fresh every
time, because a stored copy of what the code says can only go stale — and every
staleness problem this project has had came from such a copy.

## The test for whether a line belongs

**Could this be derived from the code?**

- **Yes** → leave it out. It will be derived, and more accurately than anybody
  will maintain it.
- **No** → it belongs here, and nowhere else.

That is the whole rule, and it is why the file stays short.

## The statements that cannot be derived

These are the ones worth writing, and the part nobody writes down:

- **Which screen is canonical.** `canon: <path>`. A pointer, not a copy. From an
  AST, thirty pages sharing a convention and thirty repeating one old mistake
  are identical — only a person can say which is which.
- **Which of two competing patterns the team is moving *towards*.** Extraction
  reads what *is*; a migration is about what *will be*, and the majority is
  usually the side being migrated away from.
- **Where something comes from, when the code does not show it.** *"The
  breadcrumb comes from the route, not the title."* The code shows the value; it
  does not show the decision.
- **What is deliberately not applicable.** *"No footer on screens of this kind."*
  Without it, every future reader re-asks and re-decides.
- **What is still undecided.** A real answer, and recording it stops the same
  question being reopened as though it were new. Do not write a placeholder for
  somebody to fill in — write that it is open, or write nothing.

## A worked example

```markdown
# PageLayout

canon: src/pages/OrdersPage.tsx

- The breadcrumb comes from the route hierarchy, never from the page title.
- Filters live above the grid. We tried a drawer and moved away from it;
  the two screens that still have one are being changed.
- No footer. Not applicable on screens of this kind.
- Undecided: whether the row actions are a menu or inline buttons.
```

Four lines and a pointer. Everything else about those screens — the holder, the
region order, the props they all write, what the layout provides — is derived,
and stays correct without anybody touching this file.

## What must not go in it

- **Anything derived.** It will disagree with the code within the month.
- **A skeleton with unanswered questions.** A generated 285-line file listing 700
  components with *"say here when it applies"* against each is worse than nothing:
  it looks like a decision has been made everywhere and none has been made
  anywhere.
- **A rule about code in general.** This is about screens of one kind in one
  project. Lint rules belong in a linter.

Read by: `ui-consistency:decide`, `ui-consistency:pattern`.

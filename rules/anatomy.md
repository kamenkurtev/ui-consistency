# The anatomy of a screen

What to enumerate before writing one, and in what order. Read this, then answer
each item **from the project** — from the contract `ui-consistency:pattern`
produced, from the screens beside it, or by asking. Never from what a screen
usually looks like in general.

## The reading order

**Top to bottom, then left to right.**

This is a mechanism, not a style. Two screens read in the same order produce
comparable lists, and comparable lists can be diffed. Read them in whatever
order the eye happens to fall and every reading differs, so nothing can be
compared with anything.

## The roles

In the order they are met. Each is a **question**, not a requirement: the answer
is either *"this project puts X here"* or *"not applicable here"*. An
application with no sidebar must not be given one because this list mentions
navigation.

| Role | The question |
| --- | --- |
| **navigation** | Is there a persistent nav, and where — left, top? What marks the current page? |
| **breadcrumb** | Is there a trail? **It comes from the route hierarchy, not from the title** — that is why it is so often wrong. |
| **header** | What holds the title, and what sits beside it — actions, a search, a status? |
| **content** | What holds the body, and does it carry the scroll or does the page? |
| **the body itself** | For a list: the grid, its filters, its row actions, its empty state, its pagination. For a detail: the sections and their order. For a form: the field layout, the validation, where the submit sits. |
| **footer** | Is there one, and is it part of the screen or of the layout around it? |
| **actions** | Where do a screen's own actions live — in the header, a toolbar, beside the content? |

## Three rules about answering them

**A role with no answer is not a gap to fill.** Write "not applicable" and move
on. Inventing a footer because the list has a row for one is exactly the failure
this whole tool exists to prevent.

**A role answered differently on every screen is not a convention.** If the
screens disagree, say so and ask. Picking the commonest enforces whichever was
written first.

**What the reference page alone does is not part of the answer.** The contract
lists those separately, under `particulars`, and they are the things not to
copy.

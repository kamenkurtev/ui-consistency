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

## First: the screen file is a wiring file

**The anatomy that makes a file *that kind of screen* is one hop down, inside
what it renders.** A screen file renders one or two components and the roles
below are inside them. Classifying 132 real screens by what the file itself
renders put 11 in the largest bucket; following one hop put 26 there — so a
pattern written from the screen file alone describes the wiring and not the
screen.

Five things about taking that hop, each of which was wrong on a real screen
before it was written down:

- **Follow what the component *returns***, not the largest JSX in the file. A
  detail screen declaring its tabs as objects had a bigger `content:` than its
  own four-line return, so reading the biggest gave the loader and the screen
  was invisible.
- **Walk through the gates.** A child inside `{cond && <X/>}`, a ternary, a
  `.map` or a fragment is a child. That is how most screens gate on data.
- **Content passed as data is anatomy too.** `<SectionTabs tabs={tabs} />` is a
  leaf while the whole anatomy sits in `tabs[].content`. Follow the prop, and
  say the child came from one. Where the prop cannot be read in the file, name
  it as unresolved — but only if the element holds nothing else, because a prop
  nobody can read beside a child that is right there says nothing, and a report
  that floods gets ignored.
- **A component from another package of the same workspace is not external.**
  On a monorepo the project's own design system is imported by package name, and
  calling that external says *nothing below here is our business* about the
  project's own code — 53 of 62 children on one real repository. Name it, and
  **do not descend into it**: `Page / Header / Content` is the vocabulary a
  pattern wants and that layout's internals are not.
- **A file whose whole output is one component is itself a wiring file**, so
  follow its root too. That is the hop this exists for, and following children
  alone never takes it.

Count depth in **file hops**, state the bound you applied, and say why each
branch ended. *Stopped at a package boundary* and *could not resolve this
specifier* are two different facts, and merging them claims a depth you did not
reach. Nothing is its own child.

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

**What the reference page alone does is not part of the answer.** List those
separately — `rules/family-and-particulars.md` is the rule for it — and they are
the things not to copy.

## Two shapes, and only one of them has regions to fill

**The commonest real page shape has no named regions at all**: a holder plus one
child, with the header, the title and the breadcrumbs in the holder's **props**.
Measured so on a real React monorepo and a real Angular one.

So before concluding a project has no conventions, say which shape you are
looking at:

- **named regions filled by sibling components** — the roles table above maps
  directly onto them;
- **a holder plus one child** — there is nothing to fill, and the conventions
  are in the holder's props and in *what the holder holds*. *"Every screen of
  this kind renders exactly one `*Grid` inside its holder"* is a real convention
  and needs no region vocabulary at all.

An empty answer that means **"this project is outside what I was looking for"**
must never be reported as if it meant **"nothing was found"**. The second
invites somebody to conclude everything is fine.

## What the layout already provides

Before adding a role, check whether the thing **above** this screen supplies it.
In a router-based framework the nav, the header and often the footer live in the
layout, and a page that adds its own is the mistake — *"your page renders inside
a layout that supplies the nav and the header, do not add another"* is the single
most useful sentence a pattern carries.

Where the project's screens are `div`s and classes rather than layout
components, no component fills a role because the project has none. Say that
plainly: what repeats there is class structure, which is out of reach of reading
one file.

# Roles are universal; names are local

A screen has a holder, a header, a body, actions. Those are **roles**, and every
application has them whatever it calls them.

What fills each role is **this project's name for it**, and it is not knowable in
advance. It is not in any list, and a list long enough does not exist.

## Why this is the rule that keeps being broken

Every time knowledge about somebody else's names was written down as a list, it
broke silently on the neighbouring case:

- A list of grid components matched **not one grid** in either of two real
  repositories — their grids are named after what they show, and the most
  frequent element in one of them was a versioned name nobody would guess.
- A list of region components recognised **no roles at all** on an application
  whose screens are a shell holding a header, because the shell and the header
  are named after the application.
- A list of CSS properties silently dropped fifteen of them and nothing noticed
  for weeks.

Each was a small model written by hand, and each failed the way small
hand-written models fail: **silently, on the neighbouring case**, returning an
empty answer that is indistinguishable from a clean one.

## What to do instead

- **Ask the structure, not the name.** What kind of screen this is comes from
  *what holds it* — that is a fact about the project and needs no vocabulary.
  What role a component fills comes from where it sits.
- **Take names from the project.** The inventory of what a package exports, the
  screens beside this one, and what somebody wrote down. Never from what a
  component is "usually" called.
- **Never invent a name to fill a gap.** A role with no answer is not a gap to
  fill; it is an answer. Write *"not applicable here"* and move on.

## The reading that matters most

**An empty answer meaning "your project is outside what I read" must never be
reported as if it meant "nothing was found".** The second invites somebody to
conclude everything is fine.

That applies to you as a reader of this tool's output as much as to the tool.
Before concluding a project has no conventions, check whether the question was
one this project answers in that form at all — a screen whose chrome lives in
its holder's props has no region components to compare, and that is a shape, not
an absence.

Read by: every skill.

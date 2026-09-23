# A mockup of the page-to-be

Read by `finding-patterns` where the shape is shown before any code
([deciding.md](deciding.md), *Show the shape before any code*), or where a person
asks to see the page before it is written. Optional otherwise: the checklist is
the result, and this is a way to look at it.

It shows **whether the page hangs together**, drawn with the values the phase
just measured. Nothing new is measured — it is the checklist with its numbers
applied.

## What it is

**One self-contained HTML document.** Inline styles, its `:root` carrying the
values the phase resolved — the theme's entries, the spacing base and the gaps,
each position's type bundle, the radius, the heights of controls, rows and bars —
and every image embedded: an SVG as markup, a raster as a data URI. **No relative
path to anything**, so the same file works opened directly, served, or attached
to a task.

It shows **the roles in their order, at the sizes the family writes**: which
holders, what stands in each, how the regions are spaced, what the text looks
like at each position.

## What it must not do

- **Never an imitation of a piece the project has.** A region is drawn as a
  plain box at **the measured values** — the control height the family writes,
  the radius and border from the theme, the label's type bundle — and **labelled
  with the project's own piece** for that role — never drawn to look like the
  project's field or button.
- **No behaviour.** No hover, focus, error state, animation or interaction.
- **It says what it is, on its face**: a line at the top of the document — *a
  static arrangement with this project's values, not its components*.
- **Nothing invented.** A value the phase could not resolve is drawn as
  unresolved — marked, with what was missing — never filled with something
  plausible.
- **Never read back.** Values go into it from the theme; nothing is ever taken
  out of it ([design.md](design.md), *Never a value*).

## Three levels, and the question each answers

| | Answers | Where |
|---|---|---|
| **The arrangement** | the right roles, in the right order, at the right sizes | this document |
| **One control's look and behaviour** | what the real piece does | wherever the project already renders its real components — a component catalogue, a demo page, the running application. **Point at it; never redraw it** |
| **The real thing** | does the page match | the application, and `ui-consistency:verifying` |

## Where it is shown

The document is the same in every case; only how it is looked at changes.
**Nothing is written inside the working copy**, in any of them.

1. **A visual companion is already running** — another process with a browser
   channel. Write the document where that serves from. A complete document is
   served as it is, so the project's values keep their own styling; nothing in
   the companion is patched or asked to change.
2. **Nothing is running.** Write the document to a newly created directory
   outside the working copy and open it the way the platform opens a file. To
   iterate, a one-command static server there and a few lines of polling in the
   document reload it as it is rewritten.
3. **No browser** — remote, headless. Report the path. Never say it was shown.

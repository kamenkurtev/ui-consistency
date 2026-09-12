# Raw values: colours, lengths, and emoji standing in for icons

You wrote the line. You can see the literal in it without a program parsing the
file back, which is what this replaced (#79).

## The rule, while you write

**No colour literal.** `#ff0000`, `#fff`, `rgb(…)`, `rgba(…)`, `hsl(…)`,
`hwb(…)`, `lab(…)`, `lch(…)`, `oklab(…)`, `oklch(…)`, `color(…)`. Take the
colour from the project's palette or theme.

**No absolute length.** `px`, `pt`, `pc`, `in`, `cm`, `mm` — a number with one
of those units, or a bare number in a key that means pixels. Take the spacing
and the type size from the project's scale.

**No emoji where an icon belongs.** `✕` for a close button, `⚠️` beside a
message, an emoji as the value of `icon`, `startIcon`, `endIcon`, `avatar`,
`logo`, `leftIcon` or `rightIcon`. Use the icon component the rest of the
screens use. An emoji *inside copy the user reads* is text, not an icon, and is
none of this rule's business.

Everywhere a style can be written: a `sx` object, an inline `style` object, a
`style=` or `[ngStyle]` attribute in a template, a `styled`/`css` tagged
template.

## Four things this rule knows that a first reading does not

Each was learnt by the check being wrong on a real project, and each is the
reason the blanket version of the rule is worse than this one.

- **Zero is zero.** `0`, `0px`, `0rem` — no design system has a token for it,
  and faulting it is noise.
- **Relative units are not raw values.** `rem`, `em`, `%`, `vw`, `vh`, `ch`,
  `fr` express a relationship rather than a fixed size. Leave them.
- **A bare number in `sx` is usually a theme multiplier, not pixels.**
  `sx={{ mt: 2 }}` is `theme.spacing(2)` and is the *correct*, token-respecting
  form; so are `borderRadius`, `letterSpacing` and `lineHeight`, which take a
  ratio. The same key in an inline `style` object is plain pixels and is raw.
  Flagging the `sx` form faulted idiomatic code on nearly every component of a
  real codebase, in the week somebody was deciding whether to keep the plugin.
  `fontSize` is the exception on both: `fontSize: 12` is twelve pixels wherever
  it is written.
- **Width and height are a layout decision, not a bypassed token.** Almost no
  design system has a width token. On one real repository those were **168 of
  372 findings**, nearly all of them legitimate — and a rule that floods gets
  ignored, after which it costs more than every finding it would have made.

## What this rule may and may not claim

It states **the project's position** — which is what a rule is for. It does not
claim a token exists for the value you wrote: nothing here reads a theme, and
the check this replaced had that claim removed for exactly that reason (#64).

So: name the literal, say the project takes this from its scale or its palette,
and where the project has more than one theme preset **say which**. Where the
project has genuinely stated nothing about colours or spacing, write what the
neighbouring screens write and say that is what you did.

## Out of reach, and say so rather than implying coverage

A class-based system — Tailwind, CSS modules, a stylesheet beside the component
— puts the value in a class name or another file. This rule reaches what is in
the file you are writing. If the project styles that way, the honest answer is
that it is out of reach here, not that the screen is clean.

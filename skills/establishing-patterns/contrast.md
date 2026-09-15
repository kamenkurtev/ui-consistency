# Contrast: pairs, schemes, thresholds

Read by `establishing-patterns` when it records the pairings a family uses, and
by `building-with-patterns` and `verifying-against-patterns` for every
foreground on a surface.

A foreground and a background can each be a correct theme entry and still be
unreadable together. Check **pairs**, never single values.

- **Resolve both sides**: the foreground, and the surface actually behind it —
  often set several levels above the element. A semi-transparent colour is
  composited over what is behind it first. Where a side cannot be resolved, the
  pair is **unevaluated**: say so, never pass it.
- **Not only text.** Anything that carries meaning without words is a pair too: an
  icon used alone, a state colour, a disabled control, a focus ring, a border that
  is the only thing separating two surfaces.
- **Every scheme the project has.** Where there is a light and a dark scheme,
  check each pair in both. A value chosen against one surface and inherited by
  the other scheme is a normal way to get an unreadable pair; report it.
- **The threshold is the project's where it states one** — a contrast setting in
  the theme, a linter rule, a written rule. Record it in the pattern file.
- **Where the project states none**, use an external standard and name it as the
  default, not as the project's rule: WCAG 2.2 AA — 4.5:1 for text, 3:1 for large
  text and for non-text elements that carry meaning. That standard exempts
  disabled controls, so under the default their pairs are recorded with a ratio,
  not reported as failing. Report each ratio so a person can decide.
- **The ratio is arithmetic**, not a tool: for each colour, take each channel
  `c = value / 255`, linearise it (`c / 12.92` if `c ≤ 0.04045`, else
  `((c + 0.055) / 1.055) ^ 2.4`), luminance `L = 0.2126 R + 0.7152 G + 0.0722 B`;
  ratio `(L_lighter + 0.05) / (L_darker + 0.05)`.

Record the pairings the family actually uses, in each scheme, with their ratios.

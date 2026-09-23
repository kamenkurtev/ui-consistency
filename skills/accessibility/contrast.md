# Contrast: pairs, schemes, thresholds

The first of the six subjects in [SKILL.md](SKILL.md), and the one the phases
reach most often: `finding-patterns` when it records the pairings a family uses,
`implementing` and `verifying` for every foreground on a surface.

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
  the theme, a linter rule, a written rule. Report it with the decision it
  settles, and carry it on the task's checklist
  ([checklist.md](../finding-patterns/checklist.md)), which goes when the task
  does.
- **Where the project states none**, a threshold is measured only when
  accessibility was asked for — otherwise record the pairings with their ratios
  and report none as failing. When asked, use an external standard and name it
  as the one used, not as the project's rule: WCAG 2.2 AA — 4.5:1 for text, 3:1
  for large text and for non-text elements that carry meaning. That standard
  exempts disabled controls, so under it their pairs are recorded with a ratio,
  not reported as failing. Report each ratio so a person can decide.
- **The ratio is computed** with the WCAG relative-luminance formula, never
  estimated by eye.

Record the pairings the family actually uses, in each scheme, with their ratios.

# Spacing: the scale, the rhythm, the side that owns the gap

Read by `establishing-patterns` when it records how a family spaces its roles,
and by `building-with-patterns` and `verifying-against-patterns` for every gap.

Two pages with the same holder, components and props still look unrelated when
one separates its sections by one unit and the other by three. The space is a
fact, read and counted like the rest.

- **The scale.** Find the project's spacing unit and the multiples actually in
  use. It may be named values in the theme, or only a set of utility or shared
  classes that carry the multiples and are written down nowhere. Say which
  mechanism you read.
- **The rhythm.** Count the gaps between stacked roles per position, with their
  file spread: holder to content, section to section, field to field, the last
  field to the action row, the page's own outer padding. *Field to field is one
  unit in 6 of 6 across 6 files* is a convention.
- **Which side owns the gap** — a margin on one component, a padding on the
  other, or a gap on the container holding both. Record it where the project is
  consistent; mixing them is how a gap doubles or collapses.
- **No scale at all** is the finding. Make one proposal, in the same batch as the
  others, for a single place to keep the unit in the form the project can use —
  never a proposal per page.
- **No consistent rhythm** is also a finding: say the project has none. Do not
  invent one from a plurality.

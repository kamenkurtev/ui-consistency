# Spacing: the base, the rhythm, the side that owns the gap

Read by `finding-patterns` when it records how a family spaces its roles, and by
`implementing` and `verifying` for every gap.

Two pages with the same holder, components and props still look unrelated when
one separates its sections by one unit and the other by three. The space is a
fact, read and counted like the rest.

## The base is derived, never assumed

- **Derive it from the values the project keeps**, in this order: the named
  values in the theme, then the multiples carried by utility or shared classes.
  Only where the project keeps its values nowhere do the literals in the pages
  become the source. The base is the largest value they are all whole multiples
  of. Say which values you read and which mechanism carried them.
- **A literal that sits off what those produce is a candidate deviation, not
  evidence about the base.** Folding it in collapses the base to something that
  divides everything, and then nothing is ever off it — which is the same as
  having no check at all.
- **A largest common divisor is not automatically a base.** Any set of whole
  numbers has one. Check that the multiples it produces are the ones the project
  actually writes; where they are not, the project has no base.
- **Never assume one.** The numbers that are common elsewhere are not this
  project's answer until its own values say so, and a base taken from habit
  turns every correct value into a deviation.
- **Too few values show no base.** Two values share a divisor whatever they
  are, and it says nothing about the project. Before deriving one from a
  handful, widen the source in the same order: the theme, then shared classes,
  then the pages nearest in kind. Where there are still too few for their
  multiples to be tested against what the project writes, **the base is not
  derivable**: say so, with the values. Nothing is reported off a base there is
  not; each gap is checked against what the family writes at that position.
- **Where the values share no base**, the finding is that the project has none.
  Say so; do not promote the most frequent value into a rule. Make one proposal,
  in the same batch as the others, for a single place to keep the base in the
  form the project can use — never a proposal per page.
- **Record the base as derived**, with the values it came from — a checklist
  line that states a base without saying what produced it cannot be checked.
- **The multiples in use** are counted separately from the base: which ones the
  family writes, where, and in how many files.

## A value can be wrong in two ways, and only one of them is wrong

- **Off the base** — not a whole multiple of it. A deviation: report it with the
  base and the nearest multiples on either side.
- **On the base but not in use** — a whole multiple no page has written yet.
  **Not wrong, and never reported as wrong.** Say what it is: on the project's
  base, new here, with the multiples the family does write and their file
  spread. A project that has not needed a value yet is not a project that
  forbids it.

## The rhythm between roles

Count the gaps between stacked roles per position, with their file spread:
holder to content, section to section, field to field, the last field to the
action row, the page's own outer padding. *Field to field is one unit in 6 of 6
across 6 files* is a convention.

- **Which side owns the gap** — a margin on one component, a padding on the
  other, or a gap on the container holding both. Record it where the project is
  consistent; mixing them is how a gap doubles or collapses.
- **No consistent rhythm** is also a finding: say the project has none. Do not
  invent one from a plurality — [counting.md](counting.md) says how to tell.

## The rhythm the text sets

The gaps between roles are only half of it. The text sets a rhythm of its own,
and a page whose lines sit differently reads as another product even when every
gap between its sections matches.

- **The line height belongs to a type role**, and is recorded with the rest of
  the bundle in [typography.md](typography.md) — not here.
- **Whether the space around a block of text stands on the base** is this file's
  question. A heading with a gap above it that is not a multiple is the common
  way a page drifts while every named value in it is correct.

## The heights of controls, rows and bars

The most visible difference between two pages that otherwise match, and the one
nothing counted. They sit on the same base as the gaps.

- Count them **per role, with their file spread**: the page's own bar, one row
  of a collection, a field, the submit button, a dialog's action row.
- **Where a height is not set in the code** — it comes from the content, or from
  a piece whose insides are not in the repository — say it is unevaluated.
  Never infer it.

## No number from outside the project

Nothing here carries a number the project did not produce. A **minimum** size
somebody has to be able to hit is a different question with a different answer,
and it lives with the standards: `ui-consistency:accessibility`
([SKILL.md](../accessibility/SKILL.md)).

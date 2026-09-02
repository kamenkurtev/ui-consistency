# Dashboard widgets

Widgets are the cards on the dashboard grid. They are small, they are read at a
glance, and they only look right when they look like each other.

## Widget title

The title is `<Typography variant="h6">`. Never a raw heading element and never
a `fontSize` — the scale is the only thing that keeps eight widgets aligned.

## Widget icons

Icons come from `@fixture/icons` and are rendered through `<WidgetIcon>`, which
sizes and colours them. **Emoji are never icons** — they render differently on
every platform and cannot take a theme colour.

## Widget shell

Every widget is wrapped in `<WidgetCard>`, which owns the padding, the border
radius and the hover state. A widget that lays out its own `<Box>` will drift
from the others the first time the card changes.

# Detail screens

## Detail screen archetype

A detail screen is a routed page built on `<DetailLayout>`. It is **not** a
`Dialog` — a detail view must be linkable, and a dialog is not an address.

## Detail header

The header is `<DetailHeader>` with the entity name as its title and the
actions on the right. It is the only place a detail screen puts actions.

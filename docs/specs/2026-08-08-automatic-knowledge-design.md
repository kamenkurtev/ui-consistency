# Automatic knowledge: building and maintaining the corpus without hand-authoring

Design for #99. Supersedes nothing; it extends the knowledge lifecycle described
in `2026-08-02-v2-design-system-consistency-design.md` and built under #24 and
#28.

## The problem

The knowledge base is the input to everything above the deterministic checks:
retrieval feeds the advisory context, and the curated `use X, never Y` rules
feed one of the six checks. Today all of it is hand-written. `uic init` drafts
`components.md` and `pages.md` from Storybook or from a survey of the project's
own screens, and the drafts are explicitly *descriptions* — the header of each
says so — which a person then edits into rules.

That does not scale, and the scale is not a matter of taste. A real design
system is hundreds of components across a core library and a dozen feature
libraries. Nobody writes that by hand, and nobody keeps it fresh by hand as
components are renamed, deprecated and replaced. A knowledge base that is stale
is worse than one that is empty: it produces findings that cite rules which no
longer describe the code, and that teaches people to stop reading findings.

Three things follow, and they are the scope of this document:

1. The corpus must be **built without a person writing prose**.
2. It must be **kept fresh** as the code moves.
3. It must **exist on day one**, because a plugin that does nothing until
   somebody runs a command they were never told about is a plugin that does
   nothing.

## What does not change

**The gate stays deterministic.** Nothing here puts a model on the edit path.

**A generated file may never gate.** This is the load-bearing constraint and it
is mechanical, not philosophical. `src/knowledge/rules.ts` reads the same
directory the retriever does, and turns any fragment containing a negation —
`never`, `not`, `instead of`, `rather than`, `avoid` — into a `SubstitutionRule`
that fails a check. `src/knowledge/page-rules.ts` does the same for layouts. So
a generated sentence containing the word "never" would silently become a rule
that blocks a commit, and the project's second load-bearing decision —
conventions are curated, never inferred — would be gone without anybody
deciding to give it up.

The mechanism, stated once so it cannot be lost:

- Every generated file carries a marker in its first line:
  `<!-- uic:generated v=<plugin-version> at=<iso-date> -->`.
- `parseKnowledge` reads the marker and sets `generated: true` on every fragment
  it produces from that file. One field on `KnowledgeFragment`, set in one place,
  so there is no second way for a fragment to be generated.
- `substitutionRules()` and `pageRules()` skip generated fragments.
- `retrieve()` does not skip them. Generated knowledge is advisory: it reaches
  the agent as context, where a person is reading the result, and it can never
  fail anything on its own.
- A person promotes a generated statement into a rule by moving it into an
  unmarked file, or by deleting the marker after reading the file. That edit is
  the curation, and it is one line of work instead of a page of prose.

This keeps both decisions intact and is worth stating plainly: **authorship
becomes automatic; adoption does not.** The cost that moves is writing, not
judging.

## Where the model runs

The plugin is free and has no API key (#77), and the hook cannot call a model.
So "Claude writes the rules" means precisely one thing: **the generation runs
inside a Claude Code session, through the existing skill surface**, on a model
the user is already paying for. There is no background service, no daemon, and
nothing that runs while nobody is watching.

This splits the work in two, along a line the codebase already draws everywhere
else:

- **The CLI gathers evidence, deterministically.** It reads the sources, counts,
  and emits a structured digest. This is a plain program over the AST and the
  file system, testable, with no model in it.
- **The skill turns evidence into prose.** Claude reads the digest, reads the
  sources it points at, and writes the markdown.

The digest is the interface between them, and it is what makes the expensive
half cheap: the model never walks the repository, it reads a summary that a
program produced.

## What the evidence is

`uic init --evidence` writes a single JSON digest to stdout. Nothing in it is
new machinery; every field comes from an extractor that already exists.

| Field | From | What it establishes |
| --- | --- | --- |
| `packages` | `src/layers/detect.ts` | the layer chain, and which package is the core |
| `components` | `src/cli/survey.ts` | which components the screens actually use, and how often |
| `layouts` | `src/sources/regions.ts` | the holder patterns and their region order |
| `stories` | `src/sources/storybook.ts` | demonstrated prop values, where a Storybook exists |
| `deprecated` | `src/inventory/deprecated.ts` | `@deprecated` tags in the shared packages, with the replacement they name |
| `docs` | new, small | paths of `*.md` under each package that look like design documentation |
| `usage` | `src/sources/usage.ts` | how the screens configure the components they share |

Only `docs` is new, and it is a directory walk producing a list of paths — the
skill reads the files itself, because summarising prose is what the model is
for. Everything else is already built; the digest is a new *view*, not new
extraction.

`deprecated` deserves a note. A `@deprecated` tag is the library author stating
a prohibition in the library's own source, which is as curated as anything in
this project gets — and the deterministic check already acts on it, through the
inventory, without any markdown at all. So the generated `deprecated.md` is not
what enforces deprecation. It exists so the advisory half can *explain* one: the
check says `<OldCard>` is deprecated, and the corpus says what to use instead
and why the project moved.

## The four capabilities

### Works on install

The plugin's `SessionStart` hook checks for `.claude/ui-consistency/` and, when
it is missing, returns one line of context telling the agent that the project
has no knowledge base and that `/ui-consistency-init` will build it. It does not
build anything itself: generation costs tokens, and spending a user's tokens
without being asked is not a thing a plugin may do on install.

This is the smallest change that fixes the real complaint behind #99 — that the
setup step exists but nobody knows to run it.

### Automatic authoring

`/ui-consistency-init` runs `uic init --evidence`, reads the digest, reads the
documentation and library sources it names, and writes the corpus:

- `components.md` — what each component is for and what it replaces
- `pages.md` — which layout holds which kind of screen, with region order
- `deprecated.md` — what is on the way out, and what replaces it
- one file per feature library where its layout differs from the core's

Every file carries the generated marker. The skill's instructions are as much
about restraint as about coverage: write about the components that appear in the
survey, not about all 700; say nothing where the evidence says nothing; never
write a prohibition, because a prohibition in a generated file is exactly what
the marker exists to neutralise.

### Automatic maintenance

`uic audit --knowledge` compares the corpus against the current code and reports,
deterministically:

- a rule naming a component that no longer exists anywhere — renamed or removed
- a deprecation whose subject has no `@deprecated` tag any more — completed
- a replacement whose forbidden component no longer appears in any screen — the
  migration finished, and the rule is now noise
- a component that the survey shows is widely used and the corpus says nothing
  about — a gap

The command only reports. `/ui-consistency-audit` reads the report and rewrites
the affected sections, leaving unmarked files alone — a human-curated rule is
never edited by a generator, only reported on.

### Audit on version update

The corpus records the plugin version it was generated with, in the marker. The
`SessionStart` hook compares it with the running version and, when the plugin
has moved, returns one line suggesting `/ui-consistency-audit`. Same shape as the
install case, and the same restraint: it says something, it does not spend
anything.

## Failure directions

Every one of these fails towards silence, which is the direction this codebase
has chosen everywhere else:

- No digest, or an unreadable one: the skill says so and writes nothing. An
  empty corpus is the state of every project today.
- A generated file a person has since edited: the marker is theirs to remove,
  and once removed the file is human-curated and the generator will not touch
  it. `uic audit --knowledge` reports on it but changes nothing.
- A stale corpus nobody audits: the retriever still returns the fragments, and
  they are advisory, so the worst case is advice that names a component which
  moved — annoying, and visible, and not a failed build.

## What this does not do

- No database, no index, no embeddings, no service. Retrieval is the lexical
  matcher that already exists.
- No background process, no scheduled job, no telemetry.
- No generated prohibition. A generated file cannot fail a check, by
  construction, and the one line that enforces that is in `rules.ts`.
- No API key, ever.

## How it will be validated

The fixtures in this repository have never caught a real defect, and a generator
is the worst possible thing to validate against fixtures, because the fixture and
the generator would share every assumption. So:

- Run it against **Backstage** and read `components.md` by hand. The question is
  not whether it produced files but whether a person who works on that codebase
  would recognise what it says.
- Run it against a **Next.js + Tailwind** app, where there is no Storybook and no
  MUI, to check that the evidence path that does not depend on stories carries
  the result on its own.
- Plant a stale rule — name a component that does not exist — and confirm
  `uic audit --knowledge` reports it.
- Put a generated file containing the word "never" into the corpus and confirm
  no finding is produced from it. This is the one test that guards the decision,
  and it is the one that must never be deleted.
- Run all of it from `bin/uic.mjs` copied alone into an empty directory.

## What the build found

Three things the design did not know, all of them from running the shipped
bundle rather than from the suite.

**The constraint had a third consumer the spec missed.** `substitutionRules`
and `pageRules` are named above; `src/sources/knowledge.ts` is not, and it turns
`<Button variant="contained">` written inside a rule into a prop set that
`statedConventions` lets gate. A generated `components.md` repeating what the
stories demonstrate would therefore have enforced them. Generated fragments now
contribute their component *names* there — that is advice, and nothing acts on
it — and no prop values.

**The prohibition already existed, in the file `uic init` writes today.** Its
instructional preamble contains the example sentence "A page of actions uses
`<ActionGrid>`, never a raw `<Grid>`", inside an HTML comment — and
`parseKnowledge` read comments as prose, so every project that ran `uic init`
got a real, enforced substitution rule about two components it may not even
have. Comments are now stripped before a fragment is made. The marker would
have covered this instance; stripping covers the class, which matters because
the marker is the thing a person is invited to remove.

**The first real run corrected the evidence twice.** Against a single-package
Ionic app: `packages[0].dependencies` was 54 npm names — eslint, cypress,
vitest — because a manifest's dependency list is not a layer chain; only edges
to other packages in the repository are kept now. And the busiest "directory of
screens" in the whole repository was `ios/DerivedData/…/App.app/public/`, a
Capacitor mirror of the built web app, counted three times. The survey now skips
native-platform and build-output directories, which also corrects the component
counts `uic init` has always drafted from.

**Still open, and deliberately not fixed here:** `regionOf` does not recognise a
vendor-prefixed region name, so `IonPage` holding `IonHeader` and `IonContent`
produced no layout at all on that app — 17 screens read, zero layouts. That is
region detection rather than knowledge generation, it is shared with a check
that gates, and it deserves its own issue and its own dogfooding.

## Open, and deliberately left open

**How much of the corpus one session can write.** A design system with 40
documented components is a lot of prose, and there is a context budget. The
first implementation writes what fits and reports what it left; whether that
becomes chunking, or a narrower default scope, should be decided from what the
Backstage run actually costs rather than guessed at now.


## Note added 2026-08-26 (#231): which half of this was withdrawn, and which is back

This spec is a record of what was decided on 8 August and is not rewritten. For
the next reader, the archaeology in short:

**#119 (15 August) withdrew the storage half, and was right to.** *"Automatic
setup, done properly, is no setup at all"*; *"nothing generates prose any more,
so nothing needs marking."* A stored copy of what the code says can only go
stale, and every staleness problem this project has had came from one.

**It silently dropped the triggering half, and that was not argued for.** After
it, nothing derived anything until a person pointed at a file — the session hook
even stated the resulting policy: *"Nothing is generated and nothing is spent
until somebody asks."* Measured, that cost the whole pattern half: on a project
that had written nothing down, 658 of 705 findings were imports.

**#231 restores the trigger without the storage.** Facts are derived on the edit
already being made, cached against the mtimes of the files they came from, and
never written into the repository. The marker mechanism this spec describes —
generated prose that a person promotes by removing a marker — is **not** back,
and is not needed: nothing generates prose.

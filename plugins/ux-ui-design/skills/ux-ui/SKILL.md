---
name: ux-ui
description: >
  Use when the user wants any UI/UX design work: designing or mocking screens, pages, or
  surfaces; multi-screen flows and journeys; palettes, colors, typography, or design tokens;
  component libraries; motion and micro-interactions; redesigning, auditing, or adopting an
  existing UI; extracting a visual system from screenshots of any product; or exploring design
  directions before building. Interviews first — goals, audience, usage, aesthetic instincts —
  in plain language, then adapts the artifact shape to the project instead of mandating a
  pipeline. Produces mockups in whatever medium the agent can produce (usually single-file HTML
  in .mockups/), captures screenshots of them for review and record, and aligns on direction
  before implementation.
---

# UX / UI

One skill for design-phase UI work. It interviews before it generates, adapts
the artifact shape to the project and the user, and treats alignment as the
deliverable — mockups are the medium, not the point. There is no pipeline and
no mandated stages; the reference library carries the craft, loaded on demand
(see the reference map at the end).

Two commitments shape everything below:

- **The user is assumed to be a design novice.** Talk about visual design in
  plain language. Never present named styles as a menu (no "brutalist vs
  Frutiger Aero" pick-lists) — named styles produce the same handful of
  AI-flavored pitches every run and teach the user nothing. Explain what
  visual languages *are* and how they work, learn what the user wants, and
  blend a direction from their answers.
- **Show, don't tell.** Every option comes with something to look at, and
  every option is explained in simple prose: what it does, and why it fits
  what the user said.

## Ground before asking

Read what exists before asking anything. **Ask only for what the repository
cannot answer.**

- `.mockups/` — existing tokens, components, mocks, and their header comments
  (locked decisions; see `conventions.md`). A project with locked tokens
  never gets the palette conversation again.
- The product itself — UI code, README, docs, brand assets, foundation docs.
- The substrate item, when one is active (`.work/active/**/<id>.md`) — its
  audience, scope, and goals are already answers.

## Interview

Batched structured questions (2–4 at a time), each with a recommendation
grounded in what the grounding pass found. For a focused ask ("mock the
settings page"), one short thread is enough. For whole-product or
identity-level work, take a little longer. **Stop interviewing when the next
answer wouldn't change what gets made.**

Collect, in whatever order the conversation wants:

1. **Purpose and goals.** What is the product for? What should this specific
   work achieve? What does success look like for the person using it?
2. **Audience and usage.** Who uses it, in what state of mind, how often?
   Power users who live in it, or strangers who arrive once? On what devices?
3. **How it should feel.** This is the visual-direction conversation, held in
   plain prose. Explain the dimensions of visual language as you go — "every
   interface sits somewhere on a few axes: calm vs energetic, spacious vs
   dense, flat vs tactile, serious vs playful, modern vs retro" — and ask
   where this product should sit and why. Ask what the user wants people to
   *think* when they first see it. Ask about products they love the feel of
   (any medium — apps, games, websites, physical objects). Never ask "which
   style do you want."
4. **Invite references — always, as a standing offer.** Explicitly invite the
   user to share screenshots, links, examples, and references of any kind:
   UIs they like, UIs they hate, competitor products, a mood they have in
   mind, their own existing UI. Not required — but frame it as the single
   most useful thing they can hand you: a handful of concrete references
   teaches more than ten abstract answers. Offer to capture or ingest
   whatever they point at (`capture.md`) — any product, not just HTML — and
   remind them the offer stands throughout the work, not just at interview
   time.

When direction is open and the user is curious rather than decided, offer the
research branch (below) instead of forcing answers.

## Shape the work

After the interview, ask how the user wants to slice the work — always with
a recommendation based on what they described:

- **One comprehensive mockup** — a single interactive artifact walking
  through the whole product or feature.
- **Piece by piece** — option sets per surface; pick as you go.
- **Additive** — extend existing mocks or screens.
- **Journeys** — flow-shaped page sequences matched to their topology
  (`journeys.md`).
- **Standardize first** — tokens, typography, components, or motion, shown
  as showcase pages (`showcase-pages.md`).
- **Explore first** — moodboards and research before committing
  (`showcase-pages.md`, and the research branch below).

The free-text row covers anything else. Re-ask whenever the work outgrows
the original slice — breakdowns are cheap to change.

## Make

The generation loop, whichever slice was chosen:

1. Load the reference(s) the slice names (reference map below).
2. Generate **as many genuinely distinct directions as the territory
   supports** — no fixed count; a focused surface may support two, an open
   identity question many more. Every option must be articulably
   different in one sentence; "same layout, different colors" is not an
   option. Commit to each direction fully; a watered-down compromise
   teaches nothing.
3. Explain each option in simple prose — what it does, why it fits the
   user's answers — as the `.mock-meta` rationale and in your message.
4. **Capture screenshots of everything you made** (`capture.md`). Look at
   them yourself first; fix what looks wrong; then show the user.
5. Ask: pick, hybrid ("take X from 2 and Y from 4"), or push further.
   Iterate. If three rounds pass without convergence, don't stop — surface
   that the scope or goal may be unclear and talk it through; sometimes the
   question isn't "which mock" but "what are we even building."

Craft demands (contrast checks, both-modes-together, motion hard rules,
typographic-color) live in `design-tokens.md`; chrome and file structures
in `mock-css.md`; conventions in `conventions.md`.

## Existing UI

When the product already has UI — code or a product the user names — offer
the audit and let the user pick a stance: **mirror** (capture faithfully,
findings become proposals), **reimagine** (existing UI as constraint,
direction open), or **diegetic prototype** (propose a future). Detectors,
the report, whose-default mirror-mocks, and refusals: `existing-ui.md`.
When the user wants to target another product's feel, extract its visual
system from screenshots instead (`capture.md`) — extract the grammar,
never clone the product.

## Optional branches

**Standardization showcase — offered, never staged.** When the interview
shows more than a handful of mocks coming, or the user asks for tokens,
type, components, or motion: offer to standardize, via showcase pages
(`showcase-pages.md`) that make the choices visible. The rationale, in one
breath: for many-mock projects, locking tokens → components → motion once
prevents the drift every later mock would otherwise fight by hand. The user
runs all, some, or none — inline styling is fine for fast exploratory work.

**Research and mashups.** When direction is open or the user asks to
explore: do current-source lookup on lineages, designers, and styles the
conversation points at; translate what you find into the dimensions from
`visual-languages.md`; and jam directions together — blend at the principle
level (one direction's geometry + another's warmth + a third's hierarchy),
never sticker-blending (one's logo on another's background). Present the
results as moodboards (`showcase-pages.md`) and explain each blend in plain
prose. Honor the user's instincts: when they gesture at something, chase it
with them rather than steering back to safe territory.

## Settle

When the user signs off:

1. **Record.** Substrate work: update the item's `## Mockups` section
   (paths, selected direction, date). Otherwise: a header comment in the
   chosen artifact. The captured screenshots are committed with the mocks
   as the durable visual record.
2. **Foundation extraction — only when foundation docs exist.** If the
   project keeps foundation documents (purpose/architecture/principles
   docs, e.g. a Workbench project's `docs/`), offer to distill the settled
   direction into 1–3 statements in that doc's existing voice, format, and
   altitude — direction-level ("dark-first, data-dense, mono-forward;
   motion productive and calm"), never item status or process. The user
   approves exact wording and placement. Never create a new doc to hold
   design choices; never make the offer when no foundation docs exist.
3. **What's next.** Offer the branches the conversation surfaced but didn't
   take — standardization if mocks will multiply, the next surfaces,
   journeys not yet walked.

## Reference map

Load these as the work needs them — not up front:

| When working on… | Load |
|---|---|
| Conventions: storage, tech rule, capture, linking, when mocking earns it | `references/conventions.md` |
| Visual direction, blending, style exploration | `references/visual-languages.md` |
| Tokens: color, type, spacing, components, motion; contrast; squint check | `references/design-tokens.md` |
| CSS structures and shared chrome for HTML mocks | `references/mock-css.md` |
| Palette/type/component/motion showcase pages, moodboards | `references/showcase-pages.md` |
| Multi-screen flows, topology, journey chrome | `references/journeys.md` |
| Existing-UI audit, stances, reports, mirror-mocks | `references/existing-ui.md` |
| Screenshots: capturing mocks, ingesting and extracting from images | `references/capture.md` |
| Design judgment: the laws, Gestalt, choice, cross-discipline transfers | `references/design-judgment.md` |

## Anti-patterns

- **Don't pitch named styles.** No pole menus, no "pick an aesthetic."
  Talk dimensions and feel; blend; explain in plain prose.
- **Don't default to the safe look.** "Professional / clean / modern" is
  the failure mode this skill exists to prevent — push past it, and shape
  every direction to *this* product.
- **Don't interrogate.** Ask only what the repository can't answer; stop
  when the next answer wouldn't change what gets made.
- **Don't show uncaptured work.** Screenshot, look, fix, then show.
- **Don't mandate.** Standardization, audits, showcases, research — all
  offered, none staged. The user steers; the skill advises.

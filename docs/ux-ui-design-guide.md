# UX/UI Design Guide

How to use the `ux-ui-design` plugin to align on user-interface direction
**before** writing production code — through conversation, and through
mockups the agent produces, screenshots, and commits for reference.

This guide is for humans collaborating with an agent on visual and
interaction design. The plugin runs on Claude Code, OpenAI Codex, and Pi.
It works on its own and pairs with `workbench` or `agile-workflow` (see
the pairing sections below).

## What this is

One skill, **`ux-ui`**, that turns your agent into a design concierge.
There is no fixed pipeline and no menu of named styles. The skill
interviews you — what the product is for, who uses it, how it should
*feel* — in plain language, then proposes how to slice the work and
generates directions shaped to your product. You react, hybridize, and
sign off. The mockups are the medium; the alignment is the deliverable.

**Mocks are throwaway.** Usually single-file HTML with vanilla CSS/JS —
no build step, no frameworks — so they open in any browser, years from
now. **The screenshots are not throwaway.** The agent captures images of
every mock it makes, reviews its own work before showing you, and commits
the shots beside the mockup code. Future agents read the images to recall
the chosen direction without re-rendering HTML.

## Before you start

```bash
# Claude Code
/plugin marketplace add nklisch/skills
/plugin install ux-ui-design@nklisch-skills

# OpenAI Codex
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install ux-ui-design

# Pi (through the pi-plugins bridge)
/plugins marketplace add nklisch/skills
/plugins add ux-ui-design@nklisch-skills
```

All three channels consume the same shared `skills/` directory.

## The conversation

You don't need design vocabulary — the skill assumes you're a novice and
prefers it that way. A typical run:

1. **Grounding.** The agent reads your repo, existing `.mockups/`, and
   work items first, and only asks what it can't learn there.
2. **The interview.** A few batched questions: what the product is for,
   who uses it and in what state of mind, and how it should feel. The
   agent explains the dimensions of visual design as it goes ("calm vs
   energetic, spacious vs dense, flat vs tactile...") instead of asking
   you to pick a style by name.
3. **Bring references.** At any point — the interview is the natural
   moment — hand the agent screenshots, links, or examples of UIs you
   love or hate, in any medium: apps, games, websites, your own product.
   Not required, but it's the single most useful thing you can provide.
   The agent can capture screenshots of web and desktop UIs itself, or
   you drop images into `.mockups/reference/`.
4. **Shape the work.** The agent recommends a breakdown: one comprehensive
   interactive mockup, piece-by-piece option sets, additive extensions to
   existing mocks, flow-shaped journeys, or standardizing the design
   system first. Your call, and cheap to change later.
5. **Review real options.** Genuinely different directions, sized to what
   the territory supports, each explained in simple prose — what it does,
   why it fits what you said. You see committed screenshots; the HTML is
   there when you want to interact.
6. **Pick, hybridize, or push.** *"Option 3, but with option 1's nav."*
   Or "none of these — push further into the quiet direction." Three
   rounds without convergence usually means the goal itself needs
   talking through, and the agent will say so.
7. **Settle.** The decision is recorded (in the work item when one
   exists). If your project keeps foundation docs, the agent offers to
   distill the settled direction into them — your call, your wording.

## What gets made

Depending on the shape you chose:

- **Screen options** — `.mockups/screens/<id>/option-N.html` plus an
  `index.html` comparison grid, with `shots/` of every option.
- **Journeys** — `.mockups/flows/<name>/` numbered step pages with chrome
  matched to the journey's shape (linear wizard, free-form area, hybrid,
  map-based, or conversational), plus a navigator and shots.
- **A comprehensive mockup** — one interactive artifact walking through
  the whole feature or product.
- **Design-system layers** — when standardizing: `tokens.css` (color,
  type, spacing), `components.css`, `motion.css`, each paired with a
  showcase page that makes the choices visible before they're locked.
- **Moodboards** — during open exploration: one page per candidate
  direction, composed to *feel* like the direction.
- **An adoption report** — for existing UIs: inventory, audit findings,
  and decisions in `.mockups/adoption-report.md`, plus mocks in one of
  three stances you pick: **mirror** (capture what exists), **reimagine**
  (redesign with the existing product as constraint), or **diegetic
  prototype** (propose a future).

Nothing here is mandatory. The skill offers; you steer.

## Working on an existing product

Two ways in, often combined:

- **Show it.** The agent captures screenshots of the running UI (or you
  provide them) and extracts its visual system — color, type, shape,
  depth, density — as something you can react to, blend from, or
  deliberately escape. Works for any product, not just web UIs.
- **Audit it.** For UI code in the repo, the agent inventories surfaces
  and checks for fragmentation, duplication, accessibility gaps, and
  missing states, then mocks in whichever stance you chose above.

## Pairing with workbench

On a `workbench` project, the skill runs standalone — invoke it from any
design or delivery conversation when a UI surface needs alignment.
Workbench treats `.mockups/` as an optional UI-alignment layer; an item
can reference its mock through `mock_refs`. Mockups are requirements
evidence, not production components.

## Plugged into agile-workflow

> `agile-workflow` is **maintenance mode (KTLO)** — supported, but new
> projects should adopt [`workbench`](../plugins/workbench/README.md).

When `agile-workflow` is installed, its design skills offer the `ux-ui`
skill for UI alignment during scoping and design. The concierge
negotiates the artifact shape with you as usual; mocks land under
`.mockups/screens/<item-id>/` by path convention, with a `## Mockups`
section in the item body. No schema coupling — neither plugin parses the
other's state.

## When NOT to use this

- **Production code generation.** Mocks are alignment artifacts; your
  implementer translates the chosen direction into your real stack.
- **Highly interactive prototypes** with real state, fetches, or routing —
  use a real stack.
- **Pixel-perfect handoff comps** for a separate visual designer — use
  Figma for that.
- **A change with no UX surface.** Backend work, copy-only edits, and
  non-visual fixes don't need mockups.

## Tips

- **Describe taste, not specs.** *"Feels like Linear meets a field
  guide — quiet, dense, warm"* beats *"use #5B6CFF and Inter."*
- **Hand over references early.** Three screenshots of UIs you love are
  worth a page of adjectives.
- **Hybridize freely.** The agent merges and re-renders; nothing is
  precious.
- **Trust the shots.** The `shots/` folders are the fastest way to see
  where the design landed — and the record that survives cleanup.
- **Say when it all looks the same.** Repetition is the known failure
  mode; naming it makes the next round wider.

## Where to read more

- `plugins/ux-ui-design/README.md` — plugin reference and install details
- `plugins/ux-ui-design/skills/ux-ui/SKILL.md` — the skill's workflow
- `plugins/ux-ui-design/skills/ux-ui/references/` — the craft library the
  skill draws on

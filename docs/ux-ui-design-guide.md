# UX/UI Design Guide

How to use the `ux-ui-design` plugin to design UI **before** writing any
production code — using throwaway, single-file HTML mockups that open in any
browser.

This guide is for humans collaborating with an agent on visual / interaction
design. It works on its own, and it gets even better paired with
`agile-workflow` (see the last section).

## What this is

A small plugin that turns Claude Code into a fast UI design partner. You ask
for screen options, flows, or a palette. The agent generates standalone HTML
mocks under `.mockups/`. You open them, compare, pick one (or describe a
hybrid). The agent iterates. When you're happy, that mock is the alignment
artifact — your real implementation later translates it into your actual
stack.

**Mocks are throwaway.** They exist for *alignment*, not deployment. No build
step, no React, no Tailwind — just a `.html` file with vanilla CSS and JS
that survives long after the framework du jour is gone.

## The skills

| Skill | Trigger | What you get |
|---|---|---|
| **`palette`** | "design a palette", "pick brand colors" | Multiple color + typography options as HTML previews, locks the choice into `tokens.css` |
| **`components`** | "design components", "build a component kit" | A showcase page of every button/input/card/modal in every state, plus a reusable `components.css` |
| **`motion`** | "design the motion system", "easing curves" | Named easing-curve vocabulary, durations, springs, designed pauses — playable in the browser, plus a reusable `motion.css` |
| **`screens`** | "mock the login screen", "give me 4 options for X" | N (default 4) distinct HTML options for a single screen, plus a 2x2 comparison grid |
| **`flows`** | "mock the signup flow", "design the checkout journey" | A multi-page user-flow mock with prev/next or hub-and-spoke navigation, plus an index navigator |
| **`adopt`** | "bootstrap mockup-first design", "audit our UI" | Scans an existing codebase, inventories every UI surface, audits for inconsistencies, mirrors current screens into mocks OR reimagines them |
| **`ux-ui-principles`** | auto-loads when UI design comes up | Reference: storage layout, decision matrix, tech rule. Adds the convention to your project's `CLAUDE.md` on first run. |

## The output layout

Every project that uses the plugin gets the same `.mockups/` shape:

```
.mockups/
├── design-system/
│   ├── palette.html       color + WCAG check
│   ├── typography.html    font scale
│   ├── components.html    every component, every state
│   ├── motion.html        every motion, playable
│   ├── tokens.css         locked-in design tokens
│   ├── components.css     reusable component primitives
│   └── motion.css         reusable easing + duration + springs
├── screens/<feature>/     N option HTMLs + index.html
└── flows/<flow-name>/     numbered sequence + index.html
```

Mocks are plain HTML — you can open them straight from your file manager.
Every screen and flow links the shared `tokens.css` / `components.css` /
`motion.css`, so the whole project shares one visual + kinetic voice.

## The natural ordering (single-pass)

If you're starting fresh and want the whole design system before any screens,
run the design-system skills in order — each one builds on the last:

```
1. palette       → tokens.css      (colors, type)
2. components    → components.css  (uses tokens.css)
3. motion        → motion.css      (uses tokens + components)
4. screens / flows                 (link all three)
```

You don't have to do them all at once. You can also just say "design the
login screen" and the agent will check if a palette exists; if not, it'll
offer to do it first.

## Standalone usage

You don't need any other plugin. The whole loop:

```bash
# Install
/plugin install ux-ui-design@nklisch-skills

# Pick a visual identity
/ux-ui-design:palette
/ux-ui-design:components

# Mock a screen
/ux-ui-design:screens login
# → opens .mockups/screens/login/index.html in your browser
# → you pick option 2, ask for tweaks
# → agent iterates until you sign off

# Mock a multi-page flow
/ux-ui-design:flows signup
```

Or just describe what you want in plain language and the agent picks the
skill: *"give me 4 options for the dashboard"*, *"design the onboarding
flow"*, *"pick brand colors that feel like Linear meets Stripe"*.

### Adopting an existing project

If you already have UI in code and want mocks (for redesign, for audit, or
to backfill a design system that drifted from reality):

```
/ux-ui-design:adopt
```

Two modes:
- **Mirror** — faithful capture of the current implementation as mocks, with
  an audit report on inconsistencies (duplicate components, hardcoded colors,
  missing empty states).
- **Reimagine** — uses the audit to inform a 4-option redesign exploration.

Either way, output is the same `.mockups/` shape, ready for iteration.

## The interaction rhythm

Three beats:

1. **You ask.** Either a slash command or plain language. *"Mock the
   settings page."*
2. **Agent generates + opens.** N option HTMLs land in `.mockups/screens/`
   and the index page opens in your browser. You see the options
   side-by-side.
3. **You pick or hybrid.** *"Option 3, but with the nav from option 1."*
   The agent iterates. Repeat until you sign off.

That's it. No design tool to learn, no Figma round-tripping, no theme picker
config. The artifact is a `.html` file you can keep, share, or throw away.

## Plugged into agile-workflow

The plugin works standalone, but it really clicks when paired with
`agile-workflow`. The `ux-ui-design` skills slot into the substrate at four
tiers — biggest decisions first, so downstream work inherits the alignment.

The pattern is **mock-first at every tier where it can land**. The earlier
the decision, the more downstream work it covers without re-asking.

### The four tiers

| Tier | When | What gets mocked |
|---|---|---|
| **1. After `ideate`** | Foundation docs just landed | `palette` + `components` — the visual foundation everything inherits |
| **2. During `epic-design --only-questions`** | Aligning on big architectural / product choices across the drafting epic queue | `screens` + `flows` for the load-bearing surfaces — the choices that shape an entire arc |
| **3. During `feature-design --only-questions`** | Drilling into per-feature scope before autopilot | More `screens` + `flows` for surfaces not covered upstream |
| **4. Ad-hoc during design work** | Mid-flight, when a particular surface needs exploration before the design is finalized | One-off `screens` / `flows` invocation |

You do most of the work at tiers 1 and 2 — the big choices. Tier 3 fills in
the per-feature gaps. Tier 4 is the escape hatch.

### How the linking works

When a mock is generated against a substrate item, the agent adds a
`## Mockups` section to the item's body pointing at the relevant paths. No
schema coupling — just a path convention. The implementer reading the item
sees the mock alongside the design and uses it as ground truth.

### Why this is the alignment habit

The killer move with `agile-workflow` is the
`--only-questions` pass — interactive Q&A across the drafting queue *before*
autopilot starts. Adding mocks to that pass means autopilot inherits **both**:

- Directional answers captured under `## Design decisions` in each item body.
- Visual alignment captured under `## Mockups` in each item body.

Autopilot then designs and implements with no autonomous guessing on either
front. That's how you tee up an autopilot run that ships work you actually
want.

See [agile-workflow-guide.md](agile-workflow-guide.md) for the full loop.

## Tech rule (the constraint that makes mocks portable)

- One `.html` file per mock. Vanilla CSS in `<style>`, vanilla JS in
  `<script>`.
- No build step, no CDN, no npm, no CSS framework.
- Optional `<link rel="stylesheet" href="../../design-system/tokens.css">` —
  that local CSS is the only allowed external reference.
- Self-contained so the file opens in any browser, offline, years from now.

The point: mocks survive frameworks. A Tailwind 3 mock from 2024 ages
poorly. A plain HTML/CSS mock from 2026 still opens in 2036.

## When NOT to use this

- **Production code generation.** These are alignment artifacts, not
  components — your implementer translates the chosen mock into your real
  stack.
- **Highly interactive prototypes** with real state, fetches, or routing —
  use a real stack for those.
- **Pixel-perfect handoff comps** for a separate visual designer — use Figma
  (or the figma MCP) for that.

This plugin sits in the gap: more structured than whiteboard sketches, less
work than a real prototype, opens-in-any-browser portable.

## Tips

- **Mock big decisions first.** Tier 1 (palette + components) and tier 2
  (load-bearing screens/flows during epic alignment) cover the most ground
  per minute spent.
- **Describe taste, not specs.** *"Feels like Linear meets Stripe, weighted
  toward minimal"* gets better options than *"use #5B6CFF and Inter."*
- **Hybrid freely.** When option 3 is mostly right but option 1's nav is
  better, just say so. The agent merges and re-renders.
- **Throw mocks away when shipped.** They're alignment artifacts; once the
  real UI ships, you can delete the mock directory or keep it as a frozen
  reference. Git holds the history either way.
- **Open the index, not individual files.** Every mock dir has an
  `index.html` with the comparison grid or flow navigator — that's the
  intended entry point.

## Where to read more

- `plugins/ux-ui-design/README.md` — plugin reference, the decision matrix
  in more detail
- Each skill's `SKILL.md` under `plugins/ux-ui-design/skills/<name>/` —
  per-skill triggers, exact output contract, examples

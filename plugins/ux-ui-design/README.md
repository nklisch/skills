# ux-ui-design

Adaptive, interview-first UI/UX design for Claude Code, OpenAI Codex, and Pi.

This plugin ships one concierge skill, **`ux-ui`**, that treats alignment as
the deliverable and mockups as the medium. It interviews before it generates —
what the product is for, who uses it, how it should *feel* — in plain language,
then adapts the artifact shape to your project instead of marching through a
fixed pipeline.

## How it works

1. **Ground** — reads your repo, existing `.mockups/`, and work items first;
   asks only what the repository can't answer.
2. **Interview** — goals, audience, usage, and a plain-prose conversation
   about visual direction. No named-style menus ("brutalist vs minimal"
   pick-lists); the skill explains how visual languages work and blends a
   direction from your answers. You're assumed to have better things to do
   than learn design jargon.
3. **Shape** — you choose how to slice the work: one comprehensive mockup,
   piece-by-piece option sets, additive extensions, flow-shaped journeys,
   or standardization first.
4. **Make** — the skill generates genuinely distinct directions, captures
   **screenshots of its own mockups**, reviews them itself, then shows you.
   Shots are committed beside the mockup code as the durable visual record.
5. **Settle** — records the decision; optionally distills the settled
   direction into your project's foundation docs, when they exist.

Optional branches it offers (never mandates): screenshot capture/ingest of
**any existing UI** (desktop apps, mobile, games, competitor sites — not just
HTML) to target or extract a visual system; standardization showcases for
tokens, typography, components, and motion; style research and mashups;
existing-UI audits with mirror / reimagine / diegetic-prototype stances.

## Output layout

Projects accumulate `.mockups/` artifacts only as the work needs them:

```
.mockups/
  design-system/    # tokens.css, components.css, motion.css + showcase pages
  screens/<id>/     # option-N.html + index.html comparison grid
  flows/<name>/     # step pages + topology-matched navigator
  */shots/          # committed screenshots of the agent's own mockups
  reference/        # ingested screenshots of existing UIs (optional)
```

Mocks are standalone single-file HTML — no build step, no frameworks — so
they open in any browser, offline, years from now. The committed screenshots
mean the direction survives even if the throwaway HTML is cleaned up.

## Installation

### Claude Code

```bash
/plugin marketplace add nklisch/skills
/plugin install ux-ui-design@nklisch-skills
```

### Codex CLI

```bash
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install ux-ui-design
```

### Pi

```bash
# Pi users install through the pi-plugins bridge:
/plugins marketplace add nklisch/skills
/plugins add ux-ui-design@nklisch-skills
```

All channels consume the same shared `skills/` directory.

## Integration with agile-workflow (loose)

When `agile-workflow` is also installed, its design skills may offer the
`ux-ui` skill for UI alignment; mocks for a substrate item are linked by path
convention plus a `## Mockups` section in the item body. Neither plugin
parses the other's state — both work fine standalone.

## Migrating from 0.x

Version 1.0.0 replaces the seven pipeline skills (`ux-ui-principles`,
`palette`, `components`, `motion`, `screens`, `flows`, `adopt`) with the
single `ux-ui` concierge. Old invocations like `/ux-ui-design:screens` are
gone — ask for what you want in natural language ("mock the dashboard",
"let's figure out our colors") and the concierge adapts. Your existing
`.mockups/` layout, `tokens.css`, and tech conventions are unchanged and
still honored.

## When NOT to use this

- Production code generation — these are throwaway mocks, not React/Svelte
  components.
- Highly interactive prototypes that need real state, fetches, or routing —
  use a real stack.
- Pixel-perfect comps for handoff to a separate visual designer — use Figma
  (or the `figma` MCP) for that.

This plugin sits in the gap: more structured than whiteboard sketches, less
work than building a real prototype, and the conversation is the design tool.

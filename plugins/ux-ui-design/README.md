# ux-ui-design

HTML/CSS/JS mockup-first UI/UX design for Claude Code and Codex.

This plugin makes Claude Code generate **standalone single-file HTML mockups** in
`.mockups/` before any UI code is written. Mockups are throwaway artifacts —
they exist for **alignment**, not deployment. You compare options, walk through
flows, and lock in a design direction; then the implementer translates the
chosen mock into your real stack later.

## What's in the box

Four skills, all installable in either Claude Code or Codex (open Agent Skills
standard):

| Skill | Trigger | What it does |
|---|---|---|
| `ux-ui-principles` | auto-loads when UI design comes up | Reference: storage layout, decision matrix, linking convention, tech rule. Installs the rule into project `CLAUDE.md` on first run. |
| `screens` | `/ux-ui-design:screens` or "give me 4 options for X" | Generates 4 distinct HTML mockups for one screen, opens a 2x2 comparison grid, asks for a pick or hybrid. |
| `flows` | `/ux-ui-design:flows` or "mock the signup flow" | Generates a numbered sequence of HTML pages with prev/next chrome and an index navigator. |
| `palette` | `/ux-ui-design:palette` or "design a palette" | Generates color + typography options as HTML previews, locks the choice into a reusable `tokens.css`. |

## Output layout

Every project that uses this plugin gets the same `.mockups/` shape:

```
.mockups/
  design-system/
    palette.html        # color preview with multiple options + WCAG check
    typography.html     # font preview + scale
    tokens.css          # locked-in CSS custom properties for all mocks
  screens/
    <feature-id>/
      option-1.html
      option-2.html
      option-3.html
      option-4.html
      index.html        # 2x2 iframe grid for side-by-side review
  flows/
    <flow-name>/
      01-<step>.html
      02-<step>.html
      ...
      index.html        # linear navigator across the flow
```

`<feature-id>` matches the agile-workflow item id when applicable, else a
kebab-case slug.

## Tech rule

- One `.html` file per mock. Vanilla CSS in `<style>`, vanilla JS in `<script>`.
- No build step, no CDN, no npm packages, no CSS framework.
- Optional `<link rel="stylesheet" href="../../design-system/tokens.css">` —
  that one local CSS is the only allowed external reference.
- Self-contained so the file opens in any browser, offline, years from now.

## Mockup-first decision matrix

The `ux-ui-principles` skill carries the full matrix. TL;DR:

**REQUIRED** — net-new UI surface, design-system changes, epics with
multi-screen user flows.

**OPTIONAL** — feature-level UI that reuses existing components and patterns
(use judgment).

**SKIP** — bug fixes with no visual change, copy edits, backend-only features,
behind-the-scenes refactors.

## Integration with agile-workflow (loose)

When `agile-workflow` is also installed, the design family skills check the
matrix and call into `ux-ui-design` automatically:

- `agile-workflow:epic-design` — locks design-system tokens via `:palette` at
  epic decomposition; invokes `:flows` for multi-screen journeys.
- `agile-workflow:feature-design` — runs `:screens` for net-new UI features.
- `agile-workflow:scope` — flags UI surface during scope.
- `agile-workflow:ideate` — recommends running `:palette` after foundation
  docs for UI projects.

When mocks are generated for a substrate item, a `## Mockups` section is added
to the item body pointing at the relevant paths. Linking is via path
convention + optional `mockups:` frontmatter field — `agile-workflow` doesn't
parse the field, so no schema coupling.

When `agile-workflow` is NOT installed, all four skills work fine standalone.
Path resolution falls back to kebab-case slugs.

## Installation

### Claude Code

```bash
# Via marketplace
claude /plugin install ux-ui-design --from nklisch/skills

# Via skilltap CLI
skilltap install ux-ui-design
```

### Codex CLI

```bash
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install ux-ui-design
```

Both install the four SKILL.md files; Codex sees skills only (no commands or
agents — none defined here).

### Bootstrap a project

After install, any of these will trigger the `ux-ui-principles` skill to offer
appending the design-convention block to your project's `CLAUDE.md`:

- "design the login screen"
- `/ux-ui-design:screens login`
- `/ux-ui-design:palette`

The append is idempotent — controlled by a `<!-- ux-ui-design:installed -->`
marker.

## When NOT to use this

- Production code generation — these are throwaway mocks, not React/Svelte
  components.
- Highly interactive prototypes that need real state, fetches, or routing —
  use a real stack.
- Pixel-perfect comps for handoff to a separate visual designer — use Figma
  (or the `figma` MCP) for that.

This plugin sits in the gap: more structured than whiteboard sketches, less
work than building a real prototype, opens-in-any-browser portable.

---
name: ux-ui-principles
description: >
  Reference for the mockup-first UI/UX design convention. Auto-loads when designing,
  proposing, mocking, or reviewing user interfaces; when invoking screens / flows /
  palette skills; or when any other workflow (agile-workflow, workflow design,
  feature-design, epic-design, ideate, scope) reaches a UI surface decision. Carries
  the storage layout (.mockups/{design-system,screens,flows}/), the required vs
  optional vs skip matrix, the linking convention to agile-workflow items, and the
  single-file HTML/CSS/JS tech rule. Also installs the rule into the project's
  CLAUDE.md on first invocation (with confirmation).
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# UX / UI Design Principles

This is the reference skill for mockup-first UI/UX design. It encodes WHERE
mockups live, WHEN to produce them, HOW they link back to work items, and
WHAT the rule text in `CLAUDE.md` says. The three generator skills
(`screens`, `flows`, `palette`) all defer here.

## Why mock first

Production code rewritten because the design wasn't aligned is the most
expensive code in any project. A mockup is cheap; rewriting a checkout flow
because the third stakeholder finally weighed in is not. The mockups in
`.mockups/` are the alignment artifact — they let stakeholders react to
*real* designs before anyone commits to building them.

Mockups are throwaway HTML. The alignment they create isn't. That's the
whole bet.

## Core rule

**Mockup-first.** All non-trivial UI/UX design is done as standalone
single-file HTML/CSS/JS mockups in `.mockups/` BEFORE any production code is
written. Mockups are committed to the repo — they're the design artifact
future implementers reference, not throwaway scratch.

## Storage layout

Every project using this plugin has the same `.mockups/` shape:

```
.mockups/
  design-system/
    palette.html        # color tokens preview (multiple options when drafting)
    typography.html     # font + scale preview
    tokens.css          # CSS custom properties for reuse across mocks
  screens/
    <feature-id>/
      option-1.html
      option-2.html
      option-3.html
      option-4.html
      index.html        # 2x2 iframe grid for side-by-side comparison
  flows/
    <flow-name>/
      01-<step>.html
      02-<step>.html
      ...
      index.html        # linear navigator across the flow
```

**Feature id resolution:**
- If agile-workflow is in use (`.work/active/` exists), use the substrate
  item id (e.g. `auth-signup`).
- Otherwise use a kebab-case short slug derived from the feature name.

**Cross-feature flows** use a synthetic name (e.g. `onboarding`,
`checkout-recovery`) rather than a feature id.

## Tech rule

- One `.html` file per mock. No build step. No JS framework. No npm packages.
- Vanilla CSS inside a single `<style>` tag in `<head>`.
- Vanilla JS inside a single `<script>` tag.
- **No CSS framework CDNs** (Tailwind, Bootstrap, etc.) — they drift the
  mock toward "production code that kinda works" and break the throwaway
  property.
- **Hosted fonts via CDN are fine** (Google Fonts, Fontsource, etc.) when
  the palette has called for a distinctive face. Load via `<link>` in
  `<head>` and declare a full system-stack fallback so offline rendering
  degrades cleanly. `palette` decides per-project; mocks honor that choice.
- Reuse `../../design-system/tokens.css` via a `<link rel="stylesheet">`
  when a design system exists.
- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- Realistic placeholder content. Real-looking copy, plausible numbers,
  names that aren't "Lorem ipsum" when the domain has a clear voice.

See `references/shared-chrome-css.md` for the shared HTML chrome (the
`.mock-meta` strip, the `.flow-meta` sticky header, the index-grid styles)
that `screens`, `flows`, and `palette` all use.

## When to mock (decision matrix)

**REQUIRED:**
- Net-new UI surface (a screen, page, or major component that doesn't exist yet)
- Design-system or palette changes (new colors, fonts, spacing scales)
- Epics whose scope spans multiple screens or a multi-step user flow

**OPTIONAL** (use judgment):
- Feature-level UI that reuses existing components and patterns — mock only
  if the composition is novel or ambiguous
- Visual refactors that change look but not structure

**SKIP:**
- Bug fixes with no visual change
- Copy / content edits
- Behind-the-scenes refactors with no UX surface change
- Backend-only features
- A/B test variants that are tiny tweaks to an existing screen

When unsure, default to mocking the higher-value variant: a 10-minute screen
mock is cheap insurance against a misaligned implementation.

## Linking to agile-workflow items

When a mock is generated in the context of a substrate item, link it both ways:

1. **Path convention.** `.mockups/screens/<feature-id>/` matches the item id.
2. **Body section.** Add (or update) a `## Mockups` section in the item body:
   ```markdown
   ## Mockups

   - Screens: `.mockups/screens/<feature-id>/index.html`
   - Flow: `.mockups/flows/<flow-name>/index.html`
   - Selected: option-2 (after review on 2026-05-15)
   ```
3. **Optional frontmatter field.** If the project's substrate items already
   carry custom frontmatter fields, add:
   ```yaml
   mockups: .mockups/screens/<feature-id>/
   ```
   Skip the frontmatter field if it would be the only customization — the
   body section is enough.

When NOT running in a substrate context, write the mocks and tell the user
the path. Nothing more is needed.

## First-invocation CLAUDE.md installer

The first time THIS skill runs in a project, check whether the project's root
`CLAUDE.md` carries the mockup convention. If the marker
`<!-- ux-ui-design:installed -->` is absent, offer to append the rule block
via `AskUserQuestion`.

See `references/claude-md-installer.md` for the exact check command, the
verbatim block to append, and the idempotency rules. The marker is the
single source of truth — present means installed; absent means re-prompt.

## Opening mocks in the user's browser

After generating mocks, open them automatically. Detect platform and run the
right command:

```bash
xdg-open "$path" 2>/dev/null &      # Linux
open "$path"                         # macOS
start "" "$path"                     # Windows (Git Bash, WSL)
```

See `references/open-cross-platform.md` for the full detection recipe and
per-platform notes. If detection fails or the command errors, print a
`file://...` URL the user can click in their terminal. Never block on the
open — it's a convenience.

## What the generator skills inherit

The three generators (`screens`, `flows`, `palette`) all assume:

- This skill is loaded (its conventions are active)
- `.mockups/` exists or will be created
- `CLAUDE.md` carries the rule (this skill installed it earlier)
- The user wants mocks opened automatically after generation
- Mocks are single-file HTML with inline vanilla CSS/JS
- Shared chrome CSS comes from `references/shared-chrome-css.md`

If a generator runs and the `CLAUDE.md` marker is absent, the generator
delegates to this skill first (mention "loading ux-ui-principles to install
the rule"), then proceeds.

## Anti-patterns

- **Mockups stay as throwaway HTML — that's their power.** They're the
  alignment artifact, opened in any browser years from now, untouched by
  the host stack. The implementer translates the chosen mock into the real
  components later. Don't reach for React or Svelte here; the throwaway
  property is what keeps them honest.
- **No CSS framework CDNs.** Tailwind, Bootstrap, and friends drift the
  mock toward "this kinda works as a real page" and undermine the
  mockup-as-reference idea. Vanilla CSS keeps the mock honest about its
  scope. (Hosted *fonts* via CDN are fine — see the tech rule.)
- **Always write the index.html.** For screens and flows, it IS the review
  artifact — the four option files (or N step pages) are inputs; the index
  is what the user opens. Without it review fragments across four tabs and
  tab-amnesia eats the comparison.
- **Mock what doesn't exist.** If the screen is "checkout step 2 with one
  new field," extend the existing pattern conceptually in the design body —
  don't re-mock the whole screen. Mocks earn their value on net-new
  surfaces and on novel compositions, not on minor extensions.
- **Decisions live in the item body.** Use the substrate item's `## Mockups`
  section to record the chosen direction and rationale. For non-substrate
  work, write a header comment inside the chosen option's HTML. Don't
  create separate design-rationale documents — they drift from the mocks
  they describe.

## When other workflows call this skill

The agile-workflow design family (`epic-design`, `feature-design`) and the
project-definition skills (`ideate`, `scope`) call into this plugin when
they hit a UI surface decision. Their typical pattern:

1. They detect a UI-shaped decision in front of them.
2. They check this skill's decision matrix (above).
3. If REQUIRED or OPTIONAL-and-they-judge-yes, they invoke
   `/ux-ui-design:screens` or `/ux-ui-design:flows` or
   `/ux-ui-design:palette` directly.
4. They reference the resulting mock paths in the design body they're
   writing.

The plugin is **loosely** coupled — agile-workflow runs fine without it;
this plugin runs fine without agile-workflow. The link is only the path
convention and the optional `mockups:` frontmatter field, neither of which
agile-workflow parses.

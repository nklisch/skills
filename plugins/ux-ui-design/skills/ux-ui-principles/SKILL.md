---
name: ux-ui-principles
description: >
  ALWAYS load this skill when designing, proposing, mocking, or reviewing user
  interfaces; when invoking screens / flows / palette / components; or when any
  other workflow (agile-workflow, workflow design, feature-design, epic-design,
  ideate, scope) reaches a UI surface decision — do not start mocking inline.
  Reference for the mockup-first UI/UX design convention. Carries the storage
  layout (.mockups/{design-system,screens,flows}/), the REQUIRED vs OPTIONAL
  vs SKIP decision matrix, the tier-ordering rule (scope/epic primary, feature
  fallback), the design-system pipeline (palette → components → screens/flows),
  the linking convention to agile-workflow items, and the single-file HTML/CSS/JS
  tech rule. Also installs the rule into the project's CLAUDE.md on first
  invocation (with confirmation).
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# UX / UI Design Principles

This is the reference skill for mockup-first UI/UX design. It encodes WHERE
mockups live, WHEN to produce them, HOW they link back to work items, and
WHAT the rule text in `CLAUDE.md` says. The five generator skills
(`palette`, `components`, `screens`, `flows`, `adopt`) all defer here.

**Greenfield vs adoption.** For projects starting fresh, run the
pipeline directly: `palette` → `components` → `screens`/`flows`. For
projects that already have UI code, run `adopt` first — it scans the
codebase, audits existing UI for inconsistency, and orchestrates the
pipeline in either MIRROR mode (capture current state) or REIMAGINE
mode (redesign).

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
    components.html     # full component showcase, every state (after `components` runs)
    components.css      # reusable component classes linked by every mock
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
      index.html        # navigator matched to topology
                        # (linear / hub-and-spoke / hybrid)
```

**The design-system pipeline (palette → components → screens/flows).**

The two design-system skills produce artifacts in strict order:

1. `palette` writes `tokens.css` — the locked vocabulary of colors,
   type, spacing, radii.
2. `components` writes `components.css` — reusable component classes
   composed from tokens (`.btn`, `.input`, `.card`, `.nav-bar`, plus
   any project-unique components).
3. `screens` and `flows` link BOTH stylesheets and use component
   classes in their markup, so every mock shares identical primitives.

Skipping `components` is fine for fast/exploratory work — `screens` and
`flows` will style buttons and inputs inline. But for any project that
spans more than a handful of mocks, running `components` once up-front
prevents the drift the other skills explicitly fight ("Cross-page
visual consistency" in `flows`, "Consistency validation" in `screens`).

**Existing projects use `adopt` as the entry point.** `adopt` runs the
pipeline above with two additions: a codebase scan that produces
`.mockups/adoption-report.md` (inventory + audit findings) before any
mocks, and mode-aware delegation that tells `palette` / `components` /
`screens` / `flows` whether to MIRROR existing implementation or
REIMAGINE freely. The adoption report is the alignment artifact for
adoption + re-sync passes; mocks are the per-surface deliverables as
usual.

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
- Component-library changes (new shared component, restyled primitive,
  changed component variants) — `components` runs in refinement mode
- Epics whose scope spans multiple screens or a multi-step user flow

**OPTIONAL** (use judgment):
- Minor feature-level UI extensions that reuse existing components and
  patterns and weren't anticipated at the epic-design tier — mock only if
  the composition is novel or ambiguous and a parent-tier mock doesn't
  already pin direction
- Visual refactors that change look but not structure

**SKIP:**
- Bug fixes with no visual change
- Copy / content edits
- Behind-the-scenes refactors with no UX surface change
- Backend-only features
- A/B test variants that are tiny tweaks to an existing screen

When unsure, default to mocking the higher-value variant: a 10-minute screen
mock is cheap insurance against a misaligned implementation.

## Where in the workflow to mock — tier ordering

**Mock at the highest tier where it can land.** Mocks are cheap;
re-aligning implemented code because direction wasn't pinned at the right
tier is not.

1. **Scope** — locks palette, locks components, and any cross-feature
   journey clear at scope time for large (epic-shaped) UI work. The
   design-system pipeline (palette → components) runs here for
   UI-bearing projects.
2. **Epic-design — primary.** Mocks every net-new screen and multi-step
   journey across the decomposition. Err on the side of mocking here;
   don't defer minor surfaces "just in case". If `components.css`
   doesn't yet exist, `components` runs as part of the design-system
   prelude before screens/flows.
3. **Feature-design — fallback.** References parent-epic mocks and
   skips when coverage exists. Mocks only genuinely-minor surfaces that
   weren't anticipated upstream. Inherits `components.css`; only
   invokes `components` in refinement mode if a new shared component
   is genuinely needed.
4. **`--only-questions` gates ALWAYS run the mockup pass.** Those modes
   are the visual alignment gate, not just the textual one.

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

The five generators (`palette`, `components`, `screens`, `flows`,
`adopt`) all assume:

- This skill is loaded (its conventions are active)
- `.mockups/` exists or will be created
- `CLAUDE.md` carries the rule (this skill installed it earlier)
- The user wants mocks opened automatically after generation
- Mocks are single-file HTML with inline vanilla CSS/JS
- Shared chrome CSS comes from `references/shared-chrome-css.md`
- The design-system pipeline order: palette before components before
  screens/flows; downstream skills delegate upstream if dependencies
  are missing

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

Per the tier-ordering rule above:

- **`scope`** — large-scope UI: invokes `/ux-ui-design:adopt` for
  existing projects, or `/ux-ui-design:palette` +
  `/ux-ui-design:components` + `/ux-ui-design:flows` for greenfield
  cross-feature journeys clear at scope time.
- **`epic-design`** — primary tier. Greenfield: runs the full
  pipeline (palette → components → screens + flows). Existing-project
  decomposition with no `.mockups/` artifacts yet: runs `adopt` first
  to establish the inventory + design system, then resumes the
  decomposition. `--only-questions` always runs this pass.
- **`feature-design`** — fallback. Inherits palette + components from
  the parent epic; invokes screens/flows only for minor surfaces not
  covered upstream. Invokes `components` only in refinement mode for
  net-new shared components.
- **`ideate`** — recommends `/ux-ui-design:palette` then
  `/ux-ui-design:components` after foundation docs for UI-bearing
  projects.

The plugin is **loosely** coupled — agile-workflow runs fine without it;
this plugin runs fine without agile-workflow. The link is only the path
convention and the optional `mockups:` frontmatter field, neither of which
agile-workflow parses.

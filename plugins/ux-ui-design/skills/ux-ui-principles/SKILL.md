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

This is the reference skill for mockup-first UI/UX design. It encodes WHERE mockups
live, WHEN to produce them, HOW they link back to work items, and WHAT the rule
text in `CLAUDE.md` says. The three generator skills (`screens`, `flows`, `palette`)
all defer here.

## Core rule

**Mockup-first.** All non-trivial UI/UX design is done as standalone single-file
HTML/CSS/JS mockups in `.mockups/` BEFORE any production code is written. Mockups
are committed to the repo — they are the design artifact future implementers
reference, not throwaway scratch.

## Storage layout

Every project that uses this plugin has the same `.mockups/` shape:

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

- One `.html` file per mock. No build step. No frameworks.
- Vanilla CSS inside a single `<style>` tag in `<head>`.
- Vanilla JS inside a single `<script>` tag (defer/end of body).
- No CDN dependencies, no external CSS, no npm packages. Self-contained so the
  file opens correctly years from now, offline, on any machine.
- Reuse `../../design-system/tokens.css` via a `<link rel="stylesheet">` when
  a design system exists — that one external is allowed because it's local.
- Use semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- Realistic placeholder content. Real-looking copy, plausible numbers, names
  that aren't "Lorem ipsum" when the domain has a clear voice.

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
   Skip the frontmatter field if it would be the only customization — body
   section is enough.

When NOT running in a substrate context, just write the mocks and tell the
user the path.

## First-invocation CLAUDE.md installer

The first time THIS skill runs in a project, check whether the project's root
`CLAUDE.md` carries the mockup convention. If not, offer to append it.

### Check

```bash
test -f CLAUDE.md && grep -q "ux-ui-design:installed" CLAUDE.md && echo present || echo absent
```

If `present`, do nothing — the rule is already installed.

If `absent`, ask the user via `AskUserQuestion` whether to append the rule to
`CLAUDE.md` (creating the file if missing). Two options:

- **Append the rule to CLAUDE.md** (recommended)
- **Skip — I'll add it manually**

### Append content

When the user approves, append the following block (verbatim, including the
marker comment) to the end of `CLAUDE.md`. If `CLAUDE.md` doesn't exist, create
it with this block as the only content.

```markdown
<!-- ux-ui-design:installed -->
## UI/UX Design Convention

**Mockup-first.** All UI/UX design is done as standalone HTML/CSS/JS mockups
before any production code is written. Mockups are committed.

**Location.** Mockups live in `.mockups/` with three buckets:

- `.mockups/design-system/` — palette, typography, tokens (project-wide)
- `.mockups/screens/<feature-id>/` — single-screen options per feature
- `.mockups/flows/<flow-name>/` — multi-page user journeys

`<feature-id>` matches the agile-workflow item id when applicable, else a
kebab-case short name.

**Process.**
- Single screen with options to align on: `/ux-ui-design:screens`
- Multi-page user flow for sign-off: `/ux-ui-design:flows`
- Palette / typography / design tokens: `/ux-ui-design:palette`
- Convention reference (auto-loads): `/ux-ui-design:ux-ui-principles`

**Tech rule.** Single-file HTML per mock, vanilla CSS in `<style>`, vanilla JS
in `<script>`. No build step, no CDN.

**Linking.** Each substrate item with mocks gets a `## Mockups` section in its
body pointing at the relevant `.mockups/` paths.

**Skip mocking** for trivial copy changes, bug fixes that don't shift visual
structure, behind-the-scenes refactors, or feature-level UI that cleanly
reuses existing components and patterns. Mock new surfaces, design-system
shifts, and multi-screen epics.
```

After append, mention to the user that the rule is now installed and won't
prompt again.

### Idempotency

The marker `<!-- ux-ui-design:installed -->` is the single source of truth.
If a user manually pastes the block without the marker, the next invocation
will re-prompt — instruct them to keep the marker if they want the prompt
suppressed.

## Opening mocks in the user's browser

After generating mocks, open them automatically. Detect platform and run the
right command. See `references/open-cross-platform.md` for the recipe — TL;DR:

```bash
# Linux
xdg-open "$path" 2>/dev/null &
# macOS
open "$path"
# Windows (Git Bash, WSL, etc.)
start "" "$path"
```

If detection fails or the command returns non-zero, print a `file://...` URL the
user can click in their terminal. Never block on the open — it's a convenience.

## What the generator skills inherit

The three generators (`screens`, `flows`, `palette`) all assume:

- This skill is loaded (its conventions are active)
- `.mockups/` exists or will be created
- `CLAUDE.md` carries the rule (this skill installed it earlier)
- The user wants mocks to be opened automatically after generation
- Mocks are single-file HTML with inline vanilla CSS/JS

If a generator runs and the `CLAUDE.md` marker is absent, the generator should
delegate to this skill first (mention "loading ux-ui-principles to install the
rule"), then proceed.

## Anti-patterns

- **Don't generate production code from this plugin.** Mockups are not React
  components, not Svelte components, not anything that imports from the host
  application. They are throwaway HTML — the implementer translates them into
  the real stack later.
- **Don't pull in Tailwind, Bootstrap, or any CSS framework via CDN.** That
  drifts toward "this kinda works as a real page" and undermines the mockup-as-
  reference idea. Vanilla CSS keeps the mock honest.
- **Don't skip the index.html.** For screens and flows, an `index.html` that
  shows all options/steps side-by-side or as a navigator is what makes review
  fast. Without it the user has to open four tabs and remember which is which.
- **Don't mock something that already exists in the codebase.** If the screen
  is "checkout step 2 with one new field," mock by extending the existing
  pattern conceptually in the design body — don't reinvent the whole screen.
- **Don't write design rationale in a separate doc.** Decisions go in the
  substrate item body's `## Mockups` section (or, for non-substrate work, in
  a header comment inside the chosen option's HTML).

## When other workflows call this skill

The agile-workflow design family (`epic-design`, `feature-design`) and the
project-definition skills (`ideate`, `scope`) call this skill when they hit a
UI surface decision. Their typical pattern:

1. They detect a UI-shaped decision in front of them.
2. They check this skill's decision matrix (above).
3. If REQUIRED or OPTIONAL-and-they-judge-yes, they invoke `/ux-ui-design:screens`
   or `/ux-ui-design:flows` or `/ux-ui-design:palette` directly.
4. They reference the resulting mock paths in the design body they're writing.

The plugin is **loosely** coupled — agile-workflow runs fine without it; this
plugin runs fine without agile-workflow. The link is only the path convention
and the optional `mockups:` frontmatter field, neither of which agile-workflow
parses.

---
name: components
description: >
  ALWAYS invoke this skill when the user asks to design, mock, or build a component library, common UI
  components, or shared design primitives — buttons, dropdowns, form fields, cards, modals, toasts,
  tabs, badges, plus project-specific unique components — do not start hardcoding component styles
  inline in screens or flows. Generates a showcase page at .mockups/design-system/components.html
  (every component in every state) and a reusable .mockups/design-system/components.css that screens
  and flows link, so every mock shares identical primitives. Runs AFTER palette (depends on
  tokens.css) and BEFORE screens / flows for a coherent unified look. Triggers on "design components",
  "component library", "design system components", "button system", "form styles", "showcase
  components", "build a component kit", "dropdowns and inputs", "unified UI primitives". Defers to
  ux-ui-principles for storage, tech, and linking conventions.
---

# Components

Generate the project's component library: common UI primitives (buttons,
form fields, cards, modals, toasts, dropdowns, tabs, badges, etc.) plus
the **project-specific unique components** the domain calls for. Output
lives in `.mockups/design-system/` and is referenced by every downstream
`screens` and `flows` mock so the look is identical across the project.

This is the missing layer between `palette` (tokens) and screen/flow
mocks (composition). Without it, every mock re-decides what a button
looks like. With it, the button is decided once and every mock inherits.

The component library is also where the project earns its **distinctive
voice**. Generic AI defaults — "rounded blue button, light gray card" —
get baked in here if no one pushes against them. Push.

## When to invoke

User triggers:
- "design the component library"
- "let's design buttons and form styles"
- "set up shared UI primitives"
- "build a component kit for this project"
- "we need a unified look — dropdowns, modals, the works"

Agent-driven triggers:
- An epic-design pass at project bootstrap, AFTER `palette` has locked
  `tokens.css`, BEFORE the first `screens` or `flows` run.
- A `screens` or `flows` invocation about to start and
  `.mockups/design-system/components.css` doesn't exist yet — `components`
  runs first.
- A `scope` or `ideate` run lands on shared UI primitives needing
  alignment before mockup work.

## What it produces

```
.mockups/design-system/
  components.html      # showcase: every component in every state, copyable HTML
  components.css       # reusable classes — screens and flows link this
```

Both files are committed to the repo as design artifacts. `components.css`
is the **contract**; every downstream mock links it via:

```html
<link rel="stylesheet" href="../../design-system/tokens.css">
<link rel="stylesheet" href="../../design-system/components.css">
```

If `components.css` already exists when this skill runs, enter
**refinement mode** — edit existing components or add new ones with
explicit user approval. Never overwrite without confirmation; every
downstream mock reads from this file.

## Workflow

### Phase 1: Ground and detect mode

Confirm `ux-ui-principles` is loaded; install the project agent-instructions
block if the marker is missing (`AGENTS.md` first, `CLAUDE.md` only as a
compatibility target).

**Verify `tokens.css` exists.** Components are composed from tokens. If
`.mockups/design-system/tokens.css` is missing, delegate to `palette`
first (mention "loading palette to lock tokens before designing
components"), then continue.

Read:
- `.mockups/design-system/tokens.css` — the locked vocabulary
- `.mockups/design-system/components.css` if present → **refinement mode**
- The substrate item (epic/feature) if applicable, for project-unique
  component hints
- `AGENTS.md`, `CLAUDE.md`, `README.md`, any brand/voice docs

### Phase 2: Pick the common-component starter set

Don't generate all 40 possible components — most projects don't need
them all, and a bloated `components.css` is worse than a focused one.
Pick the components THIS project will actually use.

Default starter set (always include unless the user removes them):
- **Actions:** `.btn` (primary / secondary / ghost / danger / disabled)
- **Forms:** `.input`, `.textarea`, `.select`, `.checkbox`, `.radio`,
  `.switch`, `.field` wrapper with label / helper / error
- **Surfaces:** `.card` (default / raised / interactive)
- **Feedback:** `.toast` / `.alert` (info / success / warning / danger),
  `.empty-state`
- **Overlays:** `.modal` (header / body / footer / dismissible)

Optional extensions (offer via `structured question tool`, pick what's needed):
- **Navigation:** `.nav-bar`, `.tabs`, `.breadcrumb`, `.menu`, `.dropdown`
- **Data display:** `.table`, `.list`, `.badge`, `.tag`, `.pill`, `.avatar`
- **Overlays:** `.popover`, `.tooltip`, `.drawer`
- **Indicators:** `.spinner`, `.progress`, `.skeleton`

```
Q: Which extension groups does this project need? Pick any.
- Navigation (nav bar, tabs, breadcrumb, menus, dropdowns)
- Data display (tables, lists, badges, tags, avatars)
- More overlays (popover, tooltip, drawer)
- Indicators (spinner, progress bar, skeleton loaders)
```

See `references/common-component-vocabulary.md` for the full canonical
list — what each component does, what states/variants it must define,
and the default HTML pattern.

### Phase 3: Identify project-unique components

This is where the project gets its voice. Every project has a few
components that exist nowhere else. A fintech dashboard has a "metric
tile." A calendar has a "session block." A game has a "spell card." A
chat app has a "message bubble." A music app has a "track row." These
are the components that make THIS project look like itself.

Ask the user (or read from the substrate item if context is rich):

```
Q: What domain-specific components does this project need? Describe in
   plain language; don't worry about names yet.

Examples to prompt thinking:
- A repeated card/tile shape unique to your domain
- A specialized row/list-item with custom anatomy
- A status indicator or visualization specific to your data
- A composite widget that bundles several primitives together
```

Aim for **2-5 unique components**. Fewer than 2 and the project isn't
exercising its voice through the component layer. More than 5 and most
are probably page-specific compositions that belong in `screens`.

For each unique component, capture:
- Slug (kebab-case class name)
- Purpose (one sentence)
- Anatomy (what sub-parts it has: title / value / trend / actions)
- States (default + any meaningful variants)

### Phase 4: Set the component aesthetic

The aesthetic poles chosen in `palette` decide colors and type. The
component aesthetic decides **depth, density, and sharpness**. Use
`structured question tool` (skip if palette's aesthetic poles already pin it):

```
Q: What's the depth treatment?
- Flat — borders only, no shadows (Recommended for minimalist palettes)
- Subtle — 1px borders + small shadows on raised surfaces
- Layered — pronounced shadows, clear elevation hierarchy
- Neumorphic — soft inset/outset shadows on same-tone surfaces
```

```
Q: What's the corner treatment?
- Sharp — 0-2px radius, geometric
- Soft — 6-10px radius, friendly
- Pill — fully rounded on actionable elements (buttons, badges, inputs)
- Mixed — sharp on surfaces, pill on actions
```

```
Q: What's the density?
- Generous — comfortable spacing, large hit targets (consumer apps)
- Compact — tighter spacing, small/medium hit targets (productivity)
- Dense — minimum viable spacing (data-heavy, dashboards, terminals)
```

These three together define the component layer's character.

### Phase 5: Generate components.css

Write `.mockups/design-system/components.css` per the structure in
`references/components-css-template.md`. Key rules:

- **Header comment** declares what's locked: aesthetic decisions, the
  list of components, the date generated. Future refinement runs read
  this comment.
- **Section order:** Actions → Forms → Surfaces → Feedback → Navigation
  → Data Display → Overlays → Indicators → Project-Unique.
- **Every component defines all its states.** Buttons get
  `:hover / :focus-visible / :active / :disabled` plus every variant
  class. Inputs get `:focus / .input--error / :disabled` plus
  `.field`-wrapper combos.
- **Class naming:** semantic, opinion-bearing. `.btn` / `.btn-primary` /
  `.btn--lg` (modifier with double-dash for size/state variants).
  Avoid framework-style utility classes — no `.bg-blue-500`. Names
  describe **purpose**, not appearance.
- **Token-only colors and spacing.** Every value should be a
  `var(--token)` reference. If a needed token is missing from
  `tokens.css`, either add it via `palette` refinement mode or inline
  with a `/* TODO: not in tokens.css */` comment.

### Phase 6: Generate components.html

Write the showcase page per `references/showcase-page-template.md`.
Structure:

- Top nav with anchor links to each section
- One section per category, each showing every component in every state
- Each component cell shows: rendered output + the HTML snippet
  reviewers can copy
- A dark-mode toggle at the top (if `tokens.css` has dark mode defined)
- Tables of state combinations where useful (e.g., button variants ×
  sizes)

The showcase is the **review artifact**. Reviewers scroll through it
once and either sign off or list specific tweaks. Don't generate
separate showcase files per category — one anchored page is easier to
review.

### Phase 7: Open and ask

Open the showcase:

```bash
xdg-open .mockups/design-system/components.html 2>/dev/null & \
  || open .mockups/design-system/components.html 2>/dev/null \
  || start "" .mockups/design-system/components.html 2>/dev/null \
  || echo "file://$(pwd)/.mockups/design-system/components.html"
```

Then ask via `structured question tool`:

```
Q: How does the component layer feel?
- Ship it — sign off, screens and flows can start using these
- Tweak specific components (specify which)
- Add components (specify what)
- Rework the aesthetic — depth / corners / density got the wrong tone
```

### Phase 8: Iterate or finalize

**Ship it:**
- Update the substrate item body (if applicable):
  ```markdown
  ## Mockups
  - Design system: `.mockups/design-system/`
    - Components: locked 2026-05-15
    - Includes: buttons, inputs, cards, modals, toasts, dropdowns,
      <project-unique>
  ```
- `git add .mockups/design-system/components.{html,css}`
- Tell the user `screens` and `flows` will now inherit the components
  automatically.

**Tweak specific components:**
- Edit just the affected sections in `components.css`, regenerate the
  affected showcase sections in `components.html`, re-open.
- Re-run state-completeness check (Phase 5 rules) on touched components.

**Add components:**
- Run a focused Phase 2 or Phase 3 mini-loop for just the new
  components, append to `components.css`, append new sections to
  `components.html`, re-open.

**Rework the aesthetic:**
- Re-enter Phase 4 with the user's correction, regenerate
  `components.css` end-to-end, regenerate `components.html`. The
  component **list** stays; the visual tone changes.

**Stop condition:** "ship it" or equivalent. Three rounds without
convergence → flag that the project's visual voice may be unclear and
suggest revisiting `palette` aesthetic poles.

## Refinement mode (existing components.css present)

When `.mockups/design-system/components.css` exists at invocation:

1. Read the header comment — note the locked aesthetic decisions and
   component list.
2. Ask what to change:
   ```
   Q: What's the refinement?
   - Add a component (specify which)
   - Modify a specific component (specify which + what)
   - Restyle the layer (rework aesthetic — depth / corners / density)
   - Remove a component (specify which)
   ```
3. Generate a focused before/after preview in `components.html` for the
   proposed change.
4. After approval, update `components.css` (preserving the header
   comment, updating the date and component list).

Never overwrite `components.css` in refinement mode without explicit
user confirmation. The header comment is the source of truth.

## Integration with screens and flows

Once `components.css` exists, every `screens/option-N.html` and every
`flows/<flow-name>/NN-<slug>.html` should:

1. Link both stylesheets in `<head>`:
   ```html
   <link rel="stylesheet" href="../../design-system/tokens.css">
   <link rel="stylesheet" href="../../design-system/components.css">
   ```
2. Use component classes in markup instead of inline styles:
   ```html
   <button class="btn btn-primary">Continue</button>
   <div class="field">
     <label for="email">Email</label>
     <input class="input" id="email" type="email">
   </div>
   ```
3. Only add `<style>` blocks for **layout** (grid, flex, page-specific
   composition) — not for the components themselves.

This is the consistency mechanism. The `screens` skill's "Consistency
validation" phase and the `flows` skill's "Cross-step visual
consistency" rule both become trivial: if every mock uses
`components.css`, they CAN'T drift.

## Anti-patterns

- **Don't generate components you don't need.** A 40-component
  `components.css` that uses 8 is harder to maintain than an 8-component
  one. Add components when downstream mocks need them, not
  speculatively. Refinement mode is cheap.
- **Don't reinvent component patterns from popular frameworks.** A
  button is a button. The differentiation lives in the **aesthetic
  treatment** (Phase 4) and the **project-unique components** (Phase 3),
  not in inventing a new abstraction for "button."
- **Don't skip project-unique components.** A project with zero unique
  components is a project that hasn't found its voice. Push for at
  least 2; if the project genuinely has none, say so explicitly in the
  header comment rather than silently ending up with a generic kit.
- **Every state must be defined.** A button without `:focus-visible` is
  an accessibility hole. A button without `:disabled` will get one
  hand-styled inline in three different mocks. Define them all.
- **No CSS framework CDNs.** `ux-ui-principles` tech rule applies. No
  Tailwind, no Bootstrap; vanilla CSS only.
- **Tokens-only colors and spacing.** If a value isn't a
  `var(--token)`, it's a drift point waiting to happen. Use tokens or
  extend tokens — don't inline.
- **Single file per artifact.** `components.css` is one file;
  `components.html` is one file. Splitting them into per-category files
  fragments the review and breaks the "one stylesheet to link" promise.
- **Three rounds is the soft cap on iteration.** Looping a fourth
  time usually means palette aesthetic poles aren't pinned.

## Reference files

- `references/common-component-vocabulary.md` — canonical list of common
  components with their states, variants, and HTML patterns
- `references/components-css-template.md` — the `components.css`
  structure, header-comment contract, naming conventions
- `references/showcase-page-template.md` — the `components.html`
  structure with anchored sections and copyable snippets

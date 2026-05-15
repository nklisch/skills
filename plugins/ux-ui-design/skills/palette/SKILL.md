---
name: palette
description: >
  Generate a project's design-system mockup — color palette, typography scale,
  and a reusable tokens.css — as standalone HTML preview pages in
  .mockups/design-system/. Produces multiple palette and type options up-front
  for the user to pick from, then locks in the chosen tokens. Triggers on
  "design a palette", "pick brand colors", "design system mockup", "font and
  color choices", "generate design tokens". Defers to ux-ui-principles for
  storage, tech, and linking conventions.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Palette

Generate the project's visual design system: color palette, typography scale,
spacing scale, and a reusable `tokens.css` file. Output lives in
`.mockups/design-system/` and is referenced by the `screens` and `flows`
skills so all mocks share a coherent visual language.

## When to invoke

User triggers:
- "design a palette for this project"
- "pick brand colors"
- "design system mockup"
- "let's figure out fonts and colors"
- "generate design tokens"

Agent-driven triggers:
- An epic-design pass at project bootstrap when the visual identity is undefined.
- `screens` or `flows` is about to run and `.mockups/design-system/tokens.css`
  doesn't exist yet — palette should run first.
- The user lands on visual decisions during `ideate` or `scope`.

## What it produces

```
.mockups/design-system/
  palette.html       # color preview: tokens, usage examples, contrast checks
  typography.html    # font preview: stack, scale, weights, sample paragraphs
  tokens.css         # the actual --tokens used by all downstream mocks
```

If the project doesn't yet have a chosen direction, palette generates **3
distinct palette options** in `palette.html` (as labeled sections) and **2
typography options** in `typography.html`, then asks the user to pick before
locking `tokens.css`.

If the project already has tokens.css, palette runs in refinement mode —
edit existing tokens with explicit user approval, regenerate previews.

## Workflow

### Phase 1: Ground and detect mode

Confirm `ux-ui-principles` is loaded; install CLAUDE.md rule if missing.

Read:
- `.mockups/design-system/tokens.css` if it exists → refinement mode
- `CLAUDE.md`, `README.md`, any docs about brand or visual direction
- Existing app code's CSS / theme files if the project has any
- Existing logos or brand assets the user can point at

### Phase 2: Understand the project's character

Before picking colors, ask 2-4 questions via `AskUserQuestion` to constrain
the direction. Tailor to what isn't already pinned by docs, brand assets, or
existing code:

- **Domain.** Developer-tools / consumer app / enterprise SaaS / fintech /
  creative tool / data-heavy dashboard / content site / game / something else?
- **Tone.** Serious-and-trustworthy / playful-and-energetic / minimal-and-
  utilitarian / branded-and-expressive / editorial-and-thoughtful?
- **Density.** Spacious and roomy / information-dense / mixed?
- **Mode preference.** Dark-first / light-first / both equally / system-follow?
- **Existing constraints.** Existing logo? Required brand colors? Customer
  legacy associations?

Skip what's already pinned by docs or existing assets.

### Phase 3: Sketch palette directions

Plan **3 distinct palette options**. Each should be genuinely different along
useful axes:

- **Hue family.** Cool blue/teal, warm orange/amber, neutral gray+accent,
  bold purple/magenta, earthy green/clay, etc.
- **Tone.** High-contrast and punchy vs muted and editorial.
- **Personality.** Corporate-safe vs distinctive-but-readable vs bold-and-
  opinionated.

Pick 3 that span the user's stated character but show real variety. Label
each option clearly.

For each option, define the full token set:

```
--color-bg-primary       # main surface
--color-bg-secondary     # raised surface (cards, modals)
--color-bg-tertiary      # nested raised (input fields, code blocks)
--color-bg-inverse       # contrasting surface for emphasis

--color-text-primary     # body text
--color-text-secondary   # muted text (descriptions, captions)
--color-text-tertiary    # very muted (placeholder, disabled)
--color-text-inverse     # text on inverse surfaces
--color-text-link        # link color
--color-text-link-hover  # link hover

--color-border           # default border / divider
--color-border-strong    # emphasized border

--color-accent           # primary brand color (CTAs, focus)
--color-accent-hover     # CTA hover
--color-accent-muted     # accent at low saturation (selected backgrounds)

--color-success
--color-warning
--color-danger
--color-info
```

Provide both **light-mode** and **dark-mode** values for each token.

### Phase 4: Write palette.html

Generate a single `palette.html` that shows ALL 3 options stacked
vertically with clear labels. Each option section displays:

- The option name + one-sentence rationale
- Color swatches with their hex values and token names
- A small composition demo (button, card, link, code block) using just that
  option's tokens
- A contrast check: foreground vs background WCAG ratios for the primary
  text-on-background pairings

Use anchor links at the top to jump between options.

**Page template** (vanilla CSS, no CDN):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Palette options — {project}</title>
  <style>
    body { margin: 0; font: 14px/1.5 system-ui, sans-serif; }
    nav.toc {
      position: sticky; top: 0; z-index: 10;
      padding: 12px 24px; background: #111; color: #eee;
      display: flex; gap: 16px; align-items: center;
    }
    nav.toc a { color: #8af; text-decoration: none; }
    section.option { padding: 32px 24px; border-bottom: 1px solid #ddd; }
    section.option h2 {
      margin: 0 0 4px; display: flex; gap: 12px; align-items: center;
    }
    section.option h2 .badge {
      background: #eee; padding: 2px 8px; border-radius: 4px;
      font: 600 11px/1 system-ui; text-transform: uppercase;
    }
    section.option p.rationale {
      margin: 0 0 16px; color: #555; font-size: 13px;
    }
    .swatches {
      display: grid; gap: 8px;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      margin: 16px 0;
    }
    .swatch {
      border: 1px solid #ddd; border-radius: 6px; overflow: hidden;
    }
    .swatch .color {
      height: 56px;
    }
    .swatch .meta {
      padding: 6px 8px; font: 12px/1.4 ui-monospace, monospace;
    }
    .swatch .meta .name { display: block; }
    .swatch .meta .hex { color: #888; }
    .demo {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
      margin-top: 16px;
    }
    .demo .pane {
      padding: 16px; border-radius: 8px; border: 1px solid #ddd;
    }
    .demo .pane.dark { border-color: #333; }
    .demo button {
      padding: 8px 16px; border: 0; border-radius: 6px;
      font: 500 14px/1 system-ui;
      cursor: pointer;
    }
    .demo .row { display: flex; gap: 8px; align-items: center; margin: 8px 0; }
    .contrast {
      margin-top: 12px;
      font: 12px/1.4 ui-monospace, monospace;
    }
    .contrast .pass { color: #060; }
    .contrast .fail { color: #c00; }
  </style>
</head>
<body>
  <nav class="toc">
    <strong>{project} palette options</strong>
    <a href="#option-1">Option 1</a>
    <a href="#option-2">Option 2</a>
    <a href="#option-3">Option 3</a>
  </nav>

  <!-- repeat per option -->
  <section class="option" id="option-1">
    <h2>Option 1 — {label} <span class="badge">{tone}</span></h2>
    <p class="rationale">{one-sentence rationale}</p>
    <div class="swatches">
      <!-- one .swatch per token -->
    </div>
    <div class="demo">
      <div class="pane light">{light-mode mini composition}</div>
      <div class="pane dark">{dark-mode mini composition}</div>
    </div>
    <div class="contrast">
      Text on bg: <span class="pass">4.8:1 AA pass</span>
      Muted on bg: <span class="pass">4.6:1 AA pass</span>
      ...
    </div>
  </section>
  <!-- ... -->
</body>
</html>
```

### Phase 5: Sketch typography directions

Plan **2 typography options**. Vary along:

- **System vs hosted fonts.** System UI stack (Inter alternatives,
  -apple-system, etc.) vs a specific font choice.
- **Personality.** Geometric / humanist / slab / mono-leaning / serif-led.

For each, define:

```
--font-sans         # body sans-serif stack
--font-serif        # if any
--font-mono         # code / numeric

--font-size-xs
--font-size-sm
--font-size-base
--font-size-lg
--font-size-xl
--font-size-2xl
--font-size-3xl

--font-weight-regular
--font-weight-medium
--font-weight-semibold
--font-weight-bold

--line-height-tight
--line-height-base
--line-height-loose
```

**Constraint:** prefer system stacks. Avoid Google-Fonts-loaded hosted fonts
in mocks — they break the "self-contained, opens offline forever" rule.
If a hosted font is needed for visual identity, document it in the option
but use the closest system fallback in `tokens.css`.

### Phase 6: Write typography.html

Same structure as `palette.html`: two stacked option sections, each showing
the stack, the scale (display + headings + body + small), weight examples,
and one sample paragraph in the project's domain voice.

### Phase 7: Open and ask

Open both preview pages:

```bash
xdg-open .mockups/design-system/palette.html 2>/dev/null &
xdg-open .mockups/design-system/typography.html 2>/dev/null &
# (fall back to `open` / `start` / `file://` per ux-ui-principles)
```

Then ask via `AskUserQuestion` in two questions (palette pick, type pick):

```
Q1: Which palette?
- Option 1 — {label}: {rationale}
- Option 2 — {label}: {rationale}
- Option 3 — {label}: {rationale}
- Mix two (specify how)
- None — regenerate

Q2: Which typography?
- Option 1 — {label}: {rationale}
- Option 2 — {label}: {rationale}
- Mix two (specify how)
```

### Phase 8: Lock the chosen direction into tokens.css

Write `.mockups/design-system/tokens.css` using the chosen palette + typography:

```css
/*
 * Design tokens for {project}
 * Generated by /ux-ui-design:palette on {date}
 * Palette: Option N — {label}
 * Typography: Option N — {label}
 *
 * Edit by re-running /ux-ui-design:palette (it preserves this header).
 */

:root {
  /* Color tokens (light mode) */
  --color-bg-primary: #...;
  --color-bg-secondary: #...;
  /* ... all tokens ... */

  /* Typography tokens */
  --font-sans: ...;
  --font-mono: ...;
  /* ... */

  /* Spacing scale (8pt baseline) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #...;
    --color-bg-secondary: #...;
    /* ... all dark-mode overrides ... */
  }
}
```

**Important:**
- Include both light and dark mode values.
- Add a `@media (prefers-color-scheme: dark)` block, OR document a
  `[data-theme="dark"]` selector if the project needs explicit toggling.
- Include the spacing and radius scales even though those weren't pitched as
  options — pick reasonable defaults (8pt baseline, 4/8/12/16/24/32/48/64).
- Keep the header comment intact; future runs of palette read it to know
  what's already locked.

### Phase 9: Trim palette.html and typography.html

After lock-in, optionally rewrite `palette.html` and `typography.html` to show
ONLY the chosen option (cleaner reference doc going forward). Ask the user:

```
Q: Keep all options in the preview pages (history), or trim to the chosen one?
- Keep all (for future reference)
- Trim to chosen (cleaner reference)
```

Default to **trim** — the chosen option is what implementers reference. The
prior options are recoverable from git history.

### Phase 10: Record and stage

Update the substrate item body (if applicable) with a `## Mockups` section
that includes the design system:

```markdown
## Mockups
- Design system: `.mockups/design-system/`
  - Palette: option-2 ({label})
  - Typography: option-1 ({label})
  - Tokens locked: 2026-05-15
```

`git add .mockups/design-system/`. Tell the user the tokens are locked in and
`screens` / `flows` will inherit them automatically.

## Refinement mode (existing tokens.css present)

If `.mockups/design-system/tokens.css` already exists when `palette` is
invoked:

1. Read the existing tokens and the header comment.
2. Ask the user what they want to change ("tweak the accent", "shift toward
   warmer", "add a new color for Y", "redo typography").
3. Generate a focused preview HTML at `palette.html` showing **before vs
   after** for the proposed change.
4. After approval, update `tokens.css` and the preview pages.

Don't blow away `tokens.css` in refinement mode without explicit user
confirmation — it's referenced by every screen and flow mock.

## Anti-patterns

- **Don't pull Google Fonts via CDN.** Breaks the offline-forever rule. Use
  system stacks; if a hosted font is decided, the user adds it in production
  code, not in mocks.
- **Don't ship 3 nearly-identical palette options.** If two options share the
  same hue family at similar saturation, regenerate. Real variety only.
- **Don't skip the contrast check.** Even mock palettes should pass WCAG AA
  on the text-on-background pairings. Mocks set expectations.
- **Don't define tokens that won't get used.** A 200-token palette is harder
  to use than a clean 20-token one. Add tokens when downstream mocks need them,
  not speculatively.
- **Don't pick fonts that need a webfont loader in mocks.** Mocks must render
  the same offline two years from now.
- **Don't forget dark mode.** Define both modes from day one; retrofitting
  dark mode after light is established is much harder than doing it together.

---
name: palette
description: >
  ALWAYS invoke this skill when the user asks to design a palette, pick brand colors, build a design
  system, choose typography, or generate design tokens — do not start hardcoding colors or fonts
  inline. Generates a project's design-system mockup — color palette, typography scale, and a reusable
  tokens.css — as standalone HTML preview pages in .mockups/design-system/. Produces multiple palette
  and type options up-front for the user to pick from, then locks in the chosen tokens. Use before
  screen or flow mockups so every mock shares a coherent visual language. Triggers on "design a
  palette", "pick brand colors", "design system mockup", "font and color choices", "generate design
  tokens", "choose a typeface", "set up the visual system". Defers to ux-ui-principles for storage,
  tech, and linking conventions.
---

# Palette

Generate the project's visual design system: color palette, typography
scale, spacing scale, and a reusable `tokens.css` file. Output lives in
`.mockups/design-system/` and is referenced by the `screens` and `flows`
skills so every mock shares a coherent visual language.

The palette is the project's *world*. Don't pick safe colors. Generic
"corporate blue + neutral gray + one accent" is the AI default, and it
poisons everything downstream. Pick something that could only belong to
*this* project.

## When to invoke

User triggers:
- "design a palette for this project"
- "pick brand colors"
- "design system mockup"
- "let's figure out fonts and colors"
- "generate design tokens"

Agent-driven triggers:
- An epic-design pass at project bootstrap when visual identity is undefined.
- `screens` or `flows` is about to run and
  `.mockups/design-system/tokens.css` doesn't exist yet — palette runs first.
- A `scope` or `ideate` run lands on visual decisions for a UI project.

## What it produces

```
.mockups/design-system/
  palette.html       # color preview: tokens, usage examples, contrast checks
  typography.html    # font preview: stack, scale, weights, sample paragraphs
  tokens.css         # the locked --tokens used by all downstream mocks
```

If the project doesn't yet have a chosen direction, palette generates **3
distinct palette options** in `palette.html` and **2 typography options** in
`typography.html`, then asks the user to pick before locking `tokens.css`.

If `tokens.css` already exists, palette enters **refinement mode** — edits
existing tokens with explicit user approval and regenerates previews. Never
overwrites without confirmation; every downstream mock reads from this file.

## Workflow

### Phase 1: Ground and detect mode

Confirm `ux-ui-principles` is loaded; install the `CLAUDE.md` block if the
marker is missing.

Read:
- `.mockups/design-system/tokens.css` if it exists → **refinement mode**
- `CLAUDE.md`, `README.md`, any docs about brand or visual direction
- Existing CSS / theme files in the app code
- Logos or brand assets the user can point at

### Phase 2: Stake out the project's character

Before picking colors, get the project's **personality** into focus. Use
`structured question tool` (2-4 questions, tailored to what isn't already pinned
by docs or assets).

The full catalog of 37 poles is in `references/aesthetic-poles.md`, organized
into 12 families (minimalist, editorial, historical movement, retro futurism,
internet-native, maximalist, constraint/craft, cultural, refusal, atmosphere,
function/density, premium). The Phase 2 question pitches a curated subset —
roughly 12-15 poles spanning the families — to provoke imagination. When the
user gestures at a direction not in the curated set ("something more 80s / more
Japanese / more brutalist"), pull the matching pole(s) from the full catalog
in the follow-up.

```
Q: Which aesthetic poles fit this project? Pick 1-2 — push past "professional / clean / modern."

— Minimalist / monastic
- Brutally minimal — system fonts, one accent, profound restraint
- Muji / emptiness (kuu) — unbleached neutrals, never #000/#fff, the user completes the page

— Editorial / publication
- Editorial / magazine — serifs, generous hierarchy, content-as-hero
- Swiss / International Typographic Style — strict 12-col grid, Akzidenz/Helvetica, one accent
- Dark academia — brooding intellectualism, oxblood + parchment + gold leaf

— Historical movement
- Bauhaus — primary geometric tokens mapped to primary hues, shape-as-affordance
- Memphis Milano — squiggles, terrazzo, pastel + black, pattern-on-pattern
- Russian Constructivism — diagonal as primary axis, photomontage, red+black+cream

— Retro futurism
- Cassette futurism — Nostromo consoles, amber CRT, beige plastic, wood
- Frutiger Aero — wet/alive/hopeful, aqua + glass + bubbles, mid-2000s Vista
- Y2K Chromecore — anxious pre-millennial chrome, liquid metal, lime + orange

— Internet-native
- Vaporwave — pink/teal grids, Roman busts, late-capitalism elegy
- Hauntology — Mark Fisher's lost futures, Penguin-paperback + library-music
- Liminal spaces / dreamcore — empty hallways, fluorescent + teal carpet

— Cultural / regional (see cultural-borrowing.md before picking)
- Barragán — saturated single-color planes, walls of dyed plaster
- Marimekko — one enormous brush-painted motif at oversized scale
- Girih / generative geometry — 5-tile aperiodic patterns; pattern as system

— Refusal / anti-design
- True brutalist web — motherfuckingwebsite/sourcehut, system Times, default blue links
- One-button / read-only — refusal-as-design, one screen one input
- Neubrutalism — thick black borders, hard offset shadows, candy-flat blocks

— Atmosphere / depth
- Cyberpunk / neon — high-contrast dark, electric accents, glow
- Aurora gradient — atmospheric color flow, painterly light
- Spatial / visionOS — translucent glass with refraction, depth-stacked

— Function / density
- Data-dense / trading-terminal — green/red against deep navy, mono everywhere
- Soulslike minimalism — restraint by removal of affordances, not styling
- Roguelike ASCII — a character is a type not a picture

If none of these click, describe the direction in words — the full 37-pole catalog
in references/aesthetic-poles.md has more.
```

If the user picks a culturally-anchored pole (Barragán, Marimekko, Girih,
Chromolitho, Korean density, Chinese super-app, Adinkra/Kente, Aboriginal
dot-painting), trigger the cultural-borrowing guardrail per
`references/cultural-borrowing.md`. The borrow should be principled — borrow the
*grammar*, substitute the iconography — unless the project has cultural authority.

```
Q: What's the project's tone?
- Trustworthy / serious
- Energetic / playful
- Quiet / confident
- Bold / opinionated
- Scholarly / thoughtful
- Rebellious / punk
- Provocative / questioning  (for speculative / critical-design projects)
```

```
Q: What emotional aesthetic should the design lean into?
   (Ingrid Fetell Lee's 10 aesthetics of joy — pick 1-2 deliberately;
    skip the question if the project's emotional thesis is already clear
    from the poles above)
- Energy — vibrant color, light, electric saturation
- Abundance — variety, lushness, multiplicity
- Freedom — nature, open space, wildness
- Harmony — balance, symmetry, flow
- Play — circles, spheres, bubbly forms
- Surprise — contrast, whimsy
- Transcendence — elevation, lightness
- Magic — invisible forms, illusion
- Celebration — synchrony, bursting, sparkly
- Renewal — blossoming, expansion, curves
```

Pin the Fetell Lee aesthetics deliberately when relevant — they shape motion
and form choices downstream. A productivity tool might pick Harmony + Renewal;
a celebration product might pick Energy + Celebration; a contemplative app
might skip Joy aesthetics entirely if the tone is Quiet/Confident.

Also pin:
- **Density.** Generous and spacious, or information-dense?
- **Mode preference.** Dark-first / light-first / both equally / system-follow?
- **Existing constraints.** Logo? Brand colors? Customer associations to
  honor or escape?

Push back if answers default to "neutral / safe / corporate" — those produce
the worst outcomes here. The palette's job is to give the project a world,
not to disappear.

### Phase 3: Sketch three distinct directions

Three palettes means three different worlds the project could live in. Pick
three that span genuinely different territory along these axes:

- **Hue family.** Cool blue/teal, warm orange/amber, neutral gray+accent,
  bold purple/magenta, earthy green/clay, electric near-monochrome.
- **Tone.** High-contrast and punchy vs muted and editorial.
- **Personality.** Corporate-safe vs distinctive-but-readable vs
  bold-and-opinionated.

Aim for real range across the three options — different hue families,
different saturation profiles, different personality. If two options share
a hue family at similar saturation, the design space hasn't been explored
yet; reach for a third axis (warm/cool contrast, muted/punchy contrast, or
corporate/expressive contrast).

For each option, define the full semantic token set — see
`references/token-vocabulary.md` for the canonical list. Define both
**light-mode** and **dark-mode** values for every color token. Build both
modes side by side; retrofitting dark mode later is the most expensive
mistake in palette work.

### Phase 4: Write palette.html

Generate `palette.html` showing all three options stacked vertically with
clear labels and anchor links at the top to jump between them. Each option
section displays:

- The option name + one-sentence rationale + tone badge
- Color swatches with their hex values and token names
- A small composition demo (button, card, link, code block) using only
  that option's tokens, shown in both light and dark mode
- Contrast-check results for the key WCAG AA pairings

See `references/preview-pages.md` for the full HTML structure and CSS.

**Contrast checks.** Compute ratios for both light and dark mode for these
pairings:

- `--color-text-primary` on `--color-bg-primary`
- `--color-text-secondary` on `--color-bg-primary`
- `--color-text-inverse` on `--color-accent`
- `--color-accent` on `--color-bg-primary` (for accent-as-text use)

WCAG AA: 4.5:1 for body text, 3.0:1 for large text. Mark failing pairings
with a visible `<span class="fail">` AND show the failing pair below the
swatches. If all three options have failing pairings, the color space is
over-constrained — surface this and ask the user whether to relax a
constraint (drop the brand-color requirement, allow a less-saturated
accent) before regenerating.

### Phase 5: Sketch two typography directions

Two typography options. Vary along:

- **System vs hosted fonts.** System UI stack vs a specific font choice.
- **Personality.** Geometric / humanist / slab / mono-leaning / serif-led.

For each, define the full type-token set from
`references/token-vocabulary.md`.

**Hosted fonts (Google Fonts, etc.) are fine.** When a project's identity
calls for a distinctive face — Inter, IBM Plex, Fraunces, JetBrains Mono,
Space Grotesk, anything — load it via `<link>` in the mock's `<head>` and
declare the full fallback chain in `--font-sans` / `--font-mono`. Cache
catches most repeat opens; offline rendering falls back to the next stack
entry. That's a reasonable trade for using the actual face the project
intends to ship.

System stacks are still a strong choice when the project's character calls
for "honest defaults" (developer tools, terminals, utilitarian dashboards).
Pick deliberately — not by default.

### Phase 6: Write typography.html

Same outer shape as `palette.html`: two stacked option sections, each
showing the stack, the scale (display + headings + body + small), weight
examples, and one sample paragraph in the project's domain voice — not
lorem ipsum. Fintech project → financial copy. Game → game copy.

See `references/preview-pages.md` for the structure.

**Typographic-color squint check.** After both type options are rendered,
squint at each sample paragraph. The block of body text should read as a
*uniform medium grey* — Tschichold's / Bringhurst's "typographic color." If
patches read as dark (line-height too tight, weight too heavy, tracking too
loose) or light (line-height too loose, weight too thin), the option needs
adjustment before the user sees it. Two paragraphs of the same text on the
same canvas can read as different shades of grey; the wrong shade fights the
reader. Quick fix-up loop before lock-in: tweak line-height ± 0.05 or weight
± 50 (variable fonts) or tracking ± 0.005em until each paragraph reads
evenly.

### Phase 7: Open and ask

Open both preview pages:

```bash
xdg-open .mockups/design-system/palette.html 2>/dev/null &
xdg-open .mockups/design-system/typography.html 2>/dev/null &
# (fall back to `open` / `start` / `file://` per ux-ui-principles)
```

Then ask via `structured question tool` in two questions (palette pick, then type
pick):

```
Q1: Which palette claims the project's world?
- Option 1 — {label}: {evocative one-line rationale}
- Option 2 — {label}: {evocative one-line rationale}
- Option 3 — {label}: {evocative one-line rationale}
- Mix two (specify how)
- None click — push further into a different pole

Q2: Which typography fits?
- Option 1 — {label}: {one-line rationale}
- Option 2 — {label}: {one-line rationale}
- Mix two (specify how)
```

### Phase 8: Lock the chosen direction into tokens.css

Write `.mockups/design-system/tokens.css` using the chosen palette and
typography. See `references/tokens-css-template.md` for the full file
structure, the canonical header comment, and the dark-mode mechanism
choice.

Lock-in writes the contract that every screen and flow mock will inherit,
so a few things matter here:

- **Define both light and dark mode values together** — retrofitting dark
  later is painful.
- **Pick the dark-mode mechanism that fits the project:**
  `@media (prefers-color-scheme: dark)` for system-following,
  `[data-theme="dark"]` for explicit toggling.
- **Include the spacing scale** (8pt baseline: 4/8/12/16/24/32/48/64) and
  radius scale even though they weren't pitched as options — downstream
  mocks will need them, and reasonable defaults beat ad-hoc choices later.
- **Keep the header comment intact** — future palette runs read it to
  know what's already locked.

### Phase 9: Trim palette.html and typography.html

After lock-in, ask whether to keep all options (history) or trim to the
chosen one (cleaner reference). Default to **trim** — the chosen option is
what implementers reference. Prior options are recoverable from git.

```
Q: Keep the preview pages full, or trim to the chosen direction?
- Trim to chosen (Recommended) — cleaner reference doc going forward
- Keep all options — preserves history in the preview pages themselves
```

### Phase 10: Record and stage

Update the substrate item body (if applicable):

```markdown
## Mockups
- Design system: `.mockups/design-system/`
  - Palette: option-2 ({label})
  - Typography: option-1 ({label})
  - Tokens locked: 2026-05-15
```

`git add .mockups/design-system/`. Tell the user the tokens are locked and
`screens` / `flows` will inherit them automatically.

### Phase 11: Suggest components and motion as the next steps

For any project that will produce more than a few screen or flow mocks,
`palette` is only the first slice of the design system. The full pipeline:

1. **`palette`** (you are here) — tokens for color, type, spacing, radii
2. **`components`** — reusable component primitives that compose tokens
3. **`motion`** — named easing-curve language, Doherty-coupled durations,
   springs, designed pauses, reduced-motion fallbacks
4. **`screens`** / **`flows`** — applications of all three above

`components` prevents the drift that `screens` and `flows` would otherwise fight
by hand (each mock re-deciding what a button looks like). `motion` prevents the
parallel drift on the kinetic axis (each mock re-picking a cubic-bezier and a
duration). Together they keep every downstream mock coherent.

Suggest the next steps:

```
With tokens locked, the natural next steps are:

1. /ux-ui-design:components — turns tokens into reusable primitives every
   screen and flow inherits. Run now, defer, or skip?

2. /ux-ui-design:motion — defines the kinetic language (easing curves,
   durations, springs, reduced-motion). Run after components, before screens
   or flows. Run now, defer, or skip?
```

Skip is fine for fast/exploratory work. Defer is fine when only one or two
screens are coming. Run them in order when the project will span more than a
handful of mocks — the consistency the pipeline buys compounds.

## Refinement mode (existing tokens.css present)

If `.mockups/design-system/tokens.css` exists when `palette` is invoked:

1. Read the existing tokens and the header comment.
2. Ask the user what they want to change ("warm the accent", "redo
   typography", "add a `--color-success-subtle`").
3. Generate a focused preview in `palette.html` showing **before vs after**
   for the proposed change.
4. **Run contrast checks on the proposed values** — the same canonical
   pairings from Phase 4. If a pairing degrades below WCAG AA, surface the
   specific pairing and ratio AND require confirmation before locking.
5. After approval, update `tokens.css` (preserving the header comment and
   updating the "Generated" date and option labels if they changed).

Never overwrite `tokens.css` in refinement mode without explicit user
confirmation. The header comment is the source of truth for what's locked.

## Anti-patterns

- **Aim for real range across the three options** — different hue
  families, different saturation profiles, different personality. If two
  options share a hue family at similar saturation, the design space
  hasn't been explored yet; reach for a third axis (warm/cool, muted/
  punchy, corporate/expressive).
- **Pick fonts deliberately, not by default.** Hosted faces (Google Fonts,
  etc.) are fine when the project's identity calls for a specific one;
  load them via `<link>` in the mock and declare the fallback chain. But
  don't reach for Inter/Space Grotesk reflexively — those are the AI
  default and most projects deserve better. System stacks are a
  legitimate choice for "honest defaults" projects; just commit to one
  on purpose.
- **The contrast check is non-negotiable.** Mocks set expectations. A
  palette that fails WCAG AA in the mock will fail in production too.
- **Don't define tokens that won't get used.** A 200-token palette is
  harder to use than a clean 20-token one. Add tokens when downstream
  mocks need them, not speculatively. See
  `references/token-vocabulary.md`.
- **Design both modes together from day one.** Light-first then
  dark-retrofit is the most expensive mistake in palette work — every
  contrast choice has to be re-justified against a dark canvas, and the
  muted/accent relationships rarely survive the translation. Build both
  side by side and the constraints compose.
- **Push past "professional / clean / modern."** Those are the default
  outcomes when the palette skill doesn't activate aesthetic range. The
  palette's job is to give the project a world that's recognizably its
  own.

## Reference files

- `references/token-vocabulary.md` — the semantic CSS-variable vocabulary,
  including the optional Bertin visual-variables tier for data-viz tokens
  (categorical / sequential / diverging color ramps)
- `references/preview-pages.md` — `palette.html` and `typography.html` templates
- `references/tokens-css-template.md` — locked `tokens.css` format and
  header-comment contract
- `references/aesthetic-poles.md` — the full 37-pole catalog organized into 12
  families, with starter palettes (hex) + type stacks + component signatures +
  best-fit projects per pole
- `references/cultural-borrowing.md` — guardrail for culturally-anchored poles;
  per-pole risk levels and the principle/iconography two-layer model

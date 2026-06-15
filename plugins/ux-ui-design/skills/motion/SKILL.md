---
name: motion
description: >
  ALWAYS invoke this skill when the user asks to design motion, animation, transitions, easing curves,
  spring physics, micro-interactions, or other UI kinetics. Generates motion.html and motion.css with
  named easing attitudes, duration scale, spring presets, interaction tokens, designed pauses, and
  reduced-motion variants. Runs after components and before screens or flows so downstream mocks share
  one kinetic language.
---

# Motion

Generate the project's motion system: a vocabulary of named easing curves with attitudes, a
Doherty-coupled duration scale, spring presets for gesture-driven UI, designed-pause tokens,
and the showcase HTML/CSS that lets reviewers actually *see* every motion before any
component animates. Output lives in `.mockups/design-system/` and is referenced by every
downstream `components`, `screens`, and `flows` mock.

Motion is the missing layer between `components` (composition) and `screens/flows`
(application). Without it, every component re-decides what "fast" means, every screen
re-picks a cubic-bezier, and every flow's transitions feel like a different product. With
it, motion is decided once and every mock inherits — the kinetic voice is consistent across
the whole project.

The skill's thesis: **motion has a vocabulary, not a duration spec.** Most design systems
treat motion as `200ms cubic-bezier(0.4, 0, 0.2, 1)`. This skill teaches *named attitudes*
(emphasized, productive, expressive, standard, linear) with paired durations, plus springs,
plus pauses, so a screen mock can say "this transition uses `--motion-emphasized`" — and
that name carries the attitude across every implementer who touches the code.

## When to invoke

User triggers:
- "design the motion system"
- "let's pick easing curves"
- "design the transitions / animations"
- "set up motion tokens"
- "what should our springs feel like"
- "design the micro-interactions"

Agent-driven triggers:
- An epic-design pass at project bootstrap, AFTER `palette` + `components` have locked
  tokens.css and components.css, BEFORE the first `screens` or `flows` run.
- A `screens` or `flows` invocation about to start and `.mockups/design-system/motion.css`
  doesn't exist yet — `motion` runs first.
- An `adopt` pass that found inline cubic-bezier values or hardcoded durations in the
  scanned codebase and is gap-filling the design system.
- A `scope` or `ideate` run lands on kinetic alignment for a UI-bearing project.

## What it produces

```
.mockups/design-system/
  motion.html        # showcase: every motion in every state, playable in the browser
  motion.css         # reusable variables — screens, components, and flows link this
```

Both files are committed as design artifacts. `motion.css` is the **contract**; every
downstream mock links it via:

```html
<link rel="stylesheet" href="../../design-system/tokens.css">
<link rel="stylesheet" href="../../design-system/components.css">
<link rel="stylesheet" href="../../design-system/motion.css">
```

If `motion.css` already exists when this skill runs, enter **refinement mode** — edit
existing curves/durations/springs or add new ones with explicit user approval. Never
overwrite without confirmation; every downstream mock reads from this file.

## Workflow

### Phase 1: Ground and detect mode

Confirm `ux-ui-principles` is loaded; install the project agent-instructions
block if the marker is missing (`AGENTS.md` first, `CLAUDE.md` only as a
compatibility target).

**Verify upstream files exist.** Motion composes against tokens (for color transitions)
and components (for the actual targets that animate). If `.mockups/design-system/tokens.css`
is missing, delegate to `palette` first. If `.mockups/design-system/components.css` is
missing, recommend running `components` first — motion can run standalone but the showcase
is more meaningful when there are real components to demonstrate motion against.

Read:
- `.mockups/design-system/tokens.css` — the locked vocabulary
- `.mockups/design-system/components.css` — the components motion will animate
- `.mockups/design-system/motion.css` if present → **refinement mode**
- The substrate item (epic/feature) if applicable, for project-character hints
- `AGENTS.md`, `CLAUDE.md`, `README.md`, any brand/voice docs

### Phase 2: Set the motion thesis (attitude)

Motion has a *character* before it has a duration. Use `structured question tool` to claim 1-2
attitudes the product's motion should carry:

```
Q: What attitude should this product's motion carry? (pick 1-2)

- Productive — efficient, businesslike; motion stays out of the way (IBM Carbon's
  "productive" curve, government dashboards, ops tools)
- Expressive — motion is part of the brand voice; transitions perform (Material 3
  emphasized, consumer apps, entertainment)
- Calm — motion respects the periphery; nothing demands attention (Apple ambient,
  health/meditation apps, sensors)
- Kinetic — motion has energy and snap; the product feels alive (gaming, gen-Z apps,
  hyperpop tonal kin)
- Restrained — motion appears only when it must (developer tools, dense data UIs,
  Soulslike minimalism)
- Cinematic — motion is choreographed; transitions carry weight (Saul Bass / Cooper
  lineage, editorial, premium products)
```

Pin also:
- **Touch vs cursor primarily?** Springs are gesture-driven; if the product is
  desktop-first, spring tokens matter less.
- **Reduced-motion expectations?** Required (every motion has a reduced-motion variant)
  vs optional (defer to system default only). For health/government/accessibility-first
  products, the answer is required.
- **Motion budget?** Motion-rich (every interaction has a small motion), motion-light
  (only state changes and key transitions), motion-minimal (only what's strictly
  necessary for state clarity).

The attitude pick drives every downstream choice: a "Productive" product's `--motion-quick`
duration is 150-200ms with a curve that decelerates fast; an "Expressive" product's same
token is 250-350ms with a curve that overshoots slightly. Don't pick all six — that's
noise. Two attitudes deliberately chosen, named in the motion.css header comment.

### Phase 3: Define the named easing-curve language

Five named curves with paired durations. Each is a `--motion-{name}` custom property
plus a `--dur-{name}` partner; downstream mocks reference the name, never the
coefficients.

The canonical five (refined per attitude in Phase 2):

| Name | Attitude carried | Cubic-bezier (default) | Paired duration | Used for |
|---|---|---|---|---|
| `emphasized` | Expressive / Cinematic | `cubic-bezier(0.2, 0, 0, 1)` | 300-500ms | Major state changes, modal entries, screen transitions |
| `standard` | Productive / Calm | `cubic-bezier(0.4, 0, 0.2, 1)` | 200-300ms | Default for most transitions; the workhorse |
| `productive` | Productive / Restrained | `cubic-bezier(0.0, 0, 0.2, 1)` | 100-200ms | Snap-to-final; loading completions, form-state changes |
| `expressive` | Expressive / Kinetic | `cubic-bezier(0.4, 0, 0.6, 1.4)` | 350-500ms | Overshoot/playful arrival; success states, hero entrances |
| `linear` | Linear, always | `linear` | varies | Progress indicators, loaders, anything physics-defying |

Each curve carries an *attitude*, not just a shape. The attitude-name is what implementers
read — `--motion-emphasized` says "this transition should feel emphatic," which is more
useful at code-review time than `cubic-bezier(0.2, 0, 0, 1)`.

**For attitude-tuning** (Phase 2 picks shape these):

- **Productive** + **Restrained** product: bias all curves toward decelerate-fast,
  durations toward the short end. `emphasized` becomes 200-300ms instead of 350-500.
- **Expressive** + **Kinetic** product: bias `expressive` toward overshoot (1.4-1.7
  end-point) and `emphasized` toward longer (400-500ms).
- **Calm** + **Cinematic** product: ease-out curves predominate; nothing eases-in (entry
  is sudden, exit is gentle); durations toward the long end.

Default `cubic-bezier` values above are the Material 3 / iOS / Carbon canonical set;
they're a strong starting point. Refine per attitude.

See `references/easing-vocabulary.md` for the full curve derivation and per-attitude
variants.

### Phase 4: Define the Doherty-coupled duration scale

Motion duration is a budget against the **Doherty threshold** (sub-400ms keeps users
engaged; >400ms loses flow — Doherty & Thadani, IBM, 1982).

Three duration tokens, each tied to an interaction class:

```
--dur-instant: 80ms;    /* Feels direct; use for hover/pressed state changes */
--dur-quick:   240ms;   /* Default for transitions that gate input; ≤300ms ceiling */
--dur-ambient: 600ms;   /* Background motion only; does NOT gate input */
```

**The rule:** any animation that blocks user input — modal open before content is
clickable, screen transition before the next route is interactive, anything where the
user has to wait — must fit inside `--dur-quick` (≤300ms). Background motion (a hero
gradient drift, a skeleton breathe, an ambient indicator pulse) can be longer because it
doesn't gate input.

Motion.css enforces this with a paired property:

```css
:root {
  --dur-instant: 80ms;
  --dur-quick:   240ms;
  --dur-ambient: 600ms;
  /* INVARIANT: any transition that gates input MUST use --dur-instant or --dur-quick.
     Only background/ambient motion uses --dur-ambient. */
}
```

Every motion in the showcase declares which class it belongs to: **input-gating** or
**ambient**. The review check is "could a user be waiting on this?" — yes ⇒ quick budget;
no ⇒ ambient budget.

### Phase 5: Define spring presets (gesture-driven products only)

If Phase 2 said touch-first / gesture-heavy, generate three spring presets. Springs are
defined by stiffness + damping + mass (Bret Victor's *Inventing on Principle* lineage;
iOS UIView spring animations; Framer Motion's spring API). The key property cubic-beziers
*don't* have: **springs preserve user gesture velocity** — if the user flicks fast, the
spring overshoots; if they nudge gently, it settles.

```css
:root {
  /* Spring presets (used for gesture-driven UI: drag, swipe, flick) */
  --spring-stiff:   stiffness 300, damping 30, mass 1;   /* snap-back, decisive */
  --spring-medium:  stiffness 170, damping 26, mass 1;   /* default; iOS-like */
  --spring-wobbly:  stiffness 100, damping 10, mass 1;   /* playful overshoot */
}
```

CSS doesn't natively support spring physics yet (Linear-easing-function with
`linear(...)` lets you approximate; CSS spring() is proposed). For the showcase, generate
a JS-driven spring playground (a draggable element that demonstrates each preset) and
emit the spring parameters as design-token comments. Downstream implementation (React
Spring / Framer Motion / SwiftUI / Compose) reads the parameters.

Skip Phase 5 entirely if the product is desktop-only / non-gestural. Springs without a
gesture to honor are just bouncy easing curves — and `--motion-expressive` already does
that with less complexity.

See `references/spring-physics.md` for the full derivation.

### Phase 6: Define Disney-principle tokens for key interactions

Frank Thomas and Ollie Johnston's *Illusion of Life* (1981) gave animation a vocabulary
of 12 principles. Five of them map cleanly to UI:

| Principle | UI token | What it does |
|---|---|---|
| Squash & Stretch | `--squash-on-press` | Button compresses on press (scale 0.96), springs back |
| Anticipation | `--anticipation-flick` | Modal pulls back a hair before flying in (eases into negative space first) |
| Follow-through | `--follow-through-settle` | Animated element overshoots target by ~3%, settles to rest |
| Slow-in / Slow-out | `--motion-standard` (already covered) | Default easing; objects accelerate from rest, decelerate to rest |
| Secondary Action | `--secondary-glow` | When primary CTA activates, a secondary element (icon, label) animates ~80ms later |

These are *named patterns* downstream mocks can reference: a button's `:active` state
references `--squash-on-press`; a modal's entry references `--anticipation-flick`; a
success checkmark uses `--follow-through-settle`.

Generate the tokens; show them in the showcase as small toy demos a reviewer can trigger.

Skip principles that don't fit the attitude — a "Productive" / "Restrained" product
should probably ban squash-and-stretch entirely. Header comment names which principles
are locked vs which are deliberately rejected.

### Phase 7: Define the designed pause (ma / hold-beat)

Studio Ghibli's *ma* (間) — the active stillness *between* actions. Miyazaki demonstrated
this with a hand clap: "the time in between my clapping is *ma*." The pause focuses
attention; the action means more because the stillness frames it.

For complex multi-step transitions (modal entry → content load → first focusable
element receives focus), the designed pause is often more important than any of the
animated segments. Generate a hold-beat token:

```css
:root {
  --hold-beat: 250ms;   /* Designed stillness between segments of a complex transition */
}
```

Usage: between a modal's entry animation and the focus-ring appearing on its first input,
hold for `--hold-beat` (no motion). The pause says "the modal has arrived; here's the
focus." Skipping the pause makes the focus ring feel like it's running in parallel and
nothing settles.

Skip Phase 7 if the attitude is purely Kinetic — *ma* fights that aesthetic. Lock it in
for Calm / Cinematic / Restrained / Productive products.

### Phase 8: Define the stop-motion stepped channel (optional, attitude-dependent)

If the product's component aesthetic is `earthy/handcrafted` / `anti-AI handmade` /
`cozy-pixel` / `riso` — anything that wants to read as *touched* rather than rendered —
define a stepped-motion channel:

```css
:root {
  --stepped-12fps: steps(12, end);   /* Hand-keyed channel; deliberately not 60fps */
}
```

Used for specific elements (a hand-drawn SVG that "breathes," an illustration with
deliberate jitter, a loading sequence that wants Aardman/Laika texture). Most elements
still animate smoothly; the stepped channel is an *opt-in* per element.

Skip Phase 8 entirely for slick/digital aesthetic products. Adding `--stepped-12fps` to
a clean SaaS product just makes the motion look broken.

### Phase 9: Write motion.css

Write `.mockups/design-system/motion.css` per the structure in
`references/motion-css-template.md`. Key rules:

- **Header comment** declares attitude, locked durations, locked easing names, included
  principles, included optional channels (springs / hold-beat / stepped). Refinement
  reads this comment.
- **The Doherty invariant** is a comment in the file, not an enforced rule (CSS can't
  enforce it). The check moves to the showcase: every motion declares its class.
- **prefers-reduced-motion** must be respected. Every animated property has a
  reduced-motion fallback that either uses `--dur-instant` or skips animation entirely.
- **Tokens-only durations and curves.** Downstream mocks should never inline
  `transition: opacity 200ms ease-out` — it should be
  `transition: opacity var(--dur-quick) var(--motion-standard)`.

```css
/* ============================================================
 * motion.css — Acme project motion system
 *
 * Generated: 2026-05-18
 * Depends on: tokens.css (must be linked before this file)
 * Composed against: components.css
 *
 * Attitude (locked):
 *   - Primary:   productive
 *   - Secondary: calm
 *
 * Doherty coupling (locked):
 *   --dur-instant 80ms / --dur-quick 240ms gate input
 *   --dur-ambient 600ms is BACKGROUND ONLY
 *
 * Easing curves (locked):
 *   --motion-emphasized, --motion-standard, --motion-productive,
 *   --motion-expressive, --motion-linear
 *
 * Disney principles (locked):
 *   --squash-on-press, --follow-through-settle
 *   (deliberately omitted: anticipation, secondary)
 *
 * Optional channels:
 *   Spring presets: (omitted — desktop-only product)
 *   Hold beat:      --hold-beat 250ms (Calm attitude)
 *   Stepped:        (omitted — slick aesthetic)
 * ============================================================ */
```

### Phase 10: Generate motion.html

Write the showcase per `references/showcase-page-template.md`. Structure:

- Top nav with anchor links to each section
- **Easing curves** section: each curve animates a 100×100 square sliding 300px on
  click. Click to play; click again to reset. Show the cubic-bezier coefficients as
  copyable code below.
- **Durations** section: same square animation, but the curve is fixed and the duration
  varies. Three demos: instant / quick / ambient. Each marked **input-gating** or
  **ambient** with a colored label.
- **Springs** section (if included): a draggable card that snaps back to center, one per
  preset. The user can fling it to feel the spring response.
- **Disney principles** section: small toy demos — a button you press to see squash; a
  modal trigger to see anticipation; a success-check to see follow-through.
- **Hold beat** section (if included): a 3-step modal sequence with the hold-beat
  toggle-able so reviewers can see WHY the pause matters (toggle off and feel it).
- **Stepped channel** section (if included): a hand-drawn SVG illustration animating
  smoothly vs stepped, side by side.
- **Reduced-motion preview**: a button that simulates `prefers-reduced-motion: reduce` by
  swapping every motion to `--dur-instant` and confirming the page is still usable.

The showcase is the **review artifact**. Reviewers play with it once and either sign off
or list specific tweaks ("the emphasized curve overshoots too much"). Don't generate
separate per-section files — one anchored page is what gets reviewed.

### Phase 11: Open and ask

Open the showcase:

```bash
xdg-open .mockups/design-system/motion.html 2>/dev/null & \
  || open .mockups/design-system/motion.html 2>/dev/null \
  || start "" .mockups/design-system/motion.html 2>/dev/null \
  || echo "file://$(pwd)/.mockups/design-system/motion.html"
```

Then ask via `structured question tool`:

```
Q: How does the motion system feel?
- Ship it — sign off, screens and flows can start using these tokens
- Tweak specific curves (specify which — emphasized too snappy, expressive needs more overshoot)
- Tweak durations (the input-gating budget feels wrong)
- Add a channel (springs, stepped, hold-beat) we skipped
- Rework the attitude — primary attitude pick was wrong
```

### Phase 12: Iterate or finalize

**Ship it:**
- Update the substrate item body (if applicable):
  ```markdown
  ## Mockups
  - Design system: `.mockups/design-system/`
    - Motion: locked 2026-05-18
    - Attitude: productive + calm
    - Includes: 5 named curves, 3 durations, hold-beat 250ms
    - Reduced-motion: required; every motion has a fallback
  ```
- `git add .mockups/design-system/motion.{html,css}`
- Tell the user `screens`, `components`, and `flows` will now inherit motion tokens
  automatically.

**Tweak curves / durations / springs:**
- Edit the affected sections in `motion.css`, regenerate the affected showcase sections,
  re-open. Re-run the Doherty-coupling check (any motion that gates input must be
  ≤300ms after the tweak).

**Add a channel:**
- Run a focused mini-Phase (5 / 7 / 8) for just the new channel; append to motion.css
  with header-comment update; append new showcase section; re-open.

**Rework the attitude:**
- Re-enter Phase 2 with the correction. Regenerate motion.css end-to-end (curves and
  durations both shift). The principles selection and channel selection should re-run
  because attitude drives them.

**Stop condition:** "ship it" or equivalent. Three rounds without convergence → flag
that the project's kinetic voice may be unclear and suggest revisiting `palette` /
`components` aesthetic poles, since motion attitude usually inherits from there.

## Hard rules motion enforces

These are non-negotiable. Refinement runs check them; showcase displays violations.

### Doherty input-gating ceiling

Any animation that blocks user input must fit in ≤300ms total (including delay).
Background/ambient motion can be longer because it doesn't gate input. Every motion in
the showcase declares its class. Refinement that pushes an input-gating motion past
300ms surfaces a warning.

### Pixar return-to-rest

Every motion declares a rest state. Infinite-loop motion is banned outside two explicit
cases:

1. **True indeterminate progress** — a spinner where the underlying operation has no
   known duration. Even then, prefer a determinate progress indicator when one is
   feasible.
2. **Designed ambient state** — a hero gradient drift, a peripheral indicator pulse.
   Explicitly marked `--motion-ambient` in the showcase with the loop nature called
   out.

Skeleton screens, success checkmarks, transition arrivals — none of these loop. They
arrive at rest and stay.

### 60fps performance constraint

Animations declare which CSS properties they animate. Default presets only animate
`transform`, `opacity`, and `filter` (compositor-cheap). Animating `width`, `top`,
`height`, `margin`, or any layout-thrashing property is allowed but flagged in the
showcase with a perf warning. Mock review checks this.

The 16.6ms per frame budget is a constraint, not a flavor. Apple ProMotion (120Hz) makes
it 8.3ms, which sharpens the rule.

### prefers-reduced-motion respect

Every motion has a reduced-motion fallback. Default fallback rules:

```css
@media (prefers-reduced-motion: reduce) {
  /* Replace --dur-quick and --dur-ambient with --dur-instant */
  /* Or remove the transition entirely for purely decorative motion */
}
```

The showcase has a toggle to preview the reduced-motion mode. If a motion still feels
broken under reduced-motion (e.g., a modal that's only navigable through its entry
animation), the design has an accessibility bug and the showcase flags it.

### Lottie / AHAP as shipped artifact

For complex motion (a multi-element success sequence, a brand-mark animation, a
non-trivial illustration loop), motion ships as a **file artifact** (Lottie JSON, AHAP
for haptics) — not as prose telling an engineer what to rebuild. Airbnb's 2017 Lottie
pipeline established this: the After Effects export is the deliverable, not a
description of what AE produced.

`motion.css` covers token-driven CSS animation. For everything more complex than a
single transition, the design system docs include a `motion-artifacts/` directory with
the JSON files implementers consume directly.

## Refinement mode (existing motion.css present)

When `.mockups/design-system/motion.css` exists at invocation:

1. Read the header comment — note the locked attitude, durations, easing names,
   principles, optional channels.
2. Ask what to change:
   ```
   Q: What's the refinement?
   - Tweak a specific curve (specify which)
   - Tweak the duration scale (instant / quick / ambient values)
   - Add a missing channel (springs / hold-beat / stepped / Disney principle)
   - Remove a channel (we don't need this anymore)
   - Rework the attitude (primary pick was wrong)
   ```
3. Generate a focused before/after preview in `motion.html` for the proposed change —
   the existing curve animating side by side with the proposed one, so reviewers can
   feel the difference.
4. After approval, update `motion.css` (preserving the header comment, updating the
   date and changed fields).

Never overwrite `motion.css` in refinement mode without explicit user confirmation. The
header comment is the source of truth for what's locked.

## Integration with components, screens, and flows

Once `motion.css` exists, every mock should:

1. Link all three stylesheets in `<head>`:
   ```html
   <link rel="stylesheet" href="../../design-system/tokens.css">
   <link rel="stylesheet" href="../../design-system/components.css">
   <link rel="stylesheet" href="../../design-system/motion.css">
   ```
2. Reference motion tokens, never inline cubic-bezier or raw durations:
   ```css
   /* Good */
   .modal { transition: opacity var(--dur-quick) var(--motion-standard); }
   .btn:active { transform: var(--squash-on-press); }
   .toast { animation: slide-in var(--dur-quick) var(--motion-expressive); }

   /* Bad — inlines that drift from the system */
   .modal { transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1); }
   ```
3. Honor Doherty: motion that gates input uses `--dur-instant` or `--dur-quick`. Mocks
   that gate input on `--dur-ambient` are bugs.

This is the consistency mechanism. The `components` skill's button-state motion, the
`screens` skill's transition guidance, and the `flows` skill's between-page choreography
all read from one source.

## Anti-patterns

- **Don't pick all five easing curves at once.** Three is plenty for most products; the
  full five matter when the attitude pick is genuinely split (expressive AND productive
  for a SaaS that also has a marketing surface). Most products use `--motion-standard`
  for 80% of transitions.
- **Don't inline cubic-bezier coefficients.** If a downstream mock uses
  `cubic-bezier(0.4, 0, 0.2, 1)` instead of `var(--motion-standard)`, the system has
  drifted. Refinement adds tokens; it doesn't legitimize inlining.
- **Don't define springs without a gesture.** Springs are about preserving user
  velocity. A modal that "springs in" without any gesture is just expressive easing
  with extra steps. Save `--spring-*` for actual touch/drag interactions.
- **Don't ship a motion system without reduced-motion.** Roughly 35% of users have a
  vestibular sensitivity that benefits from reduced motion at some point. The fallback
  isn't optional polish — it's accessibility floor. The showcase's reduced-motion
  preview is the review gate.
- **Don't loop motion that should resolve.** Pixar's return-to-rest is the rule.
  Spinners that should be progress bars, skeleton breathe-forever animations that drown
  out the actual content arrival — these are bugs.
- **Don't ban `--stepped-12fps` and then animate hand-drawn SVGs anyway.** If the
  attitude rejects stop-motion texture, hand-drawn illustrations should be static
  (no animation), not animated smoothly. Smooth motion on a hand-keyed asset reads as
  "the illustrator and the engineer disagreed."
- **Don't skip the showcase**. Motion that hasn't been *felt* in a browser is motion that
  ships wrong. The showcase is the artifact reviewers play with; the .css is what
  implementers reference. Both matter.
- **Three rounds is the soft cap on iteration.** Looping a fourth time usually means the
  attitude wasn't pinned. Revisit Phase 2 rather than re-tweak coefficients.

## Reference files

- `references/motion-tokens.md` — the canonical motion-token vocabulary (easing names,
  durations, springs, principles, optional channels)
- `references/motion-css-template.md` — the `motion.css` file template with
  header-comment contract
- `references/showcase-page-template.md` — the `motion.html` interactive showcase
  template
- `references/easing-vocabulary.md` — the five named curves, their cubic-bezier
  derivations, per-attitude variants
- `references/spring-physics.md` — spring presets, stiffness/damping/mass derivation,
  CSS approximation patterns

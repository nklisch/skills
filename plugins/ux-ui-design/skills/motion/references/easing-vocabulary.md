# Easing vocabulary

The five named easing curves the motion skill ships, with attitude pairings, default
cubic-bezier coefficients, per-attitude variants, and the rationale behind each.

The names are stable; coefficients are tunable. Downstream mocks reference names. When
the system shifts character (Phase 2 attitude change in `motion`), only the coefficients
move — the name stays the same, so existing markup keeps working.

## The five curves

### `--motion-emphasized`

**Attitude:** Expressive / Cinematic.
**Default cubic-bezier:** `cubic-bezier(0.2, 0, 0, 1)`.
**Default duration partner:** `--dur-quick` (240ms) for in-app, `--dur-ambient` (600ms)
for marketing.
**When to use:** Major state changes — modal entries, screen transitions, sheet
arrivals, anything where the user's attention should move with the motion. The curve
starts slow (almost stops before moving), then accelerates sharply, then decelerates
smoothly to rest. Cinematic camera moves do this.
**Derivation:** Material 3's "emphasized" curve. The double-anchor at the start
(`0.2, 0`) creates a perceptible "wind-up" without being an explicit anticipation
animation. The flat end-control (`0, 1`) gives a deceleration that arrives definitively.

**Per-attitude variants:**

| If attitude is | Bias to | Coefficients |
|---|---|---|
| Expressive + Kinetic | More overshoot at end | `cubic-bezier(0.2, 0, 0, 1.15)` |
| Calm + Cinematic | Smoother both ends | `cubic-bezier(0.32, 0, 0.16, 1)` |
| Productive + Restrained | Reject — use --motion-standard instead | — |

### `--motion-standard`

**Attitude:** Productive / Calm (the default workhorse).
**Default cubic-bezier:** `cubic-bezier(0.4, 0, 0.2, 1)`.
**Default duration partner:** `--dur-quick` (240ms).
**When to use:** The default for most transitions — opacity fades, sub-component
appearances, color shifts, anything where "fast and competent" beats "emphatic." The
classic ease-in-out: gentle acceleration, balanced deceleration.
**Derivation:** Material 3's "standard" curve / iOS UIView's default for most
transitions. Symmetric-ish in feel; symmetric in time. The 0.4 start prevents a hard
snap-on-begin; the 0.2 end prevents a slow-creep-to-finish.

**Per-attitude variants:** None — this is the standard. If a project's tone needs a
non-standard "standard," the project should rename the token rather than redefine the
curve.

### `--motion-productive`

**Attitude:** Productive / Restrained.
**Default cubic-bezier:** `cubic-bezier(0.0, 0, 0.2, 1)` (also written `ease-out`).
**Default duration partner:** `--dur-instant` (80ms) for hover/press, `--dur-quick`
(240ms) for short transitions.
**When to use:** Snap-to-final motion — loading completions, form-state changes,
toggle-state arrivals. The user has acted; the system confirms. The curve starts at
full speed and decelerates — no ease-in, because the user's intent is already locked.
**Derivation:** Carbon Design System's "productive" curve. Pure decelerate-only.
Removes the rhetorical wind-up of `emphasized`; the result feels businesslike.

**Per-attitude variants:**

| If attitude is | Bias to | Coefficients |
|---|---|---|
| Productive + Restrained | Sharper landing | `cubic-bezier(0.0, 0, 0.1, 1)` |
| Calm | Smoother end | `cubic-bezier(0.0, 0, 0.4, 1)` |

### `--motion-expressive`

**Attitude:** Expressive / Kinetic / Playful.
**Default cubic-bezier:** `cubic-bezier(0.4, 0, 0.6, 1.4)`.
**Default duration partner:** `--dur-quick` (240ms) — and yes, the overshoot is *within*
the 300ms Doherty budget; the final 60-80ms is the overshoot settling.
**When to use:** Arrivals that should *land* — success states, hero entrances, key
moments where the motion is part of the brand voice. The curve overshoots the target
value (>1.0 end control) then settles back to it. Reads as "arrived with intent."
**Derivation:** Spring-curve approximation as a cubic-bezier. Real springs preserve user
velocity; this curve fakes that arrival energy without needing physics simulation. Good
for non-gesture-driven products.

**Per-attitude variants:**

| If attitude is | Bias to | Coefficients |
|---|---|---|
| Kinetic + Playful | More overshoot | `cubic-bezier(0.4, 0, 0.6, 1.7)` |
| Cinematic | Subtler overshoot | `cubic-bezier(0.4, 0, 0.6, 1.2)` |
| Productive + Restrained | Reject entirely | — |

If the product genuinely needs springiness on every interaction, springs are the right
tool — see `spring-physics.md`. `--motion-expressive` is the curve for *occasional*
playfulness in an otherwise-non-springy product.

### `--motion-linear`

**Attitude:** Always linear (deliberately attitude-less).
**Default cubic-bezier:** `linear`.
**Default duration partner:** Whatever the underlying operation demands (a progress bar
animating from 0 to 100% over 5s; a loader rotating at constant speed).
**When to use:** Anything where consistent rate-of-change is the point — progress
indicators, loaders, marquee scrolling, anything physics-defying. Cubic-beziers feel
wrong here because they imply acceleration that doesn't match the underlying state
change.
**Derivation:** Doesn't need one. `linear` is the floor; every easing function curves
away from it.

**Per-attitude variants:** None possible — linear is linear.

## Curve refinement strategies

When refinement mode is asked to tune a curve, the patterns that come up repeatedly:

### "The emphasized curve overshoots too much"

If the user's product is `Productive + Restrained` and `--motion-emphasized` overshoots
visibly, the attitude pick was probably wrong at Phase 2. Confirm before tweaking:

- Real fix: re-attribute the product as `Productive + Calm`, regenerate the curve as
  `cubic-bezier(0.32, 0, 0.16, 1)`. The name stays; the coefficients shift.
- Quick fix: keep the attitude, tweak the end-anchor from `0` to `0.2`. Loses some of
  the emphasized character.

### "The expressive curve is too bouncy" / "not bouncy enough"

Adjust the y-axis end control. The default `1.4` overshoots by ~10% of the animated
property's range. Each 0.1 step on the end control is ~3-5% perceived overshoot:

- `1.2` — subtle, almost imperceptible bounce
- `1.4` — default; clearly playful but not cartoonish
- `1.7` — kinetic; reads as energetic
- `2.0+` — usually wrong; consider springs instead

### "The standard curve feels slow"

If the user is referencing the *duration* not the *curve shape*, refine `--dur-quick`
not `--motion-standard`. The curve shape is fine; the duration was too long.

If the curve shape is actually the problem (and the duration is correct), bias toward
decelerate: `cubic-bezier(0.4, 0, 0.1, 1)`. The 0.1 end-control gets to the destination
faster but still smooth. Caution: deviating from the canonical Material/iOS curve makes
the product feel non-standard, which is sometimes the right move and sometimes
discordant.

### "Why isn't there an ease-in?"

Deliberately rare in UI. Ease-in (`cubic-bezier(0.4, 0, 1, 1)`) implies the user *will
keep watching* — the user is along for the ride. UI rarely earns this; user attention is
usually moving on as soon as the change registers. Exit animations (a modal closing, a
toast dismissing) are the right place for ease-in; that's why `motion.css` ships exit
animations with `--motion-emphasized` reversed in its keyframes, not a separate
`--motion-ease-in` token.

If a project genuinely needs ease-in routinely (an editorial product where transitions
ARE the content), refine with: add `--motion-deferred` with
`cubic-bezier(0.4, 0, 1, 1)`. Name carries the attitude.

## Coefficients reference (canonical sources)

| Source | Standard | Emphasized | Decel-only | Accel-only |
|---|---|---|---|---|
| Material 3 | `0.4, 0, 0.2, 1` | `0.2, 0, 0, 1` | `0.0, 0, 0.2, 1` | `0.3, 0, 1, 1` |
| iOS UIKit (default spring) | spring 0.6 damping | — | — | — |
| iOS HIG (UICubicTimingParameters defaults) | `0.42, 0, 0.58, 1` | — | `0.0, 0, 0.58, 1` | `0.42, 0, 1, 1` |
| Carbon Design System | `0.2, 0, 0.38, 0.9` (productive) | `0.4, 0.14, 0.3, 1` (expressive) | — | — |
| Apple visionOS | similar to iOS but stiffer for spatial | — | — | — |

Each system has its house style. The motion skill defaults to Material 3 because:
- It's the most widely understood and documented
- The "emphasized / standard / productive / expressive" attitude language is M3's
  contribution
- It composes cleanly with Carbon and iOS curves when projects need to honor a
  platform's expectation

Override defaults when the project explicitly says "this is an Apple app" (use iOS
curves) or "this is an IBM internal tool" (use Carbon curves).

## What this file is NOT

- **Not a tutorial on easing.** Curves are math; this file is the design system's
  shipping vocabulary. For a tutorial, point users at cubic-bezier.com.
- **Not a comprehensive list of every named curve.** Five is enough for nearly every
  product. Refinement adds the sixth (and seventh) only when downstream mocks genuinely
  need them.
- **Not a CSS animation guide.** This is the named-token tier; the composed-motion-
  patterns tier lives in `motion-css-template.md`.

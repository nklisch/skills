# Spring physics

When and how to define spring presets. The short answer: only when the product is
gesture-driven (touch-first, swipe-heavy, drag-heavy). Springs without a gesture to honor
are just bouncy easing curves, and `--motion-expressive` already covers that with less
implementation cost.

## Why springs matter (when they do)

Cubic-bezier curves are *time-parametric* — they describe how a value changes from A to
B over a fixed duration. They restart velocity at zero at the start of every transition.

Real springs are *physics-parametric* — they describe a system's response to force, and
they preserve velocity. If a user flicks a draggable card fast and releases, the spring
should continue that velocity into its overshoot before settling. If they release at
rest, the spring settles without overshoot.

This is the key property: **springs respond to how the user moved, not just whether the
user moved.** That's what makes iOS's flick-to-dismiss feel right and Android's
fling-scroll feel correct.

For non-gestural UI (most desktop apps, most form-driven SaaS), springs add complexity
without payoff. Pick `--motion-expressive` for "I want a little bounce" and move on.

## The three parameters

Springs are defined by three numbers (plus initial velocity, which comes from the user's
gesture):

```
stiffness — how strongly the spring pulls toward rest
damping   — how strongly velocity is resisted (friction)
mass      — the inertia of the object being moved
```

These compose:

- **High stiffness + high damping** = decisive snap, no overshoot. Use for "this thing
  must end up where I'm putting it" — pull-to-refresh release, drawer commit.
- **Medium stiffness + medium damping** = the iOS default — settles with a tiny visible
  overshoot. The "natural" feel.
- **Lower stiffness + lower damping** = wobble, multiple oscillations. Playful;
  occasionally appropriate; usually too much for product UI.

Mass is mostly used to slow the whole spring (lower stiffness with higher mass produces
a similar feel to medium stiffness alone, but more controllable). Most product systems
fix mass at 1.

## The three default presets

```
--spring-stiff:   stiffness: 300, damping: 30, mass: 1;
--spring-medium:  stiffness: 170, damping: 26, mass: 1;
--spring-wobbly:  stiffness: 100, damping: 10, mass: 1;
```

| Preset | Character | Use for |
|---|---|---|
| `stiff` | Snap-back, no visible overshoot, decisive | Pull-to-refresh release; drawer commit; modal dismiss-to-snap |
| `medium` | Default; subtle overshoot, settles in ~600ms | Drag-and-drop release; swipe-to-action commit; iOS sheet behavior |
| `wobbly` | Multi-oscillation; clearly playful | Decorative elements; toy/playful products; should be rare |

The naming follows React Spring's preset names and Framer Motion's character categories,
so cross-tool consumption is easy.

## CSS approximation: linear() function

CSS doesn't natively support spring physics. Two workarounds:

### Option A — `linear()` easing function (modern browsers)

Linear-easing-function (Chrome 113+, Firefox 112+, Safari 17+) lets you describe a curve
as a series of points. Spring trajectories can be approximated as ~30-50 control points:

```css
.spring-medium {
  /* Generated from a spring(170, 26, 1) physics simulation, sampled at 32 points */
  transition-timing-function: linear(
    0, 0.027 1.7%, 0.108 3.4%, 0.241 5.2%, 0.421 6.9%,
    0.643 8.7%, 0.890 10.5%, 1.149 12.3%, /* ... */
    0.985 80%, 1.001 90%, 1 100%
  );
  transition-duration: 600ms;
}
```

Generators like `easings.dev/spring-generator` produce these from spring params. The
motion skill's showcase can include pre-generated `linear()` strings for each preset.

### Option B — JS-driven simulation

For full fidelity (and gesture velocity preservation), spring tokens are passed to a JS
runtime (React Spring, Framer Motion, SwiftUI, Compose). The `motion.css` declares the
parameters; the runtime consumes them:

```css
/* In motion.css — parameters as CSS custom properties */
:root {
  --spring-medium-stiffness: 170;
  --spring-medium-damping: 26;
  --spring-medium-mass: 1;
}
```

```js
// In the runtime — read from CSS and pass to spring engine
const style = getComputedStyle(document.documentElement);
const spring = {
  stiffness: +style.getPropertyValue('--spring-medium-stiffness'),
  damping: +style.getPropertyValue('--spring-medium-damping'),
  mass: +style.getPropertyValue('--spring-medium-mass'),
};
```

This is the right path for production. The showcase demonstrates with a JS playground
(see `showcase-page-template.md`), but the design-system contract is parameters, not
code.

## The showcase demonstration

For the spring section of `motion.html`, ship a draggable card that snaps back per
preset. The user flings it; the spring engages with the release velocity.

Minimal JS spring loop (60Hz Hooke's-law update):

```js
function springSimulate(element, opts) {
  const { stiffness, damping, mass } = opts;
  let velocity = element.dataset.releaseVelocity || 0;
  let position = +element.dataset.x || 0;
  const rest = 0;
  const dt = 1/60;

  function frame() {
    const force = -stiffness * (position - rest);
    const friction = -damping * velocity;
    const accel = (force + friction) / mass;
    velocity += accel * dt;
    position += velocity * dt;
    element.style.transform = `translateX(${position}px)`;
    element.dataset.x = position;

    // Stop when both position and velocity are negligible
    if (Math.abs(position) < 0.1 && Math.abs(velocity) < 0.1) {
      element.style.transform = '';
      element.dataset.x = 0;
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
```

The drag handler captures the release velocity:

```js
let dragStartX, dragStartTime, lastX, lastTime;

card.addEventListener('pointerdown', e => {
  dragStartX = e.clientX;
  dragStartTime = performance.now();
  lastX = e.clientX;
  lastTime = dragStartTime;
});

card.addEventListener('pointermove', e => {
  if (e.buttons !== 1) return;
  const dx = e.clientX - dragStartX;
  card.style.transform = `translateX(${dx}px)`;
  card.dataset.x = dx;
  lastX = e.clientX;
  lastTime = performance.now();
});

card.addEventListener('pointerup', () => {
  const dt = performance.now() - lastTime;
  const velocity = (lastX - dragStartX) / dt;  // pixels per ms
  card.dataset.releaseVelocity = velocity * 1000;  // pixels per second
  springSimulate(card, springPreset);
});
```

This is the spring playground reviewers play with. The fling velocity feeds directly
into the simulation; reviewers feel the difference between presets.

## When to extend the preset list

The three defaults cover ~95% of needs. Extensions:

- **`--spring-snappy`** between `stiff` and `medium` for "feels decisive but with a
  hint of give" — useful for high-stakes commits where the spring shouldn't be
  invisible but shouldn't oscillate either. Params: stiffness 220, damping 28, mass 1.
- **`--spring-gentle`** below `wobbly` for fully-resolved oscillation without snap — a
  drawer that opens with a hand-off feel. Params: stiffness 60, damping 15, mass 1.

Avoid more than 5 spring presets — beyond that, the system gets harder to remember than
to redefine.

## Cross-tool parameter mapping

The motion skill's parameters compose into every major motion runtime:

| Tool | Stiffness | Damping | Mass | Notes |
|---|---|---|---|---|
| React Spring | `tension` | `friction` | `mass` | Same semantics, different name on first param |
| Framer Motion | `stiffness` | `damping` | `mass` | Identical |
| SwiftUI (`.spring(...)`) | `response` + `dampingFraction` | (derived) | (derived) | Reparameterized; conversion formula in Apple docs |
| Jetpack Compose (`spring()`) | `stiffness` | `dampingRatio` | (assumed) | dampingRatio is normalized (0-1); critical damping at 1.0 |
| iOS UIKit (`UISpringTimingParameters`) | `damping` + `initialVelocity` | — | `mass` | Pre-Catalyst, parameterized differently |

For SwiftUI's `response` parameter: `response = 2π * sqrt(mass / stiffness)`. For
`dampingFraction`: `dampingFraction = damping / (2 * sqrt(stiffness * mass))`. The
motion-skill defaults map to SwiftUI as:

- `stiff` (300, 30, 1) → response 0.36, dampingFraction 0.87
- `medium` (170, 26, 1) → response 0.48, dampingFraction 1.0 (critically damped — no overshoot)
- `wobbly` (100, 10, 1) → response 0.63, dampingFraction 0.5

Note: the iOS-default "feels like" is closer to `medium` with slight under-damping;
SwiftUI's defaults are critically damped (no overshoot). If a project's target platform
is iOS-first, the `medium` preset above produces *less* overshoot than `--motion-expressive`
on the cubic-bezier side. That's intentional — springs are subtle by default; you have to
ask for wobble.

## What this file is NOT

- **Not a derivation of harmonic motion.** Reach for a physics textbook for that.
- **Not a CSS-spring polyfill.** The motion skill ships parameters and a JS playground
  for the showcase; production-grade spring runtimes live in the project's downstream
  framework choice.
- **Not a replacement for the cubic-bezier curves.** Springs handle gestures; curves
  handle everything else. Both ship; they don't compete.

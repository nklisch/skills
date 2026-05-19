# Motion token vocabulary

The semantic CSS-variable vocabulary every project motion system defines. Small enough
to use, expressive enough to compose. Names describe **attitude** (`--motion-emphasized`)
or **role** (`--squash-on-press`), never coefficients (`--cubic-0-0-0-1`).

## Easing curves (the named-attitude tier)

```
--motion-emphasized  /* major state changes, modals, screen transitions */
--motion-standard    /* default workhorse; most transitions */
--motion-productive  /* snap-to-final; loading completions, form-state changes */
--motion-expressive  /* overshoot/playful arrival; success states, hero entrances */
--motion-linear      /* progress, loaders, anything physics-defying */
```

Each carries an attitude tag in the header comment. Downstream mocks reference the name;
the cubic-bezier coefficients are the system's, not the mock's, to know.

## Duration scale (Doherty-coupled)

```
--dur-instant: 80ms;    /* direct state changes; hover/pressed */
--dur-quick:   240ms;   /* input-gating transitions; ≤300ms ceiling */
--dur-ambient: 600ms;   /* background motion only; does NOT gate input */
```

The Doherty coupling is non-negotiable: any animation that blocks user input must fit
in `--dur-instant` or `--dur-quick`. Background/ambient motion (gradient drifts, peripheral
indicator pulses, skeleton breathes) is the only legitimate consumer of `--dur-ambient`.

When a mock's transition needs to be longer than 300ms *and* gates input, the design has
a Doherty-threshold bug. Either:
- Shorten to fit the budget
- Split into a sub-300ms entry transition + an ambient breathing state
- Use optimistic UI (let the user interact immediately while the longer transition
  completes in the background)

## Spring presets (gesture-driven products only)

```
--spring-stiff:   stiffness 300, damping 30, mass 1;
--spring-medium:  stiffness 170, damping 26, mass 1;   /* default; iOS-like */
--spring-wobbly:  stiffness 100, damping 10, mass 1;
```

CSS doesn't natively support spring physics yet. The tokens are parameters; downstream
implementations (React Spring, Framer Motion, SwiftUI, Compose) consume them directly.
For CSS-only mocks, use the linear-easing-function approximation (see
`spring-physics.md`).

Skip springs entirely for desktop-only / non-gestural products.

## Disney-principle tokens (five of the twelve)

```
--squash-on-press           /* scale(0.96) on press, springs back */
--anticipation-flick        /* pulls back into negative space before flying in */
--follow-through-settle     /* overshoots target by ~3%, settles to rest */
--motion-standard           /* slow-in / slow-out — already covered above */
--secondary-glow-delay      /* secondary action animates ~80ms after primary */
```

These are *named patterns* downstream mocks can reference. Not every product uses all
five; the header comment names which are locked and which are deliberately rejected.

A "Productive" / "Restrained" attitude usually rejects squash-and-stretch and
anticipation. An "Expressive" / "Kinetic" attitude usually adopts all five.

## Designed pause (ma / hold-beat)

```
--hold-beat: 250ms;   /* designed stillness between segments of a complex transition */
```

Usage: inside a multi-step transition (modal enters → content loads → focus ring
appears), insert `var(--hold-beat)` of no-motion between segments. The pause focuses
attention.

Skip for purely Kinetic attitudes (the pause fights the energy). Lock for Calm /
Cinematic / Restrained / Productive.

## Stepped channel (attitude-dependent)

```
--stepped-12fps: steps(12, end);   /* hand-keyed channel; deliberately not smooth */
```

Used for specific elements that want Aardman/Laika texture (hand-drawn SVGs, illustrations
with deliberate jitter). Most elements still animate smoothly; the stepped channel is an
opt-in.

Skip entirely for slick/digital aesthetic products. The channel is meaningless without
hand-keyed assets to apply it to.

## Reduced-motion fallback contract

Not a token per se, but a required behavior. Every motion in `motion.css` declares its
reduced-motion fallback:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-quick: 0ms;   /* or --dur-instant for state-clarity-critical motion */
    --dur-ambient: 0ms;
  }
  /* Plus per-element overrides for motion that's MORE than just a duration shift */
}
```

The fallback rule of thumb:
- **Decorative motion** (parallax, gradient drift, ambient pulse) ⇒ remove entirely
- **State-change motion** (modal entry, toast arrival) ⇒ swap to `--dur-instant` so the
  state change is still visible but doesn't move
- **Critical motion** (a transition the user navigates *through*, like a multi-step
  reveal where intermediate states aren't accessible) ⇒ redesign; this is an
  accessibility bug

## Naming principles

- **Attitude over coefficient.** `--motion-emphasized` not `--cubic-0.2-0-0-1`. The
  attitude survives a refinement that changes the coefficients; the name doesn't.
- **Role over duration.** `--dur-quick` describes its budget (sub-300ms input-gating),
  not its specific value. Refinement might change 240ms to 220ms; the role is stable.
- **Disney principles named, not numbered.** `--squash-on-press` not `--motion-1`. The
  pattern's intent is in the name; the value is its implementation.
- **Optional channels are explicit.** Springs / hold-beat / stepped tokens are
  *declared in the header comment* as included or omitted. Refinement that adds a channel
  documents it.

## When to extend

Add tokens when a downstream mock actually needs them, not speculatively. A 30-token
motion system is harder to use than a clean 10-token one. The above is the maximum
viable vocabulary; most projects use a subset.

Most common extensions:
- A second `--motion-emphasized-strong` for marketing-page hero entrances (longer,
  bigger overshoot) distinct from the in-app variant
- A `--dur-stagger: 80ms` if the project uses staggered list reveals heavily
- A `--motion-bounce` if the project rejects spring physics but wants playful arrival
  on specific elements

When in doubt, don't add — the next mock that genuinely needs the token will surface
the need cleanly.

# Design tokens — vocabularies for color, type, components, motion

The semantic CSS-variable vocabularies the ux-ui skill uses when
standardizing. Small enough to use, expressive enough to compose. Names
describe **role or attitude**, never appearance (`--color-accent`, not
`--color-blue`) — that's what lets a direction change without touching
markup. Define tokens when downstream mocks need them, not speculatively:
a clean 20-token set beats a 200-token one.

## Contents

- Color tokens
- Typography tokens
- Spacing, radius, elevation
- Component starter set
- Motion tokens
- The typographic-color squint check
- Contrast checks (non-negotiable)

---

## Color tokens

```css
--color-bg-primary        /* main surface */
--color-bg-secondary      /* raised surface (cards, modals) */
--color-bg-tertiary       /* nested raised (inputs, code blocks) */
--color-bg-inverse        /* contrasting surface for emphasis */
--color-text-primary      /* body text */
--color-text-secondary    /* muted (descriptions, captions) */
--color-text-tertiary     /* very muted (placeholder, disabled) */
--color-text-inverse      /* text on inverse surfaces */
--color-text-link         /* link */
--color-text-link-hover
--color-border            /* default border / divider */
--color-border-strong
--color-accent            /* primary brand color (CTAs, focus) */
--color-accent-hover
--color-accent-muted      /* accent at low saturation (selected bg) */
--color-success  --color-warning  --color-danger  --color-info
```

**Define light and dark values together, always.** Retrofitting dark mode
later is the most expensive mistake in token work — every contrast choice
has to be re-justified against a dark canvas. Pick the mechanism that fits:
`@media (prefers-color-scheme: dark)` for system-following,
`[data-theme="dark"]` for explicit toggling.

Data-viz products add a Bertin tier: categorical (Okabe-Ito is the safe
default), sequential (single-hue lightness ramp), diverging (two hues
meeting at a neutral midpoint).

## Typography tokens

```css
--font-sans      /* body stack, with full fallback chain */
--font-mono      /* code / data stack */
--font-serif     /* optional, editorial products */
--text-xs  --text-sm  --text-base  --text-lg
--text-xl  --text-2xl  --text-3xl  --text-display
--leading-tight  --leading-normal  --leading-loose
--weight-regular  --weight-medium  --weight-bold
```

Hosted faces (Google Fonts etc.) are fine when identity calls for one —
load via `<link>`, declare the fallback chain. System stacks are an equally
deliberate choice for "honest defaults" products. Don't reach for
Inter/Space Grotesk reflexively; that's the AI default.

## Spacing, radius, elevation

8pt baseline: `--space-1: 4px` through `--space-8: 64px` (4/8/12/16/24/32/48/64).
Radius scale `--radius-sm/md/lg/full`. Shadows as `--shadow-1/2/3` — or none,
for flat directions. Include these even when the user only picked colors;
downstream mocks need them and sane defaults beat ad-hoc values.

## Component starter set

When standardizing components, pick from the common set — everything else
is project-unique:

- **Actions:** `.btn` (+ `.btn-primary/.btn-secondary/.btn-ghost`,
  `--sm/--lg` size modifiers), `.btn-group`
- **Forms:** `.field` (label+input wrapper), `.input`, `.textarea`,
  `.select`, `.checkbox`, `.radio`, `.switch`
- **Surfaces:** `.card`, `.panel`, `.divider`
- **Feedback:** `.alert`, `.toast`, `.empty-state`
- **Navigation:** `.nav-bar`, `.tabs`, `.breadcrumb`, `.dropdown`/`.menu`
- **Data display:** `.table`, `.list`, `.badge`, `.tag`, `.avatar`
- **Overlays:** `.modal`, `.popover`, `.tooltip`, `.drawer`
- **Indicators:** `.spinner`, `.progress`, `.skeleton`

Naming: short semantic base classes, `--modifier` for size/state, suffix
classes for type variants. Every component defines its states: default,
hover, focus-visible, active, disabled, loading where relevant.

## Motion tokens

```css
/* Easing — named attitudes, never raw coefficients in markup */
--motion-emphasized   /* major state changes, modals, screen transitions */
--motion-standard     /* the workhorse; most transitions */
--motion-productive   /* snap-to-final; loading completions, form states */
--motion-expressive   /* overshoot arrival; success states, hero entrances */
--motion-linear       /* progress, loaders */

/* Duration — Doherty-coupled */
--dur-instant: 80ms;   /* hover/pressed, direct state changes */
--dur-quick:   240ms;  /* input-gating transitions; ≤300ms ceiling */
--dur-ambient: 600ms;  /* background motion only; never gates input */
```

Canonical defaults: emphasized `cubic-bezier(0.2, 0, 0, 1)`, standard
`cubic-bezier(0.2, 0, 0, 1)`-adjacent workhorse
(`cubic-bezier(0.4, 0, 0.2, 1)`), productive `cubic-bezier(0, 0, 0, 1)`,
expressive with slight overshoot (`cubic-bezier(0.2, 0, 0, 1.15)`).

Gesture-driven products add spring presets (stiffness/damping/mass, not
durations). Playful systems add Disney-principle tokens (`--squash-on-press`).
Contemplative systems add a designed pause (`--hold-beat: 400ms`).

**Hard rules:**
- **Input-gating ceiling.** Anything blocking input fits in ≤300ms total.
  Ambient motion can be longer because it doesn't gate input.
- **Return to rest.** No infinite loops except true indeterminate progress
  (spinner) or explicitly-marked ambient state. Everything else arrives at
  rest and stays.
- **Compositor-only defaults.** Animate `transform`, `opacity`, `filter`.
  Layout-thrashing properties (`width`, `top`, `margin`) get flagged.
- **Reduced motion, always.** Every motion has a
  `@media (prefers-reduced-motion: reduce)` fallback — `--dur-instant` or
  removed entirely for decorative motion. If a flow is only navigable
  through its animation, that's an accessibility bug.

## The typographic-color squint check

After rendering type options, squint at each sample paragraph. The text
block should read as a *uniform medium grey* — even "typographic color."
Dark patches mean line-height too tight or weight too heavy; light patches
mean the reverse. Adjust line-height ±0.05, weight ±50, or tracking
±0.005em until it reads evenly — before the user sees it.

## Contrast checks (non-negotiable)

Mocks set expectations; a palette that fails WCAG AA in a mock fails in
production. Check in both light and dark mode:

- text-primary on bg-primary — AA 4.5:1
- text-secondary on bg-primary — AA 4.5:1
- text-inverse on accent — AA 4.5:1
- accent on bg-primary (accent-as-text) — AA 4.5:1

Large text (≥18pt/14pt bold) relaxes to 3:1. Mark failures visibly. If
every direction fails, the color space is over-constrained — relax a
constraint (drop a brand-color requirement, desaturate the accent) rather
than shipping a failing pair.

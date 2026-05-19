# motion.css template

The structure every project's `motion.css` follows. Header comment is the
source-of-truth contract; refinement runs read it.

## File outline

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
 *   (deliberately omitted: anticipation, secondary-glow)
 *
 * Optional channels:
 *   Spring presets: (omitted — desktop-only product)
 *   Hold beat:      --hold-beat 250ms (Calm attitude)
 *   Stepped:        (omitted — slick aesthetic)
 *
 * Reduced-motion: respected; every motion has a fallback
 * ============================================================ */

:root {
  /* ---- Easing curves (named attitudes) ---- */
  --motion-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --motion-standard:   cubic-bezier(0.4, 0, 0.2, 1);
  --motion-productive: cubic-bezier(0.0, 0, 0.2, 1);
  --motion-expressive: cubic-bezier(0.4, 0, 0.6, 1.4);
  --motion-linear:     linear;

  /* ---- Durations (Doherty-coupled) ----
     INVARIANT: any transition that gates input MUST use --dur-instant
     or --dur-quick. Only background/ambient motion uses --dur-ambient. */
  --dur-instant: 80ms;
  --dur-quick:   240ms;
  --dur-ambient: 600ms;

  /* ---- Disney principles (those locked for this product) ---- */
  --squash-on-press: scale(0.96);
  --follow-through-overshoot: 1.03;      /* multiplier on target value */
  --follow-through-settle:    var(--dur-quick) var(--motion-expressive);

  /* ---- Hold beat (Ma) ---- */
  --hold-beat: 250ms;
}

/* ============================================================
 * Composed motion patterns
 *
 * These are the named "motion components" — reusable animation
 * definitions that compose tokens. Downstream mocks reference these
 * by class name, never re-implement them.
 * ============================================================ */

/* Button press (squash + return) */
.motion-press-feedback {
  transition: transform var(--dur-instant) var(--motion-productive);
}
.motion-press-feedback:active {
  transform: var(--squash-on-press);
}

/* Modal entry (anticipation + arrival) */
@keyframes motion-modal-in {
  0%   { opacity: 0; transform: scale(0.98) translateY(8px); }
  100% { opacity: 1; transform: scale(1)    translateY(0);   }
}
.motion-modal-enter {
  animation: motion-modal-in var(--dur-quick) var(--motion-emphasized) both;
}

/* Toast arrival (overshoot settle) */
@keyframes motion-toast-in {
  0%   { opacity: 0; transform: translateY(-12px); }
  60%  { opacity: 1; transform: translateY(2px);  }   /* overshoot */
  100% { opacity: 1; transform: translateY(0);    }   /* settle */
}
.motion-toast-enter {
  animation: motion-toast-in var(--dur-quick) var(--motion-expressive) both;
}

/* Ambient breathe (skeleton, peripheral indicator) */
@keyframes motion-breathe {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1;   }
}
.motion-breathe {
  animation: motion-breathe var(--dur-ambient) var(--motion-standard) infinite;
}

/* ============================================================
 * Reduced-motion fallbacks
 *
 * Per WCAG 2.3.3 (Animation from Interactions), Level AAA.
 * Roughly 35% of users benefit from reduced motion at some point;
 * vestibular disorders, attention disorders, and motion sickness
 * all read this preference.
 * ============================================================ */

@media (prefers-reduced-motion: reduce) {
  :root {
    /* Strip ambient motion entirely — decorative loops are pure cost */
    --dur-ambient: 0ms;

    /* Compress input-gating motion to instant — preserves state-change
       visibility (the modal still appears) without movement */
    --dur-quick: var(--dur-instant);

    /* Linearize easing — bouncy / overshoot curves are exactly what
       reduced-motion users want to avoid */
    --motion-emphasized: linear;
    --motion-expressive: linear;
  }

  /* Hard-stop ambient animations (the :root var change handles duration,
     but `animation-iteration-count: infinite` still runs zero-duration
     loops infinitely, which can hot-spot the CPU on some browsers). */
  .motion-breathe { animation: none; opacity: 1; }

  /* Disable squash entirely — micro-movement on press is unnecessary
     when reduced motion is requested */
  .motion-press-feedback:active { transform: none; }
}
```

## Header comment contract

The header comment is parsed (loosely) by `motion` refinement mode to know what's locked.
Always include these fields:

| Field | Purpose |
|---|---|
| `Generated:` | ISO date of last write — bump on every change |
| `Depends on:` | Always `tokens.css` |
| `Composed against:` | `components.css` when it exists; informs the showcase |
| `Attitude:` | Primary + secondary attitude from Phase 2 |
| `Doherty coupling:` | Restates the invariant; refinement can change values but not the rule |
| `Easing curves:` | Which named curves are locked |
| `Disney principles:` | Which are locked AND which are deliberately omitted |
| `Optional channels:` | Springs / hold-beat / stepped — each marked locked, omitted, or value |
| `Reduced-motion:` | Always "respected" — the fallback is non-optional |

Never delete fields; if a channel is omitted, list it with `(omitted — reason)`.
Refinement reads this comment to decide what's already locked vs what's being added.

## Token-only durations and curves

Every transition and animation value should be a `var(--token)` reference. The only
acceptable literals:

- `0ms` / `none` for explicit disables
- Animation keyframe percentages (`50%`)
- Values inside `@keyframes` rules (transforms, opacities — these compose tokens
  conceptually but can't always reference them syntactically)

If a needed token isn't in `motion.css`:
- Quick path: inline with `/* TODO: add --token-name to motion.css */`
- Right path: invoke `motion` in refinement mode to add the token first

## When the project has no `components.css` yet

If `motion` runs standalone (before `components` has produced `components.css`), the
composed-pattern classes (`.motion-press-feedback`, `.motion-modal-enter` etc.) still
work — they just won't be applied to anything yet. The showcase uses minimal example
elements (a square that scales, a card that slides) to demonstrate motion without needing
the project's real components.

When `components` runs later, the component classes adopt motion classes via composition
(`<button class="btn btn-primary motion-press-feedback">`) — no changes needed to
`motion.css`.

## Section structure

The file flows in this order:

1. Header comment with the contract
2. `:root` block — all token variables
3. Composed motion patterns (each named `.motion-*` class is a reusable animation)
4. `@media (prefers-reduced-motion: reduce)` block — the fallback contract

Composed patterns are grouped by interaction type: presses, entries, exits, arrivals,
ambient. Within each group, common-first then specific.

## What this file is NOT

- **Not a list of every possible animation.** Composed patterns are the named, reusable
  ones. One-off animations for unique screens belong in the screen's mock, referencing
  motion tokens. The motion system is the vocabulary, not the dictionary of every
  possible sentence.
- **Not a JS framework.** Motion CSS is for transitions and CSS animations. Springs and
  complex interactions are documented as token parameters consumed by downstream JS
  (React Spring, Framer Motion). The motion system declares; the framework implements.
- **Not the haptics or sound layer.** Those belong in a future `sensory` skill. Motion
  is visual + temporal only.

# components.css template

The structure every project's `components.css` follows. Header comment is
the source-of-truth contract; refinement runs read it.

## File outline

```css
/* ============================================================
 * components.css — Acme project component library
 *
 * Generated: 2026-05-15
 * Depends on: tokens.css (must be linked before this file)
 *
 * Aesthetic decisions (locked):
 *   - Depth:   subtle (1px borders + small shadows on raised)
 *   - Corners: soft (8px default radius)
 *   - Density: generous (16px base padding, 44px hit targets)
 *
 * Common components (locked):
 *   Actions:     btn, btn-group
 *   Forms:       field, input, textarea, select, checkbox, radio, switch
 *   Surfaces:    card, panel, divider
 *   Feedback:    alert, toast, empty-state
 *   Navigation:  nav-bar, tabs, breadcrumb, dropdown, menu
 *   Data:        badge, avatar
 *   Overlays:    modal
 *
 * Project-unique components (locked):
 *   - metric-tile — KPI tile for dashboard surfaces
 *   - account-row — list-item shape used in account listings
 * ============================================================ */

/* ---- Reset (minimal, mock-friendly) ---- */
*, *::before, *::after { box-sizing: border-box; }
button { font: inherit; cursor: pointer; }

/* ============================================================
 * Actions
 * ============================================================ */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: var(--font-weight-medium) var(--font-size-base)/1 var(--font-sans);
  text-decoration: none;
  transition: background-color 120ms, border-color 120ms;
}
.btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.btn:disabled, .btn[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.btn-primary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}
.btn-ghost {
  background: transparent;
  color: var(--color-text-primary);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--color-bg-secondary);
}
.btn-danger {
  background: var(--color-danger);
  color: var(--color-text-inverse);
}

/* Sizes */
.btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-sm); }
.btn--lg { padding: var(--space-3) var(--space-6); font-size: var(--font-size-lg); }

/* Modifiers */
.btn--icon-only { padding: var(--space-2); aspect-ratio: 1; }
.btn--loading { position: relative; color: transparent; }
.btn--loading::after {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 16px; height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 600ms linear infinite;
  color: var(--color-text-inverse);
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ============================================================
 * Forms
 * ============================================================ */

.field { display: flex; flex-direction: column; gap: var(--space-2); }
.field__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}
.field__helper {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0;
}
.field__error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  margin: 0;
}
.field--error .input,
.field--error .textarea,
.field--error .select {
  border-color: var(--color-danger);
}

.input, .textarea, .select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font: var(--font-size-base)/1.4 var(--font-sans);
}
.input:focus, .textarea:focus, .select:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -1px;
  border-color: var(--color-accent);
}
.input:disabled, .textarea:disabled, .select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ... continue with each component group ... */

/* ============================================================
 * Project-unique
 * ============================================================ */

.metric-tile {
  /* The KPI tile shape unique to this project's dashboard */
}
```

## Header comment contract

The header comment is parsed (loosely) by `components` refinement mode to
know what's locked. Always include these fields:

| Field | Purpose |
|---|---|
| `Generated:` | ISO date of last write — bump on every change |
| `Depends on:` | Always `tokens.css` — components compose from tokens |
| `Aesthetic decisions:` | Depth / Corners / Density choices from Phase 4 |
| `Common components:` | The Phase 2 starter set, grouped by category |
| `Project-unique components:` | The Phase 3 list with one-line purpose |

Never delete fields; if a category has no components, list it with
`(none)`. Refinement mode reads this comment to decide what's
already locked vs what's being added.

## Section structure

Each section follows the same shape:

1. Section header comment with the category name
2. Base class for the primary component (`.btn`)
3. Pseudo-class states (`:hover`, `:focus-visible`, `:active`, `:disabled`)
4. Variant classes (`.btn-primary`, `.btn-secondary`)
5. Size modifiers (`.btn--sm`, `.btn--lg`)
6. Behavior modifiers (`.btn--loading`, `.btn--icon-only`)
7. Sub-component classes (`.btn-group`)

Order matters for cascade: base before variants before modifiers. This
lets a downstream mock add a one-off override without specificity wars.

## Naming convention

- **Base class:** short noun (`.btn`, `.card`, `.input`)
- **Type variant:** suffix (`.btn-primary`, `.alert-warning`)
- **Size/state modifier:** double-dash (`.btn--sm`, `.alert--dismissible`)
- **Sub-part:** double-underscore (`.card__header`, `.field__label`)

This is BEM-light. The full BEM rule of "every element gets a class" is
relaxed — semantic HTML elements (`<header>`, `<footer>`) inside a
component can be styled via descendant selectors when it doesn't cause
specificity problems. Keep it pragmatic.

## Token-only values

Every color, spacing, font, and radius value should be a `var(--token)`
reference. The only acceptable literals:

- `1px` for hairline borders
- `0`, `auto`, percentages
- Transitions / animations / transforms that don't have a token

If a needed token isn't in `tokens.css`:
- Quick path: inline with a `/* TODO: add to tokens.css */` comment
- Right path: delegate to `palette` refinement mode to add the token,
  then come back

## Dark mode

Components don't define their own light/dark values — they inherit from
`tokens.css`. The dark-mode mechanism (`prefers-color-scheme` or
`[data-theme="dark"]`) is chosen in `palette`; components just use
the semantic tokens and inherit the switch automatically.

The only dark-mode work in `components.css` is for shadows: shadows on
dark backgrounds need different intensity. Use a token for shadow if
the project has heavy shadow usage:

```css
:root { --shadow-raised: 0 2px 8px rgb(0 0 0 / 0.08); }
[data-theme="dark"] { --shadow-raised: 0 2px 8px rgb(0 0 0 / 0.4); }

.card--raised { box-shadow: var(--shadow-raised); }
```

If shadow tokens aren't yet in `tokens.css`, this is a good case for
`palette` refinement to add them.

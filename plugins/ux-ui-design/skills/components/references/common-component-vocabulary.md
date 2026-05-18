# Common component vocabulary

The canonical list of common UI components every project may need. For each
component: what it does, what states/variants it must define, and the default
HTML pattern to mock. Pick from this list in Phase 2; everything else is
project-unique (Phase 3).

Class naming: short and semantic. Base class with modifier double-dash for
size/state variants (`.btn--lg`); separate suffix class for type variants
(`.btn-primary`).

## Actions

### `.btn` — button

States: default, `:hover`, `:focus-visible`, `:active`, `:disabled`
Variants: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`
Sizes: `.btn--sm`, `.btn--md` (default), `.btn--lg`
Modifiers: `.btn--icon-only`, `.btn--loading` (shows spinner)

```html
<button class="btn btn-primary">Save changes</button>
<button class="btn btn-secondary btn--sm">Cancel</button>
<button class="btn btn-ghost btn--icon-only" aria-label="More">⋯</button>
```

### `.btn-group` — segmented buttons

States: items can be `aria-pressed="true"` for selected.

```html
<div class="btn-group" role="group">
  <button class="btn btn-secondary" aria-pressed="true">Day</button>
  <button class="btn btn-secondary">Week</button>
  <button class="btn btn-secondary">Month</button>
</div>
```

## Forms

### `.field` — labeled-input wrapper

The wrapper carries the label / helper-text / error-text layout. Inputs go
inside.

```html
<div class="field">
  <label class="field__label" for="email">Email</label>
  <input class="input" id="email" type="email">
  <p class="field__helper">We never share your email.</p>
</div>

<div class="field field--error">
  <label class="field__label" for="pw">Password</label>
  <input class="input" id="pw" type="password" aria-invalid="true">
  <p class="field__error">Password must be at least 8 characters.</p>
</div>
```

### `.input` — text input

States: default, `:focus`, `:disabled`, `[aria-invalid="true"]` (error)
Types: works with `text`, `email`, `password`, `number`, `search`, `tel`, `url`

### `.textarea` — multiline input

Same states as `.input`. Set `rows` attribute for default height.

### `.select` — dropdown native select

States: default, `:focus`, `:disabled`, `[aria-invalid="true"]`
Renders the native control with custom chrome (arrow icon, padding,
border-radius). Don't reinvent the popover — let the OS handle it.

### `.checkbox` and `.radio`

States: unchecked, checked, indeterminate (checkbox), `:focus-visible`,
`:disabled`. Use the native input + custom indicator via `:checked` selectors.

```html
<label class="checkbox">
  <input type="checkbox">
  <span class="checkbox__indicator"></span>
  <span class="checkbox__label">Remember me</span>
</label>
```

### `.switch` — toggle

Two states: off / on. Same accessibility shape as a checkbox (uses
`<input type="checkbox" role="switch">`).

## Surfaces

### `.card` — content container

Variants: default (flat), `.card--raised` (shadow), `.card--interactive`
(hover state, used when the whole card is clickable).

```html
<article class="card">
  <header class="card__header">
    <h3>Card title</h3>
  </header>
  <div class="card__body">Card content.</div>
  <footer class="card__footer">Optional footer.</footer>
</article>
```

### `.divider` — horizontal/vertical rule

Use instead of inline `<hr>` styling. Variants: `.divider--vertical`.

### `.panel` — grouped section within a page

Lighter than a card — no shadow by default; uses border only. Used for
inset content on a settings page or sidebar section.

## Feedback

### `.alert` / `.toast` — status messages

`.alert` is inline (in-page); `.toast` is overlay (stacked top-right or
bottom-right). Both share variants.

Variants: `.alert--info`, `.alert--success`, `.alert--warning`,
`.alert--danger`
Modifiers: `.alert--dismissible` (adds close button), `.alert--with-action`
(includes a CTA button)

```html
<div class="alert alert--warning alert--dismissible" role="alert">
  <strong>Heads up:</strong> Your subscription expires in 3 days.
  <button class="alert__close" aria-label="Dismiss">×</button>
</div>
```

### `.empty-state` — zero-data placeholder

The illustration / icon + heading + body + CTA pattern for "nothing here
yet" surfaces.

```html
<div class="empty-state">
  <div class="empty-state__icon">📭</div>
  <h3 class="empty-state__title">No messages yet</h3>
  <p class="empty-state__body">Messages will appear here when you receive them.</p>
  <button class="btn btn-primary">Start a conversation</button>
</div>
```

## Navigation

### `.nav-bar` — top or side persistent navigation

Variants: `.nav-bar--top` (horizontal), `.nav-bar--side` (vertical).
States on items: default, `:hover`, `.nav-bar__item--active` (current page).

```html
<nav class="nav-bar nav-bar--top">
  <a href="#" class="nav-bar__brand">Acme</a>
  <ul class="nav-bar__items">
    <li><a href="#" class="nav-bar__item nav-bar__item--active">Dashboard</a></li>
    <li><a href="#" class="nav-bar__item">Settings</a></li>
    <li><a href="#" class="nav-bar__item">Account</a></li>
  </ul>
</nav>
```

This component is what hub-and-spoke flows use for their persistent chrome.

### `.tabs` — section switcher

States on tabs: default, `:hover`, `.tabs__tab--active`.

```html
<div class="tabs">
  <button class="tabs__tab tabs__tab--active">Profile</button>
  <button class="tabs__tab">Security</button>
  <button class="tabs__tab">Billing</button>
</div>
<div class="tabs__panel">...</div>
```

### `.breadcrumb` — hierarchical trail

```html
<nav class="breadcrumb">
  <a href="#" class="breadcrumb__item">Account</a>
  <span class="breadcrumb__sep">/</span>
  <a href="#" class="breadcrumb__item">Settings</a>
  <span class="breadcrumb__sep">/</span>
  <span class="breadcrumb__item breadcrumb__item--current">Email preferences</span>
</nav>
```

### `.dropdown` / `.menu` — popover menu

States: closed (no DOM or `hidden`), open. Items support `.menu__item--danger`
for destructive actions.

```html
<div class="dropdown">
  <button class="btn btn-secondary" aria-haspopup="menu" aria-expanded="false">
    Actions ▾
  </button>
  <ul class="menu" role="menu" hidden>
    <li><button class="menu__item" role="menuitem">Edit</button></li>
    <li><button class="menu__item" role="menuitem">Duplicate</button></li>
    <li><hr class="menu__divider"></li>
    <li><button class="menu__item menu__item--danger" role="menuitem">Delete</button></li>
  </ul>
</div>
```

JS for open/close is OK to include inline in mocks — keep it small.

## Data display

### `.table` — data table

Modifiers: `.table--striped`, `.table--bordered`, `.table--compact`.

### `.list` — vertical list

Variants: `.list--bordered` (dividers between items), `.list--interactive`
(items have hover state).

### `.badge` / `.tag` / `.pill`

Small inline status/category labels. All three share the same shape; pick
the name that fits the project's voice:
- `.badge` — small counter or status (e.g., notification count)
- `.tag` — categorical label, often removable
- `.pill` — fully rounded badge/tag

Variants: `.badge--info`, `.badge--success`, `.badge--warning`,
`.badge--danger`.

### `.avatar` — user image

Sizes: `.avatar--sm`, `.avatar--md`, `.avatar--lg`. Fallback to initials when
no image. Modifier: `.avatar--group` (overlapping stack).

## Overlays

### `.modal` / `.dialog`

States: closed (no DOM), open. Anatomy: header / body / footer +
dismissible close button. Backdrop is part of the modal.

```html
<div class="modal" role="dialog" aria-modal="true">
  <div class="modal__backdrop"></div>
  <div class="modal__panel">
    <header class="modal__header">
      <h2>Confirm deletion</h2>
      <button class="modal__close" aria-label="Close">×</button>
    </header>
    <div class="modal__body">This can't be undone.</div>
    <footer class="modal__footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-danger">Delete</button>
    </footer>
  </div>
</div>
```

### `.popover` — anchored floating panel

Similar to dropdown but for arbitrary content (not just a menu of items).

### `.tooltip`

Small contextual hint on hover/focus. CSS-only is preferred (pure
`:hover` + sibling selector) — keep simple in mocks.

### `.drawer` — slide-in panel

Variants: `.drawer--right`, `.drawer--left`, `.drawer--bottom`. Used for
mobile-friendly side panels.

## Indicators

### `.spinner` — loading indicator

Sizes: `.spinner--sm`, `.spinner--md`, `.spinner--lg`. CSS animation only.

### `.progress` — progress bar

States: determinate (with `--value`), indeterminate (animated).

```html
<div class="progress" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
  <div class="progress__bar" style="--value: 40%"></div>
</div>
```

### `.skeleton` — loading placeholder

Variants: `.skeleton--text`, `.skeleton--circle`, `.skeleton--block`. Used
in place of content while loading.

## What this list intentionally excludes

These belong in `screens` or are project-unique:
- Hero sections, page layouts, dashboards — those are compositions
- Charts and data visualizations — too project-specific to standardize here
- Carousels, image galleries — usually feature-specific
- Date pickers, file uploaders, rich-text editors — usually wrapping a
  third-party library in production; mock as needed per-screen

When in doubt: if it appears on **one specific page**, it's a `screens`
concern. If it appears on **many pages with identical behavior**, it's
a `components` concern.

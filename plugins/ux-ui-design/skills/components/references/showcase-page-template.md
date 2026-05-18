# components.html showcase template

The single anchored page that previews every component in every state.
This IS the review artifact for the `components` skill — reviewers scan
through and either sign off or list specific tweaks.

## Outer shape

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Acme — Component library</title>
  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="components.css">
  <style>
    /* Showcase-page chrome only. NOT component styles. */
    body { font-family: var(--font-sans); background: var(--color-bg-primary); color: var(--color-text-primary); margin: 0; }
    .showcase-nav {
      position: sticky; top: 0; z-index: 10;
      background: var(--color-bg-secondary);
      border-bottom: 1px solid var(--color-border);
      padding: var(--space-3) var(--space-6);
      display: flex; gap: var(--space-4); flex-wrap: wrap;
      align-items: center;
    }
    .showcase-nav a {
      color: var(--color-text-link);
      text-decoration: none;
      font-size: var(--font-size-sm);
    }
    .showcase-nav a:hover { text-decoration: underline; }
    .showcase-section { padding: var(--space-8) var(--space-6); border-bottom: 1px solid var(--color-border); }
    .showcase-section h2 { font-size: var(--font-size-2xl); margin: 0 0 var(--space-2); }
    .showcase-section > p { color: var(--color-text-secondary); margin: 0 0 var(--space-6); }
    .showcase-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-6);
    }
    .showcase-cell {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-3);
    }
    .showcase-cell h3 { font-size: var(--font-size-sm); margin: 0; color: var(--color-text-secondary); font-weight: var(--font-weight-medium); }
    .showcase-cell .demo { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; padding: var(--space-3); background: var(--color-bg-primary); border-radius: var(--radius-sm); }
    .showcase-cell pre {
      margin: 0;
      padding: var(--space-2) var(--space-3);
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
      border-radius: var(--radius-sm);
      font: var(--font-size-xs)/1.5 var(--font-mono);
      overflow-x: auto;
    }
    .theme-toggle {
      margin-left: auto;
      padding: var(--space-1) var(--space-3);
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text-primary);
      font: var(--font-size-sm) var(--font-sans);
      cursor: pointer;
    }
  </style>
</head>
<body>
  <nav class="showcase-nav">
    <strong>Components</strong>
    <a href="#actions">Actions</a>
    <a href="#forms">Forms</a>
    <a href="#surfaces">Surfaces</a>
    <a href="#feedback">Feedback</a>
    <a href="#navigation">Navigation</a>
    <a href="#data">Data</a>
    <a href="#overlays">Overlays</a>
    <a href="#unique">Project-unique</a>
    <button class="theme-toggle" onclick="document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'">
      🌓 Toggle theme
    </button>
  </nav>

  <section id="actions" class="showcase-section">
    <h2>Actions</h2>
    <p>Buttons, button groups, action-triggering elements.</p>
    <div class="showcase-grid">
      <!-- one .showcase-cell per component group -->
    </div>
  </section>

  <!-- repeat per section -->

  <script>
    // Optional: open dropdowns on click for the menu demo, copy-to-clipboard
    // on pre clicks, etc. Keep small.
  </script>
</body>
</html>
```

## Showcase cell pattern

Each cell shows one component variant or state group, plus the HTML
snippet a reviewer or implementer can copy:

```html
<div class="showcase-cell">
  <h3>Primary button — all states</h3>
  <div class="demo">
    <button class="btn btn-primary">Default</button>
    <button class="btn btn-primary" data-state="hover">Hover</button>
    <button class="btn btn-primary" data-state="focus">Focus</button>
    <button class="btn btn-primary" disabled>Disabled</button>
  </div>
  <pre>&lt;button class="btn btn-primary"&gt;Save&lt;/button&gt;</pre>
</div>
```

For pseudo-class states (`:hover`, `:focus-visible`) that don't trigger
without interaction, add CSS that mirrors the state when `data-state`
matches:

```css
.demo .btn[data-state="hover"] { /* same rules as .btn:hover */ }
.demo .btn[data-state="focus"] { /* same rules as .btn:focus-visible */ }
```

This is the only place where states are "fake-rendered" — reviewers
need to see what hover/focus look like without manually triggering them.

## Section grouping

Always include these sections in this order (skip any whose components
weren't selected in Phase 2):

1. **Actions** — buttons, button groups
2. **Forms** — fields, inputs, selects, checkboxes, radios, switches
3. **Surfaces** — cards, panels, dividers
4. **Feedback** — alerts, toasts, empty states
5. **Navigation** — nav-bar, tabs, breadcrumb, dropdowns, menus
6. **Data display** — tables, lists, badges, tags, avatars
7. **Overlays** — modals, popovers, tooltips, drawers
8. **Indicators** — spinners, progress, skeletons
9. **Project-unique** — every Phase 3 component, named and explained

The project-unique section gets extra prose: each component shows its
name, purpose, anatomy, and at least one full example. These are the
components that don't have a generic mental model, so document them
clearly.

## State-grid pattern for variant-heavy components

When a component has many variants × states (buttons especially), use a
state grid:

```html
<div class="showcase-cell">
  <h3>Button matrix — variants × sizes</h3>
  <div class="demo" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2);">
    <button class="btn btn-primary btn--sm">SM</button>
    <button class="btn btn-secondary btn--sm">SM</button>
    <button class="btn btn-ghost btn--sm">SM</button>
    <button class="btn btn-danger btn--sm">SM</button>
    <button class="btn btn-primary">MD</button>
    <button class="btn btn-secondary">MD</button>
    <button class="btn btn-ghost">MD</button>
    <button class="btn btn-danger">MD</button>
    <button class="btn btn-primary btn--lg">LG</button>
    <button class="btn btn-secondary btn--lg">LG</button>
    <button class="btn btn-ghost btn--lg">LG</button>
    <button class="btn btn-danger btn--lg">LG</button>
  </div>
</div>
```

## Theme toggle

If `tokens.css` uses `[data-theme="dark"]` for dark mode, include the
toggle button (shown in the outer shape above). If it uses
`@media (prefers-color-scheme: dark)`, the toggle is moot — note in the
nav: "Switch your OS theme to preview dark mode."

## Anti-patterns for the showcase page

- **Don't restyle components in the showcase CSS.** The showcase
  styles only the showcase chrome (nav, grid, cells). Components style
  themselves from `components.css`. If the showcase needs an override,
  the component is wrong.
- **Don't lazy-load or hide variants.** Every component, every state,
  on one scrollable page. The whole point is at-a-glance review.
- **Don't fake interactions with JavaScript.** Real native interactions
  (modal open/close, dropdown toggle) are fine and useful. Faking
  `:hover` with JS isn't — use the `data-state` CSS-mirror pattern
  instead.
- **Don't forget the HTML snippet.** The `<pre>` block is the
  implementer's copy-paste source. Skipping it forces them to view-source
  on the demo cell.

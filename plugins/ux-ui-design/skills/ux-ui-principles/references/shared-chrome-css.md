# Shared chrome CSS

Reusable styles and HTML patterns that `screens`, `flows`, and `palette` all
need. Citing this reference instead of re-implementing inline keeps each
SKILL.md focused on what's distinct about its task.

## The `.mock-meta` header (per-option label strip)

A thin top strip on each individual mockup that names the option and carries
a one-line rationale. Lives at the top of every `option-N.html` in `screens`.

```html
<header class="mock-meta">
  <strong>Option N — {short-label}</strong>
  <span>{one-sentence rationale}</span>
</header>
```

```css
.mock-meta {
  padding: 8px 16px;
  background: #0d1117;
  color: #c9d1d9;
  display: flex;
  gap: 16px;
  align-items: baseline;
  font: 13px/1.4 system-ui, sans-serif;
  border-bottom: 1px solid #30363d;
}
.mock-meta strong { font-weight: 600; }
.mock-meta span { color: #8b949e; }
```

Skip the header strip only when the user explicitly asks for "clean mocks
without the header strip."

## Flow chrome — picking the right topology

`flows` supports five topologies. The chrome differs for each.

| Topology | Chrome class | When to use |
|---|---|---|
| Sequential | `.flow-meta` | Linear journey; each step gates the next (signup, recovery, wizard) |
| Hub-and-spoke | `.flow-nav` | Peer pages with shared navigation; no ordering (settings, dashboards) |
| Hybrid | `.flow-hybrid` | Primary sequence + cross-links to revisit prior steps (checkout, multi-stage processes) |
| Map-as-canvas | `.flow-map` | The canvas IS the surface; pages are modes (logistics, route planning, GIS) |
| Chat-as-canvas | `.flow-chat` | The thread IS the surface; pages are inline blocks inside bubbles (AI assistants, support chat) |

When both sequential and cross-nav fit the journey, render the **hybrid**
chrome — sequential chrome plus cross-jump breadcrumb in one strip. When
only one fits, render that one. Map and chat are *replacement* topologies —
they're not blended with the other three.

### `.flow-meta` — sequential (prev/next chrome)

Sticky top bar on each flow step. Carries prev/next nav and the
"step N of M" indicator. Used when the journey is strictly ordered.

```html
<header class="flow-meta">
  <a href="NN-prev-slug.html">← prev</a>
  <span class="center">{flow-name} · step N/M · {slug}</span>
  <a href="NN-next-slug.html">next →</a>
</header>
```

```css
.flow-meta {
  position: sticky; top: 0; z-index: 100;
  background: #0d1117; color: #c9d1d9;
  padding: 10px 16px;
  display: flex; justify-content: space-between; align-items: center;
  font: 13px/1.4 system-ui, sans-serif;
  border-bottom: 1px solid #30363d;
}
.flow-meta a {
  color: #58a6ff; text-decoration: none;
  padding: 4px 8px; border-radius: 4px;
}
.flow-meta a:hover { background: #161b22; }
.flow-meta .center { font-weight: 600; }
```

For the first step, the prev link points to `index.html` ("← overview").
For the last step, the next link points to `index.html` ("done ↗").

### `.flow-nav` — hub-and-spoke (persistent navigation)

Sticky top (or side) navigation that appears identically on every page,
giving reviewers the same way to jump between any two pages a real user
would have. Used when the "flow" is a set of peer screens (settings,
account, dashboard tabs) rather than an ordered journey.

The nav lists every page in the flow. The current page is marked with
`.flow-nav__link--active`. The "overview" link points back to
`index.html` so reviewers can return to the navigator.

```html
<header class="flow-nav">
  <span class="flow-nav__title">{flow-name}</span>
  <nav>
    <a href="01-dashboard.html" class="flow-nav__link">Dashboard</a>
    <a href="02-account.html" class="flow-nav__link flow-nav__link--active">Account</a>
    <a href="03-billing.html" class="flow-nav__link">Billing</a>
    <a href="04-team.html" class="flow-nav__link">Team</a>
  </nav>
  <a href="index.html" class="flow-nav__overview">overview ↗</a>
</header>
```

```css
.flow-nav {
  position: sticky; top: 0; z-index: 100;
  background: #0d1117; color: #c9d1d9;
  padding: 10px 16px;
  display: flex; gap: 24px; align-items: center;
  font: 13px/1.4 system-ui, sans-serif;
  border-bottom: 1px solid #30363d;
}
.flow-nav__title { font-weight: 600; color: #f0f6fc; }
.flow-nav nav { display: flex; gap: 4px; flex: 1; }
.flow-nav__link {
  color: #8b949e; text-decoration: none;
  padding: 4px 10px; border-radius: 4px;
}
.flow-nav__link:hover { background: #161b22; color: #c9d1d9; }
.flow-nav__link--active {
  background: #1f6feb; color: #fff;
}
.flow-nav__overview { color: #58a6ff; text-decoration: none; font-size: 12px; }
```

If the project has a `nav-bar` component defined in `components.css`,
prefer `<nav class="nav-bar nav-bar--top">` over the inline `.flow-nav`
chrome — the component version stays consistent with how the nav appears
in production. The `.flow-nav` class above is the fallback when
`components.css` doesn't exist yet.

### `.flow-hybrid` — sequence + cross-jumps

When the flow has a primary sequence AND peer cross-jumps (canonical
example: checkout — cart → shipping → payment → review, with "edit cart"
and "edit shipping" links available from later steps). Combines prev/next
chrome with a horizontal breadcrumb of all steps; the breadcrumb items
are clickable cross-jumps; the current step is highlighted.

```html
<header class="flow-hybrid">
  <a href="02-shipping.html" class="flow-hybrid__prev">← shipping</a>
  <nav class="flow-hybrid__crumbs">
    <a href="01-cart.html">1 Cart</a>
    <a href="02-shipping.html">2 Shipping</a>
    <a href="03-payment.html" aria-current="step" class="flow-hybrid__current">3 Payment</a>
    <a href="04-review.html" class="flow-hybrid__future">4 Review</a>
  </nav>
  <a href="04-review.html" class="flow-hybrid__next">review →</a>
</header>
```

```css
.flow-hybrid {
  position: sticky; top: 0; z-index: 100;
  background: #0d1117; color: #c9d1d9;
  padding: 10px 16px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px; align-items: center;
  font: 13px/1.4 system-ui, sans-serif;
  border-bottom: 1px solid #30363d;
}
.flow-hybrid__prev, .flow-hybrid__next {
  color: #58a6ff; text-decoration: none;
  padding: 4px 8px; border-radius: 4px;
}
.flow-hybrid__prev:hover, .flow-hybrid__next:hover { background: #161b22; }
.flow-hybrid__crumbs {
  display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;
}
.flow-hybrid__crumbs a {
  color: #8b949e; text-decoration: none;
  padding: 4px 10px; border-radius: 4px; font-size: 12px;
}
.flow-hybrid__crumbs a:hover { background: #161b22; color: #c9d1d9; }
.flow-hybrid__current { background: #1f6feb; color: #fff !important; }
.flow-hybrid__future { opacity: 0.6; }
```

Past steps in the breadcrumb are full opacity (visited, still clickable
to revisit). Future steps are dimmed but linkable (so reviewers can scan
ahead). The current step is highlighted.

### `.flow-map` — map-as-canvas (mode switcher over a fill-canvas)

The canvas (map / 3D scene / graph) fills the viewport. The chrome is a thin
top strip carrying brand + mode switcher + overview link. Mode-specific UI
floats on top as popover panels.

```html
<header class="flow-map">
  <span class="flow-map__title">{flow-name}</span>
  <nav class="flow-map__modes">
    <a href="01-overview.html" class="flow-map__mode">Overview</a>
    <a href="02-planning.html" class="flow-map__mode flow-map__mode--active">Planning</a>
    <a href="03-executing.html" class="flow-map__mode">Executing</a>
  </nav>
  <a href="index.html" class="flow-map__overview">overview ↗</a>
</header>
<main class="map-canvas">
  <div class="canvas-fill"><!-- map / scene SVG placeholder --></div>
  <aside class="popover popover--top-left">{mode panel}</aside>
  <aside class="popover popover--bottom-right">{tools}</aside>
</main>
```

```css
.flow-map {
  position: sticky; top: 0; z-index: 100;
  background: #0d1117; color: #c9d1d9;
  padding: 8px 16px;
  display: flex; gap: 24px; align-items: center;
  font: 13px/1.4 system-ui, sans-serif;
  border-bottom: 1px solid #30363d;
}
.flow-map__title { font-weight: 600; color: #f0f6fc; }
.flow-map__modes { display: flex; gap: 4px; flex: 1; }
.flow-map__mode {
  color: #8b949e; text-decoration: none;
  padding: 4px 12px; border-radius: 4px;
}
.flow-map__mode:hover { background: #161b22; color: #c9d1d9; }
.flow-map__mode--active {
  background: #1f6feb; color: #fff;
}
.flow-map__overview { color: #58a6ff; text-decoration: none; font-size: 12px; }

.map-canvas {
  position: relative;
  min-height: calc(100vh - 40px);
  background: #f6f8fa;
  overflow: hidden;
}
.canvas-fill {
  position: absolute; inset: 0;
  /* Project supplies a real map SVG / WebGL canvas / image; for mocks,
     a placeholder image or solid-color block is fine. */
  background: linear-gradient(135deg, #d0e3f0, #c9e8d2);
}
.popover {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid #d0d7de;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
  font: 13px/1.4 system-ui, sans-serif;
  color: #24292f;
}
.popover--top-left { top: 16px; left: 16px; max-width: 280px; }
.popover--bottom-right { bottom: 16px; right: 16px; max-width: 240px; }
```

The mode switcher is the primary chrome interaction. The mode-specific
panels are the *content* of each mode. Reviewers click the mode tabs to
swap which popover panels appear (each mock page is one mode).

### `.flow-chat` — chat-as-canvas (thread + composer)

The thread fills the middle; a composer sits sticky at the bottom; a thin
chrome strip carries brand + overview. Bot messages can carry rich blocks
*inside* their bubble.

```html
<header class="flow-chat">
  <span class="flow-chat__title">{flow-name}</span>
  <a href="index.html" class="flow-chat__overview">overview ↗</a>
</header>
<main class="chat-thread">
  <div class="msg msg--bot">
    <p>Bot greeting message</p>
  </div>
  <div class="msg msg--user">
    <p>User reply</p>
  </div>
  <div class="msg msg--bot">
    <p>Bot response with a rich block:</p>
    <div class="rich-block choice-chips">
      <button class="choice-chip">Option A</button>
      <button class="choice-chip">Option B</button>
    </div>
  </div>
</main>
<footer class="composer">
  <input type="text" class="composer__input" placeholder="Type a message…">
  <button class="composer__send">Send</button>
</footer>
```

```css
.flow-chat {
  position: sticky; top: 0; z-index: 100;
  background: #0d1117; color: #c9d1d9;
  padding: 10px 16px;
  display: flex; justify-content: space-between; align-items: center;
  font: 13px/1.4 system-ui, sans-serif;
  border-bottom: 1px solid #30363d;
}
.flow-chat__title { font-weight: 600; color: #f0f6fc; }
.flow-chat__overview { color: #58a6ff; text-decoration: none; font-size: 12px; }

.chat-thread {
  display: flex; flex-direction: column; gap: 12px;
  padding: 24px 16px;
  max-width: 720px; margin: 0 auto;
  min-height: calc(100vh - 120px);
}
.msg {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  font: 14px/1.5 system-ui, sans-serif;
}
.msg p { margin: 0; }
.msg--bot {
  background: #f1f3f5; color: #24292f;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.msg--user {
  background: #0969da; color: #fff;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}
.rich-block {
  margin-top: 8px;
}
.choice-chips {
  display: flex; gap: 6px; flex-wrap: wrap;
}
.choice-chip {
  padding: 6px 12px;
  background: #fff; color: #0969da;
  border: 1px solid #d0d7de; border-radius: 9999px;
  font: 13px/1 system-ui; cursor: pointer;
}
.choice-chip:hover { background: #f6f8fa; }

.composer {
  position: sticky; bottom: 0;
  background: #fff;
  border-top: 1px solid #d0d7de;
  padding: 12px 16px;
  display: flex; gap: 8px;
  max-width: 720px; margin: 0 auto; width: 100%;
}
.composer__input {
  flex: 1; padding: 10px 14px;
  border: 1px solid #d0d7de; border-radius: 9999px;
  font: 14px/1.4 system-ui; outline: none;
}
.composer__input:focus { border-color: #0969da; }
.composer__send {
  padding: 10px 18px;
  background: #0969da; color: #fff;
  border: 0; border-radius: 9999px;
  font: 14px/1 system-ui; font-weight: 600; cursor: pointer;
}
```

Bot messages live-left, user messages live-right. The bot can carry any
rich block — cards, choice-chips, inline forms, code blocks — inside its
bubble. The composer is sticky so reviewers see the composition affordance
at every scroll position.

For multi-step conversation mocks: each page (`01-greeting.html`,
`02-clarification.html`, ...) shows the thread *up to that message*. The
index.html lists the messages as a vertical timeline.

## The screens 2x2 index grid

`screens/<feature-id>/index.html` — dark page with N iframes in a grid. Scale
the grid columns/rows to option count: 2 → 2x1, 3 → 3x1, 4 → 2x2, 5–6 → 3x2,
7–8 → 4x2.

```css
body { margin: 0; font-family: system-ui, sans-serif; background: #111; color: #eee; }
h1 { padding: 16px 24px; margin: 0; font-weight: 500; }
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;  /* adapt to count */
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  padding: 8px;
  height: calc(100vh - 56px);
  box-sizing: border-box;
}
.cell {
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.cell h2 {
  margin: 0;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  background: #222;
  color: #eee;
  display: flex;
  justify-content: space-between;
}
.cell iframe { border: 0; flex: 1; width: 100%; }
.cell a { color: #6cf; text-decoration: none; }
```

```html
<h1>{feature-id} — pick a direction</h1>
<div class="grid">
  <div class="cell">
    <h2>Option 1 — {label} <a href="option-1.html" target="_blank">open ↗</a></h2>
    <iframe src="option-1.html"></iframe>
  </div>
  <!-- repeat per option -->
</div>
```

## The flows index navigator

`flows/<flow-name>/index.html` — light overview page with step cards, each
with an iframe preview. Used when reviewers want to scan the whole journey
before walking through it.

The index visualizes the flow's **topology**, so reviewers see the shape
at a glance. Three variants:

- **Sequential index** — numbered cards in a single linear progression
  (default; current behavior)
- **Hub-and-spoke index** — grid of peer cards, no numbering, grouped if
  the flow has natural sub-sections (e.g., settings sections)
- **Hybrid index** — numbered cards in a primary sequence with side
  arrows or dotted lines showing cross-jumps between non-adjacent steps

### Sequential index (default)

```css
body { margin: 0; font: 14px/1.5 system-ui, sans-serif; background: #f6f8fa; color: #24292f; }
header { background: #0d1117; color: #fff; padding: 24px 32px; }
header h1 { margin: 0 0 4px; font-weight: 600; font-size: 20px; }
header p { margin: 0; color: #8b949e; }
.steps {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  padding: 24px 32px;
}
.step {
  background: #fff; border: 1px solid #d0d7de; border-radius: 8px;
  overflow: hidden; display: flex; flex-direction: column;
}
.step .label {
  padding: 12px 16px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #d0d7de;
}
.step .label .num {
  background: #0969da; color: #fff;
  width: 24px; height: 24px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
}
.step .label a { color: #0969da; text-decoration: none; font-size: 12px; }
.step iframe { border: 0; width: 100%; height: 220px; background: #fff; }
.ribbon {
  display: flex; gap: 4px; padding: 16px 32px;
  background: #fff; border-bottom: 1px solid #d0d7de;
}
.ribbon a {
  flex: 1; padding: 8px 12px; text-align: center;
  background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px;
  color: #24292f; text-decoration: none; font-size: 13px;
}
.ribbon a:hover { background: #eaeef2; }
```

```html
<header>
  <h1>{flow-name}</h1>
  <p>{one-sentence flow purpose} — {step count} steps</p>
</header>
<div class="ribbon">
  <a href="01-{slug}.html">▶ start the flow</a>
  <a href="01-{slug}.html" target="_blank">▶ start in new tab</a>
</div>
<div class="steps">
  <div class="step">
    <div class="label">
      <span><span class="num">1</span> &nbsp; {step title}</span>
      <a href="01-{slug}.html">open ↗</a>
    </div>
    <iframe src="01-{slug}.html"></iframe>
  </div>
  <!-- repeat per step -->
</div>
```

### Hub-and-spoke index

For peer pages with no inherent ordering. Drop the numbered circles, drop
the "start the flow" ribbon, replace it with an "enter the area" ribbon
that points at the most likely entry (typically the dashboard or root
page). Group by sub-section if the flow has natural clusters (e.g.,
"Account settings" / "Workspace settings" / "Billing").

```css
.peers {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  padding: 24px 32px;
}
.peers .group { grid-column: 1 / -1; }
.peers .group h2 {
  margin: 16px 0 8px; font-size: 14px; font-weight: 600;
  color: #57606a; text-transform: uppercase; letter-spacing: 0.04em;
}
.peer {
  background: #fff; border: 1px solid #d0d7de; border-radius: 8px;
  overflow: hidden; display: flex; flex-direction: column;
}
.peer .label {
  padding: 12px 16px; border-bottom: 1px solid #d0d7de;
  display: flex; justify-content: space-between; align-items: center;
}
.peer .label strong { font-weight: 600; }
.peer .label a { color: #0969da; text-decoration: none; font-size: 12px; }
.peer iframe { border: 0; width: 100%; height: 220px; background: #fff; }
```

```html
<header>
  <h1>{flow-name}</h1>
  <p>Peer pages — no fixed order. Reviewers should navigate as a real user would.</p>
</header>
<div class="ribbon">
  <a href="{entry-slug}.html">▶ enter the area</a>
  <a href="{entry-slug}.html" target="_blank">▶ enter in new tab</a>
</div>
<div class="peers">
  <div class="peer">
    <div class="label">
      <strong>Dashboard</strong>
      <a href="01-dashboard.html">open ↗</a>
    </div>
    <iframe src="01-dashboard.html"></iframe>
  </div>
  <!-- repeat per peer page -->
</div>
```

### Hybrid index

Combines the numbered sequence with visual cross-jump indicators.
Numbered cards in primary order, with small "jump-back" or "jump-to"
hint chips on cards that have non-adjacent links from elsewhere in the
flow. The chips aren't navigation themselves (the iframes show the
real links); they're documentation of the cross-jump structure.

```css
.step .cross-jumps {
  padding: 8px 16px; border-top: 1px solid #d0d7de;
  display: flex; gap: 6px; flex-wrap: wrap;
  font-size: 11px; color: #57606a;
}
.step .cross-jump {
  background: #ddf4ff; color: #0969da;
  padding: 2px 8px; border-radius: 9999px;
}
```

```html
<div class="step">
  <div class="label">
    <span><span class="num">3</span> &nbsp; Payment</span>
    <a href="03-payment.html">open ↗</a>
  </div>
  <iframe src="03-payment.html"></iframe>
  <div class="cross-jumps">
    <span class="cross-jump">← edit cart (jumps to step 1)</span>
    <span class="cross-jump">← edit shipping (jumps to step 2)</span>
  </div>
</div>
```

## File scaffold reused by all generator skills

Every generated HTML file follows the same outer shape:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{descriptive title}</title>
  <link rel="stylesheet" href="../../design-system/tokens.css">
  <style>
    /* Shared chrome (.mock-meta or .flow-meta) — see above */
    /* Page-specific styles below */
  </style>
</head>
<body>
  <header class="{mock-meta or flow-meta}">...</header>
  <main>...</main>
  <script>/* Optional vanilla JS for interactive bits */</script>
</body>
</html>
```

The `<link rel="stylesheet" href="../../design-system/tokens.css">` is
optional — include it when `tokens.css` exists (which is the default after
`palette` has run). When it doesn't exist, inline literal values with a
comment so the mock doesn't render unset CSS variables.

## When a needed token isn't in tokens.css

Generator skills should verify that any `var(--token)` reference exists in
`.mockups/design-system/tokens.css` before using it. Two options when a
token is missing:

1. **Inline the literal value** with a comment:
   ```css
   background: #f59e0b; /* TODO: not in tokens.css — add --color-warning-bg */
   ```
2. **Defer to `palette`** — invoke `/ux-ui-design:palette` in refinement mode
   to add the missing token before continuing.

Inline literals are appropriate when the missing token is one-off; deferring
to `palette` is appropriate when the missing token should be part of the
project's vocabulary going forward.

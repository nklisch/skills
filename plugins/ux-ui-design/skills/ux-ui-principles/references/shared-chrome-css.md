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

## The `.flow-meta` sticky header (per-step prev/next chrome)

Sticky top bar on each flow step. Carries prev/next nav and the
"step N of M" indicator. Lives at the top of every `NN-<slug>.html` in `flows`.

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

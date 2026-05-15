# Preview page templates

`palette.html` and `typography.html` are the review artifacts. Both follow
the same shape: a sticky TOC at the top, stacked option sections below, each
showing the option's tokens with concrete demos and contrast checks.

## palette.html

Sticky nav with jump-links between options. Each section shows the option
name + tone badge, a one-sentence rationale, swatches with hex + token name,
a light + dark mode mini composition, and the WCAG contrast results.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Palette options — {project}</title>
  <style>
    body { margin: 0; font: 14px/1.5 system-ui, sans-serif; }
    nav.toc {
      position: sticky; top: 0; z-index: 10;
      padding: 12px 24px; background: #111; color: #eee;
      display: flex; gap: 16px; align-items: center;
    }
    nav.toc a { color: #8af; text-decoration: none; }
    section.option { padding: 32px 24px; border-bottom: 1px solid #ddd; }
    section.option h2 {
      margin: 0 0 4px; display: flex; gap: 12px; align-items: center;
    }
    section.option h2 .badge {
      background: #eee; padding: 2px 8px; border-radius: 4px;
      font: 600 11px/1 system-ui; text-transform: uppercase;
    }
    section.option p.rationale {
      margin: 0 0 16px; color: #555; font-size: 13px;
    }
    .swatches {
      display: grid; gap: 8px;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      margin: 16px 0;
    }
    .swatch { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
    .swatch .color { height: 56px; }
    .swatch .meta { padding: 6px 8px; font: 12px/1.4 ui-monospace, monospace; }
    .swatch .meta .name { display: block; }
    .swatch .meta .hex { color: #888; }
    .demo {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;
    }
    .demo .pane { padding: 16px; border-radius: 8px; border: 1px solid #ddd; }
    .demo .pane.dark { border-color: #333; }
    .demo button {
      padding: 8px 16px; border: 0; border-radius: 6px;
      font: 500 14px/1 system-ui; cursor: pointer;
    }
    .demo .row { display: flex; gap: 8px; align-items: center; margin: 8px 0; }
    .contrast { margin-top: 12px; font: 12px/1.4 ui-monospace, monospace; }
    .contrast .pass { color: #060; }
    .contrast .fail { color: #c00; }
  </style>
</head>
<body>
  <nav class="toc">
    <strong>{project} palette options</strong>
    <a href="#option-1">Option 1</a>
    <a href="#option-2">Option 2</a>
    <a href="#option-3">Option 3</a>
  </nav>
  <section class="option" id="option-1">
    <h2>Option 1 — {label} <span class="badge">{tone}</span></h2>
    <p class="rationale">{one-sentence rationale}</p>
    <div class="swatches"><!-- one .swatch per token --></div>
    <div class="demo">
      <div class="pane light">{light-mode mini composition}</div>
      <div class="pane dark">{dark-mode mini composition}</div>
    </div>
    <div class="contrast">
      Text on bg: <span class="pass">4.8:1 AA pass</span>
      Muted on bg: <span class="pass">4.6:1 AA pass</span>
      Accent on bg: <span class="fail">2.9:1 AA fail (dark mode)</span>
    </div>
  </section>
  <!-- repeat per option -->
</body>
</html>
```

Each swatch:

```html
<div class="swatch">
  <div class="color" style="background: #0d6efd"></div>
  <div class="meta">
    <span class="name">--color-accent</span>
    <span class="hex">#0d6efd</span>
  </div>
</div>
```

Each mini composition shows a button, a card, a link, and a small code
block using only that option's tokens. The light and dark panes side by
side make the dual-mode commitment visible at review time.

## typography.html

Same outer shape, two option sections (typography needs fewer options than
palette — usually two distinct stacks is enough).

If a typography option uses a hosted face (Google Fonts, Fontsource,
etc.), load it via `<link>` in `typography.html`'s `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

Then apply the font on each option's section so reviewers see the actual
face, not the fallback.

For each typography option, show:

- **The stack** as a code block (`--font-sans: 'Fraunces', Georgia, serif;`)
- **The scale** at every size token, with the label visible
  (e.g. "xl / 20px / Display heading sample")
- **The weights** demonstrated in a sample paragraph
- **One full sample paragraph** in the project's domain voice — not lorem
  ipsum. If the project is a fintech app, write financial copy. If it's a
  game, write game copy.

Skip a TOC if there are only two options; just stack them.

## Contrast check pairings

For every palette option, compute and display contrast ratios for these
pairings, in both light and dark mode:

- `--color-text-primary` on `--color-bg-primary`
- `--color-text-secondary` on `--color-bg-primary`
- `--color-text-inverse` on `--color-accent`
- `--color-accent` on `--color-bg-primary` (for accent-as-text use)

WCAG AA threshold: 4.5:1 for body text, 3.0:1 for large text (18pt+ or
14pt+ bold). Mark pairings that fail in either mode — the user needs to see
the gap before locking the option.

If all three options have failing pairings, the color space is over-
constrained. Surface this to the user and ask whether to relax one
constraint (drop the brand-color requirement, allow a less-saturated
accent, etc.) before regenerating.

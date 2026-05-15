# Token vocabulary

The semantic CSS-variable vocabulary every project palette defines. Small
enough to use, expressive enough to compose. Pick semantic names over raw
hue names (`--color-accent` not `--color-blue-500`) so downstream mocks
can swap palettes without touching markup.

## Color tokens

```
--color-bg-primary       # main surface
--color-bg-secondary     # raised surface (cards, modals)
--color-bg-tertiary      # nested raised (input fields, code blocks)
--color-bg-inverse       # contrasting surface for emphasis

--color-text-primary     # body text
--color-text-secondary   # muted text (descriptions, captions)
--color-text-tertiary    # very muted (placeholder, disabled)
--color-text-inverse     # text on inverse surfaces
--color-text-link        # link color
--color-text-link-hover  # link hover

--color-border           # default border / divider
--color-border-strong    # emphasized border

--color-accent           # primary brand color (CTAs, focus)
--color-accent-hover     # CTA hover
--color-accent-muted     # accent at low saturation (selected backgrounds)

--color-success
--color-warning
--color-danger
--color-info
```

Define both **light-mode** and **dark-mode** values for every color token.

## Typography tokens

```
--font-sans         # body sans-serif stack
--font-serif        # if any
--font-mono         # code / numeric

--font-size-xs
--font-size-sm
--font-size-base
--font-size-lg
--font-size-xl
--font-size-2xl
--font-size-3xl

--font-weight-regular
--font-weight-medium
--font-weight-semibold
--font-weight-bold

--line-height-tight
--line-height-base
--line-height-loose
```

## Spacing scale (8pt baseline)

```
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
--space-16: 64px;
```

The 8pt baseline (with the 4px half-step) covers virtually every layout
spacing decision in practice. Add intermediate values (`--space-5: 20px`)
only when a real downstream mock needs them.

## Radius scale

```
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 16px;
--radius-full: 9999px;
```

## Naming principles

- **Semantic over hue.** `--color-accent` lets the palette swap; `--color-blue`
  locks the project to a hue family forever.
- **Surface relationships.** `bg-primary` / `secondary` / `tertiary` describe
  layering (most-visible → deepest), not arbitrary numbering.
- **Hover pairs.** Every interactive color (`accent`, `text-link`) has a
  `-hover` variant. Define them; mocks need both states.
- **Status colors stay flat.** `--color-success` / `warning` / `danger` /
  `info` are single tokens, not 50–900 ramps. If a mock needs a muted
  variant, alpha-blend with the surface rather than adding a new token.

## When to extend

Add tokens when a downstream mock actually needs them, not speculatively.
A 200-token palette is harder to use than a clean 20-token one. The list
above is the minimum viable vocabulary; everything else is opt-in.

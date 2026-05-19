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

## Data-visualization tokens (Bertin's visual-variables tier)

Optional tier — add only when the project actually visualizes data. Jacques Bertin's
*Semiology of Graphics* (1967) distinguishes three data-encoding intents, each
requiring a different color ramp:

```
/* Categorical — for distinguishing nominal categories (no inherent order) */
--chart-cat-1
--chart-cat-2
--chart-cat-3
--chart-cat-4
--chart-cat-5
--chart-cat-6
/* Pick 6-8 maximally-distinct hues. Test for color-blind safety
   (Okabe-Ito, IBM Carbon Accessible, or Color Universal Design palettes
   are good starting sets). */

/* Sequential — for ordered data (low → high, cool → hot) */
--chart-seq-1   /* lightest */
--chart-seq-2
--chart-seq-3
--chart-seq-4
--chart-seq-5
--chart-seq-6
--chart-seq-7
--chart-seq-8
--chart-seq-9   /* darkest */
/* Use single-hue ramps (light blue → dark blue) for the most-readable
   sequential viz. ColorBrewer's "Blues" / "Greens" / "Reds" sequential
   sets are canonical. */

/* Diverging — for data with a meaningful midpoint (positive/negative,
   above/below baseline) */
--chart-div-neg-3
--chart-div-neg-2
--chart-div-neg-1
--chart-div-mid       /* neutral pivot */
--chart-div-pos-1
--chart-div-pos-2
--chart-div-pos-3
/* Two contrasting hues meeting at a neutral midpoint (red ↔ blue,
   brown ↔ teal). ColorBrewer's "RdBu" / "BrBG" sets are canonical. */
```

**Bertin's lesson:** match the encoding to the data shape. Nominal categories
should NOT use a sequential ramp (it implies false order). Ordered data should NOT
use categorical hues (it implies false separation). Bipolar data should NOT use a
sequential ramp (it implies a one-way direction).

Most projects need only categorical. Sequential and diverging are for analytics-heavy
products. Skip both if charts aren't first-class in the design.

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

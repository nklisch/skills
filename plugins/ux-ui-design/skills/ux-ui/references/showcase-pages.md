# Showcase pages — making standardization visible

The patterns for the pages that sell a design system: palette previews,
typography previews, component showcases, motion showcases. A showcase is
how abstract choices become reviewable — the user doesn't pick "tokens,"
they pick what they *see*.

## Contents

- What every showcase does
- Palette preview
- Typography preview
- Component showcase
- Motion showcase
- Moodboards

---

## What every showcase does

- **One page per concern**, all options stacked vertically with anchor
  links at the top to jump between them.
- **Each option is labeled** with a name, a one-sentence rationale in plain
  prose, and shown *in context* — never as bare swatches or isolated specs.
- **Both light and dark mode side by side** for anything color-bearing.
- **Domain-voice sample content** — the project's real kind of copy, not
  lorem ipsum. Fintech gets financial copy; a game gets game copy.
- After the user picks, ask whether to trim the page to the chosen option
  (default: trim — history lives in git).

## Palette preview

Per option: name + rationale; swatches with hex and token names; a small
composition demo (button, card, link, code block) built only from that
option's tokens, in both modes; the contrast-pairing results from
`design-tokens.md` with failures marked visibly.

## Typography preview

Per option: the stack with fallbacks; the scale rendered (display →
headings → body → small); weight examples; one sample paragraph in the
project's domain voice. Run the typographic-color squint check
(`design-tokens.md`) before the user sees the page.

## Component showcase

Every component from the starter set plus project-uniques, in every state
(default, hover, focus-visible, active, disabled, loading), grouped by
category: actions, forms, surfaces, feedback, navigation, data display,
overlays, indicators. Each state is real markup, not a screenshot — the
reviewer can tab through focus states. Project-unique components get a
one-line purpose note.

## Motion showcase

Motion can only be reviewed by *being triggered* — every entry is
clickable/hoverable/draggable. Per motion: the name, its attitude, the
curve and duration, what it's for. Include: the five easing curves on
identical elements for comparison; the duration scale; any optional
channels (springs, hold-beat); a reduced-motion toggle that simulates
`prefers-reduced-motion` so the reviewer can verify the fallbacks; and
flags on anything violating the hard rules (input-gating >300ms,
layout-thrashing properties, loops outside the two allowed cases).

## Moodboards

When the direction itself is still being explored, a moodboard is a
legitimate showcase: one page per candidate direction, each a collage of
the direction's principles rendered as mock fragments — a hero block, a
card, a button row, a texture swatch, a type sample — composed to *feel*
like the direction, not to function. Cheaper than full screen options;
the right artifact when the question is "what world should this live in"
rather than "how should this screen work."

# UI and Journey Requirements

Use interactive mockups when a nontrivial interface or user journey has product,
state, sequencing, accessibility, or interaction uncertainty that would be
expensive to discover in production code. A mockup gathers requirements by
letting the user experience and challenge the intended product before code makes
those choices expensive.

When the `ux-ui-design` plugin's `ux-ui` skill is available, use it for design
conversation and artifact production. Keep settled decisions in the work item.
Otherwise, follow this reference directly.

## Discuss direction without naming styles

Do not offer named visual styles, movements, brands, products, or designers as
the choice set, and do not imitate a reference wholesale. Named examples anchor
the work: agents over-index on recognizable surface traits and stop designing
for the product itself. When the user supplies references, take the qualities
they value and combine them with what the product needs.

Describe each direction through concrete qualities and their effects: emotional
temperature and formality; density, whitespace, and information pressure;
hierarchy and attention flow; typographic proportion, weight, and voice; color
temperature, contrast, and semantic use; geometry, depth, and material
impression; motion pace, feedback, and reduced-motion behavior. Explain how
those choices serve the audience and task instead of reducing them to a label.
Ask what the product should feel like to use and what it must never feel like.

## Build one walkthrough

Store the smallest useful walkthrough under `.mockups/<item-id>/index.html`
with local shared assets. Reference it through `mock_refs` from the work item.
Mockups are requirements evidence, not production components.

Cover the meaningful journey, not one ideal screenshot: entry, primary path,
loading, empty, error, recovery, permission, and responsive behavior where
relevant. Use representative synthetic data only; never place PII or PHI in a
mockup. Alternative directions help only while they answer a live question, and
must differ in hierarchy, composition, and interaction rather than color alone.
Once direction settles, converge on one coherent walkthrough rather than leave
the user an option gallery.

## Inspect before showing

Do not show the user an uninspected first draft when you can inspect it first.
The effective `evidence_depth` sets inspection breadth, not whether it happens.
Open the walkthrough, follow the primary journey, exercise meaningful controls,
and capture representative wide and narrow views. Where vision inspection is
available, check hierarchy, clipping, spacing, contrast, legibility, and
accidental visual noise; fix findings and inspect again. Visual inspection
supplements working-link, keyboard, responsive, and semantic checks; it does not
replace them.

If browser or vision tooling is unavailable, use the best local checks for
markup, links, viewport behavior, and interactions. Give the user the entry path
and say which visual inspection could not be performed. Refine the walkthrough
with the user before implementation, and record decisions and rejected qualities
in the item. Do not require mockups for small, already-settled UI changes.

# UI and UX Requirements Lens

Interactive mockups are a requirements-gathering medium. Their job is to let the
user experience, challenge, and refine the intended product before production
code makes those choices expensive.

## Do not design from named examples

Do not present catalogs of named visual styles, movements, brands, products, or
famous designers as the choice set. Do not ask the user to select a label and
do not imitate a reference wholesale. Named examples create anchoring pressure:
agents over-index on recognizable surface traits and stop designing for the
actual product.

If the user supplies references, extract the qualities they care about and mix
them with the project's own needs. Treat references as evidence about taste, not
as templates. Deliberately synthesize compatible ideas across layout, type,
color, depth, texture, interaction, and motion rather than forcing the interface
into one prepackaged system.

## Describe the felt direction

Discuss each direction through concrete qualities and their effect:

- emotional temperature and degree of formality;
- calmness, energy, confidence, warmth, playfulness, restraint, or urgency;
- density, whitespace, rhythm, and information pressure;
- hierarchy, focal points, and how attention moves;
- typography proportions, weight, spacing, and voice;
- color temperature, contrast, saturation, and semantic use;
- geometry, edge treatment, depth, shadow, texture, and material impression;
- motion pace, continuity, feedback, and reduced-motion behavior;
- how these choices support the audience and task.

Use complete prose that combines emotional effect with the concrete choices
creating it. Describe how the qualities work together and what they help the
user notice or do. Do not collapse that description into a named style label.

Ask what the product should feel like to use and what it must never feel like.
Ask about audience, environment, density, accessibility, brand constraints, and
the moments that should carry emotional weight. Follow the effective
`interaction` preference: collaborate broadly, pause only at checkpoints, or
make reversible choices autonomously as selected. Use the structured question
tool when available; otherwise ask inline and pause whenever the chosen
interaction posture calls for user input.

## Build a walkthrough, not a gallery

Start with the smallest artifact that can answer the current question, then grow
it toward a complete working walkthrough of the primary experience:

- an `index.html` entry point;
- realistic content and copy;
- working navigation and primary controls;
- the main journey from entry through resolution;
- meaningful empty, loading, validation, failure, recovery, and success states
  when they affect the experience;
- representative narrow and wide viewport behavior;
- keyboard focus, labels, contrast, reduced motion, and other accessibility
  behavior appropriate to the surface.

Alternative directions are useful only while they answer a real unresolved
question. They should differ in hierarchy, composition, interaction, and feel—not
merely color or decoration. Once direction settles, converge the chosen pieces
into one coherent walkthrough. Do not leave the user with a disconnected option
gallery as the final artifact.

Mocks live under `.mockups/<item-id>/`, separate from the work queue, with
`index.html` as the review entry point. Add that path to the work item's
`mock_refs`; record only the choices it settled in the item body. Static
HTML/CSS/JavaScript is usually the fastest portable medium, but the artifact may
use another lightweight approach when that materially improves the walkthrough.
It remains requirements evidence, not production code.

## Inspect before showing

The effective `rigor` preference controls breadth, not whether inspection
happens: `lean` checks the primary path and representative viewport;
`standard` adds important states and accessibility behavior; `rigorous` broadens
journeys, viewports, states, and repeated visual refinement.

When browser automation, screenshot, or vision tools are available:

1. open the walkthrough in a real browser;
2. traverse the primary journey and exercise meaningful controls;
3. capture representative wide and narrow views and important states;
4. use vision inspection to assess hierarchy, clipping, spacing, contrast,
   legibility, consistency, awkward empty regions, and accidental visual noise;
5. fix the problems found and repeat until the walkthrough is coherent.

Do not show the user an uninspected first draft when the agent can see it first.
Browser vision supplements DOM and accessibility inspection; it does not replace
working-link, keyboard, responsive, or semantic checks.

If browser/vision tools are unavailable, validate markup, links, viewport
behavior, and interactions through the best available local checks, then give
the user the entry path and say which visual inspection could not be performed.

## Review with the user

Show the refined walkthrough and describe its feel in depth without naming a
style. Ask the user to walk the journey, identify what feels right or wrong, and
comment on missing behavior. Iterate until the requirements and experience are
settled enough for implementation. Record the path, decisions, rejected
qualities, and remaining discretion with the work item's `mock_refs` and concise decisions.

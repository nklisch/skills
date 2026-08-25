# ux-ui-design 1.0.0

Released 2026-08-25. Major restructure of the ux-ui-design plugin.

## Delivered outcomes

- **feature-ux-ui-concierge** — replaced the seven pipeline skills
  (`ux-ui-principles`, `palette`, `components`, `motion`, `screens`,
  `flows`, `adopt`) with one adaptive, interview-first `ux-ui` concierge
  skill backed by a nine-file reference library (~1,100 lines, condensed
  from ~4,700). The plugin now:
  - Grounds in the repository, then interviews in plain novice-assumed
    language — goals, audience, usage, how the product should feel — with
    a standing invitation to share screenshots, examples, and references.
  - Lets the user choose the artifact breakdown: comprehensive mockup,
    piece-by-piece, additive, journeys, standardize-first, or
    explore-first. No fixed modes, pipelines, or option counts.
  - Blends visual directions from the user's answers instead of pitching
    named styles; the visual-language catalog is agent-internal
    vocabulary, and every option is explained in simple prose.
  - Captures screenshots of its own mockups, self-reviews them, and
    commits the shots beside the mockup code as the durable visual
    record. Ingesting screenshots of existing UIs (any product) to
    extract a visual system is a secondary branch.
  - Offers, never mandates: standardization showcases (tokens,
    typography, components, motion), style research and mashups,
    existing-UI audits (mirror / reimagine / diegetic stances), and
    foundation-doc extraction when foundation docs exist.
  - Drops the old machinery: tier ordering, the AGENTS.md auto-installer,
    pipeline enforcement, and fixed option counts. The when-to-mock
    decision matrix survives as advisory prose only.

## Compatibility and operations

- **Breaking:** the `/ux-ui-design:{palette,components,motion,screens,flows,adopt}`
  invocations are gone — ask for what you want in natural language and
  the concierge adapts. The `.mockups/` layout and tech conventions are
  unchanged; the plugin README carries a 0.x migration note.
- **agile-workflow 0.16.16** ships the matching caller updates: `scope`,
  `epic-design`, `feature-design`, and `ideate` offer the concierge and
  record mock paths only when mocks are produced. Work-view prebuilt
  binaries were refreshed by CI after the bump.

## Verification

- Design and implementation each received one independent cross-model
  review at standard weight; all accepted findings were corrected and
  re-verified.
- Skill validator, repo style-contract greps, dead-name and
  dropped-machinery greps, marketplace catalog validity, Workbench
  validator, and the knowledge-index check all pass.

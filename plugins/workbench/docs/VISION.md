# Vision: Workbench

Workbench is a requirements-first software delivery plugin built around a small,
plain-Markdown `.work/` ledger. The ledger preserves the context an agent needs
across sessions while natural-language requests, project conventions, and
informed judgment shape delivery.

The user speaks in natural language: park an idea, scope a direction, research an
unknown, mock a journey, design a change, implement it, review it, scan an area,
finish a body of work, or summarize a release. Workbench uses judgment to decide
which activities the request needs and how far to carry them.

## Core commitments

- **Requirements come first.** Learn facts from the repository and current
  sources; ask the user for consequential product choices and constraints.
- **Research and UI evidence have distinct homes.** Grounded research lives in
  `.research/`; interactive requirements walkthroughs live in `.mockups/`. Work
  items reference both without absorbing their detailed artifacts.
- **UI is experienced before it is implemented.** Interactive mocks are part of
  requirements gathering. They progress toward a coherent working walkthrough,
  receive an agent visual-refinement pass when browser vision is available, and
  are shown to the user only after that pass.
- **Foundation documents carry standing truth.** They describe current or
  explicitly intended future vision, direction, architecture, high-level design,
  and durable contracts. They do not duplicate implementation details whose
  source of truth is code.
- **The item is the working record.** Requirements, evidence, decisions, design,
  execution notes, and review findings stay together when those sections are
  useful.
- **Completed work leaves active immediately.** Release-oriented projects keep
  small archive stubs that later collapse into one release summary. Projects
  without releases remove completed items outright. A terminal item is never
  allowed to sit stale in `.work/active/`.
- **Git events follow coherent delivery boundaries.** A feature and its
  implementation normally land together. Workflow bookkeeping alone does not
  earn a commit.
- **Preferences are shorthand, not machinery.** Projects may optionally set
  interaction, rigor, review, capability, execution, and commit postures;
  explicit user direction overrides them for the current request.
- **Engineering doctrine belongs to the project.** Setup may elicit
  `docs/PRINCIPLES.md`; Workbench carries the discovery method, not a mandatory
  architecture or testing philosophy. Concrete recurring structures evolve in
  the project's `.agents/skills/patterns/` catalog.
- **Maintenance follows evidence.** Substantial design looks for elimination,
  pattern fit, and cohesive refactoring. Pattern harvesting occurs when changed
  code reveals real recurrence at a stable delivery boundary.

# Vision: Workbench

Workbench is a compact, requirements-first environment for getting project work
done and preserving only the state another agent actually needs.

In a repository that has explicitly adopted Workbench, the user can speak
naturally about concrete project outcomes: clarify this tracked idea, scope this
change, finish these epics, scan for opportunities, park a selected finding,
commission durable research, or prepare a Workbench release summary. Workbench
adapts internally without asking
the user to choose workflow stages or an orchestration topology. It is not a
universal router for every request. Stateful skills stay inactive outside an
adopted repository; write-free `ideate` may explore before adoption, and
`setup` runs only when the user explicitly asks to adopt.

## Core commitments

- **Human requirements are load-bearing.** Learn repository facts first, then
  ask the user about consequential choices only they can settle.
- **Ideation precedes premature commitment.** Unclear or coupled decisions and
  valuable initial exploration of substantial or cross-cutting work route
  through `ideate`, even before adoption. It writes nothing until the user
  chooses a handoff. Established work remains in `work` when exploration would
  not materially change what gets designed.
- **Design is available, not imposed.** A dedicated `design` skill selects a
  new-work, prototype, refactor, performance, defect, UI/UX, or data/integration
  lens. It shapes implementation when discovery, alternatives, boundaries, or
  adjudication cannot be resolved confidently inline.
- **Recorded work is not automatically designed.** Before each feature or story,
  `work` checks design readiness and completes consequential design review before
  routing an implementation-ready item through `deliver`.
- **Delivery has one bounded owner.** `deliver` completes one ready feature or
  story. Direct delivery owns that item through closure; orchestrated delivery
  returns integration and pattern evidence to `work`, which retains the wider
  outcome and shared surfaces without repeating item-level review.
- **Autonomy follows intent.** Current request language and one repository
  default determine whether work is collaborative, adaptive, or autonomous.
  Autonomy changes participation and continuation, never permissions, scope,
  safety, or quality.
- **Scope is not a quality dial.** Design and review may resolve or check the
  authorized outcome, but they never invent requirements or enlarge it. Judge
  what is rational for the project's actual type, maturity, audience,
  deployment context, and stated risks; flag overbuilding instead of rewarding
  it.
- **Simplicity is durable and configurable.** Every workflow retains a hygiene
  floor, while one repository `simplification_posture` controls whether design,
  implementation, and review stay local, actively simplify the affected
  contract boundary, or challenge its full structure. Simplification preserves
  behavior and measured performance constraints and avoids obvious plausible
  regressions without manufacturing speculative optimization work.
- **Review depth is legible and bounded.** One repository `review_weight`
  governs design and implementation review for concrete Workbench workflows,
  while explicit user direction can override it for one such workflow. It does
  not govern loose requests merely because they occur in an adopted repository.
  `standard` gives each substantive design and completed integrated implementation
  boundary exactly one independent pass: correct, verify, and self-review findings
  without re-reviewing that target. `thorough` and `maximum` deliberately use
  multiple independent passes. Review weight controls review depth; the
  simplification posture independently controls simplification emphasis within
  design, implementation, and each review pass.
- **The ledger stays small and legible.** Features are the normal delivery unit.
  Epics group multiple feature outcomes, stories hold narrow slices, and nested
  hierarchy keeps that order without forcing wrapper items.
- **Planning preserves parallelism.** Ordering edges explain why one item should
  finish first. Independent work remains edge-free and available in parallel.
- **Commit shape follows the project.** Commit boundaries represent meaningful
  changes rather than ledger transitions. An optional project posture may favor
  feature, checkpoint, batch, or preserved history; the adaptive default follows
  repository practice and concurrency. Squashing is advisory and never justifies
  rewriting shared or published history.
- **One request may span several epics.** The orchestrating agent owns
  requirements, integration, verification, closure, and durable continuation
  across the full named boundary.
- **Research has a separate authority.** `.research/` contains attestations of
  externally fetched sources and grounded synthesis. It informs work without
  being rewritten to match project decisions.
- **Knowledge is discoverable, not duplicated.** A committed deterministic
  `.knowledge/index.json` indexes durable docs, research, and work while each
  source retains its own authority.
- **Foundations stay above delivery.** Repository-wide truth belongs in root
  foundations; durable sub-project truth may live in `docs/<sub-project>/` or
  `<sub-project>/docs/` according to repository convention. These documents
  remain high-level guidance rather than work tracking, qualification evidence,
  or item-specific implementation machinery. Workbench items are the work
  record. A user may explicitly approve one `docs/ROADMAP.md` convention: a
  small, dense ordering of longer-horizon goals whose entries link backlog items
  for detail and never track active work. Setup may offer it, but Workbench never
  introduces it by default.
- **Tests earn their keep.** Prefer meaningful behavior, contracts, boundaries,
  risks, and regressions over line coverage and implementation coupling. Reuse
  existing verification machinery and discuss substantial new infrastructure.
- **Scanning discovers; people disposition.** A shared `scan` capability adapts
  evidence, hypothesis, drift, evaluation, and provocation postures to the
  user's question. It verifies and clusters opportunities — identifying ones the
  ledger already tracks instead of presenting them as novel — then writes only
  the backlog or active handoffs the user selects; discovery never starts
  remediation by itself.
- **Release gates are optional project lenses.** Projects may select scan lenses
  for their release boundary and define what materially blocks them. Setup
  recommends from project evidence rather than installing a universal gate set,
  and unavailable preferred tools degrade to another credible inspection path
  instead of bricking release by default.
- **Maintenance follows evidence.** Cohesive cleanup can travel with delivery;
  standalone cleanup and refactors are normal bounded work; broader findings
  are parked. Confirmed coding and structural conventions guide work without
  making conformity an outcome. Setup creates one portable pattern index, while
  new references enter only through an explicit evidence-led maintenance
  feature after enough large-run work exists or the user requests extraction.
  No fixed cadence turns maintenance into a gate.
- **Release collapses temporary completion state.** Both completion postures can
  produce a version summary. A successful release removes retained completed
  outcome files and leaves concise release truth plus Git history.
- **Project and plugin version drift stays visible.** Setup stamps the loaded
  Workbench version into conventions. Stateful workflows use a difference as a
  helpful prompt to update Workbench and run setup, not as a lock on legitimate
  work. They stop only for a concrete schema or capability incompatibility.
- **Adoption is explicit.** Stateful Workbench skills require
  `.work/CONVENTIONS.md` with `owner: workbench`; only a direct request to
  initialize, adopt, migrate, upgrade, refresh, or reconcile may invoke `setup`.
  Detection, drift, and recommendations are never consent. Write-free `ideate`
  may run before adoption without creating project state.
- **Setup converges and greenfields continue.** Existing systems are
  semantically converted, validated, and removed. Setup classifies coding,
  structural, principle, and recurring-pattern truth into distinct authorities;
  it does not ask preference questions without evidence or audit patterns as a
  migration ceremony. A greenfield bootstrap flows
  directly into ideation using setup's shared foundation-document contract so
  the project can establish its initial truth without a second invocation or a
  competing format. Workbench does not preserve parallel workflow substrates,
  migration archives, or compatibility copies.

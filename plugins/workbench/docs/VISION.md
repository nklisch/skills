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
- **Runner topology is configurable.** Projects may prefer inline, adaptive, or
  orchestrated design, implementation, and review while users can override that
  default per request. Adaptive uses item size only as a light signal: it keeps
  small coherent work inline and adopts dedicated or mixed roles when their
  focus earns the handoff cost. Formal design and review depth do not disappear
  when work stays with the main agent.
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
- **Review depth is legible and convergent.** One repository `review_weight`
  governs design and implementation review for concrete Workbench workflows,
  while explicit user direction can override it for one such workflow. It does
  not govern loose requests merely because they occur in an adopted repository.
  `standard` gives each substantive design and completed integrated implementation
  boundary exactly one distinct pass: correct, verify, and self-review findings
  without re-reviewing that target. `thorough` deliberately uses multiple
  distinct passes until no unresolved blocking finding remains; material,
  minor, and nit findings may be parked, accepted, or rejected through
  outcome-owner adjudication. `maximum` converges until no unresolved material
  or blocking finding
  remains; minor and nit findings may remain. Workbench does not enforce a
  numeric pass cap: a project may state a preference in convention prose, while
  explicit user direction controls any limit or early stop. Review weight
  controls review depth; the simplification posture independently controls
  simplification emphasis within
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
- **Research has a separate, replaceable authority.** `.research/CONVENTIONS.md`
  names the provider that owns research artifacts, verification, indexing, and
  handoff. The bundled provider contains attestations of externally fetched
  sources and grounded synthesis; another provider may define a different
  substrate. Research informs work without being rewritten to match project
  decisions.
- **Research rigor checks distinct drift classes.** The bundled provider keeps
  investigation scale separate from verification rigor. Every brief meets the
  grounding floor; standard adds semantic source-support review, and full adds
  an isolated coverage, framing, and scope-drift evaluation.
- **Knowledge is discoverable, not duplicated.** A committed deterministic
  `.knowledge/index.json` indexes durable docs, research, and work while each
  source retains its own authority.
- **Foundations stay above delivery.** Repository-wide truth belongs in root
  foundations; durable sub-project truth may live in `docs/<sub-project>/` or
  `<sub-project>/docs/` according to repository convention. These documents
  remain high-level guidance rather than work tracking, qualification evidence,
  or item-specific implementation machinery. Workbench items are the work
  record. A user may explicitly approve Workbench recognition of a
  `docs/ROADMAP.md` planning document. Its structure, metadata, and narrative
  are user-owned; a small, dense set of backlog links is the recommended default,
  not a required format. `.work/` remains authoritative for operational state,
  and Workbench never introduces or rewrites the roadmap by default.
- **Agent instructions stay compact.** The canonical `AGENTS.md` holds the
  cross-agent ownership, routing, authority, output, and completion invariants
  needed before a skill takes over. Conditional mechanics and detailed policy
  remain in conventions, foundations, and the skills or references that own
  them rather than accumulating in an always-loaded managed block.
- **Tests earn their keep.** Prefer meaningful behavior, contracts, boundaries,
  risks, and regressions over line coverage and implementation coupling. Reuse
  existing verification machinery and discuss substantial new infrastructure.
- **Scanning discovers; people disposition.** A shared `scan` capability adapts
  evidence, hypothesis, drift, evaluation, and provocation postures to the
  user's question. It verifies and clusters opportunities — identifying ones the
  ledger already tracks instead of presenting them as novel — then writes only
  the backlog or active handoffs the user selects; discovery never starts
  remediation by itself.
- **Optional configuration stays in the user's hands.** Setup always offers
  optional Workbench configuration — execution posture, commit posture, release gates, roadmap
  recognition, and the Claude compatibility projection — as explicit opt-in,
  decline, or defer choices. Repository evidence can recommend a choice but
  never controls whether it is offered or silently adopts it. Release gates are
  project lenses: projects may select any useful scan concern, not only a
  Workbench-defined lens, and define what materially blocks their release.
  Unavailable preferred tools degrade to another credible inspection path
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
  semantically converted, validated, and removed. Beyond its built-in options,
  setup uses repository evidence to find unique conventions that may fall well
  outside Workbench's predefined categories, then classifies coding, structural,
  principle, and recurring-pattern truth into distinct authorities. It does not
  invent ungrounded preferences or audit patterns as a migration ceremony. A
  greenfield bootstrap flows
  directly into ideation using setup's shared foundation-document contract so
  the project can establish its initial truth without a second invocation or a
  competing format. Workbench does not preserve parallel workflow substrates,
  migration archives, or compatibility copies.

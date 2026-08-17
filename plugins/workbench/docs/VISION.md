# Vision: Workbench

Workbench is a compact, requirements-first environment for getting project work
done and preserving only the state another agent actually needs.

In a repository that has explicitly adopted Workbench, the user can speak
naturally about concrete project outcomes: clarify this tracked idea, scope this
change, finish these epics, park that finding, commission durable research, or
prepare a Workbench release summary. Workbench adapts internally without asking
the user to choose workflow stages or an orchestration topology. It is not a
universal router for every request, and its skills stay inactive outside an
adopted repository except when the user explicitly asks `setup` to adopt one.

## Core commitments

- **Human requirements are load-bearing.** Learn repository facts first, then
  ask the user about consequential choices only they can settle.
- **Ideation precedes premature scope.** A coherent outcome remains in `work`.
  An unclear outcome or several coupled human-owned decisions route through
  `ideate`, which writes nothing until the user chooses a handoff.
- **Design is available, not imposed.** A dedicated `design` skill selects a
  new-work, prototype, refactor, performance, defect, UI/UX, or data/integration
  lens. It shapes implementation when discovery, alternatives, boundaries, or
  adjudication cannot be resolved confidently inline.
- **Recorded work is not automatically designed.** Before each feature or story,
  `work` checks design readiness and completes consequential design review before
  implementation or delegation.
- **Autonomy follows intent.** Current request language and one repository
  default determine whether work is collaborative, adaptive, or autonomous.
  Autonomy changes participation and continuation, never permissions, scope,
  safety, or quality.
- **Scope is not a quality dial.** Design and review may resolve or check the
  authorized outcome, but they never invent requirements or enlarge it. Judge
  what is rational for the project's actual type, maturity, audience,
  deployment context, and stated risks; flag overbuilding instead of rewarding
  it.
- **Simplicity is durable.** Prefer maintainable intended states with fewer
  concepts and lower operating and verification cost, not merely smaller diffs.
  Do not hide hacks or oversized validation systems inside autonomous work.
- **Review depth is legible and bounded.** One repository `review_weight`
  governs design and implementation review for concrete Workbench workflows,
  while explicit user direction can override it for one such workflow. It does
  not govern loose requests merely because they occur in an adopted repository.
  `standard` gives substantive Workbench work one independent pass without
  manufacturing convergence or new scope.
- **The ledger stays small and legible.** Features are the normal delivery unit.
  Epics group multiple feature outcomes, stories hold narrow slices, and nested
  hierarchy keeps that order without forcing wrapper items.
- **Planning preserves parallelism.** Ordering edges explain why one item should
  finish first. Independent work remains edge-free and available in parallel.
- **One request may span several epics.** The orchestrating agent owns
  requirements, integration, verification, closure, and durable continuation
  across the full named boundary.
- **Research has a separate authority.** `.research/` contains attestations of
  externally fetched sources and grounded synthesis. It informs work without
  being rewritten to match project decisions.
- **Knowledge is discoverable, not duplicated.** A committed deterministic
  `.knowledge/index.json` indexes durable docs, research, and work while each
  source retains its own authority.
- **Foundations follow ownership.** Repository-wide truth belongs in root
  foundations; durable sub-project truth may live in `docs/<sub-project>/` or
  `<sub-project>/docs/` according to repository convention.
- **Tests earn their keep.** Prefer meaningful behavior, contracts, boundaries,
  risks, and regressions over line coverage and implementation coupling. Reuse
  existing verification machinery and discuss substantial new infrastructure.
- **Maintenance follows evidence.** Cohesive cleanup can travel with delivery;
  standalone cleanup and refactors are normal bounded work; broader findings
  are parked.
- **Adoption is explicit.** Every Workbench skill first requires
  `.work/CONVENTIONS.md` with `owner: workbench`. Without it, skills are ignored;
  only a direct request to initialize, adopt, or migrate may invoke `setup`.
- **Setup converges and greenfields continue.** Existing systems are
  semantically converted, validated, and removed. A greenfield bootstrap flows
  directly into ideation using setup's shared foundation-document contract so
  the project can establish its initial truth without a second invocation or a
  competing format. Workbench does not preserve parallel workflow substrates,
  migration archives, or compatibility copies.

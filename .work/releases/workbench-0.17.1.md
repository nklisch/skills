# workbench 0.17.1

Released 2026-08-29. Patch release for clearer bootstrap and foundation-document guidance.

## Delivered outcomes

- **feature-engineering-foundation-contract** — software bootstrap now treats
  stack and framework roles, repository topology, dependency direction,
  deployment and CI/CD shape, contract and persistence authority, testing
  layers, generation policy, and engineering gates as durable project truth.
  Setup and ideate resolve or explicitly defer consequential choices; design,
  work, and review reconcile later changes without imposing a fixed document
  bundle or diagram toolchain.
- Renamed the bootstrap-only temporary design convention from speculative specs
  to provisional specs while retaining speculative language where it describes
  the state of an individual assertion.

## Compatibility and operations

- No workflow schema, skill name, invocation, or managed-file migration changed.
- Existing repositories may adopt the richer engineering-foundation guidance
  through an explicitly requested Workbench setup refresh.

## Verification

- Channel parity passed: shared behavior remains agent-neutral, the early
  session context and its tests changed together, and the canonical split-sync
  check passes.
- Metadata integrity passed: all three canonical manifests agree before the
  bump; the bump script advances them and the dogfood Workbench stamp together.
- Affected skill validation, Workbench validation, research lint, knowledge
  index checks, hook unit tests, marketplace validation, and marketplace CI
  pass.

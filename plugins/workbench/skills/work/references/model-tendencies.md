# Model and Context Tendencies

Choose capability from the work rather than a permanent model-to-role table.
Model names age quickly; the tendencies below are more durable.

## Useful tendencies

- Strong reasoning models are most valuable for ambiguous requirements,
  architecture, cross-cutting contracts, difficult diagnosis, integration, and
  adversarial review.
- Faster coding models are effective for bounded implementation with clear
  acceptance, narrow write ownership, and cheap verification.
- Long-context models help when correctness depends on many documents or broad
  repository state, but extra context can also bury the decisive constraints.
  Curate the brief rather than dumping the repository.
- A fresh context catches assumptions the implementing context has normalized.
  Independence matters more than reviewer quantity.
- Different model classes can provide genuinely different error patterns, but
  “cross-model” is evidence diversity—not automatic authority.
- Agents tend to overproduce process when given many named phases, overfit to
  examples when given style catalogs, split work by checklist count, and report
  confidence in place of verification. Briefs should counter those tendencies.

## Selection

Apply the effective `capability` preference. `efficient` favors faster capable
models for bounded work and escalates when needed; `adaptive` selects from the
work's ambiguity and consequence; `maximum` favors the strongest available
capability. An explicit user-selected model overrides this preference for the
named role or scope.

Use the strongest available capability when mistakes are consequential,
requirements remain ambiguous, or the work crosses major boundaries. Use a
faster capable model for isolated work whose output the host can cheaply inspect
and verify. Keep work in the host when handing off its context would cost more
than delegation saves.

Reviewers return evidence and proposed findings. The receiving agent verifies
material claims against the repository and decides whether to fix now, create
active work, park for later, or reject the proposal.

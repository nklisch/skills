# Design Review Priorities

Design review asks whether this is the best justified solution to the right
problem—not merely whether the proposed design could work. A correct design can
still solve the wrong thing, miss an important consideration, duplicate an existing
system, or choose a needlessly costly approach. Correctness is a necessary baseline,
but checking it alone is the least of the review's contribution.

Prioritize these questions, grounding the answers in user intent and repository
evidence rather than treating the written design as self-justifying:

- **Right problem:** Does the design address the user's actual goal and success
  conditions, or just a symptom, assumed requirement, or convenient technical
  proxy? Challenge a mismatch with the original intent; ask for clarification
  when resolving it would change product scope.
- **Best-fit solution:** Is this the strongest maintainable approach for this
  problem and project? Compare credible alternatives where they could materially
  improve the outcome, including extending an existing mechanism or removing the
  need for new machinery. Explain trade-offs in user value, complexity, operating
  cost, and reversibility—not personal architectural preference. “Best” does not
  require an exhaustive search or an idealized system beyond the accepted scope.
- **Important omissions:** What unexamined assumption, interaction, constraint,
  or detail could change the choice or leave implementers guessing about something
  consequential? Follow representative usage and relevant failure paths through
  the design. Consider boundaries, ownership, data flow, integration, migration,
  recovery, and verification where they matter; do not demand every possible
  edge case or pre-write routine implementation details.
- **Repository fit and reuse:** Inspect the actual systems, abstractions, contracts,
  and conventions the change should build on. Is the design using the right
  existing owner and extension point, or creating a parallel authority or duplicate
  capability? Reuse earns preference when it fits; forcing a mismatched abstraction
  or preserving a poor boundary needs challenge too. Cite the relevant repository
  evidence rather than merely asking the designer to “consider reuse.”
- **Correctness baseline:** Check that the resulting choices are coherent, feasible,
  and preserve accepted behavior and guarantees. This remains required; it must
  not crowd out the higher-value questions above.

A finding need not demonstrate a correctness defect to be useful or material.
Show the missed goal, better alternative, consequential omission, or repository
mismatch, its evidence and uncertainty, and why acting on it improves this outcome.
Apply [review.md](review.md)'s scope, materiality, and owner-adjudication rules.
Do not turn alternatives into new requirements or restart settled choices without
reason. Apply the project's overbuilding calibration: broader ideas remain
separate, non-blocking follow-ups unless the user authorizes them.

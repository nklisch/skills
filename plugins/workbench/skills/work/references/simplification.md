# Simplification Posture

Use this posture across design, implementation, and every applicable review pass
for a concrete Workbench workflow. It controls how proactively the workflow
pursues behavior-preserving reduction; `review_weight` separately controls review
depth and repetition, while execution posture controls who performs each pass.

Resolve the effective `simplification_posture` from explicit user direction, `.work/CONVENTIONS.md`, then `balanced`:

| Posture | Expected behavior |
|---|---|
| `hygiene` | Keep the touched area clean. Prevent or remove obvious dead code, duplication, needless indirection, accidental complexity, and obvious algorithmic overwork introduced or exposed by the delivery. Do not broaden the boundary to hunt for refactors. |
| `balanced` | Apply the hygiene floor and actively seek cohesive simplification across the affected contract boundary. Eliminate, inline, consolidate, move, or split code when the payoff is clear and proportionate. |
| `structural` | Apply the hygiene floor and challenge the decomposition of the full authorized outcome boundary. Cohesive file breakouts, consolidation, and substantial restructuring are permitted when they produce a demonstrably simpler intended state. |

Every posture preserves observable behavior. It also preserves measured performance constraints and avoids obvious plausible regressions in affected code, such as worse algorithmic complexity, repeated work, or needless I/O. Do not turn this safeguard into speculative profiling, benchmarking, or low-level optimization when performance is neither constrained nor plausibly affected.

Simplicity means fewer durable concepts, branches, layers, options, compatibility paths, and lower operating and verification cost—not merely fewer lines or a smaller diff. A refactor must have a stated payoff; reject aesthetic churn and abstractions that only move complexity.

The posture does not expand the user's authorized outcome. Work within the affected boundary, including structure beyond changed lines only when it is cohesive with that boundary. Treat worthwhile unrelated simplification as a non-blocking follow-up and offer to park it.

Apply the posture by phase:

- **Design:** choose a shape that meets the posture before implementation hardens unnecessary structure. At `structural`, examine whether the current decomposition should survive rather than assuming existing files and modules are fixed boundaries.
- **Implementation:** perform cohesive simplification while delivering the outcome. At `hygiene`, remain local; at `balanced` or `structural`, take the broader action the posture authorizes when verification can credibly preserve behavior and relevant performance.
- **Review:** evaluate needless complexity and missed reduction at the configured posture. Findings inside the affected boundary may be material when the implementation falls short of that posture; unrelated improvements remain non-blocking.

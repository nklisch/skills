# Model Roles and Reasoning

Treat this as working model-selection guidance, not a benchmark claim or an
availability allowlist. Discover the models and thinking settings the harness
actually provides. Honor explicit user choices and project restrictions first.

Read [execution-posture.md](execution-posture.md) before assigning a role. Under
`inline`, the main agent performs every role. Separate review lenses without
claiming fresh-context independence or model diversity. A preferred model does
not require a new agent when the current context already fits the role.

## Role fit

**Astra / GPT-6 Astra is the preferred designer and orchestrator.** Current
operator calibration places it strongest overall for most work, especially
theory of mind: interpreting intent, anticipating what the user means, and
separating consequential human choices from routine implementation decisions.
This strength supports good judgment. It does not authorize guessed requirements.

| Role | Preferred fit | Guidance |
|---|---|---|
| Design and orchestration | Astra / GPT-6 Astra | Own solution shape, intent, synthesis, integration, and acceptance. Keep it as outcome owner across delegated work. |
| Implementation | Astra at `off`, `minimal`, or `low`; Sol at `low` or `medium` | Astra can implement challenging work at low effort when the design and contracts are settled. Sol is also useful for implementation at low–medium effort. Delegate for throughput or isolation, not merely to use a weaker model. |
| Scanning and finding | Luna; an available economical scanner | Luna primarily locates code, gathers evidence, and performs bounded scans. It can implement simpler settled changes, but is not the default for challenging implementation. |
| Specialist design input | Sol, Fable / Opus, or GLM 5.3 | Use a bounded specialist when its technical or creative perspective adds value. Astra remains the preferred lead designer. |
| Review | Sol, Fable / Opus, or GLM 5.3 | Use complementary scrutiny and require evidence. Astra's suitability as a dedicated reviewer remains unsettled, not a default recommendation or a prohibition. |

When Astra is unavailable, use a suitable permitted alternative if no confirmed
assignment prevents substitution or an authorized fallback covers it. Otherwise
disclose the proposed change and ask before that assignment. Continue independent
authorized work. Do not abandon the outcome or use a disallowed model merely to
reproduce a preferred lineup. Honor project restrictions on model families,
including any requirement for explicit approval.

## Thinking effort

For Astra:

- `medium` is sufficient for most tasks and is the general starting point.
- `off`, `minimal`, or `low` is a credible implementation choice, including
  challenging tasks with settled requirements, design, and interfaces.
- `high` or `xhigh` fits complex designs with coupled constraints or difficult
  trade-offs. Do not raise effort merely because a task is large or consequential.
- Increase effort when actual unresolved reasoning warrants it, not to perform rigor.

Use the harness's available equivalent for `off` or no thinking. Never request
an unsupported setting. Sol implementation normally uses `low` or `medium`.
Luna may use `high` or `xhigh` for detail-sensitive scanning and finding, or when
a simpler implementation benefits from more reasoning. Do not assign it
challenging implementation merely because more thinking is available. Other top
models may start at `medium` and increase for actual difficulty.

Respect the user's role and effort guidance over these defaults. For a durable
topology, show the proposed models and thinking levels, following
[model alignment](delivery-topology.md#communicate-before-execution). Reuse
explicit or project-confirmed choices rather than asking for the same alignment
on each assignment.

Reviewer effort follows the review problem, not the designer's setting. A design
created at high effort does not automatically require a high-effort review.
Consequence changes verification and review coverage, not automatically thinking.

## Keep review advisory

When Sol reviews, Astra should remain the orchestrator and actively adjudicate
its proposals. Sol's confidence, detail, or preferred architecture is not scope
authority. Require concrete evidence and a consequence inside the accepted
outcome. Reject invented requirements, speculative hardening, unnecessary
abstractions, and review-driven scope growth. Accept and verify real defects,
including ones that contradict Astra's original design.

Apply [review.md](review.md): reviewers propose, the outcome owner verifies and
decides. Explain rejected material findings briefly. Offer useful out-of-scope
ideas separately. Do not add another review pass merely to obtain agreement.
The same discipline applies to every reviewer, not only Sol.

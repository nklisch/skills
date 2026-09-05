# Execution Posture

Execution posture controls which agent contexts perform Workbench's core
delivery roles: design, implementation, and review. It is orthogonal to
autonomy, review weight, simplification posture, and commit posture: those
control decision authority, review rigor, simplification depth, and history
shape rather than topology. Scan, research, and other specialist workflows keep
their own proportionate fan-out rules unless the user explicitly asks for one
context across the wider workflow.

Resolve one effective posture from explicit user direction, the optional
`execution_posture` project convention, then `adaptive`. A user may override the
posture or assign a particular phase to the main agent or a role agent for one
request.

## Postures

- **`inline`** — the main agent performs design, implementation, review, and
  integration without spawning separate agents for those roles. Formal design
  and configured review depth still apply. Distinct review
  passes deliberately reset their lens and inspect the stable target again, but
  never claim fresh-context independence or model diversity.
- **`adaptive`** — keep stories and small coherent features inline unless
  specialization, isolation, fresh context, breadth, consequence, or throughput
  clearly earns the handoff and integration cost. Larger or cross-cutting
  features are a reason to consider dedicated or mixed roles, not a threshold;
  use them only when the handoff earns its cost. Mixed execution is valid: the
  main agent may design and delegate implementation, delegate design and
  implement, or retain both while delegating review.
- **`orchestrated`** — prefer dedicated design, implementation, and review
  agents when available. The main agent still owns requirements,
  synthesis, adjudication, integration, and the full requested boundary.

Story, feature, and apparent size are light signals, not gates. A large
mechanical change may stay inline; a small but specialized or high-consequence
change may benefit from another context. Keep tightly coupled work together and
never delegate merely to enact a ceremonial role split.

Deliver's **orchestrated delivery mode** describes parent ownership, integration
contracts, and return evidence inside a wider boundary; it does not select the
`orchestrated` execution posture. An orchestrated delivery unit may still run in
the main agent context under `inline`.

## Project and request preferences

Projects may add concise convention prose for a preferred mixed assignment such
as keeping design with the main agent while delegating settled implementation.
Do not add more enum values for role combinations. Adaptive routing may depart
from that preference when the current work clearly benefits, and explicit user
direction always wins.

If an explicitly requested role agent or cross-model review is unavailable,
disclose the limitation and ask how to proceed. Otherwise `adaptive` degrades to
credible inline execution when delegation is unavailable; report that coverage
fact without treating it as a blocker. `inline` is an intentional topology, not
an unavailable-review failure.

## Align models before multi-subagent execution

For any Workbench task requiring multiple sub-agents, align model choices with
the user in chat before execution starts. This includes sequential assignments,
exploratory work, scans, and research, not only delivery topology.

Discover the models and thinking settings the current harness actually provides.
Present the proposed roles, models, and supported thinking levels, with brief
reasons tied to the task and meaningful cost or capability trade-offs. Ask for
confirmation before dispatch unless explicit user choices or user-confirmed
standing preferences already cover the lineup. In that case, state the reused
alignment in chat without asking again. General autonomy is not model approval.

Honor user and project restrictions. Ask before substituting a model or effort
setting outside the aligned choices unless the user authorized that fallback.
If availability cannot be established, disclose the limitation and align a
credible alternative rather than guessing model identifiers. Keep routine
assignments within the agreed lineup moving without repeated approval.

Keep this alignment in the conversation. It does not require a new reference,
configuration file, model ranking, or durable topology. When topology already
exists, preserve confirmed choices there only as needed for continuation.

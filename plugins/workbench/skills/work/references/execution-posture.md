# Execution Posture

Execution posture controls which agent contexts perform Workbench's core
delivery roles: design, implementation, and review. It is orthogonal to
autonomy, review weight, simplification posture, and commit posture: those
control decision authority, review rigor, simplification depth, and history
shape rather than topology. The dispatch preference also covers supporting
exploration, scans, and research; their own verification requirements still apply.
Do not bypass an inline preference by calling delegation “preflight” or “discovery.”

Resolve the posture from explicit user direction, the optional `execution_posture`
project convention (including confirmed role exceptions in prose), then
`inline-first`. Missing configuration needs no new field or setup run. Ordinary
work honors existing settings. During an explicitly requested upgrade, setup
explains the changed default and offers to reconsider older adaptive/orchestrated
choices; it never silently migrates them.

## Postures

- **`inline-first`** — the default. Keep design, implementation, corrections,
  integration, and supporting discovery in the current context. Use one external
  reviewer for the coherent integrated implementation target under `standard`
  review, then correct and verify inline without a second pass. “External” means
  another agent context, not necessarily another provider or model family.
  `none` adds no pass; `light` adds one only when warranted; explicitly heavier
  weights and selected design review retain their own obligations. Selected design
  review stays inline unless chosen otherwise. Prefer one
  shared checkpoint when coherent, not a reviewer per delivery. This is not a
  mandate to hold unrelated work for one giant review. Do not spawn designers,
  implementers, or exploration helpers without a request or standing role exception.
- **`inline`** — the main agent performs design, implementation, review, and
  integration without spawning separate agents for those roles. Design reasoning,
  the aligned optional design-review approach, and configured review depth still apply. Distinct review
  passes deliberately reset their lens and inspect the stable target again, but
  never claim fresh-context independence or model diversity.
- **`adaptive`** — choose from the work in front of you, not a presumed role
  topology. Weigh a new context's contribution against lost continuity, briefing,
  and integration. Quick implementation and focused review often finish better in
  the current context. Use another context when specialization, isolation,
  independent challenge, breadth, or throughput adds enough value. The same
  judgment applies separately to design, implementation, and review; review is
  not automatically a delegated role. Mixed execution is valid.
- **`orchestrated`** — prefer dedicated design, implementation, and review
  agents when available. Designers author the assigned items' designs directly.
  The main agent still owns requirements, adjudication, integration, and the full
  requested boundary. Accountability does not require rewriting the design.

Item kind and size alone never select orchestration. Under `inline-first`, keep
large work inline too; propose delegation when it offers a material benefit, but
do not dispatch before that departure is authorized. Under explicit `adaptive`,
choose contexts by the work's needs. Keep tightly coupled work together under
every posture. Explain consequential departures or coordination plans, not routine
inline choices.

An assigned delivery inside a wider outcome carries parent ownership, integration
contracts, and return evidence. That assignment does not select the `orchestrated`
execution posture; its implementation may still stay in the current context.

## Project and request preferences

Use ordinary language for per-outcome overrides:

- “Orchestrate this” selects `orchestrated` for that outcome, subject to model
  alignment and existing scope/resource authority—not for future requests.
- Named roles assign only those roles; unspecified roles keep the effective default.
- “Propose an execution topology” or “show me the roles first” asks for a plan,
  not dispatch or implementation. Present it in chat; record an accepted plan in
  an existing item only when continuation needs it.
- “No delegation” selects strict `inline`; “review inline” changes review placement
  without waiving the applicable pass or changing implementation ownership.

Projects may keep concise convention prose for standing role exceptions, such as
inline delivery with an inline reviewer, or a preferred independent reviewer.
Do not add enums for each role combination. Explicit user direction wins; a
suggested topology or task size never overrides the current preference by itself.

If an explicitly requested role agent or cross-model review is unavailable,
disclose the limitation and ask how to proceed. Otherwise, when a stronger or
independent model is unavailable, use a credible same-model fresh context,
narrower assignment, or inline pass within the aligned fallbacks. Report missing
independence or coverage; model scarcity never lowers acceptance requirements.
The default external review under `inline-first`, like optional delegation under
`adaptive`, degrades to a credible inline pass when unavailable; disclose that it
was not independent. Do not block ordinary work on an unavailable default, and do
not claim an explicitly required independent review passed. Intentional `inline`
is not an unavailable-review failure.

## Align models before multi-subagent execution

For any Workbench task requiring multiple sub-agents, align model choices with
the user in chat before execution starts. This includes sequential assignments,
exploratory work, scans, and research, not only delivery topology.

Discover the models and thinking settings the current harness actually provides.
Shape the proposal with [model tendencies](model-tendencies.md), the item's
[implementation-difficulty assessment](../../design/SKILL.md#assess-implementation-difficulty)
when useful, and applicable
[repository model notes](model-notes.md), rather than a fixed role-to-model table.
Notes are qualified observations, never availability or user approval. Present
useful assignments, models, supported thinking levels, and authorized fallbacks,
with brief task-specific cost or capability trade-offs. Initial implementation,
complex correction/cleanup, and consequential review may use different models or
the same one; none is a mandatory extra agent or pass. Ask for confirmation before
dispatch unless explicit choices or user-confirmed standing preferences cover the
lineup. In that case, state the reused alignment without asking again. General
autonomy is not model approval.

Honor user and project restrictions. Ask before substituting a model or effort
setting outside the aligned choices unless the user authorized that fallback.
If availability cannot be established, disclose the limitation and align a
credible alternative rather than guessing model identifiers. Keep routine
assignments within the agreed lineup moving without repeated approval. A confirmed
reviewer/model choice covers later checkpoints within that agreement; do not ask
again just because the same role reviews another target.

Keep this alignment in the conversation. It does not require a configuration
file, a model ranking, or a durable topology. When topology already
exists, preserve confirmed choices there only as needed for continuation.

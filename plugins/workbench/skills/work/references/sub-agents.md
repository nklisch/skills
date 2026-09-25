# Sub-agents

This reference owns every use of another agent context in Workbench: whether to
use one, which models to propose, what a sub-agent receives, what it may write,
and how its work comes back. It applies to design, implementation, review, and
supporting exploration, scans, research, and backlog grooming alike. Skills keep
a one-line reminder of the rules that matter most and link here.

User and project instructions override this reference. Use whatever sub-agent
and model-discovery mechanism the current harness provides.

## Contents

- [When to use another agent](#when-to-use-another-agent)
- [Choose models](#choose-models)
- [Hand over](#hand-over)
- [What each agent may write](#what-each-agent-may-write)
- [No nesting](#no-nesting)
- [Handle returned work](#handle-returned-work)
- [When an agent is unavailable or not allowed](#when-an-agent-is-unavailable-or-not-allowed)

## When to use another agent

Execution posture decides which contexts perform design, implementation, and
review. It is separate from autonomy, review weight, simplification posture, and
commit posture. Resolve it from explicit user direction, then the optional
`execution_posture` project convention (including confirmed role exceptions in
its prose), then `inline-first`. Missing configuration needs no new field or
setup run. During an explicitly requested upgrade, setup explains a changed
default and offers to reconsider older adaptive or orchestrated choices; it never
migrates them silently.

- **`inline-first`** — the default. Keep design, implementation, corrections,
  integration, and supporting discovery in the current context. Use one external
  reviewer for the coherent integrated implementation target under `standard`
  review, then correct and verify inline without a second pass. "External" means
  another agent context, not necessarily another provider or model family.
  `none` adds no pass; `light` adds one only when warranted; heavier weights and
  selected design review keep their own obligations. Selected design review stays
  inline unless chosen otherwise. Prefer one shared checkpoint when coherent, not
  a reviewer per delivery, and do not hold unrelated work for one giant review.
  Do not spawn designers, implementers, or exploration helpers without a request
  or standing role exception.
- **`inline`** — the main agent performs every role without spawning agents for
  them. Configured review depth still applies; distinct passes reset their lens
  and inspect the stable target again, but never claim independence or model
  diversity.
- **`adaptive`** — choose from the work in front of you. Weigh a new context's
  contribution against lost continuity, briefing, and integration. Quick
  implementation and focused review often finish better in the current context.
  Use another context when specialization, isolation, independent challenge,
  breadth, or throughput adds enough value. Judge design, implementation, and
  review separately; mixed execution is valid.
- **`orchestrated`** — prefer dedicated design, implementation, and review agents
  when available. The main agent still owns requirements, adjudication,
  integration, and the full requested boundary.

Under every posture, keep tightly coupled work in one context. Delegate or
parallelize only when independent focus, specialized capability, isolation, or
throughput exceeds the handoff and integration cost. Item kind, size, and counts
of items, checklist entries, or lines never select orchestration or decide how
many agents to use; actual work independence does. A multi-unit outcome does not
itself authorize delegation, and an assigned delivery inside a wider outcome does
not select `orchestrated`. Do not bypass an inline preference by calling
delegation "preflight" or "discovery". Explain consequential departures or
coordination plans, not routine inline choices.

Ordinary language overrides the posture for one outcome:

- "Orchestrate this" selects `orchestrated` for that outcome, subject to model
  alignment and existing scope and resource authority.
- Named roles assign only those roles; unspecified roles keep the default.
- "Propose an execution topology" or "show me the roles first" asks for a plan in
  chat, not dispatch. Record an accepted plan in an existing item only when
  continuation needs it.
- "No delegation" selects strict `inline`; "review inline" changes review
  placement without waiving the applicable pass or changing implementation
  ownership.

Projects may keep concise convention prose for standing role exceptions, such as
inline delivery with an inline reviewer. Do not add enums for each combination.
Explicit user direction wins; a suggested topology or task size never overrides
the current preference by itself.

## Choose models

Before any Workbench task that uses several sub-agents, agree the models with the
user in chat. This includes sequential assignments, exploration, scans, and
research, not only delivery topology.

Discover the models and thinking settings the current harness actually offers.
Shape the proposal from the tendencies below, the item's
[implementation-difficulty assessment](../../design/SKILL.md#assess-implementation-difficulty)
when useful, and applicable [repository model notes](model-notes.md), not a
fixed role-to-model table. Present the assignments, models, supported thinking
levels, and authorized fallbacks with brief trade-offs. Ask before dispatch unless
explicit choices or confirmed standing preferences already cover the lineup; then
state the reused alignment. General autonomy is not model approval.

Ask before substituting a model or effort setting outside the agreed choices
unless the user authorized that fallback. If availability cannot be established,
say so and agree a credible alternative rather than guessing model identifiers.
Routine assignments within the agreed lineup proceed without repeated approval,
and a confirmed reviewer choice covers later checkpoints in the same agreement.
Keep this alignment in the conversation. It needs no configuration file or
ranking; when topology already exists, preserve confirmed choices there only as
continuation needs them.

Model names and rankings age quickly, so use durable tendencies:

- Strong reasoning models earn their cost on ambiguous requirements,
  architecture, cross-cutting contracts, difficult diagnosis, integration, and
  adversarial review.
- Faster capable models fit bounded implementation with clear acceptance, a
  narrow write surface, and cheap verification, including explicit mechanical
  correction lists.
- Long-context models help when correctness depends on many documents or broad
  repository state. Extra context can bury the decisive constraint, so curate the
  brief.
- A fresh context can catch assumptions the implementing context has normalized.
  Independence matters more than reviewer count.
- Different model families make genuinely different errors, but cross-model
  coverage is evidence diversity, not authority.

The same model may cover initial implementation, difficult corrections, design,
and review; none is a mandatory extra agent or pass. Do not infer cost,
capability, or equivalent thinking settings from a name. Effort follows the
reasoning problem: reviewer effort follows the review, not the designer's
setting, and consequence changes verification coverage rather than automatically
raising thinking level.

Briefs should counter known agent tendencies: overproducing process when given
many named phases, overfitting to examples, splitting work by checklist count
rather than real independence, and reporting confidence in place of
verification. A more capable model is not an evidence guarantee;
[verification](verification.md) owns the evidence standard.

## Hand over

A fresh context inherits nothing. Pass explicitly:

- the authoritative request or Workbench outcome, including its accepted scope;
- explicit exclusions and the owned write surface, if the role may write;
- relevant foundation truth and exact repository evidence pointers;
- the selected lens and effective simplification posture;
- the project's `## Overbuilding calibration` from `.work/CONVENTIONS.md`, or a
  note that it is absent and evidence-based judgment applies;
- for formal Workbench roles, the effective execution and review postures,
  aligned optional design review, the implementation review checkpoint and owner,
  and whether the unit returns before shared review; and
- the integration contract, committed target or base/head range, required
  checks, and return evidence.

Point a designer, implementer, or reviewer at the owning item, its design, any
linked [design attachments](design-attachments.md), and relevant parent or linked
contracts, and require it to read them. Do not rewrite or reconstruct the design
in the brief. A delivery assignment also names its delivery mode, parent outcome,
relevant conventions and patterns, and effective review weight, so the deliverer
does not rediscover rules the owner already loaded. Treat the calibration as a
proportionality lens, not a checklist or a new requirement.

Include this instruction exactly in every delegated design, implementation, or
review handoff:

> Do not invent requirements or expand scope. Work only from the user's original
> intent, the accepted item and design when present, applicable foundation truth,
> the project's overbuilding calibration, and the rational expectations of this
> project type. Treat unearned machinery as a defect. Return worthwhile ideas
> outside that boundary separately as non-blocking follow-ups.

For a loose design or review request in an adopted repository, pass only the
user's request and exclusions, the calibration or its absence, relevant evidence
pointers, and the instruction above. Ask for a concise proposal or findings. Do
not impose a Workbench packet, item lifecycle, review weight, convergence rule,
or closure obligation; the main agent stays responsible for the request.

This handoff is for a real context boundary. Do not compose a packet to yourself
or reload unchanged guidance when the current owner changes capabilities.

## What each agent may write

- **Designer — the assigned item.** Authors and revises the design directly in
  the assigned work item and linked attachments, preserving accepted requirements
  and unrelated sections. It does not edit code or foundations without a separate
  assignment, and returns the item path and brief notes, not the full design.
- **Implementer — the assigned surface.** Edits only its exact owned surface.
  Authority does not include scope growth or shared-catalog changes. A complex
  correction or cleanup assignment may improve structure within its boundary and
  simplification posture. Its self-check is not independent review.
- **Reviewer — proposals only.** Does not edit the stable target and does not
  commit merely to end its session; follow [review](review.md).
- **Scanners, research source gatherers, and backlog-grooming helpers —
  proposals only.** They read sources and return findings. They do not edit
  files, create reports or work items, write Workbench state, or implement fixes.

Only the outcome owner writes shared surfaces: the pattern catalog, repository
[model notes](model-notes.md), and parent items. Workers report pattern
candidates and model observations instead. Assign non-overlapping write
surfaces; use worktrees when isolation materially improves collision avoidance or
rollback, not merely because several units exist. Writing roles follow the
[Git handoff floor](git-posture.md).

## No nesting

Sub-agents do not spawn sub-agents. A reviewer does not implement its own
findings unless the owner explicitly returns the work to an implementation unit.

## Handle returned work

A worker's completion claim is not acceptance. The owner inspects returned
changes and evidence, verifies material claims, reconciles interfaces and
assumptions across units, deduplicates findings that span slices, and runs the
integrated checks. The owner adjudicates findings and proposals; worker
confidence grants no scope authority.

## When an agent is unavailable or not allowed

If an explicitly requested role agent or cross-model review is unavailable,
disclose the limitation and ask how to proceed. Otherwise use a credible
same-model fresh context, a narrower assignment, or an inline pass within the
agreed fallbacks, and report the missing independence or coverage.

A user or project instruction that forbids or limits spawning is handled the
same way: run the default external review, or any optional delegation, inline
and say plainly that it was not independent. The default review under
`inline-first` and optional delegation under `adaptive` degrade this way; they
never block ordinary work. Do not claim that an explicitly required independent
review passed. Model scarcity or a restriction never lowers acceptance
requirements. Intentional `inline` is not an availability failure.

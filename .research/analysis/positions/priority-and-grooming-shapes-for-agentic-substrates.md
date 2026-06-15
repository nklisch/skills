---
slug: priority-and-grooming-shapes-for-agentic-substrates
status: settled
authored: 2026-06-15
provenance: agent-synthesis
temporal_contract: extend-on-source-rev
grounds:
  - workflow-priority-grooming-for-agentic-substrates-landscape
---

# Priority and grooming, translated for an agent-drained work substrate

## What this position is about

A work-item substrate where items are markdown files with YAML frontmatter, and where an
automated agent may drain ready items by dependency-readiness then FIFO, is weighing two
agile-derived capabilities: an optional importance/value signal on items, and a backlog
grooming/hygiene capability. This position states the recommended *shape* for each, grounded in
the landscape synthesis `workflow-priority-grooming-for-agentic-substrates-landscape`. It is a
research-time settled stance, not a design — it constrains the design that follows without
pre-empting its trade-offs.

The governing finding: agile's priority and grooming practices were built for human teams whose
scarce resource is synchronous attention. The economics differ for an automated queue, so the
affordances must be *translated*, not copied — and the translation is uneven.

## Position 1 — Priority: prefer a structural ordering signal; treat a value field as optional and conditional

**For a machine-consumed queue, the strong priority signals are structural, and a hand-assigned
value score is the weak form.** Of all surveyed agile/lean mechanisms, only two are genuinely
machine-sortable: a computed numeric score (WSJF/CD3 [wsjf-blackswanfarming]{1}, RICE
[rice-intercom]{1}), which decays and is gameable, and a ranked 1-N position, which is
inflation-proof but human-maintained [priority-inflation-agileforall]{3}
[ordered-backlog-agileplays]{1}. Every categorical scheme — MoSCoW, Kano, value/effort,
ordinal P1/P2/P3 — is a *filter, not an ordering*, and tiered flags inflate to uselessness
without an enforced scarcity constraint ("top 97 items as priority 1 … a useless list")
[priority-inflation-agileforall]{2}. Story points are not a priority signal at all
[story-points-agility-at-scale]{3}.

Independently, real autonomous agent systems order the ready set by structural graph properties
(critical-path depth / blocking potential [ai-metropolis-priority-queue]{4}, deadline urgency),
not value scores. **A readiness + FIFO drainer already carries a total order.** An added value
signal is therefore redundant *unless* it identifies items whose cost of deferral is high — and
even structural priority over plain FIFO pays off measurably only when the dependency graph is
dense [ai-metropolis-priority-queue]{4}.

What follows for the design:

- **Optionality is the hard requirement, not a nicety.** Absent → behaves exactly as today
  (readiness + FIFO). The field earns its place only for deployments whose backlogs are large
  and value-dispersed enough that "what's worth doing next among ready items" is a real question
  structure cannot answer.
- **If a value field is added, prefer the shape with the least failure surface.** The evidence
  most strongly warns against deploying a *categorical flag as an ordering signal* (inflation +
  no intra-tier order). A maintained ordinal rank, or a recomputed score carrying a
  computed-date, are the better-grounded ordering shapes; a categorical tag is at best a coarse
  *filter*. *(Whether a filter-only tag suffices, or true ordering is needed, is a design
  trade-off this position deliberately leaves open — it turns on how the signal is consumed.)*
- **Rejected as a primary ordering mechanism: an uncapped categorical priority flag**
  (`p1|p2|p3` / `high|med|low`) with no scarcity constraint. It is the single most-documented
  failure mode in the priority literature [priority-inflation-agileforall]{2}
  [priority-flags-agilefixer]{2}. If a categorical tag is adopted at all, it should be scoped as
  a filter, and any ordering use must come with an enforced cap on the top tier.
- **The deepest reframing: value most plausibly belongs at decomposition/admission time, not as
  a runtime queue sort.** In agent systems the surviving locus of value judgment is *which work
  is admitted to the queue*, after which draining runs readiness-first. A priority signal may be
  more useful as an admission/scoping input than as a per-item runtime ordering key.

## Position 2 — Grooming: a propose-not-prune capability, mechanizing only what date/metadata supports

**A grooming capability is warranted, but it surfaces candidates for human triage and never
auto-prunes.** This is the most strongly-sourced convergence in the synthesis, agreed across
three independent literatures: scoring frameworks build in human re-evaluation [rice-intercom]{4};
a large maintainer survey wants AI as "a second pair of eyes" that does "not intervene unless
asked" [github-models-maintainer-survey]{1}, with approve-before-acting tooling
[dosu-issue-triage]{1}; and even autonomous execution systems retain human selection at the
trust boundary [metabase-reprobot-triage]{10}.

What follows for the design:

- **Mechanize only what date/metadata arithmetic supports, without claiming more.** Item age,
  time-since-last-update, presence of owner / release-binding / exempt label are mechanizable —
  the signal set the canonical stale-bot uses (mark→close lifecycle, reactivation on update,
  dry-run, graduated exemptions, and a "mark, never auto-close" mode) [actions-stale-github]{5}.
  Duplicate/near-duplicate detection is *partially* mechanizable via embedding similarity with
  human confirmation [genai-backlog-grooming-empirical]{8} [dosu-issue-triage]{1}. Supersession
  and content-relevance are **not** mechanizable without an explicit link or human judgment.
- **Precondition: a last-touched signal.** Age-based staleness detection is impossible if items
  carry only a creation date — "parked long ago, untouched" cannot be distinguished from "parked
  recently." An `updated`/last-touched field is a prerequisite the capability depends on, not an
  optional enrichment. This is the one structural change grooming *requires* before it can run.
- **Findings route as proposals; destructive acts stay operator-confirmed** — mirroring how the
  substrate's existing gate/handoff seams already produce items/findings rather than mutating
  state silently.
- **The disposition default for dead items inherits from the substrate's terminal-tier
  convention.** There is a genuine `contradicts` in the literature — close-as-cleanup
  [actions-stale-github]{5} vs. archival-with-memory [backlog-antipatterns-age-of-product]{5} —
  bridged by a mark-without-close mode [actions-stale-github]{10}. A grooming design should not
  re-decide this; it should route DONE/SUPERSEDED through whatever terminal-tier retention the
  substrate already defines.
- **Cadence is configurable, not assumed-continuous.** Agent economics make continuous hygiene
  cheap, but "continuous because it's cheap" is not unconditionally better: continuous hygiene
  can flood the ready queue faster than it drains ("acceleration whiplash")
  [augmentcode-ai-backlog-grooming]{7}. Leave cadence (continuous vs. wave/batch) to the
  deployment.

## What is ceremony and what is lesson (the translation summary)

- **Dissolve as ceremony:** standup/status sync, priority pointing, the *scheduled* grooming
  cadence. These solved human coordination/attention-batching problems an automated substrate
  does not have.
- **Survive as lessons, re-expressed structurally:** dependency ordering (already mechanized as
  readiness-gating), value-ordering (relocated to decomposition/admission time), entropy control
  (continuous detection + human-confirmed pruning), and definition-of-done/scope-integrity —
  which *strengthens* into automated verification gates, because agents rationalize incomplete
  work at scale [devcommunity-agents-backlog-coffee]{9}.

*(The ceremony-vs-lesson verdicts are synthesis inference over a disclosed-thin agentic
literature — see the synthesis brief's coverage gap. They are well-corroborated where the
priority and grooming facets overlap, but are reasoning, not settled empirical finding.)*

## Confidence and honest limits

The priority and grooming *classical* groundings are solid (canonical and well-corroborated
secondary sources). The *agentic-translation* layer is thin and partly inferential: peer-reviewed
comparative studies of agent-queue vs. human-team backlog practice essentially do not exist yet;
the freshest claims rest on practitioner accounts and single-system evaluations. The
recommendations above are therefore stated as *shapes to prefer and traps to avoid*, not as
settled empirical certainties — and both capabilities are recommended as **optional, inert-when-
absent** precisely so a deployment that disagrees is unaffected.

## Revisit if

- Comparative empirical studies of human-team vs. agent-queue backlog practice publish — the
  agentic inferences would firm up or break.
- Evidence emerges on value-based work selection at decomposition/admission time — would
  directly inform whether a value signal belongs there rather than on the queue (the open
  question Position 1 names but does not resolve).
- The substrate's drainer gains a non-trivial dependency graph in practice, making structural
  priority (beyond FIFO) measurably worth it where it currently is not.
- A categorical priority tag is adopted and inflation is observed — confirming the rejected-
  alternative guard and triggering a move to scarcity-capped or ordinal/score ordering.

---
title: "Priority Signaling and Backlog Grooming for an Agent-Driven Work Substrate: Landscape Synthesis"
kind: landscape
provenance: agent-synthesis
updated: 2026-06-15
synthesizes:
  - priority-signaling-mechanisms-landscape
  - backlog-grooming-discipline-landscape
  - agentic-prioritization-hygiene-landscape
research_handles:
  - wsjf-blackswanfarming
  - wsjf-yip-safe-critique
  - rice-intercom
  - moscow-dsdm-agile-business
  - priority-inflation-agileforall
  - priority-flags-agilefixer
  - ordered-backlog-agileplays
  - story-points-agility-at-scale
  - deep-pichler
  - deep-cohn
  - scrum-guide-2020-refinement
  - large-backlog-scrumalliance
  - backlog-antipatterns-age-of-product
  - actions-stale-github
  - dosu-issue-triage
  - github-models-maintainer-survey
  - cost-of-delay-planview
  - bmw-agents-task-queue
  - dyntaskmas-priority-calculation
  - ai-metropolis-priority-queue
  - thebotcompany-self-organizing-mas
  - augmentcode-ai-backlog-grooming
  - genai-backlog-grooming-empirical
  - metabase-reprobot-triage
  - devcommunity-agents-backlog-coffee
---

# Priority Signaling and Backlog Grooming for an Agent-Driven Work Substrate: Landscape Synthesis

## Purpose

Two capabilities are under consideration for an item-tracking substrate where work items are
markdown files with YAML frontmatter and the consumer of the work queue may be an **automated
agent** that drains ready items by dependency-readiness and then FIFO: (1) an optional
importance/value signal on items, and (2) a backlog grooming/hygiene capability that detects
dead, superseded, duplicate, and stale items. Both borrow affordances from agile/lean practice.
This synthesis grounds whether — and in what translated form — those affordances should be
adopted, drawing on three facet briefs: priority-signaling mechanisms, backlog-grooming
discipline, and the agent-driven translation of both.

The throughline: agile's priority and grooming practices were built for **human teams** whose
scarce resource is synchronous attention. An automated queue has different economics, and the
affordances translate unevenly — some survive as machine-readable signals, several are revealed
to be ceremony that dissolves, and a few encode durable lessons that must be re-expressed
structurally rather than copied.

---

## Finding 1 — Machine-readable priority is structural; value-scores are the weak form

The priority facet classified every common agile/lean mechanism by whether its output is a
**machine-sortable ordering** or a **filter / human-ceremony artifact**:

- **Genuinely machine-sortable:** a computed numeric score (Reinertsen's monetary CD3/WSJF
  `WSJF = Cost of Delay ÷ Duration` [wsjf-blackswanfarming]{1}; RICE [rice-intercom]{1}). A
  caveat on these scores is *decay* — they bake in estimates made by particular people at a
  particular time, so they drift from reality unless recomputed at each ordering pass.
  *(This decay/recompute point is synthesis inference: the fetched WSJF source does not itself
  address score stability over time or resorting frequency, and the claim is not source-attested
  — it follows from the time-sensitivity of cost-of-delay inputs.)* The fetched sources do show
  the human-judgment dependency directly: RICE's own authors treat the score as an input to human
  re-evaluation, "not a hard and fast rule" [rice-intercom]{4}.
- **Machine-sortable and inflation-proof:** ranked position in a total order (1-N), where
  position *is* priority — recommended across multiple independent practitioner sources as the
  structural cure for categorical-flag failure [priority-inflation-agileforall]{3}
  [ordered-backlog-agileplays]{1} [priority-flags-agilefixer]{3}. Its only cost is the human
  discipline of maintaining a consistent global order.
- **Filter only, never an ordering:** MoSCoW categories [moscow-dsdm-agile-business]{5},
  value/effort quadrants, Kano categories, and ordinal P1/P2/P3 flags. Within a tier these
  provide no sequencing, and tiered flags inflate to uselessness without a scarcity
  constraint — the documented "top 97 items as priority 1 … a useless list"
  [priority-inflation-agileforall]{2}, with cross-person inconsistency compounding it ("one
  man's Blocker is another man's P4") [priority-flags-agilefixer]{2}.
- **Not a priority signal at all:** story points — an effort estimate, not a value or urgency
  signal, and subject to Goodhart's-Law gaming when treated as a target [story-points-agility-at-scale]{3}.

The agentic facet then found, *independently*, that real autonomous agent systems do not use
business-value scores for queue ordering at all. Priority within the ready set is a **structural
graph property**: critical-path depth / blocking potential (AI Metropolis: which ready task, if
delayed, blocks the most subsequent work [ai-metropolis-priority-queue]{4}; DynTaskMAS's formal
critical-path ratio [dyntaskmas-priority-calculation]{2}), deadline urgency, and dependency
satisfaction as the hard primary gate [bmw-agents-task-queue]{1}.

**The two facets converge on one conclusion:** for a machine-consumed queue, the strong priority
signals are structural (dependencies, position), and a hand-assigned *value* score is the weakest
of the candidate shapes — decaying, gameable, and the least aligned with how automated draining
actually selects work.

---

## Finding 2 — A value-priority field earns its place only conditionally

A direct consequence of Finding 1, and the sharpest point for the priority-signal design: an
agent already draining by readiness + FIFO **has a total order**. An added value-priority signal
is redundant *unless* it reliably identifies items whose cost of deferral is high
[wsjf-blackswanfarming]{1} — the one thing structural ordering does not capture.

The agentic evidence bounds *when* even structural priority pays off: AI Metropolis measured a
throughput gain from priority-aware scheduling **only when the dependency graph is dense**; on a
shallow graph, readiness-FIFO performed nearly as well [ai-metropolis-priority-queue]{4}. So the
value of *any* priority refinement over plain readiness-FIFO is conditional on backlog topology,
not unconditional.

This does not argue against a priority field — it argues for **optionality as a first-class
property**: the field must be inert when absent (the substrate behaves exactly as today), and its
worth is realized only by deployments whose backlogs are large and value-dispersed enough that
"what's worth doing next among the ready items" is a real question structural ordering can't
answer. Where the strongest classical evidence points — to either a recomputed cost-of-delay
score or a maintained 1-N rank — both are heavier than a categorical flag, and a categorical flag
is precisely the shape the evidence most warns against deploying as an *ordering* signal.

---

## Finding 3 — Grooming's economics invert for agents, but "continuous" is not free

Established human grooming discipline is well-settled: the DEEP criteria — Detailed-appropriately,
Estimated, Emergent, Prioritized [deep-cohn]{1} [deep-pichler]{1} — frame a backlog as a *living*
ordered list whose contents are continuously added, reprioritized, and **removed when no longer
relevant** [deep-pichler]{3}. The 2020 Scrum Guide treats refinement as ongoing, with no
prescribed cadence — and, notably, gives **no guidance at all on removing or archiving** items
[scrum-guide-2020-refinement]{3}. Practitioners fill that gap: a 3–6 sprint horizon as the
healthy size, with explicit "zombie item" naming — "forgotten, irrelevant items added long ago,
never prioritized" — as the target of an Eliminate step [large-backlog-scrumalliance]{5}.

The agentic facet's load-bearing observation is that the *economics* of this work invert. Human
grooming is batched into ceremonies because synchronous human analysis is expensive; an agent that
reads codebase state can run staleness and duplicate checks as cheap background computation,
unbatched [augmentcode-ai-backlog-grooming]{7}. An empirical study of AI-assisted grooming
reported high precision and a substantial time reduction on duplicate detection and merge/delete
proposals [genai-backlog-grooming-empirical]{8} *(a preprint reporting precision; recall was not
characterized — high precision bounds the false-positive rate, not coverage)*.

But "continuous because it's cheap" is **not** unconditionally better, and the same facet's
disconfirming analysis says so: augmentcode warns of "acceleration whiplash" — faster upstream
throughput need not yield faster delivery, and continuous hygiene can flood the ready queue faster
than agents drain it [augmentcode-ai-backlog-grooming]{7}. The lesson survives translation; the
optimal *cadence* (continuous vs. wave/batch) is regime-dependent and unsettled.

---

## Finding 4 — What's mechanizable vs. what needs human judgment (the grooming design surface)

The grooming facet maps the detection surface precisely, and it maps cleanly onto frontmatter:

- **Mechanizable by date/metadata arithmetic** (no NLP): item age, time-since-last-update,
  presence of an owner / release-binding / exempt label — exactly the signals the canonical
  `actions/stale` bot uses (default 60-day staleness threshold; mark→close lifecycle; reactivation
  on any update; dry-run mode; graduated label/milestone/assignee exemptions; and a
  `days-before-close: -1` "mark, never auto-close" mode) [actions-stale-github]{1}
  [actions-stale-github]{5}.
- **Partially mechanizable** (embedding similarity, human confirms): duplicate / near-duplicate
  detection [genai-backlog-grooming-empirical]{8} [dosu-issue-triage]{1}.
- **Not mechanizable without an explicit link or human judgment:** supersession ("a later shift
  obsoleted this") and content-relevance ("no longer matches the goal"). These need either an
  explicit `supersedes:`-style field or human review.

A concrete substrate gap surfaces here: items that carry only a `created` date cannot distinguish
"parked long ago and untouched" from "parked recently" — an `updated` (or last-touched) signal is
the **precondition** for any age-based staleness detection at all. This is a prerequisite the
grooming capability depends on, not an optional enrichment.

---

## Finding 5 — Propose-not-prune is the most strongly-sourced convergence

Every facet, from three different literatures, lands on the same human-in-the-loop fence:

- **Priority:** scoring frameworks build human re-evaluation into the workflow by design; RICE's
  authors call the score a starting point, not a decision engine [rice-intercom]{4}.
- **Grooming:** the GitHub maintainer survey (n=500+) found the dominant preference is for AI as
  "a second pair of eyes" that does "not intervene unless asked" [github-models-maintainer-survey]{1};
  Dosu's triage generates previews maintainers "review, edit, and approve before posting"
  [dosu-issue-triage]{1}; the `actions/stale` mark-phase is a nudge, not a deletion
  [actions-stale-github]{6}.
- **Agentic:** even fully-autonomous execution systems retain **human selection at the trust
  boundary** — Metabase's Repro-Bot requires a manual tag to run, for security reasons, because
  the input (public issues) is untrusted [metabase-reprobot-triage]{10}.

For a grooming capability this is decisive: it should **surface candidates with enriched signals
and route them as proposals for human triage — never auto-prune**. Destructive acts (archive,
merge, delete) stay operator-confirmed. This mirrors how the substrate's existing gate/handoff
seams already behave (findings/items produced, not silent mutation).

---

## Finding 6 — Ceremony vs. lesson: the explicit translation table

The cross-cutting question — copy the *lesson*, not the *ceremony* — resolves into a clear split.
The agentic facet's framing is *largely inferential* (see Coverage gap below), but it is
corroborated by the priority and grooming facets where they overlap. **The "Verdict" column
below is synthesis inference, not a source-attested classification** — the cited handles ground
the *mechanism* described in each row's translated form, not the ceremony-vs-lesson judgment
itself, which is this synthesis's reasoning over the disclosed-thin agentic literature:

| Human-team practice | Verdict at agentic altitude | Translated form |
|---|---|---|
| Daily standup / status sync | **Ceremony — dissolves** | State tracked mechanically in the item substrate [thebotcompany-self-organizing-mas]{6} |
| Priority pointing / story-point voting | **Ceremony — dissolves** | Structural ordering: dependency + critical-path position [ai-metropolis-priority-queue]{4} [dyntaskmas-priority-calculation]{2} |
| Scheduled grooming session | **Ceremony — cadence dissolves** | Continuous (or wave-batched) automated hygiene [augmentcode-ai-backlog-grooming]{7} |
| Dependency ordering (DAG) | **Lesson — survives, strengthened** | Mechanical readiness-gating, already present in the substrate [bmw-agents-task-queue]{1} |
| Value ordering of work | **Lesson — survives, relocates** | Moves from per-sprint re-negotiation to **decomposition-time** input, then readiness-first thereafter |
| Entropy control (grooming exists) | **Lesson — survives, mechanism transforms** | Continuous automated detection + human-confirmed pruning [genai-backlog-grooming-empirical]{8} |
| Definition of done / scope integrity | **Lesson — survives, strengthened** | Must be encoded as automated verification gates — agents *rationalize* incomplete work at scale [devcommunity-agents-backlog-coffee]{9} |

The relocation of value-ordering (row 5) is the deepest finding for the priority signal: in agent
systems, value judgment most plausibly enters when the queue is *populated* (which work to
decompose and admit), not when a ready item is *picked*. That reframes a priority field as
potentially more useful at admission/scoping time than as a runtime queue sort key.

---

## Contradictions and tensions (carried, not resolved)

- **Closure-as-cleanup vs. archival-with-memory** (`contradicts`): the OSS/stale-bot ecosystem
  *defaults to closing* stale items [actions-stale-github]{5}; the Scrum-practitioner community
  favors an "Anti-Product Backlog" preserving rejected ideas [backlog-antipatterns-age-of-product]{5}.
  The `days-before-close: -1` mark-without-close mode bridges them [actions-stale-github]{10}. A
  grooming design must choose a default disposition for DONE/SUPERSEDED items — and the
  substrate's own terminal-tier retention convention is the natural place to inherit that choice.
- **Continuous vs. batched grooming** (`tension`): cheap continuous hygiene vs. acceleration
  whiplash / queue-flooding [augmentcode-ai-backlog-grooming]{7}. Unsettled; a design should make
  cadence configurable rather than assume continuous is best.
- **MoSCoW structural test vs. observed inflation** (`tension`): the binary cancel-test should
  constrain Must-Have inflation [moscow-dsdm-agile-business]{2}, yet inflation is reported as a
  common failure regardless — "everything being labeled a 'Must-Have' … diluting the framework's
  efficacy" [moscow-horkan-critique]{1}. Reinforces that categorical priority needs an *enforced*
  scarcity constraint, not just a definitional one.

---

## Coverage gap (substrate-before-stance)

The agentic-translation facet is **thin and largely inferential**, and says so explicitly:
peer-reviewed comparative studies of agent-queue vs. human-team backlog practice essentially do
not exist yet as a genre; the freshest claims (the rationalization failure mode
[devcommunity-agents-backlog-coffee]{9}; the continuous-hygiene economics
[augmentcode-ai-backlog-grooming]{7}) rest on practitioner blog posts and single-system
evaluations, not settled literature. Two specific gaps are named rather than papered over:

1. **Value-based work selection at the top of an agentic pipeline** — which epics to decompose
   and admit (as distinct from which ready task to pick) — is unaddressed in the surveyed
   literature. This is *upstream* of both capabilities under consideration (both concern the
   existing backlog), so the design need not resolve it — but it is the most plausible home for a
   surviving notion of value-priority, and worth a focused follow-on if it proves load-bearing at
   design time.
2. **The rationalization failure mode** — agents closing items without completing their intent —
   is a backlog-hygiene problem unique to the agentic altitude, documented only in practitioner
   accounts. It implies hygiene must verify *intent completion*, not just *status closure*.

Acquisition candidates (Reinertsen's *Principles of Product Development Flow* as the
queue-theory/cost-of-delay anchor; the named arXiv papers on agentic SDLC and outcome-oriented
evaluation) are recorded for the acquisition queue; none changes the recommendations below, which
is why this engagement did not block on fetching them.

---

## Revisit if

- Comparative empirical studies of human-team vs. agent-queue backlog throughput publish — the
  agentic facet's inferences would move from inference to grounded findings.
- Evidence emerges on value-based work selection at decomposition/admission time for agent
  pipelines (Coverage gap #1).
- A primary source for Reinertsen's flow/cost-of-delay treatment becomes accessible — the
  cost-of-delay framing here is sourced through secondaries.
- The rationalization failure mode is studied systematically (Coverage gap #2).

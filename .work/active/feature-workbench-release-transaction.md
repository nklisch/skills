---
id: feature-workbench-release-transaction
kind: feature
status: active
tags: [plugin]
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-08-22
updated: 2026-08-22
---

# Workbench release transaction — mechanical checks at the release boundary

## Brief

Contribution proposal from SNC (mesh, 2026-08-22): workbench's release skill
has a one-line check gesture where agile-workflow's release-deploy has a
transaction contract. Verified against this branch: the skill's entire check
affordance is "Run the Workbench validator and project-defined release
checks" — unnamed, unschema'd, no failure semantics. Four guarantees are
missing for prod-surface repos:

1. **Mechanical non-discretion** — configured checks run because the contract
   requires it, not agent judgment ("lenses during work, contract at the
   boundary").
2. **Findings become tracked work** — check findings enter `.work/active/`
   as items, not a report that evaporates.
3. **Blocking + idempotency** — the release halts on open findings and is
   safe to re-run after they resolve.
4. **Audit record** — the release summary records the check list, outcomes,
   and finding item ids.

Self-review by the implementing context is what a prod release boundary
exists to prevent; `review_weight` covers the review axis, nothing covers
the domain-scan axis over a release bundle's diff. SNC platform/ (public
prod site) runs five configured gates today and would convert to Workbench
if the transaction existed — the strictest-config consumer as pilot.

## Design (accepted shape)

- **Opt-in config**: `release_checks: [<check>, ...]` in
  `.work/CONVENTIONS.md`. Absent key = current pure-judgment behavior;
  present key activates the transaction. Mirrors `review_weight`/`autonomy`
  as project shorthand, not machinery.
- **Transaction semantics**: checks run BEFORE summary write and stub
  removal; a failing check halts; findings enter `.work/active/` as normal
  items (tags carry the check name; body references the release); the
  release blocks on open findings and re-runs idempotently after fixes.
  Primitives already exist (`blocked_by`, `## Blocker`, `status`).
- **Fresh-eyes mandate** for scanner-type checks — dispatched to fresh
  context, never self-reviewed by the releasing session.
- **Audit**: the release summary carries the check list, per-check outcome,
  and finding item ids.
- **Finding disposition semantics** (SNC design add, accepted): a finding
  resolves two ways — by fix, or by explicit receiver adjudication (wontfix
  or deferred → parked with the recorded reason). An unadjudicated finding
  blocks; an adjudicated one does not. The audit record lists dispositions
  alongside outcomes, so a single low-value finding cannot wedge a release
  with no sanctioned exit. This is the standard review doctrine (findings
  are proposals the receiver must verify and adjudicate) stated in release
  terms.
- **Doctrine compatibility**: Workbench already accepts mechanical invariants
  at the completion/release boundary (atomic completion transition, no
  lingering stubs, `release_mode` conventions). This is that shape, not a
  stage-machine port.

## Open questions — settled 2026-08-22 (SNC design review)

1. **Scanner library gap — resolved: not a blocker.** The tool-heavy gates
   (security, tests) are exactly the ones code-audit ships. The three
   judgment-heavy gates (cruft, docs, patterns) carry fine on one-line
   descriptions; platform's can be lifted nearly verbatim from the
   agile-workflow gate skill scopes (e.g. gate-cruft's "dead code, stale
   comments, low-value tests, compatibility shims, defensive bloat,
   over-abstraction"). Doctrine note: Workbench's maintenance boundary
   already owns pattern *harvesting* at delivery time, so a patterns
   release_check is only the drift-verification half (catalog reflects the
   bundle's changed code), not the write. Revisit-if-pilots-accumulate
   stands. Docs must include one or two example `release_checks` entries
   showing intended description precision, so projects don't under-specify
   ad-hoc passes.
2. **Halt semantics — resolved: halt-always** when the key is present; no
   per-check binding config until a pilot demands it. Platform (the live
   halt-binding config) IS the pilot, so the demand path exists.

## Non-goals (from the proposal, honored)

No binding guards, no epic-cohesion rules, no per-item stage machinery.
Strictly a boundary contract.

## Delivery notes

This item lives on the research-canon branch's ledger, but implementation
targets the workbench line as its own PR — the research-canon PR stays
focused. Design settled 2026-08-22 via SNC mesh review; they review the
implementation draft when work starts, and SNC platform pilots the
affordance once it lands. Attribution: the proposal and its evidence
(including the completed_items: discard dogfood gap — this repo never
exercises the summarize/release path) are SNC's, delivered over mesh
2026-08-22; the disposition-semantics add likewise.

## Acceptance

- With `release_checks` absent, release behavior is byte-identical to today.
- With `release_checks: [security]` (or any list) present: a failing check
  produces a tracked finding item, the release summary and stub removal do
  not happen, and re-running the release after the finding closes succeeds
  and records the full audit.
- Findings are fresh-eyes (never the releasing session self-reviewing).
- A pilot conversion (SNC platform) runs its five gates through the
  transaction and reports friction through the dogfood loop.

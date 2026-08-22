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
- **Doctrine compatibility**: Workbench already accepts mechanical invariants
  at the completion/release boundary (atomic completion transition, no
  lingering stubs, `release_mode` conventions). This is that shape, not a
  stage-machine port.

## Open questions

1. **Scanner library gap.** The natural scanner wiring is the code-audit
   skills, but SNC's five gates include cruft/docs/patterns — none have
   code-audit equivalents (they are agile-workflow gate skills). Options:
   (a) check names are project-defined; each names an available scanner
   skill or carries a one-line description for an ad-hoc fresh-eyes pass;
   (b) port the missing scanners to code-audit over time. Start with (a),
   revisit if pilots accumulate ad-hoc descriptions.
2. **Halt semantics**: propose halt-always when `release_checks` is present
   (their live config used `binding_guard: halt` anyway) — no per-check
   binding config until a pilot needs it.

## Non-goals (from the proposal, honored)

No binding guards, no epic-cohesion rules, no per-item stage machinery.
Strictly a boundary contract.

## Delivery notes

This item lives on the research-canon branch's ledger, but implementation
targets the workbench line as its own PR — the research-canon PR stays
focused. SNC platform pilots the affordance once it lands. Attribution: the
proposal and its evidence (including the completed_items: discard dogfood
gap — this repo never exercises the summarize/release path) are SNC's,
delivered over mesh 2026-08-22.

## Acceptance

- With `release_checks` absent, release behavior is byte-identical to today.
- With `release_checks: [security]` (or any list) present: a failing check
  produces a tracked finding item, the release summary and stub removal do
  not happen, and re-running the release after the finding closes succeeds
  and records the full audit.
- Findings are fresh-eyes (never the releasing session self-reviewing).
- A pilot conversion (SNC platform) runs its five gates through the
  transaction and reports friction through the dogfood loop.

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

> Workbench version mismatch: stop and offer setup upgrade.

## Brief

Contribution proposal from a downstream Workbench consumer (2026-08-22): workbench's release skill
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
the domain-scan axis over a release bundle's diff. The proposing project (a public
prod site) runs six configured gates today and would convert to Workbench
if the transaction existed — the strictest-config consumer as pilot.

## Design (accepted shape)

- **Opt-in config**: `release_checks:` as a block list in
  `.work/CONVENTIONS.md` — `- <scanner>` or `- <name>: <description>`
  entries. Absent key = current pure-judgment behavior; present key
  activates the transaction. Mirrors `review_weight`/`autonomy`
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
- **Finding disposition semantics** (external design add, accepted): a finding
  resolves two ways — by fix, or by explicit receiver adjudication (wontfix
  or deferred → parked with the recorded reason). An unadjudicated finding
  blocks; an adjudicated one does not. The audit record lists dispositions
  alongside outcomes, so a single low-value finding cannot wedge a release
  with no sanctioned exit. This is the standard review doctrine (findings
  are proposals the receiver must verify and adjudicate) stated in release
  terms.
- **Doctrine compatibility**: Workbench already accepts mechanical invariants
  at the completion/release boundary (atomic completion transition, no
  lingering stubs, the completed-file cleanup invariants). This is that
  shape, not a stage-machine port.

## Open questions — settled 2026-08-22 (external design review)

1. **Scanner library gap — resolved: not a blocker.** The tool-heavy gates
   (security, tests) are exactly the ones code-audit ships. The three
   judgment-heavy gates (cruft, docs, patterns) carry fine on one-line
   descriptions; the proposer's can be lifted nearly verbatim from the
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
   per-check binding config until a pilot demands it. The pilot project (the live
   halt-binding config) is where that demand would surface.

## Non-goals (from the proposal, honored)

No binding guards, no epic-cohesion rules, no per-item stage machinery.
Strictly a boundary contract.

## Delivery notes

This item lives on the research-canon branch's ledger, but implementation
targets the workbench line as its own PR — the research-canon PR stays
focused. Design settled 2026-08-22 via external review; the proposer reviews the
implementation draft when work starts, and the proposing project pilots the
affordance once it lands. Attribution: the proposal and its evidence
(including the completed_items: discard dogfood gap — this repo never
exercises the summarize/release path) are the proposer's, delivered by direct exchange
2026-08-22; the disposition-semantics add likewise.

Implemented on `feat/workbench-release-transaction`, branched from main at
workbench v0.10.1 — main's release skill evolved through v0.10.0 (idempotent
re-run, both postures, version guard) and the transaction was written against
that structure; the check affordance remained the same one-line gesture the proposal
diagnosed, so the design carried over unchanged. Surfaces: release skill
(transaction section + audit + judgment path), `references/release-checks.md`
(entry grammar, examples, dispositions, audit), canonical-layout key,
migration-rules `gates_for_release` conversion, guide paragraph.

## Pre-push rubric (learned from the gate, five rounds + repo PR history)

The repo's auto-reviewer's findings across PRs 46-51 fall into four stable
classes; sweep all four before every push, on the FULL final surface (the
gate reviews final state fresh each round, not deltas):

1. CONTRACT CONSISTENCY — every surface that describes a behavior (SPEC,
   templates, references, help text, error messages, guide) agrees with the
   implementation exactly. Three of five rounds on this PR were this class
   (flow templates, sanctioned-set docs, comment semantics).
2. STALE-REFERENCE SWEEP — grep the PR diff for concepts main renamed or
   removed (guard-line incident round 3); check version fields, dist
   artifacts, and paths all resolve (PR 46's dead paths and binary drift).
3. INPUT-SPACE EDGES — for any parser or config surface, enumerate the
   malformed-input matrix (null/empty/flow/spacing/quoting/comments) and
   test acceptance against every documented form (rounds 1, 4, 5).
4. REPO HARD LIMITS — SKILL.md under 500 lines, TOC completeness for long
   references, ASCII consistency where files were ASCII, explicit
   actor/action prose in rules (PRs 47-49).

Discipline notes: our fresh-context passes are strongest on
semantics/architecture and root causes, weakest on whole-surface
consistency sweeps when run delta-only — run them full-aperture on final
state; a second cheap model on docs-consistency adds the gate's
multi-model diversity.

## Adversarial review pass (2026-08-22, fresh-context cross-model)

Ten findings (7 material, 2 minor, 1 seed refuted); verdict after
adjudication: design holds, all material findings fixed on-branch in the
same stride. Fixes landed: explicit **bundle packet** (outcome ids, commits,
files, base..head — reconstructed or the release stops); **prior-disposition
replay** (re-dispatches carry prior findings; adjudicated priors are not
re-filed; the summary audit is the durable disposition record surviving
`completed_items: discard`); **activation semantics** (absent = judgment
byte-identical; only a non-empty list activates; `none`/`[]` invalid);
**dispatch contract** (read-only, no report artifacts, proposals in reply,
fail-closed on unavailable/error/inconclusive; bare strings restricted to
verdict-shaped scanners — security-scan, test-scan, bug-scan; exploratory
skills are work-time lenses, not checks); **item materialization** (releasing
session writes findings per canonical template incl. version guard — the
guard contract was later removed upstream in v0.11.0, and the shipped text
now says full frontmatter only; invalid findings are themselves blockers); **already-complete bypass closed**
(audited summary required when checks are configured); **validator shape
check** for the key + tests; run-all-then-halt stated; item's stale
`release_mode`/`[security]` references corrected; SPEC.md updated (the
normative surface had been missed). Name-collision seed refuted: grammar
already resolves scalar-vs-map precedence.

## External design review of the implementation (2026-08-22)

**Approved** ("ready from our side" after three findings, all fixed in the
same stride). The seven hardenings confirmed landed; suite run their side
39/39. Conversion simulation against the proposer's live config — six gates,
not five (`gates_for_release: [security, tests, cruft, docs, patterns,
refactor]`; the project also opted into gate-refactor): security/tests convert
to bare strings, cruft/docs to judgment passes verbatim-compatible with the
reference examples. The two that needed doctrine:

- **gate-patterns converts wrong from the scope line** (material-docs): the
gate's scope describes harvesting; the settled doctrine is
 drift-verification only. Fixed in release-checks.md — the conversion now
carries the drift-verification rule and forbids lifting the harvesting
scope; a `patterns:` example entry added.
- **gate-refactor unmentioned** (minor-docs): converts to a judgment pass
whose description carries the scan-rule library roots and the
behavior-preserving `refactor` routing; `refactor:` example entry added.
- **Report-file default conflict** (minor-contract): scanner skills write
markdown reports by default; the dispatch contract now states bare-string
dispatches run with the report-file default explicitly overridden —
findings in the reply only.

Consciously dropped on conversion, on record: `binding_guard: halt` and
`epic_cohesion: total` do not convert — release selection is judgment;
the pilot project accepts this knowingly. `research_completion` is
agile-side and out of scope.

**Maintainer review (local multi-model gate) — changes requested, fixed in
stride.** Two findings: (1) material — `release_checks: null` parsed to
None and slipped past the value-based validator check (YAML null and an
absent key were indistinguishable); fixed by keying on key presence, with
null/tilde regression tests. (2) nit — the templates advertised the
flow-sequence form while the validator's parser splits flow sequences on
commas; both templates now show the block-list form. Wiring audit at the
same time answered an open question: conversion carried the
gates_for_release mapping, but setup's interview flow did not know the
key at all — refresh/upgrade had no preserve-and-reconcile rule. Fixed:
setup never asks speculatively (judgment path is the default posture),
asks only on gate conversion or explicit user request for a mechanical
release boundary, and on refresh preserves a declared list verbatim while
reconciling shape only. SPEC's setup alignment list updated to match.

**Framing amendment (2026-08-23, post round 7).** The release boundary is
the AGGREGATE CHECKPOINT: instant scanners (bare) audit this diff; drift
verifications (described) audit the accumulation since the last clean
checkpoint — the actual replacement for the aggregate half of the classic
gates, which item-scoped discipline cannot see by construction. Mechanics
landed with the framing (a reframing-coherence pass found the docs had
outrun the machinery): dual packets (bundle packet for instant scanners;
drift packet from last clean checkpoint to head for drift checks),
described entries are fresh-context ad-hoc dispatches (never
skill-by-name; skill-existence checks apply to bare entries only), and
the audit records per-check packet identity plus "drift verified as of
<version> at <head>" checkpoints that scope the next drift packet.

**PR opened** as nklisch/skills#51 (2026-08-22) with the genericized review
history in the description. The proposer verified the description against
the record before the maintainer pass: accurate, no corrections. One noted
non-issue: the description's "resolved findings are not re-raised" is a
compression of the replay semantics — the normative form is that adjudicated
priors stand (wontfix/deferred), while a re-raised finding on a fixed issue
means the fix didn't land and blocks. Clear for maintainer review; the pilot
triggers on merge.

## Resolution (2026-08-23)

MERGED as nklisch/skills#51 (6234c33; final form 4fb1915 "workbench: add
adaptive scans and release gates"). Delivered by the maintainer's build on
our chassis: he took our base commits (17eb10f, 4778776) early, then
rebuilt the surface per his own architecture — release_gates as bare
names with prose meaning in CONVENTIONS bodies, the scan skill as the
shared discovery capability with release gates as one bounded consumer,
setup-recommends-from-evidence with per-archetype sets, no scanner
registry or structured-entry grammar. Our transaction semantics survived
the rebuild as contract ordering (resolve material findings before
completing) plus findings-as-tracked-work dispositions. The audit is a
concise summary section (extensible by derivation per our comment:
prior-tag checkpoints, item-id disposition search); degradation states
reduced confidence rather than blocking. Sixteen gate-review rounds of
parser hardening on our branch are superseded by design — the grammar
class of findings was dissolved by not having a grammar. The derivation
comment thread and the maintainer-guidance posture correction are the
durable contributions beyond the base commits. Platform pilot activates
under his shape; the research-canon branch rebases onto merged main.

## Acceptance

- With `release_checks` absent, release behavior is byte-identical to today.
- With `release_checks:` as a non-empty block list (e.g. `- security-scan`) present: a
  failing check produces a tracked finding item, the release summary and stub
  removal do not happen, and re-running the release after the finding closes
  succeeds and records the full audit.
- Findings are fresh-eyes (never the releasing session self-reviewing).
- A pilot conversion (the proposing project) runs its six gates through the
  transaction and reports friction through the dogfood loop.

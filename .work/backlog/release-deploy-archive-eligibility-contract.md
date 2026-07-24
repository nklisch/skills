---
id: release-deploy-archive-eligibility-contract
created: 2026-07-24
updated: 2026-07-24
tags: [skill, tooling]
---

# release-deploy: canonical release-eligibility contract for archived items (rework of archive-husk-gather-skip)

## Context

Branch `agile-workflow/archive-husk-gather-skip` (commits `83b6598`,
`29827ae`) carries a **stopgap** fix: the Phase-3 archived-stub gather skips
`status: superseded|duplicate` and non-`stage: done` files, and treats a
missing `release_binding` field as unbound; groom gains a stamp-at-disposition
rule. An adversarial review (2026-07-24) returned **rework** — the stopgap is
correct about the incident but wrong about the mechanism. This item supersedes
the stopgap as the upstreamable shape; the branch stays as reference.

## The incident (project-agnostic)

release-deploy's archived-stub late-binding gather assumes archive = done. On
`retain-bodies` substrates whose archive also holds retired items
(merge-absorbed rollups, duplicates of shipped work, superseded/resolved
findings), the gather sweeps those husks into the next release's bind set and
readiness blocks on already-settled work. Observed twice on one substrate:
one release hand-unbound a batch of stale stubs; the next swept 16 retired
husks, zero containing genuine work. Secondary bug: items lacking a
`release_binding` field entirely are never gathered (absent should read as
unbound).

## Review findings the rework must address

1. **Guard/gather predicate split** — Phase 3.5 binding-consistency guard
   walks archived children/parents WITHOUT the skip predicate: a skipped
   retired child of a bound parent → INCOMPLETE; a skipped done superseded
   parent with a bound child → CONFLICT. Guard and gather must share ONE
   release-eligibility predicate.
2. **Retirement ≠ ineligibility** — `status: superseded` is retirement
   metadata, not a shipping decision: done superseded items are sometimes
   deliberately bound as provenance (a fix superseded by work in THIS
   release). The stopgap false-skips that class. Needs an explicit marker —
   e.g. `release_eligible: false` or `disposition: absorbed` — validated
   against the replacement pointer, OR a documented schema invariant that
   `status: superseded` is categorically non-shippable. **Maintainer
   vocabulary decision.**
3. **Foundation drift** — `docs/SPEC.md` (terminal-tier retention),
   `convert`, and `review/references/substrate-side-effects.md` canonically
   assert "archived stubs are done by construction / gather ALL unbound
   stubs". The contract change must be defined THERE and consumed by
   release-deploy; a one-skill patch gets un-installed by convert.
4. **Hand-rolled parsing** — `grep|awk` frontmatter extraction disagrees with
   valid YAML (quoted `"done"`/`"null"`/`~`), is unbounded by `---` (body
   false-positives), and aborts under `set -o pipefail` on absent fields.
   `work-view` already supports the canonical query shape
   (`--scope archive --stage done --release null --paths`); add a typed
   disposition/eligibility query rather than more ad-hoc parsing.
5. **Silent stranding** — genuinely-done items with a missing/unflipped
   stage become invisible forever. Emit a skipped-anomaly report (with
   status/pointer) for operator confirmation or repair instead of silent
   quarantine.
6. **Procedural** — plugin version bump required (3 manifests) on any skill
   change; stopgap branch has none. Add fixture-driven coverage for the
   decision matrix (binding missing/null/empty/quoted/concrete × stage
   done/non-done/missing × retired/not × guard interactions).

## Migration note

Not retroactive: existing unstamped done husks still pass any new filter.
The PR/issue must include an operator grooming procedure for legacy archives.

## Suggested path

File as an upstream ISSUE first (incident + design tension + this analysis),
let the maintainer pick the eligibility vocabulary, then PR the contract
across SPEC/convert/review/release-deploy/groom/work-view with tests.

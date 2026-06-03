---
id: epic-agentic-research-research-view
kind: feature
stage: drafting
tags: [tooling]
parent: epic-agentic-research
depends_on: [epic-agentic-research-substrate-tier]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# `research-view` query binary

## Brief
Build `research-view`, a thin read-only query tool over the `.research/` tier —
the research-tier analog of `.work/bin/work-view`. Per the epic's design
decision, it ships as a **Rust prebuilt binary** following the `substrate-binary`
reference-skill pattern (Rust source + prebuilt dist binaries + checksum +
version-freshness gating). It offers read-only queries over the tier — by
`source_handle`, `status`, `temporal_contract`, corpus, and `provenance`; list
attestations / positions / campaigns — and deliberately imposes NO stages on
items (the tier has none), surfacing ARD's native lifecycle fields instead.

It mirrors work-view's build/distribution machinery; the recent work-view
version-freshness story is the precedent for keeping the tracked binary in
lockstep with plugin metadata. As a CLI binary it works in all three channels.

Does NOT cover: any write/mutation of the substrate, or citation linting (that
floor belongs to substrate-tier).

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: consumer of `epic-agentic-research-substrate-tier`; the
  ergonomics-parity deliverable. Parallel with `work-handoff`.

## Foundation references
- `plugins/agile-workflow/work-view/` (Rust crate + `Cargo.toml` + `dist/`) and
  `plugins/agile-workflow/scripts/{install-work-view,work-view}.sh` — the binary +
  cross-compiled dist + bash-fallback pattern to mirror; `.work/bin/work-view` is
  the installed result
- `.agents/skills/substrate-binary/` — build/dist + version-freshness pattern
- `epic-agentic-research-substrate-tier` — the schema/layout it queries

## Design inputs (carried forward)
- **Extend `scripts/bump-version.sh` for this binary.** Its version-projection
  block is hardcoded `if [[ "$plugin" == "agile-workflow" ]]` — it stamps the
  semver into work-view's Rust `.work-view-version` + bash fallback. This binary
  needs an analogous block, or its self-reported version will drift from the
  plugin manifests (the failure the work-view freshness story fixed). Surfaced
  during `epic-agentic-research-scaffold` design.

---
id: epic-agentic-research-research-view-cli
kind: story
stage: implementing
tags: [tooling]
parent: epic-agentic-research-research-view
depends_on: [epic-agentic-research-research-view-core]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# research-view-cli — the CLI adapter (bin `research-view`)

## Scope
The `research-view-cli` crate at
`plugins/agentic-research/research-view/crates/cli/` — the terse, parseable CLI
adapter over `research-view-core`, producing the `research-view` binary. NO board
surface (read-only CLI only). Implements Unit 2 of the feature design.

## Files
- `crates/cli/src/{main,args,render}.rs`
- `crates/cli/.research-view-version` (no trailing newline)
- `crates/cli/Cargo.toml`, `crates/cli/tests/integration.rs`

## CLI surface (mirror work-view's `args.rs` conventions)
Filters (AND): `--tier`, `--handle`, `--status`, `--temporal-contract`,
`--provenance`, `--corpus`; sugar `--attestations/--positions/--precis/--briefs/
--campaigns/--hypotheses` (set `--tier`). Output: `--paths/--cat/--count` (default
table). Other: `--version/-V`, `--help/-h`.

Table columns: `IDENTITY  TIER  STATUS  TEMPORAL_CONTRACT  PROVENANCE` (empty
result → print nothing). Exit codes: `0` ok, `1` usage/error, `2` no `.research/`,
`3` I/O (BrokenPipe → 0).

## Acceptance criteria
- [ ] All filters/sugar/output modes parse and map to core filters; unknown flag /
  missing value → exit 1 with a `research-view:`-prefixed usage error (the
  tightened-vs-bash `next_value` behaviour).
- [ ] `--version` prints `research-view <plugin-semver>` (from `include_str!` of
  `.research-view-version`) with NO trailing blank line.
- [ ] Against the live `.research/`: `--positions` lists the seed position,
  `--handle work-view-dist` finds the attestation, and an empty/absent `.research/`
  exits 2.
- [ ] `--paths`/`--cat`/`--count` byte-semantics match work-view's render.
- [ ] Integration tests use the `subprocess-cli-harness` pattern (real binary →
  (stdout, stderr, exit) tuple).

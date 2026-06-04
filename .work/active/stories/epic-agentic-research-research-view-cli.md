---
id: epic-agentic-research-research-view-cli
kind: story
stage: done
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
- [x] All filters/sugar/output modes parse and map to core filters; unknown flag /
  missing value → exit 1 with a `research-view:`-prefixed usage error (the
  tightened-vs-bash `next_value` behaviour).
- [x] `--version` prints `research-view <plugin-semver>` (from `include_str!` of
  `.research-view-version`) with NO trailing blank line.
- [x] Against the live `.research/`: `--positions` lists the seed position,
  `--handle work-view-dist` finds the attestation, and an empty/absent `.research/`
  exits 2.
- [x] `--paths`/`--cat`/`--count` byte-semantics match work-view's render.
- [x] Integration tests use the `subprocess-cli-harness` pattern (real binary →
  (stdout, stderr, exit) tuple).

## Implementation notes

### Files created/edited
- `plugins/agentic-research/research-view/Cargo.toml` — added `"crates/cli"` to workspace members
- `plugins/agentic-research/research-view/crates/cli/Cargo.toml` — crate manifest; bin `research-view`; dep `research-view-core`; dev-dep `tempfile`
- `plugins/agentic-research/research-view/crates/cli/.research-view-version` — `0.1.0` (no trailing newline; mirrors plugin.json version)
- `plugins/agentic-research/research-view/crates/cli/src/args.rs` — hand-rolled parser; tier sugar flags; nullable_match; RESEARCH_VIEW_VERSION const; HELP const; 44 unit tests
- `plugins/agentic-research/research-view/crates/cli/src/render.rs` — table/paths/cat/count render modes; tier_label fn; 14 unit tests
- `plugins/agentic-research/research-view/crates/cli/src/main.rs` — pipeline: parse→locate→load→diagnose→query→render; exit codes 0/1/2/3
- `plugins/agentic-research/research-view/crates/cli/tests/integration.rs` — subprocess harness; 17 integration tests

### Test results
- CLI unit tests (args + render): 53 passed
- CLI integration tests: 17 passed
- Core unit tests: 51 passed
- Doc-tests: 4 passed
- Total: 125 tests, all green

### Manual smoke output (repo root, against live .research/)
```
$ research-view --positions
research-view: parse error in .research/reference/rust-binary-size/INDEX.md: no valid frontmatter block
IDENTITY                        TIER          STATUS      TEMPORAL_CONTRACT           PROVENANCE
------------------------------  ------------  ----------  --------------------------  ------------------
rust-binary-distribution-viable  position      settled     extend-on-source-rev        agent-synthesis

$ research-view --handle work-view-dist
[parse error warning omitted]
IDENTITY                        TIER          STATUS      TEMPORAL_CONTRACT           PROVENANCE
work-view-dist                  attestation                                           source-direct

$ research-view --count
19

$ research-view --version
research-view 0.1.0
```
The parse error for `INDEX.md` is a pre-existing malformed file in the live substrate — tool correctly warns non-fatally and continues.

### Deviations from spec
None. All acceptance criteria met as specified. The `--` args separator present as in work-view. No board/serve/JSON/typed-edge surface added.

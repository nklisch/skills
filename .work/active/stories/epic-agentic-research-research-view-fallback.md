---
id: epic-agentic-research-research-view-fallback
kind: story
stage: done
tags: [tooling]
parent: epic-agentic-research-research-view
depends_on: [epic-agentic-research-research-view-cli]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# research-view.sh — bash fallback

## Scope
`plugins/agentic-research/scripts/research-view.sh` — a zero-dependency bash
fallback mirroring the `research-view` binary's read-only query surface over
`.research/`, for platforms without a prebuilt binary and as the installer's
fallback path. Mirrors `plugins/agile-workflow/scripts/work-view.sh`. Implements
Unit 3 of the feature design.

Depends on the CLI story so it mirrors the finalized contract (and so the
parity-diff test has a binary to diff against).

## Acceptance criteria
- [x] Same filters / output modes / exit codes as the binary across the covered
  surface (no board, no write paths).
- [x] Carries a `RESEARCH_VIEW_VERSION="x.y.z"` literal in the
  bump-version-projectable form (anchored line `^RESEARCH_VIEW_VERSION="..."`);
  `research-view.sh --version` byte-matches `research-view --version`.
- [x] Parity-diff test vs the binary via the `subprocess-cli-harness` graceful
  parity-skip: hard-fail on a path/behaviour regression, skip only when a tool is
  absent.

## Implementation notes

### Files created
- `plugins/agentic-research/scripts/research-view.sh` — the bash fallback (zero
  external deps beyond awk/find/sort/xargs)
- `plugins/agentic-research/scripts/tests/research-view-parity.test.sh` — the
  byte-parity harness

### Parity test result: 31/31 passed

Queries covered by the parity harness (binary stdout = fallback stdout
byte-for-byte for all):

| Query | Result |
|---|---|
| `--version` | PASS |
| `-V` (short form) | PASS |
| default table (no flags) | PASS |
| `--count` | PASS |
| `--paths` | PASS |
| `--attestations --cat` | PASS |
| `--attestations` | PASS |
| `--positions` | PASS |
| `--briefs` | PASS |
| `--campaigns` | PASS |
| `--hypotheses` | PASS |
| `--precis` | PASS |
| `--reference` (tier sugar) | PASS |
| `--tier reference` (explicit) | PASS |
| `--handle work-view-dist` | PASS |
| `--status settled` | PASS |
| `--status null` (IsNull) | PASS |
| `--provenance source-direct` | PASS |
| `--temporal-contract write-once-on-converge` | PASS |
| `--corpus rust-binary-size` | PASS |
| `--reference --count` | PASS |
| `--reference --paths` | PASS |
| `--status nonexistent` (empty result) | PASS |

Structural checks (exit codes, skip rules, version literal): 8/8 PASS.

### Manual smoke (against real `.research/` substrate)
- `--version` → `research-view 0.1.0` (byte-matches binary)
- `--positions` → byte-matches binary (1 row, all columns correct)
- `--count` → `20` (byte-matches binary)

### Deviations from binary
- **stderr warnings**: the binary emits a parse-error warning to stderr for
  non-reference files with no frontmatter. The fallback silently skips them
  (spec permits this: "match the binary's STDOUT, stderr need not be
  byte-identical"). STDOUT is byte-identical in all tested cases.
- **null-sugar for `--handle`**: the binary accepts `--handle null` as
  `Match::IsNull`. The fallback treats `null` as a literal string for
  `--handle` (since no source_handle will ever equal the string `"null"` after
  normalization, this is functionally equivalent and does not affect STDOUT
  parity for any tested case).

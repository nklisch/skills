---
id: gate-docs-pattern-line-refs
kind: story
stage: implementing
tags: [documentation]
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: docs
created: 2026-05-31
updated: 2026-05-31
---

# Refresh drifted file:line example refs in 5 pattern skills (board work shifted positions)

## Drift category
pattern-skill-staleness (5 consolidated findings)

## Reality
The board work shifted code positions in `cli/tests/integration.rs` and
`cli/src/actionable.rs`. The function bodies are unchanged; only line numbers
moved. Five pattern skills cite stale lines. All `core/*` refs still resolve and
must be left as-is.

## Required edits (replace in place — exact line updates)
1. `.agents/skills/patterns/subprocess-cli-harness.md:21,33,43,65` —
   `integration.rs:37`→`:44` (`fn run`), `:51`→`:58` (`fn run_malformed`),
   `:853`→`:1797` (`fn bash_run`), parity matrix `:889`–`:1218`→`:1833`–`:2326`.
2. `.agents/skills/patterns/cargo-manifest-fixture-root.md:35,41` —
   `cli/tests/integration.rs:844`→`:1788` (`const BASH_SCRIPT`), `:17`→`:24`
   (`fn fixture_root`), `:28`→`:35` (`fn malformed_fixture_root`). Leave
   `core/tests/integration.rs:16`/`:27` unchanged.
3. `.agents/skills/patterns/substrate-borrowing-query.md:49` —
   `actionable.rs:51`→`:59` (`apply_dependency_view`).
4. `.agents/skills/patterns/substrate-test-fixture-builder.md:53` —
   `actionable.rs:84`→`:92` (`fn setup_substrate`). Leave `graph.rs:75`,
   `filter.rs:124`, `index.rs:299-312` unchanged.
5. `.agents/skills/patterns/test-item-builders.md:59-61` —
   `actionable.rs:100`→`:108` (`fn item_md`), `actionable.rs:142`→`:149`
   (`fn make_item_direct`). Leave `model.rs:128`, `render.rs:149`, `graph.rs:93`,
   `filter.rs:143` unchanged.

## Verification
After editing, re-resolve each cited line against the named symbol (`grep -n`)
to confirm the symbol sits at the new line.

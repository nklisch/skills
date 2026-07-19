---
source_handle: git-auth-output-codex-exec
fetched: 2026-07-10
source_url: https://github.com/openai/codex/blob/dffe1f02a3c4849478c4f412a69d25af2e6b9359/codex-rs/core/src/exec.rs
provenance: source-direct
substrate_confidence: source-direct
---

# OpenAI Codex command-output implementation

## Summary

Codex's command execution implementation pipes stdout and stderr, retains and aggregates their bytes under a hard cap, streams bounded output deltas, carries captured output through timeout and sandbox-denial results, and formats the aggregate for model consumption. The inspected execution path shows truncation and lifecycle controls, but no secret-redaction pass between child-process output and model-facing formatting.

## Key passages

### Constants near `EXEC_OUTPUT_MAX_BYTES`

The implementation defines a hard retained-byte cap to prevent runaway stdout/stderr from exhausting memory, limits live output-delta events, and defines a two-second I/O-drain timeout for inherited pipes that remain open after child termination. It also defines cancellation and timeout exit-code handling.

### `finalize_exec_result`

Captured stdout and stderr are converted lossily to text and stored with an `aggregated_output`. Timed-out and sandbox-denied commands retain the output in their error values rather than replacing it with a fixed status.

### `aggregate_output`

Under the cap, aggregation concatenates stdout then stderr. Under contention, the function apportions retained bytes across streams. The function performs byte capping; it does not inspect or redact secret patterns.

### `format_exec_output_str`

The function comments that it truncates "for model consumption before serialization." It builds the content directly from `aggregated_output.text`, prefixing a timeout message when needed, then applies formatted truncation. This is direct evidence that raw command output reaches a model-facing serialization path subject to truncation, not a fixed structured result.

## Structural metadata

- Product: OpenAI Codex CLI
- Artifact type: first-party Rust source code
- Revision: `dffe1f02a3c4849478c4f412a69d25af2e6b9359`
- Relevant path: `codex-rs/core/src/exec.rs`
- Scope limit: this source establishes the ordinary exec output path; it does not establish every hosted Codex product's credential provisioning policy

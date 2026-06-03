---
id: epic-agentic-research-substrate-tier-lint
kind: story
stage: review
tags: [tooling]
parent: epic-agentic-research-substrate-tier
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Lint floor: port `lint-citations.py`

## Scope
Story 2 of `epic-agentic-research-substrate-tier`. Ports ARD's citation-chain
validator into the plugin as a standalone, zero-dependency Python script, plus a
fixture-based smoke test. Faithful port — no harness coupling (per the feature's
lint-wiring decision).

## Implements
- `plugins/agentic-research/scripts/lint-citations.py` — port of
  `/tmp/ARD/example/lint-citations.py` (zero-dep Python3, hand-rolled frontmatter
  scanner). Defaults `--attestation-dir .research/attestation`,
  `--analysis-dir .research/analysis` (already repo-root-relative).
- A fixture smoke test using the repo's `subprocess-cli-harness` pattern
  (launch the real script → `(stdout, stderr, exit_code)`).

## Acceptance criteria
- [ ] Validates citation-chain integrity (`[handle]{N}` → `attestation/<handle>.md`
  resolution + `source_handle` match), the 6 surface-pattern warnings, and the GR.5
  thin-attestation check.
- [ ] `--format markdown|json` and `--exit-code-on high|medium|low|none` behave as upstream.
- [ ] Smoke test: a known-good fixture passes; a known-bad fixture (broken handle +
  thin attestation) is flagged with the right statuses.

## Implementation notes
- **Files created**: `plugins/agentic-research/scripts/lint-citations.py` (byte-identical
  port — `diff` clean against `/tmp/ARD/example/lint-citations.py`; defaults already
  `.research/`-relative, no edits needed); `scripts/tests/test_lint.py` + `fixtures/`
  (good / bad / thin cases).
- **Tests added**: `test_lint.py` — launches the real script via subprocess
  (`subprocess-cli-harness` pattern) and asserts: clean chain → exit 0; unresolved
  handle → exit 1 with `unresolved-handle`; thin attestation → flagged + exit 0 (low).
- **Verification**: `python3 test_lint.py` → "3/3 cases passed". `--help` and
  `--format json` confirmed working.
- **Discrepancies from design**: none (verbatim port).
- **Adjacent issues parked**: none.

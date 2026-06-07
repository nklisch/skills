---
id: epic-agentic-research-substrate-tier-lint
kind: story
stage: done
tags: [tooling]
parent: epic-agentic-research-substrate-tier
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-04
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

## Review (approve · fast-lane)
Verdict: Approve — story verified by implement (smoke test 3/3 green in notes above);
fast-lane advance to done.

## Superseded by the ARD v0.3.0 re-vendor (2026-06-04)
The hand-rolled `scripts/tests/test_lint.py` + `fixtures/{good,bad,thin}` documented
above were **removed** when the plugin absorbed ARD v0.3.0 (the consumption-contract
release). The v0.2 `example/lint-citations.py` was re-vendored from `kernel/lint-citations.py`
(now data-sources its categories/statuses from the new `scripts/catalogs.json`, with a
built-in fallback), and the bespoke smoke test was replaced by ARD's canonical
conformance set at `scripts/conformance/` (`run.py` + `expected.json` + golden fixtures).
New verification command: `python3 plugins/agentic-research/scripts/conformance/run.py`
(15/15 — 8 chain statuses · 1 thin · 6 pattern categories). The byte-identical-port
verification above is the v0.2 historical record; git history is the audit trail. See
`epic-agentic-research-ard-sync` for the worked re-sync.

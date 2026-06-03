---
id: epic-agentic-research-substrate-tier-lint
kind: story
stage: implementing
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

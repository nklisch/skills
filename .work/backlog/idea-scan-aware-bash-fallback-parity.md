---
id: idea-scan-aware-bash-fallback-parity
kind: story
stage: backlog
tags: [tooling, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# Bash work-view fallback is not scan-aware (parity gap)

## Source

Surfaced in the 2026-07-06 deep review of `feature-scan-aware-substrate`. Important
(not blocking).

## Problem

The Rust `work-view` implements `--scan-origin` and `[scan]`-tag exclusion from
`--ready`/`--blocked` (the structural guarantee that engagement-owned scan
scaffold is never drained as ordinary work). But the pure-bash fallback
(`plugins/agile-workflow/scripts/work-view.sh`) has neither: `--scan-origin`
exits with "unknown flag", and the actionable path has no `tags contains scan`
exclusion. Since `install-work-view.sh` can install the fallback on unsupported
platforms (or when the prebuilt binary is unavailable), the "structural guarantee"
is not universal — a deep-code-scan campaign running against the fallback would
have its scaffold visible to `--ready` and could be drained by autopilot.

## Fix direction

Either:
- **(a)** Minimally port `scan_origin` flag parsing + `[scan]`-tag exclusion to
  the bash fallback (parity with the Rust binary).
- **(b)** Document and enforce scan-awareness as Rust/prebuilt-only: have
  `install-work-view.sh` warn when installing the fallback on a platform that
  could run deep-code-scan, and have autopilot/deep-code-scan refuse to trust
  `--ready` output from the fallback (detect via `work-view --version` or a
  capability probe).

(a) is the stronger fix; (b) is cheaper if the fallback is rarely used in
practice. Investigate how often the fallback actually installs before deciding.

## Acceptance criteria

- [ ] Either the bash fallback supports `--scan-origin` + `[scan]` exclusion, OR
      scan-awareness is documented/enforced as prebuilt-only with a guard
- [ ] A `[scan]`-tagged active implementing item is absent from fallback
      `--ready`/`--blocked` (or the fallback is never used for scan campaigns)

---
id: epic-retire-bash-work-view
created: 2026-06-03
tags: [tooling]
---

# Retire the bash work-view fallback — go fully Rust-only

Parked from `feature-work-view-scope`. We dropped bash<->Rust parity and froze
`scripts/work-view.sh` as a degraded fallback (no `--scope`, no board). The full
retirement is a cross-cutting change that needs its own design pass:

- Delete `scripts/work-view.sh`.
- Redesign `install-work-view.sh` fallback (line ~131): platforms without a
  prebuilt binary currently degrade to bash. Replace with build-from-source
  (`cargo build --release`) or an explicit hard-fail with a clear message.
- Remove the `work-view.sh` version projection from `scripts/bump-version.sh`
  (line ~118).
- Update `convert/SKILL.md` install routing + `scripts/tests/convert-install-routing.test.sh`.
- Rewrite foundation docs that describe the bash fallback as an architectural
  component: `SPEC.md` (~6 refs), `ARCHITECTURE.md`, `ROADMAP.md`, `README.md`,
  `work-view/dist/README.md`, plus the research docs in `docs/research/`.
- Decide whether `bash >= 4` stays a documented dependency (install helper still
  uses bash) or is also dropped.

Why parked, not done now: deleting the script forces an install-fallback
redesign + foundation-doc rewrite that the docs gate would (correctly) flag.
That is epic-sized and was out of scope for the `--scope` release.

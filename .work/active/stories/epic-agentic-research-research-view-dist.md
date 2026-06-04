---
id: epic-agentic-research-research-view-dist
kind: story
stage: implementing
tags: [tooling]
parent: epic-agentic-research-research-view
depends_on: [epic-agentic-research-research-view-cli, epic-agentic-research-research-view-fallback]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# research-view distribution — install, bump projection, CI

## Scope
The distribution bundle that makes `research-view` installable and
version-locked, mirroring work-view's machinery. Implements Unit 4 of the
feature design. Depends on both the CLI (the binary) and the fallback (the
install fallback path + a second projection target).

## Files
- `plugins/agentic-research/research-view/dist/.gitattributes` + `dist/<triple>/` skeleton
- `plugins/agentic-research/scripts/install-research-view.sh`
- `scripts/bump-version.sh` — generalize the version-projection block
- `.github/workflows/build-research-view.yml`
- `plugins/agentic-research/README.md` — install section

## Acceptance criteria
- [ ] `install-research-view.sh` resolves `uname`→target-triple, installs
  `research-view/dist/<triple>/research-view` → `.research/bin/research-view`,
  passes the `--help` smoke + `candidate_is_current` version-freshness gate, and
  falls back to `research-view.sh` on unsupported triples. (No `board --help` check.)
- [ ] `bump-version.sh agentic-research patch` projects the new semver into BOTH
  `research-view/crates/cli/.research-view-version` (no trailing newline) and the
  `research-view.sh` `RESEARCH_VIEW_VERSION` literal, Fail-Fast grep-verified, and
  leaves the agile-workflow/work-view projection byte-identical.
- [ ] `build-research-view.yml` is path-scoped, cross-compiles the 4 triples
  (`cargo-zigbuild` for musl, macOS runner for darwin) under an 8 MB size budget,
  runs the install-helper + bump-lockstep bash tests, and on
  `workflow_dispatch commit_binaries=true` commits `dist/<triple>/research-view`.
- [ ] README documents `install-research-view.sh` and the `.research/bin/research-view` path.

## Notes
- Binary production/verification is **CI-side, post-merge** — the version stamp is
  written into source by `bump-version.sh`, and CI compiles dist FROM it on the
  post-bump commit (work-view's exact ordering). Until that CI run lands, the
  installer version gate intentionally fails on supported platforms; do not cut a
  release before the binary-refresh commit.
- Generalize the bump block carefully: keep the existing `agile-workflow` branch
  unchanged; add `agentic-research` as a parallel branch with the same Fail-Fast
  verify and operator note.

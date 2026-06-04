---
id: epic-agentic-research-research-view-dist
kind: story
stage: done
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

## Implementation notes

### Files created
- `plugins/agentic-research/research-view/dist/.gitattributes` — marks `*/research-view` binary, mirrors work-view's exact pattern
- `plugins/agentic-research/research-view/dist/README.md` — explains CI-produced binaries, lists 4 triples
- `plugins/agentic-research/research-view/dist/{x86_64-unknown-linux-musl,aarch64-unknown-linux-musl,x86_64-apple-darwin,aarch64-apple-darwin}/.gitkeep` — 4 empty tree placeholders
- `plugins/agentic-research/scripts/install-research-view.sh` — installer mirroring install-work-view.sh; installs to `.research/bin/research-view`; no `board --help` check; uses `WORK_VIEW_UNAME_S/M` env overrides for testability
- `.github/workflows/build-research-view.yml` — CI workflow mirroring build-work-view.yml; path-scoped; cargo-zigbuild for musl, macOS runner for darwin; 8 MB size budget; commit-dist on workflow_dispatch
- `plugins/agentic-research/scripts/tests/install-research-view.test.sh` — 45-assertion installer test with fake prebuilt stubs; covers version-gate accept/reject, fallback, atomicity, idempotency, dest-is-dir, and the no-board-requirement distinction

### Files modified
- `scripts/bump-version.sh` — added `agentic-research` projection block (separate `if` branch after agile-workflow's); both branches are structurally identical: `printf '%s'` Rust stamp (no trailing newline) + anchored `sed -i.bak` + Fail-Fast `grep -q` postcondition + `git add` + operator note. The agile-workflow branch text is byte-identical to the original.
- `plugins/agile-workflow/scripts/tests/bump-version.test.sh` — extended: `new_scratch_repo` now seeds agentic-research manifests + research-view artifacts; added new test groups 7–9 (agentic-research patch/Fail-Fast/minor+major); augmented group 1 with 4 assertions that agile-workflow bump leaves research-view untouched.
- `plugins/agentic-research/README.md` — added `## research-view binary` install section documenting PLUGIN_ROOT contract, `.research/bin/research-view` destination, and CI-produced binary ordering.
- `.work/active/stories/epic-agentic-research-research-view-dist.md` — this file; stage advancing to review.

### Bump-generalization approach
The bump block uses two independent `if [[ "$plugin" == "..." ]]` branches. This is the simplest structure that keeps the agile-workflow branch byte-identical to the original while adding the agentic-research branch. A helper-function approach would have been more DRY but would have required changing the agile-workflow branch call-site, risking subtle divergence and complicating the lockstep test's "unchanged" assertions. Correctness over cleverness.

Evidence work-view branch is identical: the bump-version.test.sh groups 1–6 pass with 0 regressions (all prior assertions preserved); the 4 new group-1 assertions explicitly assert research-view files are untouched after an agile-workflow bump.

### Test results
- `bash plugins/agentic-research/scripts/tests/install-research-view.test.sh`: **45 passed, 0 failed**
- `bash plugins/agile-workflow/scripts/tests/bump-version.test.sh`: **77 passed, 0 failed** (was 56 before extension)
- `bash plugins/agentic-research/scripts/research-view.sh --version`: prints `research-view 0.1.0` (literal unchanged)
- `git status`: no `target/` or stray build artifacts

### Deviations from spec
- The installer reuses `WORK_VIEW_UNAME_S`/`WORK_VIEW_UNAME_M` env-override names for testability (these are already set by the test harness in the installer test). The spec doesn't prescribe env var names; this mirrors the exact work-view pattern so one test harness convention covers both installers.
- `shellcheck`, `actionlint`, and `yamllint` were not available in the dev environment. The workflow YAML was manually verified against `build-work-view.yml` structure and passes Python-free YAML structure review; CI will run actionlint on PR.

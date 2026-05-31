---
id: epic-substrate-cli-install-path
kind: feature
stage: done
tags: [tooling]
parent: epic-substrate-cli
depends_on: [epic-substrate-cli-adapter, epic-substrate-cli-next-actionable]
release_binding: 0.8.6
gate_origin: null
created: 2026-05-30
updated: 2026-05-31
implemented: 2026-05-30
---

# Ship & install the compiled binary

## Brief

Get the finished binary into target projects. Implements the per-platform
build/distribution decided by the research feature (e.g. `bun build --compile
--target=...` outputs, or Rust cross-compiled artifacts) so the binary ships
through the Claude Code / Codex marketplaces, and updates `convert`'s install
step to place the right binary in a target project's `.work/bin/work-view`
instead of copying `work-view.sh`. Includes any bash fallback the research
feature decided to keep (e.g. ship `work-view.sh` as a fallback when no
prebuilt binary matches the platform).

Depends on a complete CLI (adapter + next-actionable) existing to package.
Does NOT decide the distribution strategy (that's the research feature) — it
implements it. This is also where `convert`'s Phase 4 ("copy work-view") and
`plugins/agile-workflow/docs/ARCHITECTURE.md`'s install description roll forward.

## Epic context
- Parent epic: `epic-substrate-cli`
- Position in epic: terminal feature — packages and distributes the built CLI;
  depends on `adapter` + `next-actionable`.

## Foundation references
- `docs/SPEC.md` — marketplace distribution + dual-manifest constraints the
  binary ships within.
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — the `convert` install path and
  `.work/bin/work-view` placement this feature changes.
- `.agents/skills/substrate-binary/SKILL.md` — distribution + cross-compile
  decision (cargo-zigbuild musl, macOS runner darwin, commit prebuilt, keep
  bash fallback).
- `plugins/agile-workflow/skills/convert/SKILL.md` — the bootstrap Phase 4
  `cp work-view.sh` step and the `--update` overwrite path this feature changes.

## Design decisions
- **Binaries are CI-produced, not hand-built.** The local dev box has only
  `x86_64-unknown-linux-gnu` (no zig/musl targets/macOS), and hand-built release
  binaries are non-reproducible. This feature's in-session deliverable is the
  install MACHINERY (a tested selection helper), the CI build/publish workflow,
  and docs. The four static binaries are produced + committed by CI. Until CI
  populates `dist/`, the helper falls back to `work-view.sh` — zero regression.
  (Cross-model peer, Codex xhigh, concurred.)
- **A single tested helper, not buried shell.** Selection/fallback logic lives
  in `plugins/agile-workflow/scripts/install-work-view.sh`; both `convert`
  bootstrap (Phase 4) and `convert --update` call it. One code path, testable in
  isolation, no bootstrap/update drift.
- **Smoke-test + atomic install.** The helper copies the chosen artifact to
  `.work/bin/work-view.tmp`, `chmod +x`, runs `work-view.tmp --help`, and only
  `mv`s it into place on success — else it falls back to `work-view.sh` and
  smoke-tests that. A wrong-arch/stale/broken binary can never leave a user with
  no working `work-view`. (peer)
- **Binary layout + controlled churn.** Artifacts at
  `plugins/agile-workflow/work-view/dist/<target-triple>/work-view` for triples
  `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`,
  `x86_64-apple-darwin`, `aarch64-apple-darwin`. `.gitattributes` marks
  `dist/** binary -diff`. NO LFS (marketplace clones the git tree directly). CI
  builds + uploads on PRs but **commits `dist/` only in a manual
  release/binary-refresh workflow run before `bump-version.sh`** — avoids
  per-push binary churn and CI auto-commit loops. (peer)
- **`uname` override for testability.** The helper honors
  `WORK_VIEW_UNAME_S` / `WORK_VIEW_UNAME_M` so the triple mapping + fallback are
  testable with stub binaries on any host. (peer)

## Architectural choice

A standalone POSIX-bash installer helper that `convert` delegates to, plus a CI
workflow that produces the artifacts. This keeps `convert` (a bash-in-markdown
skill) thin, makes the platform logic unit-testable, and isolates the one part
that needs a build toolchain (CI) from the part that runs on the user's machine
(the helper + bash fallback). Rejected: inlining `uname` logic into
`convert`'s SKILL.md (untestable, and it would drift between the bootstrap and
`--update` paths).

```
plugins/agile-workflow/
├── scripts/
│   ├── work-view.sh                 # fallback (already stage-aware, in lockstep)
│   └── install-work-view.sh         # NEW — the selection/fallback/smoke-test helper
└── work-view/
    └── dist/                        # NEW — CI-produced prebuilt binaries
        ├── .gitattributes           # dist/** binary -diff
        ├── README.md                # how binaries are produced/refreshed
        └── <target-triple>/work-view
.github/workflows/
└── build-work-view.yml              # NEW — cross-compile + (release) commit dist/
```

## Implementation Units

### Unit 1 (trickiest): the install helper — `plugins/agile-workflow/scripts/install-work-view.sh`
POSIX-ish bash. Args/env: `PLUGIN_ROOT` (or `CLAUDE_PLUGIN_ROOT`) for the source
tree; installs into `$PWD/.work/bin/work-view`. Honors `WORK_VIEW_UNAME_S` /
`WORK_VIEW_UNAME_M` overrides (default to real `uname -s`/`-m`).
```sh
# 1. resolve uname_s / uname_m (override-aware)
# 2. map -> target triple:
#      Linux  x86_64        -> x86_64-unknown-linux-musl
#      Linux  aarch64|arm64 -> aarch64-unknown-linux-musl
#      Darwin x86_64        -> x86_64-apple-darwin
#      Darwin arm64         -> aarch64-apple-darwin
#      else                 -> "" (no prebuilt; fallback)
# 3. candidate="$PLUGIN_ROOT/work-view/dist/$triple/work-view"
# 4. install_and_verify(src): cp "$src" .work/bin/work-view.tmp; chmod +x;
#      if .work/bin/work-view.tmp --help >/dev/null 2>&1: mv tmp -> work-view; return 0
#      else: rm -f tmp; return 1
# 5. if triple && [ -f candidate ] && install_and_verify "$candidate": done ("installed prebuilt <triple>")
#    else: install_and_verify "$PLUGIN_ROOT/scripts/work-view.sh" || { echo error; exit 1; }  ("installed bash fallback")
# 6. echo which path was taken (prebuilt <triple> | bash fallback) for convert to log.
```
**Acceptance**:
- [ ] Each of the 4 (os,arch) pairs maps to the right triple (via uname override).
- [ ] Prebuilt present + `--help` ok → installs the binary; output names the triple.
- [ ] No matching prebuilt (unknown platform, or `dist/` empty) → installs
      `work-view.sh`; result is executable and `--help` works.
- [ ] Prebuilt present but `--help` FAILS (wrong arch / not executable / stub) →
      falls back to `work-view.sh` (no broken install left behind).
- [ ] Install is atomic (no partial `.work/bin/work-view`; `.tmp` cleaned up).
- [ ] Re-running (update) overwrites cleanly and stays executable.

### Unit 2: `convert` integration — `plugins/agile-workflow/skills/convert/SKILL.md`
- Bootstrap Phase 4: replace the inline
  `cp "${PLUGIN_ROOT}/scripts/work-view.sh" .work/bin/work-view; chmod +x` with
  `bash "${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/scripts/install-work-view.sh"`.
- `convert --update` (the `.work/bin/work-view` overwrite step): call the same
  helper instead of overwriting with the raw script.
- Keep the `work_view` doctor check (exists + executable — now satisfied by
  either a prebuilt binary or the bash fallback).
- Keep the `git add .work/bin/work-view`.
**Acceptance**:
- [ ] Bootstrap and `--update` both route through `install-work-view.sh`.
- [ ] The doctor check + git-add still hold.

### Unit 3: CI build/publish — `.github/workflows/build-work-view.yml`
Matrix: `x86_64`/`aarch64`-unknown-linux-musl via `cargo-zigbuild`; `x86_64`/
`aarch64`-apple-darwin on a `macos-latest` runner (`cargo build --release
--target ...`). Release profile already sets `opt-level="z"`, `lto`,
`panic="abort"`, `strip`. On PR/push: build all four + upload as artifacts +
**size-guard** (fail if any binary exceeds a budget, e.g. 8 MB). On
`workflow_dispatch` (the manual "refresh binaries" job): build, then commit
`plugins/agile-workflow/work-view/dist/<triple>/work-view` to the tree — run
BEFORE `./scripts/bump-version.sh agile-workflow ...`.
**Acceptance**:
- [ ] Workflow builds all four targets (lint-valid YAML; toolchains pinned).
- [ ] PR runs do not commit binaries; only the manual refresh job does.
- [ ] Size guard fails the job if a binary balloons.

### Unit 4: dist scaffold — `dist/.gitattributes` + `dist/README.md`
- `.gitattributes`: `plugins/agile-workflow/work-view/dist/** binary -diff`.
- `README.md`: the four triples, "produced by `.github/workflows/build-work-view.yml`,
  refreshed via the manual job before a version bump; do not hand-edit."
- `dist/` ships WITHOUT binaries initially (CI populates) → helper falls back to
  bash until then.

### Unit 5: docs rollforward
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — the `convert` install
  description: "copies `work-view.sh`" → "installs the platform-matched prebuilt
  `work-view` binary via `install-work-view.sh`, falling back to `work-view.sh`."
- `plugins/agile-workflow/docs/SPEC.md` — the work-view distribution section:
  prebuilt-binary-per-platform + bash fallback; users need NO Rust toolchain
  (only CI does).
- (The epic's broader VISION/ROADMAP "bash script" → "binary" rollforwards are
  enforced by the `docs` gate at release; this unit covers the install-path-
  specific assertions.)

## Implementation Order
1. Unit 1 (`install-work-view.sh`) — the helper.
2. Unit 1 tests (stub binaries + uname overrides; see Testing).
3. Unit 2 (`convert` SKILL.md) — route bootstrap + `--update` through the helper.
4. Unit 4 (dist scaffold) + Unit 3 (CI workflow).
5. Unit 5 (docs rollforward).

Single implementation pass; **no child stories** (one cohesive distribution
path; the helper + its tests are the core, the rest is config/docs).

## Testing
A bash test (e.g. `plugins/agile-workflow/scripts/tests/install-work-view.test.sh`,
runnable locally and from CI) using a temp `PLUGIN_ROOT` with STUB binaries:
- a stub `dist/<triple>/work-view` that prints help + exits 0 (simulates a good
  prebuilt) — assert it's selected for the matching uname override;
- a stub that exits non-zero on `--help` (simulates wrong-arch/broken) — assert
  fallback to `work-view.sh`;
- no `dist/` entry (unknown platform / empty) — assert bash fallback;
- all four uname (os,arch) → triple mappings;
- atomicity (no leftover `.tmp`; `.work/bin/work-view` always valid + executable);
- update overwrite path.
Wire this test into the CI workflow so it runs on every PR.

## Risks
- **No real binaries in-session** — `dist/` ships empty; the helper falls back to
  `work-view.sh` everywhere until CI's refresh job populates `dist/`. No
  regression (bash is the current behavior); the binary path activates when CI
  commits artifacts. This is the accepted limitation, not a bug.
- **Git-tree bloat** — controlled by commit-on-release-only + `binary -diff`;
  size-guard catches a runaway binary.
- **Binary/bash/docs version skew** — the "refresh binaries before bump" release
  step keeps them aligned; the smoke-test protects users from a stale/mismatched
  binary at install time.
- **darwin cross-compile** — cannot be done from Linux via zig; the workflow
  builds darwin on a `macos-latest` runner.

## Other agent review
Cross-model design consult (Codex, xhigh, advisory; CLI-epic design session),
2026-05-30. Accepted and folded in: CI-produced (not hand-built) binaries; the
standalone tested `install-work-view.sh` helper shared by bootstrap + `--update`;
the **smoke-test + atomic-mv** install (protects against wrong-arch/stale
binaries); `dist/<triple>/work-view` layout with `.gitattributes binary -diff`,
no LFS, commit-on-release-only churn control; `WORK_VIEW_UNAME_S/M` override for
testable platform mapping; stub-binary testing. Footguns flagged and addressed:
stale-binary shadowing, version skew, bootstrap/update drift (same helper), CI
auto-commit loops (manual refresh job). No blockers raised.

## Implementation notes

### What landed (2026-05-30)

**Unit 1 — `plugins/agile-workflow/scripts/install-work-view.sh`**
POSIX-bash helper. Resolves `PLUGIN_ROOT` (falls back to `CLAUDE_PLUGIN_ROOT`),
maps `(uname_s, uname_m)` → triple (Linux x86_64/aarch64/arm64 → musl triples;
Darwin x86_64/arm64 → darwin triples; else no triple). Smoke-test + atomic
install: copies candidate to `.work/bin/work-view.tmp`, `chmod +x`, runs `--help`;
on pass `mv` into place; on fail `rm -f` tmp and falls back to bash script. Never
leaves a `.tmp` or a broken binary.

**Unit 2 — `plugins/agile-workflow/skills/convert/SKILL.md`**
Two surgical edits:
- Phase 4 bootstrap: replaced `cp work-view.sh + chmod` with
  `bash "${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/scripts/install-work-view.sh"`.
- Phase S3 sync refresh: replaced inline `chmod +x` overwrite note with the same
  helper call. Doctor check (`work_view` marker) and `git add .work/bin/work-view`
  are unchanged.

**Unit 3 — `.github/workflows/build-work-view.yml`**
Matrix: Linux x86_64+aarch64 musl via `cargo-zigbuild` on `ubuntu-latest`;
macOS x86_64+arm64 via `cargo build --release --target` on `macos-latest`.
PR/push: build all four, upload artifacts, size guard (8 MB). `workflow_dispatch`
with `commit_binaries=true`: build + commit to `dist/` with `[skip ci]`.
Install-helper bash tests run as a separate job on every trigger.

**Unit 4 — `plugins/agile-workflow/work-view/dist/.gitattributes` + `dist/README.md`**
Scaffold only — no real binaries committed. `.gitattributes` marks
`plugins/agile-workflow/work-view/dist/** binary -diff`. README describes the
four triples, CI workflow, and the "do not hand-edit" rule.

**Unit 5 — docs rollforward**
- `ARCHITECTURE.md`: `convert` skill-table row updated to describe
  `install-work-view.sh` + fallback.
- `SPEC.md`: "work-view script" section expanded to "work-view binary" — lists
  all four triples, describes the install selection logic, states users need no
  Rust toolchain (only CI does), and preserves the bash-fallback description.

### Behavior on this machine (Linux x86_64, empty dist/)

`dist/` ships without real binaries (CI-produced, not hand-built). Running the
helper with `PLUGIN_ROOT=plugins/agile-workflow` against an empty `dist/` falls
back to `work-view.sh` exactly as today — zero regression. Output: "installed
bash fallback". The binary path activates when the CI refresh job populates
`dist/` before a version bump.

### Test results

`plugins/agile-workflow/scripts/tests/install-work-view.test.sh`
Run on 2026-05-30: **47 passed, 0 failed**

Test groups covered:
1. All 4 `(os,arch)` → triple mappings with good stub binaries
2. Unknown platform (FreeBSD, Windows_NT) → bash fallback
3. Broken prebuilt (exits non-zero on `--help`) → bash fallback, no broken install
4. Empty `dist/` → bash fallback
5. Atomicity: no leftover `.tmp`, installed binary always valid + executable
6. Update path: second run overwrites cleanly, stays executable
7. Darwin arm64 alias coverage

### Deviations from design

None. The design was followed exactly as written. The `dist/` `.gitattributes`
path is root-relative inside the `dist/` directory (covers the subtree) as
specified. The `set -e` pitfall with `((PASS++))` on zero was addressed in the
test file by using `set -uo pipefail` (omitting `-e`) since bash arithmetic
`((n++))` on `n=0` returns exit 1 under `set -e`; all assertion helpers use
explicit `if/else` branching so the counter increments are side-effect-free.

## Review (2026-05-30)

**Verdict**: Approve

Reviewed via a 2-pass cross-model peer-review (Codex through peeragent; host
Claude weighed + applied fixes). Commits in scope: `9cf3792` (implement),
`b541f32` (pass-1 fixes), plus a pass-2 `.gitattributes` nit.

**Pass 1 (Request changes — all resolved)**:
- **Blocker**: the CI `commit-dist` job gated on `inputs.commit_binaries ==
  'true'`, but GitHub boolean `workflow_dispatch` inputs are real booleans and
  `true == 'true'` coerces to false — the binary-refresh job would NEVER run.
  Fixed to `if: ... && inputs.commit_binaries`.
- **Important**: `dist/.gitattributes` used a repo-root path pattern from inside
  `dist/` so it matched nothing (`git check-attr` confirmed); `install_and_verify`
  swallowed `cp`/`mv` failures (errexit suppressed in `if`/`&&` context) and a
  pre-existing directory at `.work/bin/work-view` produced a false success
  (mv-into-dir); CI path filters skipped the installer + its tests; the
  `convert --update` audit byte-compared the installed `work-view` against
  `work-view.sh` (would flag a prebuilt binary as drift forever). All fixed:
  explicit failure checks + dir-guard + post-install `[ -f ] && [ -x ]`
  validation in the helper (+ 4 new edge-case tests), corrected gitattributes,
  added path filters, audit changed to existence+executability, docs corrected.

**Pass 2 (Approve)**: all 6 findings confirmed resolved (Codex re-ran the suite
and replayed the dir/failure edge cases); one nit — `** binary -diff` also
marked `dist/README.md` as binary — fixed to `*/work-view binary -diff` (binary
path still `binary: set`; README now diffable).

**Notes**: install helper test suite 51/51 green; `actionlint` clean on the
workflow; cargo suite (230) unaffected. The four prebuilt binaries are
CI-produced (`build-work-view.yml`); `dist/` ships empty and the helper falls
back to `work-view.sh` until CI's manual refresh job populates it — accepted
limitation, zero regression. Advanced review → done; stays in `active/features/`
(active parent epic, no release binding).

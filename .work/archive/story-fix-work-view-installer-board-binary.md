---
id: story-fix-work-view-installer-board-binary
kind: story
stage: done
tags: [bug, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Install board-capable work-view by default

## Symptom
The board skill expects a compiled board-capable `.work/bin/work-view`, but the
installer was still copying the Bash query fallback into projects. A project
could be current by `--version` and still fail `work-view board`.

## Root cause
`plugins/agile-workflow/scripts/install-work-view.sh` had drifted from the
substrate binary distribution contract: it unconditionally installed
`scripts/work-view.sh` and left the prebuilt Rust binaries plugin-side only.
Several docs repeated that stale model, so `convert` and self-heal were aligned
to the wrong artifact.

## Fix approach
Make `install-work-view.sh` the single platform-aware installer: supported
Linux/macOS targets install a version-verified prebuilt Rust binary; unsupported
targets fall back to the version-stamped Bash CLI. Refresh all committed
prebuilts to the current `0.9.1` source stamp and install the Linux x86_64
binary into this project so `.work/bin/work-view board` is available locally.

## Regression test
`plugins/agile-workflow/scripts/tests/install-work-view.test.sh` now asserts
that Linux/macOS install the prebuilt, that the installed command supports the
board subcommand, that unsupported platforms alone receive the Bash fallback,
and that stale or smoke-failing prebuilts fail atomically.

`plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh` guards
the committed `dist/` tree so every supported prebuilt embeds the plugin version
and the native Linux x86_64 binary reports that version and supports board help.

## Implementation notes
- Changed `plugins/agile-workflow/scripts/install-work-view.sh` to select
  target triples from `uname`, verify `--help` and `--version` before moving the
  candidate into place, and fail loudly on broken supported-platform prebuilts.
- Updated `convert` instructions plus SPEC, ARCHITECTURE, and `dist/README.md`
  so the documented contract is prebuilt-first with Bash fallback only for
  unsupported platforms.
- Replaced all four committed `dist/` prebuilts with the official v0.9.1
  artifacts from GitHub Actions run `26731609574`; installed the Linux x86_64
  artifact into this workspace.
- Verification: `bash plugins/agile-workflow/scripts/tests/install-work-view.test.sh`;
  `bash plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh`;
  `bash plugins/agile-workflow/scripts/tests/bump-version.test.sh`;
  `bash plugins/agile-workflow/scripts/tests/convert-install-routing.test.sh`;
  `bash plugins/agile-workflow/scripts/tests/work-board-shim.test.sh`;
  `python3 -m unittest test_prompt_context`;
  `cargo test -p work-view-cli`;
  `.work/bin/work-view board --help`.

## Review response

ChatGPT 5.5 xhigh subagent review found two blockers and one important issue:
three non-x86_64-Linux prebuilts still embedded `0.9.0`, binary-refresh docs
still described the pre-bump ordering, and the installer did not smoke-test
`work-view board` before installing a prebuilt.

Accepted and fixed all three:
- Refreshed all four supported prebuilts from CI-built v0.9.1 artifacts.
- Updated `dist/README.md` and `scripts/bump-version.sh` so post-bump binary
  refresh is mandatory before publishing.
- Added `board --help` smoke validation for prebuilt installs and regression
  coverage that preserves an existing installed file when the board smoke fails.
- Added CI/build-workflow version guards for committed and freshly built
  prebuilts.

## Review (2026-06-01)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Reviewed with a ChatGPT 5.5 xhigh subagent. The first pass found
stale non-x86_64 prebuilts, stale binary-refresh docs, and missing prebuilt
board smoke coverage. All were fixed and a focused second pass found no
remaining blocker or important issues. Non-native ARM/macOS binaries were
verified by CI artifact provenance, file type, and embedded version stamp rather
than local execution.

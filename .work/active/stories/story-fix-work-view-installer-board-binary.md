---
id: story-fix-work-view-installer-board-binary
kind: story
stage: review
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
targets fall back to the version-stamped Bash CLI. Refresh the Linux x86_64
prebuilt to the current `0.9.1` source stamp and install it into this project so
`.work/bin/work-view board` is available locally.

## Regression test
`plugins/agile-workflow/scripts/tests/install-work-view.test.sh` now asserts
that Linux/macOS install the prebuilt, that the installed command supports the
board subcommand, that unsupported platforms alone receive the Bash fallback,
and that stale or smoke-failing prebuilts fail atomically.

## Implementation notes
- Changed `plugins/agile-workflow/scripts/install-work-view.sh` to select
  target triples from `uname`, verify `--help` and `--version` before moving the
  candidate into place, and fail loudly on broken supported-platform prebuilts.
- Updated `convert` instructions plus SPEC, ARCHITECTURE, and `dist/README.md`
  so the documented contract is prebuilt-first with Bash fallback only for
  unsupported platforms.
- Rebuilt and installed the Linux x86_64 `work-view` binary for this workspace.
- Verification: `bash plugins/agile-workflow/scripts/tests/install-work-view.test.sh`;
  `bash plugins/agile-workflow/scripts/tests/convert-install-routing.test.sh`;
  `bash plugins/agile-workflow/scripts/tests/work-board-shim.test.sh`;
  `python3 -m unittest test_prompt_context`;
  `cargo test -p work-view-cli`;
  `.work/bin/work-view board --help`.

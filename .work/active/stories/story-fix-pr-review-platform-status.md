---
id: story-fix-pr-review-platform-status
kind: story
stage: review
tags: [bug, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# Close the Windows process-tree and stale sandbox-status review findings

## Symptom

The v0.1.0 PR review found two release blockers at reviewed head `8fcfd2c`:

1. `background-tasks` selected `cmd.exe` on Windows even though cancellation,
   monitor timeout, and shutdown still relied on Unix process groups, allowing
   grandchildren to survive.
2. pi-sandbox's `--no-sandbox` and global `enabled:false` startup branches
   changed internal state without refreshing the footer status pill.

## Root cause

The Windows change altered only shell selection and overstated the plugin's
platform support; it did not introduce a Windows process-tree termination
backend. The two pi-sandbox early returns omitted the `ctx.ui.setStatus` call
present on every other terminal initialization branch.

## Fix approach

Keep `background-tasks` explicitly POSIX-only and use `/bin/sh` on its supported
Linux/macOS hosts rather than claiming incomplete Windows support. Refresh the
sandbox status pill before both intentional-disable early returns. Add direct
regression coverage for the two status branches.

The implementation fixes landed in `3172ebc`; this follow-up records the work
and adds the missing regression test. The operator also approved the minimal
root `AGENTS.md` bookkeeping required for the new greenfield pi-sandbox plugin:
plugin count, plugin-map row, and Pi-only examples only.

## Regression test

`plugins/pi-sandbox/extensions/sandbox.test.ts` invokes `session_start` with
`--no-sandbox` and with `enabled:false`, then asserts the final `sandbox` status
is the matching disabled-state pill rather than a stale status from the prior
session.

## Implementation notes

- `plugins/background-tasks/extensions/background-tasks.ts` — Windows shell
  fallback removed in `3172ebc`; supported paths remain `/bin/sh` + Unix process
  groups.
- `plugins/background-tasks/README.md` — Windows is explicitly unsupported;
  the degrade table names macOS rather than implying all non-Linux hosts.
- `plugins/pi-sandbox/extensions/sandbox.ts` — both intentional-disable branches
  refresh the footer pill.
- `plugins/pi-sandbox/extensions/sandbox.test.ts` — added branch-level status
  regression coverage; kept the `/tmp` Unix-socket integration test honest by
  skipping it only when the surrounding sandbox makes host `/tmp` read-only
  (argv-level mask coverage still runs).
- `plugins/background-tasks/extensions/background-tasks.test.ts` — repaired a
  stale fixture that hardcoded host `/tmp`; it now uses the writable test temp
  root selected by `TMPDIR`.
- `AGENTS.md` — minimal pi-sandbox-only repository inventory bookkeeping, added
  with explicit operator approval after the earlier governance split.

## Fresh-context review

`openai-codex/gpt-5.6-sol` returned **APPROVE** with no blocker or important
finding. Its two nits were accepted: narrow the README's non-Linux degrade row
to macOS, and update the monitor regression comment after the fixture stopped
using a host shell.

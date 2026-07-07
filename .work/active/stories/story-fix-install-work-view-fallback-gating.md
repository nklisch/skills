---
id: story-fix-install-work-view-fallback-gating
kind: story
stage: drafting
tags: [bug, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-20
updated: 2026-07-07
---

# install-work-view.sh never reaches the bash fallback on prebuilt failure

## Symptom

On a host where the prebuilt `work-view` binary for the detected target triple
fails version verification, `install-work-view.sh` aborts the whole install
instead of falling back to the bash `work-view.sh`. The (correctly-stamped)
bash fallback is effectively unreachable whenever a target triple resolves,
because the prebuilt-failure branch returns early before the fallback block.

## Repro

Bootstrapping a fresh agile-workflow substrate (here: `pi-auto-approve`, a
separate repo) on linux x86_64:

- Plugin: `plugins/agile-workflow/.claude-plugin/plugin.json` → `version: 0.14.3`
- Prebuilt at `plugins/agile-workflow/work-view/dist/x86_64-unknown-linux-musl/work-view`
  reports `work-view 0.14.2`
- Run: `PLUGIN_ROOT=<agile-workflow> bash .../scripts/install-work-view.sh`
- Output:
  ```
  install-work-view: candidate '.../x86_64-unknown-linux-musl/work-view' does not report plugin version 0.14.3
  install-work-view: failed to install prebuilt work-view for x86_64-unknown-linux-musl from ...
  ```
- No `.work/bin/work-view` is installed.

The bash fallback at `plugins/agile-workflow/scripts/work-view.sh` reports the
matching `0.14.3` and would have worked, but was never tried.

## Root cause

`plugins/agile-workflow/scripts/install-work-view.sh`, in the main install
function (around lines 136-141):

```bash
if triple="$(target_triple)"; then
  prebuilt="${PLUGIN_ROOT}/work-view/dist/${triple}/work-view"
  if ! install_and_verify "$prebuilt" "$want" yes; then
    echo "install-work-view: failed to install prebuilt work-view for ${triple} from ${prebuilt}" >&2
    return 1          # ← aborts; never reaches the bash fallback below
  fi
  ...
  return 0
fi

# bash fallback — only reachable when target_triple FAILS ENTIRELY
if ! install_and_verify "$fallback" "$want"; then
  ...
```

The control flow gates the bash fallback behind `target_triple` failing. When a
triple resolves but the prebuilt is missing/stale/unversioned, the `return 1`
short-circuits before the fallback block.

## Fix direction (suggestion, not a plan)

On prebuilt `install_and_verify` failure, fall through to the bash fallback
rather than `return 1` — i.e. treat "prebuilt unusable" the same as "no prebuilt
for this triple" and let the fallback's own version check govern. Probably:
drop the early `return 1` and restructure so the fallback block runs whenever
no usable prebuilt was installed (missing triple OR failed verify), with the
final `candidate_is_current` check as the shared gate.

## Impact

Any bootstrap/sync on a host whose bundled prebuilt has drifted from the
plugin's `version` (one patch behind, stale dist artifact, or an unsupported
triple that happens to resolve) fails closed with no `work-view`, leaving the
substrate without its primary query tool. Worked around locally in
`pi-auto-approve` by copying the bash fallback directly.

## Related

- Distinct from version-skew of the prebuilt itself (0.14.2 vs 0.14.3) — that is
  a release/bump process gap. This bug is the installer's *response* to that gap:
  it should degrade gracefully to the fallback and does not.

## Implementation attempt (2026-07-06)

**Status: BLOCKED on a test-contract conflict — needs operator decision.**

The fix direction in the body (fall through to bash fallback on prebuilt failure
instead of `return 1`) was implemented and is semantically correct per the bug
report. But it regresses 5 assertions in `install-work-view.test.sh`:

- Test 5 (atomicity): `write_bad_prebuilt_stub` (exits 1 on `--help`) + a working
  `write_bash_stub` are both set up. The test asserts the installer exits 1 and
  leaves no work-view. With the fix, the installer falls through to the working
  fallback and succeeds — so `atomicity: failed smoke exits 1` and
  `atomicity: no final work-view after failed smoke` fail.
- Test 6 (board-smoke): `write_no_board_prebuilt_stub` (passes `--version`/`--help`
  but exits 1 on `board`) + a pre-created existing work-view. The test asserts the
  installer exits 1 and preserves the existing work-view. With the fix, the
  installer falls through to the fallback (which has no board, installed with
  `require_board=no`) and succeeds — overwriting the existing board-capable
  work-view.

These tests encode the **current abort-on-prebuilt-failure behavior as the
contract**, but the bug report says that abort *is* the bug (the fallback should
be reached). Per test-integrity, these are stale assertions IF the fall-through
is the intended behavior — but Test 6 surfaces a real design question the bug
report didn't address:

### Design question for operator

When the prebuilt fails the *board* smoke (but passes version + `--help`), should
the installer:

- **(a)** Fall through to the bash fallback (which has no board) — accepting
  that a board-capable work-view (if one exists) gets replaced by a no-board
  fallback. Matches the bug report's "treat prebuilt unusable = no prebuilt"
  framing. Cost: loses board support when only the prebuilt had it.
- **(b)** Fall through to the fallback ONLY for version/`--help` failures, but
  ABORT (preserving existing) on board-smoke failure — because a no-board
  fallback is a capability downgrade worth refusing. Requires distinguishing
  failure reasons in `install_and_verify`.
- **(c)** Fall through always, but only overwrite an existing work-view if the
  fallback is "at least as capable" (never trade board-capable for no-board).

The bug report's fix direction implies (a). Test 6's existing-work-view
preservation implies (b) or (c). Recommend (b): fall through on version/help
failure (the reported bug), abort on board-smoke failure (preserve capability).
This needs the operator's call before implementation.

### Verification state

Reverted the change; `install-work-view.test.sh` back to 47 passed, 0 failed.
The fix is staged in git history (this attempt) but not committed to the branch.
Once the design question is resolved, re-implement + update the stale assertions
Test 5/Test 6 to match the chosen contract.

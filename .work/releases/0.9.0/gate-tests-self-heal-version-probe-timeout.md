---
id: gate-tests-self-heal-version-probe-timeout
kind: story
stage: done
tags: [testing]
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Test prompt-context.py self-heal treats a --version probe timeout/hang as stale and still fails open

## Priority
Medium

## Spec reference
Item: `epic-substrate-cli-freshness-self-heal-hook`
Acceptance criterion: "SessionStart + stale copy → installer runs; current copy
→ does not." + "Installer failure / timeout → hook still exits 0 with normal
output."

## Gap type
adversarial-spec-silent / missing error case

## Detail
Existing tests cover `installed_version` rejecting unrecognized output and
`main` fail-opening when the *installer* raises. But the `installed_version`
probe itself runs a subprocess on a possibly-broken `.work/bin/work-view`; if
that probe hangs or times out (corrupt binary, bash entrypoint stuck on a
prompt), the SessionStart path must still treat the copy as stale/broken and
fail open. No test forces the *version-probe* subprocess to time out / raise
(distinct from the installer raising).

## Suggested test
```python
# test: SessionStart + installed_version probe raises TimeoutExpired
# mock subprocess.run on the --version probe to raise subprocess.TimeoutExpired
# assert: hook still exits 0 with normal context; copy treated as stale (installer invoked) or no-crash
```

## Test location (suggested)
`plugins/agile-workflow/hooks/scripts/test_prompt_context.py`
(`WorkViewSelfHealTest`)

## Implementation notes

Edited file: `plugins/agile-workflow/hooks/scripts/test_prompt_context.py`
(added 3 tests to `WorkViewSelfHealTest`, matching the existing
`mock.patch.object(prompt_context.subprocess, "run", ...)` style). The
`TimeoutExpired` is constructed as
`prompt_context.subprocess.TimeoutExpired(cmd="work-view --version", timeout=5)`
(the test module imports the hook by path as `prompt_context` and does not import
`subprocess` directly).

Behavior confirmed (the code already handles this correctly): `installed_version`
catches `subprocess.TimeoutExpired` and returns `None`; `self_heal_work_view`
then sees `None != want` and runs the installer (copy treated as stale/unknown);
`main()` exits 0 with normal `.agents/rules/` context (fails open).

New tests:
- `test_installed_version_returns_none_on_probe_timeout` — the version probe's
  `subprocess.run` raises `TimeoutExpired`; `installed_version` returns `None`.
- `test_sessionstart_version_probe_timeout_installs` — SessionStart with the
  probe timing out: `self_heal_work_view` does not raise and invokes
  `run_installer(root, plugin)` (stale treatment).
- `test_main_failopens_when_version_probe_times_out` — end-to-end through
  `main()` with the REAL `installed_version` (only its `subprocess.run` mocked to
  raise `TimeoutExpired`): rc == 0, output contains `additionalContext` and the
  injected rule body, and `run_installer` is invoked once. `run_installer` is
  stubbed to keep the test hermetic.

Run output: `python3 -m unittest test_prompt_context` -> `Ran 42 tests ... OK`
(was 39 before; +3 new). The full existing suite still passes.

No production bugs discovered; the hook already fails open on a version-probe
timeout exactly as the acceptance criterion requires.

## Review (2026-05-31)
Verified by re-running the suite in the release-deploy drain: passes green, no gaming patterns, bump-version isolation confirmed not to touch real manifests. Advanced review -> done.

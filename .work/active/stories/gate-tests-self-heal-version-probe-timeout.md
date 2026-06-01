---
id: gate-tests-self-heal-version-probe-timeout
kind: story
stage: implementing
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

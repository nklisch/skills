---
id: epic-substrate-cli-freshness-self-heal-hook
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-cli-freshness-self-heal
depends_on: [epic-substrate-cli-freshness-self-heal-installer]
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Hook self-heal step (reinstall-if-stale / install-if-missing)

## Scope

Unit 2 of `epic-substrate-cli-freshness-self-heal`. Add a guarded, fail-open
self-heal step to `prompt-context.py` that runs the (now version-aware)
installer when needed:

- **SessionStart / PostCompact**: reinstall if MISSING or STALE (compare
  installed `--version` last token to `plugin.json` version; unrecognized ==
  stale).
- **UserPromptSubmit**: install if MISSING only — existence check only, no
  per-prompt `--version` subprocess (latency).

See the parent feature body (Unit 2) for the full helper sketches
(`plugin_root`, `plugin_version`, `installed_version`, `run_installer`,
`self_heal_work_view`) and the `main()` wiring.

## File

`plugins/agile-workflow/hooks/scripts/prompt-context.py`

## Key points

- Resolve the plugin tree from `PLUGIN_ROOT` / `CLAUDE_PLUGIN_ROOT`; when neither
  is set (agent Bash / human terminal), the step is a clean no-op. The hook
  reliably carries `${PLUGIN_ROOT}` in its own execution context (see
  `hooks.json`), so self-heal fires exactly where it can.
- Reuse the file's existing fail-open discipline: any subprocess/installer
  failure must leave the hook exiting 0 with its normal context output.
- Installer stdout/stderr → DEVNULL (must not pollute the hook's JSON output).
- Purely additive — existing snapshot/rules/capsule/epoch behavior unchanged.
- No new top-level imports needed (`json`, `os`, `subprocess`, `contextlib`,
  `Path` already imported).

## Acceptance criteria

- [x] SessionStart + stale copy → installer runs; current copy → does not.
- [x] SessionStart + missing copy → installs.
- [x] UserPromptSubmit + missing → installs; + present → no install AND no
      `--version` subprocess.
- [x] Neither env var set → no-op (no crash, no install attempt).
- [x] Installer failure / timeout → hook still exits 0 with normal output.
- [x] Existing hook behaviors unchanged (additive).

## Tests

Extend `plugins/agile-workflow/hooks/scripts/test_prompt_context.py` (stdlib
`unittest`, import-by-path, `mock` + `tempfile`). Mock `subprocess.run` /
`installed_version` and assert call/no-call per event + state; patch
`os.environ` for the no-env case; force an installer failure to prove fail-open.
Regression: existing review-dedup / rules tests still pass.

NOTE for the autopilot driver: the python hook tests are NOT currently wired
into CI (only the bash install test runs in `build-work-view.yml`). This story
should add a small CI step running `python3 -m unittest test_prompt_context`
(fold into the existing job) so the new tests don't rot — low-cost and in scope.
If CI changes are kept out of this feature, file a follow-up; tests must at
minimum be locally runnable per the file's docstring.

## Implementation notes

- Files changed: `plugins/agile-workflow/hooks/scripts/prompt-context.py`,
  `plugins/agile-workflow/hooks/scripts/test_prompt_context.py`,
  `.github/workflows/build-work-view.yml`.
- Tests added: `WorkViewSelfHealTest` covers stale/current/missing
  SessionStart behavior, UserPromptSubmit missing/present behavior with no
  per-prompt version subprocess, missing plugin-root env no-op, installed
  `--version` parsing, installer output suppression, and `main()` fail-open
  output when installer execution raises.
- CI: folded `python3 -m unittest test_prompt_context` into the existing
  work-view install-helper workflow job and added hook-script path filters so
  hook changes trigger the job.
- Verification: `cd plugins/agile-workflow/hooks/scripts && python3 -m unittest test_prompt_context -v`;
  `bash plugins/agile-workflow/scripts/tests/install-work-view.test.sh`.
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Review (2026-05-31)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review. Implementation notes include green hook
unittest coverage and the install-helper regression suite.

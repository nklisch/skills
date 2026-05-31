---
id: epic-substrate-cli-freshness-self-heal-hook
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-cli-freshness-self-heal
depends_on: [epic-substrate-cli-freshness-self-heal-installer]
release_binding: null
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

- [ ] SessionStart + stale copy → installer runs; current copy → does not.
- [ ] SessionStart + missing copy → installs.
- [ ] UserPromptSubmit + missing → installs; + present → no install AND no
      `--version` subprocess.
- [ ] Neither env var set → no-op (no crash, no install attempt).
- [ ] Installer failure / timeout → hook still exits 0 with normal output.
- [ ] Existing hook behaviors unchanged (additive).

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

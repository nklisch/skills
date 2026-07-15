---
id: feature-pi-sandbox-background-project-tmp-state-real-tool-policy-parity
kind: story
stage: review
tags: [bug, security, tests, sandbox, background-tasks]
parent: feature-pi-sandbox-background-project-tmp-state
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# Preserve live agent-dir policy through real background and monitor tools

## Review finding

Deep feature review found that the new spawn-session snapshot fixes temp-state
module identity but actual `background`/`monitor` calls still omit `agentDir`.
The live sandbox extension loads global config from Pi's authoritative
`getAgentDir()`, while `buildSandboxedSpawnArgs` without an override falls back
to hardcoded `~/.pi/agent`. Pi supports custom agent directories, including via
`PI_CODING_AGENT_DIR`, so background commands can enforce a different and weaker
global policy than mediated bash while the temp snapshot still validates.

The same review confirmed a test-composition gap: the new cross-loader test
calls the cached real builder directly, while actual tool refusal/job tests use
fake builders. That misses wrong production arguments, job registration before
refusal, and stale tool wiring.

## Required fix

Extend the narrow versioned live-session contract with the canonical agent/config
directory needed to load the same global policy as the live extension. The
package helper must use that trusted value on production/default calls and
reject inconsistent caller overrides rather than silently reading another
policy root. Keep the payload path-only and versioned; do not publish config
contents or secrets.

Drive the actual registered `background` and `monitor` tools through the real
cached bridge/helper with no temp or agent-directory overrides. Tests must cover
custom agent-dir policy parity, healthy session-disk `TMPDIR`, shutdown/failing
replacement refusal, and an empty job registry/no marker/no wake after refusal.
Also update stale getter comments that still claim `sandbox-spawn` reads
module-local accessors.

## Acceptance criteria

- [x] Real background/monitor calls load the same global sandbox config root as
  the live extension, including a non-default Pi agent directory.
- [x] A custom-agent-dir stricter policy cannot degrade to the default config
  through the background/monitor path.
- [x] Conflicting/malformed agent-dir state fails closed.
- [x] Real registered tools use the live session-disk `TMPDIR` while ready.
- [x] After shutdown or failed replacement, real tools return blocked, create
  no job, emit no wake, and execute no marker command.
- [x] The cached builder remains stateless across replacement.
- [x] Getter comments describe diagnostics/tests, not the removed transport.
- [x] Both plugin suites and Pi package metadata checks pass.

## Implementation notes

- Extended the frozen v1 spawn-session state with the canonical live Pi
  `agentDir` on both ready and inactive lifecycle snapshots. The live extension
  captures it once from authoritative `getAgentDir()`, uses that same canonical
  path to load its global config, and publishes it through every transition.
- The stateless helper now reads the current snapshot before config loading:
  production calls use its trusted `agentDir`; an explicit diagnostic/test
  override is permitted only with no published state or when it canonically
  matches. Malformed or conflicting state fails closed without reading another
  config root. Complete existing temp overrides remain isolated-test capable.
- Added cache-busted live-extension coverage that drives the actual registered
  `background` and `monitor` tools through the real cached bridge/helper with
  no temp or agent-dir tool-call overrides. A custom-agent-dir `denyRead`
  policy, child `TMPDIR`, shutdown, and malformed replacement all prove the
  tool path cannot fall back to the default agent directory or register/run a
  rejected job.
- Updated obsolete getter comments: they now identify diagnostics/tests rather
  than the removed helper transport.

## Verification

- `bun test plugins/pi-sandbox/extensions` — 265 passed, 1 skipped.
  The existing block-mode host-Unix-socket case remains honestly skipped because
  this environment cannot provide a writable `/tmp` fixture.
- `bun test plugins/background-tasks/extensions` — 81 passed.
- `npm run check:pi-packages` — 123 passed, 0 failed.
- `git diff --check` — passed.

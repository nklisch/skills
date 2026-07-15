---
id: feature-pi-sandbox-background-project-tmp-state-real-tool-policy-parity
kind: story
stage: implementing
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

- [ ] Real background/monitor calls load the same global sandbox config root as
  the live extension, including a non-default Pi agent directory.
- [ ] A custom-agent-dir stricter policy cannot degrade to the default config
  through the background/monitor path.
- [ ] Conflicting/malformed agent-dir state fails closed.
- [ ] Real registered tools use the live session-disk `TMPDIR` while ready.
- [ ] After shutdown or failed replacement, real tools return blocked, create
  no job, emit no wake, and execute no marker command.
- [ ] The cached builder remains stateless across replacement.
- [ ] Getter comments describe diagnostics/tests, not the removed transport.
- [ ] Both plugin suites and Pi package metadata checks pass.

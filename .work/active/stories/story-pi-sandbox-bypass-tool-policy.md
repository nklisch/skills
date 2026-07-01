---
id: story-pi-sandbox-bypass-tool-policy
kind: story
stage: review
tags: [security, sandbox]
parent: feature-sandbox-first-party-bwrap
depends_on: [story-pi-sandbox-config-boundary-contract]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# Default policy for shell-bypass tools

## Scope

`background` and `monitor` spawn commands outside the overridden built-in `bash`
tool today. Until `plugins/background-tasks` integrates with the first-party
bwrap wrapper, the sandbox must not silently allow those tools to bypass the
shell sandbox.

This story adds a first-release mitigation in the sandbox extension's tool-egress
policy: default rules for known shell-bypass tools plus documentation of the
remaining follow-up integration.

## Requirements

- Default sandbox tool policy handles `background` and `monitor` as known shell
  bypasses when the sandbox is enabled.
- Prefer `confirm` in interactive/RPC UI modes if the operator wants usability;
  no-UI confirmation must fail closed.
- If the project chooses `block` instead of `confirm`, document the stricter
  default and how to opt out intentionally.
- The policy is additive-only: project config can tighten, not loosen, a global
  block/confirm setting.
- README links the remaining follow-up:
  `.work/backlog/idea-background-tasks-sandbox-integration.md`.

## Acceptance Criteria

- [x] With sandbox enabled and default config, `background` cannot run a shell
      command without block/confirmation.
- [x] With sandbox enabled and no UI, `background` and `monitor` fail closed if
      their policy is `confirm`.
- [x] Project config cannot lower a global `background`/`monitor` policy from
      `block`/`confirm` to `allow`.
- [x] `/sandbox` output lists the bypass-tool policy state.
- [x] README explicitly says this is a mitigation, not real background-tasks
      sandbox integration.

## Implementation notes

Implemented the first-release shell-bypass mitigation in the pure config/policy layer:

- Added `applyBypassToolDefaults()` in `plugins/pi-sandbox/extensions/sandbox-config.ts` with known bypass tools `background` and `monitor` defaulting to `confirm`.
- Wired defaults into `loadConfig()` after global config is merged and before project additive-only merge. Rationale: this makes the effective global/default policy include bypass-tool rules, so project config cannot lower the default `confirm` to `allow`; projects can still tighten to `block`. A deliberate operator global rule can still opt out with `allow`.
- Added `decideToolPolicy()` as a pure helper and routed the runtime `tool_call` hook through it. The existing confirmation behavior remains: `confirm` with no dialog-capable UI returns a block decision/fail-closed reason.
- Extended `/sandbox` output with `Bypass tools: background=<policy>, monitor=<policy>` so operators can see the effective mitigation state.
- Updated `plugins/pi-sandbox/README.md` with a dedicated background/monitor mitigation section, explicitly stating this is not real background-tasks bwrap integration and linking `.work/backlog/idea-background-tasks-sandbox-integration.md`.

Verification:

- `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` — 35 pass / 0 fail.

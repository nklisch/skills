---
id: story-pi-sandbox-bypass-tool-policy
kind: story
stage: implementing
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

- [ ] With sandbox enabled and default config, `background` cannot run a shell
      command without block/confirmation.
- [ ] With sandbox enabled and no UI, `background` and `monitor` fail closed if
      their policy is `confirm`.
- [ ] Project config cannot lower a global `background`/`monitor` policy from
      `block`/`confirm` to `allow`.
- [ ] `/sandbox` output lists the bypass-tool policy state.
- [ ] README explicitly says this is a mitigation, not real background-tasks
      sandbox integration.

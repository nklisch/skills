---
id: story-pi-sandbox-inspector-bare-token-docs
kind: story
stage: implementing
tags: [security, sandbox, documentation]
parent: feature-pi-sandbox-inspector-hardening
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-06
---

# Document the bare-token detection gap + provider-prefix shape guidance

## Scope

Implements Unit 3 of `feature-pi-sandbox-inspector-hardening`. No new generic
bare-token detector (design decision Q3b — it's a false-positive trap on
base64/hashes/UUIDs in auto-policy fields). Instead, document in the README:

- The inspector catches tokens with known provider prefixes (`sk-ant-`, `ghp_`,
  `sk-`) and keyworded assignments (`token=...`, `secret=...`).
- Bare tokens without a known prefix (random OAuth tokens, JWTs, custom gateway
  tokens) pasted alone are NOT caught.
- Operators should add their own `SecretShape` with their provider's prefix for
  stack-specific coverage. Include a config example.

Also documents Unit 4: a note that `^[A-Za-z]+$` in the allowlist defeats the
inspector and should not be used (the operator config edit to remove it happens
inline during the implementing stride, not as a separate story).

## Acceptance Criteria

- [ ] README inspector section documents the bare-token gap
- [ ] Config example for adding a custom provider shape
- [ ] README notes the `^[A-Za-z]+$` allowlist footgun

## Files

- `plugins/pi-sandbox/README.md` — inspector section + config examples

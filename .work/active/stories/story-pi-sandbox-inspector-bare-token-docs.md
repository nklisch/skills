---
id: story-pi-sandbox-inspector-bare-token-docs
kind: story
stage: done
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

## Implementation notes

- Files changed:
  - `plugins/pi-sandbox/README.md` — added "Tool-egress secret inspector" section
    documenting what the inspector catches, the bare-token gap (Q3b), how to add a
    custom provider shape (with config example), and the `^[A-Za-z]+$` allowlist
    footgun (Q4b).
- Unit 4 (operator config edit, inline): removed `^[A-Za-z]+$` from
  `~/.pi/agent/extensions/sandbox.json` `tools.inspector.allowlist.regexes`. This is
  operator config on this host, not repo code — not committed (it's outside the repo).
- Discrepancies: none.
- Adjacent issues parked: none.

## Review

Verdict: Approve - story verified by implement (173 tests green); fast-lane advance.

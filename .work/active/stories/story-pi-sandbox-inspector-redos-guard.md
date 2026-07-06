---
id: story-pi-sandbox-inspector-redos-guard
kind: story
stage: implementing
tags: [security, sandbox]
parent: feature-pi-sandbox-inspector-hardening
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-06
---

# ReDoS guard: safe-regex analyzer at config-load + input cap in scan loop

## Scope

Implements Unit 1 of `feature-pi-sandbox-inspector-hardening`. Two independent
mitigations against synchronous ReDoS in the `tool_call` inspector:

1. **Safe-regex analyzer** — `validateSecretShape` and `validateInspector` (for
   `allowlist.regexes`) reject patterns with known-catastrophic shapes (nested
   quantifiers like `(a+)+`) at config-load, producing a clear parse error. Hand-rolled
   static check, no dependency.
2. **Input cap** — `inspectToolInput` truncates scanned fields to 10K chars before the
   regex loop, so a huge field can't hang the gate. Applied to both secret-shape and
   allowlist regex execution.

See the feature body's "Unit 1" section for the exact interfaces, the `isSafeRegex`
heuristic, and acceptance criteria.

## Acceptance Criteria

- [ ] Config with `(a+)+` pattern → parse error naming the shape and the risk
- [ ] Config with `^[A-Za-z]+$` allowlist → compiles (safe), no false reject
- [ ] A 100K-char field in an auto-policy tool → does not hang; capped at 10K
- [ ] Residual (novel short pathological patterns) documented in the code comment

## Files

- `plugins/pi-sandbox/extensions/sandbox-config.ts` — `isSafeRegex`, call sites in
  `validateSecretShape` + `validateInspector`, input cap in `inspectToolInput`
- `plugins/pi-sandbox/extensions/sandbox.test.ts` — tests for the four criteria

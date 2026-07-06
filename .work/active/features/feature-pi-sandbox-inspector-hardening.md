---
id: feature-pi-sandbox-inspector-hardening
kind: feature
stage: implementing
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-05
updated: 2026-07-06
---

# Harden the tool-egress secret inspector (ReDoS, entropy, bare-token)

## Source

Surfaced in the 2026-07-05 full security audit of `plugins/pi-sandbox/` (tool-egress
inspector deep dive). All findings are code-cited against `sandbox-config.ts`
`inspectToolInput` / `decideToolPolicy` / `effectiveBaseScanFieldsForTool` and the live
global `~/.pi/agent/extensions/sandbox.json` inspector config.

## Status (2026-07-05)

Partially drained in the 0.1.0 audit pass:

- ✅ **scanFields shadowing** — fixed. `"*":"*"` now applies to every tool even
  when it has an explicit field list (the explicit list adds fields, never
  narrows all-field coverage). `inspectToolInput` and
  `effectiveBaseScanFieldsForTool` both updated.
- ⏳ **ReDoS guard** — deferred. Needs a safe-regex analyzer or worker timeout;
  larger design surface.
- ⏳ **alphabetic allowlist `^[A-Za-z]+$`** — operator-config concern, not a
  code default. The package ships no `inspector.allowlist` in `DEFAULT_CONFIG`;
  the regex lives only in the operator's `~/.pi/agent/extensions/sandbox.json`.
  Document as a footgun; removal is an operator action.
- ⏳ **entropy as hard bypass** — deferred. Needs redesign (scoring vs. allow).
- ⏳ **keyword pre-filter misses bare tokens** — deferred. Needs a bare-token
  detector design.

## Original problem

Several independent holes in the `auto`-policy secret inspector:

1. **Per-tool `scanFields` shadows the global `"*":"*"` coverage** (High).
   `sandbox-config.ts:388-393,1165-1168` — `effectiveBaseScanFieldsForTool` returns the
   explicit per-tool list before checking `"*"`. So `agent_send` (configured
   `scanFields: ["body"]`) scans **only** `body`; a secret in `metadata`, `to`, or any
   other field is skipped despite `"*":"*"`. A secret placed in an unlisted field passes.

2. **User-configured regexes can ReDoS the gate synchronously** (High).
   `sandbox-config.ts:375-385,420` — secret and allowlist regexes compile with
   `new RegExp(...)` and run synchronously with no timeout, input cap, or complexity
   guard. A pattern like `(a+)+$` against a large field hangs the `tool_call` handler and
   blocks all tool calls / session progress. Validation only checks that the regex
   compiles.

3. **Allowlist regex `^[A-Za-z]+$` exempts any alphabetic string** (High).
   Live global config allowlist includes `^[A-Za-z]+$`, which allowlists ANY purely
   alphabetic candidate after regex + entropy checks. A real alphabetic API key passing
   the generic-assignment regex and entropy threshold gets allowlisted.

4. **Entropy threshold is a hard bypass for low-entropy real secrets** (Medium).
   `sandbox-config.ts:431-433` — candidates below `entropy` are skipped entirely.
   `token=aaaaaaaaaaaaaaaaaaaa` (real but low-entropy) passes.

5. **Keyword pre-filter misses bare tokens** (Medium).
   `sandbox-config.ts:411-414` — shapes with `keywords` are skipped unless a keyword
   appears. A bare OAuth token pasted into `agent_send.body` with no surrounding `token=`/
   `secret` text is missed unless it matches a provider-specific exact pattern.

## Recommended fix direction

- Treat `"*":"*"` as all-field coverage even when a tool has explicit fields (union, not
  override).
- Cap scanned input length; reject unsafe regexes (safe-regex analyzer) or run inspection
  in a worker with timeout.
- Remove `^[A-Za-z]+$` from the default allowlist; keep only bounded placeholder/example
  patterns.
- Use entropy as scoring rather than an unconditional allow; block/confirm keyworded
  assignments above a min length regardless of entropy.
- Add a bare-token detector for `auto`-policy egress fields.

## Scope hint

One coherent design pass over the inspector. These are independent bugs but share the
`inspectToolInput` / config-merge surface, so a single focused effort is the right size.

## Design decisions (2026-07-06, interactive Phase 4.5)

- **Q1 ReDoS mitigation**: (a) input length cap + (b) safe-regex analyzer at
  config-load. Cap scanned fields to 10K chars (real secrets are <500); reject
  patterns with known-dangerous shapes (overlapping/nested quantifiers like
  `(a+)+`) at config-load with a clear error. Worker timeout (c) deferred to a
  future escalation if real incidents occur. Rationale: covers ~95% of the risk
  for ~30 LoC; worker machinery is overkill for v1.
- **Q2 Entropy redesign**: (a) soft signal with a min-length gate. A low-entropy
  candidate is still blocked if it is long enough to be a real secret (≥20 chars).
  `token=aaaa...` (20 a's) blocks; `password=changeme` (8 chars) doesn't. Keeps
  the hard floor for short low-entropy strings (false-positive control) but closes
  the low-entropy-real-secret hole. ~5 LoC.
- **Q3 Bare-token detection**: (b) require provider-prefix + document. Keep the
  existing provider-prefix shapes (`sk-ant-`, `ghp_`, `sk-`) as the high-confidence
  detector; do NOT build a generic bare-token detector (high false-positive rate
  on base64/hashes/UUIDs in auto-policy fields). Document the gap; make it easy for
  operators to add their own provider shapes. Rationale: generic bare-token
  detection without context is a research problem, not a v1 deliverable.
- **Q4 `^[A-Za-z]+$` allowlist**: (c) remove from operator config + (b) document.
  Edit the live `~/.pi/agent/extensions/sandbox.json` to drop the regex now (closes
  the hole today); document the footgun in the README/config docs. A broadness
  warning (a) is a future hardening if operators keep shooting themselves, but the
  heuristic is genuinely hard and deferred.

## Architectural choice

Single-pass in-place hardening of `inspectToolInput` and `validateSecretShape` —
no new modules, no worker, no concurrency. The inspector stays synchronous and
in-process; the fixes are (1) a static safe-regex check at config-load, (2) an
input cap + entropy min-length in the scan loop, (3) a config edit + docs. The
three code units are independent and touch different functions in
`sandbox-config.ts`, so they spawn as three child stories with no inter-deps.

## Implementation Units

### Unit 1: ReDoS guard (safe-regex analyzer + input cap)
**File**: `plugins/pi-sandbox/extensions/sandbox-config.ts`
**Story**: `story-pi-sandbox-inspector-redos-guard`

Two independent mitigations:

1. **Safe-regex analyzer** in `validateSecretShape` (and `validateInspector`
   for `allowlist.regexes`). After the `new RegExp(...)` compiles, run a static
   check that rejects known-catastrophic shapes. Hand-rolled (no dependency):
   detect nested quantifiers (`/(\+|\*|\?)\{0,\}/` adjacent to another quantifier)
   and overlapping alternation under quantifiers (`(a|a)+`).

   ```ts
   function isSafeRegex(pattern: string): { safe: boolean; reason?: string } {
     // Reject nested quantifiers: (a+)+, (a*)+, (a?)+, (a{2,})+
     if (/\([^)]*[+*?][^)]*\)[+*?]/.test(pattern)) {
       return { safe: false, reason: "nested quantifier (ReDoS risk)" };
     }
     // Reject overlapping alternation under quantifier: (a|a)+
     if (/\([^)]*\|[^)]*\)[+*?{]/.test(pattern)) {
       // Heuristic — only flag when alternation shares a prefix
       // (full check is NP-hard; this catches the common case)
     }
     return { safe: true };
   }
   ```

   `validateSecretShape` pushes a parse error if `isSafeRegex` returns unsafe,
   so the config fails closed at load (the operator sees a clear message).

2. **Input cap** in `inspectToolInput` after the `text` assignment (~line 405):
   ```ts
   const MAX_SCAN_LENGTH = 10_000;
   // ...after text is derived from value...
   if (text.length > MAX_SCAN_LENGTH) text = text.slice(0, MAX_SCAN_LENGTH);
   ```

**Implementation Notes**:
- `isSafeRegex` is heuristic, not complete — document it as a known-pattern
  rejector, not a formal proof. The input cap is the backstop for novel patterns.
- The cap must apply BEFORE the regex loop, not after, so a huge field never
  reaches `exec`.
- Apply the same cap to allowlist regexes (`isAllowed`).

**Acceptance Criteria**:
- [ ] Config with `(a+)+` pattern → parse error naming the shape and the risk
- [ ] Config with `^[A-Za-z]+$` allowlist → compiles (safe), no false reject
- [ ] A 100K-char field in an auto-policy tool → does not hang; capped at 10K
- [ ] A 30-char pathological input `(a+)+$` against `aaaa...!` → still hangs
      (documented residual; the analyzer rejects the pattern at load so this
      only happens if the operator bypasses validation)

### Unit 2: Entropy min-length gate
**File**: `plugins/pi-sandbox/extensions/sandbox-config.ts`
**Story**: `story-pi-sandbox-inspector-entropy-minlength`

Change the entropy check at ~line 437 from a hard `continue` to a gated block:

```ts
// Before (hard floor — low-entropy real secrets pass):
if (shape.entropy !== undefined) {
  const ent = shannonEntropy(candidate);
  if (ent < shape.entropy) continue;
}

// After (soft signal — block if long enough to be a real secret):
if (shape.entropy !== undefined) {
  const ent = shannonEntropy(candidate);
  const MIN_SECRET_LENGTH = 20;
  if (ent < shape.entropy && candidate.length < MIN_SECRET_LENGTH) continue;
  // else: low entropy but long — still a candidate, fall through to action
}
```

**Implementation Notes**:
- `MIN_SECRET_LENGTH = 20` is the threshold below which a low-entropy string is
  assumed to be a config value (`password=changeme` = 8 chars). Above it, a
  low-entropy string is suspicious (`token=aaaa...` 20 chars could be real).
- This only affects shapes WITH an `entropy` field (the generic-assignment
  shape). Provider-specific shapes have no `entropy` and are unaffected.
- Tune via tests: `token=aaaaaaaaaaaaaaaaaaaa` (20 a's, entropy ~0) blocks;
  `password=changeme` (entropy ~2.9, 8 chars) doesn't.

**Acceptance Criteria**:
- [ ] `token=aaaaaaaaaaaaaaaaaaaa` (20 low-entropy chars) → blocked
- [ ] `password=changeme` (8 chars) → not blocked
- [ ] `sk-ant-...` (provider shape, no entropy) → unaffected

### Unit 3: Provider-prefix shapes + bare-token gap documentation
**File**: `plugins/pi-sandbox/README.md` (docs), no code change
**Story**: `story-pi-sandbox-inspector-bare-token-docs`

No new generic bare-token detector. Document in the README's inspector section:
- The inspector catches tokens with known provider prefixes (`sk-ant-`, `ghp_`,
  `sk-`) and keyworded assignments (`token=...`, `secret=...`).
- Bare tokens without a known prefix (random OAuth tokens, JWTs, custom gateway
  tokens) pasted alone are NOT caught.
- Operators should add their own `SecretShape` with their provider's prefix for
  stack-specific coverage. Include a config example.

**Acceptance Criteria**:
- [ ] README inspector section documents the bare-token gap
- [ ] Config example for adding a custom provider shape

### Unit 4 (config edit, not a story): remove `^[A-Za-z]+$` from operator config
**File**: `~/.pi/agent/extensions/sandbox.json` (operator config, not repo)

Edit the live config to drop the `^[A-Za-z]+$` entry from
`tools.inspector.allowlist.regexes`. Document in the README that this regex
defeats the inspector and should not be used.

This is a one-line config edit on this host, done inline during implementation
(not a child story — it's operator config, not repo code).

## Implementation Order
1. Unit 1 (ReDoS guard) — independent, no deps
2. Unit 2 (entropy min-length) — independent, no deps
3. Unit 3 (bare-token docs) — independent, no deps
4. Unit 4 (config edit) — inline during implementation of 1-3

Units 1-3 are parallelizable (different functions in the same file, no
inter-deps). Unit 4 is a config edit done with the implementing stride.

## Testing
### Unit Tests: `plugins/pi-sandbox/extensions/sandbox.test.ts`
- Unit 1: safe-regex rejects `(a+)+`; input cap prevents hang on 100K field
- Unit 2: low-entropy 20-char blocks; low-entropy 8-char doesn't; provider shape unaffected
- Unit 3: docs-only (no test)
- Unit 4: config edit (no test; README note)

## Risks
- **Safe-regex false positives**: `isSafeRegex` might reject a legitimate
  pattern the operator needs. Mitigation: the heuristic is narrow (nested
  quantifiers only); document what it rejects and why. If it's too aggressive,
  the operator can report and we loosen the heuristic.
- **Entropy min-length tuning**: 20 is a guess. A real secret shorter than 20
  chars (some legacy API keys) would still pass. Mitigation: document the
  threshold; make it configurable in a future iteration if needed.
- **Residual ReDoS**: the input cap + analyzer don't catch *novel* short
  pathological patterns. Documented residual; the analyzer rejects known shapes
  at load, and the cap bounds the input size. A worker timeout (Q1c) is the
  future escalation if this proves insufficient.

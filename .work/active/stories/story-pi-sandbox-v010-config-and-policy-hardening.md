---
id: story-pi-sandbox-v010-config-and-policy-hardening
kind: story
stage: review
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# v0.1.0 config + policy hardening (Mediums from readiness review)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness adversarial review (multiple
reviewers). CONFIRMED mediums, not blockers but worth fixing for v0.1.0 polish.

## Problems (consolidated — share the config/policy surface)

- **M1. Global config replaces default deny lists** (`sandbox-config.ts:535,699`):
  `deepMerge(DEFAULT_CONFIG, globalConfig)` replaces filesystem arrays. An
  existing global config with `denyRead:["~/.ssh"]` silently drops the new
  `auth.json` default. Fix: union default + global by default, or require an
  explicit escape hatch. Warn when global omits known built-in sensitive defaults.

- **M2. Unknown config fields silently ignored** (`sandbox-config.ts:575-642`):
  README claims "ignored with warnings" but most unknown fields are silent. A
  typo (`"mdoe":"block"`) leaves `mode:"open"`. Fix: warn on ALL unknown keys
  at every object level, or fail-closed. Security config should not silently
  accept typos.

- **M3. `isSafeRegex` misses known ReDoS shapes** (`sandbox-config.ts:346,350`):
  rejects `(a+)+` but not `(a{1,2})+` or `(a|aa)+` — the heuristic only checks
  inner `+*?`, not counted quantifiers or overlapping alternation. The comment
  overclaims. Fix: extend detection for `{m,n}` inside quantified groups and
  overlapping alternations; fix the comment.

- **M4. Redact-before-block shape ordering** (`sandbox-config.ts:439,477`):
  shapes processed sequentially; an earlier `redact` can erase text a later
  `block` needs. Fix: two-pass — collect all block matches against the original
  text first; if any block matches, return block before applying redactions.

- **M5. `--no-sandbox` skips the tool-egress gate entirely** (`sandbox.ts:379-380`):
  the flag description says "disable OS-level bash sandboxing" but it also
  disables the in-process egress/inspector gate. Fix: rename/document the
  bypass as "disable all pi-sandbox protections," or split into separate flags
  (OS bwrap bypass vs in-process gates).

- **M6. Broken installed pi-sandbox misclassified as absent**
  (`sandbox-bridge.ts:52`): `Cannot find module` with a `node_modules/...` path
  classifies as absent (unsandboxed fallback) instead of broken (fail-closed).
  Fix: only root package absence classifies as absent; missing files inside an
  installed package are broken.

- **M7. First background/monitor call blocked by handshake race** (no-UI
  sessions): the background-tasks session probe is fire-and-forget; pi-sandbox
  gates before the probe publishes. Fix: make background-tasks session_start
  async-await the probe, or publish before tool calls can be gated.

## Fix direction

These are independent but share `sandbox-config.ts` / `sandbox-bridge.ts`. M1,
M2, M3, M4 are config/policy fixes; M5 is a flag/docs fix; M6, M7 are
integration fixes. Could be one story or split — the orchestrator decides
based on parallelism vs cohesion. M3 and M4 have design ambiguities (how strict
is the safe-regex analyzer? two-pass redact semantics?) worth surfacing.

## Acceptance (when scoped)

- [ ] M1: global config with `denyRead:["~/.ssh"]` still gets `auth.json` denied
- [ ] M2: unknown config field produces a warning naming the field
- [ ] M3: `(a{1,2})+` and `(a|aa)+` rejected at config-load; comment corrected
- [ ] M4: a redact shape before a block shape does not downgrade the block
- [ ] M5: `--no-sandbox` description is honest about what it disables
- [ ] M6: missing export-target file classifies as broken (fail-closed)
- [ ] M7: no-UI first-call background/monitor does not block on handshake race

## Hardened designs (post adversarial design review, 2026-07-07)

### M1 — global replaces default deny lists
**Decision: (2b) explicit `[]` = replace, absent = inherit defaults (via `Object.hasOwn`).**
- `Object.hasOwn(globalConfig.filesystem, "denyRead")` distinguishes omitted
  (→ union with DEFAULT_CONFIG) from explicit `[]` (→ replace with nothing).
- Apply to `denyRead` AND `denyWrite` (both are deny lists; union makes sense).
  Do NOT touch `allowWrite` (unioning defaults back in WIDENS an operator-
  narrowed config — unsafe; allowWrite stays replace-semantics).
- Preserve default-first order + dedupe (defaults first, then global additions).
- `deepMerge` is the wrong abstraction for this — add a dedicated global-merge
  path for deny lists that does the hasOwn check. Don't overload deepMerge.
- "Warn when omitting built-ins" is dropped (too noisy per the review; the
  operator is sophisticated and union-by-default is safe without nagging).

### M2 — unknown config fields silently ignored
**Decision: (1b) fail-closed on statically-checkable unknown keys; warn on dynamic-key objects.**
- Fail-closed (config parse error) on unknown keys at: top level, `filesystem`,
  `network`, `tools`, `tools.inspector`, `envScrub`, `backgroundTasks`. These
  have a known schema; a typo (`network.mdoe`) is a real error.
- Do NOT warn/fail on `tools.rules.<tool>` (tool names are dynamic) or
  `tools.inspector.scanFields.<tool>` (tool names are dynamic) — document these
  as not-catchable.
- Legacy known-unknown fields (the ASRT fields) stay as warnings (grandfathered).
- Include the source/path in errors: `global: network.mdoe`.
- The current validator returns only errors; a warn path needs a separate
  warning collector OR fold warns into the existing `additiveWarnings` channel
  for the warn cases. Fail-closed cases go in `errors` (existing).
- Add `maxLength` (B1-3) and any M1 escape-hatch keys to the known schema.

### M3 — isSafeRegex strictness
**Decision: (3b) extended rejection + per-shape `skipRegexSafetyCheck` escape hatch.**
- Extend rejection: `(X)+` where X contains a quantifier (nested-quantifier-on-
  group, current) PLUS `(X)+` where X is an alternation containing overlapping
  branches (e.g. `(a|aa)+`) PLUS `(X){m,n}` where X contains a quantifier.
- Narrow the detection to avoid false-positives on legitimate patterns like
  `(key|token|secret)-[a-z]+` (the alternation isn't INSIDE a quantified group).
  Match alternation inside a *quantified* group specifically.
- Add `skipRegexSafetyCheck?: boolean` to `SecretShape` (and the allowlist regex
  config) — an escape hatch for advanced operators who accept the ReDoS risk.
  Default false.
- Fix the overclaiming comment: state the heuristic is narrow, the runtime
  per-window cap is the primary backstop, and `skipRegexSafetyCheck` opts out.
- **Don't pretend the analyzer is sound** — it's a first-pass filter; the B1-4
  runtime cap is the real defense.

### M4 — redact-before-block shape ordering
**Decision: (a) two-pass against original text.**
- **Pass 1 (block decision)**: scan every `block`-action shape against the
  ORIGINAL unmutated text. If ANY block shape matches, return `block` immediately
  (don't apply any redactions; leave `input` unmutated).
- **Pass 2 (redact)**: if no block matched, scan `redact`-action shapes and apply
  redactions as today (sequential per-shape mutation).
- **Shared scanner helper**: the block pre-pass and the redact pass MUST share
  one scan helper (keyword filter, entropy, allowlist, chunking, B1-3 overlap) —
  don't duplicate the scan logic or it'll drift.
- **Block always wins** over overlapping redact matches (state explicitly).
- **Blocked calls leave `input` unmutated** (new behavior — currently a block
  short-circuits before mutation anyway, so this is already true).
- Preserve `onNoMatch` behavior and the redaction-cap fail-closed (B1-1).

### M5 — --no-sandbox scope
**Decision: (b) document honestly; no flag split.**
- Update `registerFlag("no-sandbox")` description to say it disables ALL
  pi-sandbox protections (OS bash sandbox AND in-process egress/inspector gate).
- Update EVERY fail-closed diagnostic that says "restart with --no-sandbox" to
  say it's a full extension bypass (not just bwrap). Audit sandbox.ts,
  sandbox-bwrap.ts, sandbox-config.ts, sandbox-spawn.ts.
- README is mostly honest already; verify and patch the stale surfaces.

### M6 — broken-as-absent
**Decision: fail-closed on broken, no-op on absent (package-root presence probe).**
- **Probe package-root presence** (not error-message matching): check
  `existsSync(resolve(nodeModulesPath, "@nklisch/pi-sandbox/package.json"))`.
  If the package.json doesn't exist → absent (no-op, unsandboxed fallback). If it
  exists but the subpath import fails → broken (fail-closed).
- Do NOT use `import("@nklisch/pi-sandbox/package.json")` (exports-sensitive —
  the package doesn't export `"."` or `./package.json`); use a direct fs probe.
- Add tests for: missing exported target file (broken), missing internal
  dependency (broken), vs truly-absent package (no-op).
- Message the fail-closed clearly: "pi-sandbox is installed but broken;
  install is incomplete. Fail-closed. Reinstall or restart with --no-sandbox."

### M7 — handshake race
**Decision: async-await the probe in background-tasks session_start.**
- Make background-tasks `session_start` handler async and `await` the sandbox
  probe (the `resolveSandboxSpawnBuilder()` promise). This blocks session_start
  until the handshake is published, so no `tool_call` can arrive before it.
- **Catch errors after awaiting** — preserve the current "publish broken handshake
  + log" behavior on probe failure (don't let a broken probe crash session_start).
- Latency: local dynamic-import/probe, negligible. If worried, a short bounded
  timeout — but that creates more states; prefer the unbounded await (the probe
  is local and fast).
- **Test the real ordering**: run both extensions' session_start, then simulate
  a no-UI tool_call. Tool-execute tests alone miss the gate race.
- pi-sandbox refreshes handshake during tool_call, so even if its own
  session_start saw "missing" (extension load order), the first tool_call reads
  the later-published value. The await closes the race for the no-UI first-call case.

**Stance check (M-cluster)**: all pi-sandbox's own config/policy (M1-M4) — no
cross-extension seam. M5/M6/M7 touch the background-tasks seam but are no-op when
sandbox is off (M5 only fires with the flag set; M6's broken path only when
installed; M7's await is negligible when sandbox is absent).

#### M7 implementation notes
- Files changed: `plugins/background-tasks/extensions/background-tasks.ts`, `plugins/background-tasks/extensions/background-tasks.test.ts`.
- Implementation: `session_start` now awaits the sandbox bridge probe and logs after the awaited failure path, preserving the broken-handshake publish behavior in `resolveSandboxSpawn()`.
- Tests added: `session-start sandbox bridge handshake > session_start awaits the sandbox bridge probe before no-UI tool_call gating`, which runs pi-sandbox `session_start`, verifies background-tasks `session_start` remains pending until the probe resolves, then runs a no-UI `tool_call` and confirms the refreshed handshake allows `background`.
- Discrepancies from design: none.
- Verification: `cd plugins/background-tasks && bun test` passed (73 tests).

#### M4 implementation notes
- Files changed: `plugins/pi-sandbox/extensions/sandbox-config.ts`, `plugins/pi-sandbox/extensions/sandbox.test.ts`.
- Implementation: `inspectToolInput` now uses a shared `scanSecretShape` helper for both block and redact passes. Block-action shapes scan the original unmutated field text first; any block match returns immediately and leaves `input` unchanged. Redact-action shapes run only after the block pre-pass finds no match and continue to apply redactions sequentially with the existing redaction-cap fail-closed behavior.
- Tests added: `tool input inspector > block pass scans original input before redact shapes mutate it (M4)` verifies a prior redact shape cannot erase the text required by a later block shape and that blocked input remains unmutated.
- Discrepancies from design: none.
- Verification: `cd plugins/pi-sandbox && bun test extensions/sandbox.test.ts -t "tool input inspector"` passed (7 tests).

#### M1 implementation notes
- Files changed: `plugins/pi-sandbox/extensions/sandbox-config.ts`, `plugins/pi-sandbox/extensions/sandbox.test.ts`.
- Implementation: added a dedicated global-config merge path for filesystem deny lists. Global `denyRead` and `denyWrite` now preserve built-in defaults first and dedupe global additions, while explicit empty arrays (`[]`) intentionally replace the deny list with nothing. `allowWrite` keeps its existing replace/narrow semantics.
- Tests added/updated: `loadConfig unions global deny lists with defaults unless explicitly emptied (M1)` covers default inheritance, dedupe, and the explicit-empty escape hatch; the existing global+project merge test now expects inherited defaults before global/project additions.
- Discrepancies from design: none.
- Verification: `cd plugins/pi-sandbox && bun test extensions/sandbox.test.ts -t "loadConfig reads global|unions global deny|config boundary contract"` passed (28 tests).

#### M2 implementation notes
- Files changed: `plugins/pi-sandbox/extensions/sandbox-config.ts`, `plugins/pi-sandbox/extensions/sandbox.test.ts`.
- Implementation: config validation now fails closed on unknown statically-checkable keys at the top level, `filesystem`, `network`, `tools`, `tools.inspector`, inspector secret shapes, inspector allowlist, `envScrub`, and `backgroundTasks`. Dynamic-key maps (`tools.rules.<tool>` and `tools.inspector.scanFields.<tool>`) remain value-validated without rejecting unknown tool names. Legacy ASRT fields remain grandfathered warnings.
- Tests added: unknown-field validation coverage for every known-schema level plus dynamic-map non-rejection, load-config source/path parse-error coverage for `global: network.mdoe`-style typos, and legacy ASRT warning coverage.
- Discrepancies from design: extended the known-schema check to inspector secret shapes and allowlist entries as statically-checkable nested config; dynamic tool-name maps remain explicitly exempt.
- Verification: `cd plugins/pi-sandbox && bun test extensions/sandbox.test.ts -t "M2|unknown-field|legacy ASRT|validateConfig"` passed (7 tests).

#### M3 implementation notes
- Files changed: `plugins/pi-sandbox/extensions/sandbox-config.ts`, `plugins/pi-sandbox/extensions/sandbox.test.ts`.
- Implementation: replaced the overclaiming `isSafeRegex` comment with a narrow-heuristic description and extended the heuristic to reject quantified groups that contain quantifiers (including counted quantifiers and counted outer quantifiers) plus quantified groups with overlapping alternation branches such as `(a|aa)+`. Legitimate alternation outside a quantified group, such as `(key|token|secret)-[a-z]+`, remains accepted. Added `skipRegexSafetyCheck?: boolean` to secret shapes and inspector allowlist regex config as an explicit operator escape hatch; runtime scan-window caps still apply.
- Tests added: validation coverage for `(a{1,2})+`, `(a+){1,3}`, `(a|aa)+`, allowlist regex safety, the safe assignment pattern, and shape/allowlist `skipRegexSafetyCheck` (including type validation).
- Discrepancies from design: allowlist escape hatch is modeled as `tools.inspector.allowlist.skipRegexSafetyCheck`, applying to all allowlist regexes, because the existing allowlist regex config is a string array rather than per-regex objects.
- Verification: `cd plugins/pi-sandbox && bun test extensions/sandbox.test.ts -t "M3|unsafe nested|regex heuristic|validateConfig"` passed (6 tests).

#### M5 implementation notes
- Files changed: `plugins/pi-sandbox/extensions/sandbox.ts`, `plugins/pi-sandbox/extensions/sandbox-bwrap.ts`, `plugins/pi-sandbox/extensions/sandbox-spawn.ts`, `plugins/pi-sandbox/extensions/sandbox-config.ts`, `plugins/pi-sandbox/README.md`.
- Implementation: updated `registerFlag("no-sandbox")` to describe the full disable semantics (OS bash sandbox plus in-process file/egress/inspector protections). Audited every fail-closed diagnostic that previously advised `--no-sandbox`, changing each to explicitly clarify it is a full extension bypass and disables both bwrap and in-process gate protections.
- Discrepancies from design: none.
- Verification:
  - `grep` audit completed: no stale diagnostic text keeps `restart with --no-sandbox` without the full-bypass clarification.
  - `cd plugins/pi-sandbox && bun test 2>&1 | tail -4` passed.

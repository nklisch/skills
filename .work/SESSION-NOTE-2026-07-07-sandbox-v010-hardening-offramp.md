# Session note: pi-sandbox v0.1.0 — full hardening + re-review (context offramp)

**Date:** 2026-07-07
**Branch:** `feat/pi-sandbox-first-party-bwrap` (open draft PR on GitHub)
**State at offramp:** 144 pi-sandbox + 75 background-tasks tests green locally. PR is review-clean (4-surface adversarial re-review passed with no remaining blockers). **2 CI gates failing upstream** — see below.

## What this session did (all on the sandbox PR branch, pushed through `7f2cdaa`)

### 1. Original v0.1.0 blockers (B1/B2/B3) + follow-ups
- B1 (inspector fail-open), B2 (bwrap path injection), B3 (allowWrite symlink escape): implemented, deep-reviewed (2-phase advisory→adversarial), 2 review blockers fixed inline.
- 5 follow-up blockers from that review (bwrapPath project-trust → global-only, redact-cap → fail-closed, keyword pre-filter → whole-field, window overlap → 2048, ReDoS test honesty): design decisions resolved with operator, implemented.

### 2. v0.1.0 hardening wave (7 stories) — adversarial design review → implement → adversarial result review
- **H3** block-mode private tmpfs `/tmp`+`/var/tmp`, force `TMPDIR=/tmp`.
- **H2** provider secret strip list expanded + regression test via pi-ai public `findEnvKeys`.
- **H1** monitor cancel: track child synchronously, per-job AbortController, bounded kill_failed (degraded direct-spawn only; 5b `pi.exec` path parked as known residual).
- **M7** handshake race: session_start async-awaits the sandbox probe.
- **M8** real-bwrap CI gate: `PI_SANDBOX_REQUIRE_BWRAP=1` env guard + `sandbox-bwrap-gate.yml` workflow.
- **B1-3** per-shape overlap: `maxLength` field on `SecretShape` (default 4096, capped <10K, =full match[0] length), per-shape scan overlap, overlong-pattern detection.
- **M1** deny-list union (`Object.hasOwn` absent-vs-`[]`); **M2** unknown-field fail-closed on static keys; **M3** isSafeRegex extended + `skipRegexSafetyCheck` escape; **M4** redact-before-block two-pass; **M5** `--no-sandbox` honest docs; **M6** broken-as-absent (package-root probe, fail-closed on broken).

Adversarial result review found 4 reproducible blockers (M3 wrapper bypass, M6 double-package.json path bug, H2 AWS container-creds leak, M8 ENOENT crash) — all fixed inline (`93d230a`).

### 3. Full v0.1.0 adversarial re-review (4 parallel fresh gpt-5.5 over integrated final state)
Found 3 more blockers, all fixed inline (`7f2cdaa`):
- **Sticky `y` regex flag** bypassed the inspector (chunked scan resets lastIndex per window) → rejected `y` at config-load.
- **Long-fixed-length secret evasion** (`BEGIN-A{5000}-END` > default overlap 4096) → converted overlong detection from warn → fail-closed (operator MUST declare `maxLength ≥ apparentMax`).
- **M8 ENOENT crash** in 2 more test files (`background-tasks.test.ts:145`, `sandbox-spawn.test.ts:12`) → wrapped `Bun.spawnSync(['bwrap'])` in try/catch.

### 4. Untangling (earlier in session)
- Split agile-workflow work (accidentally committed to sandbox branch) onto `agile-workflow-followups` branch/PR. Sandbox PR is now clean-scope: only `pi-sandbox` + `background-tasks` + `.work` (verified: 0 agile-workflow code files). Force-pushed the cleaned sandbox branch.

## ⚠️ CURRENT BLOCKERS — 2 CI gates failing on the PR (must fix before publish)

### CI-1: `Check extension dependencies / Root manifest covers extension imports` (failing ~9-11s)
**Root cause (confirmed locally):** `scripts/check-extension-deps.mjs:53` skips files matching `*.test.ts` (via `!e.name.includes(".test.")`), but the M8 worker created `plugins/pi-sandbox/extensions/sandbox-bwrap-test.ts` (matches `*-test.ts`, NOT `*.test.ts`). So the checker treats it as a shipped file and flags its `bun:test` import as missing from root `package.json`.
**Fix (not yet applied):** rename `sandbox-bwrap-test.ts` → `sandbox-bwrap.test.ts` (and update the 2 imports in `sandbox.test.ts` + `sandbox-spawn.test.ts` + `background-tasks.test.ts` that reference it). OR add `-test.ts` to the skip pattern in `check-extension-deps.mjs:53`. Rename is cleaner (matches convention).
**Local repro:** `node scripts/check-extension-deps.mjs` → prints "Missing from root package.json: bun:test imported by sandbox-bwrap-test.ts".

### CI-2: `Sandbox bwrap gate / Real bwrap integration gate` (failing ~43s)
**Not yet diagnosed** — needs the CI logs (gh not authed locally). Likely causes:
- (a) The `bun:test` resolution issue from CI-1 cascading (if `bun install` fails to resolve `bun:test`, the test run fails).
- (b) bwrap in the `ubuntu-latest` CI runner can't actually execute (user namespaces restricted in the container/runner) — the `bwrap --version` smoke step may pass but actual `bwrap --unshare-net` spawns fail. May need `--unshare-user` or a different runner config.
- (c) A real test failure under `PI_SANDBOX_REQUIRE_BWRAP=1` in CI that doesn't reproduce locally (env差异).
**To diagnose:** get the CI logs from GitHub (the "Failing after 43s" job's step output). Run `PI_SANDBOX_REQUIRE_BWRAP=1 bun test` locally in both plugins to confirm it's green locally (it was, but re-verify after any CI-1 fix).

## Operator decisions locked this session
- H3 → (a) private tmpfs; B1-3 → (a) maxLength field; H2 → (c) hand-maintain + test; M3 → (b) narrow + escape hatch; M4 → (a) two-pass; M5 → (b) honest docs; M6 → fail-closed on broken; M8 → (a) CI-only env guard; H1 → (5a) degraded direct-spawn only; **5b parked** (pi.exec absent-path, known residual).
- Stance: pi-sandbox is opt-in; all seams no-op when sandbox is off. Single operator (currently); config changes affecting other operators don't matter for v0.1.0.

## Known residuals (documented in README, accepted for v0.1.0)
- `--no-sandbox` doesn't propagate to background/monitor (stricter-than-requested; workaround: `sandboxIntegration:"off"`).
- TOCTOU symlink race in file-policy (inherent to path-based checks; needs fd-based ops).
- RPC/API direct bash bypass (pi-core limitation).
- `filter` network mode deferred (needs topology design).
- IPC namespace not isolated; HOME + `--ro-bind / /` credential exposure.
- 5b: `pi.exec` monitor path not cancellable mid-poll (install pi-sandbox for cancellable monitors).

## Nits (low severity, not fixed)
- `onNoMatch:"block"` ignored when `secrets:[]` empty (misconfiguration edge).
- Overlapping-alternation via charclass passes `isSafeRegex` (window cap bounds it).
- Cap-overflow block leaves a prior redact's mutation (security property holds — block prevents egress).
- `maxLength: 9999` validates but forces stride=2 (perf, not correctness).

## Branch / PR state
- Sandbox PR: `feat/pi-sandbox-first-party-bwrap` → `main`, open draft, at `7f2cdaa`. **78 commits ahead of main.** Review-clean except the 2 CI gates.
- Agile PR: `agile-workflow-followups` → `main`, separate, 9 commits. Carries 2 paused bug stories at `drafting` (install-work-view fallback-gating design decision; dist-version-drift CI rebuild).
- **Version:** `plugins/pi-sandbox/package.json` stays at `0.1.0` — v0.1.0 was never published (draft PR), so NO version bump. Bump only at publish time.
- **Branch name:** operator noted it should reflect "full v0.1.0" not just "first-party-bwrap" — rename TBD by operator (renaming a branch with an open PR is a GitHub UI operation).

## Next session pickup
1. **Fix CI-1** (rename `sandbox-bwrap-test.ts` → `sandbox-bwrap.test.ts` + update imports). Quick.
2. **Diagnose CI-2** from GitHub CI logs; likely bwrap-in-CI execution issue or cascade from CI-1.
3. **Fresh re-review** (operator's request): once CI is green, run another full 4-surface adversarial pass over the final state (the re-review found blockers each time, so one more after the CI fixes is warranted before publish).
4. Do NOT bump version (v0.1.0 unpublished). Do NOT push agile-workflow work to the sandbox PR.

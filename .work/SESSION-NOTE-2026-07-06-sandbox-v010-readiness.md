# Session note: pi-sandbox v0.1.0 readiness review + work filing

**Date:** 2026-07-06
**Branch:** `feat/pi-sandbox-first-party-bwrap`
**State at handoff:** 173 tests green. Branch is 26+ commits ahead of upstream (unpushed).

## What this session did

### Phase 1: Full security audit
Ran a 5-surface audit of the pi-sandbox plugin (bwrap args, env/secret, tool-egress
inspector, config merge, file-policy). Filed 5 backlog items. Repro-confirmed the
glob-inertness gap (C1/H1).

### Phase 2: First drain (inline — process gap acknowledged)
Implemented 4 fixes inline + advanced to `done` manually:
- glob deny enforcement (in-process file-policy)
- default denyRead expansion (auth.json etc.)
- allowWrite canonical-containment narrowing
- block-mode Unix-socket masking
Plus the cross-pkg handshake test.

### Phase 3: Process honesty correction
User caught that I drained manually, not via agile-workflow, and over-claimed two
items as `done` when partial. Reverted those to `backlog` with honest Status sections.
Ran a first adversarial review (3 parallel gpt-5.5) — found 2 regressions:
- **R1**: block-mode `/var/run` symlink broke bwrap (test was argv-only, never ran bwrap)
- **R2**: degraded monitor ignored sanitized env
Fixed both forward with real-bwrap regression tests. Folded review records into item
bodies (the missing archaeology).

### Phase 4: Proper substrate routing
Re-ran the remaining 3 items through the substrate properly:
- `scope` → promoted 2 stories + 1 feature to active
- `implement` → implemented the 2 stories (one delegated to spark subagent)
- `review` → fast-lane advanced both to `done`
- `feature-design` → ran the inspector feature through the interactive question gate
  (Q1-Q4 design decisions), spawned 3 child stories, implemented + reviewed all to `done`

### Phase 5: v0.1.0 readiness adversarial review
4 parallel fresh-context gpt-5.5 deep-lane reviewers over the full extension surface.
**Verdict: not v0.1.0-ready as-is.** 3 blockers + 3 highs + ~10 mediums.

## Work items filed (this phase)

### Active stories (at `stage: implementing`, ready for orchestrator)
- `story-pi-sandbox-inspector-failopen-cap` (B1) — inspector truncates at 10K, secret
  after padding evades. Fix: chunked scan / fail-closed-on-overflow.
- `story-pi-sandbox-bwrap-path-injection` (B2) — bwrap resolved from untrusted PATH
  per-command; fake bwrap = sandbox escape. Fix: pin at session_start, allowlist paths.
- `story-pi-sandbox-allowwrite-symlink-escape` (B3) — allowWrite accepts lexical
  containment; project symlink widens writable set. Fix: require canonical containment.

### Backlog (design ambiguities surfaced for orchestrator)
- `idea-pi-sandbox-monitor-cancel-lifecycle` (H1) — cancelled monitor's poll process
  keeps running; onChildSpawn fires on close not spawn.
- `idea-pi-sandbox-provider-strip-list-incomplete` (H2) — missing ~15 provider env keys
  (ANT_LING, MINIMAX, MOONSHOT, KIMI, XIAOMI_*, AWS_SESSION_TOKEN, etc.).
- `idea-pi-sandbox-block-mode-tmp-sockets` (H3) — /tmp and /var/tmp sockets still
  reachable in block mode. Design ambiguity: air-gap vs network-blocked.
- `idea-pi-sandbox-v010-config-and-policy-hardening` (M1-M7) — consolidated config/
  policy fixes (global-replaces-default, silent unknown fields, isSafeRegex gaps,
  redact-before-block ordering, --no-sandbox gate skip, broken-as-absent, handshake race).
- `idea-pi-sandbox-real-bwrap-ci-gate` (M8) — release CI must fail if bwrap tests skip.

## Design ambiguities to surface on refresh

Each filed item has a `## Fix direction` and (where relevant) `## Design ambiguity`
section. The blockers (B1/B2/B3) have concrete fix options with tradeoffs noted.
The orchestrator should:
1. Pick the fix approach per item (the options are laid out)
2. Surface any 50/50 ambiguity back to the operator (B3 has a symlinked-cache-dir
   use case; H3 has air-gap vs network-blocked; H2 has import-from-pi-ai vs generate)
3. The 3 blockers are independent (different files: inspector in sandbox-config.ts,
   bwrap in sandbox.ts/sandbox-bwrap.ts, allowWrite in sandbox-file-policy.ts) —
   parallelizable.

## Non-goals / known residuals acceptable for v0.1.0 (document, don't fix)
- RPC/API direct bash bypass (pi-core limitation, documented)
- `filter` network mode deferred (needs topology design)
- TOCTOU symlink races (inherent to path-based checks; needs fd-based ops)
- IPC namespace not isolated (`--unshare-ipc` missing)
- HOME + `--ro-bind / /` credential exposure (tmpfs-HOME is the bigger fix)

## Branch state
- 173 tests green across pi-sandbox + background-tasks
- bwrap 0.11.0 available on this Linux host
- Unpushed: 26+ commits on `feat/pi-sandbox-first-party-bwrap`
- Do NOT push until the 3 blockers are fixed (per operator)

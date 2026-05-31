---
id: epic-substrate-cli-freshness-shim
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-cli-freshness
depends_on: [epic-substrate-cli-freshness-versioning, epic-substrate-cli-freshness-discovery, epic-substrate-cli-freshness-self-heal]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Shim launcher entrypoint

## Brief

Replace the frozen-copy entrypoint with a tracked, portable launcher at
`.work/bin/work-view` that defers to the plugin's **current** binary (located
via the discovery procedure verified by the spike feature), with a tracked
portable bash fallback when no plugin is found. Because the launcher holds no
query logic, the drift class disappears structurally rather than being patched
— and because the launcher is portable, stable text, it satisfies the
"git-tracked, overwrite-in-place, never gitignored" constraint by construction:
agent-visible, clean diffs, portable across platforms. Once it lands, the
self-heal hook only needs to ensure the launcher is present and current.

**Conditional feature.** This proceeds only if the discovery spike
(`epic-substrate-cli-freshness-discovery`) confirms reliable plugin-root
discovery. If the spike finds discovery unreliable, this feature is explicitly
ruled out and the epic completes on the self-heal mechanism alone — that
ruled-out decision is itself a valid completion of this feature.

Scope boundary: does NOT revisit plugin-side distribution (settled by
`docs/research/substrate-binary-runtime.md`).

## Epic context
- Parent epic: `epic-substrate-cli-freshness`
- Position in epic: the elegant end-state, gated on the discovery spike.
  Depends on versioning (identity/fallback freshness), discovery (the gate), and
  self-heal (reuses its install path + avoids churn on the shared entrypoint).

## Foundation references
- `plugins/agile-workflow/scripts/install-work-view.sh` — changes what gets
  installed (a launcher) rather than a frozen copy.
- `plugins/agile-workflow/scripts/work-view.sh` — the portable bash fallback the
  launcher defers to when no plugin is found.
- `plugins/agile-workflow/work-view/dist/<triple>/work-view` — the plugin's
  current binary the launcher prefers when discovery succeeds.

## Open design question (for feature-design, informed by the discovery spike)
- Whether the launcher prefers a local prebuilt sidecar (speed) or defers to the
  plugin binary with a bash-only fallback (simplicity, no extra artifact). Lean:
  decide from the spike's findings — if discovery is reliable, plugin-binary-first
  with a bash fallback and no sidecar; revisit only if discovery is shaky.

## Note (cross-model review)

Per the self-heal feature's accepted findings, the project-side tracked
entrypoint is now the portable, source-current bash implementation — so a
content-portable, version-current **floor already exists** before this feature
runs. That sharpens the shim's role to a pure *speed/freshness optimization*:
prefer the plugin's current prebuilt binary (via verified discovery, with
version-aware selection) and fall back to the already-portable bash floor. The
shim is therefore strictly additive and lower-risk than originally framed; if
discovery is ruled out, nothing is lost beyond the optimization.

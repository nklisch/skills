---
id: idea-pi-sandbox-capability-optimistic-bwrap-runtime
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox]
---

# Capability published before bwrap runtime viability is proven

## Capture

Adversarial release-gate review (lane 4). On Linux, an executable bwrap binary can resolve
successfully (trusted-path check passes) while being unable to create a sandbox at runtime
(e.g. an AppArmor/kernel user-namespace restriction). `session_start` sets `sandboxEnabled`/
`sandboxInitialized` true and publishes `{active:true, failClosed:false}`. The first actual
bash call later fails in `spawn`; no transition clears the capability. A forge consumer can
observe `active:true` although mediated bash cannot establish the OS boundary.

This is fail-closed for the failed command (it does not fall through to local bash), so it is
not a direct shell-escape Blocker. It is an inaccurate forge-facing availability/isolation
signal.

## Fix (post-0.1.0)

Either: (a) probe bwrap with a trivial spawn at session_start to prove runtime viability before
publishing `active:true`, or (b) republish the capability as inactive when a bash spawn fails
(add a spawn-failure hook that clears `sandboxInitialized` and republishes). Option (a) is
cleaner (fail-closed at init rather than per-command).

For 0.1.0: document that `active` reflects init-time path resolution, not proven runtime
viability (the "what active does not prove" list should include "that bwrap can actually
establish its namespace at runtime").

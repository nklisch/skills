---
id: story-pi-sandbox-block-mode-tmp-sockets
kind: story
stage: drafting
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# Block mode still exposes /tmp and /var/tmp Unix sockets (H3)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness adversarial review (bwrap/bash
deep-dive). CONFIRMED high. Previously known (documented as deferred in the
earlier block-mode-unix-socket-leak item), but flagged again as a v0.1.0
readiness gap because "block = air-gap" is the marketing claim.

## Problem

`network.mode="block"` masks `/run`, `/var/run`, `/tmp/.X11-unix` but NOT
`/tmp` itself or `/var/tmp`. Filesystem Unix sockets under those paths remain
reachable: `/tmp/ssh-*/agent.*`, `/tmp/dbus-*`, editor/IDE sockets. A blocked
sandbox can still connect to host IPC services for exfiltration or privileged
actions.

## Fix direction

In block mode, mount private tmpfs over `/tmp` and `/var/tmp` as well, or
provide a private sandbox temp dir and set `TMPDIR` to it. If host `/tmp`
write compatibility is required for legitimate commands, make that an explicit
`open`-network-mode exception, not part of "fully air-gapped" block mode.

## Design ambiguity (surface for orchestrator)

Masking `/tmp` with tmpfs breaks any sandboxed command that expects to write
to `/tmp` (many scripts, builds, package managers). Options:

- **(a) Private tmpfs /tmp + /var/tmp, set TMPDIR** — strictest; the sandbox
  gets its own empty /tmp. Breaks commands that read host /tmp.
- **(b) Keep host /tmp but mask socket files** — can't easily glob-mask
  `/tmp/ssh-*` with bwrap (it needs literal paths). Could mask `/tmp` ro and
  bind a writable subdirectory.
- **(c) Document block mode as "network-blocked, not IPC-blocked"** — accept
  the gap, fix the marketing. Cheapest, leaves the hole.

The orchestrator should decide whether v0.1.0 block mode is "air-gap" (a) or
"network-blocked with documented IPC residual" (c). (b) is a middle ground
worth considering.

## Acceptance (when scoped)

- [ ] A socket under `/tmp/ssh-*` or `/tmp/dbus-*` is NOT reachable in block mode
- [ ] Sandboxed commands that need a temp dir still work (TMPDIR set, or /tmp writable)
- [ ] The block-mode behavior is documented honestly (air-gap vs network-blocked)

## Hardened design (post adversarial design review, 2026-07-07)

**Decision: (a) private tmpfs `/tmp` + `/var/tmp`, force `TMPDIR=/tmp`.**

Refinements from the design review:
- **Force `TMPDIR=/tmp`** in block mode (not just inherit) — if the host `TMPDIR`
  points outside `/tmp` into a denied/ro path, temp-using commands would fail.
  Forcing `TMPDIR=/tmp` makes the private tmpfs the canonical temp dir.
- **Mount order**: add `/tmp` + `/var/tmp` tmpfs AFTER the allowWrite mounts, so
  an explicit `allowWrite:["/tmp"]` (or default) doesn't re-expose host `/tmp`.
  Preserve the `/var/run` canonical-dedupe pattern; don't reintroduce symlink
  mount failures.
- **denyWrite override**: a private tmpfs on `/tmp` overrides a `denyWrite:["/tmp"]`
  overlay — this is correct (writes go to the private tmpfs, not host files) but
  document it. The tmpfs is sandbox-private; denyWrite governs host paths.
- **Sticky bit**: `--tmpfs /tmp` creates mode 755, not sticky 1777. `mktemp -d`
  works for the same UID, but document that world-writable sticky semantics
  aren't preserved (acceptable for a single-user sandbox).
- **tmpfs size**: bwrap `--tmpfs` is unbounded; document the DoS residual (a
  sandboxed command could fill tmpfs memory). No size cap in v0.1.0.
- **Real-bwrap test required** (not just arg-list) — the R1 regression shipped
  because the original test only checked args. Add a real-bwrap test that a
  socket under `/tmp/ssh-*` is unreachable in block mode.

**Stance check**: block mode is an explicit sandbox opt-in (`network.mode:"block"`),
so the no-op-by-default constraint doesn't apply — this only activates when the
operator has configured the sandbox.

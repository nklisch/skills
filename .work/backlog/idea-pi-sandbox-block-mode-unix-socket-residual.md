---
id: idea-pi-sandbox-block-mode-unix-socket-residual
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox]
---

# `network.mode=block` permits unmasked host Unix-socket IPC (residual)

## Capture

Adversarial release-gate review (lane 1). `network.mode=block` uses `--unshare-net` + tmpfs-masks
`/run`, `/var/run`, `/tmp`, `/var/tmp`, `/tmp/.X11-unix` — but does NOT block `AF_UNIX` or mask
all filesystem-visible sockets. A host service listening on a Unix socket in an allowed project
directory (or any readable unmasked host path) remains reachable despite block mode.

Reviewer-verified reproducible: a sandboxed Python client connected to a host Python Unix socket
in a project directory and received `HOST_IPC_REACHED`.

Note: there's an existing backlog item `idea-pi-sandbox-block-mode-unix-socket-leak` marked
`stage: done` — that was the partial fix (masking the 5 standard socket dirs). This is the
RESIDUAL after that fix: sockets outside those 5 paths.

## Fix (post-0.1.0)

Either block `AF_UNIX` via seccomp (bwrap supports seccomp filters), or mask all
`.sock`/`.socket` files in the writable surface, or document that block mode is a
network-namespace boundary only and does not prevent Unix-socket IPC to project-local sockets.

For 0.1.0: document as a known gap in the threat model + README (block mode blocks TCP/UDP
egress but not Unix-socket IPC to unmasked paths).

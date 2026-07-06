---
id: idea-pi-sandbox-block-mode-unix-socket-leak
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-05
updated: 2026-07-05
git_ref: 9f9a051
---

# `network.mode=block` still exposes host Unix sockets (Docker, D-Bus, X11)

## Source

Surfaced in the 2026-07-05 full security audit of `plugins/pi-sandbox/` (bwrap arg-builder
deep dive). Not a live incident on this host but a real escape vector on any host where the
agent user has access to a privileged Unix socket.

## Problem

`sandbox-bwrap.ts:38,63` — block mode adds `--unshare-net`, which creates a network
namespace blocking TCP/UDP, but the sandbox still starts from `--ro-bind / /`. Filesystem
Unix sockets under `/run`, `/var/run`, `/tmp`, or user runtime dirs remain visible and
reachable if permissions allow. A blocked sandbox can still talk to host services:

```sh
curl --unix-socket /var/run/docker.sock http://localhost/version
```

If the agent user has Docker access, this is a sandbox escape: ask Docker to start a
container with host mounts / host networking. D-Bus (`/run/dbus/system_bus_socket`) and
X11 (`/tmp/.X11-unix`) are similarly reachable.

## Recommended fix direction

In `network.mode=block`, mask socket-heavy runtime directories by default: tmpfs over
`/run`, `/var/run`, `/run/user/$UID`, `/tmp/.X11-unix`, and SSH/GPG agent socket dirs.
Re-allow only specifically required paths. Consider doing this in `open` mode too for
defense-in-depth, since `open` is not an egress boundary but Unix-socket reach is a
filesystem concern, not a network one.

## Scope hint

Distinct from the `default-denyread-credential-gaps` item (file reads) — this is about
IPC/socket escape in the supposedly air-gapped mode. One focused fix in
`buildBwrapArgs` for the `block` branch.

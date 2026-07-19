---
id: story-pi-sandbox-inode-identity-redesign
kind: story
stage: backlog
tags: [security, sandbox, plugin]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-12
---

# Inode-identity-based in-process file policy (post-0.1.0 redesign)

## Scope

Parked post-0.1.0 redesign. The current in-process file policy (`sandbox-file-policy.ts`)
AND the bwrap argv builder (`sandbox-bwrap.ts buildBwrapArgs`) both guard against hardlink
aliases via a mutable-pathname `assertNoHardlinkedDeniedFiles` rescan. A fresh-context
re-review (2026-07-11, pass 3) confirmed the race spans BOTH boundaries: while the rescan
runs, a same-user process can move the denied pathname aside (ENOENT is skipped) while an
opened fd (in-process) or a writable bind (bwrap) references the credential inode through
a hardlink alias. 10,000-attempt probe disclosed 59.6% on the in-process path.

## The redesign

Capture the denied inodes at policy-installation time (session_start), and check both
opened fds (in-process) AND bwrap bind-mount sources against that captured set — not
mutable-pathname rescanning. This fully closes the concurrent hardlink bypass across both
boundaries.

## The redesign

Capture the denied inodes at policy-installation time (session_start), and check the
opened fd's inode against that captured set — not mutable-pathname rescanning. This
fully closes the post-start hardlink bypass (R4) without a raceable rescan.

## Why parked

The 0.1.0 decision (option A) is to treat both the in-process file policy and the bwrap
hardlink guard as defense-in-depth (not concurrency-hard) and document the residual
honestly across BOTH boundaries. bwrap remains the stronger boundary (blocks network,
most paths, process inspection) but is not concurrency-hard against the hardlink race.
A full inode-identity redesign across both surfaces is a multi-file `[security]` design
change with its own review risk; doing it in a further rework pass would extend the 0.1.0
cycle further. Tracked here for post-0.1.0.

## Triggers to pull in

- After 0.1.0 ships, scope this as a `[security]` feature under the pi-sandbox plugin.
- Pair with the `openat`-based design the threat model names as the full TOCTOU fix.

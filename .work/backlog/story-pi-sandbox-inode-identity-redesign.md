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
updated: 2026-07-11
---

# Inode-identity-based in-process file policy (post-0.1.0 redesign)

## Scope

Parked post-0.1.0 redesign. The current in-process file policy (`sandbox-file-policy.ts`)
uses path-based deny checks + a runtime nlink guard that re-scans the deny pathnames.
A fresh-context re-review (2026-07-11) reproduced a concurrent bypass: while the nlink
guard rescans deny paths, a same-user process can move the denied pathname aside (ENOENT
is skipped) while the open fd still references the credential inode through a hardlink
alias. 10,000-attempt probe disclosed 59.6%.

## The redesign

Capture the denied inodes at policy-installation time (session_start), and check the
opened fd's inode against that captured set — not mutable-pathname rescanning. This
fully closes the post-start hardlink bypass (R4) without a raceable rescan.

## Why parked

The 0.1.0 decision (option A) is to treat the in-process file policy as defense-in-depth
(the bwrap OS layer is the primary boundary for sandboxed bash) and document the
concurrency residual honestly. A full inode-identity redesign is a multi-file `[security]`
design change with its own review risk; doing it in the 4th rework pass on this file would
extend the 0.1.0 cycle further. Tracked here for post-0.1.0.

## Triggers to pull in

- After 0.1.0 ships, scope this as a `[security]` feature under the pi-sandbox plugin.
- Pair with the `openat`-based design the threat model names as the full TOCTOU fix.

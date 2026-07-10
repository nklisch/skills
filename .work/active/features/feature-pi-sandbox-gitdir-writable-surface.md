---
id: feature-pi-sandbox-gitdir-writable-surface
kind: feature
stage: drafting
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-10
updated: 2026-07-10
---

# Auto-include a submodule/worktree git directory in the writable surface

## Brief

When a pi session's cwd is a git submodule (or a linked worktree), the sandbox
makes the working tree writable but **not the git directory** — so working-tree
writes succeed but every git index/object write (`git add`, `git commit`, ref
updates) fails. The session that surfaced this was working in
`/home/agent/projects/SNC/games/library`, a submodule whose `.git` file points to
`../../.git/modules/games/library` (i.e. `/home/agent/projects/SNC/.git/modules/games/library`),
which lives on the read-only root, outside the `allowWrite:[".", "/tmp"]` bind-mount.

Root cause: `buildBwrapArgs` (`plugins/pi-sandbox/extensions/sandbox-bwrap.ts`)
builds the writable surface purely from the configured `allowWrite` entries,
canonicalizing each to an existing path and emitting a `--bind` for it. It has no
awareness that a git working tree's metadata directory may live outside the tree.
The in-process file-tool policy (`sandbox-file-policy.ts`) has the same blind
spot: `enforceWritePolicy` checks `denyWrite` then `allowWrite` against the target
path, so a write into the out-of-tree git dir is rejected as "outside the
writable allowlist" even when the working tree itself is allowed.

This feature makes the sandbox **auto-discover** the git directory for each
allowWrite root that is a git working tree, and add it to the writable surface —
both the bwrap bind mounts and the in-process allowWrite set — so git operations
work inside submodules and linked worktrees without operator hand-configuration.

## Strategic decisions

- **Auto-discover vs. explicit opt-in**: **auto-discover**. The operator already
  granted write to the working tree; the git dir is a necessary corollary for git
  to function, and its path is an implementation detail the operator shouldn't
  have to hand-configure. Security is preserved because denyRead/denyWrite always
  take precedence over allowWrite in both layers (the deny-overlay logic in
  `buildBwrapArgs` fires after allowWrite binds; `enforceWritePolicy` checks deny
  before allowWrite) — so a `.git` file pointing at a denied path is still
  blocked, and a `.git` file pointing at an arbitrary host path is still
  confined to the discovered git dir, not the whole parent.
- **Scope of discovery**: cover both the **gitfile** form (`.git` is a file
  containing `gitdir: <path>`, used by submodules and `git worktree add`) and the
  **directory** form (`.git` is a directory, the common case — already inside the
  working tree and thus already writable, no action needed). Linked worktrees
  created via `git worktree add` use the gitfile form and are covered by the same
  mechanism.
- **Where the fix lives**: the discovery runs at mount-build time in
  `buildBwrapArgs` (bwrap layer) AND at policy-installation time in `sandbox.ts`
  `session_start` (in-process layer), so both surfaces stay consistent — the same
  hardlink-alias / deny-precedence invariants that already span both layers apply
  to the discovered git dir too.

## Design

(to be filled by `feature-design` — discovery mechanism, security analysis,
test plan, and the exact integration points in `buildBwrapArgs` and
`session_start`)

<!-- Subsequent sections (Design, Implementation Notes, etc.) accumulate as
work progresses. -->

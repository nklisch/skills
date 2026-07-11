---
id: story-pi-sandbox-gitfile-allowwrite-escape
kind: story
stage: review
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

# `.git` gitfile allowWrite escape

## Scope

Adversarial release-gate review (lane 1, bwrap mount surface) found a verified-reproducible allowWrite escape. A `.git` gitfile in the writable worktree pointing at ANY external repo's `.git` directory (which has a `HEAD` regular file) causes `discoverGitDirs` to pin that external path writable via `--bind`. The `HEAD` check (meant to reject `gitdir: /etc`) does NOT help — the attacker points at a real git directory elsewhere on the host, e.g. a crafted submodule in a cloned repo.

Host-verified reproducible:
```
discovered git dirs: [ "/tmp/gitfile-escape-W28AqT/unrelated/.git" ]
ESCAPE: external repo .git pinned writable? true
external .git outside worktree? true
```

The pinning-at-init (designed to prevent post-init mutation) does not help when the gitfile is malicious AT session start (e.g. a cloned repo with a crafted submodule pointing at a host path).

## Unit

`plugins/pi-sandbox/extensions/sandbox-bwrap.ts` — `discoverGitDirs` (~line 381-443) and the bind at ~line 90-95.

The fix must constrain discovered git dirs to paths that are legitimately reachable from the allowWrite root via git's own gitfile resolution semantics — NOT any host path that happens to have a `HEAD` file. Options (pick during design):
- **Require the resolved git dir to be within an allowWrite root** (reject external gitfile targets entirely). Breaks legitimate submodules whose `.git/modules/<name>` is outside the working tree but inside the project root. Acceptable if the project root is the allowWrite entry.
- **Require the resolved git dir to be within the project's own `.git/modules` or a known git metadata location** (e.g. the gitfile must resolve to `<allowWrite-root>/.git/modules/...` or `<parent-of-allowWrite-root>/.git/modules/...`). Matches git's actual submodule/worktree layout.
- **Require the gitfile target to be within an ancestor of the allowWrite root** (so `worktree/.git` → `../.git/modules/sub` is allowed, but `gitdir: /home/user/some-unrelated-repo/.git` is not).

This needs design (feature-design routing, `[security]` not `[refactor]`). The fix is a behavior change to discovery's validation.

## Acceptance criteria

- [ ] `discoverGitDirs` no longer pins a gitfile target that points at an arbitrary external repo's `.git`.
- [ ] Legitimate submodules (`gitdir: ../../.git/modules/<name>` resolving within the project tree) still work.
- [ ] A test reproduces the escape (gitfile → external repo .git) and asserts it is NOT pinned.
- [ ] A test confirms a legitimate submodule gitfile IS still discovered and pinned.

## Implementation discovery

The proposed parent-of-`allowWrite` boundary breaks a legitimate Git layout: linked worktrees may be created anywhere, and their `.git` gitfile points back to the source repository's per-worktree metadata at `<source-repo>/.git/worktrees/<name>`, which need not be inside the linked worktree's parent directory.

Verified locally with a source repository at `/tmp/<fixture>/main` and a linked worktree at `/tmp/<fixture>/elsewhere/nested/wt`; Git generated:

```text
gitdir: /tmp/<fixture>/main/.git/worktrees/wt
```

For an `allowWrite` root of `/tmp/<fixture>/elsewhere/nested/wt`, the proposed project boundary is `/tmp/<fixture>/elsewhere/nested`, so the valid git directory is outside it and would be rejected. The existing discovery contract explicitly supports linked worktrees, so shipping the proposed constraint would regress a real workflow.

Returned to `stage: drafting` per the design-flaw escape hatch. The design needs an authorization rule that distinguishes Git-created linked-worktree metadata from an arbitrary external repository git directory without trusting only the gitfile target and `HEAD` shape.

## Revised design decision (after re-design)

A sound path-containment rule that preserves linked-worktree support is NOT available without operator registration: linked worktrees legitimately point anywhere on the host, so any path-containment constraint regresses them. The distinguishing signal between a legitimate gitfile (created by `git worktree add`/`git submodule`) and a malicious one (crafted in a cloned repo) cannot be derived from the gitfile target + `HEAD` shape alone.

**Chosen fix (0.1.0): make discovery opt-out + document the residual loudly.**

1. Add a global-only config field `filesystem.allowGitDirDiscovery` (default `true` — preserves current behavior). When `false`, `discoverGitDirs` returns `[]` (no external git dirs pinned). An operator who clones untrusted repos sets this `false` to close the escape; the writable surface is then confined to the allowWrite root's own `.git` directory (the common case, already covered by the root bind).
2. Project-local config CANNOT set this field (global/operator-only, like `bwrapPath`) — a malicious checkout cannot re-enable discovery to widen the surface.
3. Document the residual in THREAT_MODEL + README: git-dir discovery pins a gitfile's external target writable; a malicious gitfile in a cloned repo can widen the writable surface to an arbitrary host git dir. Operators who clone untrusted repos MUST set `allowGitDirDiscovery: false` globally.
4. The `/sandbox` command reports whether discovery is active.

This is a defense-in-depth opt-out, not a complete fix — the complete fix (operator-registered git-dir allowlist, or binding only specific git-metadata subpaths) is post-0.1.0. But it gives operators a single switch to close the escape for untrusted-clone workflows without regressing linked worktrees.

**Post-0.1.0 direction** (tracked, not in this story): an `allowGitDirs` global-only allowlist where the operator explicitly registers external git dirs; discovery pins only targets in an allowWrite root OR in `allowGitDirs`. That fully closes the escape with operator-controlled trust, at the cost of hand-configuring linked worktrees.

Re-routed through design; advance to `implementing` with the revised scope.

## Implementation notes

- Added global-only `filesystem.allowGitDirDiscovery`, defaulting to `true` for existing linked-worktree and submodule behavior. `discoverGitDirs` returns no targets when it is `false`, so external gitfile targets are neither pinned nor added to the in-process writable set.
- Project-local attempts to set the switch are ignored with the additive-only warning `project tried to set allowGitDirDiscovery; ignored (global/operator-only)`; a cloned checkout cannot re-enable discovery after an operator disables it globally.
- `/sandbox`, README, and the 0.1.0 threat-model release scope now expose the switch and document the untrusted-gitfile residual plus the post-0.1.0 operator allowlist direction.
- Added a regression test using a gitfile that targets an unrelated host Git directory: discovery disabled yields no pinned path and no `--bind`. The existing default-on submodule discovery tests remain green.

## Verification

- `bun test plugins/pi-sandbox/extensions/` — 239 pass, 0 fail.

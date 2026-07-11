---
id: story-pi-sandbox-gitfile-allowwrite-escape
kind: story
stage: implementing
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

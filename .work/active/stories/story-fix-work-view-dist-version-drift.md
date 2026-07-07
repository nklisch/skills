---
id: story-fix-work-view-dist-version-drift
kind: story
stage: implementing
tags: [bug, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-21
updated: 2026-07-07
---

# Refresh stale work-view dist binaries for current manifest

## Symptom

`plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh` fails on the
current checkout because the agile-workflow channel manifests report the current
plugin version, but every committed
`plugins/agile-workflow/work-view/dist/<triple>/work-view` binary and the dogfood
`.work/bin/work-view` report an older `work-view` version.

## Repro

```bash
cd /home/nathan/dev/skills
bash plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh
```

Observed failures:

Observed at filing time:

- Manifests had advanced past the committed dist binaries.
- `x86_64-unknown-linux-musl` binary lacked the current manifest version.
- `aarch64-unknown-linux-musl` binary lacked the current manifest version.
- `x86_64-apple-darwin` binary lacked the current manifest version.
- `aarch64-apple-darwin` binary lacked the current manifest version.
- native `--version` and dogfood `.work/bin/work-view --version` returned the older embedded version.

## Impact

The full agile-workflow shell regression suite is red unless this dist-version
guard is skipped. More importantly, fresh installs on supported platforms reject
the stale prebuilt binaries because their embedded version no longer matches the
plugin metadata.

## Likely fix direction

Trigger the post-bump `Build work-view binaries` workflow for the current
manifest version with `commit_binaries=true`, then refresh the tracked dogfood
`.work/bin/work-view` from the verified Linux x86_64 musl artifact.

## Implementation constraint (2026-07-06)

**Status: NOT in-session-drainable — requires a CI workflow trigger.**

Verified the drift: manifests report `0.15.3` but all 4 committed dist binaries
+ the dogfood `.work/bin/work-view` report `0.14.12`. The
`work-view-dist-version.test.sh` guard fails (6 failures).

The rebuild requires cross-compiling 4 target triples:
- `x86_64-unknown-linux-musl`
- `aarch64-unknown-linux-musl`
- `x86_64-apple-darwin`
- `aarch64-apple-darwin`

This host has only `x86_64-unknown-linux-gnu` installed (no musl, no darwin
targets, no `cargo-zigbuild`). The rebuild is owned by the
`.github/workflows/build-work-view.yml` workflow (runs on dedicated runners:
macos for darwin, ubuntu for musl), triggered via `workflow_dispatch` with
`commit_binaries=true`, OR by a push that matches the workflow's path triggers.

### Fix path (CI-driven, not inline)

1. Trigger `build-work-view.yml` (push to the branch, or manual dispatch with
   `commit_binaries=true`) once the branch is pushed.
2. The workflow builds all 4 triples, runs the size-budget + version checks, and
   commits the refreshed binaries to `dist/`.
3. Refresh the dogfood `.work/bin/work-view` from the verified
   `x86_64-unknown-linux-musl` artifact (or `cargo build --release` natively if
   the gnu target suffices for local dogfooding — but the committed dist must be
   the musl cross-compile).
4. Re-run `work-view-dist-version.test.sh` to confirm green.

### Note

This is blocked on pushing the branch (the workflow runs on push/dispatch, not
locally). The session note's gate ("do NOT push until the 3 blockers are fixed")
is now satisfied — pushing unblocks this via CI. Filing as a known residual
until the push + CI cycle completes.

---
id: bug-work-view-dist-version-drift-0147
created: 2026-06-21
updated: 2026-06-21
tags: [bug, tooling]
---

# Refresh stale work-view dist binaries for 0.14.7

## Symptom

`plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh` fails on the
current checkout because the agile-workflow channel manifests report `0.14.7`,
but every committed `plugins/agile-workflow/work-view/dist/<triple>/work-view`
binary and the dogfood `.work/bin/work-view` report `work-view 0.14.6`.

## Repro

```bash
cd /home/nathan/dev/skills
bash plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh
```

Observed failures:

- `x86_64-unknown-linux-musl` binary lacks `0.14.7`
- `aarch64-unknown-linux-musl` binary lacks `0.14.7`
- `x86_64-apple-darwin` binary lacks `0.14.7`
- `aarch64-apple-darwin` binary lacks `0.14.7`
- native `--version` returns `work-view 0.14.6`
- dogfood `.work/bin/work-view --version` returns `work-view 0.14.6`

## Impact

The full agile-workflow shell regression suite is red unless this dist-version
guard is skipped. More importantly, fresh installs on supported platforms reject
the stale prebuilt binaries because their embedded version no longer matches the
plugin metadata.

## Likely fix direction

Trigger the post-bump `Build work-view binaries` workflow for the current
manifest version with `commit_binaries=true`, then refresh the tracked dogfood
`.work/bin/work-view` from the verified Linux x86_64 musl artifact.

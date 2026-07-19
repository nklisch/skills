---
id: idea-pi-sandbox-disk-backed-tmp-findmnt-doc-command
kind: idea
stage: backlog
tags: [sandbox, documentation]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# The findmnt operator-verification command is unreliable

## Source

Round-4 deep review (Phase 1 + Phase 2 both flagged). Important.

## Problem

The README (`## Temp backend`) tells operators to verify the cache root is
disk-backed with `findmnt "$XDG_CACHE_HOME"`. This fails when XDG is unset
(empty arg) and commonly fails when the cache directory is a subdirectory
rather than a mount point. Verified in the review env: `findmnt "$HOME/.cache"`
exited 1, while `findmnt --target "$HOME/.cache"` reported ext4 correctly.

Since documentation is now the ONLY backing-store safeguard (runtime detection
was removed per the scope cut), the command must actually work.

## Fix

Use `--target` (`-T`) and default the variable:

```sh
cache_root=${XDG_CACHE_HOME:-"$HOME/.cache"}
findmnt --target "$cache_root" -o TARGET,SOURCE,FSTYPE
```

Update README + THREAT_MODEL with the working command.

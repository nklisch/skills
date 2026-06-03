---
source_handle: work-view-dist
fetched: 2026-06-03
source_path: plugins/agile-workflow/work-view/dist
provenance: source-direct
source_class: repo-artifact
---

# work-view committed dist binaries (this repo)

## Summary

The `agile-workflow` plugin commits prebuilt, cross-compiled `work-view` binaries
under `plugins/agile-workflow/work-view/dist/<target-triple>/work-view`, one per
supported target. Recorded here: the measured byte sizes of the committed binaries in
this working tree (the real distribution precedent for a substrate query binary).

## Key passages

> `aarch64-apple-darwin/work-view`: 636,880 bytes (~622 KiB)

> `x86_64-apple-darwin/work-view`: 664,144 bytes (~649 KiB)

> `aarch64-unknown-linux-musl/work-view`: 712,744 bytes (~696 KiB)

> `x86_64-unknown-linux-musl/work-view`: 760,656 bytes (~743 KiB)

> All four are tracked in git (`git ls-files`); combined ~2.65 MiB. — measured via `stat -c%s` on this branch

## Structural metadata

Four target triples; musl static linking for the two Linux targets. Sizes are of the
committed binaries as of branch `adopt-agentic-research`. Reproduce:
`stat -c%s plugins/agile-workflow/work-view/dist/*/work-view`.

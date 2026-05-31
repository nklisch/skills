# work-view prebuilt binaries

This directory contains platform-matched prebuilt binaries of `work-view`,
organised by target triple:

| Triple | Platform |
|---|---|
| `x86_64-unknown-linux-musl` | Linux x86_64 (static) |
| `aarch64-unknown-linux-musl` | Linux aarch64 / ARM64 (static) |
| `x86_64-apple-darwin` | macOS Intel |
| `aarch64-apple-darwin` | macOS Apple Silicon (M1/M2/M3) |

## How binaries are produced

Binaries are built and committed by the CI workflow at
`.github/workflows/build-work-view.yml`. The workflow has two modes:

- **PR / push** — builds all four targets, uploads as GitHub Actions artifacts,
  and runs a size guard (fails if any binary exceeds 8 MB). Does NOT commit
  binaries to the tree.
- **Manual refresh (`workflow_dispatch`)** — builds all four targets and commits
  the binaries under `dist/<triple>/work-view`. Run this job before
  `./scripts/bump-version.sh agile-workflow <level>` to keep distributed
  binaries in sync with the release.

## Do not hand-edit

Binary files in this directory are generated artifacts. Do not add, replace, or
modify them by hand. Changes made outside the CI refresh job may be silently
overwritten and will not be reproducible.

## Fallback behaviour

If no prebuilt binary is present for the current platform (or the binary fails
its smoke-test), `install-work-view.sh` automatically falls back to
`scripts/work-view.sh` (the pure-bash implementation). This directory ships
empty until CI populates it; the bash fallback is the default until then.

# research-view prebuilt binaries

This directory contains platform-matched prebuilt binaries of `research-view`,
organised by target triple:

| Triple | Platform |
|---|---|
| `x86_64-unknown-linux-musl` | Linux x86_64 (static) |
| `aarch64-unknown-linux-musl` | Linux aarch64 / ARM64 (static) |
| `x86_64-apple-darwin` | macOS Intel |
| `aarch64-apple-darwin` | macOS Apple Silicon (M1/M2/M3) |

## How binaries are produced

Binaries are built and committed by the CI workflow at
`.github/workflows/build-research-view.yml`. The workflow has two modes:

- **PR / push** — builds all four targets, uploads as GitHub Actions artifacts,
  and runs a size guard (fails if any binary exceeds 8 MB). Does NOT commit
  binaries to the tree.
- **Manual refresh (`workflow_dispatch`)** — builds all four targets and commits
  the binaries under `dist/<triple>/research-view`. Run this job after
  `./scripts/bump-version.sh agentic-research <level>` has committed and pushed
  the new source stamp; a pre-bump refresh compiles the old version into the
  binaries.

## Do not hand-edit

Binary files in this directory are generated artifacts. Do not add, replace, or
modify them by hand. Changes made outside the CI refresh job may be silently
overwritten and will not be reproducible.

## Fallback behaviour

`install-research-view.sh` installs a matching prebuilt binary for supported
platforms. It version-checks the prebuilt first: if the prebuilt is missing
or reports a stale version, installation falls back to `scripts/research-view.sh`
(the pure-bash CLI implementation) rather than failing — a dist not yet
refreshed after a version bump must not block install. If the prebuilt's
version matches but it then fails its `--help` smoke test (a corrupt or
broken binary), installation fails loudly rather than falling back — a
corrupt prebuilt signals a real distribution problem.

Unsupported platforms (no matching target triple) fall back to
`scripts/research-view.sh` directly. The bash fallback keeps agent query
workflows working on any platform; it does not support any board-style
interactive subcommand.

After a `bump-version.sh` bump, run the manual refresh job
(`workflow_dispatch` on `build-research-view.yml` with `commit_binaries: true`)
to rebuild and commit the prebuilts at the new version — until that refresh
lands, supported-platform installs use the bash fallback.

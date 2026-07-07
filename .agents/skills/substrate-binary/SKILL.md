---
name: substrate-binary
description: >
  Reference for the substrate-binary pattern — Rust-built, prebuilt-capable query binaries in this repo.
  Auto-loads for `.work/` or `.research/` query-core work, `work-view binary`,
  `research-view binary`, work-view CLI, research-view CLI, `work-view query core`,
  `.research query core`, `--version` lockstep checks, cross-compilation, asset embedding,
  and binary distribution. Triggers on `cargo-zigbuild`, `bun --compile`, and
  runtime-binary distribution decisions for this dual-pattern rollout.
---

# Substrate-binary pattern (Rust)

The repository uses a shared **substrate-binary pattern** for two instances:

- `work-view` (agile-workflow, `.work/`, CLI + board surface)
- `research-view` (agentic-research, `.research/`, CLI only)

Both instances share the same architecture rationale, distribution model, and lockstep
version projection.

## Why Rust, not Bun

Distribution decides it: the plugin is a git tree, so binary size = repo size. Rust
musl binaries are **~2–5 MB** (committable for all platforms, ~12–20 MB total);
Bun `bun build --compile` binaries are **51–105 MB** (embedded runtime, usually not
committable, forces download-on-install). Bun ergonomics are nicer, but `--compile`
asset embedding is still work-in-progress and the runtime has known migration debt.
**Revisit only if** a Bun release ships `--compile` under ~10 MB with stable,
reproducible embedding.

Do NOT silently switch this pattern to Bun/TS without re-reading the research doc —
the size constraint is permanent, not a preference.

## Architecture pattern: core + adapter entry

Ports & Adapters / Single-Source-of-Truth. Both binaries share the same shape:

- shared parsing/graph/filter crate (`core`)
- thin CLI adapter crate (`cli`) that owns command parsing and UX flags over shared
  core primitives (`deps_satisfied`, `unmet_deps`, etc.)

`work-view` and `research-view` each ship a CLI over the same query-core approach,
while `work-view` adds the board surface (table + interactive views).

## CLI contract (shell-script compatibility)

Each project preserves compatibility with its installed fallback shell script.

- `work-view` keeps `work-view.sh` parity in the CLI surface.
- `research-view` keeps `research-view.sh` parity in the CLI surface.

This keeps all existing skills and automations stable when either path (`binary` or
fallback script) is used.

## Cross-compile (all from CI)

Use `cargo-zigbuild` for static musl Linux targets (no Docker); build Darwin on a
macOS runner. Minimize size with release profile knobs:

```toml
[profile.release]
opt-level = "z"
lto = true
panic = "abort"
strip = true
```

```bash
cargo zigbuild --release --target x86_64-unknown-linux-musl
cargo zigbuild --release --target aarch64-unknown-linux-musl
# darwin targets on a macOS runner:
cargo build --release --target aarch64-apple-darwin
```

## Web asset embedding (work-view only — research-view has no board/axum surface)

`rust-embed` inlines `board/dist/` into the binary on release builds and reads
board resources from disk in debug (fast iteration). Serve board pages via `axum`
(`axum-embed` / `tower-serve-static`) for `work-view`.
The frontend (kanban, dependency graph, table) is HTML+TS+CSS bundled into
`board/dist/` before `cargo build`.

```rust
#[derive(rust_embed::RustEmbed)]
#[folder = "board/dist/"]
struct Assets;
// register an axum handler that serves Assets + JSON endpoints reading core
```

## Distribution + install

Shared pattern for both binaries:

- **Ship prebuilt per-platform binaries** in the plugin tree
  (`linux-x64-musl`, `linux-arm64-musl`, `darwin-arm64`, `darwin-x64`).
- Select install target by `uname -s` / `uname -m`.
- Install the prebuilt when present and matching version; otherwise fall back to
  the pure-bash script.
- `--version` drift is locked by `scripts/bump-version.sh`, which updates:
  - Rust include-string stamps (`.work-view-version` and `.research-view-version`)
  - Bash fallback literals (`WORK_VIEW_VERSION`, `RESEARCH_VIEW_VERSION`)

Install targets differ by instance:

- `agile-workflow`: `.work/bin/work-view` (through `plugins/agile-workflow/scripts/install-work-view.sh`,
  invoked by `convert`/bootstrap)
- `agentic-research`: `.research/bin/research-view` (through
  `plugins/agentic-research/scripts/install-research-view.sh`)

For each plugin, keep the pattern strict: **prebuilt-or-fallback**, never
requiring toolchains at runtime.

## Pitfalls

- macOS cross-compile needs the SDK — build darwin targets on a macOS runner,
  not via zig from Linux.
- Keep the binary and bash fallback behavior in lockstep per instance; the fallback
  only needs to cover the corresponding CLI surface.
- Don’t commit unstripped/unoptimized binaries (they bloat the tree).

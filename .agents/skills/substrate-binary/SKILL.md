---
name: substrate-binary
description: >
  Reference for building the agile-workflow substrate binary — the compiled work-view CLI and
  interactive work-board web view over .work/ — in Rust. Auto-loads when implementing the .work/ query
  core, the work-view CLI, the substrate web board, cross-compilation, asset embedding, or binary
  distribution. Triggers on work-view binary, .work query core, substrate CLI, work-board server,
  cargo-zigbuild, rust-embed, axum board, or "bun --compile" for the substrate. Carries the
  Rust-vs-Bun decision (2026-05) and the prebuilt-binary + bash-fallback distribution pattern.
---

# Substrate binary (Rust)

The agile-workflow substrate binary supersedes `work-view.sh` (agent CLI) and
the static-HTML `work-board` (human view) with **one Rust binary** over a shared
`.work/` query core. Decided 2026-05; full rationale in
`docs/research/substrate-binary-runtime.md`.

## Why Rust, not Bun

Distribution decides it: the plugin is a **git tree**, so binary size = repo
size. Rust musl binaries are **~2–5 MB** (committable for all platforms,
~12–20 MB total); Bun `bun build --compile` binaries are **51–105 MB** (the
runtime is embedded — not committable, forces download-on-install). Bun's web
ergonomics are nicer but its `--compile` asset embedding is "work in progress"
and the runtime is mid Zig→Rust rewrite. **Revisit only if** a Bun release ships
`--compile` under ~10 MB with stable asset embedding.

Do NOT silently switch this to Bun/TS without re-reading the research doc — the
size constraint is permanent, not a preference.

## Architecture: one core, two surfaces

Ports & Adapters / Single-Source-of-Truth. One library crate; two entry points.

```
crates/
  core/    # parse .work/ items (YAML frontmatter + body), build depends_on/parent
           # graph, filter, and the dependency-graph PRIMITIVES (deps_satisfied,
           # unmet_deps) that the stage-aware "next actionable" view builds on
  cli/     # work-view CLI adapter (terse, parseable) -> imports core; owns the
           # stage-aware --ready/--blocked post-filter (actionable) over those primitives
  board/   # axum web server (human board) -> imports core, embeds web assets
```

Or a single binary with subcommands (`work-view`, `work-view serve`). Both
surfaces read the SAME core — never duplicate parsing/graph logic per surface.

## CLI contract (preserve work-view.sh)

The CLI must match the existing `work-view.sh` surface so existing skills keep
parsing it:
- Filters: `--stage`, `--tag` (repeatable, AND), `--kind`, `--parent`,
  `--release`, `--gate`, `--blocking <id>`, plus the revised stage-aware
  `--ready` / `--blocked`.
- Output modes: `--paths`, `--cat`, `--count`, default table; `--help`.
- Exit codes: `0` ok, `1` error, `2` no substrate (`no .work/CONVENTIONS.md`),
  `3` per existing semantics.

## Cross-compile (all from CI)

Use `cargo-zigbuild` for static musl Linux targets (no Docker); build darwin on
a macOS runner. Minimize size: `strip`, `opt-level = "z"`, `lto = true`,
`panic = "abort"`.

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

## Web asset embedding (board)

`rust-embed` inlines `board/dist/` into the binary on release builds and reads
from disk in debug (fast iteration). Serve via `axum`
(`axum-embed` / `tower-serve-static`). The frontend (kanban, dependency graph,
table) is HTML+TS+CSS built by a bundler into `board/dist/` BEFORE `cargo build`
— a two-stage build.

```rust
#[derive(rust_embed::RustEmbed)]
#[folder = "board/dist/"]
struct Assets;
// register an axum handler that serves Assets + JSON endpoints reading core
```

## Distribution + install

- **Commit prebuilt per-platform binaries** in the plugin tree
  (`linux-x64-musl`, `linux-arm64-musl`, `darwin-arm64`, `darwin-x64`).
- `convert` selects by `uname -s` / `uname -m` and copies the right one to
  `.work/bin/work-view` (replacing the `cp work-view.sh` step).
- **Keep `work-view.sh` as the fallback** for unsupported platforms (Windows,
  rare arches) — removes pressure for universal binary coverage.
- NEVER require `cargo` or `bun` at install time — users won't have a toolchain.
  Prebuilt-or-fallback is the rule.

## Pitfalls

- macOS cross-compile needs the SDK — build darwin targets on a macOS runner,
  not via zig from Linux.
- Don't let the binary and the bash fallback drift in behavior; the fallback
  only needs to cover the agent CLI surface, not the board.
- Don't commit unstripped/un-optimized binaries (they balloon the git tree).

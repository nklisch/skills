# Research: Substrate binary runtime (Rust vs Bun)

## Context

`epic-substrate-cli` replaces the bash `work-view.sh` + static-HTML `work-board`
with one compiled binary serving two surfaces over a shared `.work/` query core:
an agent-facing CLI and (in `epic-substrate-board`) an interactive local web
board. This research picks the runtime and the distribution mechanism the rest
of the epic builds on. The decider's initial lean was Bun (web-board ease); the
finding reverses it on distribution grounds.

Verified against current sources (May 2026); Bun and Rust specifics were checked
against official docs, not training data — see References.

## Questions

1. Cross-platform compilation — can one machine build all target binaries, and
   how big are they?
2. Web-board ease off the same engine — Bun (`Bun.serve` + bundled UI + embedded
   assets) vs Rust (`axum` + `rust-embed`).
3. Distribution + install for a **git-tree plugin** installed via the Claude
   Code / Codex marketplaces — how does the right per-platform binary reach a
   user's `.work/bin/`?

## Options Evaluated

### Rust (toolchain stable; license MIT/Apache-2.0)

- **Maturity**: Stable. Cross-compile via `cargo-zigbuild` (Zig linker, static
  musl, no Docker) or `cross` (Docker). `rust-embed` + `axum` for the web board
  are production-proven.
- **Binary size**: ~2–5 MB stripped musl for a real CLI/web server (hello-world
  ~165 KB; axum microservice ~1.47 MB).
- **Pros**: Tiny **committable** binaries; zero runtime deps (musl static);
  stable asset embedding; one library crate feeds both a CLI subcommand and an
  `axum` server entry point.
- **Cons**: More code than TS; CLI + web share a **Rust crate**, not a TS
  module; a two-stage build (frontend bundler → `rust-embed` → `cargo build`);
  macOS cross-compile needs the SDK (handle on a macOS CI runner).
- **Fit**: Strong. Small binary is the only option compatible with shipping
  inside a git-tree plugin.

### Bun (v1.3.14; license MIT)

- **Maturity**: Fast-moving and in flux — acquired by Anthropic (Dec 2025),
  mid Zig→Rust rewrite (merged May 2026, ~13k unsafe blocks, ~4.8k open issues).
  `bun build --compile` cross-targets work from any host; **web-asset embedding
  is officially "work in progress."**
- **Binary size**: **51 MB (macOS arm64) – 105 MB (Windows x64)** — the full
  runtime is embedded; docs say it is "still way too big."
- **Pros**: Simplest web story (`Bun.serve` + `import "./index.html"`
  auto-bundles assets); one TS codebase for core + CLI + web; cross-targets via
  one `--target=` flag.
- **Cons**: Binaries far too large to commit in a plugin tree (forces
  download-on-first-use from GitHub Releases); `--compile` asset embedding still
  beta; runtime mid-rewrite; Windows→Linux cross-compile bug open (#25346).
- **Fit**: Weak for this distribution model despite the nicer web ergonomics.

## Recommendation

**Rust.** Distribution is the deciding constraint: the plugin is a git tree, so
binary size *is* repo size. Rust's ~2–5 MB/platform binaries are committable
(~12–20 MB for all targets); Bun's 51–105 MB are not. Bun's web-ease advantage
is real but narrow — the kanban/graph frontend is HTML+TS+CSS regardless of
backend, and Rust's `axum` + `rust-embed` adds only ~50–100 lines of stable
wiring. Bun's `--compile` asset embedding being "work in progress" plus the
in-flight runtime rewrite make it the riskier base for a primary distribution
mechanism right now.

**Distribution mechanism:** commit prebuilt per-platform binaries
(`linux-x64-musl`, `linux-arm64-musl`, `darwin-arm64`, `darwin-x64`) in the
plugin tree; `convert` selects by `uname -s`/`uname -m` and places the right one
at `.work/bin/work-view`. **Keep `work-view.sh` as the fallback** for unsupported
platforms (Windows, rare arches) — this removes pressure for universal binary
coverage. (Alternative if git bloat is unwanted: download-on-first-use from
GitHub Releases, bash fallback when offline.)

**Revisit trigger:** if a post-rewrite Bun release ships `--compile` binaries
under ~10 MB with stable asset embedding, reconsider — the TS-shared-module
ergonomics would then be worth it.

## Implementation Notes

- **Core as a library crate.** One crate parses `.work/` items (YAML frontmatter
  + body), builds the `depends_on`/`parent` graph, and filters. The CLI and the
  `axum` server are two entry points (or `work-view <subcommand>`) over it —
  Ports & Adapters, one source of truth.
- **Cross-compile** with `cargo-zigbuild` for all Linux musl targets from one
  Linux CI runner; build darwin targets on a macOS runner. Strip + `opt-level="z"`
  + LTO + `panic="abort"` to minimize size.
- **Embed web assets** with `rust-embed` (release inlines into the binary; debug
  reads from disk for fast iteration); serve via `axum` (e.g. `tower-serve-static`
  / `axum-embed`).
- **Preserve the work-view contract**: the new CLI must match `work-view.sh`'s
  flags, output modes, and exit codes (0/1/2/3) so existing skills keep parsing.
- **Pitfall**: don't require `cargo`/`bun` at install time — users won't have a
  toolchain; prebuilt-or-fallback is the rule.

## Code Examples

```rust
// One core crate, two entry points (sketch)
// crates/core/src/lib.rs
pub struct Item { pub id: String, pub kind: Kind, pub stage: Stage, /* ... */ }
pub fn load_substrate(root: &Path) -> Result<Vec<Item>>;       // parse .work/
pub fn ready(items: &[Item]) -> Vec<&Item>;                    // stage-aware next-actionable

// crates/cli/src/main.rs  ->  work-view --ready, --stage, --paths ...
// crates/board/src/main.rs (or `work-view serve`):
#[derive(rust_embed::RustEmbed)] #[folder = "board/dist/"] struct Assets;
// axum router: serve Assets + JSON endpoints reading the same core
```

```toml
# cross-compile (all from CI)
# cargo zigbuild --release --target x86_64-unknown-linux-musl
# cargo zigbuild --release --target aarch64-unknown-linux-musl
# (darwin targets on a macOS runner)
```

## References

- [Bun single-file executables](https://bun.com/docs/bundler/executables) — cross-targets, asset embedding, "too big" size caveat
- [Bun cross-compile sizes](https://developer.mamezou-tech.com/en/blogs/2024/05/20/bun-cross-compile/) — 51 MB macOS / 105 MB Windows
- [Bun html-static docs](https://bun.com/docs/bundler/html-static) — "work in progress" browser-compile caveat
- [The Register — Bun Zig→Rust rewrite merged (May 2026)](https://www.theregister.com/devops/2026/05/14/anthropics-bun-rust-rewrite-merged-at-speed-of-ai/5240381)
- [Bun Windows→Linux cross-compile bug #25346](https://github.com/oven-sh/bun/issues/25346)
- [cargo-zigbuild](https://github.com/rust-cross/cargo-zigbuild) — static musl cross-compile
- [rustup cross-compilation](https://rust-lang.github.io/rustup/cross-compilation.html) — targets, musl
- [rust-embed](https://lib.rs/crates/rust-embed) / [axum-embed-files](https://lib.rs/crates/axum-embed-files) — stable asset embedding
- [esbuild platform binaries](https://deepwiki.com/evanw/esbuild/6.2-platform-specific-binaries) / [Sentry: publishing binaries on npm](https://blog.sentry.io/publishing-binaries-on-npm) — download-on-install precedent
- [Rust binary size](https://users.rust-lang.org/t/why-does-rust-binary-take-so-much-space/41088) / [axum musl size](https://apatisandor.hu/blog/rust-microservice/)

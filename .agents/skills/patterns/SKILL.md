---
name: patterns
description: "Project code patterns and conventions. Auto-loads when implementing,
  designing, verifying, or reviewing code. Provides detailed pattern definitions
  with code examples."
user-invocable: false
allowed-tools: Read, Glob, Grep
---

# Project Patterns Reference

This skill contains detailed pattern documentation for this project.
See individual pattern files for full details with code examples.

Available patterns:
- [substrate-borrowing-query.md](substrate-borrowing-query.md) — Borrowing Read-Only Query Methods on `Substrate`: add read capabilities as `pub fn …<'a>(&'a self, …) -> Vec<&'a Item>` that filter `self.items()` and preserve byte-sorted load order; never mutate, clone, or reorder.
- [substrate-test-fixture-builder.md](substrate-test-fixture-builder.md) — In-Memory Substrate Test Fixture Builder: `fn setup_substrate(&[(&str,&str)]) -> (TempDir, Substrate)` that writes `.work/CONVENTIONS.md` + items into a TempDir, loads, and returns both the guard and the Substrate.
- [test-item-builders.md](test-item-builders.md) — Parameterized Item Builders for Tests: small positional helpers (`item_fm`/`full_item`/`item_md` for frontmatter strings, `make_item`/`make_item_direct` for in-memory `Item`s) that expose only the salient fields and default the rest.
- [subprocess-cli-harness.md](subprocess-cli-harness.md) — Subprocess CLI Test Harness with Graceful Parity Skip: test the CLI by launching the real binary into a `(stdout, stderr, exit_code)` tuple; for parity diffs, return the reference's output as `Option` and skip via `let-else` only when the tool is absent (hard-fail on path regression).
- [cargo-manifest-fixture-root.md](cargo-manifest-fixture-root.md) — Compile-Time Fixture-Root Resolver: address committed fixtures/scripts via `concat!(env!("CARGO_MANIFEST_DIR"), "/rel/path")` behind a named `fn …_root() -> &'static Path` accessor; never rely on CWD.

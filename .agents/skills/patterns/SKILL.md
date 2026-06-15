---
name: patterns
description: >
  Project code patterns and conventions. Auto-loads when implementing, designing, verifying, or
  reviewing code. Provides detailed pattern definitions with code examples.
---

# Project Patterns Reference

This skill contains detailed pattern documentation for this project.
See individual pattern files for full details with code examples.

Available patterns:
- [substrate-borrowing-query.md](substrate-borrowing-query.md) — Borrowing Read-Only Query Methods on `Substrate`: add read capabilities as `pub fn …<'a>(&'a self, …) -> Vec<&'a Item>` that filter `self.items()` and preserve byte-sorted load order; never mutate, clone, or reorder.
- [manual-error-display.md](manual-error-display.md) — In `work-view`, errors are plain `enum`/`struct FooError` with a hand-written `impl Display` (no `thiserror`/derive); the core never `process::exit`s — the CLI adapter maps errors to exit codes.
- [hand-rolled-peekable-flag-parser.md](hand-rolled-peekable-flag-parser.md) — Dependency-free CLI flag parser: a generic `parse_args` over a `peekable()` iterator with a `flags_done` terminator and a shared `next_value` helper that peek-rejects a following `-`-prefixed token as a missing value; returns an `Outcome` enum (Help/Version/Run), never `process::exit`s.
- [board-view-module-contract.md](board-view-module-contract.md) — Board views are `export const xView = { id, label, mount(root, ctx) }`, self-registered via `registerView`, reading only from `ctx` and committing output with a single `root.replaceChildren(...)`.
- [no-build-board-asset-test-harness.md](no-build-board-asset-test-harness.md) — Test board ES modules through `installDomGlobals()` + `loadBoardModule()` + `makeItem(overrides)`, not through a bundler or ad hoc globals.
- [view-local-control-state-full-remount.md](view-local-control-state-full-remount.md) — For transient board view controls, mutate module-local state and remount the same view through `view.mount(root, ctx)`.
- [pending-focus-restore-after-remount.md](pending-focus-restore-after-remount.md) — Record the logical focused control before full remount, then restore it after `replaceChildren` with `preventScroll`.
- [dom-text-element-builder.md](dom-text-element-builder.md) — In each dependency-free board ES module, define a local `textElement(tag, className, text)` that does `createElement` → optional `className` → `textContent` → return; never `innerHTML`, never a shared import.
- [fail-open-subprocess-probe.md](fail-open-subprocess-probe.md) — Always-on hook subprocesses run with explicit `timeout=`, `stderr=DEVNULL`, `check=False`, guarded by `except (OSError, TimeoutExpired)` (or `contextlib.suppress`) returning a neutral empty/None — never raise, never block the event.
- [subprocess-cli-harness.md](subprocess-cli-harness.md) — Subprocess CLI Test Harness with Graceful Parity Skip: test the CLI by launching the real binary into a `(stdout, stderr, exit_code)` tuple; for parity diffs, return the reference's output as `Option` and skip via `let-else` only when the tool is absent (hard-fail on path regression).
- [substrate-test-fixture-builder.md](substrate-test-fixture-builder.md) — In-Memory Substrate Test Fixture Builder: `fn setup_substrate(&[(&str,&str)]) -> (TempDir, Substrate)` that writes `.work/CONVENTIONS.md` + items into a TempDir, loads, and returns both the guard and the Substrate.
- [test-item-builders.md](test-item-builders.md) — Parameterized Item Builders for Tests: small positional helpers (`item_fm`/`full_item`/`item_md` for frontmatter strings, `make_item`/`make_item_direct` for in-memory `Item`s) that expose only the salient fields and default the rest.
- [cargo-manifest-fixture-root.md](cargo-manifest-fixture-root.md) — Compile-Time Fixture-Root Resolver: address committed fixtures/scripts via `concat!(env!("CARGO_MANIFEST_DIR"), "/rel/path")` behind a named `fn …_root() -> &'static Path` accessor; never rely on CWD.

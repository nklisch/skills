---
id: idea-background-tasks-sandbox-integration
created: 2026-06-29
updated: 2026-06-29
tags: [security]
---

# background-tasks: route spawned commands through the sandbox

## Problem

The built-in pi `bash` tool can be hardened via the first-party `examples/extensions/sandbox`
extension (bubblewrap on Linux via `@anthropic-ai/sandbox-runtime`), which enforces
filesystem `denyRead` and a network allowlist at the OS layer. But `background-tasks`
spawns its own subprocesses **outside** that path, so it bypasses the sandbox entirely:

- `background` tool → `background-tasks.ts:531`:
  `spawn(command, { shell: "/bin/sh", env: { ...process.env, ...envAdd }, detached: true })`
- `monitor` tool → `background-tasks.ts:694`:
  `pi.exec("/bin/sh", ["-c", command], { ... })`

Both take a raw `command` string, inherit `process.env`, and never pass through
`SandboxManager`. An injected `background` or `monitor` call can therefore read
protected files (e.g. `~/.pi/agent/auth.json`) and egress to arbitrary hosts
even when the sandbox extension is active — a complete bypass of the sandbox's
`denyRead` / network allowlist for anyone using background-tasks.

## Proposed affordance

Gate the two spawn sites behind the sandbox when it's initialized:

```ts
import { SandboxManager } from "@anthropic-ai/sandbox-runtime";  // optional dep

let effectiveCommand = command;
if (SandboxManager?.isSandboxingEnabled?.()) {
  effectiveCommand = await SandboxManager.wrapWithSandbox(command);
}
// then: spawn(effectiveCommand, ...)  /  pi.exec("/bin/sh", ["-c", effectiveCommand], ...)
```

`SandboxManager` is a documented global singleton (`@anthropic-ai/sandbox-runtime`).
The sandbox extension initializes it at `session_start`; once initialized any
extension in the same process can import the singleton and call `wrapWithSandbox`.
`wrapWithSandbox(command, binShell?, customConfig?, abortSignal?)` returns the
wrapped command string — a drop-in before the existing `spawn`/`exec` calls.

## Design decisions to make at scope/design time

- **Optional dependency.** Make `@anthropic-ai/sandbox-runtime` an
  `optionalDependencies` entry so background-tasks works with or without the
  sandbox installed. Guard the import so it degrades cleanly (current behavior
  preserved) when the sandbox is absent.
- **Fail-open vs fail-closed.** If the sandbox is enabled but `wrapWithSandbox`
  throws, default behavior matters. Fail-closed (refuse to spawn) is safer for
  the security use case; fail-open preserves dev convenience. Likely a config
  flag, with a documented default.
- **Per-job config overrides.** `wrapWithSandbox` accepts a `customConfig`
  override (network/filesystem). Could let a `background` call pass overrides,
  or inherit the global sandbox config. Start with inherit-global; per-job is a
  later enhancement.
- **Env handling.** Today `background` does `env: { ...process.env, ...envAdd }`.
  Confirm whether `wrapWithSandbox`'s wrapping constrains the child env via the
  sandbox config (independent of the `env` passed to `spawn`) or whether the
  caller's `env` still leaks. Needs a test.
- **Config flag for the integration itself.** Something like
  `sandboxIntegration: "auto" | "off"` in background-tasks config, defaulting to
  `"auto"` (use sandbox if present). Makes behavior explicit and debuggable.

## Provenance / license notes (verified)

- `@anthropic-ai/sandbox-runtime`: Apache-2.0, authored by Anthropic PBC, public
  repo `github.com/anthropic-experimental/sandbox-runtime`, pre-1.0 (v0.0.61 at
  audit). License-compatible with this repo.
- The sandbox extension that initializes `SandboxManager` is pi first-party
  (`pi-coding-agent/examples/extensions/sandbox/`), MIT. It is the canonical
  reference for the `SandboxManager` API this integration would consume.

## Verified call sites (current main)

- `plugins/background-tasks/extensions/background-tasks.ts:531` (`background` spawn)
- `plugins/background-tasks/extensions/background-tasks.ts:694` (`monitor` → `pi.exec`)

## Out of scope (for this item)

- Sandboxing other extension-provided tools beyond background-tasks.
- The mesh (`agent_send`) exfil channel — a separate concern; `agent_send` is a pi
  tool, not a bash subprocess, so bubblewrap does not touch it. Worth a separate
  backlog item if not already tracked.

---

## Update 2026-07-01 — superseded approach (ASRT dropped)

The `SandboxManager.wrapWithSandbox()` approach proposed here is **superseded** by `feature-sandbox-first-party-bwrap`: ASRT is dropped entirely, so `wrapWithSandbox` no longer exists. Background-tasks spawn sites (`background` tool ~`background-tasks.ts:531`, `monitor` ~`background-tasks.ts:694`) should instead route through the new first-party `buildBwrapArgs()` from `@nklisch/pi-sandbox` once that extension lands. This item's *problem statement* (background/monitor bypass the sandbox) remains valid and open; only the proposed affordance changes. Re-scope when the pi-sandbox plugin is vendored — the spawn sites will wrap their command string through the same `buildBwrapArgs()` + `spawn("bwrap", ...)` path the bash tool uses.

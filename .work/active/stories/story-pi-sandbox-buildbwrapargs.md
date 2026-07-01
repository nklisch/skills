---
id: story-pi-sandbox-buildbwrapargs
kind: story
stage: review
tags: [security, sandbox]
parent: feature-sandbox-first-party-bwrap
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# First-party `buildBwrapArgs()` core hardening

## Scope

Replace `SandboxManager.wrapWithSandbox(command)` with a first-party Linux bwrap
argv builder in `plugins/pi-sandbox/extensions/sandbox.ts`. This story owns the
actual security contract for sandboxed `bash` and `user_bash`: path
normalization, mount order, write policy, PID/proc isolation, network `open` /
`block`, and minimal child environment.

`filter` mode is **not** part of this story. If requested in config, first release
fails closed with a deferred-mode diagnostic instead of silently loosening to
`open`.

## Builder contract

### Platform

- Linux only.
- Verify `bwrap` is available before marking the sandbox initialized.
- Missing `bwrap` or unsupported platform fail closed unless the operator chose
  `--no-sandbox` or `enabled:false`.

### Path normalization

- Expand `~` with `homedir()`.
- Resolve relative config paths against the session cwd.
- Canonicalize existing paths with `realpathSync.native` before bwrap emission.
- Skip non-existent deny paths; never bind `/dev/null` over a missing component.

### Mount order

Order is load-bearing and must be tested:

1. `--ro-bind / /`
2. `--dev /dev`, `--unshare-pid`, `--proc /proc`
3. writable allow mounts for existing `allowWrite` roots, including cwd only if
   `.`/cwd is allowed
4. read-only `denyWrite` overlays for existing protected files/dirs
5. `denyRead` overlays last: existing dirs `--tmpfs`; existing files
   `--ro-bind /dev/null`
6. `--unshare-net` only for `network.mode:"block"`

### Environment

Sandboxed bash must not inherit provider/auth secrets. Use `--clearenv` and/or a
minimal `spawn` env allowlist. Preserve only non-secret basics such as `PATH`,
`HOME`, `TERM`, `LANG`, `LC_*`, and `TMPDIR` when present.

## Acceptance Criteria

- [x] Non-existent deny paths produce zero host stubs.
- [x] Denied directory inside cwd is masked after cwd/allow mounts; host contents
      remain intact.
- [x] Denied file inside cwd is masked after cwd/allow mounts.
- [x] Existing `.git` directory is masked without file-stubbing and without
      `ENOTDIR` bricking.
- [x] `allowWrite` permits configured writable roots for bash.
- [x] `denyWrite` prevents bash writes to protected existing files/dirs.
- [x] `block` mode adds `--unshare-net` and cannot reach a localhost listener.
- [x] `open` mode adds no network namespace and preserves normal host network.
- [x] PID namespace + fresh `/proc` are active; host process metadata is not
      visible through the sandboxed `/proc`.
- [x] Sandboxed bash env omits provider/auth secrets such as `OPENAI_API_KEY`,
      `ANTHROPIC_*`, and `ZAI_API_KEY`.
- [x] Relative config paths resolve against session cwd, not package cwd.
- [x] Symlink-to-denied-path behavior is tested and either blocked or explicitly
      documented as a residual gap.
- [x] No `findFirstNonExistentComponent`, no hardcoded `.claude/commands`, and
      no hardcoded `.claude/agents` deny behavior.

## Implementation notes

Implemented a first-party Linux `buildBwrapArgs()` in `plugins/pi-sandbox/extensions/sandbox-bwrap.ts` and wired `createSandboxedBashOps()` to spawn `bwrap ... -- bash -c <command>` directly instead of using `SandboxManager.wrapWithSandbox`. ASRT `initialize()`/`reset()` lifecycle remains in place for the next story to remove.

Security decisions:
- `network.mode: "filter"` now fails closed with an explicit deferred-mode diagnostic rather than silently becoming open.
- `bwrap` availability is checked before marking the sandbox initialized; unsupported non-Linux platforms remain fail-closed unless the operator chooses `--no-sandbox` or `enabled:false`.
- Existing config paths are expanded/resolved against the session cwd and canonicalized with `realpathSync.native`; missing deny paths are skipped for bwrap mounts, so no host stubs are created.
- Symlink-to-denied-path is blocked by canonical-target masking; the test covers a cwd symlink pointing at an external denied directory.
- Sandboxed bash uses both `--clearenv`/`--setenv` and a minimal spawn env allowlist (`PATH`, `HOME`, `TERM`, `LANG`, `LC_*`, `TMPDIR`) so provider/auth secrets never reach the child.

Scoped verification: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` passed (18 tests, 61 assertions), including pure argv/order tests and live bwrap integration for allowWrite, denyWrite, denyRead masks, `.git` directory masking, open/block network, fresh `/proc`, minimal env, and symlink masking. Syntax/loadability check also passed via `bun build plugins/pi-sandbox/extensions/sandbox.ts --external @anthropic-ai/sandbox-runtime --external @earendil-works/pi-coding-agent --external typebox --outdir /tmp/pi-sandbox-build-check`.

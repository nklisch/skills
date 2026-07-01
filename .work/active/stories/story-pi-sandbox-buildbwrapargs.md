---
id: story-pi-sandbox-buildbwrapargs
kind: story
stage: implementing
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

- [ ] Non-existent deny paths produce zero host stubs.
- [ ] Denied directory inside cwd is masked after cwd/allow mounts; host contents
      remain intact.
- [ ] Denied file inside cwd is masked after cwd/allow mounts.
- [ ] Existing `.git` directory is masked without file-stubbing and without
      `ENOTDIR` bricking.
- [ ] `allowWrite` permits configured writable roots for bash.
- [ ] `denyWrite` prevents bash writes to protected existing files/dirs.
- [ ] `block` mode adds `--unshare-net` and cannot reach a localhost listener.
- [ ] `open` mode adds no network namespace and preserves normal host network.
- [ ] PID namespace + fresh `/proc` are active; host process metadata is not
      visible through the sandboxed `/proc`.
- [ ] Sandboxed bash env omits provider/auth secrets such as `OPENAI_API_KEY`,
      `ANTHROPIC_*`, and `ZAI_API_KEY`.
- [ ] Relative config paths resolve against session cwd, not package cwd.
- [ ] Symlink-to-denied-path behavior is tested and either blocked or explicitly
      documented as a residual gap.
- [ ] No `findFirstNonExistentComponent`, no hardcoded `.claude/commands`, and
      no hardcoded `.claude/agents` deny behavior.

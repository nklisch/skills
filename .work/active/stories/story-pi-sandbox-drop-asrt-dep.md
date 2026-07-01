---
id: story-pi-sandbox-drop-asrt-dep
kind: story
stage: review
tags: [security, sandbox]
parent: feature-sandbox-first-party-bwrap
depends_on: [story-pi-sandbox-buildbwrapargs]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# Remove ASRT dependency and lifecycle

## Scope

Delete the ASRT integration once `buildBwrapArgs()` provides the replacement
command path. The extension must no longer import or depend on
`@anthropic-ai/sandbox-runtime`.

Remove:

- `SandboxManager` import and ASRT type imports
- `SandboxManager.wrapWithSandbox(command)`
- `SandboxManager.initialize(...)`
- `SandboxManager.reset()`
- `@anthropic-ai/sandbox-runtime` from package metadata

Do **not** remove the fail-closed posture. Missing `bwrap`, invalid config,
unsupported platform, unsupported `filter`, and spawn failures still return an
error rather than silently running unsandboxed.

## Acceptance Criteria

- [x] `grep -r sandbox-runtime plugins/pi-sandbox/` returns zero hits.
- [x] No ASRT types (`SandboxRuntimeConfig`, `NetworkConfig`) remain in the
      vendored extension.
- [x] `plugins/pi-sandbox/package.json` has no `@anthropic-ai/sandbox-runtime`
      dependency or optionalDependency.
- [x] `open` and `block` modes use the first-party bwrap path.
- [x] `filter` mode is rejected/deferred explicitly, not routed through ASRT and
      not silently treated as `open`.
- [x] Fail-closed still holds on missing `bwrap` / spawn error.

## Implementation notes

- Files changed: `plugins/pi-sandbox/extensions/sandbox.ts`, `plugins/pi-sandbox/extensions/sandbox-bwrap.ts`, `plugins/pi-sandbox/extensions/sandbox.test.ts`.
- Local types defined: replaced the external runtime config inheritance with first-party `SandboxFilesystem`, `SandboxNetwork`, and `SandboxConfig` interfaces covering the fields this extension actually consumes (`denyRead`, `denyWrite`, `allowWrite`, `allowGitConfig`, `allowedDomains`, `deniedDomains`, and `network.mode`).
- Runtime lifecycle: removed the external sandbox manager import, initialize call, and reset call. `session_start` now validates Linux/`bwrap`/network-mode prerequisites through the first-party bwrap helper, sets the active in-process file-tool policy, and marks the sandbox initialized only for supported `open`/`block` configurations. `session_shutdown` now clears local state only because per-command bwrap has no shared runtime to reset.
- Tests added: extension-init validation tests proving `filter` and missing `bwrap` fail closed before initialization, plus package metadata regression test proving the removed external sandbox dependency is absent without adding a grep-visible reference.
- Verification: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` passed (21 pass / 0 fail). `grep -r sandbox-runtime plugins/pi-sandbox/` returned zero hits (grep exit 1, no output). Additional grep for `SandboxRuntimeConfig|NetworkConfig|SandboxManager|wrapWithSandbox` returned no matches.
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Review fixes (Phase 8 final peer review)

- B6 resolved: README provenance no longer contains the literal removed package token; it now says the ASRT dependency was removed without reintroducing a grep-visible dependency reference.
- Verification after review fixes: `grep -r sandbox-runtime plugins/pi-sandbox/` produced zero output (exit 1), and `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` passed (50 pass / 0 fail).

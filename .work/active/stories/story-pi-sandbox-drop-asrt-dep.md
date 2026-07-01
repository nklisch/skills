---
id: story-pi-sandbox-drop-asrt-dep
kind: story
stage: implementing
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

- [ ] `grep -r sandbox-runtime plugins/pi-sandbox/` returns zero hits.
- [ ] No ASRT types (`SandboxRuntimeConfig`, `NetworkConfig`) remain in the
      vendored extension.
- [ ] `plugins/pi-sandbox/package.json` has no `@anthropic-ai/sandbox-runtime`
      dependency or optionalDependency.
- [ ] `open` and `block` modes use the first-party bwrap path.
- [ ] `filter` mode is rejected/deferred explicitly, not routed through ASRT and
      not silently treated as `open`.
- [ ] Fail-closed still holds on missing `bwrap` / spawn error.

---
id: story-pi-sandbox-config-boundary-contract
kind: story
stage: implementing
tags: [security, sandbox, docs]
parent: feature-sandbox-first-party-bwrap
depends_on: [story-pi-sandbox-buildbwrapargs, story-pi-sandbox-drop-asrt-dep]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# Config compatibility and security-boundary contract

## Scope

Replace ASRT-shaped config assumptions with a first-party Pi sandbox contract.
Existing `sandbox.json` files may contain ASRT-era fields; the vendored plugin
must not silently keep inert security knobs.

This story also writes the security-boundary language that prevents the package
from overclaiming what it protects.

## Requirements

- Define first-party config types locally; no imports from ASRT.
- Supported first-release network modes: `open` and `block`.
- `filter` is recognized as a deferred/unsupported strict mode and fails closed
  with an actionable diagnostic.
- Legacy ASRT-only fields such as `ignoreViolations`,
  `enableWeakerNestedSandbox`, proxy-port knobs, or `allowGitConfig` are either:
  - mapped to a first-party equivalent with tests, or
  - warned/rejected as unsupported.
- Preserve additive-only project merge semantics: projects can tighten, not
  loosen, global policy.
- Document that Pi extensions/packages are not sandboxed by this plugin and run
  with full user permissions.
- Document that `background`, `monitor`, `agent_send`, web/search tools,
  subagents, and provider requests are not OS-sandboxed command surfaces.

## Acceptance Criteria

- [ ] Config parser has no ASRT type dependency.
- [ ] Existing global and project config load paths still work:
      `~/.pi/agent/extensions/sandbox.json` and `<cwd>/.pi/sandbox.json`.
- [ ] Legacy ASRT-only fields produce explicit warning or fail-closed error;
      none are silently accepted as effective protection.
- [ ] `filter` config fails closed with a message pointing to the deferred
      filter backlog item.
- [ ] README includes a `Security boundary / non-goals` section covering Pi
      extension trust, background/monitor, mesh/tool egress, and open-network
      limitations.
- [ ] `/sandbox` command reports mode, fail-closed reason, unsupported legacy
      fields, and known bypass mitigation state.

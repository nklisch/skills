---
id: story-pi-sandbox-config-boundary-contract
kind: story
stage: review
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

- [x] Config parser has no ASRT type dependency.
- [x] Existing global and project config load paths still work:
      `~/.pi/agent/extensions/sandbox.json` and `<cwd>/.pi/sandbox.json`.
- [x] Legacy ASRT-only fields produce explicit warning or fail-closed error;
      none are silently accepted as effective protection.
- [x] `filter` config fails closed with a message pointing to the deferred
      filter backlog item.
- [x] README includes a `Security boundary / non-goals` section covering Pi
      extension trust, background/monitor, mesh/tool egress, and open-network
      limitations.
- [x] `/sandbox` command reports mode, fail-closed reason, unsupported legacy
      fields, and known bypass mitigation state.

## Implementation notes

- Factored first-party sandbox config types, defaults, parsing, additive merge,
  legacy-field diagnostics, and `/sandbox` command formatting into
  `plugins/pi-sandbox/extensions/sandbox-config.ts`. The parser imports no ASRT
  types or runtime and tests import this pure helper module to avoid `typebox`.
- Legacy field decisions: `ignoreViolations` and
  `enableWeakerNestedSandbox` are ASRT-only internals and are warned/ignored;
  `filesystem.allowGitConfig` has no first-party equivalent in this release and
  is warned/ignored; `httpProxyPort` and `socksProxyPort` are ASRT filter-proxy
  machinery and are warned/ignored while filter support is deferred. None are
  carried into the effective config object.
- `network.mode=filter` remains a recognized strict mode, but config loading and
  bwrap init now include the deferred backlog pointer
  `.work/backlog/idea-pi-sandbox-filter-tcp-proxy.md` and fail closed instead
  of silently treating filtered egress as open.
- Preserved additive-only project merge semantics: projects can add deny lists,
  narrow allow lists, raise network strictness, and tighten tool policy; attempts
  to disable the sandbox or loosen network/tool policy are ignored and surfaced
  as warnings.
- Added `plugins/pi-sandbox/README.md` with a substantive
  `Security boundary / non-goals` section: Pi extensions/packages are trusted and
  unsandboxed; `background`/`monitor` are pending integration; `agent_send`, web
  search, subagents, and provider requests are not OS-sandboxed command
  surfaces; `open` network mode leaves host networking intact.
- Extended `/sandbox` output to include state, mode, fail-closed reason,
  unsupported legacy field warnings, and known bypass mitigation state.
- Verification: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` passes
  (28 pass / 0 fail).

## Review fixes (Phase 8 final peer review)

- B1 resolved: added pure `validateConfig(config): string[]` boundary validation and wired `loadConfig()` to treat validation failures like parse errors. Unknown network modes, invalid tool policies, and non-string filesystem/network arrays now fail closed with actionable messages.
- B2 resolved: parse/validation errors now install a restrictive fail-closed policy (`denyRead:["/"], denyWrite:["/"], allowWrite:[], tools.default:"block"`) before session start returns; the startup fallback policy uses the same restrictive posture.
- B5 resolved: project inspector config is additive-only. Same-name project secret shapes are rejected/warned instead of overriding global shapes, `scanFields` may narrow by intersection only, and empty/widening merges are warned and ignored.
- S1 resolved: default `network.mode` is now `open`, so a no-config install initializes in the first release's permissive network posture while projects can still tighten to `block` or request deferred `filter` fail-closed behavior.
- Verification after review fixes: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` passed (50 pass / 0 fail).

### Round 2 adversarial-review fixes

- Blk-A resolved: inspector `scanFields` project merge is now coverage-additive. Effective per-tool fields are the union of global/default intent and project additions; a global `"*"` stays `"*"`. Project attempts to omit global fields are warned and cannot narrow scanning coverage, closing the `agent_send.body` bypass case.
- Sub-A resolved: config validation now compiles every inspector secret `pattern` with its configured flags (default `gu`) at load time. Invalid regex sources/flags become parse errors and fail closed during session start instead of throwing later in `tool_call`.
- Sub-B resolved: project `envScrub` now merges additively for `names`, `patterns`, and `keep`; runtime scrubbing honors both Pi provider keep entries and config `keep` entries so required variables are not removed by broad patterns.
- Verification after round 2 fixes: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` passed (53 pass / 0 fail); `grep -r sandbox-runtime plugins/pi-sandbox/` returned no matches.

---
id: story-background-tasks-sandbox-bypass-docs
kind: story
stage: implementing
tags: [security, sandbox, plugin, documentation]
parent: feature-background-tasks-sandbox-integration
depends_on: [story-background-tasks-sandbox-background-spawn, story-background-tasks-sandbox-monitor-spawn]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# Update bypass-tool policy matrix and integration docs

## Scope

Replace the first-release `background`/`monitor` confirm-only mitigation with a state-aware policy matrix, and document the cross-plugin integration honestly in both plugin docs.

### Files

- `plugins/pi-sandbox/extensions/sandbox-config.ts`
- `plugins/pi-sandbox/extensions/sandbox.ts`
- `plugins/pi-sandbox/extensions/sandbox.test.ts`
- `plugins/pi-sandbox/README.md`
- `plugins/background-tasks/README.md` — create if still absent.
- `plugins/background-tasks/skills/background-tasks/SKILL.md` only if the portable skill currently overclaims unsandboxed behavior after this integration.

## Policy matrix

Default handling for `background` and `monitor` under pi-sandbox tool-egress policy:

| State | Default policy | Rationale |
|---|---|---|
| Linux + pi-sandbox enabled + `backgroundTasks.sandboxIntegration:"auto"` + bwrap available + network `open`/`block` + valid config | `allow` | Real bwrap integration is active; the tool call itself no longer bypasses sandboxed shell policy. |
| pi-sandbox absent | no pi-sandbox policy | background-tasks degrades to current behavior because no sandbox policy exists. |
| `backgroundTasks.sandboxIntegration:"off"` | `confirm` (blocks with no UI) unless operator explicitly configures stricter `block` | Explicit opt-out restores bypass risk. |
| non-Linux graceful degrade | `confirm` (blocks with no UI) | Shell commands are unsandboxed on macOS/Windows. |
| Linux missing bwrap / `network.mode:"filter"` / invalid config | `confirm` or stricter fail-closed block | The sandbox cannot provide real integration; do not silently allow bypass tools. |
| project-local attempt to loosen `confirm`/`block` to `allow` | ignored + warning | Additive-only project merge must not weaken security. |

## Implementation notes

- Keep `backgroundTasks.sandboxIntegration` in `SandboxConfig`; use one config file: `<cwd>/.pi/sandbox.json` and `~/.pi/agent/extensions/sandbox.json`.
- Rank `backgroundTasks.sandboxIntegration` for additive merge as `off < auto`: a global/operator config may set `off`; project-local config may tighten `off -> auto`, but cannot loosen default/global `auto -> off`.
- Add a pure decision helper in `sandbox-config.ts`, for example:

```ts
export interface BypassToolIntegrationState {
	backgroundTasksSandbox: "active" | "inactive" | "blocked";
	reason?: string;
}

export function applyBypassToolDefaults(
	tools: ToolRules | undefined,
	state: BypassToolIntegrationState = { backgroundTasksSandbox: "inactive" },
): ToolRules;
```

- `sandbox.ts` should compute the integration state from the same config/platform inputs used by `buildSandboxedSpawnArgs` during `session_start` and pass it to `applyBypassToolDefaults` / active policy construction.
- If exact runtime state cannot be proven during startup, choose `inactive` (confirm/fail-closed), not `active`.
- `/sandbox` diagnostics must print both the integration flag and the effective bypass tool policy, e.g. `Background tasks sandbox: active (Linux bwrap)` or `inactive: unsupported platform`.

## Documentation requirements

- `plugins/pi-sandbox/README.md`: update Security boundary and Known bypass mitigation sections so background/monitor are no longer listed as unconditional residual bypasses. Include the policy matrix above, Linux-only limit, `sandboxIntegration` flag, and fail-closed default.
- `plugins/background-tasks/README.md`: document that the package optionally integrates with `@nklisch/pi-sandbox`; show config:

```json
{
  "backgroundTasks": {
    "sandboxIntegration": "auto"
  }
}
```

- State plainly: Linux with bwrap gets real sandboxing; non-Linux runs unsandboxed and relies on pi-sandbox's confirm/fail-closed tool policy; setting `"off"` is an explicit operator bypass.

## Acceptance criteria

- [ ] `/sandbox` reports the background-tasks sandbox integration state and the effective background/monitor policy.
- [ ] On Linux active integration, default background/monitor policy is `allow` unless global/project config tightens it.
- [ ] Integration off, non-Linux degrade, missing bwrap, filter mode, and invalid config keep `confirm`/fail-closed behavior by default.
- [ ] Additive merge prevents project-local config from loosening default/global active policy.
- [ ] pi-sandbox README and background-tasks README document the integration, flag, Linux-only real sandboxing, fail-closed behavior, and policy matrix.
- [ ] Tests cover every row of the policy matrix.

# Pi Sandbox

First-party sandbox hardening for pi. On Linux, the package runs pi's mediated LLM/tool `bash` path and interactive `user_bash` (`!`/`!!`) path through `bwrap`; on macOS/Windows, that OS-level bash sandbox gracefully degrades to local unsandboxed bash while keeping the in-process `read`/`write`/`edit` file policy, tool-egress policy, and secret inspector active. RPC/API mode's direct `bash` command is a known residual bypass in current pi core; see Security boundary / non-goals.

## Requirements

- Linux hosts get the full OS-level bash sandbox and must have `bwrap` (`bubblewrap`) installed and available on `PATH` before the pi session starts.
- macOS and Windows hosts gracefully degrade: mediated LLM/tool `bash` and interactive `user_bash` run through pi's normal local shell backend, while the in-process file-tool policy, tool-egress policy, and secret inspector remain active.
- Pi loads this as a Pi package from `package.json`; it is intentionally Pi-only and has no Claude Code or Codex plugin manifests.

If the sandbox is enabled on Linux but `bwrap` is missing, config is invalid, or `network.mode=filter` is selected, the mediated LLM/tool `bash` path and interactive `user_bash` (`!`/`!!`) fail closed. The file-tool policy still runs in-process. This fail-closed claim does not cover RPC/API mode's direct `bash` command. Non-Linux hosts do not fail closed solely because `bwrap` is unavailable; they enter the graceful-degrade state described above.

## Install

Local checkout install:

```bash
pi install /home/agent/projects/skills/plugins/pi-sandbox
```

One-shot local load without writing settings:

```bash
pi -e /home/agent/projects/skills/plugins/pi-sandbox
```

Git-sourced install from this repository checkout:

```bash
git clone https://github.com/nklisch/skills.git
pi install "$PWD/skills/plugins/pi-sandbox"
```

Pi git sources load package roots. If this package is published or mirrored as a standalone package-root git repository, install that root directly:

```bash
pi install git:github.com/nklisch/pi-sandbox@<tag-or-commit>
```

## Usage

Start pi normally after installing. The extension registers hardened replacements for the tool-registry `bash`, `read`, `write`, and `edit`, a `--no-sandbox` flag for intentional operator bypass, and a `/sandbox` command for diagnostics. The RPC/API `bash` command is not a registered tool and is not mediated by this extension.

Useful checks inside pi:

```text
/sandbox
```

The status line should include `🔒 Sandbox:` when the extension reaches session start. Examples:

- `🔒 Sandbox: net open, 2 write paths, file tools hardened`
- `🔒 Sandbox: net block (0 domains), 2 write paths, file tools hardened`
- `🔒 Sandbox: FAIL-CLOSED (...) — file tools still hardened`
- `🔒 Sandbox: OS bash sandbox unavailable on darwin; in-process file/tool policy active`

Use `--no-sandbox` only as an explicit operator bypass during local migration or break-glass recovery:

```bash
pi --no-sandbox
```

`--no-sandbox` is a full intentional bypass for this extension: mediated LLM/tool `bash` and interactive `user_bash` fall through to pi's normal local shell backend, the tool-egress gate is not applied, and `read`/`write`/`edit` use a permissive no-op file policy. A global `enabled:false` config has the same operator-disable semantics. This is different from a real initialization failure, which keeps file tools hardened and blocks mediated bash instead of falling through, and from the non-Linux graceful-degrade state, which lets bash fall through but keeps file/tool policy and the secret inspector active.

## Configuration

Config is JSON and is merged from:

1. Global: `~/.pi/agent/extensions/sandbox.json`
2. Project-local: `<project>/.pi/sandbox.json`

Project-local config is additive-only. It may tighten policy, but it cannot loosen a global/default posture. The default network mode is `open` for the first release. For example, a project can add `denyRead` entries, add `denyWrite` entries, narrow `allowWrite`, move networking from `open` to `block`, or raise a tool policy from `confirm` to `block`; it cannot disable the sandbox, expand writable paths, or lower a blocked tool to allowed. A global/operator config may set `enabled:false` as an intentional full extension disable; project-local config cannot use `enabled:false` to loosen a global enabled policy.

Minimal hardened example:

```json
{
  "enabled": true,
  "filesystem": {
    "denyRead": ["~/.ssh", "~/.aws", "~/.gnupg", ".env"],
    "allowWrite": [".", "/tmp"],
    "denyWrite": [".env", "secrets"]
  },
  "network": {
    "mode": "block"
  },
  "tools": {
    "default": "allow",
    "rules": {
      "background": "confirm",
      "monitor": "confirm"
    }
  }
}
```

Notes:

- Relative filesystem paths resolve against the pi session cwd.
- Existing paths are canonicalized before comparison and before `bwrap` mounts.
- Non-existent deny paths are skipped by the `bwrap` layer so the sandbox never creates host stubs.
- Linux `bwrap` cannot enforce glob-shaped `denyWrite` entries; the extension warns when it sees them.
- ASRT-only config fields such as `ignoreViolations`, `enableWeakerNestedSandbox`, `httpProxyPort`, `socksProxyPort`, and `filesystem.allowGitConfig` are ignored with warnings.

## Network modes

- `open` (default): sandboxed bash uses the host network. Filesystem/env/tool policy still applies.
- `block`: sandboxed bash runs with `--unshare-net` and has no network access.
- `filter`: deferred. The extension recognizes this mode but fails closed rather than silently treating it as `open`. Follow-up work is tracked in `.work/backlog/idea-pi-sandbox-filter-tcp-proxy.md`.

## Security boundary / non-goals

This plugin makes the common interactive/model shell path and file-tool path safer; it is not a complete trust boundary for a Pi session.

What it hardens:

- On Linux, the registered LLM/tool `bash` path runs through the first-party `bwrap` backend when the sandbox initializes.
- On Linux, interactive `user_bash` (`!`/`!!`) receives the same sandboxed bash operations when initialized, and returns a blocking bash result instead of falling through to the local backend when initialization fails or is still pending.
- On macOS/Windows, OS-level bash sandboxing is unavailable; mediated bash and `user_bash` run unsandboxed through pi's local backend, but the in-process file-tool policy, tool-egress policy, and secret inspector remain active.
- The `read`, `write`, and `edit` tools enforce the configured file policy in-process, so file-tool protections remain active even when bash is fail-closed or the OS bash sandbox is unavailable.
- `network.mode=block` air-gaps sandboxed bash with a network namespace. `network.mode=open` leaves host networking intact for sandboxed bash while still applying file and env policy.
- Sandboxed bash receives a minimal child environment (`PATH`, `HOME`, `TERM`, `LANG`, `LC_*`, `TMPDIR`) instead of provider tokens.

Intentional disable paths:

- `--no-sandbox` and global `enabled:false` are operator bypasses, not hardened modes. They make mediated LLM/tool `bash` and interactive `user_bash` use pi's normal local backend, skip this extension's tool-egress gate, and install a permissive file-tool policy so `read`/`write`/`edit` behave like normal pi file tools.
- Fail-closed states are not bypasses. On Linux, missing `bwrap`, invalid config, and deferred `network.mode=filter` block mediated LLM/tool `bash` plus interactive `user_bash` and keep file tools hardened. Unsupported non-Linux hosts are a distinct graceful-degrade state, not fail-closed and not a full bypass.

Non-goals and known gaps:

- Pi extensions and installed Pi packages are trusted code. They run with the user's normal permissions and are not sandboxed by this plugin.
- RPC/API mode's direct `bash` command is a known residual bypass in current pi core. It calls `AgentSession.executeBash()` directly with pi's local bash operations, bypassing both the registered `bash` tool and the `user_bash` extension event. This extension cannot sandbox or fail-close that path until pi core exposes an interception hook; operators who require bash sandboxing should avoid or restrict RPC/API bash access.
- `background` and `monitor` currently spawn outside the overridden tool-registry `bash` path until the background-tasks integration lands. Track that gap in `.work/backlog/idea-background-tasks-sandbox-integration.md`.
- `agent_send`, web/search tools, subagents, and provider/model requests are not OS-sandboxed command surfaces. They may perform network or provider egress according to their own implementations and any in-process tool policy configured by Pi.
- `network.mode=open` is not an egress boundary. It intentionally gives sandboxed bash the host's normal network access.
- `network.mode=filter` is recognized as a deferred strict mode and fails closed rather than silently degrading to open networking.

Use this plugin as defense-in-depth for mediated shell commands and file access. On non-Linux hosts, treat it as in-process policy defense only: arbitrary shell commands are not confined by an operating-system sandbox, though file tools and tool-egress gates still run.

## Known bypass mitigation: background / monitor

`background` and `monitor` are known shell-bypass tools: today they can spawn commands outside the overridden tool-registry `bash` path. The sandbox extension mitigates that gap by defaulting both tool-egress policies to `confirm` when the sandbox is enabled. In a non-interactive/no-UI session, confirmation fails closed and the call is blocked. Operators who want a stricter posture can set them to `block`; an intentional global opt-out can set a rule to `allow`, but project-local config can only tighten, not loosen, a global/default `confirm` or `block` rule.

This is only a first-release mitigation, not real background-tasks sandbox integration. The remaining integration work is tracked in `.work/backlog/idea-background-tasks-sandbox-integration.md`.

## Migration

If you previously loaded an operator-local copy such as `~/.pi/agent/extensions/sandbox`, replace that path with this package install:

```bash
pi install /home/agent/projects/skills/plugins/pi-sandbox
```

Then remove the old local extension path from `~/.pi/agent/settings.json` only after a fresh pi launch reports `🔒 Sandbox:` from this package. Do not commit operator-local settings to this repository.

If you had been starting pi with `--no-sandbox` as a workaround for the ASRT-backed extension, remove the flag after installing this package and setting `network.mode` to either `open` or `block`. Keep `--no-sandbox` only for deliberate break-glass sessions.

If you carried old ASRT config fields, delete them rather than relying on them. This package warns about ASRT-only fields and does not treat them as active security controls.

## Provenance

This package is derived from pi's MIT-licensed `examples/extensions/sandbox/` extension shape. The ASRT dependency has been removed. The first-party `bwrap` argument builder, config boundary, in-process file-tool policy, and bypass-tool mitigation are original MIT-licensed code in this repository.

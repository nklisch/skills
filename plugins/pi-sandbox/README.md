# Pi Sandbox

First-party sandbox hardening for pi. On Linux, the package runs pi's mediated LLM/tool `bash` path and interactive `user_bash` (`!`/`!!`) path through `bwrap`; on macOS, that OS-level bash sandbox gracefully degrades to local unsandboxed bash while keeping the in-process `read`/`write`/`edit` file policy, tool-egress policy, and secret inspector active. **Windows is out of scope for 0.1.0** (see Platform support). RPC/API mode's direct `bash` command is a known residual bypass in current pi core; see Security boundary / non-goals.

## Requirements

- Linux hosts get the full OS-level bash sandbox and must have `bwrap` (`bubblewrap`) installed at one of the trusted system paths (`/usr/bin/bwrap`, `/bin/bwrap`) before the pi session starts, or pinned explicitly via the global `sandbox.bwrapPath` config field. `bwrap` is never resolved from `PATH` — a hostile `PATH` cannot substitute a fake wrapper.
- macOS hosts gracefully degrade: mediated LLM/tool `bash` and interactive `user_bash` run through pi's normal local shell backend, while the in-process file-tool policy, tool-egress policy, and secret inspector remain active.
- Pi loads this as a Pi package from `package.json`; it is intentionally Pi-only and has no Claude Code or Codex plugin manifests.

## Platform support

0.1.0 supports Linux and macOS only:

- **Linux** — full first-party bwrap OS-level bash sandbox plus the in-process file/tool/egress/inspector policy.
- **macOS** — graceful degrade: no OS-level bash sandbox, but the in-process `read`/`write`/`edit` file policy, tool-egress policy, and secret inspector remain active.
- **Windows** — **out of scope for 0.1.0.** The in-process file-tool policy's glob matcher (`sandbox-bwrap.ts` `globCharsToRegex` and `sandbox-file-policy.ts` `matchesDenyList`/`isWithinAllowWrite`) compiles `*`→`[^/]*` and `?`→`[^/]`, treating `/` as the only path separator. On Windows, `normalizeConfiguredPath` produces `\`-separated paths via Node's `resolve()`, so `*` is no longer segment-local and `allowWrite`/`denyRead`/`denyWrite` globs can match across directory boundaries and mis-enforce policy. Because the package explicitly claims that the in-process policy "remains active" on non-Linux, this is an undocumented gap in a claimed area rather than a non-goal. Rather than ship a half-validated Windows path, 0.1.0 removes Windows from its release claim; Windows support is tracked for a post-0.1.0 release that makes the glob matcher separator-aware (or normalizes both sides to `/` first). See [Threat model: Release scope (0.1.0)](docs/THREAT_MODEL.md#release-scope-010) and the tracking item `.work/backlog/idea-pi-sandbox-windows-path-separator.md`.

If the sandbox is enabled on Linux but `bwrap` is missing, config is invalid, or `network.mode=filter` is selected, the mediated LLM/tool `bash` path and interactive `user_bash` (`!`/`!!`) fail closed. The file-tool policy still runs in-process. This fail-closed claim does not cover RPC/API mode's direct `bash` command. macOS hosts do not fail closed solely because `bwrap` is unavailable; they enter the graceful-degrade state described above. Windows is out of scope for 0.1.0 (see Platform support).

## Install

Local checkout install:

```bash
pi install -l ./plugins/pi-sandbox
```

One-shot local load without writing settings:

```bash
pi -e ./plugins/pi-sandbox
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

(Windows is out of scope for 0.1.0 and produces no `darwin`-style graceful-degrade claim; see Platform support.)

Use `--no-sandbox` only as an explicit operator bypass for break-glass recovery or sandbox troubleshooting:

```bash
pi --no-sandbox
```

`--no-sandbox` is a full intentional bypass for this extension: mediated LLM/tool `bash` and interactive `user_bash` fall through to pi's normal local shell backend, the tool-egress gate is not applied, and `read`/`write`/`edit` use a permissive no-op file policy. A global `enabled:false` config has the same operator-disable semantics. This is different from a real initialization failure, which keeps file tools hardened and blocks mediated bash instead of falling through, and from the macOS graceful-degrade state, which lets bash fall through but keeps file/tool policy and the secret inspector active.

## Configuration

Config is JSON and is merged from:

1. Global: `<Pi agent dir>/extensions/sandbox.json` (`~/.pi/agent/extensions/sandbox.json` by default; honors Pi's configured agent directory, including `PI_CODING_AGENT_DIR`)
2. Project-local: `<project>/.pi/sandbox.json`

Project-local config is additive-only. It may tighten policy, but it cannot loosen a global/default posture. The default network mode is `open` for the first release. The canonical 0.1.0 version promise and post-0.1.0 direction are in [Threat model: Release scope (0.1.0)](docs/THREAT_MODEL.md#release-scope-010). For example, a project can add `denyRead` entries, add `denyWrite` entries, narrow `allowWrite`, move networking from `open` to `block`, or raise a tool policy from `confirm` to `block`; it cannot disable the sandbox, expand writable paths, or lower a blocked tool to allowed. A global/operator config may set `enabled:false` as an intentional full extension disable; project-local config cannot use `enabled:false` to loosen a global enabled policy. `sandbox.bwrapPath` is global/operator-only: it selects the binary that runs bash outside the sandbox (the wrapper that creates the sandbox), so it is the most privileged trust decision in the system — project-local attempts to set `bwrapPath` are rejected with a warning. `filesystem.allowGitDirDiscovery` is also global/operator-only: it controls whether gitfile targets outside an `allowWrite` root may become writable. Operators who need a custom `bwrap` install or want to change Git discovery set it in global config.

Minimal hardened example:

```json
{
  "enabled": true,
  "backgroundTasks": {
    "sandboxIntegration": "auto"
  },
  "filesystem": {
    "denyRead": ["~/.ssh", "~/.aws", "~/.gnupg", ".env"],
    "allowWrite": [".", "/tmp"],
    "denyWrite": [".env", "secrets"],
    "tmpBackend": "session-disk"
  },
  "network": {
    "mode": "block"
  },
  "tools": {
    "default": "allow",
    "rules": {
      "subagent": "confirm"
    }
  }
}
```

Notes:

Global `filesystem.denyRead` is not a selective override in 0.1.0. A non-empty
global list is unioned with the defaults: an operator can add entries but cannot
remove one default. An explicit global `"denyRead": []` clears **all** defaults,
and is the only current escape. There is no single global-list value that clears
one default and preserves the rest. If a project must read one default-denied
path, the operator must set the global list to `[]`, then copy every protection
they want to retain into that project's additive `filesystem.denyRead` list and
remove only the required path:

```json
[
  "~/.ssh",
  "~/.aws",
  "~/.gnupg",
  "~/.pi/agent/auth.json",
  "~/.pi/agent/sessions",
  "~/.config/gh",
  "~/.config/git/credentials",
  "~/.git-credentials",
  "~/.netrc",
  "~/.npmrc",
  "~/.docker/config.json"
]
```

Entries not re-added in project config are unprotected. This all-or-nothing
escape is a known 0.1.0 limitation; do not describe it as selective removal.

- Relative filesystem paths resolve against the pi session cwd.
- Existing paths are canonicalized before comparison and before `bwrap` mounts.
- Non-existent deny paths are skipped by the `bwrap` layer so the sandbox never creates host stubs.
- Linux `bwrap` cannot enforce glob-shaped `denyWrite` entries; the extension warns when it sees them.
- `backgroundTasks.sandboxIntegration` defaults to `"auto"`. Set it to `"off"` only as an explicit operator bypass for background/monitor sandboxing; project-local config cannot loosen a global/default `"auto"` posture to `"off"`.
- Config fields not recognized by this package's first-party contract are ignored with warnings and are not treated as active security controls.
- **Git directory auto-discovery (submodules and linked worktrees):** `filesystem.allowGitDirDiscovery` defaults to `false`; operators who use submodules or linked worktrees opt in globally (project-local configuration is rejected with a warning):

  ```json
  {
    "filesystem": {
      "allowGitDirDiscovery": true
    }
  }
  ```

  With the secure default, no external gitfile target is pinned or added to `allowWrite`; the normal `.git` directory inside an allowWrite root remains covered by that root bind. **Set `true` only when the repository is trusted and its submodule/linked-worktree compatibility is required:** a malicious gitfile can point at an arbitrary external host Git directory with a regular `HEAD` and make it writable. The `HEAD` check rejects non-Git targets such as `/etc`, but cannot distinguish a Git-created linked-worktree target from an attacker-selected Git directory. `denyRead`/`denyWrite` always take precedence. One level of gitfile indirection only: a linked worktree's `commondir` (shared object/ref store) is not followed, so linked worktrees get per-worktree metadata access only — an operator who needs shared ref writes adds the common dir to `allowWrite` explicitly. The `background`/`monitor` tools consume session-pinned temp/config-root state but do not receive session-pinned discovered Git directories; commands needing Git operations in a submodule should run via the sandboxed `bash` tool.

## Network modes

- `open` (default): sandboxed bash uses the host network. Filesystem/env/tool policy still applies.
- `block`: sandboxed bash runs with `--unshare-net`, has no network access, and masks host IPC-heavy runtime/temp paths with private tmpfs mounts (`/run`, `/var/run`, `/tmp`, `/var/tmp`, and X11 temp socket paths). `TMPDIR` is forced to the project temp dir (under `tmpBackend: "session-disk"`, the default) or `/tmp` (under `tmpBackend: "host-tmpfs"`) so temp-using commands write into the sandbox temp dir instead of a host-provided path.
- `filter`: deferred. The extension recognizes this mode but fails closed rather than silently treating it as `open`. Follow-up work is tracked in `.work/backlog/idea-pi-sandbox-filter-tcp-proxy.md`.

## Temp backend

`filesystem.tmpBackend` controls where sandboxed children put temp files:

- `session-disk` (default): a per-project dir on a disk-backed cache root (`~/.cache/pi-sandbox/tmp/<cwd-hash>/`), keyed by the canonical session cwd, bound writable with `TMPDIR` set to it. Open mode does **not** *writable-bind* host `/tmp` through — host `/tmp` remains visible read-only via the root bind (and its Unix sockets remain connectable), but sandboxed children can no longer *write* to host `/tmp`; their temp writes land in the project dir. Block mode keeps the `/tmp` tmpfs mask (IPC isolation preserved) while `TMPDIR` points at the project dir. The dir persists across sessions (no cleanup); if disk growth ever matters, OS tooling (`systemd-tmpfiles`, a cron) handles cache-dir hygiene generically. **The extension does not runtime-validate that the cache root is on a disk-backed filesystem** — the operator asserts `XDG_CACHE_HOME` (or accepts `~/.cache`) and verifies it is disk-backed, e.g. with `findmnt "$XDG_CACHE_HOME"`; if the cache root is accidentally on tmpfs, the feature is silently defeated (temp quietly returns to RAM). This is an outer-boundary responsibility (the package assumes an outer host-isolation boundary already exists); runtime validation of the cache root's backing store is deferred. A relative or empty `XDG_CACHE_HOME` fails closed (it would produce a relative `TMPDIR`).
- `host-tmpfs`: the prior behavior — host `/tmp` bound through in open mode, or masked with tmpfs in block mode. Preserved as an explicit opt-out for the host-tmpfs memory model.

## Security boundary / non-goals

Read [the threat model](docs/THREAT_MODEL.md) for the complete security posture and the canonical [Release scope (0.1.0)](docs/THREAT_MODEL.md#release-scope-010) statement. pi-sandbox assumes an operator-provided **outer** host-isolation boundary already exists (a VM, a container, a dedicated host, a separate OS account — whatever the operator chose), and provides only the **inner** Linux bwrap same-user credential-isolation membrane for mediated bash. The in-process file policy is defense-in-depth for same-user file tools, not a concurrency-hard boundary. It is not a complete Pi-session trust boundary.

### Backend decision and control triage

The 2026-07-11 assessment retains the first-party bwrap backend for 0.1.0. `@anthropic-ai/sandbox-runtime` v0.0.26 is not adopted because it does not provide this package's fail-closed initialization, in-process file-tool parity, additive-only configuration, hardlink guard, trusted bwrap lookup, and background/monitor spawn contract. Gondolin is a redundant nested micro-VM inside an operator's existing outer boundary; OpenShell is a whole-agent governance platform, not an inner Pi membrane. Revisit triggers are recorded in the [threat model](docs/THREAT_MODEL.md#buy-versus-build-decision).

| Control | Status |
| --- | --- |
| Tool-egress policy and writable-surface policy | **Core** boundary controls |
| In-process file policy | **Defense in depth**; closes the TOCTOU leaf-symlink swap and detects ordinary post-start hardlinks, but is not a concurrency-hard same-user boundary |
| Secret-shape inspector | **Optional defense in depth**; opt-in input inspection, not isolation |
| Network `filter` | **Deferred and tracked**; recognized but fail-closed |

### Credential registration and forge capability

Global `filesystem.denyRead` and `envScrub.names` / `envScrub.patterns` are the operator credential registry. A project can only add protections; it cannot remove inherited ones. `bwrapPath`, `enabled:false`, and `filesystem.allowGitDirDiscovery` are global/operator-only trust decisions. Default read masking includes `~/.config/git/credentials` alongside Pi auth/session state, SSH/GPG, GitHub CLI state, and other file-backed Git stores. User Git config is deliberately readable by default: masking `~/.gitconfig` or `~/.config/git/config` makes Git reject the bwrap-mounted character device and exit 128, so it is not a safe credential-helper mitigation. Linux bwrap children receive a minimal environment and apply `envScrub`; degraded background/monitor spawns apply `envScrub` too, plus strip the non-configurable provider-secret floor, including `GITHUB_TOKEN`, `GH_TOKEN`, and `COPILOT_GITHUB_TOKEN`. Operators register Forgejo-specific files and token names through the global registry. The global deny-list's all-or-nothing clearing behavior is documented in [Configuration](#configuration).

A separate forge-operations extension can query `Symbol.for("@nklisch/pi-sandbox.credential-boundary-capability")`. `active:true` means only that the Linux bash/file-tool credential-isolation boundary initialized and is not fail-closed. It is a necessary but insufficient signal for credential loading, not permission or proof that a particular credential is safe. The forge extension must re-read the capability before each load and refuse when it is absent, malformed, inactive, or fail-closed, but it owns its credential-custody model and must not assume a specific path is masked. It can use a file path whose masking the operator independently arranged—registered in global `filesystem.denyRead` as a literal path and confirmed to exist at initialization—or keep credentials in a broker-private channel that never enters model-observable space regardless of pi-sandbox's state. pi-sandbox deliberately exports no effective-path-protection query, and a consumer must not duplicate its internal config discovery/merge rules as a substitute. The path- and secret-free payload also does not prove that an operator-registered `denyRead` entry is bash-masked (globs are not bwrap-enforced and nonexistent paths are skipped), RPC/API bash is mediated, background/monitor integration is active, Git credential helpers/sockets/keyrings are blocked, or the operator retained the default deny list. `/sandbox` reports `Credential boundary capability:` from the same lifecycle contract. pi-sandbox intentionally provides no forge APIs, Git credential helper, privileged Git runner, or provider-specific remote-operation/authentication policy.

This plugin makes the common interactive/model shell path and file-tool path safer; it is not a complete trust boundary for a Pi session.

What it hardens:

- On Linux, the registered LLM/tool `bash` path runs through the first-party `bwrap` backend when the sandbox initializes.
- On Linux, interactive `user_bash` (`!`/`!!`) receives the same sandboxed bash operations when initialized, and returns a blocking bash result instead of falling through to the local backend when initialization fails or is still pending.
- On macOS, OS-level bash sandboxing is unavailable; mediated bash and `user_bash` run unsandboxed through pi's local backend, but the in-process file-tool policy, tool-egress policy, and secret inspector remain active. Windows is out of scope for 0.1.0; its in-process glob matcher is not separator-aware (see Platform support).
- The `read`, `write`, and `edit` tools enforce the configured file policy in-process, then bind file I/O to an `O_NOFOLLOW` descriptor and revalidate its inode/link count before reading, truncating, or writing. This closes TOCTOU leaf-symlink swaps and preserves symlinked parent directories. **Behavior change:** the in-process tools reject a leaf symlink even when its canonical target is safely inside `allowWrite` (`O_NOFOLLOW` returns `ELOOP` regardless of the allowlist); operators who need that access must resolve the symlink and operate on the target pathname directly, or replace the symlink with a regular file or directory. This keeps file-tool protections active even when bash is fail-closed or the OS bash sandbox is unavailable.
- `network.mode=block` air-gaps sandboxed bash with a network namespace and private tmpfs mounts over host IPC-heavy temp/runtime directories. `network.mode=open` leaves host networking and host temp/socket paths intact for sandboxed bash while still applying file and env policy.
- Sandboxed bash receives a minimal child environment (`PATH`, `HOME`, `TERM`, `LANG`, `LC_*`, `TMPDIR`) and applies configured `envScrub` names and case-insensitive patterns, so registered provider or forge tokens do not pass through. Degraded background/monitor children apply the same `envScrub`. Under `tmpBackend: "session-disk"` (default), `TMPDIR` is always set to the project temp dir in both open and block modes; under `host-tmpfs`, block mode forces `TMPDIR=/tmp`.
- When `@nklisch/pi-background-tasks` is also installed on Linux with `backgroundTasks.sandboxIntegration:"auto"`, its `background` and `monitor` tools use the pi-sandbox bwrap helper too. In that active state, pi-sandbox's tool-egress default for those two tools relaxes to `allow` because their shell commands are now actually sandboxed.

Intentional disable paths:

- `--no-sandbox` and global `enabled:false` are operator bypasses, not hardened modes. They make mediated LLM/tool `bash` and interactive `user_bash` use pi's normal local backend, skip this extension's tool-egress gate, and install a permissive file-tool policy so `read`/`write`/`edit` behave like normal pi file tools.
- Fail-closed states are not bypasses. On Linux, missing `bwrap`, invalid config, and deferred `network.mode=filter` block mediated LLM/tool `bash` plus interactive `user_bash` and keep file tools hardened. macOS is a distinct graceful-degrade state, not fail-closed and not a full bypass. Windows is out of scope for 0.1.0 (see Platform support).

Non-goals and known gaps (the consolidated 0.1.0 release claim remains [Threat model: Release scope (0.1.0)](docs/THREAT_MODEL.md#release-scope-010)):

- Pi extensions and installed Pi packages are trusted code. They run with the user's normal permissions and are not sandboxed by this plugin.
- RPC/API mode's direct `bash` command is a known residual bypass in current pi core. It calls `AgentSession.executeBash()` directly with pi's local bash operations, bypassing both the registered `bash` tool and the `user_bash` extension event. This extension cannot sandbox or fail-close that path until pi core exposes an interception hook; operators who require bash sandboxing should avoid or restrict RPC/API bash access.
- **Concurrent hardlink + deny-path race (spans both boundaries):** both the in-process file tools and the bwrap path guard against hardlink aliases via a mutable-pathname `assertNoHardlinkedDeniedFiles` rescan, but neither is **concurrency-hard** against a same-user adversary running arbitrary code. The in-process guard runs at file-operation time; the bwrap guard runs once per command at argv-build time. In both cases a determined attacker can move a denied pathname aside while the rescan observes `ENOENT`, leaving an opened fd (in-process) or a writable bind (bwrap) on the credential inode through a hardlink alias. bwrap is the stronger boundary — it blocks network, most filesystem paths, and process inspection — but it is not a concurrency-hard boundary against this race. The complete inode-identity redesign (capture denied inodes at policy-install time; check opened fds and bwrap binds against that captured set) is tracked post-0.1.0 as `story-pi-sandbox-inode-identity-redesign`.
- Git credential helpers, cache sockets, and keyring/keychain stores are a 0.1.0 residual. User Git config and `HOME` are preserved, so `git credential fill` can retrieve plaintext through a configured helper, a credential-cache socket, libsecret, macOS Keychain, Git Credential Manager, or another keyring. Masking `~/.gitconfig` or `~/.config/git/config` is not a safe mitigation because it breaks ordinary Git config reads, so those paths are not denied by default. Operators who want to block helper retrieval must register the helper's file or socket path in global `filesystem.denyRead` as a **literal path that exists when the sandbox initializes** (globs are not bwrap-enforced; nonexistent paths are skipped), or accept this residual.
- `background` and `monitor` have real Linux bwrap integration when `@nklisch/pi-background-tasks` is installed and `backgroundTasks.sandboxIntegration:"auto"` is active. They are still not OS-sandboxed on macOS, when the integration is off, or when pi-sandbox is fail-closed; the tool-egress policy stays at `confirm`/fail-closed in those states. Windows is out of scope for 0.1.0.
- Web/search tools, subagents, and provider/model requests are not OS-sandboxed command surfaces. They may perform network or provider egress according to their own implementations and any in-process tool policy configured by Pi.
- `network.mode=open` is not an egress boundary. It intentionally gives sandboxed bash the host's normal network access and does not hide host Unix sockets under `/tmp` or `/var/tmp`.
- `network.mode=block` private `/tmp` and `/var/tmp` tmpfs mounts override `allowWrite`/`denyWrite` expectations for those host paths: writes go to sandbox-private memory, not host files. bwrap creates these tmpfs mounts with ordinary directory permissions rather than sticky `1777`; this is acceptable for the single-user sandbox model but does not preserve multi-user `/tmp` semantics. Under `tmpBackend: "session-disk"` (default), `TMPDIR` points at the disk-backed project temp dir, so temp writes land on disk (capacity bounded by disk, not RAM); under `host-tmpfs`, block mode forces `TMPDIR=/tmp` and bwrap does not apply a size cap to the tmpfs, so a sandboxed command can still consume memory by filling its private temp filesystem. Because the private tmpfs hides host `/tmp`, a sandboxed command whose working directory is under `/tmp` or `/var/tmp` will fail to `chdir` into it in block mode; use a project-directory cwd (the default) or `network.mode=open` if the command must run from a host temp path.
- `network.mode=filter` is recognized as a deferred strict mode and fails closed rather than silently degrading to open networking. Its status and the rest of the post-0.1.0 direction are consolidated in [Threat model: Release scope (0.1.0)](docs/THREAT_MODEL.md#release-scope-010).
- `--no-sandbox` fully bypasses pi-sandbox's own gates (bash, file-tool, egress, inspector) but does not currently propagate to the `background`/`monitor` integration: those tools may still resolve and use the sandbox helper when `sandboxIntegration:"auto"` is active and the sandbox config loads as enabled from disk. This is stricter than the bypass intends (commands may be sandboxed when the operator asked to bypass) rather than a security weakening, but the `--no-sandbox` full-bypass contract is not yet honored for background/monitor. Set `backgroundTasks.sandboxIntegration:"off"` or `enabled:false` to fully bypass the integration. Tracked as a v0.1.x follow-up.
- **The secret inspector scans tool *input*, not tool *output*.** The `background`/`monitor`/`jobs` integration is a second egress path: a sandboxed background command (e.g. `cat .env`) can write a secret to its job buffer, and a later `jobs action=tail` returns that buffer to the model without redaction. The default config denies *writing* `.env` (so a sandboxed command cannot create or modify it) but does NOT deny reading it — reading was considered too likely to break legitimate dotenv-loading test/dev workflows, and project config is additive-only (a repo cannot opt back into `.env` reads once denied). Operators who want to close this vector for sensitive projects should add `.env` and other secret-bearing files to `filesystem.denyRead` in global/operator config. Full output inspection requires a shared redaction helper exposed by pi-sandbox and consumed by background-tasks — deferred beyond v0.1.0; see the canonical [Release scope (0.1.0)](docs/THREAT_MODEL.md#release-scope-010).

Use this plugin as defense-in-depth for mediated shell commands and file access. On macOS, treat it as in-process policy defense only: arbitrary shell commands are not confined by an operating-system sandbox, though file tools and tool-egress gates still run. Windows is out of scope for 0.1.0.

## Background / monitor integration and bypass policy

`background` and `monitor` can spawn commands outside the overridden tool-registry `bash` path, so this package integrates with `@nklisch/pi-background-tasks` on Linux: when `@nklisch/pi-background-tasks` is installed, `@nklisch/pi-sandbox` is available, `backgroundTasks.sandboxIntegration` is `"auto"`, `bwrap` is available, config is valid, and `network.mode` is `"open"` or `"block"`, background and monitor commands run through the same pi-sandbox bwrap helper and minimal environment as mediated `bash`.

The tool-egress default is state-aware and fail-closed when the integration is not provably active:

| State | Default `background`/`monitor` policy | Rationale |
|---|---|---|
| Linux + pi-sandbox enabled + `backgroundTasks.sandboxIntegration:"auto"` + `bwrap` available + `network.mode:"open"`/`"block"` + valid config | `allow` | Real bwrap integration is active; the tool call no longer bypasses sandboxed shell policy. |
| `@nklisch/pi-background-tasks` absent | no tool call exists | pi-sandbox has no background/monitor tools to gate. |
| pi-sandbox absent | no pi-sandbox policy | background-tasks degrades to its normal unsandboxed behavior because no sandbox policy exists. |
| `backgroundTasks.sandboxIntegration:"off"` | `confirm` unless a stricter `block` policy is configured | Explicit operator opt-out restores bypass risk. In no-UI sessions, `confirm` blocks. |
| macOS graceful degrade | `confirm` unless stricter | Shell commands are not OS-sandboxed on macOS. Windows is out of scope for 0.1.0. |
| Linux missing `bwrap`, `network.mode:"filter"`, invalid config, or sandbox fail-closed/uninitialized | `confirm` or stricter fail-closed block | The sandbox cannot prove real background/monitor confinement; do not silently allow. |
| project-local attempt to loosen `confirm`/`block` to `allow` | ignored with a warning | Project config is additive-only and cannot weaken operator/default security. |

`/sandbox` reports both lines operators should check:

```text
Background tasks sandbox: active (Linux bwrap integration ready)
Bypass tools: background=allow, monitor=allow
```

or, for example, `inactive (...)` / `blocked (...)` with `background=confirm, monitor=confirm` when the integration is not active. Operators can always tighten the policy to `block`.

## First-time setup

After installing, start pi normally. A fresh launch reports `🔒 Sandbox:` in the status line once the extension initializes.

If you need to disable the sandbox for a break-glass session (for example, debugging a bwrap failure on a host where the sandbox can't initialize), start pi with `--no-sandbox`, or set `"enabled": false` in the sandbox config. These are intentional operator bypasses; the default is sandbox-on.

Unsupported config fields are warned about and are not treated as active security controls — remove or correct them in your config.

## Provenance

This package is derived from pi's MIT-licensed `examples/extensions/sandbox/` extension shape. The first-party `bwrap` argument builder, config boundary, in-process file-tool policy, and bypass-tool mitigation are original MIT-licensed code in this repository.

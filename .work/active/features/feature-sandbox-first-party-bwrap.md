---
id: feature-sandbox-first-party-bwrap
kind: feature
stage: review
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-30
updated: 2026-07-01
---

# Drop ASRT — first-party Linux bwrap sandbox, open/block first

## Brief

The pi sandbox extension currently exists only as an on-box copy at
`~/.pi/agent/sandbox-extension-backup/`, derived from pi's MIT
`examples/extensions/sandbox/` and wrapped around `@anthropic-ai/sandbox-runtime`
(ASRT). ASRT produced three verified breakages on this box: per-command host
stub creation for non-existent deny paths, `.claude`/`.git` file-stub bricking,
and an unnecessary Unix-domain-socket seccomp/proxy path that does not fit this
container or Pi's needs.

This feature drops ASRT and vendors a **Pi-only, Linux-only, first-party bwrap
sandbox plugin** into `plugins/pi-sandbox/` as `@nklisch/pi-sandbox`. The first
release is deliberately re-scoped to the hard core: sandboxed tool-registry
`bash` plus interactive `user_bash`, in-process `read`/`write`/`edit` policy,
tool-egress policy, and **network modes
`open` and `block` only**. `filter` mode is deferred to a backlog spike because
the TCP-loopback proxy topology is not yet a reliable design.

The goal is not to create a complete Pi trust boundary. Pi extensions run with
full user permissions, and tools not mediated by this extension can still egress
unless blocked by tool policy. The initial product claim is narrower: make the
common interactive/model shell path and file-tool path meaningfully safer for
credentials and project secrets, fail closed when the OS sandbox cannot be
established for mediated bash, and document the remaining bypasses plainly.

## Rescope decision — 2026-07-01

A two-phase fresh-context review found the original design direction sound but
the initial decomposition too broad and under-specified. Accepted corrections:

- **Defer `filter` mode**. Ship `open` + `block`; move TCP allowlist filtering to
  `.work/backlog/idea-pi-sandbox-filter-tcp-proxy.md`.
- **Make bwrap semantics explicit**: Linux-only, `bwrap` required, minimal child
  environment, fresh PID namespace and `/proc`, cwd-relative/tilde path
  normalization, writable allow mounts, deny overlays applied last.
- **Preserve or explicitly define bash write policy**. `allowWrite` and
  `denyWrite` cannot remain decorative fields.
- **Mitigate known bypass tools**. `background` and `monitor` stay unsandboxed
  until the background-tasks plugin integrates with this helper, so the sandbox
  default policy must block/confirm them rather than silently allowing a bypass.
- **Add a config/boundary contract**. ASRT-shaped legacy fields must be warned or
  rejected, not silently kept as inert security theater.
- **Package as a real Pi package**. The plugin must be installable from its own
  root and follow Pi package dependency rules (`typebox` / Pi core as peers).

## Verified ASRT breakages that justify replacement

### 1. Per-command host stub leak

ASRT's Linux path masked non-existent deny paths by binding `/dev/null` over the
first missing component. Because `.`/cwd was writable, bwrap created persistent
host stubs such as `.claude`, `.git`, `.env`, and `.bashrc` on every command.

### 2. Bricking collision

Those stubs could be files where later setup expected directories. A `.git` or
`.claude` file stub caused `mkdir -p .git/hooks` / `.claude/commands` to fail
with `ENOTDIR`, bricking bash for the project.

### 3. UDS seccomp/proxy mismatch

ASRT's socket-blocking/proxy machinery was coupled to Claude-Code assumptions.
UDS `bind()` is also `EPERM` container-wide here, even outside any sandbox, so a
UDS bridge cannot be the basis of Pi network filtering in this environment.

## Current source and replacement boundary

Starting source:

- `/home/agent/.pi/agent/sandbox-extension-backup/index.ts`
- `/home/agent/.pi/agent/sandbox-extension-backup/package.json`

ASRT integration points to remove:

- `SandboxManager` import from `@anthropic-ai/sandbox-runtime`
- `SandboxManager.wrapWithSandbox(command)` in `createSandboxedBashOps().exec`
- `SandboxManager.initialize(...)` and `SandboxManager.reset()` lifecycle calls
- the ASRT dependency in package metadata

Surviving Pi-specific surface:

- config loading and additive project merge
- in-process `read` / `write` / `edit` policy
- tool-call egress gate and secret inspector
- environment scrubbing in the Pi process
- fail-closed posture and `/sandbox` diagnostics

## First-release security boundary

### In scope

- Linux `bwrap` sandbox for the registered LLM/tool `bash` override and interactive `user_bash`.
- In-process access control for `read`, `write`, and `edit`.
- Tool-egress policy for arbitrary Pi tools via `tool_call`.
- Network modes:
  - `open`: no network namespace; relies on filesystem/env/tool policy to keep
    secrets out of shell output.
  - `block`: `--unshare-net`; no shell network.
- Clear fail-closed diagnostics when config is invalid, `bwrap` is missing, or an
  unsupported network mode is requested.

### Out of scope / residual bypasses

- A malicious or compromised Pi extension. Pi packages execute arbitrary code.
- Tools not mediated by this extension unless blocked by tool policy.
- RPC/API mode's direct `bash` command in current pi core; it bypasses both the registered tool and `user_bash` event.
- `background` and `monitor` command execution until the background-tasks plugin
  consumes the same bwrap helper. Initial mitigation: default block/confirm.
- `agent_send`, web search, subagents, and provider requests as OS-sandboxed
  surfaces. They are governed only by tool policy/inspector rules.
- `filter` allowlist networking. Deferred.

## Core bwrap contract

The first-party builder replaces ASRT with a local, tested function in
`plugins/pi-sandbox/extensions/sandbox.ts`.

### Platform and availability

- Linux only for the initial package.
- `bwrap` must be resolvable before sandboxed bash is marked initialized.
- Non-Linux and missing-`bwrap` states fail closed unless `--no-sandbox` or
  `enabled:false` intentionally disables the extension.

### Path normalization

- Expand `~` against `homedir()`.
- Resolve relative config paths against the session cwd, not package cwd.
- For existing paths, canonicalize through `realpathSync.native` before emitting
  bwrap mounts and before in-process policy comparisons.
- Non-existent deny paths are skipped; they must never create host stubs.

### Mount order

Mount order is load-bearing:

1. Base readonly host view: `--ro-bind / /`.
2. Runtime devices/process view: `--dev /dev`, `--unshare-pid`, `--proc /proc`.
3. Writable allow mounts: existing `allowWrite` directories/files, including cwd
   only when `.`/cwd is allowed.
4. `denyWrite` overlays: existing paths remounted read-only after allow mounts.
5. `denyRead` overlays last: existing directories masked with `--tmpfs`; existing
   files masked with `--ro-bind /dev/null`.
6. Network: `block` adds `--unshare-net`; `open` adds nothing. `filter` is
   unsupported in first release and must fail closed rather than silently loosen.

### Child environment

Sandboxed bash must not inherit provider tokens. Use `--clearenv` and/or a
minimal `spawn(..., { env })` allowlist. Candidate env keys: `PATH`, `HOME`,
`TERM`, `LANG`, `LC_*`, `TMPDIR`. Provider/auth variables such as
`OPENAI_API_KEY`, `ANTHROPIC_*`, `ZAI_API_KEY`, and OAuth tokens must be absent
inside sandboxed bash.

## Implementation units

### Unit 1 — enabled-gap fix

**Story**: `story-pi-sandbox-enabled-gap-fix`

`enabled:false` must route bash to the local unsandboxed implementation rather
than leaving `sandboxInitialized=false` and bricking the tool. This fix was
already applied in the backup source and travels with the vendored copy.

### Unit 2 — first-party `buildBwrapArgs()` core hardening

**Story**: `story-pi-sandbox-buildbwrapargs`

Implement the Linux bwrap builder with the mount/env/proc/path/network contract
above. This story owns the core security semantics and the ASRT stub/brick
regression tests.

### Unit 3 — remove ASRT dep and lifecycle

**Story**: `story-pi-sandbox-drop-asrt-dep`
**Depends on**: `story-pi-sandbox-buildbwrapargs`

Remove the ASRT import, `wrapWithSandbox`, `initialize`, `reset`, and package
dependency. Do not remove fail-closed behavior.

### Unit 4 — config compatibility and security-boundary contract

**Story**: `story-pi-sandbox-config-boundary-contract`

Replace ASRT-shaped types with first-party config types. Warn or reject legacy
ASRT-only fields, document Linux/open/block scope, and add README language for
non-goals and known bypasses.

### Unit 5 — bypass-tool policy for background/monitor

**Story**: `story-pi-sandbox-bypass-tool-policy`

Until `background-tasks` consumes the bwrap wrapper, default sandbox policy must
not allow `background`/`monitor` to bypass the shell sandbox silently. Configure
and document block/confirm defaults and no-UI behavior.

### Unit 6 — vendor/package and verification

**Story**: `story-pi-sandbox-vendor-and-repoint`
**Depends on**: Units 1-5, except the deferred filter spike

Create `plugins/pi-sandbox/` as a Pi-only package, verify it installs from its
own root, and document optional local repointing of `~/.pi/agent/settings.json`.
Repository deliverables do not require committing operator-local settings.

## Testing obligations

### Builder and sandbox behavior

- non-existent deny paths create zero stubs in cwd
- denied cwd-contained directory is masked after cwd/allow mounts
- denied cwd-contained file is masked after cwd/allow mounts
- existing `.git` directory is masked without becoming a file stub or causing
  `ENOTDIR`
- `allowWrite` permits expected writable roots
- `denyWrite` prevents writes to protected existing files/dirs from bash
- `/tmp` writability matches the configured `allowWrite` contract
- `block` mode cannot reach a localhost listener
- `open` mode keeps normal host network
- fresh PID namespace and `/proc`: host PIDs/process env are not visible
- sandboxed bash env omits provider/auth secrets
- symlink to denied path is blocked or explicitly documented by a failing test

### Extension behavior

- `enabled:false` routes to unsandboxed bash intentionally
- `--no-sandbox` bypass still works
- config parse errors fail closed
- missing `bwrap` fails closed with actionable status
- unsupported `filter` config fails closed with an explicit deferred-mode message
- `read`/`write`/`edit` in-process policy still holds independently of bwrap
- tool-call inspector still blocks configured secret shapes
- `background`/`monitor` are blocked or require confirmation by default while
  sandbox is enabled

### Packaging

- `plugins/pi-sandbox/package.json` has `keywords:["pi-package"]`
- Pi core imports and `typebox` are peer dependencies per Pi package docs
- no `.claude-plugin/` or `.codex-plugin/` manifests
- `pi install /home/agent/projects/skills/plugins/pi-sandbox` loads the extension
  from package manifest alone
- README carries provenance: pi example MIT origin; ASRT removed; first-party
  bwrap layer is repository MIT code

## Deferred work

- `.work/backlog/idea-pi-sandbox-filter-tcp-proxy.md` — design and prove an
  allowlisted network-filter topology.
- `.work/backlog/idea-background-tasks-sandbox-integration.md` — replace the
  initial block/confirm mitigation with true bwrap integration for background
  and monitor spawn sites.

## Implementation order

1. `story-pi-sandbox-enabled-gap-fix`
2. `story-pi-sandbox-buildbwrapargs`
3. `story-pi-sandbox-drop-asrt-dep`
4. `story-pi-sandbox-config-boundary-contract`
5. `story-pi-sandbox-bypass-tool-policy`
6. `story-pi-sandbox-vendor-and-repoint`

## Risks

- **Operational fail-closed friction**: Linux hosts without usable bwrap will lose
  mediated bash until users intentionally disable the sandbox. Mitigate with clear status
  and docs.
- **Write-policy complexity**: bwrap mount semantics are subtle. Mount order and
  cwd-contained tests are mandatory.
- **Environment leaks**: filesystem masking is insufficient if shell env retains
  provider tokens. Minimal child env is mandatory.
- **Bypass tools**: background-tasks integration is not solved in this feature;
  tool policy is a mitigation, not a full fix.
- **Filter pressure**: users may expect allowlisted networking. The first release
  intentionally refuses that mode rather than shipping a fragile proxy.

## Implementation summary — autopilot run 2026-07-01 (raised tier)

All 6 child stories advanced to `stage: review` via implement-orchestrator, one
single-worker bundle per wave (serialized — single security-critical file).
Bootstrap: the target file was copied from the operator-local backup into
`plugins/pi-sandbox/extensions/sandbox.ts` before wave 1 (the enabled-gap-fix
traveled with the copy in land mode).

- `story-pi-sandbox-enabled-gap-fix` — verified land-mode fix + regression test.
- `story-pi-sandbox-buildbwrapargs` — first-party `buildBwrapArgs()` in
  `extensions/sandbox-bwrap.ts`; ordered ro-bind/dev/proc/allow/deny/tmpfs
  mounts, `--clearenv` + minimal env allowlist, `open`/`block` network, fail
  closed on `filter`, no host stubs for non-existent deny paths.
- `story-pi-sandbox-drop-asrt-dep` — ASRT import/lifecycle/package dep fully
  removed; first-party config types (`SandboxFilesystem`/`SandboxNetwork`/
  `SandboxConfig`); `grep -r sandbox-runtime plugins/pi-sandbox/` empty.
- `story-pi-sandbox-config-boundary-contract` — first-party config module
  (`extensions/sandbox-config.ts`), additive-only merge, legacy ASRT fields
  warned+ignored, `/sandbox` reports mode/fail-closed/legacy/bypass state,
  README `Security boundary / non-goals` section.
- `story-pi-sandbox-bypass-tool-policy` — `background`/`monitor` default
  `confirm` (fail closed when no UI), additive-only, `/sandbox` reports it,
  README mitigation section + follow-up link.
- `story-pi-sandbox-vendor-and-repoint` — `@nklisch/pi-sandbox@0.1.0` Pi-only
  package, peer deps on pi-core + typebox, no Claude/Codex manifests,
  `pi install` verified in a clean HOME, fresh launch reports
  `🔒 Sandbox: net open, 2 write paths, file tools hardened`, README complete
  (install/usage/config/network/boundary/bypass/migration/provenance).

Verification: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` → 41 pass
/ 0 fail (pure unit + bwrap integration: env scrub, /proc isolation, block-mode
network denial, deny-mount ordering, .git masking, symlink-to-denied).
Cross-cutting deviations: none. Ready for review.

## Review fixes (Phase 8 final peer review)

Accepted fresh-context final-review findings B1-B6 and S1-S2 have been resolved in-place while keeping this feature and its child stories at `stage: review`:

- B1: config validation now rejects unknown network modes, invalid tool policy values, and non-string policy arrays at load time.
- B2: config parse/validation failure installs a restrictive active policy for file tools and tool-call egress before returning.
- B3: denyRead+denyWrite directory intersections are now read-only masks, verified by live bwrap regression.
- B4: in-process write policy resolves nearest existing symlink parents before deny/allow checks, including mkdir paths.
- B5: project inspector config is additive-only for secret shapes and scan fields.
- B6: `plugins/pi-sandbox/README.md` provenance was reworded so `grep -r sandbox-runtime plugins/pi-sandbox/` is honestly empty.
- S1: default network mode is `open`; `filter` remains an explicit deferred fail-closed mode.
- S2: root `AGENTS.md` plugin map now lists `plugins/pi-sandbox/` and says there are ten plugins.

Verification after review fixes: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` passed (50 pass / 0 fail); `grep -r sandbox-runtime plugins/pi-sandbox/` produced zero output (exit 1).

## Review fix (deep review 2026-07-01)

A deep-lane substrate review found one blocking fail-closed breach: the `user_bash` hook returned `undefined` when the sandbox was uninitialized or fail-closed, which let pi fall through to the normal unsandboxed local backend for `!`/`!!` commands. Fixed by factoring the pure `decideUserBash()` routing decision and making only intentional bypasses (`--no-sandbox` or `enabled:false`) return fall-through; fail-closed and uninitialized states now return a full replacement `BashResult` (`{ result: { output, exitCode: 1, cancelled: false, truncated: false } }`) so pi treats the event as handled and blocks the command.

Also tightened intentional-disable behavior and docs. Judgment call: make `--no-sandbox` and global/operator `enabled:false` symmetric full extension disables, matching the disable-as-operator-disable direction already tracked for follow-up. Those paths now install a permissive no-op file policy before returning, while real init failures still install/retain restrictive fail-closed policy. README now states plainly that intentional disables bypass mediated bash/user_bash, file policy, and tool-egress policy, and that missing bwrap/invalid config/unsupported hosts/deferred filter remain hardened fail-closed states for mediated bash.

Verification after this fix: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` passed (61 pass / 0 fail); `grep -r sandbox-runtime plugins/pi-sandbox/` produced zero matches (exit 1).

Second deep-review follow-up: **Case B — RPC/API bash is not interceptable by this extension in current pi core**. Verified against the installed pi core source before changing docs:

- `dist/modes/rpc/rpc-client.js:246-247` sends RPC bash as `{ type: "bash", command }`.
- `dist/modes/rpc/rpc-mode.js:430-433` handles `case "bash"` by calling `session.executeBash(command.command, undefined, { excludeFromContext })`; it does not invoke a registered tool.
- `dist/core/agent-session.js:2082-2089` implements `executeBash()` by calling `executeBashWithOperations(..., options?.operations ?? createLocalBashOperations({ shellPath }), ...)`, so an RPC call with no `operations` uses pi's local shell backend.
- `dist/modes/interactive/interactive-mode.js:4691-4695` emits the `user_bash` event from `handleBashCommand()`, and source search found no RPC caller of `emitUserBash`.
- `dist/core/extensions/types.d.ts:759-763` allows custom `BashOperations` only as a `UserBashEventResult`; `dist/core/extensions/types.d.ts:850-855` exposes `tool_call`, `tool_result`, `user_bash`, `input`, and `registerTool`, but no `executeBash` override or global bash-operations hook.

Because the extension cannot mediate that pi-core direct executor path, the fix is honest boundary documentation rather than a fake interception. README language now scopes bash protection to the mediated LLM/tool `bash` path and interactive `user_bash`, documents RPC/API direct `bash` as a known residual bypass, and tells operators who need bash sandboxing to avoid/restrict RPC/API bash access. `/sandbox` diagnostics now also name RPC/API direct bash as not mediated by current pi core, and the existing diagnostics test asserts that wording. No interception test was added because there is no extension hook to assert against.

## Review (2026-07-01)

**Verdict**: Approve with comments

**Blockers**: none remaining.
- Deep review round 1 found a fail-closed breach on the `user_bash` (`!`/`!!`)
  path (returned `undefined` → Pi fell through to unsandboxed local bash).
  Fixed in `f4620f3`: `user_bash` now routes through `decideUserBash()` and
  returns an explicit `UserBashEventResult` block (`createUserBashBlockResult`,
  grounded in pi core `dist/core/extensions/types.d.ts:759-763`) for
  fail-closed/uninitialized; intentional `--no-sandbox`/`enabled:false` still
  fall through. Same fix installed a permissive no-op file policy for those
  intentional disables and made the README honest about bypass scope.
- Deep review round 2 found RPC/API `bash` bypasses the sandbox (pi core
  `session.executeBash()` runs direct, no extension hook). Verified Case B — a
  genuine pi-core architectural limitation, not interceptable. Fixed in
  `bdbea57` by documenting RPC/API direct bash as a residual bypass in the
  README (intro, fail-closed scope, non-goals), narrowing the bash-protection
  claims to mediated LLM/tool `bash` + interactive `user_bash`, and surfacing
  it in the `/sandbox` diagnostic. The package no longer overclaims bash
  protection in RPC mode.

**Important**: none. (`enabled:false` file-policy behavior was addressed by
the `f4620f3` fix; `allowWrite` canonical narrowing remains a backlog item —
`idea-pi-sandbox-allowwrite-canonical-narrowing` — out of scope here.)

**Nits**: none.

**Notes**: Substrate deep lane, fresh-context `openai-codex/gpt-5.5` (xhigh)
— different model class from the umans orchestrator, satisfying the
advisory→adversarial cross-model requirement. Two convergence rounds to a
clean APPROVE. Verification: `bun test` 61/61 pass (pure unit + real bwrap
integration); `grep -r sandbox-runtime plugins/pi-sandbox/` empty; clean
`pi install` verified in a throwaway HOME. Not archived pending operator
decision (feature body retained for the draft-PR description); CONVENTIONS.md
default `delete-refs` would otherwise archive to a bodyless stub.

## Scope amendment (PR-prep: graceful degrade)

Cross-platform install safety amendment: non-Linux hosts no longer enter the
fail-closed mediated-bash state solely because the first-party `bwrap` backend is
unavailable. The extension now distinguishes three runtime states:

1. **Linux fail-closed** — config parse/validation errors, Linux missing `bwrap`,
   and deferred `network.mode=filter` still block mediated LLM/tool `bash` and
   interactive `user_bash`, while keeping in-process file/tool policy hardened.
2. **Operator bypass** — `--no-sandbox` and global/operator `enabled:false`
   remain full bypasses: mediated bash/user_bash fall through, tool-egress policy
   is skipped, and file tools use the permissive no-op policy.
3. **OS-sandbox-unavailable graceful degrade** — macOS/Windows run mediated
   bash/user_bash through pi's local unsandboxed backend, but keep the configured
   in-process `read`/`write`/`edit` file policy, tool-egress policy, and secret
   inspector active.

Rationale: a Pi package installed in a cross-platform repository must not brick
bash for macOS/Windows users by default. Linux remains fail-closed when the user
asked for an OS sandbox and the Linux backend cannot initialize; non-Linux has no
first-party backend yet, so the safer product behavior is a clearly reported
partial hardening state rather than a broken shell or a silent full bypass.

Implementation notes: added `osSandboxUnavailable` runtime state in
`extensions/sandbox.ts`; factored `decidePlatformState()` and
`shouldBypassBashSandbox()` in `extensions/sandbox-bwrap.ts`; extended
`decideUserBash()` and `/sandbox` diagnostics in `extensions/sandbox-config.ts`;
updated tests and README/package metadata. Verification: `bun test
plugins/pi-sandbox/extensions/sandbox.test.ts` passed (66 pass / 0 fail), and
`grep -r sandbox-runtime plugins/pi-sandbox/` produced no output.

# Threat model

This document is the security posture and release-scope statement for
`@nklisch/pi-sandbox` 0.1.0. It describes the package as it is, not as a
promise of a general-purpose sandbox. A reviewer or release gate should use
[Release scope (0.1.0)](#release-scope-010) as the canonical version-promise
statement.

## Two boundaries

Pi runs as `agent:agent` in an operator-controlled VM. The **outer VM
boundary** is the primary host-security boundary: it owns host isolation and
broad damage containment. pi-sandbox does not claim to secure the host outside
that VM.

Within that VM, pi-sandbox provides an **inner credential-isolation boundary**:
it keeps credentials held by Pi's trusted control plane unavailable to
model-controlled shell commands and in-process file tools that run as the same
Unix user. On Linux, this means bwrap-mediated bash with a fresh PID namespace,
private `/proc`, read masks, and a minimal child environment. The inner boundary
also applies configured read policy to Pi's `read` tool and supplies the same
bwrap spawn contract to background/monitor when their integration is active.

This is deliberately narrower than complete session isolation. Trusted Pi
extensions/packages still run with the user's normal permissions; direct
RPC/API bash is not mediated by the extension; and non-Linux bash is not
OS-sandboxed. Those limits are release-scope gaps, not exceptions to the model.

## Protected credentials and enforcement

The protected set comprises Pi provider/session storage for Umans and
OpenAI/Codex; operator-owned GitHub and Forgejo material; SSH and GPG material;
GitHub CLI state; and generic Git credential stores. The mechanisms are
complementary:

| Credential material | Default protection | Operator extension point |
| --- | --- | --- |
| Pi auth/session state | `~/.pi/agent/auth.json` and `~/.pi/agent/sessions` are `denyRead` paths, enforced by bwrap and the in-process `read` policy. | Add other Pi-held files to global `denyRead`. |
| SSH, GPG, and cloud credentials | `~/.ssh`, `~/.gnupg`, and `~/.aws` are default `denyRead` paths, enforced by bwrap and `read`. | Add local credential directories to global `denyRead`. |
| GitHub CLI and file-backed Git stores | `~/.config/gh`, `~/.git-credentials`, `~/.netrc`, and `~/.config/git/credentials` are default `denyRead` paths, enforced by bwrap and `read`. | Add additional file-backed Git credential locations to global `denyRead`. |
| Git config and credential helpers | Git config is readable by default so ordinary Git continues to work. Masking `~/.gitconfig` or `~/.config/git/config` is not a safe mitigation: bwrap's regular-file mask makes Git reject the config and exit 128. | Helper/socket/keyring retrieval is a 0.1.0 residual. To block `git credential fill`, register the helper's file or socket path in global `denyRead` as a **literal, existing path** (globs are not bwrap-enforced; nonexistent paths are skipped), or accept the residual. |
| Provider and GitHub environment tokens | Healthy bwrap children receive a minimal whitelist (`PATH`, `HOME`, `TERM`, `LANG`, `LC_*`, `TMPDIR`). Degraded background/monitor spawns strip the non-configurable provider-secret floor, including `GITHUB_TOKEN`, `GH_TOKEN`, and `COPILOT_GITHUB_TOKEN`. | Add Forgejo or other deployment-specific names/patterns through global `envScrub.names` / `envScrub.patterns`. |
| Forgejo credentials | No Forgejo path or environment name is assumed by default. | Register its file locations in global `denyRead` and token variables in global `envScrub`. |

The bwrap layer is the OS-level protection for sandboxed Linux bash. The
in-process file policy provides parity for `read` even if bwrap is unavailable
and bash is fail-closed. `write` and `edit` enforce their configured write
policy; they are not a substitute for read masking.

## Required-boundary status

| # | Required boundary | Status | Enforcement |
| --- | --- | --- | --- |
| 1 | Separate PID namespace and private `/proc` | **MET** | `buildBwrapArgs`: `--unshare-pid --proc /proc` |
| 2 | Minimal child environment without tokens/sockets | **MET** | bwrap `buildMinimalEnv`; degraded spawns use the provider-secret scrub floor, including `GITHUB_TOKEN` and `GH_TOKEN` |
| 3 | Read masking for credential-bearing paths | **MET (file-backed stores); helper/socket/keyring stores are operator-registered or out of scope for 0.1.0** | bwrap deny overlays and `enforceDenyRead`; defaults include SSH/GPG/Pi/GitHub/file-backed Git stores, while operators register Forgejo and helper file/socket locations as literal paths |
| 4 | Equivalent enforcement in `read` | **MET** | `makeReadOperations` → `enforceDenyRead` |
| 5 | Same boundary for background and monitor | **MET** when Linux integration is active | `buildSandboxedSpawnArgs`, sandbox bridge handshake, and `backgroundTasks.sandboxIntegration` |
| 6 | Fail closed when the boundary cannot be established | **MET** | fail-closed state, `createFailClosedPolicy`, and degraded-spawn secret stripping |
| 7 | Writable-surface contract and pinned Git directories | **MET** | `discoverGitDirs`, session-pinned Git dirs, and additive-only `allowWrite` |
| 8 | Non-secret capability signal for a forge extension | **MET** | credential-boundary capability symbol and `/sandbox` diagnostic |

“MET” does not erase the explicitly documented residuals below. In particular,
background/monitor are not OS-sandboxed when their integration is off, the
platform is non-Linux, or pi-sandbox is fail-closed; their policy remains
confirm-or-stricter rather than silently allowing the bypass.

## Capability handshake for forge consumers

pi-sandbox publishes a same-process, non-secret capability at:

```ts
Symbol.for("@nklisch/pi-sandbox.credential-boundary-capability")
```

The value is a `CredentialBoundaryCapability`:

```ts
interface CredentialBoundaryCapability {
  active: boolean;
  failClosed: boolean;
  reason?: string;
}
```

`active:true` means only that the Linux bash/file-tool credential-isolation
boundary initialized and is not fail-closed. It is false for initialization
failure, configuration disablement, `--no-sandbox`, non-Linux graceful degrade,
and shutdown. `failClosed` distinguishes a blocked initialization failure from
an intentional or unavailable boundary; `reason` is a short state label.

For a forge-operations consumer, `active:true` is **necessary but not
sufficient** for credential loading. The consumer must read the symbol
immediately before a load, require `isCredentialBoundaryActive(handshake)` to
return true, and never cache a successful result across `/reload`; an absent,
malformed, inactive, or fail-closed capability is a refusal signal. But a true
result is only evidence that the bash/file-tool lifecycle boundary is up. It is
not permission or proof that loading any particular credential is safe.

The forge extension owns its credential-custody model and must not assume a
specific path is masked. For file-backed custody, it must use a path whose
protection was arranged independently of this capability—for example, the
operator registers the forge credential file in global `filesystem.denyRead`
as a **literal path**, confirms the file exists when the sandbox initializes,
and accepts that pi-sandbox does not attest the resulting effective mask. As an
alternative, the forge extension can keep credentials in a broker-private
channel that never enters model-observable space regardless of pi-sandbox's
state. The capability intentionally exports no effective-policy or
path-protection query; consumers must not duplicate pi-sandbox's internal
config discovery, merge, or normalization rules and call that an attestation.

On non-Linux, the necessary lifecycle signal is false because OS-level bash
isolation is not active. On Linux, a true signal still does not close the forge
extension's separate credential-custody residual.

### What `active` does not prove

Even when `active:true`, the capability does **not** prove:

- that any specific credential path is masked;
- that a `denyRead` entry registered by the operator is actually bash-masked
  (glob entries are not bwrap-enforced, and nonexistent paths are skipped);
- that RPC/API direct bash is mediated;
- that background/monitor integration is active;
- that Git credential helpers, sockets, or keyrings are blocked; or
- that the operator has not cleared the global deny list.

The payload contains neither credential paths nor secrets. `/sandbox` displays
the same lifecycle capability for operator diagnosis.

## Credential registration and configuration authority

There is no separate credential-registry configuration block. The operator
registry is the existing global configuration:

- `filesystem.denyRead` registers credential-bearing files and directories.
- `envScrub.names` and `envScrub.patterns` register credential-bearing
  environment variables.

Project-local configuration is additive-only: it can add masks/scrub targets
and otherwise tighten policy, but cannot remove an inherited protection. The
non-configurable provider-secret scrub floor is also always retained. Only the
global/operator configuration may set `bwrapPath` or `enabled:false`, because
those are trust decisions about the boundary itself. This lets an operator add
a chosen Forgejo credential store without making a checkout capable of
weakening that protection.

Global `filesystem.denyRead` has an intentionally narrow but potentially
surprising merge rule in 0.1.0:

- a non-empty global list is unioned with the defaults, so it can add entries
  but cannot selectively remove a default;
- an explicit empty global list (`"denyRead": []`) clears every default; this is
  the only current escape; and
- there is no single global-list expression that removes one default while
  retaining the others. To read one default-denied path, an operator must clear
  the defaults globally and explicitly re-add every protection they want in
  each project's additive `filesystem.denyRead` list. Leaving those entries out
  of project config leaves them unprotected.

The complete 0.1.0 default list, suitable for copying and removing only the path
that a particular project must read, is:

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

This all-or-nothing global escape is a 0.1.0 configuration limitation, not a
selective override. User Git config remains readable by default because masking
it breaks ordinary Git config reads; it is not a safe helper mitigation. To
block `git credential fill`, an operator must register the relevant helper file
or socket in global `denyRead` as a literal path that exists when the sandbox
initializes, or accept the residual. Credential retrieval from libsecret,
Keychain, Git Credential Manager, or another keyring remains outside the 0.1.0
boundary.

## Scope boundary

pi-sandbox is a credential/process membrane, not a forge client. It does not
implement forge-specific operations, Git credential helpers, privileged Git
runners, or provider-specific remote-operation/authentication policy. A
separate trusted forge-operations extension may use the capability handshake to
gate its own credential loading, but it owns its credentials, API behavior, and
remote-operation policy.

## Buy-versus-build decision

**Decision (2026-07-11): retain the first-party bwrap backend for 0.1.0.** The
comparison is against `@anthropic-ai/sandbox-runtime` (srt) **v0.0.26**, which
Pi's official example pins. This is a dated decision, not a permanent claim.

### srt: not adopted for 0.1.0

srt offers Linux bwrap/network namespaces, macOS seatbelt, proxy-based `filter`
networking, a credentials config shape, PID isolation, and a command-wrapping
API. Those are useful surfaces, but a port would lose or require reimplementing
Pi-specific protections that this package already has:

1. fail-closed initialization rather than the official example's fail-open
   fallback;
2. in-process `read`/`write`/`edit` policy parity, not bash-only isolation;
3. additive-only project configuration rather than a weakening deep merge;
4. hardlink-alias guards for denied files at both startup and in-process
   file-operation time, plus fd-bound `O_NOFOLLOW` inode revalidation (srt Issue
   #149 documents a writable-tmpfs deny-read weakness);
5. trusted `bwrap` resolution from fixed system paths plus `realpath`, never a
   hostile `PATH`; and
6. an argv-plus-environment, fail-closed background/monitor spawn contract,
   rather than a command string.

srt's proxy `filter` mode and macOS seatbelt backend are not required for this
narrow Linux-first boundary. `filter` remains deferred and tracked; non-Linux
is explicitly a graceful degrade. srt is a 0.0.x research preview and shares a
relevant limitation: its `--proc /proc` path fails under default container
seccomp (Issue #214), as pi-sandbox's equivalent bwrap use can too.

### Gondolin and OpenShell: posture references, not backends

**Gondolin** is a full local Linux micro-VM with userspace networking and
secret injection without delivery. Nested inside the operator VM, it is a
redundant VM boundary and its strengths are orthogonal to pi-sandbox's narrow
same-user credential membrane.

**OpenShell** is a whole-agent governance platform that runs an agent in a
managed sandbox/pod with declarative policy across multiple layers. Pi would
run inside OpenShell; it is not an inner membrane that pi-sandbox can adopt.

No pluggable backend interface is introduced for 0.1.0: it would be speculative
surface contrary to the small, reusable membrane boundary.

### Revisit triggers

Reassess the decision if any of these occur:

- srt reaches stable 1.x and closes Issue #214 (proc in containers) and Issue
  #149 (deny-read/tmpfs writable behavior);
- srt provides additive-only merging, in-process file-tool hooks, fail-closed
  initialization, and a background/monitor spawn contract, or Pi core exposes
  hooks that supply those missing pieces; or
- a product requirement for macOS seatbelt bash isolation or proxy-based
  `filter` egress justifies the port cost.

## General-controls triage

| Control | Classification | Reason |
| --- | --- | --- |
| Tool-egress policy | **Core** | Reduces credential exfiltration through subagents, web/search, and other tools; required for in-process boundary parity. |
| Writable-surface policy | **Core** | Defines the required writable surface and protects the pinned Git-directory contract. |
| Secret-shape inspector | **Optional defense in depth** | Opt-in detection of secrets already present in tool input; useful, but not the credential-isolation boundary. It may be split later. |
| Network `filter` mode | **Deferred and tracked** | Kept as a recognized fail-closed mode; real proxy filtering needs separate topology and proof. |

## Release scope (0.1.0)

This is the single source of truth for the 0.1.0 package promise.

### What 0.1.0 claims

- On Linux, mediated LLM/tool `bash` and interactive `user_bash` use the
  first-party bwrap backend after successful initialization.
- Sandboxed bash has a fresh PID namespace, private `/proc`, and minimal child
  environment without provider or forge tokens.
- In-process `read`/`write`/`edit` apply `denyRead`/`denyWrite`/`allowWrite`,
  then open with `O_NOFOLLOW`, validate the opened inode/link count, and perform
  I/O through that descriptor. This closes leaf-symlink swaps and post-start
  hardlink aliases, including when bash is fail-closed or OS sandboxing is
  unavailable.
- Tool-egress allow/auto/confirm/block policy applies to built-in and
  extension-registered tools; the optional inspector scans tool input.
- Boundary-establishment failures fail closed; `filter` is recognized but
  fails closed rather than becoming open networking.
- On non-Linux, bash gracefully degrades to unsandboxed execution while
  in-process file, tool-egress, and inspector policy remains active.
- On Linux, `background`/`monitor` use the same bwrap helper and minimal
  environment when the background-tasks integration is active; that spawn
  contract is fail closed when it cannot establish the boundary.
- The writable surface includes session-pinned Git directory discovery for
  submodules and linked worktrees.
- A non-secret credential-boundary capability is available for a separate
  forge extension; configuration remains additive-only, with global/operator
  authority for `bwrapPath` and `enabled:false`.
- Network modes are `open` (default) and `block`.

### Known 0.1.0 gaps

- Pi RPC/API direct `bash` bypasses this extension's mediated bash path.
- The inspector scans input, not output. In particular, `jobs action=tail` can
  return a secret a background command wrote to its buffer without redaction.
- `--no-sandbox` does not yet propagate to background/monitor integration.
- Git credential helpers, cache sockets, and keyring/keychain stores are not
  comprehensively blocked. `HOME` and user Git config are preserved, so
  `git credential fill` can retrieve plaintext through a configured helper.
  Masking user Git config is not a safe mitigation because it breaks ordinary
  Git config reads. Operators who want to block helper retrieval must register
  the helper's file or socket path as a literal, existing global `denyRead`
  entry (globs are not bwrap-enforced; nonexistent paths are skipped), or accept
  this residual.
- On non-Linux, bash is unsandboxed; the outer VM and in-process policy are the
  remaining protections.
- `filter` is deferred and fail closed.
- `--proc /proc` can fail under default container seccomp; the operator VM
  must resolve that environment-level limitation.

### Post-0.1.0 / v1 path

The following direction is tracked work, **not a commitment**: a real `filter`
mode (`idea-pi-sandbox-filter-tcp-proxy`); shared output redaction for
background/monitor/jobs; `--no-sandbox` propagation; a Pi-core RPC/API bash
interception hook; and a separate forge-operations
plugin using the capability contract. srt adoption is reconsidered only under
the revisit triggers above.

Version 1.0.0 is a maturity claim, not a feature target: it means the boundary
has been proven in production use across operator deployments, documented gaps
are closed or accepted with rationale, and the stated promise matches behavior
without known security regressions.

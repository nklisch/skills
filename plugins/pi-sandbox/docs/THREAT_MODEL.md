# Threat model

This document is the security posture and release-scope statement for
`@nklisch/pi-sandbox` 0.1.0. It describes the package as it is, not as a
promise of a general-purpose sandbox. A reviewer or release gate should use
[Release scope (0.1.0)](#release-scope-010) as the canonical version-promise
statement.

## Two boundaries

pi-sandbox assumes an **outer host-isolation boundary** already exists — a VM,
a container, a dedicated host, a separate OS account, or whatever else the
operator chose to own host isolation and broad damage containment. The package
neither provides nor claims to be that outer boundary.

Within that outer boundary, pi-sandbox provides an **inner same-user
credential-isolation boundary** for mediated Linux bash: bwrap supplies a fresh
PID namespace, private `/proc`, read masks, and a minimal child environment. The
package also applies configured read policy to Pi's `read` tool and supplies the
same bwrap spawn contract to background/monitor when their integration is
active. The in-process file policy is defense in depth, not a concurrency-hard
boundary against a same-user process running arbitrary code.

This is deliberately narrower than complete session isolation. The scope was
chosen for deployments where the outer boundary already does the
host-isolation work, so the inner membrane's job is only to keep credentials
held by Pi's trusted control plane unavailable to model-run commands and file
tools running as the same Unix user. Trusted Pi extensions/packages still run
with the user's normal permissions; direct RPC/API bash is not mediated by the
extension; **macOS is a supported graceful-degrade platform (no OS bash sandbox,
in-process policy active) but Windows is out of scope for 0.1.0** because its
`\`-separated paths break the glob matcher's segment-local `*`/`?` semantics
(see Release scope); and a concurrent hardlink +
deny-path race remains for in-process file tools. Those limits are release-scope
gaps, not exceptions to the model.

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
| Provider and GitHub environment tokens | Healthy bwrap children receive a minimal whitelist (`PATH`, `HOME`, `TERM`, `LANG`, `TMPDIR`, and `LC_*` locale vars) and then apply `envScrub`, so operator-registered names/patterns are removed on the healthy path as well as the degraded path; degraded background/monitor spawns additionally strip the non-configurable provider-secret floor, including `GITHUB_TOKEN`, `GH_TOKEN`, and `COPILOT_GITHUB_TOKEN`. | Add Forgejo or other deployment-specific names/patterns through global `envScrub.names` / `envScrub.patterns`. |
| Forgejo credentials | No Forgejo path or environment name is assumed by default. | Register its file locations in global `denyRead` and token variables in global `envScrub`. |

The bwrap layer is the primary OS-level protection for sandboxed Linux bash.
The in-process file policy provides defense-in-depth parity for `read` even if
bwrap is unavailable and bash is fail-closed. `write` and `edit` enforce their
configured write policy; they are not a substitute for read masking or a
concurrency-hard same-user boundary.

## Required-boundary status

| # | Required boundary | Status | Enforcement |
| --- | --- | --- | --- |
| 1 | Separate PID namespace and private `/proc` | **MET** | `buildBwrapArgs`: `--unshare-pid --proc /proc` |
| 2 | Minimal child environment without tokens/sockets | **MET** | bwrap `buildMinimalEnv`; degraded spawns use the provider-secret scrub floor, including `GITHUB_TOKEN` and `GH_TOKEN` |
| 3 | Read masking for credential-bearing paths | **MET (file-backed stores); helper/socket/keyring stores are operator-registered or out of scope for 0.1.0** | bwrap deny overlays and `enforceDenyRead`; defaults include SSH/GPG/Pi/GitHub/file-backed Git stores, while operators register Forgejo and helper file/socket locations as literal paths |
| 4 | Equivalent enforcement in `read` | **MET for non-concurrent policy checks; defense in depth for same-user races** | `makeReadOperations` → `enforceDenyRead` plus fd-bound I/O; see the concurrent hardlink residual |
| 5 | Same boundary for background and monitor | **MET** when Linux integration is active | `buildSandboxedSpawnArgs`, sandbox bridge handshake, and `backgroundTasks.sandboxIntegration` |
| 6 | Fail closed when the boundary cannot be established | **MET** | fail-closed state, `createFailClosedPolicy`, and degraded-spawn secret stripping |
| 7 | Writable-surface contract and pinned Git directories | **MET with secure default and trusted opt-in** | `discoverGitDirs`, session-pinned Git dirs, global-only `filesystem.allowGitDirDiscovery`, and additive-only `allowWrite` |
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
  environment variables. Scrubs apply to both healthy bwrap bash children and
  degraded background/monitor children; names and case-insensitive patterns
  always win over `envScrub.keep`.

Project-local configuration is additive-only: it can add masks/scrub targets
and otherwise tighten policy, but cannot remove an inherited protection. The
non-configurable provider-secret scrub floor is also always retained. Only the
global/operator configuration may set `bwrapPath`, `enabled:false`, or
`filesystem.allowGitDirDiscovery`, because these are trust decisions about the
boundary itself. This lets an operator add a chosen Forgejo credential store
without making a checkout capable of weakening that protection.

Gitfile discovery is disabled by default. Operators who use submodules or
linked worktrees may set `filesystem.allowGitDirDiscovery: true` in global
configuration only; project-local config cannot enable discovery and such
attempts are rejected with a warning. With the secure default, no external
gitfile target is added to the writable surface; an ordinary `.git` directory
under an `allowWrite` root remains writable through the root bind. An operator
**MUST set `true` only for a trusted repository**: when enabled, a gitfile at
session start can point at an arbitrary external host Git directory with a
regular `HEAD`, and that directory is pinned writable. The `HEAD` check rejects
non-Git paths such as `/etc`, but cannot tell a Git-created linked-worktree
target from an attacker-selected Git directory.

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
narrow Linux-first boundary. `filter` remains deferred and tracked; macOS is
explicitly a graceful degrade (Windows is out of scope for 0.1.0). srt is a 0.0.x research preview and shares a
relevant limitation: its `--proc /proc` path fails under default container
seccomp (Issue #214), as pi-sandbox's equivalent bwrap use can too.

### Gondolin and OpenShell: posture references, not backends

**Gondolin** is a full local Linux micro-VM with userspace networking and
secret injection without delivery. Nested inside an operator's existing outer
boundary, it is a redundant VM boundary and its strengths are orthogonal to
pi-sandbox's narrow same-user credential membrane.

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
| In-process file policy | **Defense in depth** | FD-bound I/O closes the TOCTOU leaf-symlink swap and detects ordinary post-start hardlink aliases, but is not concurrency-hard against same-user arbitrary code. bwrap is the stronger boundary (blocks network, most paths, process inspection) but is also not concurrency-hard against the hardlink race — see the residual below. |
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
  I/O through that descriptor. This closes the TOCTOU leaf-symlink swap and the
  nlink guard catches non-concurrent post-start hardlink aliases, including
  when bash is fail-closed or OS sandboxing is unavailable. It intentionally
  rejects leaf symlinks even when their targets are allowed; symlinked parent
  directories remain supported.
- Tool-egress allow/auto/confirm/block policy applies to built-in and
  extension-registered tools; the optional inspector scans tool input.
- Boundary-establishment failures fail closed; `filter` is recognized but
  fails closed rather than becoming open networking.
- On macOS, bash gracefully degrades to unsandboxed execution while
  in-process file, tool-egress, and inspector policy remains active. Windows is
  out of scope for 0.1.0 (see Known 0.1.0 gaps).
- On Linux, `background`/`monitor` use the same bwrap helper and minimal
  environment when the background-tasks integration is active; that spawn
  contract is fail closed when it cannot establish the boundary.
- The writable surface excludes external Git-directory discovery by default.
  Operators using trusted submodules or linked worktrees can globally opt in
  with `filesystem.allowGitDirDiscovery:true`.
- A non-secret credential-boundary capability is available for a separate
  forge extension; configuration remains additive-only, with global/operator
  authority for `bwrapPath`, `enabled:false`, and `filesystem.allowGitDirDiscovery`.
- Network modes are `open` (default) and `block`.

### Known 0.1.0 gaps

- `filesystem.tmpBackend` defaults to `session-disk`: sandboxed temp files land on a disk-backed per-project dir (`~/.cache/pi-sandbox/tmp/<cwd-hash>/`) rather than the host `/tmp` tmpfs. Open mode no longer *writable-binds* host `/tmp` through (host `/tmp` stays readable via the root bind; the narrowing is write-only, not read/socket isolation); block mode keeps the `/tmp` tmpfs mask for IPC isolation while `TMPDIR` points at the disk dir. The dir is never swept (no cleanup): *directory count* is bounded by project count, but *bytes* are not — a long-running daemon-style session can fill the volume; rely on OS cache hygiene (`systemd-tmpfiles`/cron) or disk quota if unbounded growth is a concern. **The extension does not runtime-validate that the cache root is on a disk-backed filesystem** — the operator asserts `XDG_CACHE_HOME` and verifies it (e.g. `findmnt`); if the cache root is accidentally on tmpfs, the feature is silently defeated (temp quietly returns to RAM and the OOM pressure this feature exists to prevent returns, with no signal from the extension). This is an outer-boundary responsibility per "Two boundaries" (the package assumes an outer host-isolation boundary already exists); runtime validation of the cache root's backing store is deferred. A relative or empty `XDG_CACHE_HOME` fails closed. `tmpBackend` is global/operator-only: a project-local value is ignored with a warning (additive policy can tighten, not switch backends).

- Pi RPC/API direct `bash` bypasses this extension's mediated bash path.
- The inspector scans input, not output. In particular, `jobs action=tail` can
  return a secret a background command wrote to its buffer without redaction.
- The inspector's secret-pattern coverage is **config-driven, not built-in** —
  the package ships no default secret shapes; every pattern lives in the
  operator's `tools.inspector.secrets` config. Coverage is therefore only as
  current as that config. Provider key formats drift (e.g. OpenAI's `sk-proj-`,
  `sk-svcacct-`, `sk-admin-` prefixes introduced a hyphen the original
  `sk-[A-Za-z0-9]{40,180}` class did not include), and a stale pattern silently
  lets the modern format egress unredacted. Operators must keep secret shapes
  current with provider key formats; the character class must include `-` when
  a prefix contains it.
- `--no-sandbox` does not yet propagate to background/monitor integration.
- **Concurrent hardlink + deny-path race (spans both boundaries):** both the in-process file tools and the bwrap path guard against hardlink aliases via a mutable-pathname `assertNoHardlinkedDeniedFiles` rescan, but neither is **concurrency-hard** against a same-user attacker running arbitrary code. The in-process guard runs at file-operation time; the bwrap guard runs once per command at argv-build time. In both cases a determined attacker can move a denied pathname aside while the rescan observes `ENOENT`, leaving an opened fd (in-process) or a writable bind (bwrap) on the credential inode through a hardlink alias. bwrap is the stronger boundary — it blocks network, most filesystem paths, and process inspection — but it is not a concurrency-hard boundary against this race. The full inode-identity redesign (capture denied inodes at policy-install time; check opened fds and bwrap binds against that captured set) is tracked as `story-pi-sandbox-inode-identity-redesign` post-0.1.0.
- **Parent-directory symlink TOCTOU in in-process file tools (same class as above):** `O_NOFOLLOW` only guards the *leaf* path component, so a parent-directory symlink swapped between the policy check and `openSync()`/`mkdir()` can redirect the operation while still passing the leaf inode recheck. The existing fd revalidation catches the simple distinct-inode swap, but four independently-sampled pathname states leave real escape windows: (a) the `mkdir` path has no fd binding at all; (b) for new-file creates `expected` is `undefined` so the `sameInode` check is skipped, and `O_CREAT` creates the denied file before revalidation; (c) the post-open policy checks run against the lexical path, not the resolved path. This is the same concurrency-hard, same-user class as the hardlink race — the in-process file policy is defense-in-depth, not a concurrency-hard boundary. bwrap remains the stronger OS-level boundary for credential paths. The correct fix is fd-relative directory traversal (`openat`/`mkdirat` with a pinned directory fd), which Node's `fs` does not expose; it is tracked post-0.1.0 alongside the inode-identity redesign.
- Git credential helpers, cache sockets, and keyring/keychain stores are not
  comprehensively blocked. `HOME` and user Git config are preserved, so
  `git credential fill` can retrieve plaintext through a configured helper.
  Masking user Git config is not a safe mitigation because it breaks ordinary
  Git config reads. Operators who want to block helper retrieval must register
  the helper's file or socket path as a literal, existing global `denyRead`
  entry (globs are not bwrap-enforced; nonexistent paths are skipped), or accept
  this residual.
- On macOS, bash is unsandboxed; the outer boundary and in-process policy
  are the remaining protections. Windows is out of scope for 0.1.0: the
  in-process file-tool glob matcher (`globCharsToRegex` in `sandbox-bwrap.ts`,
  consumed by `matchesDenyList`/`isWithinAllowWrite` in `sandbox-file-policy.ts`)
  compiles `*`→`[^/]*` and `?`→`[^/]`, treating `/` as the only path separator.
  On Windows, `normalizeConfiguredPath` produces `\`-separated paths via Node's
  `resolve()`, so `*` is no longer segment-local and `allowWrite`/`denyRead`/`denyWrite`
  globs can match across directory boundaries and mis-enforce sandbox policy.
  Because the package would otherwise claim the in-process policy "remains active"
  on Windows, 0.1.0 removes Windows from its release claim rather than ship a
  half-validated separator handling. The fix is separator-aware matching or
  normalizing both sides to `/` first; tracked as
  `idea-pi-sandbox-windows-path-separator` post-0.1.0.
- `filter` is deferred and fail closed.
- `--proc /proc` can fail under default container seccomp; the operator's
  outer boundary/environment must resolve that limitation.

### Post-0.1.0 / v1 path

The following direction is tracked work, **not a commitment**: a real `filter`
mode (`idea-pi-sandbox-filter-tcp-proxy`); an operator-registered external
Git-directory allowlist for trusted opt-in workflows; the inode-identity
redesign (`story-pi-sandbox-inode-identity-redesign`) that closes the concurrent
hardlink + deny-path race; shared output redaction for background/monitor/jobs;
`--no-sandbox` propagation; a Pi-core RPC/API bash interception hook; a
separate forge-operations plugin using the capability contract; and Windows
support via a separator-aware (or pre-normalized) glob matcher
(`idea-pi-sandbox-windows-path-separator`). srt adoption is reconsidered only under the
revisit triggers above.

Version 1.0.0 is a maturity claim, not a feature target: it means the boundary
has been proven in production use across operator deployments, documented gaps
are closed or accepted with rationale, and the stated promise matches behavior
without known security regressions.

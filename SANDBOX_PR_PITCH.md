# First-party Linux bwrap sandbox (`@nklisch/pi-sandbox`) + background/monitor sandbox integration

> **Draft PR** — pitching this design to the maintainer before polish. The
> packages are reviewed end-to-end as a single security surface and tracked to
> `stage: done` in the repo's agile-workflow substrate. Seeking feedback on the
> approach, the two-boundary threat model, the cross-platform graceful-degrade
> decision, and the two cross-extension handshake contracts.

## What this adds

Two Pi-only packages, reviewed end-to-end as one security surface.

### 1. `plugins/pi-sandbox/` — `@nklisch/pi-sandbox` v0.1.0

A first-party **credential-isolation membrane** for pi. It draws on the shape of
pi's MIT-licensed `examples/extensions/sandbox/` example but vendors an original
bwrap argument builder. v0.1.0 is scoped to a narrow, documented boundary.

**Two-boundary posture.** pi-sandbox assumes an operator-provided **outer**
host-isolation boundary already exists (a VM, a container, a dedicated host, a
separate OS account — whatever the operator chose) and provides only the
**inner** Linux bwrap same-user credential-isolation membrane: it keeps
credentials held by Pi's trusted control plane unavailable to model-controlled
commands and file tools running as the same Unix user. It is explicitly not a
full trust boundary and not concurrency-hard against a same-user adversary —
see residuals below. The full threat model, controls triage, and 0.1.0 release
scope live in `plugins/pi-sandbox/docs/THREAT_MODEL.md`.

Hard core shipped in v0.1.0:

- **Sandboxed `bash` tool + interactive `user_bash` (`!`/`!!`)** via a first-party
  `buildBwrapArgs()`: read-only host view, fresh PID namespace + private `/proc`,
  writable allow-mounts, read-only deny overlays, deny-read masking
  (`tmpfs`/`/dev/null`), `--die-with-parent`, and `--clearenv` + a minimal env
  allowlist so provider/auth/forge secrets never reach the child.
- **Network modes `open` + `block`** (`block` adds `--unshare-net`). **`filter`
  is deferred and fails closed** — it never silently loosens to `open`.
- **In-process `read`/`write`/`edit` policy** (`denyRead`/`denyWrite`/`allowWrite`)
  independent of bwrap — holds even on init failure. Now **fd-bound**:
  `O_NOFOLLOW` open → inode/link-count revalidation → I/O through the descriptor,
  closing the TOCTOU leaf-symlink swap and catching non-concurrent post-start
  hardlink aliases. **Behavior change:** legitimate leaf symlinks are now
  rejected even when their target is inside `allowWrite` (operators resolve the
  symlink / use the target path).
- **Tool-egress policy** (`allow`/`auto`/`confirm`/`block`) with a secret
  inspector hardened against ReDoS (safe-regex analyzer at config-load + 10K
  input cap), a low-entropy-but-long secret gate, and documented bare-token gap.
- **Credential-boundary capability handshake** — a non-secret
  `Symbol.for("@nklisch/pi-sandbox.credential-boundary-capability")` payload
  (`{active, failClosed, reason?}` — path- and secret-free) published at every
  state transition, for a separate forge-operations extension to require before
  loading file-backed credentials. `active:true` is a *necessary, not
  sufficient* liveness signal; the consumer owns credential custody.
- **Auto-discovered Git directories** for submodules/linked worktrees —
  session-pinned (computed once at `session_start`, never re-read per command),
  `HEAD`-validated, off by default (`filesystem.allowGitDirDiscovery:false`).
- **Graceful degrade on macOS/Windows** — non-Linux hosts get unsandboxed bash
  but keep in-process file-tool + tool-egress + secret-inspector policy active
  (a third state, distinct from fail-closed and operator-bypass).
- **Fail-closed** on every error path (missing `bwrap`, invalid config, `filter`
  mode, spawn error). `--no-sandbox` / `enabled:false` are the only intentional
  operator bypasses.
- **Additive-only config** — project-local can only tighten; `bwrapPath`,
  `enabled:false`, and `allowGitDirDiscovery` are global/operator-only.

The first-party bwrap backend is retained for v0.1.0 rather than porting to
`@anthropic-ai/sandbox-runtime` (srt), Gondolin, or OpenShell. That assessment
is dated and recorded in the threat model and the research substrate
(`.research/analysis/campaigns/sandboxed-git-auth-patterns/`) — it's out of
scope to reproduce here; the short version is that the existing implementation
already meets the required boundary and carries Pi-specific guards a port would
regress. srt's proxy `filter` mode and macOS seatbelt backend are the deferred
advantages of a future port.

### 2. `plugins/background-tasks/` — `@nklisch/pi-background-tasks` v0.2.0 (updated)

The existing `background` and `monitor` tools spawn their commands outside pi's
`bash` tool, so a sandbox on `bash` alone wouldn't cover them. This routes both
through the pi-sandbox bwrap backend:

- **Optional peer dep** on `@nklisch/pi-sandbox` + guarded dynamic `import()` —
  degrades cleanly to current behavior when pi-sandbox is absent.
- **`sandboxIntegration: "auto" | "off"`** config flag (in the pi-sandbox
  config), default `auto`, fail-closed when the sandbox is on but bwrap spawn
  throws. Additive-only (project can't loosen `auto`→`off`).
- **Kill-lifecycle proven** — `process.kill(-pgid)` + `--die-with-parent`
  reliably terminate the wrapped command on cancel/timeout/shutdown (verified
  by a marker test that loops to defeat flakiness).
- **Versioned runtime handshake** — pi-sandbox only relaxes the
  `background`/`monitor` bypass policy to `allow` when the loaded
  background-tasks extension provably publishes its integrated state over a
  shared `Symbol.for("@nklisch/pi-sandbox.background-tasks-integration")` key.
  No version-skew fail-open: absent/old/broken background-tasks → stays
  `confirm`/fail-closed. (A helper-version check was intentionally skipped for v1;
  the exported function probe pins the contract.)
- **Trusted cwd separation** — the session/project cwd (trusted) drives config
  loading and relative `allowWrite`/`denyRead`/`denyWrite` resolution; the
  per-call `params.cwd` (model-controlled) is only the command's `--chdir`. This
  prevents `cwd:"/"` from widening the writable surface. `satisfy_on` and other
  user-supplied fields are scrubbed from trusted `deliverAs:"steer"` wake
  messages.

## Cross-platform posture (pitch for feedback)

Real OS-level bash sandboxing is **Linux-only**. On macOS/Windows the plugin
graceful-degrades (unsandboxed bash, in-process file/tool/inspector policy still
active) rather than fail-closing — so it doesn't brick bash for contributors on
other platforms. A native macOS `sandbox-exec` backend and a Windows backend are
deferred future work. Non-Linux forge consumers reading the credential-boundary
capability see `active:false` and must refuse to load file-backed credentials —
the outer boundary is then the only one, which is forge's decision to accept,
not pi-sandbox's.

## Honest non-goals / known 0.1.0 residuals

The consolidated release claim lives in
[`docs/THREAT_MODEL.md` → Release scope (0.1.0)](plugins/pi-sandbox/docs/THREAT_MODEL.md).
Headline residuals a reviewer should know about:

- Pi extensions/packages run with full user permissions and are **not** OS-sandboxed
  by this plugin.
- **Not concurrency-hard against a same-user adversary.** The concurrent
  hardlink + deny-path race spans *both* the in-process tools and bwrap: a
  determined attacker running arbitrary code can move a denied pathname aside
  while the guard rescans, leaving an open fd or writable bind on the credential
  inode through a hardlink alias. bwrap is the stronger boundary (blocks network,
  most paths, process inspection) but is not concurrency-hard against this race.
  The full inode-identity redesign is tracked post-0.1.0 as
  `story-pi-sandbox-inode-identity-redesign`. The in-process tools and bwrap
  guard both run only at file-op / argv-build time.
- **RPC/API direct `bash`** is a known residual bypass — pi core's RPC `bash`
  calls `executeBash()` directly with no extension hook (verified against pi
  core source), so this plugin cannot mediate it. Documented in the README and
  `/sandbox` diagnostic.
- **Git credential helpers / cache sockets / keyrings** are a 0.1.0 residual.
  `HOME` and user Git config are deliberately preserved (masking `~/.gitconfig`
  breaks `git` with exit 128), so `git credential fill` can still retrieve
  plaintext through a configured helper, libsecret, macOS Keychain, etc. Operators
  who want to block helper retrieval register the helper's literal path in global
  `denyRead` (globs aren't bwrap-enforced; nonexistent paths are skipped), or
  accept the residual.
- **`jobs action=tail` output is not redacted** — the inspector scans tool
  *input*, not output; a secret a background command wrote to its buffer can be
  returned.
- **`--no-sandbox` does not yet propagate** to the background/monitor
  integration (tracked as a v0.1.x follow-up — currently stricter-than-intended,
  not weaker).
- **`filter` (allowlist networking) is deferred and fails closed.**
- Other pi tool surfaces — web search, subagents, provider requests — are not
  OS-sandboxed command surfaces and are governed only by the in-process
  tool-egress policy, not bwrap.

## Verification

- **318 tests** across both plugins (241 pi-sandbox + 77 background-tasks):
  pure unit + real bwrap integration (env scrub, `/proc` isolation, block-mode
  network denial, deny-mount ordering incl. nested denyRead/denyWrite, `.git`
  masking without `ENOTDIR`, symlink-to-denied, kill-lifecycle, PATH-poisoning
  bypass defeated, secret-env omission, monitor per-poll timeout, git-dir
  auto-discovery + mutable-gitfile-escape regression, fd-based TOCTOU closure,
  inspector ReDoS/entropy, both handshake publish/read contracts, capability
  lifecycle across all 10 state transitions).
- **Multiple deep review rounds, including a 6-lane release-gate adversarial
  review** that found 4 verified-reproducible credential bypass blockers (R1
  `.git` gitfile allowWrite escape, R2 `envScrub` not applying to healthy bash,
  R3 TOCTOU symlink-swap, R4 post-start hardlink alias) + 5 important findings.
  All four blockers were fixed and re-reviewed across three fresh-context
  convergence passes — the loop stopped when findings shifted from real bypasses
  to documentation-scope honesty. Review details are in the substrate
  feature/story bodies; the review model class (`openai-codex/gpt-5.6-sol`) is
  different from the umans orchestrator, satisfying the cross-model advisory
  requirement.
- Clean `pi install` verified for both packages.

## Provenance

The extension shape (config load, additive-only project merge, hardened
`read`/`write`/`edit` overrides, the `--no-sandbox` flag) follows pi's
MIT-licensed `examples/extensions/sandbox/` example. The first-party `bwrap`
argument builder, config boundary contract, in-process file-tool policy,
bypass-tool mitigation, secret inspector, git-dir discovery, both cross-extension
handshakes, and the background-tasks integration are original MIT-licensed code
in this repository.

## Deferred / future work (backlog items in the repo)

- `idea-pi-sandbox-filter-tcp-proxy.md` — `filter` allowlist networking.
- `idea-pi-sandbox-allowwrite-canonical-narrowing.md` — canonical (not
  exact-string) `allowWrite` narrowing.
- `idea-bgtasks-sandbox-handshake-cross-pkg-test.md` — cross-package publish→read
  integration test for the background-tasks handshake.
- `idea-cross-extension-capability-handshake-pattern.md` — document the
  `Symbol.for` handshake as a named repo pattern (now used by **two** handshakes).
- `story-pi-sandbox-inode-identity-redesign.md` — concurrency-hard denied-inode
  identity (the main post-0.1.0 security redesign).
- `feature-pi-sandbox-env-add-config.md` — config-driven `envAdd` for sandboxed
  bash (**currently `stage: drafting`**; subprocess-only, global/operator trust,
  `minimal → add → scrub` order).
- macOS `sandbox-exec` / Windows native backends.

## Substrate

Tracked in `.work/active/features/` across six features (five `done`, one
`drafting`) with 39 child stories in `.work/active/stories/`:

- `feature-sandbox-first-party-bwrap.md` (done)
- `feature-background-tasks-sandbox-integration.md` (done)
- `feature-pi-sandbox-credential-isolation-boundary.md` (done)
- `feature-pi-sandbox-gitdir-writable-surface.md` (done)
- `feature-pi-sandbox-inspector-hardening.md` (done)
- `feature-pi-sandbox-env-add-config.md` (drafting)

The work-tracking substrate is part of this repo's `agile-workflow` plugin and is
included for traceability; the deliverable is the two `plugins/` packages.

---

Reviewing maintainers: the substantive surface is `plugins/pi-sandbox/extensions/`
and `plugins/background-tasks/extensions/`, with
`plugins/pi-sandbox/docs/THREAT_MODEL.md` as the canonical boundary/release-scope
document (and the research substrate for the backend decision). Particularly
interested in feedback on (1) the two-boundary threat model and the
secure-by-default `allowGitDirDiscovery:false` posture, (2) the two `Symbol.for`
cross-extension handshakes (background-tasks integration vs. credential-boundary
capability) and whether they should converge, (3) whether `filter` mode should be
prioritized.

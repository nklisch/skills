---
id: feature-pi-sandbox-disk-backed-tmp
kind: feature
stage: done
tags: [sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-13
updated: 2026-07-14
---

# Disk-backed session temp for sandboxed sessions

## Brief

Sandboxed sessions currently put temp files on the host `/tmp` tmpfs (5.9G,
RAM-backed), which is consuming memory and causing OOM crashes on this VM.
The root has two layers: the default config lists `/tmp` in `allowWrite`
(`sandbox-config.ts`), so `buildBwrapArgs` emits `--bind /tmp /tmp` in the
default `network.mode: "open"` path — binding the host tmpfs straight through
into every sandboxed child; and the minimal-env allowlist copies the host
`TMPDIR` into the child (unset here, so children default to `/tmp`). Block
mode already masks `/tmp` with `--tmpfs`, but that is also RAM-backed, so it
does not help the memory pressure either.

The VM's `/` is an LVM ext4 volume with 26G free — plenty of real disk. The
goal is to redirect sandboxed children's `TMPDIR` to a **disk-backed
per-project temp dir**, bind *that* dir (not host `/tmp`) into the sandbox,
with no cleanup. This both removes the RAM pressure and
narrows the writable surface (children see only their project's temp, not
the host's accumulated orphaned SQLite sidecars, ssh-agent sockets, etc.).

**Per-project, not per-session.** The temp dir is keyed by the canonical
session cwd (the project directory): all pi processes running in the same
project share one temp dir under `~/.cache/pi-sandbox/tmp/<cwd-hash>/`. This
fits the operator's multi-project workflow (1–4 pi instances, usually in
distinct projects) — dir count is bounded by the number of active projects,
not the number of pi processes, and the dir is stable across session
restarts within a project. Concurrent sessions in the same project write to
the same temp dir (no isolation between them) — acceptable because sessions
in the same project are already cooperating peers on the agent mesh.
No cleanup — the dir persists and stays warm across sessions (see Risks).

**Naming note.** The config enum is `tmpBackend: "session-disk"` (the
*backend* name — disk vs host-tmpfs) while the dir scope is per-project.
This is deliberate: the enum names the storage backend, not the dir's
sharing scope, and is now a shipped config contract. Do not "fix" the
mismatch by renaming the enum. The schema comment in Unit 1 documents the
scope; this note exists so a future reader doesn't rename-and-break.

## Strategic decisions

- **Default to disk.** `filesystem.tmpBackend` defaults to `"session-disk"`
  (not `"host-tmpfs"`). The sandbox extension has not yet merged to `main`
  and the operator is the only user, so changing the default carries no
  compatibility cost and delivers the memory win out of the box. `"host-tmpfs"`
  is retained as an explicit opt-out for the current behavior.
- **Per-project (cwd-keyed) dir, no cleanup.** The temp dir is derived
  from a stable hash of the canonical session cwd
  (`~/.cache/pi-sandbox/tmp/<cwd-hash>/`), shared across all pi processes in
  the same project. Computed once at `session_start` and pinned on the policy
  (mirroring the pinned-git-dirs trusted-init-state pattern). No cleanup —
  the dir persists and stays warm across sessions; if disk growth ever
  matters, OS tooling handles cache-dir hygiene generically. Confirmed
  shape with the operator.
- **Block-mode shape: keep `/tmp` masked, redirect `TMPDIR` to the disk dir.**
  Block mode currently forces `TMPDIR=/tmp` and masks `/tmp` with tmpfs to
  block host Unix sockets. With `session-disk`, block mode keeps the `/tmp`
  (and `/run`, `/var/run`, `/var/tmp`, `/tmp/.X11-unix`) tmpfs masks so a
  blocked child still cannot reach host IPC, but sets `TMPDIR=<projectTmpDir>`
  and binds that disk dir writable so temp writes land on disk, not the
  masked tmpfs. This is a behavior change for block mode (temp currently
  goes to the masked tmpfs; it would go to disk) — exactly what the operator
  wants for memory, and the correct/principled shape per operator sign-off.
- **No runtime fs-type detection — operator-asserts the cache root (scope
  cut, 2026-07-14).** The extension does NOT probe whether `XDG_CACHE_HOME` /
  `~/.cache` is on a disk-backed vs RAM-backed filesystem. Three review rounds
  burned on a runtime detection that is structurally impossible to get right
  (overlayfs has no resolvable upperdir; magic numbers drift; every variant
  failed open a different way — see Review findings rounds 1–3 + the
  Implementation discovery section). The mission docs settle this:
  THREAT_MODEL "Two boundaries" states pi-sandbox assumes an **outer
  host-isolation boundary already exists** (VM / container / dedicated host /
  separate OS account) that the package "neither provides nor claims to be."
  The host filesystem layout — including whether `~/.cache` is on disk or
  tmpfs — is the operator's outer-boundary responsibility, the same class of
  operator ownership as "actually stood up the VM." A runtime check that
  tries to validate the operator's own host config is out of scope for the
  inner membrane. So: the extension creates + binds the dir unconditionally;
  the operator asserts `XDG_CACHE_HOME` (or accepts `~/.cache`) and verifies
  it is disk-backed with `findmnt` per the docs. If the cache root is
  accidentally on tmpfs, the feature is **silently defeated** (temp quietly
  returns to RAM, OOM crashes return) — this is a **documented 0.1.0
  residual** in the same style as every other gap in the THREAT_MODEL
  release-scope list (RPC/API bash bypass, hardlink race, helper retrieval).
  Runtime validation of the cache root's backing store is explicitly deferred
  as an outer-boundary concern. This removes `probeFilesystem` /
  `assertNotRamBacked` / the magic-number machinery entirely, eliminates the
  overlayfs-in-containers false-fail-close, and kills the recurring
  fail-open bug class.

## Design direction

### Config schema (`sandbox-config.ts`)

Add `tmpBackend` to `SandboxFilesystem`:

```ts
export interface SandboxFilesystem {
  denyRead?: string[];
  denyWrite?: string[];
  allowWrite?: string[];
  allowGitDirDiscovery?: boolean;
  /** Where sandboxed children put temp files.
   *  "session-disk" (default): per-project dir on a disk-backed cache root,
   *  keyed by the canonical session cwd, bound writable + TMPDIR set to it.
   *  Open mode does NOT bind host /tmp.
   *  "host-tmpfs": current behavior — host /tmp bound through (open) or masked
   *  with tmpfs (block). */
  tmpBackend?: "session-disk" | "host-tmpfs";
}
```

Default in `DEFAULT_CONFIG.filesystem`: `tmpBackend: "session-disk"`.

### `buildBwrapArgs` (`sandbox-bwrap.ts`)

When `tmpBackend === "session-disk"` (and a `projectTmpDir` is provided):
- Emit `--bind <projectTmpDir> <projectTmpDir>` (writable, disk-backed).
- Set `TMPDIR=<projectTmpDir>` in the child env for BOTH open and block modes
  (overriding the block-mode `TMPDIR=/tmp` forcing — the disk dir replaces
  the masked tmpfs as the canonical temp dir).
- In open mode, do NOT bind host `/tmp` through. The project temp dir replaces
  it. (Today, `allowWrite:["/tmp"]` + open mode binds host `/tmp`; with
  `session-disk`, `/tmp` is no longer auto-bound even if listed in
  `allowWrite` — the project dir is the temp target instead.)
- In block mode, KEEP the `/tmp` + `/run` + `/var/run` + `/var/tmp` +
  `/tmp/.X11-unix` tmpfs masks (IPC isolation preserved), but `TMPDIR` points
  at the bound disk dir, not `/tmp`.

`buildBwrapArgs` needs a new optional `projectTmpDir?: string` field on
`BuildBwrapArgsOptions`. When `tmpBackend === "session-disk"` and
`projectTmpDir` is absent, fail closed (the caller must always thread it
through — same trusted-init-state discipline as `pinnedGitDirs`).

### `session_start` (`sandbox.ts`)

At `session_start`, when `tmpBackend === "session-disk"`:
- Resolve the cache root: `$XDG_CACHE_HOME/pi-sandbox/tmp/` (fall back to
  `~/.cache/pi-sandbox/tmp/` when `XDG_CACHE_HOME` is unset). The extension
  does NOT probe the backing-store filesystem type — the operator asserts
  `XDG_CACHE_HOME` and verifies it is disk-backed with `findmnt` per the docs
  (see Strategic decisions: scope cut). A relative/empty `XDG_CACHE_HOME`
  still fails closed (it would produce a relative `TMPDIR` diverging from the
  canonicalized bind source).
- Derive the per-project dir from a stable hash of the canonical cwd
  (`~/.cache/pi-sandbox/tmp/<cwd-hash>/`), NOT `mkdtemp` — the dir must be
  stable + shared across concurrent sessions in the same project. Stash the
  path on the sandbox policy, pass it as `projectTmpDir` to every
  `buildBwrapArgs` / `buildSandboxedSpawnArgs` call.
- No cleanup: the dir persists across sessions (see Unit 4 + Risks).

### Tests (`sandbox.test.ts`, `sandbox-bwrap.test.ts`)

- `tmpBackend: "session-disk"` emits `--bind <dir> <dir>` + `--setenv TMPDIR <dir>`,
  and does NOT emit `--bind /tmp /tmp` in open mode.
- `tmpBackend: "host-tmpfs"` preserves today's behavior exactly (regression
  guard for the default-swap).
- Block mode + `session-disk`: keeps `/tmp` tmpfs mask, sets `TMPDIR=<dir>`,
  binds the disk dir. Update the existing block-mode `TMPDIR=/tmp` test
  (`sandbox.test.ts:2174` arg-level + `sandbox.test.ts:3183` integration) to
  assert the disk dir under `session-disk` and
  keep asserting `/tmp` under `host-tmpfs`.
- Integration test: a sandboxed `mktemp -d` lands under the project dir,
  not `/tmp`.
- No cleanup: the project temp dir persists across sessions.
- Fail-closed: `session-disk` with no `projectTmpDir` threaded through does
  not silently fall back to host `/tmp`.
- Fail-closed: a relative/empty `XDG_CACHE_HOME` under `session-disk` does
  not produce a relative `TMPDIR`.
- (No fs-type probe tests — runtime detection is out of scope; see Strategic
  decisions: scope cut.)

### Docs (`plugins/pi-sandbox/README.md`, `docs/THREAT_MODEL.md`)

Document `filesystem.tmpBackend`, the default-disk posture, the per-project
lifecycle (no cleanup — dir persists across sessions), and the security
improvement (narrower writable surface: children no longer see host `/tmp`
accumulated files/sockets in open mode). Note the block-mode behavior change
(temp → disk, masks preserved).

## Acceptance

- [ ] `filesystem.tmpBackend` config field exists, defaults to `"session-disk"`,
      validates against `["session-disk", "host-tmpfs"]`.
- [ ] Sandboxed children's `TMPDIR` points at a per-project dir;
      `mktemp -d` inside a sandboxed bash lands under the project dir, not
      `/tmp`. (The dir's backing-store fs type is NOT runtime-validated —
      operator-asserted; see Strategic decisions: scope cut.)
- [ ] Open mode no longer binds host `/tmp` through under `session-disk`
      (narrower writable surface).
- [ ] Block mode keeps the `/tmp` + socket-dir tmpfs masks under `session-disk`
      (IPC isolation preserved) while `TMPDIR` points at the project dir.
- [ ] No cleanup: the project temp dir persists across sessions; `session_shutdown` leaves it in place.
- [ ] `host-tmpfs` opt-out preserves today's exact behavior (regression guard).
- [ ] Fail-closed when `projectTmpDir` is not threaded through under
      `session-disk`, and when `XDG_CACHE_HOME` is relative/empty under
      `session-disk` (would produce a relative `TMPDIR`).
- [ ] Background/monitor path resolves `projectTmpDir` under `session-disk`
      (via the accessor) — a `background`/`monitor`/`jobs` command does not
      throw fail-closed under the default. Wired in the same change as the
      default flip, not deferred.
- [ ] Non-Linux graceful-degrade path still installs the configured in-process
      file policy (regression guard for R3-B2: the feature must not break
      file-tool policy on the degrade path).
- [ ] Existing block-mode tests updated; README + THREAT_MODEL document the
      change, the security improvement, and the operator-asserts-backing-store
      residual.

## Architectural choice

**Thread a project temp dir through the same trusted-init-state path as
`pinnedGitDirs`.** Compute the disk-backed, cwd-keyed project temp dir once
at `session_start`, pin it on `SandboxPolicy`, and pass it to every
`buildBwrapArgs` call (both the bash-ops path and `buildSandboxedSpawnArgs`).
`buildBwrapArgs` binds it writable + sets `TMPDIR` to it. No cleanup — the dir persists and stays warm across sessions.

Why over alternatives:
- *Global `TMPDIR` env override at process level* — rejected: the sandbox
  extension deliberately leaves `process.env` untouched at `session_start`
  (documented invariant); a global override would also leak into the
  unsandboxed/degraded spawn paths.
- *Mount a tmpfs at `/tmp` sized to disk via `--size`* — rejected: bwrap
  `--tmpfs` is RAM-backed regardless; `--size` caps it but doesn't move it to
  disk. Doesn't solve the memory pressure.
- *Bind host `/var/tmp` through as the temp dir* — rejected: still a shared
  host path (cross-session accumulation, host socket exposure); the per-project
  dir is narrower and keeps host `/tmp` unexposed.

This mirrors the established `pinnedGitDirs` discipline: trusted init state,
pinned on the policy, threaded per-spawn, never re-derived mid-session.

## Implementation Units

### Unit 1: Config schema + default
**File**: `plugins/pi-sandbox/extensions/sandbox-config.ts`

```ts
export interface SandboxFilesystem {
	denyRead?: string[];
	denyWrite?: string[];
	allowWrite?: string[];
	allowGitDirDiscovery?: boolean;
	/** Where sandboxed children put temp files.
	 *  - "session-disk" (default): per-project dir on a disk-backed cache root,
	 *    keyed by the canonical session cwd, bound writable + TMPDIR set to it.
	 *    Open mode does NOT bind host /tmp.
	 *  - "host-tmpfs": current behavior — host /tmp bound through (open) or masked
	 *    with tmpfs (block). Preserved as an explicit opt-out. */
	tmpBackend?: "session-disk" | "host-tmpfs";
}
```

In `DEFAULT_CONFIG.filesystem` add `tmpBackend: "session-disk"`.

Add `"tmpBackend"` to the `rejectUnknownKeys` allowlist for `filesystem`
(`sandbox-config.ts:1482`), and validate the value against
`new Set(["session-disk", "host-tmpfs"])` in `validateConfig`.

**Acceptance Criteria**:
- [ ] `tmpBackend` is accepted in `filesystem`, defaults to `"session-disk"`, rejects unknown values.
- [ ] `host-tmpfs` parses and round-trips through config merge.

### Unit 2: `projectTmpDir` flows through `BuildBwrapArgsOptions` + `buildBwrapArgs`
**File**: `plugins/pi-sandbox/extensions/sandbox-bwrap.ts`

```ts
export interface BuildBwrapArgsOptions {
	cwd: string;
	configCwd?: string;
	denyRead: string[];
	denyWrite: string[];
	allowWrite: string[];
	pinnedGitDirs?: string[];
	networkMode: NetworkMode;
	env?: NodeJS.ProcessEnv;
	/** When set, bind this disk-backed dir writable and force TMPDIR to it
	 *  (both open and block modes). Replaces the host-/tmp bind (open) and
	 *  the TMPDIR=/tmp forcing (block). Must be a canonical absolute path
	 *  that exists on a non-tmpfs backing store — the caller (session_start)
	 *  validates that. Per-project (cwd-keyed), shared across concurrent
	 *  sessions in the same project. */
	projectTmpDir?: string;
	/** "session-disk" | "host-tmpfs"; defaults to "session-disk". When
	 *  "session-disk" and projectTmpDir is absent, THROW (fail-closed): the
	 *  caller must thread it through. */
	tmpBackend?: "session-disk" | "host-tmpfs";
}
```

Behavior in `buildBwrapArgs`:
- Resolve `tmpBackend = opts.tmpBackend ?? "session-disk"`.
- If `tmpBackend === "session-disk"`:
  - If `opts.projectTmpDir` is absent → **throw** (fail-closed: caller
    forgot to thread the pinned project temp dir; never silently fall back
    to host `/tmp`).
  - Emit `--bind <projectTmpDir> <projectTmpDir>` (writable, disk-backed).
  - Set `childEnv.TMPDIR = <projectTmpDir>` for BOTH open and block modes
    (overrides the block-mode `TMPDIR=/tmp` forcing at line 50).
  - Open mode: do NOT bind host `/tmp` even if it appears in `allowWrite`.
    Filter `/tmp` (and `/var/tmp`) out of the `allowWrite`-derived binds when
    `session-disk` is active — the project dir is the temp target. (If an
    operator genuinely needs host `/tmp` readable, that's `host-tmpfs`.)
  - Block mode: keep the existing `/tmp` + `/run` + `/var/run` + `/var/tmp` +
    `/tmp/.X11-unix` tmpfs masks (IPC isolation preserved); only `TMPDIR`
    changes destination.
- If `tmpBackend === "host-tmpfs"`: today's behavior, byte-for-byte (the
  `--bind /tmp /tmp` open-mode bind and the block-mode `TMPDIR=/tmp`
  forcing both stand). This is the regression-guard branch.

**Acceptance Criteria**:
- [ ] `session-disk` + `projectTmpDir` present: emits `--bind <dir> <dir>` + `--setenv TMPDIR <dir>`; no `--bind /tmp /tmp` in open mode.
- [ ] `session-disk` + `projectTmpDir` absent: throws (fail-closed).
- [ ] `host-tmpfs`: open-mode binds `/tmp` through and block-mode forces `TMPDIR=/tmp` — unchanged.
- [ ] Block mode + `session-disk`: `/tmp` tmpfs mask still emitted; `TMPDIR` points at the disk dir.

### Unit 3: `projectTmpDir` on `SandboxPolicy` + threaded through both spawn paths
**File**: `plugins/pi-sandbox/extensions/sandbox-file-policy.ts` (type), `sandbox.ts` (bash path), `sandbox-spawn.ts` (background/monitor path)

```ts
export interface SandboxPolicy {
	denyRead: string[];
	denyWrite: string[];
	allowWrite: string[];
	pinnedGitDirs: string[];
	cwd: string;
	networkMode: NetworkMode;
	toolRules?: ToolRules;
	/** Pinned per-project disk-backed temp dir (trusted init state) when
	 *  tmpBackend==="session-disk"; null for host-tmpfs and for the
	 *  fail-closed/permissive policies. Bound writable + TMPDIR set to it
	 *  by buildBwrapArgs. Cwd-keyed: shared across concurrent sessions in
	 *  the same project. */
	projectTmpDir: string | null;
	/** Mirrors config; drives buildBwrapArgs branch selection. */
	tmpBackend: "session-disk" | "host-tmpfs";
}
```

`createFailClosedPolicy` and `createPermissivePolicy` set
`projectTmpDir: null, tmpBackend: "host-tmpfs"` (these policies don't run
bwrap with a project temp dir; fail-closed refuses bash, permissive is the
explicit-disable path).

In `createSandboxedBashOps` (`sandbox.ts:189`): pass `projectTmpDir:
policy.projectTmpDir ?? undefined` and `tmpBackend: policy.tmpBackend` into
`buildBwrapArgs`.

In `buildSandboxedSpawnArgs` (`sandbox-spawn.ts`): add optional
`projectTmpDir?: string | null` + `tmpBackend?` on `SandboxSpawnOptions`,
thread them into `buildBwrapArgs`. The background-tasks bridge (caller of
`buildSandboxedSpawnArgs`) must pass the pinned project temp dir; this is the
same trust boundary as `pinnedGitDirs` (which background/monitor currently
leaves unset — note this as a known gap, see Risks).

**Acceptance Criteria**:
- [ ] `SandboxPolicy` carries `projectTmpDir` + `tmpBackend`; fail-closed/permissive policies null them.
- [ ] Bash-ops path threads both into `buildBwrapArgs`.
- [ ] `buildSandboxedSpawnArgs` accepts + threads both.

### Unit 4: `session_start` derives the cwd-keyed dir via a single `SessionInit` record; no cleanup
**File**: `plugins/pi-sandbox/extensions/sandbox.ts`

**Structural fix for the init-sequence dual-source-of-truth (B1, R2-B2,
R3-B2).** Three bounces came from module-level accessor state and the
`sandboxPolicy` object having different lifecycles and diverging, and from the
platform-check-vs-derivation-vs-policy-construction ordering being coupled
enough that each reorder broke something (moving derivation late broke the
degrade-path file-tool policy — R3-B2). The fix: derive everything into a
**single local `SessionInit` record**, validate it fully, THEN construct the
policy once from that record. One source of truth, one construction site.

New module-level state (mirroring `pinnedBwrapPath`):
```ts
let projectTmpDir: string | null = null;
let tmpBackend: "session-disk" | "host-tmpfs" = "session-disk";
```

The `session_start` derivation, in order (all synchronous, no `await` between
derivation and policy assignment so the two cannot diverge):

1. **Resolve `tmpBackend`** from config: `tmpBackend = config.filesystem?.tmpBackend ?? "session-disk"`.
   Set the module-level `tmpBackend` here so the background/monitor accessor
   (`getTmpBackend()`) is correct even on early-return branches.

2. **Install a provisional in-process file policy BEFORE platform/bwrap
   checks (R3-B2 regression fix).** Pre-feature, the policy was constructed
   before the platform checks, so the non-Linux degrade branch returned with
   `activePolicy` already set to the configured file policy. The feature moved
   construction after the checks (to derive `projectTmpDir` first), so the
   degrade branch returned before any policy → file tools fell to
   `createFailClosedPolicy()` and blocked all filesystem access. Fix: install
   the configured file policy with `projectTmpDir: null, tmpBackend` as a
   provisional `activePolicy` right after the hardlink guard + git-dir discovery
   (the same site the pre-feature code constructed it), BEFORE the
   platform/bwrap disposition. This provisional policy is replaced by the
   project-temp-pinned policy only after successful session-disk derivation on
   the Linux-bwrap-healthy path. On every other path (degrade, fail-closed,
   disabled, bwrap-missing), the provisional configured file policy stays —
   exactly the pre-feature behavior. This is restoring a regression, not a new
   capability.

3. **Platform/bwrap disposition** (unchanged): Linux bwrap resolution →
   `decidePlatformState` → degrade / fail-closed / healthy. On every terminal
   return here, reset `projectTmpDir = null` (the derivation below never ran);
   the provisional file policy from step 2 stays in place. Only the
   Linux-bwrap-healthy path reaches step 4.

4. **Derive the project temp dir into a local `SessionInit` record** (only when
   `tmpBackend === "session-disk"`; `host-tmpfs` skips to step 5 with
   `projectTmpDir: null`). No fs-type probe (scope cut — see Strategic
   decisions). The derivation is pure validation + mkdir, no detection:
   ```ts
   type SessionInit =
     | { ok: true; projectTmpDir: string }
     | { ok: false; reason: string };
   function deriveProjectTmpDir(cwd: string, netMode: NetworkMode): SessionInit {
     const cacheRootRaw = process.env.XDG_CACHE_HOME || join(homedir(), ".cache");
     // I4: reject a relative/empty XDG_CACHE_HOME (would produce a relative
     // TMPDIR diverging from the canonicalized bind source).
     if (!isAbsolute(cacheRootRaw)) {
       return { ok: false, reason: `Sandbox tmpBackend=session-disk requires an absolute XDG_CACHE_HOME (got ${JSON.stringify(process.env.XDG_CACHE_HOME)}). Set XDG_CACHE_HOME to an absolute disk-backed path or use tmpBackend:"host-tmpfs".` };
     }
     const cacheRoot = join(cacheRootRaw, "pi-sandbox", "tmp");
     mkdirSync(cacheRoot, { recursive: true });
     // Canonicalize the cache root AFTER creation (R2-I3: realpathSync on a
     // non-existent path fell back to the raw path and could miss a symlink
     // into a mask root).
     const realCacheRoot = realpathSync(cacheRoot);
     // I3 / R2-I2: reject a cache root nested under a block-mode mask path
     // (/tmp, /var/tmp, /run, /var/run) — but ONLY in block mode (R2-I2: the
     // masks only fire in block mode, so an open-mode cache root under
     // /var/tmp is valid and was wrongly rejected before). Canonicalize the
     // mask roots with the same helper buildBwrapArgs uses so a symlinked
     // /tmp is caught (R3-I1).
     if (netMode === "block") {
       const blockMaskRoots = ["/tmp", "/var/tmp", "/run", "/var/run"].map((p) => canonicalizeExistingPath(p) ?? p);
       const nestedUnderMask = blockMaskRoots.some((m) => realCacheRoot === m || realCacheRoot.startsWith(`${m}/`));
       if (nestedUnderMask) {
         return { ok: false, reason: `cache root ${cacheRoot} resolves under a block-mode tmpfs mask path (${realCacheRoot}); the project temp dir would be hidden by the mask. Set XDG_CACHE_HOME outside /tmp, /var/tmp, /run, or use tmpBackend:"host-tmpfs".` };
       }
     }
     // Per-project dir keyed by a stable hash of the canonical (realpath) cwd.
     // realpath resolves symlinks so two sessions whose cwd differs only by a
     // symlink bind to the same project dir. 16-char truncation: stable,
     // filesystem-safe, collision-resistant.
     const realCwd = realpathSync(cwd);
     const cwdKey = createHash("sha256").update(realCwd).digest("hex").slice(0, 16);
     const dir = join(realCacheRoot, cwdKey);
     mkdirSync(dir, { recursive: true });
     // Canonicalize the final dir too (R3-I1: derive the final path from
     // realCacheRoot, not the raw join, so a symlinked cache root is followed).
     const realDir = realpathSync(dir);
     return { ok: true, projectTmpDir: realDir };
   }
   ```
   **No write probe (R3-B3).** The prior round added a `writeFileSync` probe
   with a predictable name `.write-probe-<pid>` in the shared sandbox-writable
   temp dir — a real symlink-truncation escape vector (a hostile symlink at
   that path truncates an arbitrary file outside sandbox policy). `mkdirSync(dir,
   {recursive:true})` already proves the dir exists and the parent is writable;
   the probe added zero safety and a real vuln. **Delete the write probe; do not
   replace it.** (This is the pre-mortem the discovery section demanded: an
   attacker controls the shared temp dir — `mkdirSync` is the only filesystem
   mutation, and it cannot be weaponized the way a create-by-name probe can.)

   On `{ ok: false }`: fail-closed with `ctx.ui.notify` + status, reset
   `projectTmpDir = null`, return. The provisional file policy from step 2
   stays (file tools remain hardened, not permissive).

5. **Construct the policy ONCE from the `SessionInit` record.** Replace the
   provisional policy with the final one capturing the resolved values:
   ```ts
   const init = tmpBackend === "session-disk" ? deriveProjectTmpDir(ctx.cwd, netMode) : { ok: true as const, projectTmpDir: null as string | null };
   if (!init.ok) { /* fail-closed return; provisional policy stays */ }
   projectTmpDir = init.projectTmpDir;  // pin module-level state
   sandboxPolicy = {
     denyRead, denyWrite,
     allowWrite: [...(config.filesystem?.allowWrite ?? []), ...discoveredGitDirs],
     pinnedGitDirs: discoveredGitDirs,
     cwd: ctx.cwd, networkMode: netMode, toolRules: config.tools,
     projectTmpDir: init.projectTmpDir, tmpBackend,
   };
   activePolicy = sandboxPolicy;
   ```
   Because derivation (step 4) and policy construction (step 5) share the same
   `init` record with no intervening `await`, the policy cannot capture a stale
   null placeholder (B1) and the accessor cannot diverge from the policy
   (R2-B2). The `getSandboxPolicy()` test accessor asserts the policy object
   itself carries the derived value.

**No cleanup.** The dir is per-project (bounded by project count, small), temp
files are created and deleted by their processes normally, and the orphaned-WAL
case is ~850KB files on a 26G disk. The dir persists and stays warm across
sessions — which is what you want. If disk growth ever matters, OS tooling
(`systemd-tmpfiles`, a cron) is the standard answer for cache-dir hygiene, not
a custom protocol baked into a sandbox extension. No sweep, no pidfiles, no
liveness checks, no `session_shutdown` removal.

Reset `projectTmpDir = null` at every early-return branch in `session_start`
(no-sandbox, parse error, disabled, degrade, fail-closed, bwrap-missing,
derivation-failed) — match the existing reset pattern for `pinnedBwrapPath`.
No `session_shutdown` temp-dir action needed (the dir outlives the session by
design); `session_shutdown` resets module state only.

**Acceptance Criteria**:
- [ ] `session_start` creates `~/.cache/pi-sandbox/tmp/<cwd-hash>/` under `session-disk`.
- [ ] Two sessions with the same realpath cwd resolve to the SAME `projectTmpDir`.
- [ ] Two sessions with different cwds resolve to DIFFERENT dirs.
- [ ] Relative/empty `XDG_CACHE_HOME` under `session-disk` → fail-closed with a clear status, no project temp dir bound.
- [ ] Cache root nested under a block-mode mask path (`/tmp`/`/var/tmp`/`/run`/`/var/run`) under `session-disk` + block mode → fail-closed.
- [ ] Early-return branches reset `projectTmpDir = null`.
- [ ] `session_shutdown` leaves the project temp dir in place.
- [ ] **B1 regression (load-bearing)**: the ACTIVE POLICY carries the derived `projectTmpDir` (assert via `getSandboxPolicy()`, not just the module accessor). Verified load-bearing: forcing `projectTmpDir: null` in the policy makes the test fail.
- [ ] **R3-B2 regression**: non-Linux graceful-degrade installs the configured in-process file policy (not `createFailClosedPolicy()`); a `read`/`write`/`edit` on the degrade path enforces the configured `denyRead`/`denyWrite`/`allowWrite`, not a blanket block.
- [ ] **No write probe**: the derivation does NOT call `writeFileSync`/`openSync` with a predictable name in the shared temp dir (grep the diff for `write-probe` / `writeFileSync` in the derivation path — must be absent).
- [ ] No `probeFilesystem` / `assertNotRamBacked` / `statfsSync` / magic-number machinery in the derivation (scope cut).


### Unit 5: Tests
**File**: `plugins/pi-sandbox/extensions/sandbox-bwrap.test.ts`, `sandbox.test.ts`

Arg-level + integration:
- `session-disk` open mode: `--bind <dir> <dir>` + `--setenv TMPDIR <dir>`, no `--bind /tmp /tmp`.
- `session-disk` block mode: `/tmp` tmpfs mask present, `--setenv TMPDIR <dir>`, project dir bound.
- `session-disk` + missing `projectTmpDir` → throws.
- `host-tmpfs` open: `--bind /tmp /tmp` present (regression guard).
- `host-tmpfs` block: `--setenv TMPDIR /tmp` (regression guard; existing tests at `sandbox.test.ts:2174` arg-level + `sandbox.test.ts:3183` integration kept, conditioned on `host-tmpfs`).
- Integration: sandboxed `mktemp -d` lands under the project dir, not `/tmp`.
- Integration: the project temp dir persists across a `session_shutdown`.
- Entrypoint (B1 regression, load-bearing): real `session_start` under `session-disk` with a disk-backed `XDG_CACHE_HOME` → `getSandboxPolicy().projectTmpDir === resolved` (assert the POLICY, not just the module accessor). Verified load-bearing: forcing `projectTmpDir: null` in the policy makes the test fail.
- Entrypoint (R3-B2 regression): non-Linux graceful-degrade (or bwrap-missing) installs the configured in-process file policy — a `read`/`write`/`edit` on the degrade path enforces the configured `denyRead`/`denyWrite`/`allowWrite`, not a blanket `createFailClosedPolicy()` block.
- Entrypoint: same realpath cwd → same `projectTmpDir`; different cwd → different dir.
- Entrypoint: relative/empty `XDG_CACHE_HOME` under `session-disk` → fail-closed status, no bind.
- Entrypoint: cache root nested under a block-mode mask path + block mode → fail-closed.
- Static (no-write-probe / no-detection): grep the `session_start` derivation path — `write-probe` / `writeFileSync` / `openSync` with a predictable name / `probeFilesystem` / `assertNotRamBacked` / `statfsSync` / magic-number constants must be ABSENT from the derivation (scope cut + R3-B3). (A simple `rg` assertion in the test, or a code-review checklist item if a grep-test is awkward in the harness.)
- Background-spawn accessor: `buildSandboxedSpawnArgs` with no `projectTmpDir`/`tmpBackend` opts override resolves the session-pinned dir via `getProjectTmpDir()`/`getTmpBackend()` under `session-disk` (the background/monitor path does not throw fail-closed under the default).

**Acceptance Criteria**:
- [ ] All the above pass; existing block-mode `TMPDIR=/tmp` test updated to be
      `host-tmpfs`-conditional (it now only holds under `host-tmpfs`).
- [ ] The B1 and R3-B2 regression tests are load-bearing (fail against the
      reverted bug).

### Unit 6: Docs
**File**: `plugins/pi-sandbox/README.md`, `plugins/pi-sandbox/docs/THREAT_MODEL.md`

README `## Configuration` + `## Network modes`:
- Document `filesystem.tmpBackend`, default `session-disk`, the `host-tmpfs`
  opt-out, the per-project lifecycle, and the no-cleanup posture.
- Update the `block` mode paragraph: `TMPDIR` now points at the disk-backed
  project temp dir under `session-disk` (default); the `/tmp` tmpfs mask
  remains for IPC isolation.
- Note the security improvement: open mode under `session-disk` no longer
  binds host `/tmp` through — sandboxed children see only their own temp dir,
  not host `/tmp` accumulated files or sockets.

THREAT_MODEL: add a line under the existing private-tmpfs residual note
  (`README.md:200` / THREAT_MODEL release-scope) recording that `session-disk`
  moves block-mode temp off RAM-backed tmpfs onto disk (capacity win, no
  memory DoS), and that the in-process `/tmp`-masking residual (unbounded
  tmpfs size) is replaced by disk quota for the session dir. **Add the
  operator-asserts-backing-store residual**: the extension does NOT runtime-
  validate that the cache root is on a disk-backed filesystem — the operator
  asserts `XDG_CACHE_HOME` and verifies it with `findmnt`; if the cache root is
  accidentally on tmpfs, the feature is silently defeated (temp returns to
  RAM). This is an outer-boundary responsibility per "Two boundaries," in the
  same style as the other 0.1.0 residuals. Reword the existing
  "fail-closes if the cache root resolves to tmpfs" claim (which described the
  now-removed detection) to the operator-assertion posture.

**Acceptance Criteria**:
- [ ] README documents `tmpBackend`, the default, the lifecycle, and the security improvement.
- [ ] THREAT_MODEL records the block-mode temp destination change.

## Implementation Order

1. Unit 1 — config field + default + validation (foundation; unblocks all others)
2. Unit 2 — `buildBwrapArgs` branch (the trickiest unit; validated in isolation by Unit 5 arg tests)
3. Unit 3 — `SandboxPolicy` field + thread through both spawn paths
4. Unit 4 — `session_start` derives the cwd-keyed dir (depends on 2+3)
5. Unit 5 — tests (accrue across 2-4; the integration tests need 4)
6. Unit 6 — docs (last; reflects the landed behavior)

## Testing

See Unit 5. Strategy: arg-list tests for `buildBwrapArgs` branching (fast,
exhaustive, no bwrap needed) + a small number of real-bwrap integration tests
for the disk-destination and lifecycle claims (the existing
`integrationTest` helper in `sandbox.test.ts` already runs real bwrap).

## Risks

- **Background/monitor spawn path threads `projectTmpDir` — DEFAULT-BREAKING if unwired.** The bash path gets it from `activePolicy`; `buildSandboxedSpawnArgs` is called by the background-tasks bridge. Verified shape (`plugins/background-tasks/extensions/sandbox-bridge.ts`, call sites `background-tasks.ts:464,488`): the bridge does NOT import a state accessor from pi-sandbox — it calls the *function* `buildSandboxedSpawnArgs` with a plain opts object `{command, cwd, configCwd, envAdd}`, and there is no session-pinned state channel today (`pinnedGitDirs` is absent here too). So "expose an accessor and have the bridge call it" is not the real shape. Two viable threading paths:
  - **(a)** Export a module-level `getProjectTmpDir(): string | null` accessor from the sandbox extension; `buildSandboxedSpawnArgs` reads it internally when `projectTmpDir` is not passed in opts. Keeps the bridge call-site unchanged; the sandbox extension owns the session-state read.
  - **(b)** Add `projectTmpDir` to the background/monitor tool's input contract and have the bridge receive it from the sandbox extension's session state at call time.
  Prefer (a) — it matches how `pinnedBwrapPath` already works (module-level state read inside the extension) and avoids widening the bridge contract. **Severity**: under `session-disk` (the DEFAULT), an unwired background path makes every `background`/`monitor`/`jobs` command throw fail-closed. This MUST be wired in the same change as the default flip — it is not a deferred gap. Land the accessor in Unit 3, wire `buildSandboxedSpawnArgs` to read it in Unit 3, and add an integration test that a background command resolves `TMPDIR` to the project dir under `session-disk`.
- **No runtime fs-type detection — silent defeat if cache root is on tmpfs
  (accepted residual, scope cut).** The extension does NOT validate that
  `XDG_CACHE_HOME` / `~/.cache` is on a disk-backed filesystem. If the cache
  root is accidentally on tmpfs, the feature is silently defeated: temp
  quietly returns to RAM and the OOM crashes the feature exists to prevent
  come back, with no signal from the extension. Accepted per the mission docs:
  THREAT_MODEL "Two boundaries" makes the host filesystem layout the
  operator's outer-boundary responsibility (same class as "stood up the VM").
  A runtime check that's imperfect (and all variants are — overlayfs has no
  resolvable upperdir; magic numbers drift) is worse than none: it creates a
  false security signal and burned three review rounds. Documented as a 0.1.0
  residual in THREAT_MODEL + README; the operator verifies with `findmnt`.
  Runtime validation of the cache root's backing store is explicitly deferred
  as an outer-boundary concern.
- **R3-B2 regression: degrade-path file-tool policy (in-scope fix).** Moving
  policy construction after the platform/bwrap checks (to derive
  `projectTmpDir` first) broke the non-Linux degrade path: it returned before
  any policy was installed, so `read`/`write`/`edit` fell to
  `createFailClosedPolicy()` and blocked all filesystem access instead of
  enforcing the configured in-process policy. Pre-feature, the policy was
  constructed before the platform checks. Fix (Unit 4 step 2): install a
  provisional configured file policy before the platform/bwrap disposition,
  replace with the project-temp-pinned policy only after successful
  derivation. This is restoring a regression, not a new capability; the
  R3-B2 regression test is load-bearing.
- **No cleanup — disk growth.** The project temp dir is never swept or
  removed; it can grow over months/years of use. Accepted: the dir is
  per-project (bounded by project count), temp files are created/deleted by
  their processes normally, and the disk is 26G with small temp files. If
  growth ever matters, OS tooling (`systemd-tmpfiles`, a cron) handles
  cache-dir hygiene generically — not a custom protocol in the sandbox
  extension. Flagged here so it's a conscious decision, not a surprise.

## Notes

- This also mitigates (does not fix) the orphaned-SQLite-WAL accumulation
  surfacing in `/tmp/.tmpXXXXXX-wal` — per-project disk temp means sidecars
  land in the project's own temp dir on disk (no RAM pressure) instead of
  host `/tmp`. The upstream leak (a producer opening WAL-mode temp SQLite
  DBs without `db.close()`) is a separate item.
- Builds on `feature-sandbox-first-party-bwrap` (done) and the block-mode
  tmp/socket masking in `story-pi-sandbox-block-mode-tmp-sockets` (done). No
  in-flight dependencies; `depends_on` left empty because the foundation is
  already done on this branch.

## Implementation notes

- Files changed:
  - `plugins/pi-sandbox/extensions/sandbox-config.ts` — `SandboxFilesystem.tmpBackend` field, `DEFAULT_CONFIG.filesystem.tmpBackend: "session-disk"`, `rejectUnknownKeys` allowlist, `validateConfig` enum check, and **`deepMerge` filesystem branch carries `tmpBackend`** (the merge was dropping it — caught by the capability-handshake tests).
  - `plugins/pi-sandbox/extensions/sandbox-bwrap.ts` — `BuildBwrapArgsOptions.projectTmpDir` + `tmpBackend`; `buildBwrapArgs` split into a session-disk branch (bind project dir, force `TMPDIR`, skip `/tmp`+`/var/tmp` in allowWrite binds) and a `host-tmpfs` branch (legacy). Block mode keeps the `/tmp` tmpfs mask in both branches.
  - `plugins/pi-sandbox/extensions/sandbox-file-policy.ts` — `SandboxPolicy.projectTmpDir` + `tmpBackend`; `createFailClosedPolicy`/`createPermissivePolicy` null them.
  - `plugins/pi-sandbox/extensions/sandbox.ts` — module-level `projectTmpDir`/`tmpBackend` state + exported `getProjectTmpDir()`/`getTmpBackend()` accessors; `session_start` derives the cwd-keyed dir (`sha256(realpath(cwd))[:16]` under `~/.cache/pi-sandbox/tmp/`), disk-backing fail-closed check (`statSync().dev` vs `/tmp` + `/dev/shm`), pins on the policy; `session_shutdown` leaves the dir in place (resets state only).
  - `plugins/pi-sandbox/extensions/sandbox-spawn.ts` — `SandboxSpawnOptions.projectTmpDir`/`tmpBackend` (test overrides); `buildSandboxedSpawnArgs` reads `getProjectTmpDir()`/`getTmpBackend()` so the background/monitor path resolves the same session-pinned dir (path (a) from the risk note — no bridge contract widening).
  - `plugins/pi-sandbox/README.md` + `docs/THREAT_MODEL.md` — `tmpBackend` config + the new "Temp backend" section + block-mode TMPDIR updates + the residual note.
- Tests added (`sandbox.test.ts`): session-disk open mode binds project dir + forces TMPDIR + skips host `/tmp`; session-disk throws when `projectTmpDir` absent; session-disk block mode keeps `/tmp` mask + sets TMPDIR to project dir; integration test that `mktemp -d` lands under the project dir. Plus the `host-tmpfs` regression guard applied to all pre-existing `buildBwrapArgs`/`runSandboxed` call sites (33 arg-level + 13 integration + the background-tasks bridge builder).
- Discrepancies from design:
  - `deepMerge` did not carry `tmpBackend` (or `allowGitConfig`) — the design assumed the merge was field-agnostic. Fixed by adding `tmpBackend` to the filesystem merge branch; surfaced by the capability-handshake tests going fail-closed. (Pre-existing `allowGitConfig` had the same gap but is out of scope here.)
  - The capability-handshake + extension-entrypoint tests run `session_start` against the default config, which now activates session-disk and needs a writable disk-backed `~/.cache` (read-only in CI). Fixed by having those test harnesses write a `tmpBackend: "host-tmpfs"` config — they test the handshake, not the temp-dir derivation.
- Adjacent issues parked: none.

## Review findings (deep, two-phase cross-model, 2026-07-13)

Bounced `review → implementing` on 2 blockers + importants. Two fresh-context
`gpt-5.6-sol` passes (Phase 1 completeness, Phase 2 adversarial) converged on
the same two blockers.

### Blockers

- **B1: `sandboxPolicy` is constructed before `projectTmpDir`/`tmpBackend` are derived.** `sandbox.ts:656` captures `projectTmpDir: null, tmpBackend: "session-disk"` at policy construction; the derivation at `sandbox.ts:730-757` runs *after* and only updates module-level state, not the policy object. So `activePolicy.projectTmpDir` stays `null` → the bash-ops path passes `projectTmpDir: undefined` → `buildBwrapArgs` throws fail-closed for every real session_start under the default `session-disk`. Even `host-tmpfs` is broken because the policy retains `"session-disk"`. **The integration tests missed this because they pass `projectTmpDir` directly via opts, bypassing `session_start`.** Fix: derive `tmpBackend` + `projectTmpDir` *before* constructing `sandboxPolicy`, or re-assign the policy after derivation. Add a real session_start→bash integration test under `session-disk`.

- **B2: the disk-backing check (`st_dev` vs `/tmp` + `/dev/shm`) is neither necessary nor sufficient.** `sandbox.ts:738-743` — on a host where `/tmp` is on the root disk (same `st_dev` as `~/.cache`), the default would falsely fail-close; a separate tmpfs mount with a different dev would pass. Plus the "on disk, not tmpfs" integration test creates `projectTmpDir` under `tmpdir()` (which is tmpfs on this VM) and never asserts backing storage, so it proves path routing while falsely claiming disk. Fix: inspect the filesystem *type* (statfs/mount metadata) of the cache root AND the final project dir, rejecting tmpfs/ramfs directly; create the test fixture on a verified disk-backed path and assert the fs type.

### Important

- **I1: open-mode `/tmp` read/socket exposure contradicts the README.** `sandbox-bwrap.ts:91` — `--ro-bind / /` still exposes host `/tmp` read-only, including connectable Unix sockets. Removing the writable `--bind /tmp /tmp` narrows *writes* only. README L158 says "children no longer see host `/tmp` accumulated files/sockets" — overstated; L190 correctly says open mode leaves them intact. Fix: narrow the README claim to "no writable bind" (or mask host temp in open session-disk too, but that's a bigger change).
- **I2: `/tmp`+`/var/tmp` filtering is exact-string only.** `sandbox-bwrap.ts:129-133` — `allowWrite:["/tmp/foo"]` (a subdir) still binds through; a symlinked `/tmp` canonicalizing to another name bypasses the check. Fix: canonicalize the temp roots and reject mounts equal to OR nested beneath them.
- **I3: block-mode masks can hide the project dir.** `sandbox-bwrap.ts:142-150` — if `XDG_CACHE_HOME` is under `/tmp`, `/var/tmp`, or `/run`, the project dir is bound first and a later parent `--tmpfs` masks it → `TMPDIR` names an inaccessible path. Fix: reject cache roots nested under block-mode mask paths.
- **I4: relative/empty `XDG_CACHE_HOME` produces a relative `TMPDIR`.** `sandbox.ts:732` — the child env gets the original (possibly relative) path; the bind source is canonicalized but `TMPDIR` isn't. Fix: require absolute XDG or fall back per the XDG spec; pin the canonical absolute dir as `TMPDIR`.
- **I5: session-lifecycle + background-accessor coverage is missing.** Tests cover the arg builder only; background tests force `host-tmpfs`. Missing: real `session_start` derivation, same/different-cwd hashing, tmpfs fail-closed, ENOENT/EACCES/EROFS, shutdown persistence, and the background path resolving the dir via the accessor (no opts override).
- **I6: project-local `tmpBackend` is silently ignored.** `mergeProjectAdditive` has no `tmpBackend` branch — the field validates and `deepMerge` carries global, but project-local config is dropped without warning. Define additive authority (likely global-only: reject project `tmpBackend` with a warning) and document it; test both merge directions.
- **I7: `/sandbox` command doesn't report the effective backend or project dir.** Operators can't see which backend is active or where temp is landing. Fix: report backend + resolved path (+ backing fs type) in `/sandbox`.
- **I8: unknown `tmpBackend` strings silently fall through to `host-tmpfs`.** `sandbox-bwrap.ts:61-75` — `buildBwrapArgs` treats anything `!== "session-disk"` as the legacy branch. Fix: explicit switch + throw on unknown values, with a single shared backend type across config/policy/accessors/spawn/bwrap.
- **I9: threat-model "bounded by project count" is misleading.** Directory *count* is bounded; *bytes* are not — a daemon-style session can fill the volume. Fix: document unbounded byte growth + disk-exhaustion behavior + practical cleanup/quota.

### Nits
- N1: spawn-test fixtures duplicate `tmpBackend` and sometimes put it inside `baseEnv` as an env var — clean up.
- N2: non-UTF-8 cwd hashing is unspecified — document as unsupported or hash a buffer-preserving path.

### Notes
- Deny-overlay precedence is sound (denies fire after the project-dir bind). Concurrent `mkdirSync` on the same project dir is safe. `session_shutdown` correctly leaves the dir in place. `deepMerge` now carries `tmpBackend` correctly (confirmed by both reviewers). Pre-init/post-shutdown background resolution correctly fail-closes rather than falling back to host `/tmp`.

## Implementation notes (review-fix round, 2026-07-13)

Addressed the 2 blockers + importants from the deep review.

- **B1 fixed**: moved the projectTmpDir/tmpBackend derivation to BEFORE `sandboxPolicy` construction (sandbox.ts ~line 656). The policy now captures the resolved values, not null placeholders. Added a real session_start→derivation regression test (moved into the entrypoint describe block so it can reuse `loadSandboxEntrypoint`, parametrized to accept a config override + return the accessors).
- **B2 fixed**: replaced the `st_dev`-vs-`/tmp` heuristic with a filesystem-TYPE check via `statfsSync` — `filesystemTypeOf()` rejects tmpfs/ramfs/devtmpfs directly on both the cache root AND the final project dir. Added the magic-number mapping (0x01021994 tmpfs, 0x858458f6 ramfs, 0x9fa0 devtmpfs).
- **I1 fixed**: README narrowed — open-mode `session-disk` no longer claims read/socket isolation; it's a write narrowing (host `/tmp` stays readable via the root bind, sockets connectable). THREAT_MODEL gap note corrected to match.
- **I2 fixed**: `/tmp`+`/var/tmp` filtering now canonicalizes the roots (catches symlinked `/tmp`) and rejects mounts equal to OR nested beneath them (so `allowWrite:["/tmp/foo"]` is also skipped).
- **I3 fixed**: added a reject-cache-root-nested-under-block-mask check (`/tmp`, `/var/tmp`, `/run`, `/var/run`) — the project dir would be hidden by a later parent `--tmpfs` in block mode.
- **I4 fixed**: relative/empty `XDG_CACHE_HOME` now fail-closes (would produce a relative `TMPDIR` diverging from the canonicalized bind).
- **I6 fixed**: `mergeProjectAdditive` now warns + ignores project-local `tmpBackend` (global/operator-only, like `allowGitDirDiscovery`).
- **I7 fixed**: `/sandbox` command now reports the effective `Temp backend` line.
- **I8 fixed**: `buildBwrapArgs` throws on unknown `tmpBackend` strings (no silent fall-through to host-tmpfs).
- **I9 fixed**: THREAT_MODEL corrected — directory count is bounded by project count, but bytes are not (daemon-style sessions can fill the volume); documented OS cache hygiene / quota as the mitigation.
- **N1 fixed**: spawn-test fixtures deduped (removed misplaced `tmpBackend` lines that landed inside `baseEnv` object literals).
- Background-tasks test harness: its own `loadSandboxEntrypoint` copy now writes a `host-tmpfs` config (same reason as the pi-sandbox entrypoint test — `~/.cache` is read-only in CI, session-disk would fail-close and break the bridge-handshake test).

## Review findings (round 2, deep two-phase cross-model, 2026-07-13)

Bounced `review → implementing` again. Round-2 reviewers confirmed B1/B2 fixes
are structurally sound but found the fix round introduced new issues.

### Confirmed fixed (round 1)
- B1: derivation now precedes `sandboxPolicy` construction (`sandbox.ts:700` before `:769`). Sound.
- B2: cache root AND final project dir both checked via `statfsSync`; tmpfs/ramfs magics correct.

### Blockers (new)

- **R2-B1: `filesystemTypeOf` fails open on "unknown".** `sandbox.ts:106-119,742-746` — `filesystemTypeOf()` returns `"unknown"` both when `statfsSync` throws AND for every unrecognized numeric magic; `assertNotRamBacked()` accepts `"unknown"`. A failed probe, hugetlbfs, or an overlay backed by tmpfs can satisfy the "disk-backed" check and defeat the feature's core guarantee. Fix: return a discriminated probe result; fail closed on probe errors; reject all known RAM-backed types; do NOT accept "unknown" as disk. Both reviewers flagged this.

- **R2-B2: the B1 regression test does not catch B1.** `sandbox.test.ts:398-430` — the test reads `getProjectTmpDir()` (module-level accessor), but the original B1 bug was that the *policy object* kept `projectTmpDir: null` while the module accessor got the value. The test would pass against the broken code. Fix: assert the *active policy* carries the derived value (or exercise the registered bash ops and confirm the generated args contain the derived bind/TMPDIR and don't throw for missing projectTmpDir). Both reviewers flagged this.

### Important (new)

- **R2-I1: derivation runs before platform/bwrap disposition.** `sandbox.ts:700-768` — the default `session-disk` path creates + validates the cache before the platform decision at line 782. On macOS/Windows (graceful-degrade path), an unwritable cache or relative `XDG_CACHE_HOME` turns degrade into fail-closed. Also, later terminal returns (bwrap-missing, filter, degrade) retain `projectTmpDir`/`tmpBackend="session-disk"` in module state despite the sandbox never initializing. Fix: resolve platform/bwrap disposition FIRST; derive the disk dir only for a healthy Linux bwrap path; clear temp state on every later terminal return.

- **R2-I2: I3 block-mask guard rejects valid open-mode roots.** `sandbox.ts:721-735` — the `/tmp`/`/var/tmp`/`run` rejection runs regardless of `networkMode`, so default open mode incorrectly fail-closes a valid disk-backed `XDG_CACHE_HOME=/var/tmp/cache`. Fix: apply the mask-containment rejection ONLY when `netMode === "block"` (the masks only fire in block mode).

- **R2-I3: I3 symlink hole on first creation.** `sandbox.ts:721` — when `cacheRoot` doesn't yet exist, `realpathSync(cacheRoot)` fails and the raw-path fallback can miss an existing ancestor symlink into `/var/tmp`; after creation, block mode masks the real destination and makes TMPDIR unusable. Fix: create the root first, canonicalize it afterward, pin the canonical path, recheck against mask roots.

- **R2-I4: devtmpfs magic is wrong.** `sandbox.ts:126` — `0x9fa0` is `PROC_SUPER_MAGIC`, not devtmpfs. Linux devtmpfs normally reports `TMPFS_MAGIC` (0x01021994), so it's already caught. Remove the bogus `0x9fa0` entry (or correct it).

- **R2-I5: most review-fix paths lack regression coverage.** No focused tests for I2 nested/canonical `/tmp` filtering, I3 masked-root rejection, I4 relative-XDG, I6 project-local warning, I7 reporting, I8 unknown-value throwing, same/different-cwd hashing, shutdown persistence, background-spawn accessor resolution without opts overrides. Add entrypoint + argument-level cases.

- **R2-I6: `/sandbox` doesn't report the resolved session-pinned temp state.** `sandbox-config.ts:2106` — it displays freshly loaded config only, not the resolved project dir or backing fs. `getProjectTmpDirResolved` (`sandbox.ts:134`) is unused. Fix: thread backend/path/fs type through `SandboxCommandState` and render them; test the output.

- **R2-I7: pre-existing unwritable project dir passes init.** `sandbox.ts:755` — `mkdirSync(recursive)` succeeds when the dir already exists; `statfsSync` doesn't verify write/search permission. The session initializes but `mktemp` fails inside the sandbox. Fix: an explicit write probe (create+remove a probe file) on the final dir; test the pre-existing-unwritable case.

### Nits
- R2-N1: THREAT_MODEL says project-local `tmpBackend` is "silently ignored" but `mergeProjectAdditive` emits a warning. Reword to "ignored with a warning."

### Notes
- `statfsSync` is available on supported Node (>=22.19) and current Bun; both return numeric `.type`. I2 canonical equal/nested comparison is consistent for existing allowWrite mounts. No same-runtime session concurrency race found under Pi's serialized lifecycle. Deny-overlay precedence and concurrent `mkdirSync` safety confirmed again.

## Implementation notes (round-2 review-fix, 2026-07-13)

Addressed the 2 round-2 blockers + importants.

- **R2-B1 fixed**: replaced the fail-open `filesystemTypeOf` with a discriminated `probeFilesystem` result. `assertNotRamBacked` now fails-closed on probe errors (`statfs-unavailable`) AND on unrecognized types (`unknown-type`) — hugetlbfs / overlay-on-tmpfs / a vanished path no longer satisfy the disk-backed check. Also corrected R2-I4: removed the bogus `0x9fa0` entry (it's PROC_SUPER_MAGIC, not devtmpfs; devtmpfs reports TMPFS_MAGIC and is caught by the tmpfs case).
- **R2-B2 fixed**: added `getSandboxPolicy()` accessor returning the active policy. The B1 regression test now asserts `policy.projectTmpDir === resolved` (the policy object carries the value, not just the module accessor). Verified the test is load-bearing: forcing `projectTmpDir: null` in the policy (simulating B1) makes the test fail.
- **R2-I1 fixed**: moved the session-disk derivation to AFTER the platform/bwrap disposition (so non-Linux graceful-degrade doesn't fail-close on an unwritable cache root). Only the Linux-bwrap-healthy path reaches the derivation; earlier returns handled degrade/fail-closed/disabled. The bwrap-missing branch now clears `projectTmpDir = null`.
- **R2-I2 fixed**: the I3 block-mask guard now applies ONLY when `netMode === "block"` (the masks only fire in block mode; an open-mode cache root under `/var/tmp` is valid and was wrongly rejected before).
- **R2-I3 fixed**: canonicalize the cache root AFTER `mkdirSync` creates it (realpathSync on a non-existent path fell back to the raw path and could miss a symlink into a mask root).
- **R2-I7 fixed**: added a write probe (create+unlink a probe file) on the final project dir, so a pre-existing unwritable dir fails-closed instead of initializing and breaking `mktemp` inside the sandbox.
- **R2-N1 fixed**: THREAT_MODEL reworded "silently ignored" → "ignored with a warning" for project-local `tmpBackend`.

Not yet addressed (parked for a follow-up stride, lower severity):
- R2-I5: focused regression tests for I2/I3/I4/I6/I7/I8 paths (the B1 test is now load-bearing; the rest are arg-level and straightforward to add).
- R2-I6: thread resolved session state through `/sandbox` (the `getProjectTmpDirResolved` accessor exists but isn't wired to the command output).

## Review findings (round 3, deep two-phase cross-model, 2026-07-13)

Bounced `review → implementing` a third time. Round-3 reviewers confirmed
R2-B2 (the B1 test) and R2-I1 ordering are sound, but found the R2-B1 fix
STILL fails open, plus two new blockers the fix round introduced.

### Confirmed sound (round 2)
- R2-B2: `getSandboxPolicy()` returns `activePolicy`; the test asserts `policy.projectTmpDir === resolved` and would catch the original B1. No intervening `await` between derivation and `activePolicy` assignment.
- R2-I1: platform/bwrap disposition precedes derivation; non-Linux degrade skips it.
- R2-I2/I7: mask guard is block-only; final dir has a write probe.
- No same-runtime lifecycle race (both handlers have no async suspension points).

### Blockers (new)

- **R3-B1: `probeFilesystem` STILL accepts unknown/RAM-backed types.** `sandbox.ts:126-136` — my R2-B1 fix made it fail-closed on probe *errors* and *missing type*, but a numeric magic that isn't tmpfs/ramfs (hugetlbfs 0x958458f6, overlayfs, etc.) still returns `{ok:true, ramBacked:false}` — accepted as disk. Same fail-open hole I claimed to fix. Both reviewers flagged this. **Fix**: use a positive allowlist of recognized DISK-backed types (ext4 0xEF53, xfs 0x58465342, btrfs 0x9123683E, zfs 0x2fc12fc1, etc.); return `unknown-type` for everything else. Reject overlay unless its backing store is verified.

- **R3-B2: R2-I1 broke the degrade-path file-tool policy.** `sandbox.ts:679-745` — moving policy construction after platform/bwrap disposition means the non-Linux degrade branch returns BEFORE `activePolicy` is set, so read/write/edit fall back to `createFailClosedPolicy()` and block all filesystem access instead of enforcing the configured in-process policy. **Fix**: install a provisional configured file policy (with `projectTmpDir:null, tmpBackend`) BEFORE platform/bwrap checks, then replace it with the project-temp-pinned policy after successful derivation.

- **R3-B3: the write probe follows symlinks — truncation escape.** `sandbox.ts:835-837` — the write probe uses a predictable name `.write-probe-<pid>` with `writeFileSync("")`, which follows symlinks. A hostile symlink at that path in the shared (sandbox-writable) temp dir truncates an arbitrary file outside sandbox policy. Real symlink-escape vulnerability. **Fix**: use a cryptographically random name + `openSync` with `O_CREAT | O_EXCL | O_NOFOLLOW`; close+unlink in `finally` with distinct create/remove diagnostics.

### Important (new)

- **R3-I1: block-mask containment compares canonical cache root with noncanonical mask roots.** `sandbox.ts:814-818` — if `/tmp` or `/var/tmp` is a symlink, `realCacheRoot` is resolved but the mask roots are literal strings. `buildBwrapArgs` later canonicalizes the mask paths, so block mode can accept the cache then hide it behind `--tmpfs`, leaving `TMPDIR` inaccessible. **Fix**: canonicalize + dedupe the mask roots using the same helper as `buildBwrapArgs` before the containment check; derive the final path from `realCacheRoot`; canonicalize + containment-check the final dir too.

### Notes
- R2-I5 (focused tests) and R2-I6 (/sandbox wiring) remain parked — acceptable to defer; not blockers.
- The reviewers noted the B1 test is now structurally load-bearing and passed locally.

## Implementation discovery (2026-07-13): the detection + init-sequence design needs re-grounding

Three deep review rounds, three bounces. The pattern is not a string of
independent implementation bugs — it signals that two specific areas of the
design are genuinely hard to get right by iteration, and the adversarial
thinking that should have happened at design time is being done (belatedly) by
the reviewers instead of me. Setting back to `drafting` for a focused
redesign of these two areas before more implementation.

### The recurring fail-open (R2-B1 → R3-B1)
The "is this disk-backed?" check has failed open three different ways across
two rounds. Root cause: I've been building a RAM-backed *blocklist* (catch
tmpfs/ramfs, accept everything else) when the correct shape is a disk-backed
*allowlist* (recognize ext4/xfs/btrfs/zfs, default-deny everything else).
But even an allowlist leaves "is an overlay backed by tmpfs?" which no
runtime fs-type check fully resolves. The deeper design question — not yet
answered — is whether runtime detection is even the right mechanism: an
operator *asserts* `XDG_CACHE_HOME` and knows their own filesystem, and a
determined operator can defeat any runtime check with a bind mount. A
redesign must decide between (a) a real disk-backed allowlist with a tested
default-deny invariant, or (b) dropping runtime detection in favor of
operator-assertion + documentation. Both are more honest than iterating the
heuristic.

### The init-sequence dual source of truth (B1, R2-B2, R3-B2)
Two bounces came from the module-level accessor state and the `sandboxPolicy`
object having different lifecycles and diverging (B1); R3-B2 came from the
platform-check-vs-derivation-vs-policy-construction ordering being coupled
enough that each reorder breaks something (moving derivation late broke the
degrade-path file-tool policy). The structural fix: derive everything into a
single local `SessionInit` record, validate it fully, THEN construct the
policy once from that record. One source of truth, one construction site.
Eliminates the whole class of "policy captures stale/null placeholders" bugs.

### What does NOT need redesign
The core feature — bind a disk dir as `TMPDIR`, per-project, no cleanup — is
sound and largely implemented correctly. The arg-builder branching
(sandbox-bwrap.ts), the config schema, the accessor threading, and the
host-tmpfs regression guard are all fine. No re-scoping needed; the two areas
above are localized.

### Pre-mortem the redesign must run
"An attacker controls the shared (sandbox-writable) project temp dir. At each
step of session_start — cache-root creation, project-dir creation, any probe —
what can they do?" This is the adversarial lens that would have caught R3-B3
(the write-probe symlink truncation escape) and the recurring fail-open
before code. R3-B3 in particular: `mkdirSync(projectTmpDir, {recursive:true})`
already proves the dir exists and the parent is writable; the separate write
probe I added for "safety" introduced a symlink-truncation vector and added
zero safety. **Delete the write probe. Don't replace it.**

## Redesign resolution (2026-07-14)

Re-grounded against the mission docs (THREAT_MODEL "Two boundaries" +
Release scope 0.1.0) per operator redirect: "we can decide what level of
FS/configurability is in scope and defer the others with clear documentation
if it's cleaner."

### Detection mechanism — resolved: drop runtime detection (option B)
The two options the discovery section left open were (a) a disk-backed
allowlist with default-deny, or (b) operator-assertion + docs. Chose **(b)**.
The mission docs settle it: pi-sandbox assumes an outer host-isolation
boundary already exists (VM / container / dedicated host / separate OS
account) that the package "neither provides nor claims to be." The host
filesystem layout — including whether `~/.cache` is on disk or tmpfs — is the
operator's outer-boundary responsibility, the same class of operator
ownership as "actually stood up the VM." A runtime check that tries to
validate the operator's own host config is out of scope for the inner
membrane, and an imperfect one (all variants are — overlayfs has no
resolvable upperdir; magic numbers drift) is worse than none because it
creates a false security signal. So: the extension creates + binds the dir
unconditionally; the operator asserts `XDG_CACHE_HOME` and verifies it is
disk-backed with `findmnt` per the docs. The "cache accidentally on tmpfs →
silent defeat" outcome becomes a **documented 0.1.0 residual** in the same
style as every other gap in the THREAT_MODEL release-scope list. This removes
`probeFilesystem` / `assertNotRamBacked` / the magic-number machinery
entirely, eliminates the overlayfs-in-containers false-fail-close, and kills
the recurring fail-open bug class (R2-B1 → R3-B1). Updated: Strategic
decisions, Design direction (session_start + Tests), Acceptance, Unit 4,
Unit 5, Unit 6, Risks.

### Init-sequence — resolved: single `SessionInit` record (as the discovery section proposed)
Derive everything (cache root, realpath, projectTmpDir) into one local
`SessionInit` record, validate it fully, THEN construct `activePolicy` once
from that record. One source of truth, one construction site. No `await`
between derivation and policy assignment, so the two cannot diverge. The
`getSandboxPolicy()` test accessor asserts the policy object itself carries
the derived value (load-bearing B1 test).

### R3-B2 degrade-path regression — confirmed in scope (this feature's regression)
Verified via git history: pre-feature, the policy was constructed *before*
the platform/bwrap checks (line 622 pre-feature), so the non-Linux degrade
branch returned with `activePolicy` already set to the configured file
policy. The feature moved construction after the checks (to derive
`projectTmpDir` first), so the degrade branch returned before any policy →
file tools fell to `createFailClosedPolicy()`. Restoring the provisional
configured file policy before the platform checks is in scope (it's this
feature's regression, not a new capability); the R3-B2 regression test is
load-bearing.

### R3-B3 write probe — resolved: delete, do not replace (as the discovery section decided)
`mkdirSync(projectTmpDir, {recursive:true})` already proves the dir exists
and the parent is writable. The write probe added a symlink-truncation escape
vector and zero safety. Removed from Unit 4; a static test asserts the
derivation path contains no `write-probe` / `writeFileSync` / predictable-name
`openSync`.

### What stays as-is (confirmed sound across 3 review rounds)
The arg-builder branching (sandbox-bwrap.ts), the config schema + default +
validation + deepMerge carry, the accessor threading (`getProjectTmpDir` /
`getTmpBackend` / `getSandboxPolicy`), the background/monitor spawn path
resolution via accessors, and the `host-tmpfs` regression guard applied to
all pre-existing call sites. No re-scoping of these.

## Implementation notes (redesign round, 2026-07-14)

Addressed the two redesigned areas per the Redesign resolution.

- **Detection removed (scope cut).** Deleted `probeFilesystem`, `assertNotRamBacked`,
  `getProjectTmpDirResolved`, and the `FsProbe` discriminated type from
  `sandbox.ts`. Dropped the `statfsSync`, `statSync`, `unlinkSync`,
  `writeFileSync` imports (all four were used only by the detection machinery +
  the write probe). `session_start` now creates + binds the project temp dir
  unconditionally; the operator asserts `XDG_CACHE_HOME` and verifies it is
  disk-backed with `findmnt` per the README + THREAT_MODEL. The "cache
  accidentally on tmpfs → silent defeat" outcome is a documented 0.1.0
  residual (THREAT_MODEL Known 0.1.0 gaps + README Temp backend).
- **Init-sequence → single `SessionInit` record.** Added a `SessionInit`
  discriminated type + a `deriveProjectTmpDir(cwd, netMode)` helper that
  encapsulates the whole derivation (cache-root resolve + mkdir + realpath,
  block-only mask-containment check with canonicalized mask roots per R3-I1,
  cwd-keyed hash, final-dir realpath). `session_start` calls it once, then
  constructs `activePolicy` once from the result — no intervening `await`, so
  the module accessor and the policy object cannot diverge (B1/R2-B2).
- **R3-B2 regression fixed.** Installed a provisional configured file-tool policy
  (`projectTmpDir:null` + resolved `tmpBackend`) BEFORE the platform/bwrap
  disposition, right after git-dir discovery — restoring the pre-feature
  ordering. The bwrap-missing / degrade / fail-closed terminal returns now
  leave the configured file policy in place (file tools hardened with the
  configured denyRead/allowWrite, not `createFailClosedPolicy()`). Replaced by
  the project-temp-pinned policy only on the Linux-bwrap-healthy path after
  successful derivation. Verified via git history that this is restoring a
  regression this feature introduced (pre-feature, policy was constructed
  before the platform checks at line 622).
- **R3-B3 write probe deleted.** `mkdirSync(projectTmpDir, {recursive:true})`
  already proves the dir exists and the parent is writable; the
  `writeFileSync(probeFile, "")` / `unlinkSync` probe with a predictable name
  was a symlink-truncation escape vector in the shared sandbox-writable temp
  dir and added zero safety. Removed entirely; not replaced.
- **Canonicalized mask roots (R3-I1).** `deriveProjectTmpDir` canonicalizes the
  block-mode mask roots (`/tmp`, `/var/tmp`, `/run`, `/var/run`) via the same
  `canonicalizeExistingPath` helper `buildBwrapArgs` uses, so a symlinked
  `/tmp` is caught in the containment check. The cache root and final project
  dir are both canonicalized after creation.
- **Files changed:**
  - `plugins/pi-sandbox/extensions/sandbox.ts` — removed detection machinery
    (`probeFilesystem`/`assertNotRamBacked`/`getProjectTmpDirResolved`/`FsProbe`);
    removed `statfsSync`/`statSync`/`unlinkSync`/`writeFileSync` imports; added
    `canonicalizeExistingPath` + `NetworkMode` imports; added `SessionInit`
    type + `deriveProjectTmpDir` helper; restructured `session_start` to install
    a provisional policy before platform checks (R3-B2), derive via the
    `SessionInit` record, and construct the final policy once (B1/R2-B2).
  - `plugins/pi-sandbox/README.md` + `docs/THREAT_MODEL.md` — replaced the
    "fail-closes if the cache root resolves to tmpfs" claim with the
    operator-asserts-backing-store posture + the silent-defeat residual.
- **Tests added/updated** (`sandbox.test.ts`):
  - B1 regression test: dropped the `statfsSync` disk assertions (tested the
    removed detection); kept the load-bearing `getSandboxPolicy().projectTmpDir`
    assertion. Fixture now uses `tmpdir()` (no disk-root gating needed — the
    test proves path routing, not backing store).
  - New: stable per-cwd dir (same realpath cwd shares, different differs).
  - New: relative/empty `XDG_CACHE_HOME` fails closed.
  - New: R3-B2 regression — bwrap-missing installs the configured file-tool
    policy (denyRead/allowWrite carried), not `createFailClosedPolicy()`.
  - New: static guard — `sandbox.ts` is free of `probeFilesystem`/
    `assertNotRamBacked`/`statfsSync`/`getProjectTmpDirResolved`/`write-probe`/
    `writeFileSync`/`unlinkSync`/tmpfs+ramfs magic numbers.
  - mktemp integration test: dropped the disk-root gating + `statfsSync`
    assertion (backing store is operator-asserted now); proves path routing only.
- **Discrepancies from design:** none. The implementation matches the
  redesigned Unit 4 + Unit 5 + Unit 6.
- **Adjacent issues parked:** none.

## Review findings (round 4, deep two-phase cross-model, 2026-07-14)

Bounced `review → implementing` again. Two fresh-context `gpt-5.6-sol` passes
(Phase 1 completeness, Phase 2 adversarial) converged on the same two
blockers + importants. The recurring-fail-open (detection) IS killed and the
healthy-path B1 fix holds, but the redesign left two real holes and several
incomplete edges.

### Confirmed fixed (rounds 1–3)
- The runtime fs-type detection is gone and the recurring fail-open (R2-B1 →
  R3-B1) is structurally dead — no gate, no magic numbers, nothing to fail
  open. Both reviewers agreed the scope cut is honest and aligns with the
  mission docs.
- The healthy-path B1 fix holds: derivation → single `SessionInit` record →
  one policy construction, no intervening `await`. The B1 regression test is
  load-bearing.
- The R3-B3 write probe is deleted; `mkdirSync(recursive)` is the only
  filesystem mutation in derivation.

### Blockers (new)

- **B1: symlink escape on the project temp dir final path.**
  `deriveProjectTmpDir` (`sandbox.ts:186-211`) checks the block-mode
  mask-containment only on `realCacheRoot`; the final `realDir` is
  canonicalized but NEVER re-checked against the mask roots or verified to be
  a child of `realCacheRoot`. `mkdirSync(dir, {recursive:true})` **succeeds
  without throwing on a pre-existing symlink-to-dir** (verified with a Node
  repro), and `realpathSync` then follows the symlink to its target. So a
  hostile symlink at the predictable cwd-hash path pins an arbitrary
  directory as the writable `projectTmpDir` bind (writable-surface escape);
  in block mode a symlink into `/tmp`/`/run` passes init then is hidden by
  the tmpfs mask (TMPDIR inaccessible). Additionally `buildBwrapArgs`
  re-canonicalizes the bind source per command, so a post-init swap changes
  what gets mounted. Both reviewers flagged.
  -> Story: `feature-pi-sandbox-disk-backed-tmp-symlink-escape-projectdir`

- **B2: module accessor diverges from activePolicy on the `--no-sandbox` path.**
  `session_start` resets `tmpBackend = "session-disk"` at the top (line 616,
  before branches). The `--no-sandbox` branch installs a permissive policy
  (`tmpBackend: "host-tmpfs"`) and returns WITHOUT updating the module-level
  `tmpBackend`. So `getTmpBackend()` (="session-disk") disagrees with
  `getSandboxPolicy().tmpBackend` (="host-tmpfs") — the exact dual-source-
  of-truth divergence the redesign was supposed to kill, surviving on a path
  it didn't re-check. `buildSandboxedSpawnArgs` reads the accessor → reaches
  `buildBwrapArgs` with session-disk + no projectTmpDir → throws → background/
  monitor commands FAIL TO START under `--no-sandbox`. A regression in the
  documented bypass behavior. Both reviewers flagged.
  -> Story: `feature-pi-sandbox-disk-backed-tmp-nosandbox-accessor-divergence`

### Important (new, parked in backlog)

- **I1: `mkdirSync` does not prove writability.** `mkdirSync(recursive)`
  succeeds on a pre-existing non-writable dir; the R3-B3 fix threw away the
  legitimate writability check along with the unsafe probe. A pre-existing
  unwritable dir passes init but `mktemp` fails inside the sandbox. Safe fix:
  random name + `O_CREAT|O_EXCL|O_NOFOLLOW`. The static guard test must be
  scoped to forbid only unsafe probes, not a safe one.
  -> `idea-pi-sandbox-disk-backed-tmp-safe-writability-check`
- **I2: empty `XDG_CACHE_HOME` contradicts acceptance + docs.** `|| fallback`
  treats `""` as unset (falls back to `~/.cache`), but acceptance/docs/test
  say empty fails closed. Pick one (treat empty as unset, or reject empty)
  and make code + docs + test consistent.
  -> `idea-pi-sandbox-disk-backed-tmp-empty-xdg-semantics`
- **I3: the `findmnt` operator-verification command is unreliable.**
  `findmnt "$XDG_CACHE_HOME"` fails when XDG is unset and when the cache dir
  is a subdirectory, not a mount point. Since docs are now the ONLY
  safeguard, use `findmnt --target "${XDG_CACHE_HOME:-$HOME/.cache}"`.
  -> `idea-pi-sandbox-disk-backed-tmp-findmnt-doc-command`
- **I4: complete silence on tmpfs is too weak for the feature's mission.** The
  scope cut is honest, but silent defeat returns the exact OOM status quo.
  Middle ground: a NON-authoritative one-time startup WARNING (not a gate)
  for positively-recognized tmpfs/ramfs backing — observation, not
  authorization; unknown types make no claim and don't block. Deferrable.
  -> `idea-pi-sandbox-disk-backed-tmp-tmpfs-startup-warning`
- **I5: `/sandbox` reports config only, not effective session state.** The
  command prints configured `tmpBackend` but not the resolved project path /
  effective backend / backing fs. Under an operator-asserted design the
  operator can't inspect the actual target. Wire `getProjectTmpDir()`/
  `getTmpBackend()` through `SandboxCommandState` (after the B2 fix).
  -> `idea-pi-sandbox-disk-backed-tmp-sandbox-cmd-effective-path`
- **I6: required adversarial regression coverage is still absent.** No tests
  for: final-dir symlink containment, pre-existing unwritable dirs, empty
  XDG, block-mode cache derivation under a mask, persistence after the real
  `session_shutdown` handler, background spawn resolving via accessors
  without overrides, the actual non-Linux degrade branch. These are the paths
  where the redesign's guarantees fail — they need coverage.

### Nits
- N1: stale bwrap contract comment (`sandbox-bwrap.ts:31-36`) still says
  session_start validates a non-tmpfs backing store — contradicts the scope
  cut.
- N2: the `SessionInit` success variant declares `projectTmpDir: string`
  but the host-tmpfs branch supplies `null` — make the type represent both or
  discriminate by backend.
- N3: the B1 test is titled "disk-backed" but creates its fixture under
  `tmpdir()` and proves routing only — rename to "project temp dir".

### Notes
- The two blockers are the SAME bug class the redesign targeted — dual source
  of truth (B2) and a path-validation gap (B1) — surviving on paths the
  redesign didn't re-check. The structural fixes (single source of truth for
  accessors; final-path validation) are the right shape.
- The scope cut itself is sound and both reviewers agreed it aligns with the
  mission docs; the blockers are implementation gaps, not a wrong design.
- Cross-model advisory review ran two fresh-context `openai-codex/gpt-5.6-sol`
  passes (Phase 1 + Phase 2); both converged on the same blockers, which
  raises confidence the findings are real rather than reviewer noise.

## Review findings (round 5, deep two-phase cross-model, 2026-07-14)

Re-reviewed the B1+B2 fixes. Both phases (fresh `gpt-5.6-sol`, Phase 1
completeness + Phase 2 adversarial) converged on the SAME single blocker:
B1's final-path containment check had a logic bug. B2 confirmed fully closed
by both phases.

### Confirmed fixed (round 4)
- **B2 fully closed.** Accessors derive from `activePolicy` (single source of
  truth); module vars gone; every lifecycle branch leaves the accessors
  consistent with the installed policy. Before-init null-policy defaults safely
  fail-close. (Both phases confirmed clean.)
- **B1 pre-existing-symlink defense works.** The `lstatSync` check rejects a
  symlink at the predictable cwd-hash path before `mkdirSync` legitimizes it.

### Blocker (new, fixed this round)

- **R5-B1: the final-path containment check used `&&` and accepted an in-cache
  sibling swap.** `realDir !== expectedDir && !realDir.startsWith(realCacheRoot
  + "/")` rejected only when the path was BOTH unexpected AND outside the cache
  root. An in-cache symlink swap to a SIBLING project dir (under the same cache
  root) passed: unexpected but still beneath `realCacheRoot`. Both reviewers
  traced the exact same race. **Fix**: reject on ANY inequality — `realCacheRoot`
  is already canonical and `cwdKey` is a fixed plain child, so `realDir` must
  EXACTLY equal `join(realCacheRoot, cwdKey)`; any divergence is a symlink/swap.
  (The `lstatSync` defense is the primary guard and catches planted symlinks;
  the exact-equality check is defense-in-depth for the TOCTOU window between
  `lstatSync` and `realpathSync`, which is not deterministically testable
  without race injection but is correct on its own merits.)

### Important (new)
- **R5-I1: B1 regression coverage only exercised the lstatSync defense**, not
  the final-path equality or the verbatim-bind change. Added a sibling-swap
  test (caught by the lstatSync defense — the same planted-symlink shape, just
  targeting an in-cache sibling). The final-path equality check itself is
  defense-in-depth for a TOCTOU window not deterministically testable here.

### Notes
- B2 required no changes this round — confirmed sound by both phases.
- The buildBwrapArgs verbatim-bind (B1 second half) is confirmed clean: dedup
  and deny-overlay ordering preserved.
- Convergence: two independent fresh-context reviewers found the same single
  logic bug, which is strong signal it's real and now fixed.

## Review (2026-07-14, round 6)

**Verdict**: Approve

**Blockers**: none (R5-B1 fixed this round)
**Important**: none
**Nits**: none

**Notes**: Deep lane, single fresh-context `openai-codex/gpt-5.6-sol`
convergence pass over the narrow `!==` fix. Confirmed: `realDir !==
expectedDir` is correct (no false fail-close — `join()` and `realpathSync()`
produce identical paths for a legitimate directory with a canonical parent +
plain hex child); the in-cache sibling swap is closed; the residual
post-realpathSync TOCTOU is an acceptable documented residual, not a logic
error. B2 confirmed closed in round 5. Full suite 338 pass / 0 fail. Item
advanced to `stage: done`.

### Final state of the two blocker bug classes
- **Detection fail-open (rounds 1–3)**: killed by the scope cut (operator-
  asserts backing store; no runtime fs-type gate to fail open).
- **Accessor/policy divergence (B1/R2-B2/B2)**: killed structurally — accessors
  derive from `activePolicy` (single source of truth); final-path validation
  uses exact equality.
- **Path-validation gap (B1)**: closed — lstatSync rejects planted symlinks;
  exact-equality check is defense-in-depth for the TOCTOU window.

### Deferred (parked in backlog, not blockers)
- I1 safe-writability check, I2 empty-XDG semantics, I3 findmnt command,
  I4 tmpfs startup warning, I5 /sandbox effective-path, I6 regression coverage.
  These are real but non-blocking; picked up separately.

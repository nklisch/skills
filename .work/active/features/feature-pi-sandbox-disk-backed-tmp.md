---
id: feature-pi-sandbox-disk-backed-tmp
kind: feature
stage: implementing
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
  `~/.cache/pi-sandbox/tmp/` when `XDG_CACHE_HOME` is unset). Confirm it lives
  on a non-tmpfs backing store; if the resolved root is on tmpfs, fail closed
  with a clear message (the whole point is disk).
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
- Integration test: a sandboxed `mktemp -d` lands under the disk dir, not
  `/tmp`; and the dir is on disk (stat the backing device, reject tmpfs).
- No cleanup: the project temp dir persists across sessions.
- Fail-closed: `session-disk` with no `projectTmpDir` threaded through does
  not silently fall back to host `/tmp`.

### Docs (`plugins/pi-sandbox/README.md`, `docs/THREAT_MODEL.md`)

Document `filesystem.tmpBackend`, the default-disk posture, the per-project
lifecycle (no cleanup — dir persists across sessions), and the security
improvement (narrower writable surface: children no longer see host `/tmp`
accumulated files/sockets in open mode). Note the block-mode behavior change
(temp → disk, masks preserved).

## Acceptance

- [ ] `filesystem.tmpBackend` config field exists, defaults to `"session-disk"`,
      validates against `["session-disk", "host-tmpfs"]`.
- [ ] Sandboxed children's `TMPDIR` points at a disk-backed per-project dir;
      `mktemp -d` inside a sandboxed bash lands on disk, not tmpfs.
- [ ] Open mode no longer binds host `/tmp` through under `session-disk`
      (narrower writable surface).
- [ ] Block mode keeps the `/tmp` + socket-dir tmpfs masks under `session-disk`
      (IPC isolation preserved) while `TMPDIR` points at the disk dir.
- [ ] No cleanup: the project temp dir persists across sessions; `session_shutdown` leaves it in place.
- [ ] `host-tmpfs` opt-out preserves today's exact behavior (regression guard).
- [ ] Fail-closed when `session-disk` is set but the cache root resolves to
      tmpfs, or when `projectTmpDir` is not threaded through.
- [ ] Background/monitor path resolves `projectTmpDir` under `session-disk`
      (via the accessor) — a `background`/`monitor`/`jobs` command does not
      throw fail-closed under the default. Wired in the same change as the
      default flip, not deferred.
- [ ] Existing block-mode tests updated; README + THREAT_MODEL document the
      change and the security improvement.

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

### Unit 4: `session_start` derives the cwd-keyed dir; no cleanup
**File**: `plugins/pi-sandbox/extensions/sandbox.ts`

New module-level state (mirroring `pinnedBwrapPath`):
```ts
let projectTmpDir: string | null = null;
```

At `session_start`, after config loads and the platform is Linux + bwrap is
resolved, when `config.filesystem?.tmpBackend ?? "session-disk" === "session-disk"`:
1. Resolve the cache root: `const cacheRoot = join(process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), "pi-sandbox", "tmp")`.
2. `mkdirSync(cacheRoot, { recursive: true })`.
3. **Disk check** (fail-closed): compare `statSync(cacheRoot).dev` against
   `statSync("/tmp").dev` and `statSync("/dev/shm").dev` — if equal to either,
   the cache root is on tmpfs; fail-closed with `ctx.ui.notify` + status
   (the whole point is disk). One-line check; catches the real misconfig
   where `~/.cache` is accidentally on tmpfs, which would silently re-defeat
   the whole point.
4. **Derive the per-project dir from the canonical cwd** (NOT `mkdtemp` — the
   dir must be stable + shared across concurrent sessions in the same project):
   - `const cwdKey = createHash("sha256").update(realpathSync(ctx.cwd)).digest("hex").slice(0, 16)`
   - `projectTmpDir = join(cacheRoot, cwdKey)`
   - `mkdirSync(projectTmpDir, { recursive: true })`
   - 16-char truncation of the sha256 of the realpath: stable, filesystem-safe,
     collision-resistant. The realpath resolves symlinks so two sessions whose
     cwd differs only by a symlink bind to the same project dir.
5. Pin `projectTmpDir` + `tmpBackend` onto `sandboxPolicy`.

**No cleanup.** The dir is per-project (bounded by project count, small), temp
files are created and deleted by their processes normally, and the orphaned-WAL
case is ~850KB files on a 26G disk. The dir persists and stays warm across
sessions — which is what you want. If disk growth ever matters, OS tooling
(`systemd-tmpfiles`, a cron) is the standard answer for cache-dir hygiene, not
a custom protocol baked into a sandbox extension. No sweep, no pidfiles, no
liveness checks, no `session_shutdown` removal.

Reset `projectTmpDir = null` at every early-return branch in `session_start`
(no-sandbox, parse error, disabled, degrade, fail-closed) — match the existing
reset pattern for `pinnedBwrapPath`. No `session_shutdown` temp-dir action
needed (the dir outlives the session by design).

**Acceptance Criteria**:
- [ ] `session_start` creates `~/.cache/pi-sandbox/tmp/<cwd-hash>/` under `session-disk`.
- [ ] Two sessions with the same realpath cwd resolve to the SAME `projectTmpDir`.
- [ ] Two sessions with different cwds resolve to DIFFERENT dirs.
- [ ] Cache root on tmpfs → fail-closed with a clear status, no project temp dir bound.
- [ ] Early-return branches reset `projectTmpDir = null`.
- [ ] `session_shutdown` leaves the project temp dir in place.


### Unit 5: Tests
**File**: `plugins/pi-sandbox/extensions/sandbox-bwrap.test.ts`, `sandbox.test.ts`

Arg-level + integration:
- `session-disk` open mode: `--bind <dir> <dir>` + `--setenv TMPDIR <dir>`, no `--bind /tmp /tmp`.
- `session-disk` block mode: `/tmp` tmpfs mask present, `--setenv TMPDIR <dir>`, disk dir bound.
- `session-disk` + missing `projectTmpDir` → throws.
- `host-tmpfs` open: `--bind /tmp /tmp` present (regression guard).
- `host-tmpfs` block: `--setenv TMPDIR /tmp` (regression guard; existing tests at `sandbox.test.ts:2174` arg-level + `sandbox.test.ts:3183` integration kept, conditioned on `host-tmpfs`).
- Integration: sandboxed `mktemp -d` lands under the session dir; `stat -c %m` /
  `findmnt` confirms it's not tmpfs-backed.
- Integration: the project temp dir persists across a `session_shutdown`.
- Fail-closed: cache root forced onto tmpfs (test fixture) → fail-closed status, no bind.

**Acceptance Criteria**:
- [ ] All the above pass; existing block-mode `TMPDIR=/tmp` test updated to be
  `host-tmpfs`-conditional (it now only holds under `host-tmpfs`).

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
  tmpfs size) is replaced by disk quota for the session dir.

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
- **Disk-backing check is heuristic.** Comparing `st_dev` against `/tmp` and
  `/dev/shm` catches the common case (cache root accidentally on tmpfs) but
  isn't a general "is this real disk" test. Acceptable: the failure mode is
  fail-closed with a clear message, not silent RAM use. Document the heuristic.
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

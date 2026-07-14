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
updated: 2026-07-13
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
per-session dir**, bind *that* dir (not host `/tmp`) into the sandbox, and
clean it up at session end. This both removes the RAM pressure and narrows
the writable surface (children see only their own temp, not the host's
accumulated orphaned SQLite sidecars, ssh-agent sockets, etc.).

## Strategic decisions

- **Default to disk.** `filesystem.tmpBackend` defaults to `"session-disk"`
  (not `"host-tmpfs"`). The sandbox extension has not yet merged to `main`
  and the operator is the only user, so changing the default carries no
  compatibility cost and delivers the memory win out of the box. `"host-tmpfs"`
  is retained as an explicit opt-out for the current behavior.
- **Per-session lifecycle with startup sweep.** Create the session temp dir
  at `session_start` (mirroring the pinned-git-dirs pattern: computed once,
  threaded through per-command spawns as trusted init state), `rmSync` it at
  `session_end`. Best-effort cleanup — a crashed session leaves the dir
  behind, so a startup sweep removes stale dirs older than N hours (default
  24h) from the cache root. Confirmed acceptable by the operator.
- **Block-mode shape: keep `/tmp` masked, redirect `TMPDIR` to the disk dir.**
  Block mode currently forces `TMPDIR=/tmp` and masks `/tmp` with tmpfs to
  block host Unix sockets. With `session-disk`, block mode keeps the `/tmp`
  (and `/run`, `/var/run`, `/var/tmp`, `/tmp/.X11-unix`) tmpfs masks so a
  blocked child still cannot reach host IPC, but sets `TMPDIR=<sessionTmpDir>`
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
   *  "session-disk" (default): per-session dir on disk, bound + TMPDIR set.
   *  "host-tmpfs": current behavior — bind host /tmp through (open) or mask
   *  with tmpfs (block). */
  tmpBackend?: "session-disk" | "host-tmpfs";
}
```

Default in `DEFAULT_CONFIG.filesystem`: `tmpBackend: "session-disk"`.

### `buildBwrapArgs` (`sandbox-bwrap.ts`)

When `tmpBackend === "session-disk"` (and a `sessionTmpDir` is provided):
- Emit `--bind <sessionTmpDir> <sessionTmpDir>` (writable, disk-backed).
- Set `TMPDIR=<sessionTmpDir>` in the child env for BOTH open and block modes
  (overriding the block-mode `TMPDIR=/tmp` forcing — the disk dir replaces
  the masked tmpfs as the canonical temp dir).
- In open mode, do NOT bind host `/tmp` through. The session temp dir replaces
  it. (Today, `allowWrite:["/tmp"]` + open mode binds host `/tmp`; with
  `session-disk`, `/tmp` is no longer auto-bound even if listed in
  `allowWrite` — the session dir is the temp target instead.)
- In block mode, KEEP the `/tmp` + `/run` + `/var/run` + `/var/tmp` +
  `/tmp/.X11-unix` tmpfs masks (IPC isolation preserved), but `TMPDIR` points
  at the bound disk dir, not `/tmp`.

`buildBwrapArgs` needs a new optional `sessionTmpDir?: string` field on
`BuildBwrapArgsOptions`. When `tmpBackend === "session-disk"` and
`sessionTmpDir` is absent, fail closed (the caller must always thread it
through — same trusted-init-state discipline as `pinnedGitDirs`).

### `session_start` / `session_end` (`sandbox.ts`)

At `session_start`, when `tmpBackend === "session-disk"`:
- Resolve the cache root: `$XDG_CACHE_HOME/pi-sandbox/tmp/` (fall back to
  `~/.cache/pi-sandbox/tmp/` when `XDG_CACHE_HOME` is unset). Confirm it lives
  on a non-tmpfs backing store; if the resolved root is on tmpfs, fail closed
  with a clear message (the whole point is disk).
- `mkdtempSync` a per-session subdir, stash the path on the sandbox policy,
  pass it as `sessionTmpDir` to every `buildBwrapArgs` / `buildSandboxedSpawnArgs`
  call.
- Run the startup sweep: remove sibling dirs under the cache root older than
  `tmpStaleHours` (default 24h) — best-effort, swallow ENOENT/EACCES.

At `session_end`: `rmSync(sessionTmpDir, { recursive: true, force: true })`.

### Tests (`sandbox.test.ts`, `sandbox-bwrap.test.ts`)

- `tmpBackend: "session-disk"` emits `--bind <dir> <dir>` + `--setenv TMPDIR <dir>`,
  and does NOT emit `--bind /tmp /tmp` in open mode.
- `tmpBackend: "host-tmpfs"` preserves today's behavior exactly (regression
  guard for the default-swap).
- Block mode + `session-disk`: keeps `/tmp` tmpfs mask, sets `TMPDIR=<dir>`,
  binds the disk dir. Update the existing block-mode `TMPDIR=/tmp` test
  (`sandbox.test.ts:3183`) to assert the disk dir under `session-disk` and
  keep asserting `/tmp` under `host-tmpfs`.
- Integration test: a sandboxed `mktemp -d` lands under the disk dir, not
  `/tmp`; and the dir is on disk (stat the backing device, reject tmpfs).
- Startup sweep: stale dirs are removed, the current session's dir survives.
- Fail-closed: `session-disk` with no `sessionTmpDir` threaded through does
  not silently fall back to host `/tmp`.

### Docs (`plugins/pi-sandbox/README.md`, `docs/THREAT_MODEL.md`)

Document `filesystem.tmpBackend`, the default-disk posture, the per-session
lifecycle + startup sweep, and the security improvement (narrower writable
surface: children no longer see host `/tmp` accumulated files/sockets in
open mode). Note the block-mode behavior change (temp → disk, masks
preserved). Note the best-effort cleanup residual (crash leaves a dir;
startup sweep reclaims it).

## Acceptance

- [ ] `filesystem.tmpBackend` config field exists, defaults to `"session-disk"`,
      validates against `["session-disk", "host-tmpfs"]`.
- [ ] Sandboxed children's `TMPDIR` points at a disk-backed per-session dir;
      `mktemp -d` inside a sandboxed bash lands on disk, not tmpfs.
- [ ] Open mode no longer binds host `/tmp` through under `session-disk`
      (narrower writable surface).
- [ ] Block mode keeps the `/tmp` + socket-dir tmpfs masks under `session-disk`
      (IPC isolation preserved) while `TMPDIR` points at the disk dir.
- [ ] `session_end` removes the session temp dir; a startup sweep reclaims
      stale dirs older than the configured threshold.
- [ ] `host-tmpfs` opt-out preserves today's exact behavior (regression guard).
- [ ] Fail-closed when `session-disk` is set but the cache root resolves to
      tmpfs, or when `sessionTmpDir` is not threaded through.
- [ ] Existing block-mode tests updated; README + THREAT_MODEL document the
      change and the security improvement.

## Architectural choice

**Thread a session temp dir through the same trusted-init-state path as
`pinnedGitDirs`.** Compute the disk-backed per-session temp dir once at
`session_start`, pin it on `SandboxPolicy`, and pass it to every
`buildBwrapArgs` call (both the bash-ops path and `buildSandboxedSpawnArgs`).
`buildBwrapArgs` binds it writable + sets `TMPDIR` to it. Cleanup happens in
`session_shutdown`, with a startup sweep for crash recovery.

Why over alternatives:
- *Global `TMPDIR` env override at process level* — rejected: the sandbox
  extension deliberately leaves `process.env` untouched at `session_start`
  (documented invariant); a global override would also leak into the
  unsandboxed/degraded spawn paths.
- *Mount a tmpfs at `/tmp` sized to disk via `--size`* — rejected: bwrap
  `--tmpfs` is RAM-backed regardless; `--size` caps it but doesn't move it to
  disk. Doesn't solve the memory pressure.
- *Bind host `/var/tmp` through as the temp dir* — rejected: still a shared
  host path (cross-session accumulation, host socket exposure); the per-session
  dir is narrower and self-cleaning.

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
	 *  - "session-disk" (default): per-session dir on a disk-backed cache root,
	 *    bound writable + TMPDIR set to it. Open mode does NOT bind host /tmp.
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

### Unit 2: `sessionTmpDir` flows through `BuildBwrapArgsOptions` + `buildBwrapArgs`
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
	 *  validates that. */
	sessionTmpDir?: string;
	/** "session-disk" | "host-tmpfs"; defaults to "session-disk". When
	 *  "session-disk" and sessionTmpDir is absent, THROW (fail-closed): the
	 *  caller must thread it through. */
	tmpBackend?: "session-disk" | "host-tmpfs";
}
```

Behavior in `buildBwrapArgs`:
- Resolve `tmpBackend = opts.tmpBackend ?? "session-disk"`.
- If `tmpBackend === "session-disk"`:
  - If `opts.sessionTmpDir` is absent → **throw** (fail-closed: caller
    forgot to thread the pinned session temp dir; never silently fall back
    to host `/tmp`).
  - Emit `--bind <sessionTmpDir> <sessionTmpDir>` (writable, disk-backed).
  - Set `childEnv.TMPDIR = <sessionTmpDir>` for BOTH open and block modes
    (overrides the block-mode `TMPDIR=/tmp` forcing at line 50).
  - Open mode: do NOT bind host `/tmp` even if it appears in `allowWrite`.
    Filter `/tmp` (and `/var/tmp`) out of the `allowWrite`-derived binds when
    `session-disk` is active — the session dir is the temp target. (If an
    operator genuinely needs host `/tmp` readable, that's `host-tmpfs`.)
  - Block mode: keep the existing `/tmp` + `/run` + `/var/run` + `/var/tmp` +
    `/tmp/.X11-unix` tmpfs masks (IPC isolation preserved); only `TMPDIR`
    changes destination.
- If `tmpBackend === "host-tmpfs"`: today's behavior, byte-for-byte (the
  `--bind /tmp /tmp` open-mode bind and the block-mode `TMPDIR=/tmp`
  forcing both stand). This is the regression-guard branch.

**Acceptance Criteria**:
- [ ] `session-disk` + `sessionTmpDir` present: emits `--bind <dir> <dir>` + `--setenv TMPDIR <dir>`; no `--bind /tmp /tmp` in open mode.
- [ ] `session-disk` + `sessionTmpDir` absent: throws (fail-closed).
- [ ] `host-tmpfs`: open-mode binds `/tmp` through and block-mode forces `TMPDIR=/tmp` — unchanged.
- [ ] Block mode + `session-disk`: `/tmp` tmpfs mask still emitted; `TMPDIR` points at the disk dir.

### Unit 3: `sessionTmpDir` on `SandboxPolicy` + threaded through both spawn paths
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
	/** Pinned per-session disk-backed temp dir (trusted init state) when
	 *  tmpBackend==="session-disk"; null for host-tmpfs and for the
	 *  fail-closed/permissive policies. Bound writable + TMPDIR set to it
	 *  by buildBwrapArgs. */
	sessionTmpDir: string | null;
	/** Mirrors config; drives buildBwrapArgs branch selection. */
	tmpBackend: "session-disk" | "host-tmpfs";
}
```

`createFailClosedPolicy` and `createPermissivePolicy` set
`sessionTmpDir: null, tmpBackend: "host-tmpfs"` (these policies don't run
bwrap with a session temp dir; fail-closed refuses bash, permissive is the
explicit-disable path).

In `createSandboxedBashOps` (`sandbox.ts:189`): pass `sessionTmpDir:
policy.sessionTmpDir ?? undefined` and `tmpBackend: policy.tmpBackend` into
`buildBwrapArgs`.

In `buildSandboxedSpawnArgs` (`sandbox-spawn.ts`): add optional
`sessionTmpDir?: string | null` + `tmpBackend?` on `SandboxSpawnOptions`,
thread them into `buildBwrapArgs`. The background-tasks bridge (caller of
`buildSandboxedSpawnArgs`) must pass the pinned session temp dir; this is the
same trust boundary as `pinnedGitDirs` (which background/monitor currently
leaves unset — note this as a known gap, see Risks).

**Acceptance Criteria**:
- [ ] `SandboxPolicy` carries `sessionTmpDir` + `tmpBackend`; fail-closed/permissive policies null them.
- [ ] Bash-ops path threads both into `buildBwrapArgs`.
- [ ] `buildSandboxedSpawnArgs` accepts + threads both.

### Unit 4: `session_start` creates the dir; `session_shutdown` cleans it; startup sweep
**File**: `plugins/pi-sandbox/extensions/sandbox.ts`

New module-level state (mirroring `pinnedBwrapPath`):
```ts
let sessionTmpDir: string | null = null;
```

At `session_start`, after config loads and the platform is Linux + bwrap is
resolved, when `config.filesystem?.tmpBackend ?? "session-disk" === "session-disk"`:
1. Resolve the cache root: `const cacheRoot = join(process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), "pi-sandbox", "tmp")`.
2. `mkdirSync(cacheRoot, { recursive: true })`.
3. **Disk check** (fail-closed): `statfs`/`stat` the root and reject if it's
   tmpfs. Concretely, compare `statSync(cacheRoot).dev` against `statSync("/tmp").dev`
   and `statSync("/dev/shm").dev` — if equal to either, fail-closed with
   `ctx.ui.notify` + status (the whole point is disk). Document the exact check.
4. `sessionTmpDir = mkdtempSync(join(cacheRoot, "session-"))`.
5. **Startup sweep**: readdir the cache root, `stat` each `session-*` sibling,
   `rmSync(..., { recursive: true, force: true })` any whose mtime is older
   than `TMP_STALE_HOURS` (const, default 24). Best-effort: swallow `ENOENT`/
   `EACCES` per entry (concurrent sweep by a sibling session is fine).
6. Pin `sessionTmpDir` + `tmpBackend` onto `sandboxPolicy`.

At `session_shutdown` (`sandbox.ts` ~line 735): add
`if (sessionTmpDir) { rmSync(sessionTmpDir, { recursive: true, force: true }); sessionTmpDir = null; }`
at the top, before the existing state reset. (Best-effort cleanup; a
`SIGKILL` leaves the dir — the startup sweep reclaims it next session.)

Also reset `sessionTmpDir = null` at every early-return branch in
`session_start` (no-sandbox, parse error, disabled, degrade, fail-closed) —
match the existing reset pattern for `pinnedBwrapPath`.

**Acceptance Criteria**:
- [ ] `session_start` creates `~/.cache/pi-sandbox/tmp/session-XXXX/` under `session-disk`.
- [ ] Cache root on tmpfs → fail-closed with a clear status, no session temp dir bound.
- [ ] Stale `session-*` siblings older than 24h removed at startup; current session's dir survives.
- [ ] `session_shutdown` removes the session temp dir.
- [ ] Early-return branches reset `sessionTmpDir = null`.

### Unit 5: Tests
**File**: `plugins/pi-sandbox/extensions/sandbox-bwrap.test.ts`, `sandbox.test.ts`

Arg-level + integration:
- `session-disk` open mode: `--bind <dir> <dir>` + `--setenv TMPDIR <dir>`, no `--bind /tmp /tmp`.
- `session-disk` block mode: `/tmp` tmpfs mask present, `--setenv TMPDIR <dir>`, disk dir bound.
- `session-disk` + missing `sessionTmpDir` → throws.
- `host-tmpfs` open: `--bind /tmp /tmp` present (regression guard).
- `host-tmpfs` block: `--setenv TMPDIR /tmp` (regression guard, existing test at `sandbox.test.ts:3183` kept).
- Integration: sandboxed `mktemp -d` lands under the session dir; `stat -c %m` /
  `findmnt` confirms it's not tmpfs-backed.
- Integration: `session_shutdown` removes the dir.
- Startup sweep: a synthetic stale `session-*` dir is removed; a fresh one survives.
- Fail-closed: cache root forced onto tmpfs (test fixture) → fail-closed status, no bind.

**Acceptance Criteria**:
- [ ] All the above pass; existing block-mode `TMPDIR=/tmp` test updated to be
  `host-tmpfs`-conditional (it now only holds under `host-tmpfs`).

### Unit 6: Docs
**File**: `plugins/pi-sandbox/README.md`, `plugins/pi-sandbox/docs/THREAT_MODEL.md`

README `## Configuration` + `## Network modes`:
- Document `filesystem.tmpBackend`, default `session-disk`, the `host-tmpfs`
  opt-out, the per-session lifecycle, and the 24h startup sweep.
- Update the `block` mode paragraph: `TMPDIR` now points at the disk-backed
  session temp dir under `session-disk` (default); the `/tmp` tmpfs mask
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
4. Unit 4 — `session_start`/`session_shutdown` lifecycle + startup sweep (depends on 2+3)
5. Unit 5 — tests (accrue across 2-4; the integration tests need 4)
6. Unit 6 — docs (last; reflects the landed behavior)

## Testing

See Unit 5. Strategy: arg-list tests for `buildBwrapArgs` branching (fast,
exhaustive, no bwrap needed) + a small number of real-bwrap integration tests
for the disk-destination and lifecycle claims (the existing
`integrationTest` helper in `sandbox.test.ts` already runs real bwrap).

## Risks

- **Background/monitor spawn path threads `sessionTmpDir`.** The bash path
  gets it from `activePolicy`; `buildSandboxedSpawnArgs` is called by the
  background-tasks bridge, which must read the pinned `sessionTmpDir` and
  pass it. Today background/monitor leaves `pinnedGitDirs` unset (documented
  gap), so there's no existing pattern for threading session-pinned state to
  that caller. **Mitigation**: the bridge already imports from the sandbox
  extension; expose a `getSessionTmpDir()` accessor (mirroring how it reads
  capability state) and have the bridge call it. If the bridge can't read it,
  `buildSandboxedSpawnArgs` under `session-disk` with no `sessionTmpDir`
  throws fail-closed — safe but breaks background tasks. Land the accessor in
  Unit 3, wire the bridge in Unit 4.
- **Disk-backing check is heuristic.** Comparing `st_dev` against `/tmp` and
  `/dev/shm` catches the common case (cache root accidentally on tmpfs) but
  isn't a general "is this real disk" test. Acceptable: the failure mode is
  fail-closed with a clear message, not silent RAM use. Document the heuristic.
- **Concurrent sessions.** Two pi sessions on the same machine each get their
  own `session-*` dir (mkdtemp guarantees uniqueness); the startup sweep must
  not remove a live sibling's dir. **Mitigation**: the sweep checks mtime only
  (24h threshold) and a live session's dir is touched constantly by temp
  writes, so its mtime is recent. Edge case: a session idle for >24h could
  have its dir swept — acceptable (the session would recreate on next spawn).
  Document it.

## Notes

- This also mitigates (does not fix) the orphaned-SQLite-WAL accumulation
  surfacing in `/tmp/.tmpXXXXXX-wal` — per-session disk temp means sidecars
  land on disk (no RAM pressure) and get cleaned at session end. The upstream
  leak (a producer opening WAL-mode temp SQLite DBs without `db.close()`) is a
  separate item.
- Builds on `feature-sandbox-first-party-bwrap` (done) and the block-mode
  tmp/socket masking in `story-pi-sandbox-block-mode-tmp-sockets` (done). No
  in-flight dependencies; `depends_on` left empty because the foundation is
  already done on this branch.

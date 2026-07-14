---
id: feature-pi-sandbox-disk-backed-tmp
kind: feature
stage: drafting
tags: [perf, sandbox]
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

This is tagged `[perf]` because the primary motivation is memory (RAM
crashes): it changes where an existing capability (sandboxed bash temp) puts
its files, via a new config knob as the opt-in mechanism. It is not "a new
capability that happens to be fast."

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

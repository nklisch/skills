---
id: epic-agents-rules-autoload-state-concurrency
kind: story
stage: done
tags: [tooling]
parent: epic-agents-rules-autoload
depends_on: []
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Harden hook state-file concurrency/atomicity

## Brief

Filed from the cross-model (Codex) review of `epic-agents-rules-autoload-hook`.
The shared hook state machinery in `hooks/scripts/prompt-context.py` is not safe
under overlapping writers — a pre-existing gap the rules loader now also relies
on:

- `bump_epoch()` then `emit_rules()`/`rules_unseen()` is **not atomic**: each
  reloads and re-saves the whole state file separately (`load_state` →
  `save_state`). Two concurrent hook processes (e.g. two sessions in the same
  repo sharing the state file, or a UserPromptSubmit process that started before
  a PostCompact bump and saves after it) can double-emit rules or overwrite a
  PostCompact epoch bump, suppressing an intended re-injection.
- `save_state()` writes to a **fixed** temp path (`path.with_suffix(".json.tmp")`),
  so overlapping writers can clobber each other's temp file before the atomic
  rename.

Impact is bounded (worst case: rules inject twice, or a session's dedup markers
are lost and rules re-inject — both harmless-ish), so this was an Important, not
a Blocker. But it should be hardened.

## Likely approach (decide in design pass)
- Per-writer unique temp filename (pid + random suffix) before the atomic rename
  — removes the temp-clobber.
- Consider per-session state files (keyed by `session_id`) instead of one shared
  file, or advisory file locking (`fcntl.flock`) around the read-modify-write,
  to remove the whole-file last-writer-wins race.
- Keep it stdlib-only and degrade gracefully where locking is unavailable.

## Acceptance
- Overlapping writers cannot lose another session's state or silently suppress a
  post-compaction re-injection.
- Existing capsule dedup and rules dedup behavior unchanged in the single-writer
  case; the full `test_prompt_context` suite stays green.

## Notes
- Touches shared machinery used by both the principles capsules and the rules
  loader — verify both paths after the change.
- Source: Codex review finding #2 on commit b44d0d2 (recorded in
  `epic-agents-rules-autoload-hook` review record).

## Implementation notes (2026-05-31)

### Design decision: unique-temp + advisory flock with graceful fallback

Chose the **advisory file-lock** path over per-session state files. Rationale:
the shared-file model is load-bearing elsewhere (MAX_SESSIONS eviction, the
single-file dedup story already in the suite) and per-session files would
fragment that and complicate eviction/cleanup. A lock around the existing
read-modify-write is the smaller, lower-risk change that directly closes the
whole-file last-writer-wins race while keeping single-writer behavior identical.

Two changes in `hooks/scripts/prompt-context.py`:

1. **Unique temp in `save_state`.** The temp filename now embeds pid +
   `os.urandom(8).hex()` (`path.with_suffix(f".{pid}.{token}.tmp")`) before the
   atomic `os.replace`, so overlapping writers never clobber each other's temp.
   The write is wrapped in a `try/except OSError` that fails open (best-effort
   `tmp.unlink()` cleanup, no raise) — a failed save must never crash the hook.

2. **`_state_lock(root)` context manager** serializes the full
   load -> mutate -> save cycle via `fcntl.flock(LOCK_EX)` on a sibling
   `<state>.lock` file. Used by `bump_epoch`, `unseen_capsules`, and
   `rules_unseen` (the three read-modify-write call sites). Graceful degradation:
   `fcntl` is import-guarded at module top (set to `None` where absent, e.g.
   Windows); when `None` the manager is a no-op yielding the prior best-effort
   behavior. Any `OSError` acquiring the lock is swallowed and the body proceeds
   unlocked — the hook stays fail-open and always exits 0. The lock is released
   (`LOCK_UN`) and the handle closed in a `finally`, both `suppress(OSError)`.

Portability: stdlib only, no new deps. `fcntl` is POSIX (Linux/macOS — Claude
Code and Codex on those); Windows-class hosts hit the no-op fallback.

### Tests

Added a `StateConcurrencyTest` class to `test_prompt_context.py` (8 tests):
unique-temp path (no fixed `.json.tmp`, distinct names across two saves, pid
embedded, no debris), save_state fail-open on OSError, lock acquire/release
(real flock spy), graceful no-op without fcntl, fail-open on flock OSError,
bump_epoch works without fcntl, two-session no-loss invariant, and a
save/load roundtrip. Existing dedup/rules tests unchanged and still green.

Full suite: **28 tests pass** (20 prior + 8 new) via
`python3 -m unittest test_prompt_context -v`.

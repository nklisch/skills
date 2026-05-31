---
id: epic-agents-rules-autoload-state-concurrency
kind: story
stage: drafting
tags: [tooling]
parent: epic-agents-rules-autoload
depends_on: []
release_binding: null
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

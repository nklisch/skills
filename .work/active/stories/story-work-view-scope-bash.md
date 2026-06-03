---
id: story-work-view-scope-bash
kind: story
stage: done
tags: [tooling]
parent: feature-work-view-scope
depends_on: [story-work-view-scope-cli]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Rust-only: drop bash parity coupling (work-view.sh frozen as degraded fallback)

## Scope (repurposed mid-feature)

Original plan was to mirror `--scope` into `scripts/work-view.sh` and keep
byte-parity. **User decision:** stop maintaining bash parity and use this as the
point to make the Rust binary the sole canonical work-view. `--scope` is
Rust-only; `work-view.sh` stays as a frozen, degraded install fallback (no
`--scope`, no board) for platforms without a prebuilt binary.

Full retirement of the bash fallback (delete the script, redesign the
install-work-view.sh fallback, drop the bump-version.sh version projection,
rewrite foundation docs) is **out of scope here** — parked as its own designed
epic (`epic-retire-bash-work-view`).

## Changes (done — at review)

- Removed the entire bash-parity test surface from
  `crates/cli/tests/integration.rs`: the `bash_run` helper, `BASH_SCRIPT`
  const, the core/expanded/empty-partition/cat parity matrix, and the two
  `parity_version_*_matches_bash` tests (~479 lines). The Rust-only `--version`
  shape tests and the `.work-view-version`<->plugin.json lockstep test remain.
- Softened the `--version` test-section comment to drop the byte-parity claim
  and point at the parked retirement epic.
- Softened source doc-comments that claimed enforced parity: `args.rs` module
  header and `filter.rs` `Match` doc.
- Added a `FROZEN DEGRADED FALLBACK` banner to `work-view.sh`'s header stating it
  lacks `--scope`/board and that parity is no longer enforced.

## Acceptance criteria

- `rg "bash_run|BASH_SCRIPT|parity_.*_matches_bash" integration.rs` → none.
- Full `cargo test` green without the parity matrix (300 tests).
- `work-view.sh` left functional (frozen), with an honest degraded-fallback note.
- A parked epic captures the full bash retirement.

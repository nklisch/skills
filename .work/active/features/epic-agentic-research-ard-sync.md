---
id: epic-agentic-research-ard-sync
kind: feature
stage: drafting
tags: [tooling]
parent: epic-agentic-research
depends_on: [epic-agentic-research-foundation-docs]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# ARD upstream-version sync

## Brief
A repeatable way to absorb ARD upstream version bumps, instead of hand-auditing each
one. This feature was surfaced by a real episode: ARD bumped v0.1 → v0.2 mid-adoption,
and absorbing it meant cloning two ARD states, diffing by hand, and editing ~12
scattered "adopts ARD v0.1" pins. That should be a one-liner next time.

The feature has two parts:
1. **A single-source provenance record** — consolidate the scattered "adopts ARD vX"
   strings into ONE place (e.g. `plugins/agentic-research/ARD_UPSTREAM` or a manifest
   field) recording `{ard_version, ard_commit_sha, vendored_paths}`. The manifests /
   READMEs reference the concept; the version lives in one spot.
2. **An `ard-sync` drift tool** — fetch a target ARD version, diff the vendored
   surface (templates, `lint-citations.py`, and the adapted SPEC/CATALOGS docs)
   against the recorded snapshot, report drift, and guide the re-sync + re-verify
   (run the lint smoke test as conformance) + plugin-semver bump.

Implements the sync **policy** defined by `foundation-docs` (the ARD-axis → plugin
action mapping; the decoupled-semver rule). Keeps the two version axes decoupled: the
plugin bumps its OWN semver when it changes; the ARD version is metadata.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: maintenance/operability feature — a follow-on, not on the critical
  path for the initial proposal. Depends on `foundation-docs` (which defines the
  policy this tool enforces).

## Foundation references
- `foundation-docs` feature — owns the versioning-reconciliation **policy** this implements.
- `scripts/bump-version.sh` — the plugin's own semver mechanism (decoupled from ARD's version).
- `plugins/agile-workflow/work-view/` — precedent for a plugin-shipped tool + its tests.

## Design inputs (carried forward)
- **Leverage the ARD-side packaging improvements.** A prompt was crafted (this
  session) for the ARD repo to add: git tags per release, an `ARD-Version:` stamp in
  the kernel artifacts, a kernel/example split, a machine-readable `catalogs.json`,
  and a conformance fixture set. Once ARD ships those, `ard-sync` becomes near-trivial
  (a `grep ARD-Version` drift check + `git diff <tag>..<tag>` + run ARD's golden
  fixtures). Design `ard-sync` to **use those affordances when present and degrade
  gracefully** (two-clone diff) when the upstream ARD version predates them.
- The v0.1 → v0.2 re-pin (commit on this branch) is the motivating worked example —
  the "after" state should make that a single command.

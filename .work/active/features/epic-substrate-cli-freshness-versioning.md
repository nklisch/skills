---
id: epic-substrate-cli-freshness-versioning
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-cli-freshness
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# work-view self-versioning

## Brief

Give the work-view tool the ability to report its own version, so a deployed
copy can be compared against the plugin. Add a `--version` flag to **both**
implementations: the Rust CLI (`work-view/crates/cli`) and the bash fallback
(`scripts/work-view.sh`). The reported version is the agile-workflow **plugin
version** (from `plugin.json`), so "is this copy current?" is a single string
compare. Extend `scripts/bump-version.sh` to keep the work-view version in
lockstep with `plugin.json` when it bumps, and rebuild the four
`work-view/dist/<triple>/` binaries so the shipped artifacts self-report.

This is the foundational capability the rest of the epic relies on: today
neither implementation accepts `--version` (the dist binary returns
`unknown flag`), so there is no stamp to compare and drift is undetectable. An
unrecognized `--version` from an installed copy is therefore meaningful — it
identifies a pre-versioning artifact as definitely-stale.

Scope boundary: this feature delivers the version *contract and stamp* only. It
does NOT implement the refresh trigger (that's the self-heal feature) or change
the shape of the installed entrypoint (that's the shim feature).

## Epic context
- Parent epic: `epic-substrate-cli-freshness`
- Position in epic: foundation feature — the self-heal and shim features depend
  on this version contract.

## Foundation references
- `plugins/agile-workflow/docs/SPEC.md` — "Version strategy" section rolls
  forward to document the work-view `--version` lockstep contract maintained by
  `bump-version.sh`.
- `plugins/agile-workflow/work-view/crates/cli/src/args.rs` — arg parser that
  gains `--version` (currently rejects it as an unknown flag).
- `plugins/agile-workflow/scripts/work-view.sh` — bash fallback that gains a
  `--version` branch and a lockstep version literal.
- `plugins/agile-workflow/scripts/bump-version.sh` — extended to update the
  work-view version alongside the manifests.

## Open design questions (for feature-design)
- How the Rust binary learns the plugin version at build time — a build-time
  env stamp injected by the dist build, vs. reading a generated version file.
  Lean: build-time env stamp from the plugin version.
- Whether `--version` reports plugin semver only, or also a build/commit
  marker for diagnostics. Lean: plugin semver is sufficient for the staleness
  check; a marker is optional.

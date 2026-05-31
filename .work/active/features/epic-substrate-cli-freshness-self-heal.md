---
id: epic-substrate-cli-freshness-self-heal
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-cli-freshness
depends_on: [epic-substrate-cli-freshness-versioning]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Freshness self-heal (hook + convert)

## Brief

Make the installed work-view refresh itself against the plugin, so a copy can
never silently lag a plugin upgrade. The session hook is the refresh engine:
`hooks/scripts/prompt-context.py` already computes the work-view path and runs
`--ready`/`--blocked`, and hook commands reliably carry `${PLUGIN_ROOT}`. On
SessionStart it reinstalls-if-stale (compare installed `--version` to
`plugin.json`; unrecognized `--version` == pre-versioning == stale); on
UserPromptSubmit it installs-if-missing. The check must be cheap and guarded so
it adds negligible latency.

`convert` runs the same `--version` comparison as a backstop — augmenting or
replacing today's existence-plus-executability-only doctor marker — and performs
the one-time migration: ensure `.work/bin/work-view` is **git-tracked and NOT
gitignored** (harnesses frequently hide gitignored paths from agents, so the
entrypoint must stay visible) and replace any pre-versioning copy in place.
Adjust `install-work-view.sh` only as needed to keep reinstall atomic and
idempotent.

Scope boundary: this feature delivers the reliable refresh mechanism for
whatever artifact is installed. It does NOT change the entrypoint into a
launcher (that's the shim feature). This is the always-works floor that
guarantees no-drift independent of the entrypoint's shape.

## Epic context
- Parent epic: `epic-substrate-cli-freshness`
- Position in epic: depends on the versioning feature (needs the `--version`
  contract). Reliable floor; the shim feature later refines what gets installed.

## Foundation references
- `plugins/agile-workflow/hooks/scripts/prompt-context.py` — the hook that gains
  the self-heal step (already resolves the work-view path and `${PLUGIN_ROOT}`).
- `plugins/agile-workflow/skills/convert/SKILL.md` — the `work_view` doctor
  marker (~L927-930) and reinstall guidance that this feature updates.
- `plugins/agile-workflow/scripts/install-work-view.sh` — the atomic installer
  the hook/convert call.
- `plugins/agile-workflow/docs/ARCHITECTURE.md` (~L26-27) — the `bin/`
  description rolls forward to "installed and kept fresh by the session hook
  with convert as backstop".

## Coordination
- Shares `install-work-view.sh` and the tracked entrypoint with the shim
  feature; the shim depends on this feature to avoid churn on those shared paths.

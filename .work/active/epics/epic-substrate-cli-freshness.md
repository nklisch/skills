---
id: epic-substrate-cli-freshness
kind: epic
stage: drafting
tags: [tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# work-view freshness & anti-drift install lifecycle

## Brief

`convert` provisions the project query tool by running `install-work-view.sh`,
which **copies** a frozen artifact (a platform-matched prebuilt Rust binary, or
the bash `work-view.sh` fallback) into `.work/bin/work-view`. Nothing ever
refreshes that copy when the agile-workflow plugin is upgraded. So a project
converted before a behavior change keeps the old logic indefinitely, and an
agent working there re-derives bugs the plugin already fixed.

The concrete trigger: `epic-substrate-cli-next-actionable` (released 0.8.6)
changed `--ready`/`--blocked` to treat `drafting | implementing | review` as the
actionable stages, matching the autopilot readiness model. A project whose
`.work/bin/work-view` copy predates that change still reports only
`implementing` items as ready — producing the "looks stalled / work-view and
autopilot disagree" confusion the fix was meant to eliminate. The user observed
exactly this from an agent that was "on current" (current *plugin*, stale
*project copy*).

Three structural gaps make the drift silent and unrecoverable:

1. **No self-versioning.** Neither the Rust CLI nor `scripts/work-view.sh`
   accepts `--version` (verified: the dist binary returns `unknown flag`). There
   is no stamp to compare a copy against the plugin.
2. **Existence-only health check.** `convert`'s doctor marker for `work_view`
   checks existence + executability and *explicitly* avoids byte-comparison
   (convert SKILL.md ~L927-930), because a legitimate prebuilt binary differs
   from the bash fallback. So a stale copy passes the doctor forever.
3. **No refresh trigger.** `/plugin update` bumps the plugin; nothing reruns the
   installer for the project's copy. `bump-version.sh` only touches
   `plugin.json`, so even a version stamp would not stay in lockstep without
   work.

This epic establishes a **freshness lifecycle** for the project-side work-view:
the installed tool can report its version, the session hook self-heals it
against the plugin (using its guaranteed `${PLUGIN_ROOT}`), `convert` backstops
the same check, and — gated on verified plugin discovery — the installed
entrypoint becomes a thin launcher that always defers to the plugin's current
binary so the drift class disappears rather than being patched.

The plugin-side distribution model is **already settled** by
`docs/research/substrate-binary-runtime.md` (small committable Rust musl
binaries shipped inside the git-tree plugin under `work-view/dist/<triple>/`,
copied into `.work/bin/` by `install-work-view.sh`). This epic does not revisit
that; it owns the **project-side install/refresh lifecycle** only.

## Strategic decisions

- **Detection + self-heal placement: hook-driven, convert backstop.** The
  existing `hooks/scripts/prompt-context.py` (SessionStart / UserPromptSubmit /
  PostCompact) is the refresh engine — it reliably has `${PLUGIN_ROOT}` and
  already locates and runs `.work/bin/work-view` (`run_work_view(root, "--ready")`,
  `work_view = root/".work"/"bin"/"work-view"`). SessionStart reinstalls-if-stale;
  UserPromptSubmit installs-if-missing. `convert` runs the same check as a
  backstop and performs the one-time migration. — *user-approved.*
- **`.work/bin/work-view` stays git-tracked; refresh = overwrite-in-place. DO
  NOT gitignore it.** Harnesses frequently hide gitignored paths from agents, so
  the entrypoint must remain visible and tracked. Implication: the tracked
  entrypoint must be **content-portable** (a launcher or the bash script — NOT a
  platform-specific binary), so overwriting in place produces clean, portable
  diffs (dirty working tree only on a genuine update, which is the correct
  signal to commit). Any platform-specific prebuilt is a behind-the-scenes local
  optimization, never the tracked file. — *user direction.*
- **Self-versioning underpins detection.** Both implementations gain `--version`
  stamped from the plugin version; `bump-version.sh` keeps them in lockstep. An
  unrecognized `--version` (older artifact predating this work) is treated as
  definitely-stale. — *user-approved (version-aware).*
- **Shim-to-plugin layer is IN SCOPE, gated on a research spike.** The most
  durable anti-drift design is for the tracked entrypoint to be a portable
  launcher that execs the plugin's *current* binary (so logic can never freeze),
  with a tracked portable bash fallback. This depends on Claude Code + Codex
  plugin install-directory discovery paths that must be **verified, not guessed**
  (fast-moving-ecosystem rule). The epic is not "done" until discovery is
  verified and the shim ships or is explicitly ruled out. — *user-selected.*
  - Note the synergy: the launcher *is* the natural answer to "tracked +
    overwrite-in-place" — portable text, stable, agent-visible, clean overwrites.

## Anticipated decomposition (for epic-design to realize)

Sketch only — `epic-design` owns the final feature boundaries and `depends_on`.

- **F1 — work-view self-versioning** `[tooling]` *(foundational)*
  `--version` in the Rust CLI (build-time stamp from the plugin version) and in
  `scripts/work-view.sh` (literal kept in lockstep). Extend `bump-version.sh` to
  update the work-view version alongside `plugin.json`. Rebuild the 4
  `work-view/dist/<triple>/` binaries. Rolls SPEC.md "Version strategy" forward.
  *No deps.*

- **F2 — plugin-discovery research spike** `[tooling]` *(gates F4)*
  Verify how an arbitrary shell can locate the installed agile-workflow plugin
  root for **both** Claude Code and Codex marketplaces (env vars present/absent
  per invocation context, install-dir layouts). Output a reference doc /
  auto-loading skill. If discovery proves unreliable, this spike is what
  explicitly rules the shim out. *No deps.*

- **F3 — hook + convert freshness self-heal** `[tooling]`
  `prompt-context.py`: reinstall-if-stale on SessionStart, install-if-missing on
  UserPromptSubmit, using `${PLUGIN_ROOT}` + the F1 `--version` check; keep cost
  trivial and guarded. `convert`: same `--version` check replaces/augments the
  existence-only doctor marker, plus the one-time migration (ensure tracked, not
  gitignored; replace any pre-versioning copy). `install-work-view.sh`
  adjustments as needed. Rolls ARCHITECTURE.md `bin/` description forward.
  *depends_on: F1.*

- **F4 — shim launcher entrypoint** `[tooling]`
  Replace the frozen-copy entrypoint with a tracked, portable launcher that
  defers to the plugin's current binary (via F2's verified discovery) and falls
  back to a tracked portable bash implementation. Satisfies the
  tracked-and-overwrite-in-place constraint by construction. *depends_on: F1, F2.*

Dependency shape: F1 foundational → F3 (F1) and F4 (F1 + F2); F2 independent and
gates F4.

## Foundation-doc roll-forward

Two assertions describe the system that this epic changes — rolled forward **as
the features land** (per the rolling-foundation principle: docs describe the
system NOW, and today's assertions are still accurate until F1/F3/F4 implement):

- `plugins/agile-workflow/docs/ARCHITECTURE.md` (~L26-27): `bin/` is described as
  "platform-matched prebuilt binary (or bash fallback) … installed by
  install-work-view.sh via convert" → becomes "…installed and kept fresh by the
  session hook (self-heal) with convert as backstop; tracked, portable entrypoint."
- `plugins/agile-workflow/docs/SPEC.md` "Version strategy" → add the work-view
  `--version` lockstep contract maintained by `bump-version.sh`.

(No foundation edit at scope time, by design — see the rolling-foundation
reasoning above.)

## Coordination notes

- `epic-agents-rules-autoload` (which last restructured `prompt-context.py`) is
  **done** — F3 builds on the current hook, no in-flight conflict.
- `prompt-context.py` already computes the work-view path and runs `--ready` /
  `--blocked` (and is already aware that `--ready` now includes review-stage
  items). F3's self-heal slots in right where the hook resolves that path.
- Shares the `work-view` core crate with `epic-substrate-board`; no hard
  dependency, but F1's rebuild of the dist binaries should be coordinated with
  any board-driven crate changes in flight.

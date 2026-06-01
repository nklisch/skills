---
id: epic-substrate-cli-freshness
kind: epic
stage: done
tags: [tooling]
parent: null
depends_on: []
release_binding: 0.9.0
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

## Decomposition

Split by capability, not by layer: versioning is the shared contract, the
discovery spike is an independent research gate, self-heal is the reliable
always-works refresh floor, and the shim is the elegant end-state gated on the
spike. The shim depends on self-heal (not merely parallel to it) because both
modify the shared `install-work-view.sh` + tracked entrypoint, and self-heal
establishes the install/version path the shim then refines — sequencing avoids
churn. F2 (discovery) is the only parallel branch, joining at the shim.

### Child features

- `epic-substrate-cli-freshness-versioning` — `--version` on both
  implementations (plugin-version stamp) + `bump-version.sh` lockstep + rebuilt
  dist binaries — depends on: `[]`
- `epic-substrate-cli-freshness-discovery` — research spike verifying plugin-root
  discovery for Claude Code + Codex; gates the shim — depends on: `[]`
- `epic-substrate-cli-freshness-self-heal` — hook (`prompt-context.py`) +
  `convert` reinstall-if-stale / install-if-missing using the version check;
  one-time migration (tracked, not gitignored) — depends on:
  `[epic-substrate-cli-freshness-versioning]`
- `epic-substrate-cli-freshness-shim` — tracked portable launcher that defers to
  the plugin's current binary, bash fallback; conditional on the discovery
  spike — depends on: `[epic-substrate-cli-freshness-versioning,
  epic-substrate-cli-freshness-discovery, epic-substrate-cli-freshness-self-heal]`

## Design decisions

No *new* epic-level directional ambiguities surfaced in this pass — every
framing choice was pinned during scope (see `## Strategic decisions` above:
detection placement, tracked-not-gitignored, plugin-version stamp, shim-in-scope-
gated). Two remaining choices are feature-design-level and are deliberately
deferred to the child design passes, where the discovery spike's results inform
them:
- **How the Rust binary learns the plugin version at build time** — logged in
  the versioning feature (lean: build-time env stamp).
- **Launcher prefers a local prebuilt sidecar vs. plugin-binary-first with a
  bash-only fallback** — logged in the shim feature; resolve from the discovery
  spike's findings.

## Decomposition risks

- **The shim is conditional.** It proceeds only if the discovery spike confirms
  reliable plugin-root discovery. If not, the shim is explicitly ruled out and
  the epic completes on the self-heal floor alone — that ruled-out decision is a
  valid completion, not a failure.
- **Shared-surface coupling.** Self-heal and the shim both touch
  `install-work-view.sh` and the tracked `.work/bin/work-view` entrypoint. The
  shim's `depends_on: [...self-heal]` sequences them to avoid rework on those
  shared paths.
- **Mostly-linear critical path** (versioning → self-heal → shim, with discovery
  parallel) is honest given the real coupling on the install path and entrypoint
  — not artificial slicing. With only four features, autopilot still parallelizes
  versioning ∥ discovery up front.

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

## Other agent review

One focused cross-model pass (Codex, via `peeragent`, at the user's direction)
reviewed the foundation — the decomposition plus the completed versioning design
— before implementation. Codex broadly validated the shape (versioning
foundation, discovery independent, self-heal after versioning, shim gated on
discovery; plugin-semver as the stale predicate is right). Accepted, substantive
findings and where they were folded:

- **P0 — stale-prebuilt reinstall loop** + **P1 — entrypoint not actually
  portable** (consolidated): the installer copies a platform prebuilt into the
  tracked entrypoint and the decomposition never assigned the "make it portable"
  work. **Folded into the self-heal feature** as a binding constraint — it
  installs the source-stamped **bash** implementation as the portable tracked
  entrypoint and makes `install-work-view.sh` version-aware. This makes
  self-heal-only a coherent end state and reassigns ownership of the
  content-portable entrypoint from the (conditional) shim to self-heal.
- **P0 — CI/bump ordering can't stamp binaries**: the "refresh dist before bump"
  guidance was backwards (pre-bump CI compiles the old stamp). **Folded into the
  versioning bump-lockstep + tests-docs stories**: bump stamps source → CI
  rebuilds from the bumped commit → CI commits binaries; the lag window is
  acceptable only because the entrypoint is the source-current bash.
- **P2 — version-file read ambiguity** (`.trim()` vs raw `include_str!`): pinned
  to no-trailing-newline write + raw include + a test. **Folded into the
  versioning rust-version story.**
- **P2 — bash `--version` blocked by the Bash-4 guard on macOS 3.2**: now
  load-bearing since bash is the portable entrypoint. **Folded into the
  versioning bash-version story** as a POSIX-safe prelude before the guard.

Nothing was rejected as wrong; the review mainly caught that the decomposition
under-delivered on the epic's own content-portable-entrypoint decision. The
consolidated resolution (bash as the project-side entrypoint; the Rust prebuilt
reserved for the plugin-side board and the shim's optional deference) is the
host's call, not a verbatim adoption of Codex's either/or framing.

A second focused Codex pass reviewed the versioning **implementation** (the code
diff, not the design) as the feature's deep-review lane. Accepted and fixed in
commit `0002486`:
- **`bump-version.sh` silent-projection risk**: `sed` exits 0 on no-match, so a
  future refactor of the `WORK_VIEW_VERSION` literal could ship a stale bash
  `--version` while manifests advance. Added a Fail-Fast postcondition assert.
- **Drift test only checked the Claude manifest**: now asserts the stamp equals
  BOTH the Claude and Codex `plugin.json` versions (repo lockstep invariant).
- **Deferred (documented, low severity)**: the bash `--version` POSIX prelude
  handles arg position 1 only on bash 3.2; the contract-critical uses (self-heal
  probe, humans) pass `--version` alone. Independently verified 247 tests green;
  both implementations report `work-view 0.8.7` byte-identically.

## Children complete (2026-05-31)

All child features reached `stage: done`:

- `epic-substrate-cli-freshness-versioning` — work-view `--version` lockstep,
  bump-script projection, and version tests.
- `epic-substrate-cli-freshness-discovery` — plugin-root discovery spike reached
  a reviewed **RULE-OUT** verdict for env-var-free discovery.
- `epic-substrate-cli-freshness-self-heal` — installer, hook, convert, CI, and
  foundation docs deliver the portable bash self-heal floor.
- `epic-substrate-cli-freshness-shim` — explicitly ruled out because the
  discovery dependency failed the feature's own proceed condition.

Feature-level review included a three-pass Claude Opus peer-review loop for
discovery + self-heal. Accepted findings were fixed in commit `e7f52db`: removed
stray scaffolding from the discovery doc, wired convert-routing checks into CI,
strengthened the UserPromptSubmit no-version-probe test, and removed a shell
word-splitting nit in the installer. Verification after fixes:

- `TMPDIR=/home/nathan/dev/skills/.tmp-autopilot bash plugins/agile-workflow/scripts/tests/install-work-view.test.sh`
  (41 passed; system `/tmp` is full)
- `bash plugins/agile-workflow/scripts/tests/convert-install-routing.test.sh`
  (12 passed)
- `cd plugins/agile-workflow/hooks/scripts && python3 -m unittest test_prompt_context -v`
  (39 passed)

## Review (2026-05-31)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: convert quick-reference marker summary lagged the detailed
version-aware doctor prose; fixed in commit `7732692`.

**Notes**: Deep epic review used Claude Opus through peeragent. The reviewer
independently checked all child features, the key artifacts, state consistency,
and reran the three focused test suites with `TMPDIR` redirected because system
`/tmp` is full. Result: versioning, discovery RULE-OUT, self-heal, docs/CI, and
shim rule-out all satisfy the epic acceptance shape. No blockers or important
findings remained after the marker-summary nit fix.

# agile-workflow v0.1.0 — Build Roadmap

**Status: transient.** Plans v0.1.0 only. Deleted after Phase 4 ships in
keeping with rolling-foundation. Future evolution lives in the plugin's
own `.work/` substrate.

Built solo + autopilot via `/workflow`. Each phase is one
`/workflow:design → /workflow:implement-orchestrator` cycle.

---

## Phase 1: Plugin foundation + tooling

**Goal:** Plugin installs via skilltap. Scripts run. Hooks fire (silently
when no substrate). Reference skills and `principles` work on any project.

**Build:**
- Scaffold: `.claude-plugin/plugin.json` (v0.1.0), `README.md`, `CHANGELOG.md`
- `scripts/work-view.sh` — full flag set per SPEC.md, pure bash with
  optional yq/jq enhancement, exit codes 0/1/2/3
- `hooks/hooks.json` plus `session-start-snapshot.sh` and
  `post-tool-use-bump.sh` — both flag-gated by `.work/CONVENTIONS.md`
- `skills/principles/` loading both paradigms from PRINCIPLES.md
- Reference skills carried from `workflow` (mechanical adaptations):
  `research/`, `repo-eval/`, `tool-evaluator/`, `refactor-conventions-creator/`
  (`repo-eval` and `tool-evaluator` were later extracted to `nates-toolkit`;
  `tool-evaluator` is now `agent-reflection`)
- `tap.json` entries for the 5 skills

**Test checkpoint:** `bats tests/work-view.bats` passes — covers each flag
combination, exit codes, and --help. (work-view is the only artifact in
this phase that warrants real testing; everything else is markdown content
or thin shell scripts that get verified by use in later phases.)

---

## Phase 2: Substrate operational skills

**Goal:** Full lifecycle works on a test repo. A user can ideate → convert
→ epicize, then park / scope / fix / design / implement / review a feature
end to end. Self-dogfooding moment: bootstrap agile-workflow's own
`.work/` substrate.

**Build:**
- Bootstrap: `ideate/`, `convert/` (+ migration-paths reference), `epicize/`
- Capture: `park/`, `scope/` (+ sizing reference, foundation-doc roll-forward
  for large scope), `fix/`
- Design family: `design/`, `refactor-design/`, `perf-design/` — all
  tag-routed; descriptions cross-reference each other
- Production + review: `implement/`, `implement-orchestrator/` (respects
  `depends_on`), `review/`
- `tap.json` entries for all 12 skills
- Bootstrap `plugins/agile-workflow/.work/` using the new `convert` skill

**Test checkpoint:** Take a fresh test repo through the full cycle by hand:
ideate → convert → epicize → scope a feature → design it → implement →
review → done. If the cycle completes and the substrate state looks right,
phase passes. No mechanical verification matrix.

---

## Phase 3: Release machinery + autonomous ops

**Goal:** Releases can be cut with all 5 gates running. Autopilot drains
queues respecting dependencies. Bold-refactor scopes architectural refactor
epics on user request.

**Build:**
- `release-deploy/` (+ release-mapping reference)
- 5 gates: `gate-security/`, `gate-tests/`, `gate-cruft/`, `gate-docs/`,
  `gate-patterns/` — each with reference file
- `autopilot/` (+ queue-algorithm and harness-goal references)
- `bold-refactor/` (+ architectural-shifts reference) — user-invocable only
- `tap.json` entries for all 8 skills

**Test checkpoint:** In the test repo from Phase 2, cut a fake release end
to end with `release-deploy` — gates run, items advance, release ships.
Run an autopilot goal against an epic with depends_on chains — order is
respected. That's it.

---

## Phase 4: Real-project dogfooding + ship

**Goal:** v0.1.0 has carried a real project of yours through a complete
cycle and is published.

**Build:**
- Pick a real target project; run the full workflow on it
- Bump plugin to v0.1.0 (if not already); publish via skilltap
- Delete `plugins/agile-workflow/docs/ROADMAP.md`

**Test checkpoint:** Target project shipped its own release via
`/agile-workflow:release-deploy`. Plugin manifest reports v0.1.0. Fresh
`skilltap install nklisch/agile-workflow` works. ROADMAP.md is gone.

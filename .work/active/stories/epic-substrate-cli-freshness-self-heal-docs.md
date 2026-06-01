---
id: epic-substrate-cli-freshness-self-heal-docs
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-cli-freshness-self-heal
depends_on: [epic-substrate-cli-freshness-self-heal-installer, epic-substrate-cli-freshness-self-heal-convert]
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Foundation-doc roll-forward (ARCHITECTURE.md + SPEC.md reconcile)

## Scope

Unit 4 of `epic-substrate-cli-freshness-self-heal`. Roll the foundation docs
forward to describe the system NOW (after Units 1-3 land) and fix the SPEC.md
contradiction flagged by the versioning feature's tests-docs story. See the
parent feature body (Unit 4). Depends on installer + convert so the docs
describe settled behavior.

## Files

- `plugins/agile-workflow/docs/ARCHITECTURE.md` (~L26-27)
- `plugins/agile-workflow/docs/SPEC.md` ("## work-view binary", ~L298-323)

## Key points

1. **ARCHITECTURE.md ~L26-27.** Roll the `bin/` description forward from
   "platform-matched prebuilt binary (or bash fallback) … installed by
   install-work-view.sh via convert" to: the tracked, portable, source-stamped
   **bash** entrypoint installed and kept fresh by the session hook (self-heal)
   with convert as backstop; git-tracked (not gitignored), version-stamped.
2. **SPEC.md "## work-view binary" reconcile.** Two corrections:
   - The project-side entrypoint is the source-stamped bash, not a prebuilt
     selected at install time. Rewrite the install description; describe the
     prebuilt `dist/<triple>/` binaries as plugin-side artifacts (board / shim's
     optional plugin-side deference), not the project tracked entrypoint. Keep
     the triple table (still accurate for plugin-side binaries).
   - Fix the "committed to `dist/` … **before each** `bump-version.sh` call"
     sentence (~L317-319): it contradicts the corrected POST-bump ordering in the
     same file's "### work-view `--version` lockstep" subsection (~L286-296).
     State the POST-bump ordering so the contradiction is gone.

Rolling-Foundation: docs describe NOW; no legacy/changelog notes (git history is
the audit trail).

## Acceptance criteria

- [x] ARCHITECTURE.md `bin/` description names the portable source-stamped bash
      entrypoint kept fresh by the hook with convert backstop.
- [x] SPEC.md "## work-view binary" no longer says convert installs a
      platform-matched prebuilt into the project entrypoint; it distinguishes the
      bash entrypoint from the plugin-side prebuilt.
- [x] SPEC.md "## work-view binary" states the POST-bump dist ordering,
      consistent with the lockstep subsection — the "before each bump-version.sh"
      contradiction is removed.
- [x] No remaining doc asserts the prebuilt is the project-side tracked
      entrypoint or the pre-bump dist ordering.

## Tests

Prose — no automated test. Verify via the acceptance criteria plus `grep -n`:
the "before each `bump-version.sh`" phrasing no longer appears, and the
ARCHITECTURE `bin/` line names the bash entrypoint. A review-time grep suffices.

## Implementation notes

- Files changed: `plugins/agile-workflow/docs/ARCHITECTURE.md`,
  `plugins/agile-workflow/docs/SPEC.md`.
- Tests added: none; docs-only story.
- Verification: `rg` confirmed no stale docs assertion remains that a
  platform-matched prebuilt is installed as the project-side tracked entrypoint,
  and SPEC now states the post-bump dist refresh ordering.
- Rationale: updated ARCHITECTURE in both the `.work/bin/` layout and convert
  skill catalog because the latter also asserted the obsolete project-side
  prebuilt install behavior.
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Review (2026-05-31)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review. Implementation notes include the required
grep checks for stale prebuilt-entrypoint and pre-bump ordering assertions, plus
`git diff --check` on the touched docs and story file.

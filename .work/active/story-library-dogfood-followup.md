---
id: story-library-dogfood-followup
kind: story
status: active
tags: [plugin, coordination]
parent: null
blocked_by: []
related_to: [epic-workbench-research-hardening-knowledge-product-profile, epic-workbench-research-hardening-citation-anchor-stability]
research_refs: []
mock_refs: []
created: 2026-08-22
updated: 2026-08-22
---

# Check in with the library's downstream Workbench adoption

## Brief

`SNC/games/library` adopted Workbench 2026-08-16 (`trial/workbench`, merged to
library main `16eaa49` on 2026-08-22) running the dogfood fork
(`kevoun/dogfood/workbench-research-canon`, local-path Pi install, workbench
v0.8.4+). The loop: library findings flow back the way the collection root did
(patch upstream first, cherry-pick here, record evidence in the items);
upstream moves flow forward as fork refreshes (`git reset --hard` in their
clone, session restart to reload).

Open threads after the 2026-08-22 mesh check-in:

1. **Kennedy precis drive (their next work):** attestation →
   verb-disambiguation brief → wiki citation rendering, live-testing
   `[handle]{N}` vs `[handle]{source}` and closing the `{N}`-anchor half of
   `bug-wiki-citation-hook-unresolved-n-nested-corpora`. First real content
   under the canon (substrate is currently empty-cutover).
2. **Wiki halves remaining:** project scoping and silent-literal (in
   `games/wiki`), after `{N}` anchors close via the drive above.
3. **Post-restart behavior watch:** their running session still had the
   pre-0.8.4 plugin loaded at check-in (operator restarts); watch routing
   scoped to adopted workflows and model-role guidance once restarted.
4. **Operator pushes pending:** library `16eaa49`, wiki `baf9640`, parent SNC
   pointers `e80d48ae` — committed locally, not yet pushed.
5. **Unpredicted signal:** capture anything the canon missed; see the
   check-in log for what has already flowed back.

Record corrections (2026-08-22, from the library): root `AGENTS.md` was never
stale (it lists only root/platform/vigil as agile-workflow-managed); the
wiki's per-project layer specs are steady-state mechanism, not a dual-read
path to collapse. Do not carry either forward. Also: the kennedy precis was
not parked — the conversion silently dropped it (session-start inventory
failed to expand kind subdirs), caught in the ff-merge diff, recovered and
migrated; silent-drop-during-conversion is a workbench setup signal to verify
against main's v0.8.x line.

## Check-in log

- **2026-08-22 (mesh, two-way).** Clone updated to the rebased fork
  (v0.8.4); substrate validates green, 40/40 tests. Adoption merged across
  library/wiki/SNC (pushes pending). Corrections recorded above. Signal
  flowed back: **manifest link grammar** — collection manifests keep links
  collection-relative or prose, never repo-relative; repo-relative links
  dangle when a render surface reshapes the collection into a served tree.
  Canon patched in `§ Collection roots`, the conversion mapping, and the
  guide (workbench v0.8.5).
- **2026-08-22 (second exchange).** v0.8.5 pulled and verified library-side.
  Silent-drop reproduction delivered: a maxdepth directory-walk inventory
  structurally cannot see kind-grouped items (files at depth 3), the
  inherited "active is empty" reading skipped the file census, and
  `git rm -q -r` suppressed the per-file list — only the cutover/ff-merge
  diff review caught it. All four sharpenings landed as setup canon
  (v0.8.6): file-level census of every tier being converted; per-file
  disposition entries (directory-level `git rm -r` with unaccounted files is
  the silent-loss signature); validate-then-remove diffs removed files
  against the manifest and stops on any unaccounted file; never `-q` a
  recursive source-tree removal. The removed-vs-manifest diff is the guard
  that catches the failure even when the inventory misses. Library commits
  to exercising `[handle]{source}` on real material in the kennedy drive
  (INDEX bibliographic record as first use).

## Acceptance

- Check-ins are recorded here — not left in chat history.
- Findings flow back: patch upstream, cherry-pick, record evidence in items.
- The fork's dogfood branch is refreshed whenever this branch moves.

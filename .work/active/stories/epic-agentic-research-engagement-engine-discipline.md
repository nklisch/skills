---
id: epic-agentic-research-engagement-engine-discipline
kind: story
stage: review
tags: [skill]
parent: epic-agentic-research-engagement-engine
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# research-discipline skill + dispatch template (canonical vendor)

## Scope
The canonical-kernel-vendor slice of engagement-engine — Units 1–3 of the parent
feature design. Self-contained verbatim vendor + vendor-map sync; no authored
orchestration logic (that's the sibling `-orchestrator` story).

## Units (see parent feature body for full specs)
- **Unit 1 — `skills/research-discipline/SKILL.md`**: thin Claude wrapper (frontmatter
  `user-invocable: false` + ≤2-para propagation/mapping note) over the **verbatim**
  six-section `kernel/discipline.md` body. The wrapper's propagation story is the
  *inline-dispatch* mechanism (orchestrator inlines the bundle per SPEC §5), NOT the
  example's "skills: frontmatter on agent definitions." Deployment mapping: attestation
  tier = `.research/attestation/<handle>.md`.
- **Unit 2 — `templates/dispatch.md`**: verbatim vendor of `/tmp/ARD/kernel/templates/dispatch.md` (§9 registration shape).
- **Unit 3 — vendor-map sync**: move `kernel/discipline.md` → `skills/research-discipline/SKILL.md` (body) and `kernel/templates/dispatch.md` → `templates/dispatch.md` from `not_yet_vendored` into `vendored_paths` in `ard.json`; add the two rows to `docs/ADOPTION.md`'s vendor map; drop its "(pending)" row.

## Acceptance criteria
- [ ] research-discipline six-section body byte-identical to `/tmp/ARD/kernel/discipline.md` (only the wrapper differs); `ARD-Version: 0.3.0` stamp retained; `user-invocable: false`
- [ ] Wrapper propagation story = inline-dispatch (not skills:-injection)
- [ ] `templates/dispatch.md` byte-identical to upstream
- [ ] `ard.json` `not_yet_vendored` drained; both paths in `vendored_paths`; ADOPTION.md vendor map 1:1 with `ard.json` (re-run the foundation-docs check)
- [ ] `scripts/conformance/run.py` still 15/15 (unaffected)

## Implementation notes
- **Files created**: `skills/research-discipline/SKILL.md` (thin wrapper + verbatim
  six-section body, built by appending `sed -n '/^## 1\./,$p' kernel/discipline.md` so the
  body is byte-identical); `templates/dispatch.md` (verbatim `cp` from kernel).
- **Files changed**: `ard.json` (moved `kernel/discipline.md` → `skills/research-discipline/SKILL.md`
  and `kernel/templates/dispatch.md` → `templates/dispatch.md` into `vendored_paths`;
  `not_yet_vendored` now `{}`; extended `drift_check` grep to include `skills`);
  `docs/ADOPTION.md` (replaced the "(pending)" row with two explicit rows);
  `docs/VERSIONING.md` (drift-grep command now covers `skills`).
- **Discrepancies from design**: one minor in-scope addition — the design's Unit 3 named
  `ard.json` + `ADOPTION.md`, but the discipline stamp lives under `skills/` which the drift
  grep (in both `ard.json` `drift_check` and `VERSIONING.md`) didn't cover. Extended both
  grep paths to include `skills/` so the new `ARD-Version` stamp is drift-checkable.
  Rolling-foundation fix, not a scope expansion.
- **Tests added**: none (verbatim vendor). **Verification**: discipline six-section body +
  `templates/dispatch.md` byte-identical to `/tmp/ARD/kernel/`; `ard.json` valid,
  `not_yet_vendored` drained, `vendored_paths` 9; ADOPTION vendor map 1:1 (9/9); wrapper
  propagation = inline-dispatch + `user-invocable: false`; drift grep finds the discipline
  stamp; conformance 15/15.
- **Adjacent issues parked**: none.

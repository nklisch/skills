---
id: story-gate-stub-regate-alignment
kind: story
stage: review
tags: [release-gates]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-11
updated: 2026-06-11
---

# Align gate bundle-gathers with re-gate semantics; Phase 7 honors terminal-tier retention

Two follow-through fixes to `b116fda`'s re-gate ruling and SPEC §Terminal-tier retention
(branch `fix/gates-stub-regate-alignment`):

1. **Gate alignment** — gate-cruft, gate-security, gate-docs, gate-tests, gate-patterns, and
   bug-scan's gate mode still carried the retired no-re-gate gather
   (`grep -v '\.work/archive/'`), silently dropping late-bound archived stubs from the bundle
   they scan. All six now use gate-refactor's Phase 1 gather (include stubs; skip only the
   `kind: release` orchestration item). Hydration notes (recover a pruned body via
   `git show <git_ref>:<former active path>`) added to the three sub-agent briefs that read
   item bodies (gate-docs, gate-tests, gate-security). Residual no-re-gate prose in convert's
   retention interview aligned too.

2. **Phase 7 retention branch** — release-deploy unconditionally `git rm`'d bound item bodies;
   a `retain-bodies` deployment running the skill as written lost its bodies despite SPEC
   documenting the opt-out. Phase 1 now reads `terminal-tier retention`; Phase 7 disposes per
   mode (delete-refs: prune as before; retain-bodies: `git mv` directly-bound active bodies to
   the release folder, archived bodies stay in place); guardrails, Output, the shipped-items
   table preamble, and Phase 9 staging made mode-aware; `mkdir -p` added before the summary
   `git mv` (failed on first ship of any version). Suite-doc drift in
   `docs/agile-workflow-guide.md` + README release-deploy row swept in the same pass.

## Acceptance criteria

- No `no-re-gate` / archive-exclusion gather remains in any skill.
- The six rewritten gathers are byte-consistent with gate-refactor's canonical block
  (bug-scan's adapted to its bullet context, same semantics).
- `convert-content-integrity.test.sh` and `convert-install-routing.test.sh` pass.
- A `retain-bodies` deployment walking Phase 7 as written keeps all bodies on disk.

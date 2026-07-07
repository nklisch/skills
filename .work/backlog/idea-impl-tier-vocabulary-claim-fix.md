---
id: idea-impl-tier-vocabulary-claim-fix
kind: story
stage: backlog
tags: [docs, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# implement-orchestrator impl-tier vocabulary claim overstated

## Source

Surfaced in the 2026-07-06 deep review of `feature-autopilot-impl-tier`. Important
(not blocking); prose-precision fix.

## Problem

`implement-orchestrator/SKILL.md` claims its implementation-tier dial "mirrors
`deep-code-scan`'s scanner-tier dial so the two read alike." But the two use
different vocabularies:
- `implement-orchestrator` asks for `baseline | raised | highest` (capability
  tiers).
- `deep-code-scan`'s scanner tier is a concrete model enum
  (`opus | mixed | sonnet | codex-high | ...`).

The behavior is workable (both settle a tier dial once and lock it), but the
"vocabulary matches" claim may cause agents/users to expect the same tier names
across the two skills.

## Fix direction

Reword the claim to say implement-orchestrator mirrors the *settle-a-tier-dial-
once pattern* (not the exact vocabulary), or define an explicit mapping between
the capability tiers and concrete model enums.

## Acceptance criteria

- [ ] The SKILL.md claim accurately describes the relationship to deep-code-scan's
      scanner-tier dial (pattern, not vocabulary) OR an explicit mapping is defined

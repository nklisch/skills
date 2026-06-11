<!-- ARD-Version: 0.5.1 -->
# Dispatch registration — template

The dispatch-time registration declaration (ARD SPEC §9). Sets the controls for an engagement. For a single-pass walk this can live in the conversation transcript; for a multi-specialist or multi-campaign walk, persist it as a `dispatch.md` at the campaign root. The nine fields are always present (a uniform shape prevents silent default drift).

```yaml
---
intent: <terminate-in-position | build-substrate | survey-landscape | validate-claim | calibrate-external>
output_kind: <position | synthesis-brief | landscape-brief | attestation | corpus-piece | precis | hypothesis-capture | hypothesis-ledger | vocab-capture | adoption-recommendations | questions-list>   # single value, or a [list] for cascade-producing goals
consumer: <future-agent | future-engagement | methodology-revisers | calibrated-work | ...>
verification_rigor: <floor | standard | full>
temporal_contract: <write-once-on-converge | extend-on-source-rev | supersedes-prior | ttl-bounded | re-engage-on-trigger>
primitives_extends: []        # engagement-specific verb/primitive additions (verb names from ARD SPEC §6)
primitives_opts_out: []       # engagement-specific omissions; each entry carries a one-line rationale
scope_authority: <pre-registered | mixed | in-engagement-judgment>
analytical_artifact_type: <per-campaign-brief | accumulative-ledger>
---

# <engagement seed / question>

Brief statement of the engagement and its decomposition (if multi-specialist).
```

Notes:
- `engagement-unit` is **not** a field — it is discovered at read-time (emergent).
- `disconfirmation-mode` is **not** a field — it derives from `scope_authority`.
- The registration informs engagement (which gates fire, which decision-points activate); it is **not** carried into the output artifacts' frontmatter — artifacts stand on their own metadata.

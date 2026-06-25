<!-- ARD-Version: 0.7.0 -->
# Dispatch registration — template

The dispatch-time registration declaration (ARD SPEC §9). Sets the controls for
an engagement. The registration's existence is invariant; its persistence form is
a deployment choice. A single-pass walk can live in the conversation transcript;
a multi-specialist or multi-campaign walk usually deserves a persisted record.
Use this template wherever the deployment stores that record (for example,
`dispatch.md` at a standalone campaign root, or a commissioning work item that
carries the same controls). The ten fields are always present in a full
registration shape (a uniform shape prevents silent default drift).

```yaml
---
intent: <terminate-in-position | build-substrate | survey-landscape | validate-claim | calibrate-external>
output_kind: <position | synthesis-brief | landscape-brief | attestation | corpus-piece | precis | hypothesis-capture | hypothesis-ledger | vocab-capture | adoption-recommendations | questions-list>   # single value, or a [list] for cascade-producing goals
consumer: <future-agent | future-engagement | methodology-revisers | calibrated-work | ...>
verification_rigor: <floor | standard | full>
temporal_contract: <write-once-on-converge | extend-on-source-rev | supersedes-prior | ttl-bounded | re-engage-on-trigger>
primitives_extends: []        # engagement-specific verb/primitive additions (verb names from ARD SPEC §6)
primitives_opts_out: []       # engagement-specific omissions; each entry carries a one-line rationale
decision_relevance: <free-text yield hypothesis — what downstream decision changes if this finds X? (the value-of-information depth gate; SPEC §9)>
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

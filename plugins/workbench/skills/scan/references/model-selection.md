# Scanner and Adjudicator Model Roles

Treat the names below as current role examples, not an availability allowlist.
Discover the models the current harness can provide and choose comparable models
when a named option is unavailable.

## Initial scanners

Initial lanes generate bounded, source-backed candidate findings. Spend the
budget on coverage, clear lane ownership, and evidence rather than flagship
reasoning.

| Need | Default fit | Use it for |
| --- | --- | --- |
| Accurate lane report | Luna at `xhigh` (`high` when that is the ceiling) | Bounded, detail-sensitive inspections where a stronger first-pass report is worth the extra cost. |
| Fast broad coverage | Gemini Flash 3.7 | Wide, independently partitioned scans. Treat its output as lower-confidence leads until the orchestrator verifies them. |
| Middle ground | GLM-5.2 | Lanes that need more synthesis than Flash but do not justify Luna's effort. |

Do not use a flagship family member for an initial scanner. Kimi K3, high-tier
GLM models (for example, GLM-5.3), GPT-5.6 Sol or Terra, Opus, and comparable
models are better reserved for adjudication. They add cost to an unverified
hypothesis pass without improving the scan's required coverage in proportion.
If an appropriate economical scanner is unavailable, inspect inline, narrow the
scan, or disclose the coverage limit; do not promote a flagship model merely to
preserve fan-out.

## Adjudication

Prefer Astra as the scan orchestrator and final outcome owner when available,
following the shared [role and thinking guidance](../../work/references/model-roles.md).
It verifies intent, evidence, and scope rather than accepting a confident
scanner or reviewer at face value. A separate adjudicator proposes, not decides.
Keeping Astra as owner does not require another agent or an additional pass.

After initial lanes return, use a flagship model when a fresh, more capable
judgment can materially improve the outcome: material disagreement between
lanes, high-consequence candidate findings, architectural proposals, or weakly
evidenced claims. Give it the bounded candidate set and repository evidence,
not an open-ended replacement scan. Its job is to challenge, prioritize, merge,
or reject candidates before the orchestrator verifies and presents them.

Prefer a model family different from the principal scanner when that creates a
credible independent perspective. Flagship adjudication is proportionate, not
a required final pass for every focused scan.

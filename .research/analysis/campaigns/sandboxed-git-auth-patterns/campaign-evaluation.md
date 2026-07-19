---
provenance: isolated-evaluation
campaign: sandboxed-git-auth-patterns
reviewed: 2026-07-11
---

# Independent campaign evaluation

## Priority-revision verification

All five prior revision requests are addressed:

1. **Threat-model ambiguity:** Resolved through an explicit distinction between credential-material concealment and the stronger authority-replay boundary. The stronger boundary is clearly identified as an adopted inference rather than a documented property of the compared systems.
2. **Citation-handle consistency:** The Codex citation now consistently uses `git-auth-policy-codex-cloud-environments`.
3. **Actions classification:** The Actions-versus-requirement comparison was removed from `## Contradictions` and correctly reframed under rejected approaches as a different threat-model fit.
4. **Policy composition:** Rewritten as a fail-closed intersection. Project policy is evaluated before authorization, can only narrow operator authority, and cannot override deny or ask.
5. **Authenticated fetch/read:** A dedicated contract now covers repository identity, endpoint and ref restrictions, credential profile, broker-owned state, typed output, policy decisions, and initial-scope guidance.

## 1. Seed coverage

Coverage is comprehensive. The synthesis compares established coding-agent and hosted-development patterns across every requested dimension:

- credential provisioning and isolation;
- execution placement;
- repository-controlled Git execution;
- endpoint, operation, ref, and OID authorization;
- output containment;
- audit and credential lifecycle;
- per-operation `auto` / `ask` / `deny`;
- authenticated reads as well as mutation.

The recommendation directly addresses the local sandbox: unauthenticated diff/commit handoff by default, a typed host-side adapter when authenticated operations are necessary, and conditional acceptance of an operation-bound proxy only when full Git compatibility is indispensable.

## 2. Coherence and internal join seams

The revised synthesis is internally coherent. It moves cleanly from evidence classification to harness comparison, cross-facet consequences, architecture choices, adoption order, and a concrete minimum contract.

The earlier central seam is closed: the text now acknowledges that authority non-replay is stronger than literal credential-byte concealment and explains how conclusions would differ under the weaker boundary. Retaining the interpretation question under `## Unresolved questions` is appropriate as an operator-confirmation point rather than an unacknowledged contradiction.

The authenticated-fetch section integrates consistently with the mutation design. It does not silently inherit push authority and preserves the same typed-operation, policy-intersection, hermetic-execution, output-containment, and audit principles.

## 3. Contradictions

The contradictions section is substantive and structurally sound:

- named positions remain side-by-side;
- relationship types distinguish tension, contradiction, qualification, and incommensurability;
- uncertainty about proprietary enforcement seams is preserved;
- SafeOutputs is not smoothed into proof about Git transport;
- lifecycle cleanup is not conflated with audit retention;
- repository-controlled execution risk is qualified by Git’s specific submodule defense.

The former requirement-versus-source row is gone, and the corrected Codex handle removes the visible citation-chain defect. No internal contradiction requiring revision is apparent.

## 4. Groundedness posture

From the synthesis alone, the groundedness posture is strong:

- documented facts, source-code observations, and architectural inferences are explicitly separated;
- proprietary mechanisms are not inferred from product outcomes;
- important negative claims are framed as evidence gaps rather than certainty;
- recommendations composed from multiple controls are labeled as recommendations;
- disconfirming evidence and compatibility costs are preserved;
- acquisition candidates are visibly grounded through fetched-source citations;
- the synthesis does not claim that any observed harness already implements the entire proposed contract.

Later attestation-level spot-checking should still prioritize the load-bearing product claims: Claude’s translated credential and branch restriction, Copilot’s token presence and constrained Git behavior, Codex’s secret-removal and exec-output paths, Git repository-controlled execution surfaces, and GitHub App token scope and lifetime. Nothing visible in the synthesis presently indicates those checks would require revision.

## 5. Recommendation quality

The recommendation is appropriately decisive without overstating the evidence:

1. Prefer diff/commit handoff with no authenticated Git during model execution.
2. Use a typed provider/library adapter outside the sandbox when authenticated mutation is required.
3. Apply per-operation policy to normalized semantic plans rather than shell strings.
4. Permit a translation proxy only when its capability is operation-bound and non-replayable.
5. Treat authenticated fetch as an independent permission class and omit it initially unless private refresh is genuinely required.

The minimum contract is specific enough to guide implementation while keeping unresolved provider mechanics and product requirements explicit. No further priority revision is needed.

Verdict: APPROVED

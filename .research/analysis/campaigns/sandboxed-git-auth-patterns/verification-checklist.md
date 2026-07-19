---
provenance: adversarial-read
campaign: sandboxed-git-auth-patterns
reviewed: 2026-07-11
rerun: isolated-evaluator-revision-pass
inputs:
  - synthesis.md
  - specialists/*.md
  - ../../../../attestation/git-auth-*.md
mechanical_gate_reported:
  synthesis: "177 resolved citations"
  specialists: "284 resolved citations"
  failures: "0 broken, 0 thin, 0 pattern flags (--no-url-check)"
---

# Adversarial verification checklist — isolated-evaluator revision rerun

No sources were fetched. This pass reviewed the revised synthesis, all four specialist briefs, and the existing `git-auth-*` attestations.

## Isolated-evaluator revision verification

### 1. Credential-material vs authority-replay threat-model boundaries

**PASS.** `synthesis.md` now has an explicit `### Adopted threat-model interpretation` section marked as an engagement assumption. It separates:

- the **credential-material boundary**—no upstream tokens, keys, headers, helper responses, or secret-derived values in model-observable state; and
- the **authority-replay boundary**—no general-purpose or replayable authentication oracle, even when upstream credential bytes remain outside.

The section also defines the limited acceptable case: a one-request capability already bound by the host to an immutable repository/operation/ref/OID plan and unable to authorize a different request. Architecture assessments and the rejection of forwarded helpers, sockets, session bearers, and generic byte proxies are consistent with both boundaries.

### 2. Consistent Codex attestation handle

**PASS.** The synthesis consistently uses `git-auth-policy-codex-cloud-environments` for Codex cloud lifecycle, configured-secret removal, and diff/PR handoff. No `git-auth-cred-openai-cloud-environments` citation remains in the synthesis. The chosen passage numbers contain the cited specifics.

### 3. Actions requirement comparison moved out of Contradictions

**PASS.** The former Actions-versus-requirement row is absent from `## Contradictions`. Actions now appears under `## Rejected approaches` as evidence of an accepted automation pattern serving a different threat model, followed by the engagement-level judgment that it fails the adopted authority-replay boundary. This no longer presents a source-versus-requirement comparison as a source contradiction.

### 4. Fail-closed operator/project policy intersection

**PASS.** The minimum-safe contract and authorization specialist now define the effective decision as the stricter intersection:

- operator policy is the authority ceiling;
- project policy may narrow but never expand;
- any deny wins;
- any ask prevents automatic execution;
- auto requires allow at every applicable layer; and
- unknown or ambiguous variants deny.

Project configuration is separately prohibited from adding hosts, repositories, credentials, redirects, force/delete/tag/mirror authority, or weaker audit behavior.

### 5. Explicit authenticated fetch/read contract

**PASS.** The synthesis now treats authenticated read as a separate operation class rather than an implied consequence of push permission. `fetch_refs` has its own repository/endpoint/ref scope, read-only credential profile, deadline, nonce, audit identity, policy intersection, and `auto` / `ask` / `deny` decision. It rejects repository-derived remotes, redirects, helpers, unmodeled ref expansion, submodules, LFS, alternates, and protocol changes.

The contract does **not** claim that a fetched provider API or library already supplies safe object import or reachability validation. Broker-owned transport/object state and a validated workspace-import step are prescriptive architecture requirements; feasibility remains explicitly unresolved in `## Unresolved questions` and `## Revisit if`. The initial-scope recommendation says to omit authenticated fetch when that bounded path cannot be justified.

## (a) Semantic citation-chain walk for every load-bearing claim

**Findings:** none requiring correction.

- Vendor behavior remains source-bound: Claude translation/current-branch controls, Codex configured-secret removal and handoff, Copilot token placement and constrained outcomes, Codespaces scoped Git authority, Actions persisted auth, Dev Containers forwarded authority, Git execution/refspec mechanics, SafeOutputs staging, App-token limits, and output/audit behavior all map to attested passages.
- Credential presence, raw-byte observability, and exercisable/replayable authority remain distinct.
- The threat-model boundaries, policy intersection, typed adapter, and read/fetch contract are explicitly engagement assumptions or architectural recommendations, not vendor claims.
- The fetch contract does not assert undocumented Git protocol behavior, safe pack parsing, object reachability validation, or a working object-import implementation. Those remain requirements/gaps.

## (b) Claim shapes the lint missed

**Findings:** none.

- No absolute effort estimates or implementation-size estimates appear.
- No forbidden comparative superlatives remain.
- Named product features are cited.
- Proposed operation names (`fetch_refs`, `push_branch_update`, `create_pull_request`) and policy/object fields are clearly local contract proposals.
- No source is claimed to provide a complete endpoint/ref/OID-aware authenticated-Git broker.

## (c) Smoothed contradictions

**Findings:** none.

- Claude/Codex, Codex/Copilot, Codespaces/Copilot, Git execution/submodule defense, raw exec/SafeOutputs, Copilot lifecycle, and Copilot token/outcome relationships remain structurally separated.
- The Actions requirement comparison is correctly outside the contradictions ledger.
- No disagreement is resolved through an averaged position.
- Unknown delegated-capability exposure, replay, transport, and enforcement seams remain explicit gaps.

## (d) Noise-domination and relevance weighting across attestations

**Findings:** none.

- Evidence remains relevant to credential custody, authority replay, execution boundaries, authorization, output containment, audit, and lifecycle.
- Multiple facet attestations derived from the same underlying Codespaces or Codex page are not counted as independent corroboration.
- GitHub-heavy evidence is balanced where relevant by Anthropic, OpenAI, OpenSSH, VS Code, and upstream Git material.
- The new read/fetch contract is not falsely presented as corpus consensus.

## (e) Quote-context walk

**Findings:** none.

- Copilot's no-direct-`git push` statement remains paired with simple-push capability.
- Git's “for security reasons” wording remains limited to one submodule initialization defense.
- Codex “for model consumption” remains scoped to the inspected ordinary-exec path.
- Product labels such as “secure,” “ephemeral,” and “scoped” do not substitute for evidence of non-observability or non-replay.

## (f) Analytical-tier inheritance and lens laundering

**Findings:** none.

- Every `[handle]{N}` target is a source-direct attestation.
- Specialist conclusions used by the synthesis are re-anchored to source substrate.
- The threat-model interpretation, operator/project intersection, read/fetch contract, object-state isolation, and import-validation requirement are presented as local architectural choices.
- SafeOutputs remains an analogue, not proof of Git transport or object-import internals.

## (g) Line/section reference walk

**Findings:** none.

- The reported mechanical result—177 synthesis citations and 284 specialist citations, with zero broken references—is consistent with the revised files.
- Codex synthesis citations now use one handle consistently and point to the correct lifecycle passages.
- Execution-specialist citations continue to use passage anchors rather than source-order indices.
- Acquisition candidates contain no unattested exact URLs or target-version metadata.
- No citation is attached to a protocol/object-import specific that the attestation does not contain.

## (h) Substantive thin-attestation check

**Findings:** none.

- Every attestation supporting a load-bearing factual claim remains substantive, source-specific, and provenance-bearing.
- Cited details are present in attestation summaries/passages before synthesis use.
- No analytical recommendation relies on an empty attestation as a facade.
- The absence of a fetched object-import implementation is acknowledged rather than concealed by a thin or unrelated source.

## Final assessment

All five isolated-evaluator revisions are semantically complete. The synthesis now states its two-part threat model, uses a consistent Codex source chain, keeps requirement comparisons out of the contradiction ledger, defines a fail-closed policy intersection, and specifies authenticated reads without claiming unsupported protocol or object-import capabilities. No actionable adversarial-read finding remains.

Verdict: APPROVED
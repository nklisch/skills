---
provenance: agent-synthesis
updated: 2026-07-10
---

# Output containment, audit, and lifecycle for authenticated Git

## Scope and evidence posture

This brief compares first-party product documentation and source code fetched at pinned revisions. **Public behavior** labels describe what the source states or implements. **Inference** labels identify architecture conclusions for `feature-pi-sandbox-git-egress`; they are not claims about an unobserved vendor implementation.

## Decision summary

The evidence supports rejecting “run authenticated Git and redact whatever it prints” in favor of **credentialless authoring plus a typed, permission-separated actuator**: the agent submits a bounded operation as data; a trusted later stage validates and performs it with separately held credentials; only a fixed result crosses back. GitHub Agentic Workflows documents this shape directly for repository writes: read-only agent, buffered structured SafeOutputs, threat-detection gate, then separately permissioned jobs.[git-auth-output-ghaw-architecture]{3} [git-auth-output-ghaw-architecture]{4} [git-auth-output-ghaw-safe-outputs]{1}

**Inference:** `feature-pi-sandbox-git-egress` should adopt that shape for authenticated Git. Credentials must remain in the host-side adapter. The model-facing result should be an allowlisted record, not child-process stdout/stderr. Confirmation, cancellation, timeout, audit, and disabled-sandbox behavior belong to the adapter contract, not shell conventions.

## Findings

### 1. Raw command output is model-observable unless the privileged path breaks the ordinary exec pipeline

**Public source behavior:** Codex pipes stdout and stderr, aggregates retained bytes, carries captured output through timeout and sandbox-denial results, and formats the aggregate “for model consumption.” The examined path caps/truncates output but contains no secret-redaction pass before model-facing serialization.[git-auth-output-codex-exec]{1} [git-auth-output-codex-exec]{2} [git-auth-output-codex-exec]{3} [git-auth-output-codex-exec]{4}

This makes output capping a resource control, not a confidentiality boundary. A credential printed by Git, a helper, an askpass program, a proxy, or a wrapper can survive in the aggregate until truncation. Timeout and denial do not make captured text safe; the implementation retains output in both cases.[git-auth-output-codex-exec]{2}

**Inference:** an authenticated-Git feature implemented as ordinary shell execution cannot promise non-observability merely by hiding the credential source. The privileged operation must terminate outside the raw exec-result path or replace its result before model delivery with a schema that cannot carry arbitrary subprocess text.

### 2. Structured operations provide a narrower output and authority surface than arbitrary Git argv

**Public behavior:** GitHub Agentic Workflows defines Safe Outputs as structured requests produced by a read-only agent and executed by separate permission-controlled jobs. The registry includes pull-request creation and pushing to a PR branch, with declared fields and count limits.[git-auth-output-ghaw-safe-outputs]{1} [git-auth-output-ghaw-safe-outputs]{3} [git-auth-output-ghaw-safe-outputs]{4}

Its security architecture buffers requests as artifacts, applies deterministic structural/policy/sanitization checks, runs a separate threat-detection verdict, and only then externalizes writes.[git-auth-output-ghaw-architecture]{3} [git-auth-output-ghaw-architecture]{4} [git-auth-output-ghaw-architecture]{7}

**Inference:** the pi adapter should expose operation variants, not a command string:

- `fetch` for one configured remote/repository and declared ref set;
- `push_update` for one destination ref, expected old object ID, proposed new object ID, and explicit force/delete flags that default to false;
- optionally `create_branch` only within a configured namespace.

A model-facing result should be fixed data such as `status`, `operation`, canonical repository identity, ref, before/after object IDs, denial category, retryability, and `audit_id`. It should not contain remote helper output, transport diagnostics, credential-helper text, proxy bodies, or arbitrary exception strings.

### 3. Redaction is useful at persistence boundaries, but it is not credential isolation

**Public behavior:** GitHub Agentic Workflows documents exact-value scanning of files under `/tmp/gh-aw` before artifact upload, replacement with a partially visible masked form, and unconditional execution on failure paths. It preserves prompts, outputs, patches, engine logs, and firewall logs as audit artifacts.[git-auth-output-ghaw-architecture]{6} [git-auth-output-ghaw-architecture]{8}

The same architecture treats token allocation as a configuration-level capability decision and explicitly warns that an in-container gateway key should be considered leaked by design when arbitrary code can inspect in-container state.[git-auth-output-ghaw-architecture]{2} [git-auth-output-ghaw-architecture]{5}

**Inference:** redaction should be the last defense on audit/persistence channels, not the primary secret boundary. The adapter should prevent credentials from entering model-visible memory, subprocess environment, argv, repository config, temporary files, exceptions, and raw logs. Audit serialization should use an allowlist of fields; denylist regexes are supplementary.

Partial-prefix masking is unsuitable for pi’s credential audit record because even a prefix can become a stable correlation identifier. Emit a secret class or credential-source label, never credential characters.

### 4. Ephemeral state limits persistence but does not prevent same-session observation

**Public behavior:** Copilot cloud-agent hook files and transcripts are ephemeral and discarded at job end unless deliberately sent through an HTTP hook. Yet the same sandbox receives `GITHUB_COPILOT_GIT_TOKEN`, runs non-interactively with permissions pre-granted, and discovers repository-controlled hook configuration.[git-auth-output-copilot-hooks]{1}

Codespaces similarly provisions a fresh expiring, scoped GitHub token, but explicitly documents that development secrets are environment variables whose values a terminal can print.[git-auth-output-codespaces-security]{1} [git-auth-output-codespaces-security]{2}

**Inference:** cleanup, short TTLs, and tmpfs reduce after-the-fact recovery; none prevents a model-controlled same-UID process from reading a secret while it is live. A reusable credential cannot be placed in the sandbox even briefly if non-observability is a requirement.

Host-side transient files, if unavoidable, should be created with restrictive permissions outside sandbox-visible mounts, unlinked or removed deterministically, excluded from session artifacts, and covered by crash-path cleanup. Prefer in-memory credential delivery from adapter to transport over a path or environment variable.

### 5. Confirmation must be a host authorization decision with explicit no-UI semantics

**Public behavior:** Copilot hooks distinguish interactive CLI permission handling from cloud/no-UI behavior. Under cloud agent, `ask` becomes `deny`; CLI pipe/CI hooks can approve or deny before normal prompting, and denial can interrupt the agent. Command hooks also have a documented default timeout.[git-auth-output-copilot-hooks]{3} [git-auth-output-copilot-hooks]{5} [git-auth-output-copilot-hooks]{2}

**Inference:** confirmation should occur before credential lookup or network access and should display only validated intent: canonical repository, operation, source/destination ref, before/after object IDs, and whether force/delete is requested. It must not display a raw command containing URLs or helper arguments.

In RPC, headless, or otherwise no-UI modes, a `confirm` policy should resolve to denial. There should be no implicit “allow because prompting is impossible” fallback. Session approval, if supported, should bind to the same canonical policy tuple and expire with the adapter session.

### 6. Timeout and cancellation need bounded, prompt-free transport behavior

**Public source behavior:** Codex bounds retained output, live deltas, cancellation grace, and pipe-drain time; captured timeout output still enters the result path.[git-auth-output-codex-exec]{1} [git-auth-output-codex-exec]{2}

**Inference:** the adapter must suppress all transport-layer interactive prompting, impose a deadline, propagate cancellation to the entire spawned process group, bound drain time, and discard raw streams after classifying the outcome. A timeout result should be a fixed category such as `timed_out`, not concatenated Git stderr. Cancellation should revoke the per-session operation capability before returning.

Errors should be normalized into a small registry—for example policy denial, confirmation unavailable, auth unavailable, remote rejected, non-fast-forward, timeout, cancelled, and internal failure. Unknown errors should fail closed and preserve raw details only in an operator-only protected diagnostic channel after redaction review.

### 7. Audit records should observe privileged intent and outcome, not credentials or terminal transcripts

**Public behavior:** Copilot cloud-agent commits are signed, attributed to Copilot with the initiating human as co-author, and link permanently to full session logs. GitHub also warns that generated natural-language and code output can expose sensitive information.[git-auth-output-copilot-audit]{1} [git-auth-output-copilot-audit]{2}

GitHub Agentic Workflows preserves structured output, patch, engine, and firewall artifacts and offers audit tooling over them.[git-auth-output-ghaw-architecture]{8}

**Inference:** every privileged Git request should emit append-only audit events at these transitions:

1. request received;
2. policy validated or denied;
3. confirmation requested and resolved;
4. credential capability acquired (type/source only);
5. transport started;
6. completed, timed out, cancelled, or failed;
7. capability revoked and cleanup completed.

Each event should include timestamp, session/request IDs, actor/tool identity, canonical repository, operation/ref/object IDs, policy decision, confirmation provenance, result category, duration, and a correlation-safe credential class. Exclude raw stdout/stderr, URLs with userinfo/query data, environment snapshots, helper responses, headers, and secret-derived fingerprints.

Retention should be explicit because permanent session links make accidental leakage durable. Operator audit records and model transcripts should be separate products with separate readers and retention policies.

### 8. Disabled or degraded sandbox states cannot silently preserve privileged Git

**Public architecture constraint:** GitHub Agentic Workflows says its higher-level guarantees depend on substrate isolation and correct credential allocation; a failure at those layers invalidates higher-level guarantees.[git-auth-output-ghaw-architecture]{1} [git-auth-output-ghaw-architecture]{2} [git-auth-output-ghaw-architecture]{3}

**Inference:** if pi-sandbox is disabled, uninitialized, unsupported, or cannot prove its intended confinement, the authenticated-Git adapter should not silently become an ordinary host Git command. A configured `block` remains block. A configured `confirm` may permit an explicit operator-run host action only if the UI exists and the adapter still enforces repository/ref/operation policy while withholding raw credentials and output. In no-UI mode, deny.

Fail-closed must cover malformed policy, unknown repository identity, ambiguous remote URLs, credential acquisition failure, result-schema validation failure, audit-sink failure when audit is mandatory, and inability to revoke/clean up. A disabled sandbox is not evidence that the calling model has become trusted.

## Recommended contract for `feature-pi-sandbox-git-egress`

**Inference:** adopt an outside-the-sandbox Git operation port with these invariants:

| Concern | Required behavior |
|---|---|
| Credential location | Host adapter only; never sandbox env/files/argv/helper response |
| Input | Typed operation with canonical repo/ref/object IDs; no arbitrary Git argv |
| Authorization | Exact host/repository/operation/ref policy; force/delete denied unless separately declared |
| Confirmation | Host UI over validated intent; no-UI `confirm` denies |
| Execution | Prompt-free, deadline-bound, cancellable process group or library transport |
| Model result | Fixed schema and normalized categories; no raw stdout/stderr |
| Diagnostics | Protected operator-only channel; allowlisted audit fields; no secret-derived prefixes |
| Lifecycle | Per-session capability, explicit revoke, deterministic crash/cancel cleanup |
| Degraded state | Fail closed; never fall back to unsandboxed authenticated shell Git |
| Audit | Append-only transition events tied to one request and one policy decision |

This architecture borrows the documented SafeOutputs capability shape without claiming GitHub uses the same internal transport.

## Disconfirming analysis

I searched the attested sources for cases that weaken the recommendation:

- **In-sandbox token placement is established public behavior.** Copilot cloud-agent hooks documentation records a Git token inside its sandbox, while Codespaces exposes separately configured environment secrets to terminal commands.[git-auth-output-copilot-hooks]{1} [git-auth-output-codespaces-security]{2} This disproves a claim that hosted environments universally keep all credential material outside their runtimes. The fetched Copilot source does not by itself establish raw-token access by model-run processes.
- **Ephemeral storage and expiring tokens are meaningful controls.** Copilot hook state is discarded after the job; Codespaces refreshes and scopes its token.[git-auth-output-copilot-hooks]{1} [git-auth-output-codespaces-security]{1} These controls reduce persistence and blast radius. They remain insufficient against same-session inspection or exfiltration.
- **Post-tool result replacement can hide output from the model.** Copilot hooks can replace `textResultForLlm`.[git-auth-output-copilot-hooks]{4} However, the source does not state that the original result is prevented from other logs, hooks, transcripts, or same-runtime access, nor that repository-controlled hooks form a trusted redaction boundary. It is a transformation surface, not proven containment.
- **Comprehensive audit artifacts improve investigation.** GitHub Agentic Workflows preserves extensive logs and artifacts.[git-auth-output-ghaw-architecture]{8} That breadth conflicts with data minimization if raw privileged output is captured first. The safe resolution is to audit typed events rather than rely on later scrubbing.
- **The SafeOutputs analogy is not exact Git transport evidence.** The documentation establishes staged writes and includes PR/branch operations, but it does not prove that every underlying Git implementation avoids temporary credential material or raw diagnostic persistence. The recommended adapter details are inference, not copied vendor behavior.

## Contradictions

### Credential location: outside the agent vs inside the cloud sandbox

- GitHub Agentic Workflows says sensitive credentials for Safe Outputs stay in isolated downstream jobs and the agent job remains read-only.[git-auth-output-ghaw-architecture]{3} [git-auth-output-ghaw-safe-outputs]{1}
- GitHub Copilot’s cloud hook environment sets `GITHUB_COPILOT_GIT_TOKEN` inside the sandbox.[git-auth-output-copilot-hooks]{1}

Relationship: `contradicts` within the shared question “does the authoring runtime receive Git write credentials?” These are distinct GitHub products/surfaces with different designs; they must not be merged into a single “GitHub pattern.”

### Lifecycle: ephemeral hook files vs permanent audit linkage

- Copilot cloud hook-created files are discarded at job end unless exported.[git-auth-output-copilot-hooks]{1}
- Copilot cloud-agent commits contain permanent links to full session logs.[git-auth-output-copilot-audit]{1}

Relationship: `qualifies`. Ephemeral sandbox files do not imply ephemeral platform observability. Data that crosses into the session log can outlive the runtime.

### Output handling: raw aggregate vs typed request

- Codex ordinary exec formats aggregated stdout/stderr for model consumption.[git-auth-output-codex-exec]{4}
- GitHub Agentic Workflows Safe Outputs uses structured requests interpreted by separate operation handlers.[git-auth-output-ghaw-safe-outputs]{1} [git-auth-output-ghaw-safe-outputs]{4}

Relationship: `incommensurable` as execution surfaces. One is a general command channel; the other is a privileged structured actuator. Treating truncation on the first as equivalent to validation on the second would erase the critical boundary.

## Source-bound acquisition candidates

### GitHub Agentic Workflows Threat Detection Guide

- **Urgency:** enriching
- **Source:** GitHub, *Agentic Workflows Threat Detection Guide*
- **Class:** primary-doc
- **Web availability:** web-summary-only
- **Completes:** Exact verdict failure, timeout, customization, and bypass semantics at the pre-actuation threat-detection boundary.
- **Grounded-by:** The fetched first-party security architecture names the Threat Detection Guide as the configuration reference for threat analysis.[git-auth-output-ghaw-architecture]{9}

### GitHub Agentic Workflows Cross-Repository Operations

- **Urgency:** enriching
- **Source:** GitHub, *Agentic Workflows Cross-Repository Operations*
- **Class:** primary-doc
- **Web availability:** web-summary-only
- **Completes:** Repository canonicalization, allowed-target enforcement, and credential scoping for cross-repository Safe Output writes.
- **Grounded-by:** The fetched Safe Outputs reference names Cross-Repository Operations as the comprehensive source for `target-repo`, `allowed-repos`, and cross-repository authentication.[git-auth-output-ghaw-safe-outputs]{5}

## Revisit if

- pi introduces a model-output interception boundary that is guaranteed to run before every transcript, hook, job buffer, and log sink.
- the adapter uses an in-process Git transport whose error and trace callbacks can be proven not to serialize credentials.
- a Git provider offers single-operation, ref-bound credentials that become unusable immediately after one validated request.
- product requirements explicitly accept same-session credential observability and only seek short lifetime plus log masking.
- no-UI confirmation semantics or sandbox-disabled behavior changes at the pi host boundary.
- audit retention or operator-access requirements become formal enough to require tamper-evident storage or external export.

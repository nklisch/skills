---
provenance: agent-synthesis
updated: 2026-07-10
campaign: sandboxed-git-auth-patterns
status: complete
---

# Sandboxed authenticated Git patterns: cross-specialist synthesis

## Scope and evidence posture

This synthesis asks how coding-agent and hosted-development systems permit authenticated repository operations, and which pattern fits a local coding-agent sandbox whose hard requirement is **no reusable credential in model-observable space**.

Three evidence classes are kept separate:

- **Documented facts** are statements in fetched first-party product or protocol documentation.
- **Source-code observations** describe fetched, revision-pinned public implementation or configuration. They establish the inspected path, not every deployment of the product.
- **Architectural inferences** are marked `{inferred: ...}`. They compare attested mechanisms or recommend a design; they are not claims about undocumented proprietary internals.

The public evidence is uneven. Anthropic documents a scoped in-sandbox credential translated to the user's GitHub token, current-working-branch push restriction, audit logging, and session teardown for Claude Code web, but does not disclose the proxy protocol or the enforcement seam for endpoint/ref policy [git-auth-exec-claude-cloud]{2} [git-auth-exec-claude-cloud]{3} [git-auth-exec-claude-cloud]{4}. GitHub documents constrained Copilot outcomes but not its internal Git credential transport [git-auth-cred-github-copilot-controls]{3} [git-auth-cred-github-copilot-controls]{4}. GitHub Agentic Workflows documents a structured, permission-separated write architecture, but that is an analogous capability shape rather than evidence of Copilot's or Claude's Git transport internals [git-auth-output-ghaw-architecture]{3} [git-auth-output-ghaw-architecture]{4}.

No harness was executed for this campaign. No claim below treats a product label such as “secure,” “ephemeral,” or “scoped” as proof of credential non-observability.

### Adopted threat-model interpretation

`{inferred: engagement assumption}` The local-sandbox recommendation adopts two distinct boundaries:

- **Credential-material boundary:** upstream tokens, keys, authorization headers, helper responses, and secret-derived values never enter model-observable environment, filesystem paths, process arguments, tool results, logs, or transcripts.
- **Authority-replay boundary:** model-run code may request a policy-approved semantic operation, but it must not receive a general-purpose or replayable authentication oracle such as an unrestricted helper, forwarded agent socket, session bearer, or byte proxy. A one-request capability is acceptable only when the host has already bound it to the immutable repository/operation/ref/OID plan and it cannot authorize a different request.

The second boundary is intentionally stronger than literal credential-byte concealment. It follows the engagement requirement that authentication not become an in-sandbox credential oracle. Architectures B–D are assessed against both boundaries; a deployment accepting only the first boundary would evaluate forwarded or translated capabilities differently.

## Harness-by-harness comparison

| Harness or environment | Execution placement | Credential isolation | Repository-controlled execution exposure | Endpoint/ref authorization evidence | Output, audit, and lifecycle |
|---|---|---|---|---|---|
| **Claude Code web/cloud** | One isolated Anthropic-managed VM per session; restricted network [git-auth-exec-claude-cloud]{1} | A scoped credential is present in the sandbox and translated by a secure proxy to the user's actual GitHub token [git-auth-exec-claude-cloud]{2} | Public documentation does not establish effective Git config, hook, helper, filter, or submodule defenses | Push is documented as restricted to the current working branch [git-auth-exec-claude-cloud]{3}; translation alone does **not** establish ref-aware or endpoint-aware enforcement at the proxy | Operations are audit logged and the environment is terminated after the session [git-auth-exec-claude-cloud]{4} |
| **OpenAI Codex cloud** | Checkout and setup precede the agent loop in an isolated task container [git-auth-policy-codex-cloud-environments]{1} | Configured secrets are setup-only and removed before the agent phase; ordinary environment variables persist [git-auth-policy-codex-cloud-environments]{4} [git-auth-policy-codex-cloud-environments]{5} | Setup can deliberately leave state, but the documented default keeps configured secrets out of the agent phase; agent network is off by default [git-auth-policy-codex-cloud-environments]{2} | The documented completion path presents a diff and lets the user open a pull request [git-auth-policy-codex-cloud-environments]{3}; the fetched documentation does not establish whether any platform-provisioned Git credential or capability exists during the agent phase | Removing configured secrets limits one credential channel; the agent-phase Git authority boundary remains an evidence gap |
| **OpenAI Codex local / secure devcontainer** | Local command execution uses sandbox and approval controls; `.git` under writable roots is recursively protected read-only [git-auth-policy-codex-security]{1} [git-auth-policy-codex-security]{4} | The public secure-devcontainer profile mounts GitHub CLI state, mounts host Git configuration, and forwards `OPENAI_API_KEY` into the container [git-auth-cred-codex-secure-devcontainer]{1} [git-auth-cred-codex-secure-devcontainer]{2} [git-auth-cred-codex-secure-devcontainer]{3} | The inspected profile is convenience-oriented and does not declare a Git credential broker [git-auth-cred-codex-secure-devcontainer]{6} | Sandbox capability and approval policy are separate; destructive Git and Git config/output overrides require approval in the documented untrusted policy [git-auth-policy-codex-security]{1} [git-auth-policy-codex-security]{6} | **Source-code observation:** ordinary exec aggregates stdout/stderr for model consumption with truncation but no redaction in the inspected path [git-auth-output-codex-exec]{2} [git-auth-output-codex-exec]{4} |
| **GitHub Copilot cloud agent** | Ephemeral GitHub Actions-powered environment; one branch and one pull request per task [git-auth-exec-github-copilot-cloud]{1} [git-auth-exec-github-copilot-cloud]{3} | Dedicated Agents secrets are environment variables available to agent-run tools, except `COPILOT_MCP_` values routed only to MCP servers [git-auth-cred-github-copilot-secrets]{3} [git-auth-cred-github-copilot-secrets]{4}. A public hooks reference also records `GITHUB_COPILOT_GIT_TOKEN` in the cloud sandbox [git-auth-output-copilot-hooks]{1} | A setup workflow runs before the agent only when present on the default branch; later Git sanitization is not documented [git-auth-exec-github-copilot-setup]{1} [git-auth-exec-github-copilot-setup]{2} | Agent writes are limited to a PR or `copilot/` branch, subject to branch protection; GitHub says the agent cannot directly run `git push` or other Git commands and has only simple-push capability [git-auth-cred-github-copilot-controls]{3} [git-auth-cred-github-copilot-controls]{4} | Signed/co-authored commits and permanent session-log links provide traceability [git-auth-output-copilot-audit]{1}; secret masking in logs does not isolate runtime secrets [git-auth-cred-github-copilot-secrets]{5} |
| **GitHub Agentic Workflows** | Read-only agent job proposes structured SafeOutputs; separate scoped jobs externalize writes after checks [git-auth-output-ghaw-safe-outputs]{1} [git-auth-output-ghaw-architecture]{4} | Sensitive write authority belongs to downstream jobs rather than the authoring job; the architecture warns that an in-container gateway key is extractable and should be treated as leaked [git-auth-output-ghaw-architecture]{2} [git-auth-output-ghaw-architecture]{5} | Structured outputs are buffered and checked before actuation, reducing direct execution of agent-authored command strings [git-auth-output-ghaw-architecture]{3} [git-auth-output-ghaw-architecture]{7} | SafeOutputs declares typed operations, limits, fields, and target-repository controls, including PR creation and push-to-PR-branch [git-auth-output-ghaw-safe-outputs]{3} [git-auth-output-ghaw-safe-outputs]{4} | Threat detection gates writes; artifacts preserve prompts, outputs, patches, engine logs, and firewall logs [git-auth-output-ghaw-architecture]{7} [git-auth-output-ghaw-architecture]{8}. This is an architectural analogue, not proof of Git transport internals |
| **GitHub Codespaces** | Isolated interactive development VM/network with outbound internet [git-auth-cred-codespaces-security]{1} | New automatically expiring token on create/restart; usually repository-scoped, while separately configured development secrets are process-readable environment variables [git-auth-cred-codespaces-security]{2} [git-auth-cred-codespaces-security]{3} [git-auth-cred-codespaces-security]{5} | Repository `devcontainer.json` may execute arbitrary setup code [git-auth-exec-codespaces]{6} | Ordinary HTTPS `git pull`/`git push` works for the source repository; extra repositories require explicit authorization [git-auth-cred-codespaces-git-auth]{1} [git-auth-cred-codespaces-git-auth]{2} [git-auth-cred-codespaces-git-auth]{4} | Expiry, scope, and fork routing limit blast radius; the fetched evidence establishes exercise of authenticated Git authority, not raw Git-token byte observability [git-auth-cred-codespaces-git-auth]{1} [git-auth-exec-codespaces]{3} |
| **VS Code Dev Containers** | Git runs inside the developer container | Host HTTPS credential helper is reused; host SSH agent is forwarded, keeping key bytes outside but forwarding authentication power [git-auth-cred-vscode-devcontainers]{3} [git-auth-cred-vscode-devcontainers]{4} [git-auth-cred-openssh-agent-forwarding]{4} [git-auth-cred-openssh-agent-forwarding]{5} | Host `.gitconfig` is copied into the container [git-auth-cred-vscode-devcontainers]{2}; no model-adversarial boundary is claimed | No fetched evidence of repository, endpoint, ref, operation, or single-use limits at the forwarded helper/socket seam | Interactive developer convenience pattern; not evidence of non-reusable authority in an adversarial agent sandbox |
| **GitHub Actions / CI** | Git and arbitrary later steps run in the same job environment | `actions/checkout` intentionally persists auth for later scripts unless disabled, then cleans it post-job [git-auth-policy-actions-checkout]{2} [git-auth-policy-actions-checkout]{3} | **Source-code observation:** HTTPS auth, SSH key files, submodule config, and temporary global config are made available to job-side Git [git-auth-exec-actions-checkout]{2} [git-auth-exec-actions-checkout]{4} [git-auth-exec-actions-checkout]{5} | Token permissions can be least-privilege, but fetched checkout evidence does not establish ref-bound per-operation authorization [git-auth-policy-actions-checkout]{6} | Secret masking and placeholder replacement protect logs/process auditing, not arbitrary job-code observation [git-auth-exec-actions-checkout]{2} [git-auth-exec-actions-checkout]{3} |

## Cross-facet synthesis

### Credential isolation

Short lifetime and narrow repository scope reduce blast radius but do not satisfy non-observability when model-run code can read credential bytes or repeatedly exercise authenticated authority. Codespaces documents an expiring, repository-scoped token used by ordinary Git [git-auth-cred-codespaces-security]{2} [git-auth-cred-codespaces-security]{3} [git-auth-cred-codespaces-git-auth]{1}; it separately documents terminal-readable development secrets [git-auth-cred-codespaces-security]{5}. The fetched evidence does not establish that the Git token's raw bytes are terminal-readable. OpenSSH agent forwarding similarly hides key bytes while allowing authentication operations with loaded keys [git-auth-cred-openssh-agent-forwarding]{4} [git-auth-cred-openssh-agent-forwarding]{5}.

`{inferred: consequence}` The hard requirement is therefore about **authority observability and replay**, not merely secret bytes. An environment variable, readable file, unrestricted helper response, forwarded agent socket, or reusable surrogate accessible to the model fails unless its exercise is independently restricted to the approved repository operation.

Claude Code web is an important distinct pattern: the actual GitHub token remains behind a translation proxy while a scoped credential exists in the sandbox [git-auth-exec-claude-cloud]{2}. That demonstrates separation of upstream credential custody from Git execution. The fetched documentation does not establish whether the scoped credential is exposed to model-run processes, replayable, single-use, endpoint-bound, or ref-aware.

### Execution placement and repository-controlled execution

Authenticated Git need not run where the upstream credential lives: Claude web documents in-sandbox credential translation [git-auth-exec-claude-cloud]{2}, while Agentic Workflows documents write authority in later jobs [git-auth-output-ghaw-architecture]{4}. The critical issue is what privileged code reads and executes.

Git is not a passive transport wrapper. It executes hooks from `$GIT_DIR/hooks` or `core.hooksPath`, including `pre-push` [git-auth-exec-git-hooks]{1} [git-auth-exec-git-hooks]{2} [git-auth-exec-git-hooks]{6}. Attributes and configuration can select executable clean/smudge filters, external diffs, and merge drivers [git-auth-exec-git-config-exec]{1} [git-auth-exec-git-config-exec]{4} [git-auth-exec-git-config-exec]{5}. Submodule configuration expands URLs and can contain local custom commands, although Git deliberately refuses to copy a tracked custom update command during initialization [git-auth-exec-git-submodules]{2} [git-auth-exec-git-submodules]{3} [git-auth-exec-git-submodules]{4}. Linked worktrees share configuration and most refs [git-auth-exec-git-worktrees]{2} [git-auth-exec-git-worktrees]{3}.

`{inferred: consequence}` A privileged host-side Git CLI pointed at the agent-writable live repository is a privilege bridge unless its Git directory, effective configuration, environment, hooks, helpers, drivers, submodules, worktrees, and transport are made hermetic. Disabling hooks alone is insufficient.

### Endpoint and ref authorization

Git push syntax is too expressive for command-prefix authorization. A destination may be a URL or remote name; refspecs can force, delete, wildcard, update tags, or mirror all refs [git-auth-policy-git-push]{1} [git-auth-policy-git-push]{2} [git-auth-policy-git-push]{3} [git-auth-policy-git-push]{4}. An explicit expected OID in `--force-with-lease=<ref>:<expect>` binds a forced update to observed remote state, whereas implicit forms rely on mutable tracking refs [git-auth-policy-git-push]{5} [git-auth-policy-git-push]{6}.

Claude Code's documented current-branch restriction is material evidence of a constrained outcome [git-auth-exec-claude-cloud]{3}. It must not be inflated into a claim that the translation proxy parses refs or canonicalizes endpoints. GitHub Copilot's documented one-branch/simple-push outcome is likewise evidence of capability shape, not public proof of its credential or transport implementation [git-auth-cred-github-copilot-controls]{3} [git-auth-cred-github-copilot-controls]{4}.

`{inferred: design rule}` Authorization should operate on a parsed immutable plan—canonical repository identity, canonical endpoint, operation kind, full destination ref, source/new OID, expected remote OID, and force/delete/tag flags—not on agent-authored Git argv or remote names.

### Output containment

**Source-code observation:** the inspected Codex ordinary-exec path aggregates stdout/stderr and formats it for model consumption; timeout and sandbox-denial paths retain captured output [git-auth-output-codex-exec]{2} [git-auth-output-codex-exec]{4}. **Source-code observation:** `actions/checkout` masks a token and avoids putting it on the process command line, but intentionally persists authentication for later job scripts [git-auth-exec-actions-checkout]{1} [git-auth-exec-actions-checkout]{2} [git-auth-exec-actions-checkout]{3}.

`{inferred: consequence}` Redaction, truncation, log masking, and cleanup are persistence hygiene, not a confidentiality boundary. A privileged Git path should return a fixed result schema and keep raw transport output in a separately protected operator diagnostic channel, if retained at all.

### Audit and lifecycle

Claude web documents audit logging and teardown [git-auth-exec-claude-cloud]{4}. Copilot documents signed/co-authored commits and permanent session-log linkage [git-auth-output-copilot-audit]{1}. GitHub organization audit logs include Git push events, but Enterprise Cloud Git events are API-only and retained for seven days [git-auth-policy-github-audit-events]{1} [git-auth-policy-github-audit-events]{4}.

`{inferred: consequence}` Provider events corroborate execution but cannot replace a durable local authorization ledger. The local record must capture the normalized plan, policy provenance, decision, confirmer, exact before/after refs and OIDs, result category, and credential class—never credential bytes, secret-derived prefixes, headers, helper output, or raw stderr.

## Architecture comparison

| Architecture | Credential/authority visible to model | Compatibility | Principal risk | Assessment for the hard requirement |
|---|---|---|---|---|
| **A. Scoped provider authority directly usable inside sandbox** | The sandbox can exercise authenticated Git authority; raw credential-byte readability varies by implementation | Ordinary Git works | Scope/TTL reduce impact but do not prevent repeated same-session exercise; readable bearer material also permits exfiltration | **Reject.** Codespaces documents ordinary authenticated Git in an interactive environment, while Actions persists authentication for later job scripts [git-auth-cred-codespaces-git-auth]{1} [git-auth-cred-codespaces-git-auth]{2} [git-auth-policy-actions-checkout]{2}; neither pattern meets the stated non-reuse boundary for an adversarial agent |
| **B. In-sandbox Git plus credential-translation proxy / surrogate capability** | Actual upstream credential can remain outside; presence of a surrogate does not by itself establish its model observability or replay behavior | Retains in-sandbox Git execution; protocol compatibility is not fully documented | A generic translated bearer or byte proxy may still be replayable and may not bind endpoint/ref/operation; public Claude details do not resolve this | **Conditional, not preferred.** Claude web documents the translation shape [git-auth-exec-claude-cloud]{2}, but translation alone does not prove ref-aware policy or model-inaccessibility. It meets the requirement only if each surrogate is operation-bound or the proxy independently parses and enforces the complete immutable plan |
| **C. Privileged Git CLI broker over the live repository** | Credential can remain outside | High Git compatibility | Agent-writable hooks/config/helpers/drivers/submodules/worktree state become privileged executable input [git-auth-exec-git-hooks]{6} [git-auth-exec-git-config-exec]{4} [git-auth-exec-git-submodules]{4} [git-auth-exec-git-worktrees]{3} | **Reject over the live repository.** A broker-private repository/config/object workspace could reduce risk, but at that point the design should be treated as a hermetic transport service, not a thin CLI wrapper |
| **D. Typed provider/library adapter outside sandbox** | `{inferred: design property}` No credential need enter model-observable space; the model receives typed results | Narrower feature surface; specialized Git functionality must be added deliberately | Protocol/object validation, provider coupling, feature gaps, and implementation burden | **Preferred when authenticated mutation is required.** The fetched SafeOutputs documentation describes an analogous permission-separated capability shape [git-auth-output-ghaw-safe-outputs]{1} [git-auth-output-ghaw-safe-outputs]{4}, not proof of Git transport internals |

## Adoption recommendation

### Decision order

1. **Default to no authenticated Git during agent execution.** Let the agent produce a patch/diff or local commits; let the operator or a separately trusted workflow inspect and publish them. Codex cloud documents a completed-task diff and user-opened pull request [git-auth-policy-codex-cloud-environments]{3}; the fetched documentation does not establish whether a separate platform-provisioned Git credential or capability exists during the agent phase. `{inferred: recommendation}` Independently of Codex internals, a local design that withholds authenticated Git during agent execution directly satisfies “no reusable credential in model-observable space” and removes authenticated network mutation from the prompt-injection blast radius.
2. **If authenticated repository mutation is load-bearing, choose D:** a host-side structured provider/library adapter that owns credential acquisition and transport. For GitHub, mint a GitHub App installation token just in time, narrowed to the target repository and required app permissions; installation tokens cannot exceed installation/app grants and expire after one hour [git-auth-policy-github-app-token]{3} [git-auth-policy-github-app-token]{4} [git-auth-policy-github-app-token]{5}. The one-hour expiry is not single-use or ref scope; those properties must be enforced locally.
3. **Expose per-operation `auto` / `ask` / `deny` over typed operations.** Claude Code documents externally enforced allow/ask/deny semantics and deny-before-ask-before-allow precedence [git-auth-policy-claude-code-permissions]{1} [git-auth-policy-claude-code-permissions]{2}. `{inferred: adaptation}` Pi should apply those decisions to normalized repository operations, not shell patterns.
4. **Use B only if full in-sandbox Git compatibility is essential and the surrogate is not reusable authority.** A session bearer merely translated at an egress proxy does not meet the hard requirement. A one-operation capability whose exact repository/ref/OIDs are fixed can meet it, but ordinary Git may not tolerate such a narrow token without a protocol-aware proxy.

### Explicit evaluation of the simpler diff/PR handoff

Declining authenticated Git during model execution is not a degraded version of the broker; it is a distinct safety architecture. The authoring sandbox can have no write credential and, if feasible, no authenticated network at all. The operator reviews a diff or commit bundle and performs push/PR creation through an ordinary trusted client or separately permissioned actuator.

Benefits:

- no reusable provider credential or authentication oracle is model-observable;
- no privileged Git process reads the live agent-writable repository;
- endpoint/ref policy collapses to the trusted publication step;
- raw authenticated transport output never enters the model tool result;
- prompt injection cannot directly cause a remote mutation.

Costs:

- no autonomous fetch of private updates during authoring unless a separate read path exists;
- no autonomous publication or remote race resolution;
- operator or downstream automation must perform the handoff.

`{inferred: recommendation}` Adopt this as the default and require a concrete product need to enable the structured adapter. “The agent expects `git push` to work” is not sufficient justification.

## Minimum safe contract

A structured authenticated-Git port should fail closed unless all of the following hold:

1. **Typed registry:** operations come from one closed registry (for example `fetch_refs`, `push_branch_update`, and optionally `create_pull_request`); arbitrary Git argv, URLs, headers, helpers, and options are rejected.
2. **Canonical identity:** operator-owned configuration binds provider, immutable repository ID where available, canonical HTTPS host/port/path, credential profile, and permitted ref namespaces. Repository files may only narrow policy.
3. **Immutable plan:** each request binds operation, source/new OID, full destination ref, broker-observed expected remote OID, force/delete/tag flags, policy version, expiry, and a nonce/hash.
4. **Policy intersection:** operator policy defines the maximum authority and the initial `deny` / `ask` / `auto` decision; project policy is evaluated before authorization and may narrow but never expand that result. Effective policy is the stricter intersection: any deny wins, any ask prevents auto-execution, and auto is possible only when both applicable layers allow it. Unknown variants, ambiguous refs, multiple destinations, wildcards, mirrors, and redirects deny.
5. **Ref defaults:** single non-protected branch update only; fast-forward/create under an approved namespace. Force, delete, tags, matching refs, `--all`, `--prune`, wildcards, and `--mirror` deny unless separately modeled, with mirror denied unconditionally. Git's documented expansion semantics justify this separation [git-auth-policy-git-push]{2} [git-auth-policy-git-push]{3} [git-auth-policy-git-push]{4}.
6. **Host confirmation:** `ask` displays canonical repository, exact ref, old/new OIDs, commit/diff summary derived by trusted code, exceptional flags, and policy source. Approval is one-shot and invalidated by any drift. No-UI `ask` denies; Copilot hooks document this fail-closed no-UI behavior [git-auth-output-copilot-hooks]{3}.
7. **Credential custody:** provider credentials exist only in adapter memory or a broker-private transport channel; never sandbox environment/files/argv, Git config, helper response, raw tool output, logs, or repository mounts. Mint after policy/confirmation and revoke/discard immediately after use.
8. **Hermetic execution:** prefer provider/library transport that does not read the live `.git` directory. If a Git subprocess remains, use broker-owned repository/config state, clean environment, fixed executable/endpoint, disabled hooks and prompts, no shell, and reject external drivers, helpers, protocols, submodules, and linked worktrees unless separately modeled.
9. **Output schema:** model-visible output is fixed data: status, operation, canonical repository ID, ref, before/after OIDs, normalized denial/failure category, retryability, and audit ID. No raw stdout/stderr or arbitrary exception text.
10. **Lifecycle:** bounded deadline, whole-operation cancellation, capability revocation before return, deterministic cleanup, and no fallback to unsandboxed authenticated shell Git if sandbox or adapter guarantees are unavailable.
11. **Audit:** append-only request/decision/confirmation/credential-class/transport/result/cleanup events. Mandatory audit-sink failure denies the operation. Provider Git events are corroboration only because their access and retention are limited [git-auth-policy-github-audit-events]{1} [git-auth-policy-github-audit-events]{4}.
12. **Independent egress control:** ordinary sandbox network policy must prevent bypass around the adapter. Domain or method allowlists reduce egress but do not authorize mutation, and trusted-host content can carry prompt injection [git-auth-policy-codex-internet-access]{2} [git-auth-policy-codex-internet-access]{5}.

### Authenticated read/fetch contract

Authenticated reads are a separate operation class, not an implied side effect of push permission. A `fetch_refs` request must bind an operator-registered repository identity and endpoint, an allowlisted set of full source refs or namespaces, expected/current remote OIDs when available, a read-only credential profile, deadline, nonce, and audit ID. It must reject repository-derived remotes, redirects, remote helpers, arbitrary refspec expansion, submodule recursion, LFS, alternates, and protocol changes unless each is separately modeled.

The adapter should fetch into broker-owned transport/object state without reading the live agent-controlled Git configuration, then return bounded ref/OID metadata and import only validated objects through a separately specified workspace update step. Model-visible output remains typed and excludes raw transport diagnostics. `fetch_refs` receives its own operator/project policy intersection and `auto` / `ask` / `deny` decision; permission to push never grants permission to read additional private refs or repositories.

`{inferred: initial-scope recommendation}` If private-repository refresh is not load-bearing, omit authenticated fetch from the first implementation and use the diff/commit handoff. If it is load-bearing, implement this bounded read path before or independently from mutation rather than exposing ordinary authenticated `git fetch` inside the sandbox.

## Rejected approaches

- **PAT, OAuth token, `GITHUB_TOKEN`, or installation token in sandbox environment/files.** Scope and TTL do not conceal same-session authority.
- **Persisted Git credential/helper state.** `actions/checkout` intentionally enables later arbitrary job scripts, while token-bearing clone URLs can store tokens visibly in Git config [git-auth-policy-actions-checkout]{2} [git-auth-cred-codespaces-git-auth]{7}. This is evidence of a different accepted automation threat model, not a contradiction between sources; it fails this engagement's adopted authority-replay boundary.
- **Unrestricted SSH-agent forwarding.** Key bytes stay outside, but the sandbox can request authentication operations [git-auth-cred-openssh-agent-forwarding]{4} [git-auth-cred-openssh-agent-forwarding]{5}.
- **Output redaction as primary control.** Ordinary command output can reach model-facing serialization, and exact-value masking is a persistence control rather than runtime isolation [git-auth-output-codex-exec]{4} [git-auth-output-ghaw-architecture]{6}.
- **Domain allowlist as authorization.** It does not bind repository, operation, ref, or object transition and does not neutralize prompt injection [git-auth-policy-codex-internet-access]{3} [git-auth-policy-codex-internet-access]{5}.
- **Command-prefix approval such as `git push origin`.** Git destinations and refspecs have broader semantics than the string suggests [git-auth-policy-git-push]{1} [git-auth-policy-git-push]{2} [git-auth-policy-git-push]{4}.
- **Thin privileged host Git over the live repository.** Repository-controlled executable inputs cross the privilege boundary.
- **Silent fallback when sandboxing, confirmation UI, canonicalization, audit, or cleanup is unavailable.** Degraded state must deny, not reinterpret the model as trusted.

## Unresolved questions

1. Can the initial product scope use diff/commit handoff exclusively, including private-repository refresh, or is authenticated fetch during authoring independently required?
2. Which provider operations are required: fetch, one-branch fast-forward push, PR creation, tags, LFS, submodules, partial clone, signed pushes, or multiple remotes?
3. Can a provider API/library transport validate object reachability and atomically enforce expected-old-OID plus destination-ref updates without invoking Git over agent-controlled state?
4. Where will operator-owned repository identities and policy live, and how will immutable provider repository IDs be resolved without trusting repository remotes?
5. What constitutes model-observable space in Pi: tool results, shell output, process environment, `/proc`, mounted files, extension logs, TUI state, background-job logs, and crash diagnostics?
6. What UI surfaces can answer `ask`, and which headless/RPC/background contexts must deny?
7. Is a broker-private bare repository/object cache acceptable, and how are objects imported from the agent workspace without honoring live Git config, alternates, attributes, or hooks?
8. What local audit durability, tamper evidence, retention, and operator access are required?
9. How are cancellation, crash cleanup, token revocation, and audit completion tested under fail-closed conditions?
10. Does “no reusable credential” prohibit even a replayable session surrogate, or only upstream provider credentials? The recommended contract assumes any model-observable replayable authority is prohibited.

## Disconfirming analysis

The synthesis actively tested its preferred “decline or structured outside adapter” conclusion against the attested corpus:

- **Claude Code web disconfirms the claim that Git itself must move outside the sandbox.** Anthropic documents in-sandbox scoped credential translation while retaining the actual GitHub token behind a proxy [git-auth-exec-claude-cloud]{2}. This keeps architecture B viable. It does not establish single-use, endpoint binding, ref parsing, or repository-controlled Git sanitization.
- **Codespaces and Actions show that scoped authenticated authority inside a runtime is an accepted pattern for other threat models.** Codespaces makes ordinary authenticated Git available in an interactive environment [git-auth-cred-codespaces-git-auth]{1}; Actions persists readable authentication for later job scripts [git-auth-policy-actions-checkout]{2}. Neither pattern meets this engagement's stricter authority-non-reuse boundary.
- **OpenSSH forwarding disconfirms “secret bytes must enter the sandbox for ordinary Git.”** The private key remains outside [git-auth-cred-openssh-agent-forwarding]{4}. The forwarded capability can still authenticate repeatedly [git-auth-cred-openssh-agent-forwarding]{5}, so it does not meet the authority-non-reuse requirement.
- **Git's submodule defense qualifies the repository-code-execution argument.** Git refuses to copy tracked custom update commands into local config [git-auth-exec-git-submodules]{3}. The risk is surface-specific, not a claim that every repository setting executes code.
- **Structured transport has compatibility costs.** The `actions/checkout` REST fallback omits submodules and SSH-key checkout [git-auth-exec-actions-checkout]{7}. This weakens any claim that provider APIs are a drop-in replacement for Git.
- **SafeOutputs does not prove Git transport internals.** It establishes read-only authoring, typed requested writes, separate permissions, and gating [git-auth-output-ghaw-safe-outputs]{1} [git-auth-output-ghaw-architecture]{4}. The proposed Git adapter remains an inference.
- **Diff/PR handoff may be insufficient for private upstream synchronization or autonomous publication.** The corpus establishes the safety shape, not the product requirement. Those needs must be demonstrated before accepting additional authority.

Search outcome: no fetched source documents a complete public mechanism that simultaneously supports general authenticated Git, keeps all reusable authority out of model-observable space, enforces canonical endpoint and exact ref/OID policy, and neutralizes repository-controlled Git execution. The recommendation therefore composes attested controls rather than claiming to copy a proven proprietary implementation.

## Contradictions

| Relationship | Named source positions | Decision consequence |
|---|---|---|
| `tension` | **Claude Code web** places a scoped credential in the sandbox, translates it to the actual GitHub token, and documents current-branch pushes [git-auth-exec-claude-cloud]{2} [git-auth-exec-claude-cloud]{3}; **Codex cloud** removes configured secrets before the agent phase and documents a diff/PR handoff [git-auth-policy-codex-cloud-environments]{3} [git-auth-policy-codex-cloud-environments]{5}. | Do not smooth these into one “cloud-agent” pattern. Claude's scoped-capability exposure and replay properties remain unknown; Codex's fetched documentation leaves any separate platform-provisioned agent-phase Git authority unresolved. |
| `contradicts` within the authoring-secret frame | **Codex cloud** removes configured secrets before authoring [git-auth-policy-codex-cloud-environments]{5}; **Copilot cloud agent** exposes dedicated Agents secrets as environment variables to the agent and tools [git-auth-cred-github-copilot-secrets]{3} [git-auth-cred-github-copilot-secrets]{4}. | Vendor cloud execution does not imply a shared credential-isolation policy. |
| `incommensurable` | **Codespaces** supports ordinary authenticated Git in an interactive developer environment [git-auth-cred-codespaces-git-auth]{1}; **Copilot cloud agent** documents simple branch-constrained outcomes and says it cannot directly run Git commands [git-auth-cred-github-copilot-controls]{3} [git-auth-cred-github-copilot-controls]{4}. | These controls answer different threat models and cannot be ranked as implementations of one boundary. |
| `qualifies` | **Git hooks/config evidence** shows privileged execution surfaces [git-auth-exec-git-hooks]{6} [git-auth-exec-git-config-exec]{4}; **Git submodule initialization** refuses one tracked custom-command promotion for security [git-auth-exec-git-submodules]{3}. | Reject blanket claims that Git executes all repository content; still treat every privileged Git command as requiring a surface-specific hermeticity analysis. |
| `incommensurable` | **Codex ordinary exec** serializes aggregated command output for model consumption [git-auth-output-codex-exec]{4}; **Agentic Workflows SafeOutputs** passes typed requests to separate handlers [git-auth-output-ghaw-safe-outputs]{1} [git-auth-output-ghaw-safe-outputs]{4}. | Output truncation/redaction on a general shell channel is not equivalent to a structured privileged-actuation boundary. |
| `qualifies` | **Copilot hook files** are ephemeral at job end [git-auth-output-copilot-hooks]{1}; **Copilot commits** permanently link to session logs [git-auth-output-copilot-audit]{1}. | Runtime cleanup does not imply short-lived platform observability; audit and model transcript retention need separate policy. |
| `tension` | **Copilot cloud hooks documentation** records `GITHUB_COPILOT_GIT_TOKEN` inside the sandbox [git-auth-output-copilot-hooks]{1}; **Copilot controls documentation** says the agent cannot directly run `git push` or other Git commands and permits only simple-push outcomes [git-auth-cred-github-copilot-controls]{4}. | The claims can coexist, but the token's model observability and the enforcement seam for constraining its use remain unresolved. Do not infer a fully platform-mediated credential boundary from the operation limit alone. |

No contradiction is resolved by averaging the positions. They reflect different products, threat models, and execution surfaces.

## Consolidated source-bound acquisition candidates

### GitHub App security best practices

- **Urgency:** `enriching`
- **Source:** GitHub, *Best practices for creating a GitHub App*
- **Class:** `primary-doc`
- **Web availability:** public web documentation named by the fetched installation-token guide
- **Completes:** app private-key custody, rotation, installation-token handling, and least-permission controls for the proposed adapter
- **Grounding citation:** the installation-token guide directs readers to this security guidance [git-auth-policy-github-app-token]{6}.

### GitHub Actions OpenID Connect reference

- **Urgency:** `enriching`
- **Source:** GitHub, *OpenID Connect reference*
- **Class:** `primary-doc`
- **Web availability:** public web documentation named by the fetched OIDC overview
- **Completes:** token-request methods, claim formats, customization, and limits if workload identity is considered for adapter authentication
- **Grounding citation:** the fetched OIDC overview names this reference [git-auth-policy-github-oidc]{7}.

### Git configuration reference

- **Urgency:** `enriching`
- **Source:** Git project, `git-config(1)`
- **Class:** `primary-doc`
- **Web availability:** public upstream documentation cross-referenced by fetched Git documentation
- **Completes:** configuration precedence, protected configuration, includes, command overrides, credential helpers, transport rewriting, and the reset burden for any hermetic CLI broker
- **Grounding citation:** the fetched `git-push` documentation cross-references `git-config(1)` while describing configuration that changes push behavior [git-auth-policy-git-push]{8}.

### GitHub Agentic Workflows Threat Detection Guide

- **Urgency:** `enriching`
- **Source:** GitHub, *Agentic Workflows Threat Detection Guide*
- **Class:** `primary-doc`
- **Web availability:** public web documentation named by the fetched first-party architecture
- **Completes:** verdict failure, timeout, customization, and bypass semantics at the pre-actuation gate
- **Grounding citation:** the fetched architecture names the guide as its threat-analysis reference [git-auth-output-ghaw-architecture]{9}.

### GitHub Agentic Workflows Cross-Repository Operations

- **Urgency:** `enriching`
- **Source:** GitHub, *Agentic Workflows Cross-Repository Operations*
- **Class:** `primary-doc`
- **Web availability:** public web documentation named by the fetched Safe Outputs reference
- **Completes:** repository canonicalization, allowed-target enforcement, and credential scoping for structured cross-repository writes
- **Grounding citation:** the Safe Outputs reference names it as the comprehensive source for `target-repo`, `allowed-repos`, and cross-repository authentication [git-auth-output-ghaw-safe-outputs]{5}.

## Revisit if

- Anthropic publishes the Claude Code web proxy protocol, surrogate scope/lifetime/replay behavior, endpoint/ref enforcement seam, or Git hook/config sanitization.
- GitHub publishes Copilot cloud agent's Git credential transport and effective Git execution configuration.
- A provider offers a genuinely single-use, repository-and-ref-bound push-intent API or credential.
- Product requirements prove that diff/PR handoff is insufficient and identify exactly which authenticated operations are required.
- The host runtime can expose a capability channel proven unavailable to sandbox processes, `/proc`, environment, mounted paths, tool results, logs, and crash diagnostics.
- A selected provider/library transport can enforce expected-old-OID and destination-ref atomically and validate imported objects without reading agent-controlled Git state.
- Scope expands to SSH, LFS, submodules, partial clone, alternates, signed pushes, tags, deletion, force, or multi-ref atomic updates.
- Sandbox-disabled, headless confirmation, cancellation, or audit-retention semantics change.
- The threat model changes to accept a model-observable short-lived repository-scoped credential; Codespaces, Actions, and forwarded-agent patterns would then warrant reevaluation.

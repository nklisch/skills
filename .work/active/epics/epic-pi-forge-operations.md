---
id: epic-pi-forge-operations
kind: epic
stage: drafting
tags: [security, plugin, tooling]
parent: null
depends_on: [feature-pi-sandbox-credential-isolation-boundary]
release_binding: null
gate_origin: null
research_refs: [sandboxed-git-auth-patterns]
research_origin: sandboxed-git-auth-patterns
created: 2026-07-11
updated: 2026-07-11
---

# Pi forge operations

## Brief

Create a separate Pi-native forge-operations plugin that lets agents perform approved
remote actions against GitHub and Forgejo without receiving reusable credentials or an
arbitrary authenticated Git surface. This capability is intentionally outside
pi-sandbox: pi-sandbox proves credential isolation; forge-operations owns authentication,
semantic remote operations, operator policy, confirmation UX, and audit.

The operator's current posture is to let agents push branches, open or update pull
requests, and comment in discussions, but to ask before remote writes. Other adopters
must be able to configure each semantic operation as `auto`, `ask`, or `deny`, narrowed
by forge, repository, ref namespace, target object, and expected OIDs. Project-local
configuration may tighten operator policy but never expand it.

This epic is tracked now but is implementation-blocked on
`feature-pi-sandbox-credential-isolation-boundary`. It must ship as a **separate upstream
PR** after the current draft pi-sandbox `0.1.0` PR is completed. No forge implementation
belongs on the current pi-sandbox branch.

## Strategic decisions

- **Package boundary:** a new Pi-native plugin/package, separate from pi-sandbox and
  background-tasks.
- **Providers:** GitHub and Forgejo are the initial adapters; provider capabilities derive
  from a single registry so later forges can be added without changing policy semantics.
- **Tool surface:** typed semantic operations only. No arbitrary Git argv, remote URLs,
  credential helpers, SSH-agent forwarding, or privileged Git against agent-controlled
  repository state.
- **Authorization vocabulary:** `auto`, `ask`, and `deny` per operation. Any deny wins;
  any ask prevents automatic execution; auto requires every applicable operator/project
  layer to allow it.
- **Default operator posture:** remote writes such as push, PR creation/update, and
  discussion/issue comments default to `ask`; force-push, ref deletion, merge, and unknown
  operations default to `deny`. Adopters may choose stricter or more permissive global
  policy within the supported semantic constraints.
- **Headless behavior:** `ask` without an available confirmation UI resolves to `deny`.
- **Authentication:** GitHub uses just-in-time GitHub App installation tokens. Forgejo
  uses a dedicated bot/service account with a scoped application token and repository
  permissions. Long-lived credential material stays in operator-owned storage outside
  the workspace.
- **Credential boundary:** file-backed credentials load only after a compatible
  credential-isolation capability reports healthy. Pi-sandbox is the first provider of
  that capability, but the contract must permit other sandbox implementations.
- **Output boundary:** model-visible results are fixed structured records; raw transport,
  helper, API, and Git output never enters the transcript.
- **PR sequencing:** design and implementation occur on a later forge-specific branch and
  upstream PR, after the sandbox boundary contract lands.

## Initial capability envelope

The epic-design pass should decompose a focused first release around:

- registering global credential profiles and exact forge/repository identities;
- authenticated `fetch_refs` as an independent read permission when needed;
- pushing one exact branch transition using old/new OIDs;
- creating and updating pull requests;
- commenting on supported discussion, issue, and pull-request targets;
- GitHub App token mint/use/revoke lifecycle;
- Forgejo scoped-token lifecycle and repository permission checks;
- confirmation rendering over normalized intent;
- append-only, secret-free audit events;
- the sandbox/credential-isolation capability handshake;
- provider capability negotiation for operations unsupported by a forge.

Features such as arbitrary clone, SSH transport, LFS, submodule recursion, tags, releases,
force-push, ref deletion, merge, and multi-ref atomic updates are outside the initial
envelope unless epic-design proves one is load-bearing and gives it a separate semantic
contract.

## Acceptance criteria

- The forge plugin is independently installable and versioned, with no implementation
  code added to pi-sandbox.
- GitHub and Forgejo adapters implement the shared semantic-operation contract without
  exposing credentials to tool inputs, outputs, files under the project surface, or raw
  diagnostics.
- Operator-owned policy supports `auto` / `ask` / `deny` per operation and exact target
  restrictions; project policy can only narrow it.
- Default remote writes require confirmation; destructive and unknown operations deny.
- Approval binds to immutable normalized intent and becomes invalid if repository, target,
  ref, old/new OID, or content changes.
- GitHub App installation tokens are minted just in time and discarded or revoked after
  use; the App private key remains in protected operator storage.
- Forgejo authentication uses scoped application tokens rather than unscoped OAuth2
  tokens, with the bot account limited to approved repositories.
- `ask` fails closed in no-UI modes.
- Model-visible responses and persisted audit records contain no raw credentials or raw
  transport output.
- File-backed credential profiles refuse to load unless a compatible isolation provider
  reports a healthy boundary.
- The forge work lands through a separate branch and upstream PR after the sandbox
  prerequisite is done.

## Research grounding

**Source:** `.research/analysis/campaigns/sandboxed-git-auth-patterns/synthesis.md`
(slug: `sandboxed-git-auth-patterns`)

The research recommends a typed host-side provider/library adapter when authenticated
remote operations are required, rejects privileged Git over the live repository, and
separates authenticated fetch from mutation. The operator subsequently selected GitHub
App authentication, Forgejo scoped application tokens, and configurable per-operation
confirmation policy.

## Design

(to be filled by `epic-design` after the sandbox prerequisite is complete)

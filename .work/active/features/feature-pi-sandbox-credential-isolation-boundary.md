---
id: feature-pi-sandbox-credential-isolation-boundary
kind: feature
stage: drafting
tags: [security, sandbox, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_refs: [sandboxed-git-auth-patterns]
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Narrow pi-sandbox to a credential-isolation boundary

## Brief

Pi runs as `agent:agent` inside an operator-controlled VM, with `/home/agent/projects`
as its intended working surface. The VM is the primary host-security boundary. The
inner pi-sandbox boundary has a narrower job: keep credentials held by Pi's trusted
control plane unavailable to model-controlled commands and file tools running as the
same Unix user.

Reassess the current first-party bwrap implementation against Pi's existing
`@anthropic-ai/sandbox-runtime` example, Gondolin tool routing, and OpenShell posture.
Retain custom code only for demonstrated Pi-specific gaps. The resulting package
should be a small, reusable credential/process membrane rather than an expanding
general sandbox platform.

This feature replaces the earlier `feature-pi-sandbox-git-egress` direction.
Authenticated GitHub and Forgejo operations belong in a separate forge-operations
plugin and PR; pi-sandbox provides only the credential-isolation capability and a
non-secret health/capability handshake that another trusted extension can require.

## Strategic decisions

- **Outer boundary:** the VM owns host isolation and broad damage containment.
- **Inner boundary:** pi-sandbox separates Pi's credential-bearing control plane from
  model-run processes inside the VM.
- **Protected credentials:** Umans and OpenAI/Codex credentials in Pi provider storage,
  plus operator-owned GitHub and Forgejo credential material.
- **Working surface:** `/home/agent/projects` is the intended writable project surface.
- **Backend posture:** prefer an existing sandbox runtime or VM-routing primitive where
  it meets the contract; own bwrap policy code only where the upstream surfaces do not.
- **Package boundary:** no forge APIs, Git credential helper, privileged Git runner, or
  provider-specific remote-operation policy inside pi-sandbox.
- **Branch/release order:** complete this feature on the current draft pi-sandbox PR and
  keep `plugins/pi-sandbox/package.json` at `0.1.0` until that PR merges.

## Required boundary

The design must preserve or provide:

1. A separate PID namespace and private `/proc` for model-run shell commands, so they
   cannot inspect Pi's process environment.
2. A minimal child environment without provider tokens, forge tokens, authentication
   sockets, or credential-helper variables.
3. Read masking for credential-bearing paths, including Pi auth/session state, SSH/GPG
   material, GitHub CLI state, generic Git credential stores, and operator-configured
   Forgejo credential locations.
4. Equivalent enforcement in Pi's `read` tool, not only Bash mounts.
5. The same boundary for background and monitor commands.
6. Fail-closed behavior when the credential boundary cannot be established.
7. A writable-surface contract centered on the active project under
   `/home/agent/projects`, including the already-completed pinned Git-directory support
   for submodules and linked worktrees.
8. A non-secret capability/health signal that a separate forge-operations extension can
   require before loading file-backed credentials.

## Scope questions for design

- Can `@anthropic-ai/sandbox-runtime` replace the first-party mount/launch backend while
  retaining private `/proc`, minimal environment, file-tool parity, and fail-closed
  semantics?
- Would Gondolin routing materially simplify the inner boundary when Pi itself remains
  inside the outer VM, or does it add a redundant nested VM?
- Which existing general controls remain core, become optional defense-in-depth, or move
  out of pi-sandbox: tool-egress policy, secret-shape inspection, broad write policy, and
  future network filtering?
- What capability handshake can be consumed by other extensions without coupling them
  to pi-sandbox internals?
- How should an operator register additional credential paths, such as the selected
  Forgejo token store, without allowing project-local configuration to weaken policy?

## Acceptance criteria

- The implemented and documented threat model explicitly distinguishes the outer VM
  boundary from the inner credential-isolation boundary.
- Provider credentials and registered forge credential paths are unavailable through
  Bash, `read`, background, and monitor surfaces when protection is active.
- Sandbox children cannot read Pi's environment through `/proc` and receive only the
  declared minimal environment.
- Initialization and integration failures do not silently fall back to credential-visible
  command execution.
- The backend buy-versus-build decision is recorded with a concrete delta against Pi's
  sandbox-runtime, Gondolin, and OpenShell options.
- A forge extension can verify the credential boundary through a small stable capability
  contract without receiving secrets.
- Forge-specific operations and authentication policy are absent from pi-sandbox.
- `plugins/pi-sandbox/package.json` remains at `0.1.0` for the current draft PR.

## Research grounding

**Source:** `.research/analysis/campaigns/sandboxed-git-auth-patterns/synthesis.md`
(slug: `sandboxed-git-auth-patterns`)

The research rejects credentials in model-observable space and privileged host Git over
agent-controlled repository state. Subsequent operator clarification narrows the desired
sandbox posture to protecting Pi-held credentials inside an already-contained VM.

## Design

(to be filled by `feature-design`)

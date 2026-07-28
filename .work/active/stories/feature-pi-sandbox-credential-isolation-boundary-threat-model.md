---
id: feature-pi-sandbox-credential-isolation-boundary-threat-model
kind: story
stage: done
tags: [security, sandbox, plugin, documentation]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: [feature-pi-sandbox-credential-isolation-boundary-capability-handshake, feature-pi-sandbox-credential-isolation-boundary-credential-gap-closure]
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Threat model + buy-vs-build + controls triage documentation

## Scope

Implements **Unit 3** of `feature-pi-sandbox-credential-isolation-boundary`.
Prose/documentation deliverable carrying the feature's documentation acceptance
criteria. Depends on Units 1 + 2 so the documented handshake payload and scrub
list reflect final code.

## Unit(s)

`plugins/pi-sandbox/docs/THREAT_MODEL.md` (new) and
`plugins/pi-sandbox/README.md` (updated).

See the feature body's **Unit 3** for the full content outline and acceptance
criteria.

`docs/THREAT_MODEL.md` contains:
- Two-boundary threat model (outer VM vs inner credential-isolation).
- Protected credentials + where each is masked.
- Required-boundary matrix (8 points, status, where enforced).
- Buy-vs-build delta (srt v0.0.26 / Gondolin / OpenShell, with revisit triggers).
- General-controls triage (core / optional-defense-in-depth / deferred+tracked).
- Capability-handshake lifecycle contract plus the independent forge-owned
  credential-registration precondition.
- Credential-registration mechanism (global `denyRead`/`envScrub`, additive-only
  project config, and the global deny-list's all-or-nothing clear escape).
- Scope boundary (forge ops, Git credential helpers, privileged Git runners OUT).
- **Release scope (0.1.0) + post-0.1.0 / v1 path** — see below.

### Release scope (0.1.0) + post-0.1.0 / v1 path

The brief pins `plugins/pi-sandbox/package.json` at `0.1.0` until the draft
PR merges. There is currently no consolidated statement of what 0.1.0
promises and what v1 (or post-0.1.0) would entail — the promise is scattered
across README fragments, `sandbox-config.ts` comments, and the `filter`
backlog item. This section consolidates it in one place so a reviewer or the
release gate can check the package against its stated promise.

**0.1.0 (the draft-PR-release promise) — what the package claims:**

- Linux: mediated LLM/tool `bash` and interactive `user_bash` (`!`/`!!`) run
  through the first-party `bwrap` backend when the sandbox initializes.
- Fresh PID namespace + private `/proc` + minimal child env (no provider/forge
  tokens) for sandboxed bash.
- In-process `read`/`write`/`edit` enforce `denyRead`/`denyWrite`/`allowWrite`,
  holding even when bash is fail-closed or the OS sandbox is unavailable.
- Tool-egress policy (`tool_call` gate: allow / auto / confirm / block) for
  built-in and extension-registered tools.
- Secret-shape inspector (optional, opt-in) scans tool *input* in-process.
- Fail-closed behavior when the credential boundary cannot be established
  (missing bwrap, invalid config, deferred `filter` mode).
- Non-Linux graceful degrade: bash unsandboxed, in-process file/tool/egress/
  inspector policy still active.
- `background`/`monitor` integration with `@nklisch/pi-background-tasks` on
  Linux (same bwrap helper + minimal env + fail-closed spawn contract).
- Writable-surface contract + session-pinned git-dir discovery for submodules
  and linked worktrees.
- Non-secret capability handshake for a separate forge-operations extension
  (this feature).
- Additive-only project-local config; global/operator-only `bwrapPath` and
  `enabled:false`.
- Network modes `open` (default) and `block` only.

**0.1.0 (the draft-PR-release promise) — known gaps, documented plainly:**

- RPC/API mode's direct `bash` command is not mediated (pi core residual).
- TOCTOU symlink race in in-process file-tool path checks (bwrap is the
  stronger boundary for sandboxed bash).
- Secret inspector scans tool *input*, not *output*; `jobs action=tail` can
  return a secret a sandboxed background command wrote to its buffer.
- `--no-sandbox` does not propagate to the `background`/`monitor` integration.
- Git credential helpers, cache sockets, and keyring/keychain stores are not
  comprehensively blocked; operators register helper files/sockets or accept
  the residual.
- Non-Linux bash is unsandboxed (outer VM is the boundary there).
- `filter` network mode is recognized but fails closed (deferred).
- `--proc /proc` fails in containers with default seccomp (shared with srt;
  operator VM must clear at the environment level).

**Post-0.1.0 / v1 path (not a commitment — a direction, tracked as work):**

- Real `filter` network mode (tracked: `idea-pi-sandbox-filter-tcp-proxy`);
  needs its own topology and proof.
- Output inspection / shared redaction helper consumed by `background`/`monitor`/
  `jobs` (deferred beyond 0.1.0 in the README).
- `--no-sandbox` propagation to `background`/`monitor` integration.
- `fd`-based `openat` file-tool design to close the TOCTOU residual.
- pi core interception hook for RPC/API `bash` (unblocks mediating that path).
- Forge-operations plugin (separate, consumes the capability handshake) for
  authenticated forge operations under the research's typed-adapter contract.
- Reassessment of `@anthropic-ai/sandbox-runtime` adoption once srt reaches 1.x
  and closes its documented gaps (Issue #214, Issue #149) — revisit triggers
  recorded in the buy-vs-build delta.
- v1 (1.0.0) = the boundary is proven in production use across the operator's
  deployments, the documented gaps are closed or accepted-with-rationale, and
  the package's stated promise matches its behavior with no known security
  regressions. 1.0.0 is a maturity claim, not a feature target.

`README.md` updates:
- "Security boundary / non-goals": lead with two-boundary model (link THREAT_MODEL.md);
  buy-vs-build delta summary; controls triage table; capability-handshake contract +
  `/sandbox` capability line; credential registration via global `denyRead`/`envScrub`.
- Document `GITHUB_TOKEN`/`GH_TOKEN` in env-scrub coverage; document
  `~/.config/git/credentials`, `~/.gitconfig`, and `~/.config/git/config` in
  denyRead defaults; name helper/socket/keyring retrieval as a residual.

## Acceptance criteria

- [x] `docs/THREAT_MODEL.md` explicitly distinguishes the outer VM boundary from
  the inner credential-isolation boundary.
- [x] The buy-vs-build decision is recorded with a concrete delta against srt
  (v0.0.26), Gondolin, and OpenShell, with revisit triggers.
- [x] The general-controls triage (core / optional / deferred) is documented.
- [x] The capability-handshake contract for forge consumers is documented
  (payload, consumer rule, non-contents).
- [x] The credential-registration mechanism (global `denyRead`/`envScrub`,
  additive-only project merge, and global deny-list clear semantics) is
  documented.
- [x] README "Security boundary / non-goals" references the threat model and
  reflects the closed gaps.
- [x] Forge-specific operations and authentication policy are documented as
  absent from pi-sandbox.
- [x] A consolidated **Release scope (0.1.0)** + **post-0.1.0 / v1 path** section
  is present in `docs/THREAT_MODEL.md`, listing what 0.1.0 claims, its known
  documented gaps, and the post-0.1.0 direction (tracked as work, not a
  commitment). This is the single source a reviewer or release gate checks
  the package version against.

## Implementation notes

- Created `plugins/pi-sandbox/docs/THREAT_MODEL.md` as the dated, canonical
  0.1.0 posture statement: it distinguishes the operator VM from the inner
  credential boundary; maps protected credentials and all eight required
  boundary points to code; records the srt v0.0.26/Gondolin/OpenShell decision
  and revisit triggers; documents control triage, capability handshake,
  credential registration, explicit forge exclusions, known residuals, and the
  tracked post-0.1.0/v1 direction.
- Updated `plugins/pi-sandbox/README.md` to lead the security section with the
  two-boundary model and threat-model link; summarize the backend decision and
  control triage; document credential registration, the capability line in
  `/sandbox`, and the absence of forge operations.
- Review rework narrowed `active:true` to an initialized/not-fail-closed
  bash/file-tool lifecycle claim and made the forge credential registration
  check an independent precondition. The docs enumerate what `active` cannot
  prove rather than implying it is safe-to-load attestation.
- Reclassified required-boundary #3 as met for file-backed stores, with
  helpers/sockets/keyrings operator-registered or outside 0.1.0. Added user Git
  config defaults and the preserved-`HOME` / `git credential fill` residual to
  the protected-material table, README non-goals, and canonical known-gaps list.
- Documented the exact global deny-list merge: non-empty unions with defaults;
  empty clears all; selective global removal is unavailable. Both docs carry
  the complete copyable default list and explain project-local re-addition.
- Re-verified every acceptance criterion by reading THREAT_MODEL and README in
  context and checking concrete config claims against `sandbox-config.ts`.
- Bundle-final `bun test plugins/pi-sandbox/extensions/` result: 227 pass / 1
  fail across 228 tests. The sole failure is the known environment-fragile PID
  namespace `/proc` assertion tracked in
  `idea-pi-sandbox-pid-namespace-test-root-cause`; all capability and credential
  rework tests pass, and no test was weakened.

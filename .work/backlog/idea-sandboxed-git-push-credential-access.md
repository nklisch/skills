---
id: idea-sandboxed-git-push-credential-access
created: 2026-07-10
updated: 2026-07-11
tags: [security, sandbox]
---

# Sandboxed git push: credential access without exfiltration

## The problem

The pi-sandbox correctly masks credential files (`~/.git-credentials`,
`~/.ssh`, `~/.config/gh`, `~/.pi/agent/auth.json`) inside bwrap via `denyRead`
(`--ro-bind /dev/null` for files, tmpfs for dirs). This prevents the agent from
exfiltrating credentials. But it also means **any `git push` the agent runs
through the sandboxed bash tool fails** — `git` reads `~/.git-credentials`
(via the `credential.helper=store` helper) and sees `/dev/null`, so it has no
credential to authenticate with.

This surfaced concretely: the `bump-version.sh` script (and any agent-initiated
`git push`) runs through the sandboxed bash tool → bwrap → credential store reads
`/dev/null` → push fails. The host file is real and valid
(`-rw------- agent:agent`), but the sandbox deliberately hides it.

The design intent — "block the credentials but not stop the agents from
authenticating" — is achieved for **provider auth** (pi's orchestrator runs
outside bwrap and reads `~/.pi/agent/auth.json` directly), but there is **no
equivalent for git push**: there is no sandboxed-but-credentialed path for git
operations. The credential is either fully visible (unsandboxed, unsafe) or
fully masked (sandboxed, can't auth).

## Would `gh` auth have helped?

**No, not as-is.** `gh` stores its token in `~/.config/gh/hosts.yml`, which is
already in `denyRead` (and `denyWrite`). `gh` sets up a git credential helper
that shells out to `gh auth git-credential`, which reads that file — so a
sandboxed `git push` using `gh`'s helper hits the same masking wall. Switching
the credential source from `store` (`~/.git-credentials`) to `gh`
(`~/.config/gh/hosts.yml`) just moves the masked file; it doesn't solve the
access-without-exfiltration problem.

`gh` would only help if paired with one of the mechanisms below that gives
sandboxed git a way to authenticate without the agent seeing raw token material.

## Candidate approaches (for a future design pass)

1. **SSH agent forwarding.** Provision an `SSH_AUTH_SOCK` on the host and allow
   it through `buildMinimalEnv` (currently strips everything except
   `PATH/HOME/TERM/LANG/LC_*/TMPDIR`). The agent can use the agent socket to
   authenticate without ever seeing the private key. Requires: host provisioning
   of an ssh-agent with the key loaded, and a sandbox config/code change to pass
   `SSH_AUTH_SOCK` through (plus ensuring the socket path isn't masked in
   `network.mode=block`, which currently tmpfs-overlays `/tmp` and `/run`).
2. **A pi-native git-push helper.** A small pi command (running in pi's
   unsandboxed orchestrator process) that performs the push using the host
   credential, invoked as a pi tool rather than through sandboxed bash. The agent
   never touches the credential.
3. **A scoped, repo-limited deploy key or fine-grained PAT** stored in a
   non-denied location with `write` scope only to the target repo. Weaker — it's
   still a static secret the agent could read and exfiltrate, so it trades
   safety for convenience. Only acceptable for low-sensitivity setups.

## RESEARCH FINDING (2026-07-10): pi.exec + custom tool is the clean answer

Investigation of pi's extension API (`docs/extensions.md`) found that **the
right mechanism already exists in pi core — no sandbox change and no secondary
extension needed for the credential-access part.**

### The key fact

Extensions run in **pi's unsandboxed orchestrator process**, and `pi.exec(cmd,
args)` executes a shell command in that process — **outside bwrap**. The pi
security doc (`docs/security.md`) confirms: "Pi does not include a built-in
sandbox... Extensions are TypeScript modules that run with the same permissions"
as pi. The pi-sandbox extension only hardens the *tool-registry `bash`* path and
the *`user_bash`* path; `pi.exec` is a separate, unsandboxed execution surface
that extensions can use directly.

This means an extension can:
- register a custom tool (e.g. `git_push`) whose `execute` runs in pi's
  unsandboxed process,
- call `pi.exec("git", ["push", ...])` from inside it,
- and git will read `~/.git-credentials` / `~/.config/gh` / SSH config normally,
  because the process is not inside bwrap.

The agent invokes the tool; the tool performs the push; the agent never sees the
credential. This is exactly the "authenticated but sandboxed" path that was
missing, and it needs **no change to pi-sandbox** — the sandbox correctly leaves
`pi.exec` alone (it's not the `bash` tool).

### Existing precedent

pi ships examples that do git from the unsandboxed extension process via
`pi.exec`: `git-merge-and-resolve.ts` (fetch + merge), `git-checkpoint.ts`
(stash on turns), `auto-commit-on-exit.ts` (commit on shutdown). A `git_push`
tool follows the same pattern.

### What this means for the three candidate approaches

- **Approach 2 (pi-native git-push helper) is now the recommended path**, and
  it's cheaper than expected: it's a small extension that wraps `pi.exec("git",
  ["push", ...])` as a custom tool, not a sandbox change. The sandbox needs no
  modification — its job is to deny the *agent* direct credential access, and
  `pi.exec` is the deliberate escape hatch for trusted extension code.
- **Approach 1 (SSH agent forwarding)** is still viable but now less necessary —
  it requires a sandbox code change (`buildMinimalEnv` to pass `SSH_AUTH_SOCK`)
  AND host provisioning, whereas the `pi.exec` tool needs neither.
- **Approach 3 (scoped PAT)** remains the weakest option.

### Open design questions for the scope pass

- Should the tool be a general `git_push` (any ref) or scoped (e.g. only the
  current branch, only to `origin`)? Scoping reduces blast radius if the agent is
  prompt-injected into pushing somewhere unintended.
- Should it require user confirmation (`ctx.ui.confirm`) before pushing, since
  it bypasses the sandbox? The `tool_call` egress gate could `confirm` it.
- **RESOLVED (2026-07-10):** It belongs IN pi-sandbox as a module. The denial
  creates the chokepoint; the egress gate is already pi-sandbox's; the config is
  coherent; the output-scrubbing gap is pi-sandbox's. See DESIGN DIRECTION below.
- Does `bump-version.sh`'s auto-push step get reworked to call the tool instead
  of `git push` through sandboxed bash?

### DESIGN DIRECTION (2026-07-10): operator-tuned config scoping, module of pi-sandbox

The behavioral scoping (current-branch/origin-only) must NOT be hardcoded — it
is an operator configuration surface, matching how the sandbox itself lets the
operator tune `denyRead`/`denyWrite`/`allowWrite` to their risk appetite.

**Config dimensions** (operator picks a point on the spectrum):
- allowed subcommands (push/fetch/pull/clone — the *network* git ops; local ops
  like add/commit/status work through sandboxed bash already, especially after
  the gitdir fix)
- allowed remotes (any configured vs `origin` only)
- ref scope (any ref vs current branch only)
- confirmation (always / push-only / never)

**Two layered controls:**
1. Config scoping (primary) — the tool reads its own config and rejects
   out-of-policy ops *before* calling `pi.exec`. An operator who sets
   `allowedRemotes: ["origin"]` makes `git push fork` fail at the tool.
2. `tool_call` `confirm` (backstop) — the sandbox egress gate fires for the tool
   regardless; `confirm` gives a human veto per call. Catches in-policy args with
   suspicious intent.

**Where it lives:** INSIDE pi-sandbox, as a module/subsystem of the
extension — NOT a standalone extension. The credential masking (denial) creates
the chokepoint that makes the egress path necessary; the `tool_call` egress
gate the tool uses is already pi-sandbox's mechanism; the config namespace
(`denyRead`/`allowWrite` for denial, `gitEgress.*` for privileged egress) is
coherent as one operator posture; and the output-scrubbing requirement is the
sandbox's own input-only-inspector gap to close. The earlier "standalone"
recommendation was wrong — it would split one mediation system (deny +
permit-and-scope) across two extensions that both touch the same `tool_call`
event for the same concern. pi-sandbox's contract is broader than pure denial:
its `allowWrite` already does positive grants, and a git-egress tool is the same
permit-and-scope shape for what credential masking withholds.

**Implementation note for design pass:** the inspector scans tool *input*, not
*output* (documented sandbox gap). The tool must scrub/summarize git output
rather than pipe raw stderr/stdout back, so a credential that appears in git
output is not exfiltrated to the agent.

### DIAL-FORCES-ARCHITECTURE FINDING (2026-07-10)\n
The desired per-command-type dial (`push: ask, fetch: auto, clone: deny`) is the
load-bearing design decision, and it forces the architecture.

**The dial is keyed by command type (push/fetch/pull/clone). A git credential
helper CANNOT see the command type** — the credential-helper protocol hands the
helper `protocol`, `host`, `path`, `username`, never the verb. `git push` and
`git fetch` to the same remote produce identical credential requests. So a
credential-helper-based design can scope by remote and enforce ask/deny at the
auth layer, but CANNOT implement a command-type dial.

**Therefore the tool must be the execution surface** (it sees its own args,
including the command type), with the dial checked in `execute` before running:
- `auto` → check command type + remote/ref constraints against config; if
  in-policy, run `pi.exec("git", [...])` outside bwrap, scrub output, return
  summary. No prompt.
- `ask` → same, but `ctx.ui.confirm` first.
- `deny` → tool refuses; git never runs.

The extension is the **gate + runner** (mechanism B), NOT the credential helper
(mechanism A). Git authenticates via the host's existing helper (`store`/`gh`/
ssh-agent) — the extension runs git *where that helper works* (outside bwrap via
`pi.exec`), it doesn't replace the helper.

**Trust-model clarification:** the credential crosses OUT of bwrap into pi's
unsandboxed process (git runs there). The boundary that holds is *agent-
observable-space* (tool input/output, transcript, readable files) — the
credential never enters that. It is NOT confined to the bwrap namespace. This is
fine (pi's process is trusted, the agent isn't) and is the point: the sandbox's
bash credential masking FUNNELS the agent to the tool (raw `git push` in bash
fails to auth), and the tool is the gate. Critically, there is NO credential
oracle left inside bwrap — which is the key property, because an in-bwrap
credential helper (mechanism A) would be an exfil vector the agent could poke
with `git credential fill`.

**Open design choice:** does the extension delegate auth to the host's existing
credential helper (recommended — simpler, reuses `store`/`gh`, extension owns
only policy), or self-provide the credential (reads token from extension config,
injects via `GIT_ASKPASS`; centralizes auth+policy in one namespace but
duplicates `store`/`gh` and adds credential-storage responsibility)?

## Context from the session that surfaced this

- Discovered while trying to push the `feature-pi-sandbox-gitdir-writable-surface`
  work. The push failed inside the sandbox; the host had valid credentials but
  the sandbox masked them.
- The sandbox code and config are correct for their stated goal (prevent
  exfiltration). The gap is the missing "authenticated but sandboxed" path for
  git, which is a host-provisioning + sandbox-design question, not a bug in the
  current sandbox.
- Related: `bump-version.sh` auto-pushes as its last step, so it hits this every
  time it runs inside a sandboxed session.

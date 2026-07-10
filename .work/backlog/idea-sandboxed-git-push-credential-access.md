---
id: idea-sandboxed-git-push-credential-access
created: 2026-07-10
updated: 2026-07-10
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

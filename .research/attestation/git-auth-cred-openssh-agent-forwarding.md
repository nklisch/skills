---
source_handle: git-auth-cred-openssh-agent-forwarding
fetched: 2026-07-10
source_url: https://man.openbsd.org/ssh_config#ForwardAgent
provenance: source-direct
substrate_confidence: source-direct
---

# OpenSSH ForwardAgent security semantics

## Summary

The OpenBSD `ssh_config` manual defines agent forwarding as forwarding a connection to the authentication agent through a Unix-domain socket or named socket path. It warns that a party able to bypass remote file permissions can access the local agent through that forwarded connection. Forwarding does not reveal private key material, but it does permit operations with loaded keys that can authenticate as the user.

## Key passages

{1} `ForwardAgent` controls whether the connection to the authentication agent is forwarded to the remote machine and defaults to `no`.

{2} The setting may name an explicit agent socket or an environment variable containing the socket path.

{3} The manual says agent forwarding should be enabled with caution because a remote user able to bypass socket file permissions can access the local agent through the forwarded connection.

{4} The attacker cannot extract key material from the agent.

{5} The attacker can nevertheless perform operations on loaded keys that enable authentication using those identities.

## Structural metadata

- Publisher: OpenBSD project
- Artifact type: public reference manual
- Subject: SSH agent-forwarding mechanism and threat boundary

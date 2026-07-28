---
source_handle: git-auth-cred-codex-secure-devcontainer
fetched: 2026-07-10
source_url: https://raw.githubusercontent.com/openai/codex/main/.devcontainer/devcontainer.secure.json
provenance: source-direct
substrate_confidence: source-direct
---

# OpenAI Codex secure devcontainer configuration

## Summary

The public Codex repository’s secure devcontainer profile combines an inner bubblewrap sandbox and outbound firewall with runtime-mounted user state. It creates persistent volumes for Codex home and GitHub CLI configuration, bind-mounts the host `.gitconfig` read-only, and forwards `OPENAI_API_KEY` from the host into the container’s remote environment. GitHub hosts are included in the default outbound allowlist. This is configuration source evidence for a convenience-oriented local container profile, not documentation that credentials are concealed from the Codex process.

## Key passages

{1} The profile mounts a persistent `codex-home` volume at `/home/vscode/.codex` and a persistent `codex-gh` volume at `/home/vscode/.config/gh`.

{2} It bind-mounts `${localEnv:HOME}/.gitconfig` into the container read-only, while setting `GIT_CONFIG_GLOBAL` to a separate container-local path.

{3} In `remoteEnv`, `OPENAI_API_KEY` is populated directly from the host’s `OPENAI_API_KEY` environment variable.

{4} The outbound allowlist includes `github.com`, `api.github.com`, `codeload.github.com`, `raw.githubusercontent.com`, and `objects.githubusercontent.com`.

{5} The profile requests elevated capabilities and relaxed outer seccomp/AppArmor settings so an inner bubblewrap sandbox and startup firewall can operate.

{6} Nothing in this configuration declares a credential broker, socket-mediated Git helper, token redaction boundary, or per-operation authorization prompt.

## Structural metadata

- Publisher: OpenAI (`openai/codex` public repository)
- Artifact type: public source-code/configuration evidence
- Subject: secure devcontainer mounts, environment forwarding, and network allowlist
- Evidence limitation: configuration inspection only; no runtime observation was performed

---
source_handle: git-auth-policy-codex-cloud-environments
fetched: 2026-07-10
source_url: https://developers.openai.com/codex/cloud/environments
provenance: source-direct
substrate_confidence: source-direct
---

# Codex cloud environments

## Summary

Codex cloud checks out a selected branch or commit into an isolated task container, runs operator-configured setup before the agent phase, and keeps agent internet access off by default. Environment secrets receive additional encryption, are decrypted only for task execution, are exposed only to setup scripts, and are removed before the agent phase. The completed task presents a diff and lets the user open a pull request rather than documenting direct model-initiated authenticated Git pushes.

## Key passages

1. **How Codex cloud tasks run.** Codex creates a container and checks out the repository at the selected branch or commit SHA, runs setup, applies internet policy, then runs the agent command loop.
2. **How Codex cloud tasks run.** Setup scripts have internet access; agent internet access is off by default but may be enabled with limited or unrestricted access.
3. **How Codex cloud tasks run.** At completion Codex shows its answer and diff; the user can open a pull request or request follow-up work.
4. **Environment variables and secrets.** Environment variables are available for the full task, including setup and agent phases.
5. **Environment variables and secrets.** Secrets are stored with an additional encryption layer, decrypted for task execution, available only to setup scripts, and removed before the agent phase for security.

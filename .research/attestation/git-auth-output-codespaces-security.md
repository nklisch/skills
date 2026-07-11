---
source_handle: git-auth-output-codespaces-security
fetched: 2026-07-10
source_url: https://github.com/github/docs/blob/f19a0135b2fe88a1ca17efbadb1d2bf14eb332b4/content/codespaces/reference/security-in-github-codespaces.md
provenance: source-direct
substrate_confidence: source-direct
---

# Security in GitHub Codespaces

## Summary

GitHub Codespaces provisions a fresh expiring GitHub token on create/restart and scopes it according to repository access, including read/write to the source repository or an automatically linked fork. This limits lifetime and authority. It does not hide credentials from code in the environment: development secrets are copied to environment variables and the documentation explicitly says a terminal can echo their values. Codespaces therefore provides a disconfirming hosted-sandbox case: ephemeral, scoped credentials reduce blast radius but are not a model-safe credential boundary if an agent can execute arbitrary terminal commands there.

## Key passages

### `Authentication`

Every create or restart assigns a new GitHub token with automatic expiry. Its scope depends on repository access: read/write for writers, clone-only then fork write access for readers who push, and explicit additional-repository scopes when authorized.

### `Using development environment secrets to access sensitive information`

The page says secrets are available as environment variables "including from the terminal" and gives `echo $SECRET_NAME` as a way to view a secret value. Values are recopied on create/resume and sync when changed. They are withheld when the user lacks write access to the repository.

### Lifecycle and network context

Codespaces are isolated from one another and block inbound internet connections, but outbound internet access is allowed. The ephemeral/expiring token posture therefore does not itself prevent a process from reading or transmitting credential material.

## Structural metadata

- Product: GitHub Codespaces
- Artifact type: first-party security documentation
- Revision: `f19a0135b2fe88a1ca17efbadb1d2bf14eb332b4`
- Relevant boundary: hosted development VM/container, not a dedicated coding-agent credential broker

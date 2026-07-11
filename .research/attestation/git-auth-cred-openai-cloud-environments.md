---
source_handle: git-auth-cred-openai-cloud-environments
fetched: 2026-07-10
source_url: https://learn.chatgpt.com/docs/environments/cloud-environment
provenance: source-direct
substrate_confidence: source-direct
---

# OpenAI Codex cloud environments

## Summary

OpenAI documents Codex cloud tasks as containerized, phased executions. A setup script runs before the agent loop and has internet access. Ordinary environment variables persist through setup and the agent phase. Values configured as secrets are decrypted for task execution but are available only to setup scripts and are removed before the agent phase. Setup and agent commands also run in separate Bash sessions, so a setup-script `export` does not itself persist. Container state may be cached, and changes to secrets invalidate the cache. Agent-phase internet access is off by default and outbound traffic passes through an HTTP/HTTPS proxy.

## Key passages

{1} Under “How Codex cloud tasks run,” the page orders execution as: create a container and check out the repository; run setup (and optional maintenance); apply internet settings; then run the agent command loop.

{2} Under “Environment variables and secrets,” environment variables are available for the full task, including setup and agent phases.

{3} The same section says secrets receive additional encryption, are decrypted only for task execution, are available only to setup scripts, and are removed before the agent phase for security reasons.

{4} Under “Manual setup,” setup scripts run in a separate Bash session, and exports do not persist into the agent phase unless deliberately written into persistent shell configuration or environment settings.

{5} Under “Container caching,” the service caches container state for up to 12 hours; changing environment variables or secrets automatically invalidates the cache.

{6} Under “Internet access and network proxy,” agent internet access is off by default, is configurable, and all outbound internet traffic passes through an HTTP/HTTPS proxy.

## Structural metadata

- Publisher: OpenAI
- Artifact type: public product documentation
- Subject: Codex cloud task lifecycle, environment variables, secrets, caching, and network mediation

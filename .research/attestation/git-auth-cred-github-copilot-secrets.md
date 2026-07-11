---
source_handle: git-auth-cred-github-copilot-secrets
fetched: 2026-07-10
source_url: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/configure-secrets-and-variables
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub Copilot cloud agent secrets and variables

## Summary

GitHub documents Copilot cloud agent as operating in an ephemeral GitHub Actions-powered development environment. Repository and organization administrators can provision a dedicated “Agents” class of secrets and variables. Most are exposed to Copilot as environment variables and are available to scripts and tools it runs. A special `COPILOT_MCP_` prefix changes the recipient: those values are available only to configured MCP servers. Secret values are masked in session logs. The agent does not inherit Actions, Codespaces, or Dependabot secrets.

## Key passages

{1} Under “About secrets and variables,” each delegated task runs in its own ephemeral development environment powered by GitHub Actions.

{2} The page says Agents secrets may grant access to private resources or configure MCP servers, while variables can configure scripts and tools the agent runs.

{3} Variables and secrets are exposed to Copilot as environment variables, except names prefixed `COPILOT_MCP_`, which are available only to MCP servers.

{4} Under “Using secrets and variables,” configured values are automatically available when the agent works on a repository task and are exposed as environment variables in its development environment.

{5} Secret values are masked in Copilot cloud agent session logs.

{6} Copilot cloud agent does not receive GitHub Actions, Codespaces, or Dependabot secrets and variables; only the dedicated Agents class is passed.

{7} Organization-level values can be restricted to all repositories, private repositories, or a selected repository set; a repository-level value overrides an organization-level value of the same name.

## Structural metadata

- Publisher: GitHub
- Artifact type: public product documentation
- Subject: Copilot cloud agent secret provisioning and visibility

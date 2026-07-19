---
source_handle: git-auth-cred-github-copilot-firewall
fetched: 2026-07-10
source_url: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-firewall
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub Copilot cloud agent firewall

## Summary

GitHub documents a default outbound firewall for Copilot cloud agent. Certain GitHub interaction hosts are always allowed and a recommended dependency-host allowlist is enabled by default. Blocked requests are reported with address and attempted command. GitHub explicitly limits the firewall’s claim: it covers processes started through the agent’s Bash tool inside the GitHub Actions appliance, not MCP servers or setup-step processes, and sophisticated bypass remains possible.

## Key passages

{1} Under “Overview,” internet access is limited by default to manage code and secret exfiltration risk.

{2} Hosts used for GitHub interaction are always allowed; a recommended allowlist additionally permits common dependency sources.

{3} A blocked request produces a warning that identifies the blocked address and command.

{4} Under “Limitations,” the firewall applies only to processes the agent starts through its Bash tool; it does not apply to MCP servers or processes launched in configured Copilot setup steps.

{5} The firewall operates only within the GitHub Actions appliance environment.

{6} GitHub states that sophisticated attacks may bypass it and that it is not a comprehensive security solution.

{7} Disabling the firewall permits connections to any host and increases exfiltration risk.

## Structural metadata

- Publisher: GitHub
- Artifact type: public product documentation
- Subject: cloud-agent network controls and explicit coverage limitations

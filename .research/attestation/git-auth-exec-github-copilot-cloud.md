---
source_handle: git-auth-exec-github-copilot-cloud
fetched: 2026-07-10
source_url: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

GitHub's Copilot cloud agent documentation places agent work in an ephemeral development environment powered by GitHub Actions. The agent creates changes on one branch, automates commits and pushes, and can open one pull request for a task. Repository rulesets and branch protections remain external enforcement points and can block the agent if incompatible. The public conceptual page does not specify whether authenticated Git is invoked directly by the model-facing process, through a separate broker, or through a platform service, nor does it document Git config and hook sanitization.

## Key passages

1. While working, Copilot cloud agent has its own ephemeral development environment powered by GitHub Actions, where it explores code, changes files, and executes tests and linters.
   - *Source anchor: `How Copilot cloud agent works`, environment description.*
2. Copilot cloud agent automates branch creation, commit message writing, and pushing.
   - *Source anchor: comparison of cloud agent with local coding assistant workflow.*
3. The agent works on one branch at a time and opens one pull request per assigned task.
   - *Source anchor: limitations section.*
4. Repository rulesets or branch protection rules can block the cloud agent when they are incompatible; the documentation gives commit-author restrictions as an example.
   - *Source anchor: limitations/rulesets paragraph.*

## Structural metadata

- **Publisher:** GitHub
- **Document:** About GitHub Copilot cloud agent
- **Effective fetched URL:** https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent
- **Source class:** public product documentation
- **Disclosure limit:** Git credential transport and local Git execution details are not described on the fetched page

---
source_handle: git-auth-cred-github-copilot-controls
fetched: 2026-07-10
source_url: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub Copilot cloud agent risks and mitigations

## Summary

GitHub describes Copilot cloud agent as autonomous, able to change repository code, and constrained by platform controls. Write initiation is limited to users with repository write access. The agent can push only to one designated branch, is subject to branch protections, and receives credentials constrained to simple push operations; GitHub explicitly says it cannot directly run `git push` or other Git commands. Pull requests require human review and workflows are held for approval by default. Internet restrictions mitigate sensitive-data leakage, but the platform acknowledges residual risks.

## Key passages

{1} The introduction says the cloud agent has repository code access and can push changes, creating risks for which GitHub supplies built-in mitigations.

{2} Under “Copilot cloud agent can push code changes,” only repository writers may trigger the agent, and input from users without write access is not presented to it.

{3} The agent can push only to the existing pull-request branch or a newly created `copilot/` branch and remains subject to branch protections and required checks.

{4} Under “Limits the agent’s credentials,” the page states that the agent can perform only simple push operations and cannot directly run `git push` or other Git commands.

{5} Draft pull requests require human review; the agent cannot mark them ready, approve them, or merge them.

{6} Under “Copilot cloud agent has access to sensitive information,” GitHub says the agent could leak code or other sensitive information and uses restricted internet access as mitigation.

{7} Session logs, signed commits, co-authorship, and audit-log events make work traceable.

## Structural metadata

- Publisher: GitHub
- Artifact type: public product documentation
- Subject: platform-mediated repository write capability and safety controls

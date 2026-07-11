---
source_handle: git-auth-exec-github-copilot-setup
fetched: 2026-07-10
source_url: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

GitHub documents a two-phase customization model for Copilot cloud agent. A repository-owned `.github/workflows/copilot-setup-steps.yml` runs as GitHub Actions before the agent starts. The setup job receives separately declared, least-privilege Actions permissions; GitHub's example says Copilot receives its own token for later operations. The setup workflow is only used when present on the default branch, constraining pull-request content from immediately changing the pre-agent privileged setup path. The page also recommends ephemeral, single-use self-hosted runners and says the integrated firewall must be disabled on self-hosted runners.

## Key passages

1. A repository can define `.github/workflows/copilot-setup-steps.yml`; its steps execute in GitHub Actions before Copilot begins work.
   - *Source anchor: `Customizing Copilot's development environment with Copilot setup steps`.*
2. The setup workflow does not trigger for agent setup unless it is present on the default branch.
   - *Source anchor: note immediately following the setup workflow description.*
3. GitHub's example directs authors to grant the setup job the lowest necessary permissions, says Copilot receives its own token for its operations, and grants `contents: read` only when setup must clone the repository.
   - *Source anchor: example workflow comments under `permissions`.*
4. If setup does not clone the repository, Copilot clones it automatically after setup completes.
   - *Source anchor: example workflow comments under `permissions`.*
5. GitHub recommends using Copilot cloud agent only with ephemeral, single-use self-hosted runners that are not reused across jobs.
   - *Source anchor: `Using self-hosted GitHub Actions runners`.*
6. The integrated firewall is incompatible with self-hosted runners and must be disabled for that mode.
   - *Source anchor: self-hosted runner prerequisites.*

## Structural metadata

- **Publisher:** GitHub
- **Document:** Customizing the development environment for Copilot cloud agent
- **Effective fetched URL:** as recorded in `source_url`
- **Source class:** public product and workflow documentation
